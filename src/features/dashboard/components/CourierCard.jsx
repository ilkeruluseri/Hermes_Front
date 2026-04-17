import React from 'react';
import './CourierCard.css';

export default function CourierCard({ courier, isSelected, onSelect }) {
  const { optimizationMetrics } = courier;
  return (
    <div 
      className={`courier-card glass-panel ${courier.currentStatus === 'At Risk' ? 'border-danger' : ''} ${isSelected ? 'selected' : ''}`} 
      style={{ '--route-color': courier.routeColor }}
      onClick={onSelect}
    >
      <div className="courier-card-header">
        <div className="courier-profile">
          <div className="courier-avatar">
            {courier.initials}
          </div>
          <div className="courier-info">
            <h3 className="courier-name">{courier.name}</h3>
            <span className={`courier-status ${courier.currentStatus === 'At Risk' ? 'text-danger' : 'text-primary'}`}>{courier.currentStatus}</span>
          </div>
        </div>
        <div className="stops-badge">
          <span className="stops-count">{courier.stopsRemaining}</span>
          <span className="stops-label">Left</span>
        </div>
      </div>
      
      <div className="stops-timeline">
        {courier.stops.map((stop, index) => {
          const isSevere = stop.severity === 'severe' || stop.will_miss_window;
          const isWarning = stop.expected_delay_min > 0 && !isSevere;
          
          return (
            <div key={index} className={`timeline-item ${isSevere ? 'severe' : ''} ${isWarning ? 'warning' : ''}`}>
              <div className="timeline-node"></div>
              <div className="timeline-content">
                <span className="stop-name">{stop.stop_name || 'Unknown Stop'}</span>
                {stop.expected_delay_min > 0 ? (
                  <span className={`stop-eta ${isSevere ? 'text-danger' : 'text-warning'}`}>
                    Delay: {stop.expected_delay_min} mins
                  </span>
                ) : (
                  <span className="stop-eta text-success">On Time</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isSelected && optimizationMetrics && (
        <div className="optimization-details">
          <h4>Optimization Analytics</h4>
          <div className="metrics-grid">
            <div className="metric-box text-success">
              <span className="metric-value">{optimizationMetrics.timeSavedMin}m</span>
              <span className="metric-label">Saved</span>
            </div>
            <div className="metric-box text-warning">
              <span className="metric-value">{optimizationMetrics.distanceSavedKm}km</span>
              <span className="metric-label">Less</span>
            </div>
            <div className="metric-box text-primary">
              <span className="metric-value">${optimizationMetrics.moneySaved}</span>
              <span className="metric-label">Saved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
