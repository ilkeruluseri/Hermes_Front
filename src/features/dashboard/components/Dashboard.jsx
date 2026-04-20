import React, { useEffect } from 'react';
import './Dashboard.css';
import MapViewer from './MapViewer';
import CourierList from './CourierList';
import PackageList from './PackageList';
import { useRouteStore } from '../../../store/useRouteStore';

function kpiRiskClass(score) {
  if (!score || score === 0) return 'kpi-ok';
  if (score <= 3) return 'kpi-warning';
  return 'kpi-danger';
}

function kpiDelayClass(minutes) {
  if (!minutes || minutes < 10) return 'kpi-ok';
  if (minutes < 30) return 'kpi-warning';
  return 'kpi-danger';
}

export default function Dashboard() {
  const {
    loading, error, fetchData,
    routes, couriers, packages,
    routeSummary, explanation,
    selectedCourierId, setSelectedCourier, hasFetched,
    startSimulation, stopSimulation, wsConnected,
    liveCouriers, isConnecting, pendingSuggestions, handleSuggestionDecision
  } = useRouteStore();

  useEffect(() => {
    fetchData();
    return () => stopSimulation();
  }, [fetchData, stopSimulation]);

  const activeCouriersList = Object.values(liveCouriers);
  const pendingCount = Object.keys(pendingSuggestions).length;
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="dashboard-container">
      <header className="dashboard-page-header">
        <div className="header-title-row">
          <h1>Dispatch Center</h1>
          <span className="header-time">{now}</span>
        </div>

        {loading && (
          <div className="loading-bar-wrapper">
            <div className="loading-bar" />
          </div>
        )}

        {error && (
          <div className="dashboard-error-banner">
            ⚠ {error}
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        <div className="simulation-controls">
          <span className={`live-status-badge ${wsConnected ? 'live-status--online' : isConnecting ? 'live-status--connecting' : 'live-status--offline'}`}>
            <span className="live-dot" />
            {wsConnected ? 'Live Tracking' : isConnecting ? 'Connecting…' : 'Tracking Off'}
          </span>
          <button
            onClick={() => startSimulation(false)}
            disabled={!hasFetched || wsConnected || isConnecting}
            className="ctrl-btn ctrl-btn--start"
            style={{ opacity: (wsConnected || isConnecting) ? 0.5 : 1 }}
          >
            {isConnecting ? 'Starting…' : '▶ Start Live'}
          </button>
          <button
            onClick={stopSimulation}
            disabled={!wsConnected && !isConnecting}
            className="ctrl-btn ctrl-btn--stop"
            style={{ opacity: (!wsConnected && !isConnecting) ? 0.5 : 1 }}
          >
            ■ End Session
          </button>
        </div>
      </header>

      <main className="dashboard-main">

        {/* Alert strip — Gestalt figure/ground: bright signal on dark surface */}
        {pendingCount > 0 && (
          <div className="alert-strip alert-strip--suggestion">
            <span className="alert-icon">💡</span>
            <span className="alert-text">
              <strong>{pendingCount} route suggestion{pendingCount > 1 ? 's' : ''} ready</strong>
              {' '}— select a courier in the fleet panel to review and apply.
            </span>
          </div>
        )}
        {routeSummary?.severe_stop_count > 0 && (
          <div className="alert-strip alert-strip--danger">
            <span className="alert-icon">⚠</span>
            <span className="alert-text">
              <strong>{routeSummary.severe_stop_count} stop{routeSummary.severe_stop_count > 1 ? 's' : ''} at high risk</strong>
              {' '}of missing the delivery window — check the map and courier timeline.
            </span>
          </div>
        )}

        {/* KPI row — semantic color borders for at-a-glance status */}
        <section className="dashboard-kpis">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="kpi-card skeleton-card">
                  <span className="skeleton-line skeleton-label" />
                  <span className="skeleton-line skeleton-value" />
                </div>
              ))
            : routeSummary && (
                <>
                  <div className={`kpi-card ${kpiRiskClass(routeSummary.overall_risk_score)}`}>
                    <span className="kpi-icon-row">🛡 <span className="kpi-label">Route Health</span></span>
                    <span className="kpi-value">
                      {routeSummary.overall_risk_score}
                      <span className="kpi-scale">/10</span>
                    </span>
                    <span className="kpi-sub">
                      {routeSummary.overall_risk_score === 0 ? 'No active risk factors' : `${routeSummary.overall_risk_score} risk factor${routeSummary.overall_risk_score > 1 ? 's' : ''} detected`}
                    </span>
                  </div>

                  <div className={`kpi-card ${kpiDelayClass(routeSummary.expected_total_delay_min)}`}>
                    <span className="kpi-icon-row">⏱ <span className="kpi-label">Expected Delay</span></span>
                    <span className="kpi-value">
                      {routeSummary.expected_total_delay_min}
                      <span className="kpi-unit"> min</span>
                    </span>
                    <span className="kpi-sub">cumulative across all routes</span>
                  </div>

                  <div className={`kpi-card ${routeSummary.severe_stop_count > 0 ? 'kpi-danger' : 'kpi-ok'}`}>
                    <span className="kpi-icon-row">📍 <span className="kpi-label">At-Risk Stops</span></span>
                    <span className="kpi-value">{routeSummary.severe_stop_count}</span>
                    <span className="kpi-sub">
                      {routeSummary.severe_stop_count === 0 ? 'All stops on schedule' : `${routeSummary.severe_stop_count} may miss delivery window`}
                    </span>
                  </div>

                  <div className={`kpi-card ${routeSummary.vrp_status === 'success' ? 'kpi-ok' : 'kpi-warning'}`}>
                    <span className="kpi-icon-row">✓ <span className="kpi-label">Route Status</span></span>
                    <span className="kpi-value kpi-value--text">
                      {routeSummary.vrp_status === 'success' ? 'Optimized' : routeSummary.vrp_status}
                    </span>
                    <span className="kpi-sub">
                      {routeSummary.vrp_status === 'success' ? 'Routes calculated & active' : 'Check route details'}
                    </span>
                  </div>
                </>
              )
          }
        </section>

        <div className="map-and-fleet-container">
          <section className="dashboard-map-section">
            {loading
              ? <div className="skeleton-map"><div className="skeleton-map-pulse" /></div>
              : <MapViewer routes={routes} selectedCourierId={selectedCourierId} liveCouriers={activeCouriersList} pendingSuggestions={pendingSuggestions} handleSuggestionDecision={handleSuggestionDecision} />
            }
          </section>

          <section className="dashboard-couriers-section">
            <h2 className="section-title">
              Active Fleet
              {!loading && couriers.length > 0 && (
                <span className="section-count">{couriers.length}</span>
              )}
            </h2>
            <div className="fleet-scroll-area">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton-courier-card">
                      <div className="skeleton-avatar" />
                      <div className="skeleton-courier-lines">
                        <span className="skeleton-line" style={{ width: '60%' }} />
                        <span className="skeleton-line" style={{ width: '40%' }} />
                      </div>
                    </div>
                  ))
                : <CourierList couriers={couriers} selectedCourierId={selectedCourierId} onSelectCourier={setSelectedCourier} pendingSuggestions={pendingSuggestions} liveCouriers={liveCouriers} />
              }
            </div>
          </section>
        </div>

        <section className="dashboard-packages-section">
          <h2 className="section-title">Stop Manifest</h2>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton-package-row">
                  <span className="skeleton-line" style={{ width: `${50 + i * 8}%` }} />
                </div>
              ))
            : <PackageList packages={packages} />
          }
        </section>
      </main>
    </div>
  );
}
