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
        parsedRoutes = data.vehicle_routes.map((vr, index) => ({
          id: `route-${vr.vehicle_id}`,
          color: ROUTE_COLORS[index % ROUTE_COLORS.length],
          geometry: vr.geometry ? {
            type: 'Feature',
            geometry: vr.geometry
          } : null
        })).filter(r => r.geometry != null);

        // 2. Parse Couriers
        parsedCouriers = data.vehicle_routes.map((vr, index) => {
          const vehicleStops = (data.optimized_route || [])
            .filter(stop => stop.vehicle_id === vr.vehicle_id)
            .sort((a, b) => a.stop_sequence - b.stop_sequence);

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
  
  // Optional escape hatch to force a refetch if needed (e.g. refresh button)
  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));
