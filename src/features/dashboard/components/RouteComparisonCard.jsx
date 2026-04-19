import React from 'react';
import './RouteComparisonCard.css';

export default function RouteComparisonCard({
  timeSaved,
  moneySaved,
  kmsDifference,
  explanation
}) {
  return (
    <div className="route-card-container">
      {/* Explanation Header */}
      <p className="route-card-explanation">
        {explanation}
      </p>

      {/* Metrics Grid */}
      <div className="route-card-metrics">

        {/* Time Row */}
        <div className="route-card-row">
          <span className="route-card-label">
            ⏱️ Time Saved
          </span>
          <span className="route-card-value-positive">
            {timeSaved}
          </span>
        </div>

        {/* Distance Row */}
        <div className="route-card-row">
          <span className="route-card-label">
            📏 Distance
          </span>
          <span className="route-card-value-negative">
            {kmsDifference}
          </span>
        </div>

        {/* Money Row */}
        <div className="route-card-row">
          <span className="route-card-label">
            💰 Cost Saved
          </span>
          <span className="route-card-value-positive">
            {moneySaved}
          </span>
        </div>

      </div>
    </div>
  );
}