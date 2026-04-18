import { create } from 'zustand';
import { fetchFullRoute } from '../services/routeService';
import { simulationService } from '../services/simulationService';

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

  // Live State (Simulation)
  liveCouriers: {}, 
  simulationActive: false,
  isStarting: false,
  isStepping: false,

  setSelectedCourier: (id) => set((state) => ({
    selectedCourierId: state.selectedCourierId === id ? null : id
  })),

  fetchData: async () => {
    if (get().hasFetched) return;
    set({ loading: true, error: null });

    try {
      const data = await fetchFullRoute();

      let parsedRoutes = [];
      let parsedCouriers = [];

      if (data.vehicle_routes) {
        parsedRoutes = data.vehicle_routes.map((vr, index) => {
          let currentPosition = null;
          if (vr.geometry && vr.geometry.coordinates && vr.geometry.coordinates.length > 0) {
            currentPosition = vr.geometry.coordinates[0];
          }

          return {
            id: `route-${vr.vehicle_id}`,
            vehicle_id: vr.vehicle_id,
            color: ROUTE_COLORS[index % ROUTE_COLORS.length],
            geometry: vr.geometry ? { type: 'Feature', geometry: vr.geometry } : null,
            currentPosition,
            vehicleType: ['car', 'truck', 'motorcycle'][index % 3],
            stops: (data.optimized_route || []).filter(stop => stop.vehicle_id === vr.vehicle_id)
          };
        }).filter(r => r.geometry != null);

        parsedCouriers = data.vehicle_routes.map((vr, index) => ({
          id: vr.vehicle_id,
          name: `Courier ${vr.vehicle_id}`,
          initials: `C${vr.vehicle_id}`,
          currentStatus: vr.high_risk_stop_count > 0 ? 'At Risk' : 'En Route',
          stopsRemaining: vr.stop_count,
          routeColor: ROUTE_COLORS[index % ROUTE_COLORS.length],
          stops: (data.optimized_route || []).filter(stop => stop.vehicle_id === vr.vehicle_id)
        }));
      }

      set({
        routes: parsedRoutes,
        couriers: parsedCouriers,
        packages: data.optimized_route || [],
        routeSummary: data.route_summary || null,
        explanation: data.explanation || null,
        loading: false,
        hasFetched: true
      });

    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  startSimulation: async () => {
    const { routes } = get();
    if (routes.length === 0 || get().simulationActive) return;

    set({ isStarting: true, error: null });

    try {
      const payload = {
        vehicles: routes.map((r) => ({
          courier_id: `courier-${r.vehicle_id}`,
          name: `Courier ${r.vehicle_id}`,
          vehicle_id: r.vehicle_id,
          coordinates: r.geometry.geometry.coordinates,
          color: r.color
        })),
        speed_kmh: 60,
        loop: true
      };

      await simulationService.start(payload);
      set({ simulationActive: true, isStarting: false });
    } catch (err) {
      set({ error: err.message, isStarting: false });
    }
  },

  nextTimeStep: async () => {
    if (get().isStepping) return;
    set({ isStepping: true });

    try {
      const data = await simulationService.next();
      
      // Update positions
      if (data.type === 'position_update' && data.couriers) {
        set((state) => {
          const updatedLive = { ...state.liveCouriers };
          data.couriers.forEach(c => {
            updatedLive[c.courier_id] = {
              ...updatedLive[c.courier_id],
              ...c,
              location: [c.longitude, c.latitude]
            };
          });
          return { liveCouriers: updatedLive, isStepping: false };
        });
      } else {
        set({ isStepping: false });
      }
    } catch (err) {
      set({ error: err.message, isStepping: false });
    }
  },

  stopSimulation: async () => {
    try {
      await simulationService.stop();
    } catch (err) {
      console.error("Stop failed", err);
    } finally {
      set({ simulationActive: false, liveCouriers: {} });
    }
  },

  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));

