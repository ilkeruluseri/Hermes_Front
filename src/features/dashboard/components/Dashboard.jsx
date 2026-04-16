import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import MapViewer from './MapViewer';
import CourierList from './CourierList';
import PackageList from './PackageList';
import { fetchFullRoute } from '../../../services/routeService';

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#aa3bff'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [routes, setRoutes] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [routeSummary, setRouteSummary] = useState(null);
  const [explanation, setExplanation] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchFullRoute();

        // 1. Parse Routes for MapViewer
        if (data.vehicle_routes) {
          const parsedRoutes = data.vehicle_routes.map((vr, index) => ({
            id: `route-${vr.vehicle_id}`,
            color: ROUTE_COLORS[index % ROUTE_COLORS.length],
            geometry: vr.geometry ? {
              type: 'Feature',
              geometry: vr.geometry
            } : null
          })).filter(r => r.geometry != null);
          setRoutes(parsedRoutes);

          // 2. Parse Couriers
          const parsedCouriers = data.vehicle_routes.map((vr, index) => {
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
          setCouriers(parsedCouriers);
        }

        // 3. Parse Packages (Global Manifest)
        if (data.optimized_route) {
          setPackages(data.optimized_route);
        }

        // 4. Save Summary & Explanations
        setRouteSummary(data.route_summary);
        setExplanation(data.explanation);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container center-content">
        <div className="loader"></div>
        <p>Loading Optimization Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container center-content error-state">
        <p>Error loading data: {error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-page-header">
        <h1>Live Dispatch Map</h1>
      </header>

      <main className="dashboard-main">
        {/* Explanation Banner */}
        {explanation && explanation.overall_assessment && (
          <section className="dashboard-explanation glass-panel">
            <div className="explanation-header">
              <span className="ai-icon">✨</span>
              <h3>AI Assessment</h3>
            </div>
            <p>{explanation.overall_assessment}</p>
            {explanation.recommendations && explanation.recommendations.length > 0 && (
              <ul className="recommendations-list">
                {explanation.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Global KPIs */}
        {routeSummary && (
          <section className="dashboard-kpis">
            <div className="small-kpi-card">
              <span className="label">Overall Risk Score</span>
              <span className="value">{routeSummary.overall_risk_score}</span>
            </div>
            <div className="small-kpi-card">
              <span className="label">Total Expected Delay</span>
              <span className="value">{routeSummary.expected_total_delay_min} min</span>
            </div>
            <div className="small-kpi-card">
              <span className="label">Severe Stops</span>
              <span className="value text-danger">{routeSummary.severe_stop_count}</span>
            </div>
            <div className="small-kpi-card">
              <span className="label">VRP Status</span>
              <span className="value">{routeSummary.vrp_status}</span>
            </div>
          </section>
        )}

        <section className="dashboard-map-section">
          <MapViewer routes={routes} />
        </section>

        <section className="dashboard-couriers-section">
          <h2 className="section-title">Active Fleet</h2>
          <CourierList couriers={couriers} />
        </section>

        <section className="dashboard-packages-section">
          <h2 className="section-title">Global Manifest</h2>
          <PackageList packages={packages} />
        </section>
      </main>
    </div>
  );
}
