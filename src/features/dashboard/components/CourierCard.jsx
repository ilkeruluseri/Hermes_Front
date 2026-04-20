import React from 'react';
import './CourierCard.css';

function fmtTime(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return null;
  }
}

function haversineKm(lon1, lat1, lon2, lat2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function computeLiveETA(liveCourier, nextStop) {
  if (!liveCourier?.location || !nextStop?.latitude || !nextStop?.longitude) return null;
  const [curLon, curLat] = liveCourier.location;
  const distKm = haversineKm(curLon, curLat, nextStop.longitude, nextStop.latitude);
  const speedKmh = liveCourier.speed_kmh > 0 ? liveCourier.speed_kmh : 30;
  const etaMs = Date.now() + (distKm / speedKmh) * 3600 * 1000;
  return new Date(etaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function CourierCard({ courier, isSelected, onSelect, hasSuggestion, liveCourier }) {
  const nextStopIndex = courier.stops.findIndex(s => s.status !== 'completed');
  const nextStop = nextStopIndex !== -1 ? courier.stops[nextStopIndex] : null;
  const delayedCount = courier.stops.filter(
    s => s.status !== 'completed' && s.expected_delay_min > 0
  ).length;

  const liveETA = computeLiveETA(liveCourier, nextStop);
  const { optimizationMetrics: metrics } = courier;

  return (
    <div
      className={`courier-card glass-panel ${courier.currentStatus === 'At Risk' ? 'border-danger' : ''} ${isSelected ? 'selected' : ''} ${hasSuggestion ? 'has-suggestion' : ''}`}
      style={{ '--route-color': courier.routeColor }}
      onClick={onSelect}
    >
      {hasSuggestion && (
        <div className="suggestion-badge">
          Route Change Available — Review in Map
        </div>
      )}

      <div className="courier-card-header" style={{ marginTop: hasSuggestion ? '20px' : '0' }}>
        <div className="courier-profile">
          <div className="courier-avatar">{courier.initials}</div>
          <div className="courier-info">
            <h3 className="courier-name">{courier.name}</h3>
            <span className={`courier-status ${courier.currentStatus === 'At Risk' ? 'text-danger' : 'text-success'}`}>
              {courier.currentStatus === 'At Risk'
                ? `At Risk${delayedCount > 0 ? ` · ${delayedCount} delayed` : ''}`
                : 'On Track'}
            </span>
          </div>
        </div>
        <div className="stops-badge">
          <span className="stops-count">{courier.stopsRemaining}</span>
          <span className="stops-label">stops left</span>
          {liveETA && (
            <span className="stops-eta-live">ETA {liveETA}</span>
          )}
        </div>
      </div>

      {metrics && (
        <div className="optimization-details">
          <h4>Optimization Savings</h4>
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-value text-success">-{metrics.timeSavedMin} min</span>
              <span className="metric-label">Time Saved</span>
            </div>
            <div className="metric-box">
              <span className="metric-value text-success">-{metrics.distanceSavedKm} km</span>
              <span className="metric-label">Distance</span>
            </div>
            <div className="metric-box">
              <span className="metric-value text-success">€{metrics.moneySaved}</span>
              <span className="metric-label">Cost Saved</span>
            </div>
          </div>
        </div>
      )}

      <div className="stops-timeline">
        {courier.stops.map((stop, index) => {
          const isSevere = stop.severity === 'severe' || stop.will_miss_window;
          const isWarning = stop.expected_delay_min > 0 && !isSevere;
          const isCompleted = stop.status === 'completed';
          const isNext = index === nextStopIndex;

          // For the next stop, prefer the live computed ETA over the static one
          const staticETA = fmtTime(stop.estimated_arrival_time);
          const eta = isNext && liveETA ? liveETA : staticETA;

          const winStart = fmtTime(stop.time_window_start);
          const winEnd   = fmtTime(stop.time_window_end);
          const hasWindow = winStart && winEnd;

          let windowStatus = null;
          if (eta && hasWindow && stop.time_window_end) {
            // For live ETA on next stop, compare directly
            const etaMs = isNext && liveETA
              ? Date.now() + 0  // already computed as future time, re-derive for comparison
              : stop.estimated_arrival_time ? new Date(stop.estimated_arrival_time).getTime() : null;
            const windowEndMs = new Date(stop.time_window_end).getTime();
            if (etaMs !== null) windowStatus = etaMs <= windowEndMs ? 'ok' : 'late';
          }

          return (
            <div
              key={index}
              className={`timeline-item ${isSevere ? 'severe' : ''} ${isWarning ? 'warning' : ''} ${isCompleted ? 'completed' : ''} ${isNext ? 'next' : ''}`}
            >
              <div className="timeline-node" style={{
                background: isCompleted ? 'var(--success)' : '',
                borderColor: isCompleted ? 'var(--success)' : ''
              }}>
                {isCompleted && <span style={{ color: 'white', fontSize: '8px', position: 'absolute', top: '-1px', left: '2px' }}>✓</span>}
              </div>
              <div className="timeline-content" style={{ opacity: isCompleted ? 0.5 : 1 }}>
                <div className="stop-name-row">
                  <span className="stop-name" style={{ textDecoration: isCompleted ? 'line-through' : 'none' }}>
                    {stop.stop_name || 'Unknown Stop'}
                  </span>
                  {isNext && <span className="next-stop-badge">NEXT</span>}
                </div>

                {isCompleted ? (
                  <span className="stop-eta text-success">Delivered</span>
                ) : (
                  <div className="stop-detail-row">
                    {eta && (
                      <span className={`stop-eta-chip ${isNext && liveETA ? 'stop-eta-chip--live' : ''} ${windowStatus === 'late' ? 'stop-eta-chip--late' : ''}`}>
                        ETA {eta}
                      </span>
                    )}

                    {hasWindow && (
                      <span className={`stop-window-chip ${windowStatus === 'ok' ? 'stop-window-chip--ok' : windowStatus === 'late' ? 'stop-window-chip--late' : ''}`}>
                        {winStart}–{winEnd}
                        {windowStatus === 'ok'   && ' ✓'}
                        {windowStatus === 'late' && ' ⚠'}
                      </span>
                    )}

                    {!eta && !hasWindow && stop.expected_delay_min > 0 && (
                      <span className={`stop-eta ${isSevere ? 'text-danger' : 'text-warning'}`}>
                        ~{stop.expected_delay_min} min delay
                      </span>
                    )}
                    {!eta && !hasWindow && stop.expected_delay_min === 0 && (
                      <span className="stop-eta text-success">On time</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
