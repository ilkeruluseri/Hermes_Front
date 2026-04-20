import React from 'react';
import './RouteComparisonCard.css';

export default function RouteComparisonCard({
  explanation,
  timeSaved,
  isVisible,
  onAccept,
  onReject,
  isProcessing
}) {
  if (!isVisible) return null;

  return (
    <div className="route-card-container">
      <p className="route-card-explanation">
        ⚠ {explanation}
      </p>

      {timeSaved && (
        <div className="route-card-metrics">
          <div className="route-card-row">
            <span className="route-card-label">⏱ Time Saved</span>
            <span className="route-card-value-positive">{timeSaved}</span>
          </div>
        </div>
      )}

      <div className="route-card-actions" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          onClick={onReject}
          disabled={isProcessing}
          style={{ flex: 1, padding: '8px', background: 'var(--danger, #ef4444)', color: 'white', border: 'none', borderRadius: '4px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
        >
          Reject
        </button>
        <button
          onClick={onAccept}
          disabled={isProcessing}
          style={{ flex: 1, padding: '8px', background: 'var(--success, #10b981)', color: 'white', border: 'none', borderRadius: '4px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
        >
          {isProcessing ? 'Processing...' : 'Accept'}
        </button>
      </div>
    </div>
  );
}
