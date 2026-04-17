import React, { useEffect } from 'react';
import './Dashboard.css';
import MapViewer from './MapViewer';
import CourierList from './CourierList';
import PackageList from './PackageList';
import { useRouteStore } from '../../../store/useRouteStore';

export default function Dashboard() {
  const { 
    loading, error, fetchData, 
    routes, couriers, packages, 
    routeSummary, explanation,
    selectedCourierId, setSelectedCourier
  } = useRouteStore();

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
          <MapViewer routes={routes} selectedCourierId={selectedCourierId} />
        </section>

        <section className="dashboard-couriers-section">
          <h2 className="section-title">Active Fleet</h2>
          <CourierList couriers={couriers} selectedCourierId={selectedCourierId} onSelectCourier={setSelectedCourier} />
        </section>

        <section className="dashboard-packages-section">
          <h2 className="section-title">Global Manifest</h2>
          <PackageList packages={packages} />
        </section>
      </main>
    </div>
  );
}
