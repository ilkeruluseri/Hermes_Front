import { create } from 'zustand';
import { fetchFullRoute, completeStopRequest, saveRouteResult, requestBody } from '../services/routeService';

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
  _stopIdMap: {}, // original_stop_id → db_stop_id

  setSelectedCourier: (id) => set((state) => ({
    selectedCourierId: state.selectedCourierId === id ? null : id
  })),

  fetchData: async () => {
    // If we already successfully fetched data, don't refetch automatically
    if (get().hasFetched) return;

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

      // DB'ye kaydet, gerçek stop ID'lerini al
      const saved = await saveRouteResult(
        data.optimized_route || [],
        requestBody.depot_latitude,
        requestBody.depot_longitude
      );
      const stopIdMap = {};
      saved.vehicle_routes.forEach(vr => {
        vr.stops.forEach(s => {
          stopIdMap[s.original_stop_id] = s.db_stop_id;
        });
      });

      set({
        routes: parsedRoutes,
        couriers: parsedCouriers,
        packages: parsedPackages,
        routeSummary: data.route_summary || null,
        explanation: data.explanation || null,
        loading: false,
        hasFetched: true,
        _stopIdMap: stopIdMap
      });

    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startSimulation: () => {
    const { routes, _wsRef, isConnecting, wsConnected, _stopIdMap } = get();

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

      console.log("route: ", routes)
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
              stop_id: _stopIdMap[s.stop_id] ?? s.stop_id,
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
          let hasChanged = false;
          const patch = {};

          data.couriers.forEach(courier => {
            const existing = state.liveCouriers[courier.courier_id];
            const newLocation = [courier.longitude, courier.latitude];

            // Only update if position actually changed (avoid unnecessary re-renders)
            if (
              !existing ||
              existing.location?.[0] !== newLocation[0] ||
              existing.location?.[1] !== newLocation[1] ||
              existing.speed_kmh !== courier.speed_kmh
            ) {
              hasChanged = true;
              patch[courier.courier_id] = {
                ...existing,
                ...courier,
                location: newLocation
              };
            }
          });

          if (!hasChanged) return state; // No-op: skip re-render entirely

          return { liveCouriers: { ...state.liveCouriers, ...patch } };
        });
      }

      if (data.type === 'at_stop') {
        console.log(`Vehicle ${data.vehicle_id} arrived at stop ${data.stop_id}`);

        // Ensure we don't block the WebSocket listener while waiting for the HTTP response
        completeStopRequest(data.stop_id, data.delay_min || 0)
          .then((response) => {
            const { stop, reopt } = response;

            set((state) => {
              // 1. Update the stop status in the couriers array
              const updatedCouriers = state.couriers.map(courier => {
                if (courier.id === stop.vehicle_id) {
                  return {
                    ...courier,
                    stops: courier.stops.map(s =>
                      s.id === stop.id ? { ...s, status: 'completed' } : s
                    )
                  };
                }
                return courier;
              });

              // 2. Handle Re-optimization route swapping if triggered
              let updatedRoutes = state.routes;
              if (reopt.triggered && reopt.geometry) {
                console.log(`Re-optimization triggered for route ${stop.vehicle_id}!`);

                updatedRoutes = state.routes.map(route => {
                  if (route.vehicle_id === stop.vehicle_id) {
                    return {
                      ...route,
                      // Replace the old Mapbox GeoJSON with the new one
                      geometry: {
                        type: 'Feature',
                        geometry: reopt.geometry
                      },
                      naiveGeometry: reopt.previous_geometry ? {
                        type: 'Feature',
                        geometry: reopt.previous_geometry
                      } : route.naiveGeometry
                      // Optional: You can also map the reopt.new_sequence here to reorder stops
                    };
                  }
                  return route;
                });
              }

              return {
                couriers: updatedCouriers,
                routes: updatedRoutes,
                // You may also want to update the global `packages` array similarly to couriers
              };
            });
          })
          .catch((error) => {
            console.error("Failed to complete stop or re-optimize:", error);
          });
      }

      if (data.type === 'completed') {
        console.log("Simulation finished route (loop is false).");
      }
    };

    ws.onclose = () => {
      set({ wsConnected: false, isConnecting: false, _wsRef: null, liveCouriers: {} });
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

  // Optional escape hatch to force a refetch if needed (e.g. refresh button)
  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));
