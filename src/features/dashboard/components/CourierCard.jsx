import React from 'react';
import './CourierCard.css';

export default function CourierCard({ courier }) {
  return (
    <div className="courier-card glass-panel" style={{ '--route-color': courier.routeColor }}>
      <div className="courier-card-header">
        <div className="courier-profile">
          <div className="courier-avatar">
            {courier.initials}
          </div>
          <div className="courier-info">
            <h3 className="courier-name">{courier.name}</h3>
            <span className="courier-status">{courier.currentStatus}</span>
          </div>
        </div>
        <div className="stops-badge">
          <span className="stops-count">{courier.stopsRemaining}</span>
          <span className="stops-label">Left</span>
        </div>
      </div>
      
      <div className="stops-timeline">
        {courier.stops.map((stop, index) => (
          <div key={index} className={`timeline-item ${stop.completed ? 'completed' : ''}`}>
            <div className="timeline-node"></div>
            <div className="timeline-content">
              <span className="stop-name">{stop.name}</span>
              <span className="stop-eta">{stop.eta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
