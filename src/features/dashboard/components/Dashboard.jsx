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
    selectedCourierId, setSelectedCourier, 
    startSimulation, stopSimulation, nextTimeStep,
    liveCouriers, simulationActive, isStarting, isStepping
  } = useRouteStore();

  useEffect(() => {
    fetchData();
    // No automatic start, user will click "Start Simulation"
    return () => stopSimulation();
  }, [fetchData, stopSimulation]);

  const activeCouriersList = Object.values(liveCouriers);

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

        {/* --- SIMULATION CONTROLS --- */}
        <div className="simulation-controls" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {!simulationActive ? (
            <button
              onClick={startSimulation}
              disabled={isStarting}
              style={{
                padding: '8px 16px',
                background: 'var(--primary-accent)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isStarting ? 'not-allowed' : 'pointer',
                opacity: isStarting ? 0.7 : 1
              }}
            >
              {isStarting ? 'Initializing...' : 'Start Simulation'}
            </button>
          ) : (
            <>
              <button
                onClick={nextTimeStep}
                disabled={isStepping}
                style={{
                  padding: '8px 16px',
                  background: '#10B981', // Success green
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isStepping ? 'not-allowed' : 'pointer',
                  opacity: isStepping ? 0.7 : 1
                }}
              >
                {isStepping ? 'Smoothing...' : 'Next Time Step'}
              </button>
              <button
                onClick={stopSimulation}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reset
              </button>
            </>
          )}
        </div>
      </header>

      <main className="dashboard-main">
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

        <div className="map-and-fleet-container">
          <section className="dashboard-map-section">
            <MapViewer routes={routes} selectedCourierId={selectedCourierId} liveCouriers={activeCouriersList} />
          </section>

          <section className="dashboard-couriers-section">
            <h2 className="section-title">Active Fleet</h2>
            <div className="fleet-scroll-area">
              <CourierList couriers={couriers} selectedCourierId={selectedCourierId} onSelectCourier={setSelectedCourier} />
            </div>
          </section>
        </div>

        <section className="dashboard-packages-section">
          <h2 className="section-title">Global Manifest</h2>
          <PackageList packages={packages} />
        </section>
      </main>
    </div>
  );
}
