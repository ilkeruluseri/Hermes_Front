import React from 'react';
import './RouteComparisonCard.css';

export default function RouteComparisonCard({ suggestion, onAccept, onReject, isProcessing }) {
  if (!suggestion) return null;

  const { explanation, estimated_time_savings_min, previous_sequence, new_sequence, stop_name_map, risk_factors } = suggestion;

  const timeSavings = estimated_time_savings_min != null ? Math.round(estimated_time_savings_min) : null;
  const resolveName = (id) => stop_name_map?.[String(id)] ?? id;

  const prevSeq = (previous_sequence?.slice(0, 4) ?? []).map(resolveName);
  const newSeq  = (new_sequence?.slice(0, 4)  ?? []).map(resolveName);
  const hasSequenceChange = prevSeq.length > 0 && newSeq.length > 0;
  const hasRiskFactors = Array.isArray(risk_factors) && risk_factors.length > 0;

  return (
    <div className="route-card-container">
      <div className="route-card-header">
        <span className="route-card-badge">Route Optimization Available</span>
      </div>

      <p className="route-card-explanation">
        {explanation || 'A smarter stop order was found based on current conditions.'}
      </p>

      {/* Why this change is needed — from backend risk_factors */}
      {hasRiskFactors && (
        <div className="route-card-risk-factors">
          <span className="route-card-seq-label">Why this change</span>
          <ul className="route-card-risk-list">
            {risk_factors.map((factor, i) => (
              <li key={i} className="route-card-risk-item">{factor}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="route-card-metrics">
        {timeSavings != null && (
          <div className="route-card-savings-row">
            <span className="route-card-savings-label">Time saved</span>
            <span className="route-card-value-positive">~{timeSavings} min faster</span>
          </div>
        )}

        {hasSequenceChange && (
          <div className="route-card-sequence">
            <span className="route-card-seq-label">Stop order change</span>
            <div className="route-card-seq-row">
              <span className="route-card-seq-tag route-card-seq-tag--old">Before</span>
              <span className="route-card-seq-stops route-card-seq-stops--old">{prevSeq.join(' → ')}</span>
            </div>
            <div className="route-card-seq-row">
              <span className="route-card-seq-tag route-card-seq-tag--new">After</span>
              <span className="route-card-seq-stops route-card-seq-stops--new">{newSeq.join(' → ')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="route-card-actions">
        <button onClick={onReject} disabled={isProcessing} className="route-card-btn route-card-btn--secondary">
          Keep Current
        </button>
        <button onClick={onAccept} disabled={isProcessing} className="route-card-btn route-card-btn--primary">
          {isProcessing ? 'Applying…' : 'Apply New Route'}
        </button>
      </div>
    </div>
  );
}
