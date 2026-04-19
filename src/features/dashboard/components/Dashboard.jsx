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
    selectedCourierId, setSelectedCourier, hasFetched,
    startSimulation, stopSimulation, wsConnected,
    liveCouriers, isConnecting,
    skipToNextStop, isSkipping, atStopEvent, reoptFlash, reoptResult
  } = useRouteStore();

  useEffect(() => {
    fetchData();
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
          <span style={{ fontWeight: 'bold', color: wsConnected ? '#10b981' : (isConnecting ? '#f59e0b' : '#ef4444') }}>
            {wsConnected ? '🟢 Live' : (isConnecting ? '🟡 Connecting...' : '🔴 Offline')}
          </span>
          <button
            onClick={startSimulation}
            // Disable the button if we are connected OR currently trying to connect
            disabled={!hasFetched || wsConnected || isConnecting}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (wsConnected || isConnecting) ? 'not-allowed' : 'pointer',
              opacity: (wsConnected || isConnecting) ? 0.6 : 1
            }}
          >
            {isConnecting ? 'Starting...' : '▶ Start Sim'}
          </button>

          <button
            onClick={stopSimulation}
            disabled={!wsConnected && !isConnecting}
            style={{
              padding: '8px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!wsConnected && !isConnecting) ? 'not-allowed' : 'pointer',
              opacity: (!wsConnected && !isConnecting) ? 0.6 : 1
            }}
          >
            ■ Stop Sim
          </button>

          <button
            onClick={skipToNextStop}
            disabled={!wsConnected || isSkipping}
            style={{
              padding: '8px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!wsConnected || isSkipping) ? 'not-allowed' : 'pointer',
              opacity: (!wsConnected || isSkipping) ? 0.6 : 1
            }}
          >
            {isSkipping ? '...' : '⏭ Next Stop'}
          </button>
        </div>

        {atStopEvent && wsConnected && (
          <div style={{
            padding: '6px 12px', background: '#f59e0b22',
            border: '1px solid #f59e0b', borderRadius: '4px',
            color: '#f59e0b', fontSize: '0.85rem'
          }}>
            ⏳ {atStopEvent.courier_id} arrived at stop {atStopEvent.stop_id} — re-optimizing...
          </div>
        )}

        {reoptFlash && !atStopEvent && (
          <div style={{
            padding: '6px 12px', background: '#10b98122',
            border: '1px solid #10b981', borderRadius: '4px',
            color: '#10b981', fontSize: '0.85rem'
          }}>
            ✓ Route updated
            {reoptResult?.total_distance_m && ` — ${(reoptResult.total_distance_m / 1000).toFixed(1)} km`}
            {reoptResult?.total_duration_s && ` · ${Math.round(reoptResult.total_duration_s / 60)} min`}
          </div>
        )}

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
