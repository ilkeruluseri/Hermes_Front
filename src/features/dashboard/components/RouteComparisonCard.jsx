import React from 'react';
import './RouteComparisonCard.css';

export default function RouteComparisonCard({ suggestion, onAccept, onReject, isProcessing }) {
  if (!suggestion) return null;

  const { explanation, estimated_time_savings_min, previous_sequence, new_sequence, stop_name_map } = suggestion;

  const timeSavings = estimated_time_savings_min != null ? Math.round(estimated_time_savings_min) : null;

  const resolveName = (id) => stop_name_map?.[String(id)] ?? id;

  // Show at most 4 stops per sequence to keep it compact
  const prevSeq = (previous_sequence?.slice(0, 4) ?? []).map(resolveName);
  const newSeq = (new_sequence?.slice(0, 4) ?? []).map(resolveName);
  const hasSequenceChange = prevSeq.length > 0 && newSeq.length > 0;

  return (
    <div className="route-card-container">
      <p className="route-card-explanation">
        ⚠ {explanation || 'A new optimized route is available.'}
      </p>

      <div className="route-card-metrics">
        {timeSavings != null && (
          <div className="route-card-row">
            <span className="route-card-label">⏱ Time Saved</span>
            <span className="route-card-value-positive">~{timeSavings} min</span>
          </div>
        )}

        {hasSequenceChange && (
          <div className="route-card-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span className="route-card-label">🔀 Stop Order</span>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ color: '#ef4444' }}>{prevSeq.join(' → ')}</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              <span style={{ color: '#16a34a' }}>{newSeq.join(' → ')}</span>
            </div>
          </div>
        )}
      </div>

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
