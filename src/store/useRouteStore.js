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
            vehicleType
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
  
  // Optional escape hatch to force a refetch if needed (e.g. refresh button)
  forceFetchData: async () => {
    set({ hasFetched: false });
    await get().fetchData();
  }
}));
