import { create } from 'zustand';
import { fetchFullRoute } from '../services/routeService';

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#aa3bff'];

export const useRouteStore = create((set, get) => ({
  hasFetched: false,
  loading: false,
  error: null,

  routes: [],
  couriers: [],
  packages: [],
  routeSummary: null,
  explanation: null,
  selectedCourierId: null,

  // Live State
  liveCouriers: {}, // Stored as a dictionary for fast O(1) updates
  wsConnected: false,
  _wsRef: null, // Keep a private reference to the WebSocket instance
  isConnecting: false,
  atStopEvent: null,
  isSkipping: false,
  reoptResult: null,
  reoptFlash: false,

  setSelectedCourier: (id) => set((state) => ({
    selectedCourierId: state.selectedCourierId === id ? null : id
  })),

  fetchData: async () => {
    // If we already successfully fetched data, don't refetch automatically
    if (get().hasFetched || get().loading) return;

    set({ loading: true, error: null });

    try {
      const data = await fetchFullRoute();

      let parsedRoutes = [];
      let parsedCouriers = [];
      let parsedPackages = [];

      // 1. Parse Routes for MapViewer
      if (data.vehicle_routes) {
        parsedRoutes = data.vehicle_routes.map((vr, index) => {
          let naiveGeometry = null;
          let currentPosition = null;
          let vehicleType = 'car';
          const vehicleTypes = ['car', 'truck', 'motorcycle'];

          if (vr.geometry && vr.geometry.coordinates && vr.geometry.coordinates.length > 0) {
            const coords = vr.geometry.coordinates;
            // Mock naive geometry as a straight line from first point to last point
            naiveGeometry = {
              type: 'LineString',
              coordinates: [coords[0], coords[coords.length - 1]]
            };

            // Mock current position somewhere in the middle of the route
            currentPosition = coords[Math.floor(coords.length / 2)];
            vehicleType = vehicleTypes[index % vehicleTypes.length];
          }

          return {
            id: `route-${vr.vehicle_id}`,
            vehicle_id: vr.vehicle_id,
            color: ROUTE_COLORS[index % ROUTE_COLORS.length],
            geometry: vr.geometry ? {
              type: 'Feature',
              geometry: vr.geometry
            } : null,
            naiveGeometry: naiveGeometry ? {
              type: 'Feature',
              geometry: naiveGeometry
            } : null,
            currentPosition,
            vehicleType,
            stops: (data.optimized_route || []).filter(stop => stop.vehicle_id === vr.vehicle_id)
          };
        }).filter(r => r.geometry != null);

        // 2. Parse Couriers
        parsedCouriers = data.vehicle_routes.map((vr, index) => {
          const vehicleStops = (data.optimized_route || [])
            .filter(stop => stop.vehicle_id === vr.vehicle_id)
            .sort((a, b) => a.stop_sequence - b.stop_sequence);

          // Mock optimization metrics
          const timeSavedMin = Math.floor(Math.random() * 45) + 15; // 15 to 60 mins
          const distanceSavedKm = (Math.random() * 10 + 2).toFixed(1); // 2.0 to 12.0 km
          const moneySaved = (distanceSavedKm * 1.5 + timeSavedMin * 0.5).toFixed(2); // Mock formula

          return {
            id: vr.vehicle_id,
            name: `Courier ${vr.vehicle_id}`,
            initials: `C${vr.vehicle_id}`,
            currentStatus: vr.high_risk_stop_count > 0 ? 'At Risk' : 'En Route',
            stopsRemaining: vr.stop_count,
            routeColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
            stops: vehicleStops,
            stats: {
              totalExpectedDelay: vr.total_expected_delay_min,
              severeStops: vr.severe_stop_count
            },
            optimizationMetrics: {
              timeSavedMin,
              distanceSavedKm,
              moneySaved
            }
          };
        });
      }

      // 3. Parse Packages (Global Manifest)
      if (data.optimized_route) {
        parsedPackages = data.optimized_route;
      }

      set({
        routes: parsedRoutes,
        couriers: parsedCouriers,
        packages: parsedPackages,
        routeSummary: data.route_summary || null,
        explanation: data.explanation || null,
        loading: false,
        hasFetched: true
      });

    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startSimulation: () => {
    const { routes, _wsRef, isConnecting, wsConnected } = get();

    // Safety check
    if (routes.length === 0) return;

    // SAFETY CHECK: If already connecting or connected, do nothing!
    if (isConnecting || wsConnected) return;

    // Mark as connecting so the UI can update
    set({ isConnecting: true });

    // Clean up any stale, dead sockets just in case
    if (_wsRef && _wsRef.readyState === WebSocket.OPEN) {
      _wsRef.close();
    }

    // Connect to the new simulation endpoint
    const ws = new WebSocket('wss://team-041.hackaton.sivas.edu.tr/ws/simulation');

    // 1. Send the config as soon as the connection opens
    ws.onopen = () => {
      set({ wsConnected: true, isConnecting: false });

      const configMsg = {
        vehicles: routes.map((route) => ({
          courier_id: `courier-${route.vehicle_id}`,
          name: `Courier ${route.vehicle_id}`,
          vehicle_id: route.vehicle_id,
          // Grab the raw coordinate array from your parsed geometry
          coordinates: route.geometry.geometry.coordinates,
          color: route.color,
          stops: (route.stops || [])
            .sort((a, b) => (a.optimized_position ?? 0) - (b.optimized_position ?? 0))
            .filter(s => s.latitude && s.longitude)
            .map(s => ({
              stop_id: String(s.stop_id ?? s.stop_sequence),
              lat: s.latitude,
              lon: s.longitude,
              dwell_seconds: 30
            }))
        })),
        speed_kmh: 60,
        loop: true
      };

      ws.send(JSON.stringify(configMsg));
    };

    // 2. Listen for the position updates
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'error') {
        console.error("Simulation error from server:", data.message);
      }

      if (data.type === 'started') {
        console.log(`Simulation started for ${data.vehicle_count} vehicles.`);
      }

      // The new backend sends an array of couriers inside "position_update"
      if (data.type === 'position_update') {
        set((state) => {
          const updatedCouriers = { ...state.liveCouriers };

          data.couriers.forEach(courier => {
            // Merge new data with existing data
            updatedCouriers[courier.courier_id] = {
              ...updatedCouriers[courier.courier_id],
              ...courier,
              // Normalize to a [lng, lat] array for your Map component
              location: [courier.longitude, courier.latitude]
            };
          });

          return { liveCouriers: updatedCouriers };
        });
      }

      if (data.type === 'completed') {
        console.log("Simulation finished route (loop is false).");
      }

      if (data.type === 'at_stop') {
        const { courier_id, stop_id } = data;
        set({ atStopEvent: { courier_id, stop_id } });

        const numericId = parseInt(stop_id, 10);
        if (!isNaN(numericId) && numericId > 0) {
          fetch(`https://team-041.hackaton.sivas.edu.tr/api/v1/stops/${numericId}/complete`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_delay_min: 0 })
          })
          .then(async res => {
            if (!res.ok) {
              if (res.status === 400) {
                set({ atStopEvent: null });
                return Promise.reject('skip');
              }
              return Promise.reject(res.status);
            }
            return res.json();
          })
          .then(result => {
            const reopt = result?.reopt;
            const vehicleId = parseInt(courier_id.replace('courier-', ''), 10);

            const completedStopId = result?.stop?.id;

            set(state => {
              const newRoutes = reopt?.geometry?.coordinates
                ? state.routes.map(r =>
                    r.vehicle_id === vehicleId
                      ? {
                          ...r,
                          previousGeometry: r.geometry,
                          geometry: { type: 'Feature', geometry: reopt.geometry },
                          geometryVersion: (r.geometryVersion || 0) + 1
                        }
                      : r
                  )
                : state.routes;

              const newCouriers = state.couriers.map(c => {
                if (c.id !== vehicleId) return c;
                const remainingStops = completedStopId
                  ? c.stops.filter(s => s.stop_id !== completedStopId)
                  : c.stops;
                const seqMap = reopt?.new_sequence?.length
                  ? Object.fromEntries(reopt.new_sequence.map((sid, idx) => [sid, idx]))
                  : null;
                const reorderedStops = seqMap
                  ? [...remainingStops].sort((a, b) => (seqMap[a.stop_id] ?? 999) - (seqMap[b.stop_id] ?? 999))
                  : remainingStops;
                return { ...c, stops: reorderedStops, stopsRemaining: reorderedStops.length };
              });

              return {
                reoptResult: reopt,
                reoptFlash: true,
                atStopEvent: null,
                routes: newRoutes,
                couriers: newCouriers,
                explanation: reopt?.reason ?? state.explanation,
              };
            });

            if (reopt?.geometry?.coordinates) {
              const wsRef = get()._wsRef;
              if (wsRef?.readyState === WebSocket.OPEN) {
                wsRef.send(JSON.stringify({
                  type: 'reroute',
                  courier_id,
                  coordinates: reopt.geometry.coordinates
                }));
              }
            }

            setTimeout(() => set({ reoptFlash: false }), 3000);
          })
          .catch(err => {
            if (err !== 'skip') console.warn('Re-opt skipped:', err);
            set({ atStopEvent: null });
          });
        }
      }
    };

    ws.onclose = () => {
      set({ wsConnected: false, isConnecting: false, isSkipping: false, _wsRef: null,
            liveCouriers: {}, atStopEvent: null, reoptResult: null, reoptFlash: false });
    };

    ws.onerror = (err) => {
      console.error('WS Error:', err);
      // Ensure we clear the loading state if it fails
      set({ isConnecting: false });
    };

    set({ _wsRef: ws });
  },

  stopSimulation: () => {
    const { _wsRef } = get();
    if (_wsRef) {
      // 0 = CONNECTING, 1 = OPEN. Only close if it's actually open!
      if (_wsRef.readyState === WebSocket.OPEN || _wsRef.readyState === WebSocket.CONNECTING) {
        _wsRef.close();
      }
    }
  },

  skipToNextStop: async () => {
    if (!get().wsConnected) return;
    set({ isSkipping: true });
    try {
      await fetch('https://team-041.hackaton.sivas.edu.tr/api/v1/simulation/next-stop', {
        method: 'POST'
      });
    } catch (err) {
      console.error('Skip failed:', err);
    } finally {
      set({ isSkipping: false });
    }
  },

  // Optional escape hatch to force a refetch if needed (e.g. refresh button)
  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));
