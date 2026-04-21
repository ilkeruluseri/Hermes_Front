import { create } from 'zustand';
import { fetchAutoDispatch, fetchCouriers, completeStopRequest, postSuggestionDecision, requestBody } from '../services/routeService';

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
  pendingSuggestions: {}, // Maps vehicleId -> suggestion data

  // Live State
  liveCouriers: {}, // Stored as a dictionary for fast O(1) updates
  _stopDelayMap: {}, // stop_id -> delay_min, generated at simulation start
  wsConnected: false,
  _wsRef: null, // Keep a private reference to the WebSocket instance
  isConnecting: false,
  isListenOnly: false,

  setSelectedCourier: (id) => set((state) => ({
    selectedCourierId: state.selectedCourierId === id ? null : id
  })),

  fetchData: async () => {
    // If we already successfully fetched data, don't refetch automatically
    if (get().hasFetched) return;

    set({ loading: true, error: null });

    try {
      const [data, couriersRaw] = await Promise.all([
        fetchAutoDispatch(),
        fetchCouriers().catch(() => []),
      ]);

      // Build vehicle_id (0-indexed) → {courierId, vehicle_type, name} map
      const courierById = {};
      (couriersRaw || []).forEach(c => { courierById[c.id ?? c.courier_id] = c; });
      const vehicleInfoMap = {};
      (requestBody.assignments || []).forEach((assignment, index) => {
        const courierInfo = courierById[assignment.courier_id] || {};
        vehicleInfoMap[index] = {
          courierId: assignment.courier_id,
          vehicle_type: courierInfo.vehicle_type || 'car',
          name: courierInfo.name || `Courier ${assignment.courier_id}`,
        };
      });

      let parsedRoutes = [];
      let parsedCouriers = [];
      let parsedPackages = [];

      // 1. Parse Routes for MapViewer
      if (data.vehicle_routes) {
        parsedRoutes = data.vehicle_routes.map((vr, index) => {
          let naiveGeometry = null;
          let currentPosition = null;
          const info = vehicleInfoMap[index] || {};
          const vehicleType = info.vehicle_type || 'car';

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
            vehicle_id: info.courierId ?? vr.vehicle_id,
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
            stops: (data.optimized_route || [])
              .filter(stop => stop.vehicle_id === vr.vehicle_id)
              .sort((a, b) => {
                if (vr.stop_names) {
                  const idxA = vr.stop_names.indexOf(a.stop_name);
                  const idxB = vr.stop_names.indexOf(b.stop_name);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                }
                return a.stop_sequence - b.stop_sequence;
              })
          };
        }).filter(r => r.geometry != null);

        // 2. Parse Couriers
        parsedCouriers = data.vehicle_routes.map((vr, index) => {
          const vehicleStops = (data.optimized_route || [])
            .filter(stop => stop.vehicle_id === vr.vehicle_id)
            .sort((a, b) => {
              if (vr.stop_names) {
                const idxA = vr.stop_names.indexOf(a.stop_name);
                const idxB = vr.stop_names.indexOf(b.stop_name);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              }
              return a.stop_sequence - b.stop_sequence;
            });

          // Mock optimization metrics
          const timeSavedMin = Math.floor(Math.random() * 45) + 15; // 15 to 60 mins
          const distanceSavedKm = (Math.random() * 10 + 2).toFixed(1); // 2.0 to 12.0 km
          const moneySaved = (distanceSavedKm * 1.5 + timeSavedMin * 0.5).toFixed(2); // Mock formula

          const courierInfo = vehicleInfoMap[index] || {};
          const courierId = courierInfo.courierId ?? vr.vehicle_id;
          return {
            id: courierId,
            name: courierInfo.name || `Courier ${courierId}`,
            initials: `C${courierId}`,
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
        hasFetched: true,
      });

    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startSimulation: async (listenOnly = false) => {
    const { isConnecting, wsConnected, isListenOnly, _wsRef } = get();

    // If already in listen-only mode and a real simulation is requested, close and restart
    if (!listenOnly && wsConnected && isListenOnly) {
      if (_wsRef) _wsRef.onclose = null; // prevent onclose from resetting isConnecting
      if (_wsRef?.readyState === WebSocket.OPEN) _wsRef.close();
      set({ wsConnected: false, isConnecting: true, _wsRef: null }); // isConnecting:true blocks useCourierWebSocket re-trigger
    } else if (isConnecting || wsConnected) {
      // SAFETY CHECK: If already connecting or connected with real sim, do nothing!
      return;
    }

    // Only fetch if data hasn't been loaded yet — avoids deleting and recreating stop IDs mid-simulation
    if (!listenOnly && !get().hasFetched) {
      await get().fetchData();
    }

    const { routes } = get();

    // Safety check
    if (routes.length === 0) return;

    // Mark as connecting so the UI can update
    set({ isConnecting: true });

    // Clean up any stale, dead sockets just in case
    if (_wsRef && _wsRef.readyState === WebSocket.OPEN) {
      _wsRef.close();
    }

    // Connect to the new simulation endpoint
    const ws = new WebSocket('wss://team-041.hackaton.sivas.edu.tr/ws/simulation');

    // 1. Send the config as soon as the connection opens (if not listen-only)
    ws.onopen = () => {
      set({ wsConnected: true, isConnecting: false, isListenOnly: listenOnly });

      if (!listenOnly) {
        console.log("route: ", routes)

        // Build delay map from optimized_route expected_delay_min values
        const { packages } = get();
        const stopDelayMap = {};
        (packages || []).forEach(stop => {
          stopDelayMap[String(stop.stop_id)] = stop.expected_delay_min ?? 0;
        });
        set({ _stopDelayMap: stopDelayMap });

        const configMsg = {
          vehicles: routes.map((route) => ({
            courier_id: `courier-${route.vehicle_id}`,
            name: `Courier ${route.vehicle_id}`,
            vehicle_id: route.vehicle_id,
            coordinates: route.geometry.geometry.coordinates,
            color: route.color,
            stops: (route.stops || [])
              .filter(s => s.latitude && s.longitude)
              .map(s => ({
                stop_id: s.stop_id,
                lat: s.latitude,
                lon: s.longitude,
                dwell_seconds: 30,
                delay_min: stopDelayMap[String(s.stop_id)] ?? 0
              }))
          })),
          speed_kmh: 60,
          loop: true
        };

        ws.send(JSON.stringify(configMsg));
      } else {
        console.log("Connected to simulation in listen-only mode.");
      }
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

      // Helper: apply a couriers array into liveCouriers (used by both message types below)
      const applyCouriersUpdate = (couriers) => {
        set((state) => {
          let hasChanged = false;
          const patch = {};

          couriers.forEach(courier => {
            const existing = state.liveCouriers[courier.courier_id];
            const newLocation = [courier.longitude, courier.latitude];

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

          if (!hasChanged) return state;
          return { liveCouriers: { ...state.liveCouriers, ...patch } };
        });
      };

      // Sent once on first connect — renders current courier positions immediately
      // without waiting for the next position_update tick.
      if (data.type === 'sim_state') {
        console.log(`[sim_state] running=${data.running}, couriers=${data.couriers?.length}`);
        if (data.couriers?.length) {
          applyCouriersUpdate(data.couriers);
        }
      }

      // The backend sends an array of couriers inside "position_update"
      if (data.type === 'position_update') {
        if (data.couriers?.length) {
          applyCouriersUpdate(data.couriers);
        }
      }

      if (data.type === 'at_stop') {
        // Parse numeric vehicleId from "courier-0" → 0, "courier-1" → 1, etc.
        const vehicleId = parseInt(data.courier_id.replace('courier-', ''), 10);
        console.log(`Vehicle ${vehicleId} arrived at stop ${data.stop_id}`);

        // Guard: stop_id must exist in current route state (stale simulation events cause 404)
        const currentRoutes = get().routes;
        const vehicleRoute = currentRoutes.find(r => r.vehicle_id === vehicleId);
        const stopExists = vehicleRoute?.stops?.some(s => String(s.stop_id) === String(data.stop_id));
        if (!stopExists) {
          console.warn(`Stop ${data.stop_id} not in current route for vehicle ${vehicleId} — skipping (stale event)`);
          return;
        }

        const delayMin = get()._stopDelayMap[String(data.stop_id)] ?? data.delay_min ?? null;
        completeStopRequest(data.stop_id, delayMin)
          .then((response) => {
            const { stop, reopt } = response;

            set((state) => {
              // 1. Mark the completed stop.
              const updatedCouriers = state.couriers.map(courier => {
                if (courier.id === vehicleId) {
                  const completedStops = courier.stops.map(s =>
                    String(s.stop_id) === String(stop.id) ? { ...s, status: 'completed' } : s
                  );
                  const remainingCount = completedStops.filter(s => s.status !== 'completed').length;
                  return { ...courier, stops: completedStops, stopsRemaining: remainingCount };
                }
                return courier;
              });

              // 2. Handle Re-optimization Suggestion
              let newPendingSuggestions = { ...state.pendingSuggestions };
              if (reopt?.triggered && reopt.suggestion_id) {
                console.log(`Re-optimization suggestion generated for vehicle ${vehicleId}`);
                const currentRoute = state.routes.find(r => String(r.vehicle_id) === String(vehicleId));
                const prevGeom = currentRoute?.geometry?.geometry ?? currentRoute?.geometry ?? null;
                // Normalize to raw geometry (not Feature) so MapViewer can wrap consistently
                const toRawGeom = (g) => (g?.type === 'Feature' ? g.geometry : g) ?? null;
                newPendingSuggestions[vehicleId] = {
                  ...reopt,
                  vehicleId,
                  previous_geometry: toRawGeom(reopt.previous_geometry ?? prevGeom),
                  geometry: toRawGeom(reopt.geometry),
                };
              }

              // 3. Recompute routeSummary from remaining (non-completed) stops
              let updatedRouteSummary = state.routeSummary;
              if (state.routeSummary) {
                if (response.route_summary) {
                  updatedRouteSummary = response.route_summary;
                } else {
                  const allStops = updatedCouriers.flatMap(c => c.stops);
                  const pendingStops = allStops.filter(s => s.status !== 'completed');
                  const newDelay = pendingStops.reduce((sum, s) => sum + (s.expected_delay_min || 0), 0);
                  const newSevere = pendingStops.filter(s => s.risk_level === 'severe' || s.risk_level === 'high').length;
                  updatedRouteSummary = {
                    ...state.routeSummary,
                    expected_total_delay_min: Math.round(newDelay * 10) / 10,
                    severe_stop_count: newSevere,
                  };
                }
              }

              return { couriers: updatedCouriers, pendingSuggestions: newPendingSuggestions, routeSummary: updatedRouteSummary };
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

  handleSuggestionDecision: async (vehicleId, suggestionId, action) => {
    const suggestion = get().pendingSuggestions[vehicleId];
    if (!suggestion) return;

    try {
      // Use route_id from the reopt response, not vehicleId
      const decisionResponse = await postSuggestionDecision(suggestion.route_id, suggestionId, action);
      console.log('[decision response]', action, JSON.stringify(decisionResponse));

      // Compute accepted geometry and reordered stops before set() so we can use them for reroute
      let acceptedGeometry = null;
      let rerouteStops = null;

      if (action === 'accept') {
        acceptedGeometry = decisionResponse.geometry || suggestion.geometry;
        if (acceptedGeometry?.type === 'Feature') acceptedGeometry = acceptedGeometry.geometry;

        const newSeq = decisionResponse.new_sequence || suggestion.new_sequence;
        const currentCourier = get().couriers.find(c => c.id === vehicleId);
        if (currentCourier && newSeq?.length) {
          const remaining = currentCourier.stops.filter(s => s.status !== 'completed');
          const seqMap = new Map(newSeq.map((stopId, idx) => [String(stopId), idx]));
          rerouteStops = remaining
            .sort((a, b) => {
              const ia = seqMap.has(a.stop_id) ? seqMap.get(a.stop_id) : Infinity;
              const ib = seqMap.has(b.stop_id) ? seqMap.get(b.stop_id) : Infinity;
              return ia - ib;
            })
            .filter(s => s.latitude && s.longitude)
            .map(s => ({ stop_id: String(s.stop_id), lat: s.latitude, lon: s.longitude, dwell_seconds: 30 }));
        }
      }

      set((state) => {
        const newPendingSuggestions = { ...state.pendingSuggestions };
        delete newPendingSuggestions[vehicleId];

        const updatedRoutes = state.routes.map(route => {
          if (route.vehicle_id !== vehicleId) return route;

          if (action === 'accept' && acceptedGeometry) {
            return { ...route, geometry: { type: 'Feature', geometry: acceptedGeometry } };
          } else if (action === 'reject' && suggestion.previous_geometry) {
            return { ...route, geometry: { type: 'Feature', geometry: suggestion.previous_geometry } };
          }
          return route;
        });

        let updatedCouriers = state.couriers;
        if (action === 'accept' && rerouteStops) {
          updatedCouriers = state.couriers.map(courier => {
            if (courier.id !== vehicleId) return courier;
            const completedStops = courier.stops.filter(s => s.status === 'completed');
            return { ...courier, stops: [...completedStops, ...rerouteStops.map(s => {
              const orig = courier.stops.find(c => String(c.stop_id) === s.stop_id);
              return orig ?? s;
            })] };
          });
        }

        return { routes: updatedRoutes, couriers: updatedCouriers, pendingSuggestions: newPendingSuggestions };
      });

      // Fix 1: After accept, send reroute to simulation so vehicle continues on new geometry
      if (action === 'accept' && acceptedGeometry) {
        const ws = get()._wsRef;
        if (ws?.readyState === WebSocket.OPEN) {
          const rerouteMsg = {
            type: 'reroute',
            courier_id: `courier-${vehicleId}`,
            coordinates: acceptedGeometry.coordinates,
            ...(rerouteStops && { stops: rerouteStops }),
          };
          ws.send(JSON.stringify(rerouteMsg));
          console.log('[reroute sent]', rerouteMsg);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} suggestion:`, error);
      throw error;
    }
  },

  // Optional escape hatch to force a refetch if needed (e.g. refresh button)
  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));
