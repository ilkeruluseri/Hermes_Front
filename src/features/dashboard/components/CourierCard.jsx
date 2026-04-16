import React from 'react';
import './CourierCard.css';

export default function CourierCard({ courier }) {
  return (
    <div className={`courier-card glass-panel ${courier.currentStatus === 'At Risk' ? 'border-danger' : ''}`} style={{ '--route-color': courier.routeColor }}>
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
    </div>
  );
}
