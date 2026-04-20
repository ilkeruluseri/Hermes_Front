import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchOnTimeRate, fetchCourierPerformance, fetchKpis, fetchRecentDelays } from '../../../services/analyticsService';
import './AnalyticsDashboard.css';

function formatKpiTrend(change, unit = '', context = '') {
  if (change == null) return <span className="kpi-trend neutral">No data</span>;
  if (change === 0) return <span className="kpi-trend neutral">No change</span>;
  const sign = change > 0 ? '↑' : '↓';
  const cls = change > 0 ? 'positive' : 'negative';
  return <span className={`kpi-trend ${cls}`}>{sign} {Math.abs(change)}{unit} {context}</span>;
}

export default function AnalyticsDashboard() {
  const [onTimeData, setOnTimeData] = useState([]);
  const [courierData, setCourierData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [recentDelays, setRecentDelays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [onTime, couriers, kpiData, delays] = await Promise.all([
          fetchOnTimeRate('7days'),
          fetchCourierPerformance('week'),
          fetchKpis(),
          fetchRecentDelays(10),
        ]);
        setOnTimeData(onTime ?? []);
        setCourierData(couriers ?? []);
        setKpis(kpiData);
        setRecentDelays(delays ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="analytics-container">
        <header className="analytics-page-header"><h1>System Analytics</h1></header>
        <main className="analytics-main">
          <div className="loading-state">Loading analytics data...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <header className="analytics-page-header"><h1>System Analytics</h1></header>
        <main className="analytics-main">
          <div className="error-state">Failed to load analytics: {error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <header className="analytics-page-header">
        <h1>System Analytics</h1>
      </header>

      <main className="analytics-main">
        {/* KPI Scorecards */}
        <div className="kpi-grid">
          <div className="kpi-card glass-panel">
            <h3>Total Packages Delivered</h3>
            <div className="kpi-value">
              {kpis?.totalDelivered?.value != null ? kpis.totalDelivered.value.toLocaleString() : '—'}
            </div>
            {formatKpiTrend(kpis?.totalDelivered?.changePercent, '%', 'from last week')}
          </div>
          <div className="kpi-card glass-panel">
            <h3>Overall On-Time Rate</h3>
            <div className="kpi-value">
              {kpis?.onTimeRate?.value != null ? `${kpis.onTimeRate.value}%` : '—'}
            </div>
            {formatKpiTrend(kpis?.onTimeRate?.changePercent, '%', 'from last week')}
          </div>
          <div className="kpi-card glass-panel danger-border">
            <h3>Active Delays</h3>
            <div className="kpi-value">
              {kpis?.activeDelays?.value != null ? kpis.activeDelays.value : '—'}
            </div>
            {formatKpiTrend(kpis?.activeDelays?.changeFromYesterday, '', 'from yesterday')}
          </div>
          <div className="kpi-card glass-panel">
            <h3>Active Couriers</h3>
            <div className="kpi-value">
              {kpis?.activeCouriers?.value != null ? kpis.activeCouriers.value : '—'}
            </div>
            {formatKpiTrend(kpis?.activeCouriers?.changeFromYesterday, '', 'from yesterday')}
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          <div className="chart-container glass-panel">
            <h2>On-Time Delivery Rate (Last 7 Days)</h2>
            <div className="chart-wrapper">
              {onTimeData.length === 0 ? (
                <div className="empty-chart-state">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={onTimeData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" domain={[80, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="var(--primary-accent)" strokeWidth={3} dot={{ r: 6, fill: 'var(--primary-accent)', strokeWidth: 2, stroke: 'var(--surface-color)' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="chart-container glass-panel">
            <h2>Courier Performance (Deliveries vs. On-Time)</h2>
            <div className="chart-wrapper">
              {courierData.length === 0 ? (
                <div className="empty-chart-state">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courierData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="total" fill="var(--text-tertiary)" name="Total Deliveries" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="onTime" fill="var(--success)" name="On Time" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Recent Delays Table */}
        <div className="delays-section glass-panel">
          <h2>Recent Package Delays</h2>
          <div className="table-responsive">
            <table className="package-table">
              <thead>
                <tr>
                  <th>Tracking ID</th>
                  <th>Courier</th>
                  <th>Delay Reason</th>
                  <th>Expected ETA</th>
                </tr>
              </thead>
              <tbody>
                {recentDelays.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', opacity: 0.6 }}>
                      No recent delays
                    </td>
                  </tr>
                ) : (
                  recentDelays.map((delay) => (
                    <tr key={delay.trackingId}>
                      <td className="font-mono text-primary">{delay.trackingId}</td>
                      <td>{delay.courierName}</td>
                      <td>{delay.delayReason}</td>
                      <td><span className="text-danger">{delay.expectedEta}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
