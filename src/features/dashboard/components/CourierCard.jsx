import React from 'react';
import './CourierCard.css';

export default function CourierCard({ courier, isSelected, onSelect, hasSuggestion }) {
  const nextStopIndex = courier.stops.findIndex(s => s.status !== 'completed');
  const delayedCount = courier.stops.filter(
    s => s.status !== 'completed' && s.expected_delay_min > 0
  ).length;

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
        </div>
      </div>

      <div className="stops-timeline">
        {courier.stops.map((stop, index) => {
          const isSevere = stop.severity === 'severe' || stop.will_miss_window;
          const isWarning = stop.expected_delay_min > 0 && !isSevere;
          const isCompleted = stop.status === 'completed';
          const isNext = index === nextStopIndex;

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
                ) : stop.expected_delay_min > 0 ? (
                  <span className={`stop-eta ${isSevere ? 'text-danger' : 'text-warning'}`}>
                    ~{stop.expected_delay_min} min delay expected
                  </span>
                ) : (
                  <span className="stop-eta text-success">On time</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
