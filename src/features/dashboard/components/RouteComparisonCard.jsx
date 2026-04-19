import React, { useMemo } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import './RouteComparisonCard.css';

const calculateMidpoint = (start, end) => {
  return [
    (start[1] + end[1]) / 2, // Longitude
    (start[0] + end[0]) / 2  // Latitude
  ];
};

export default function RouteComparisonCard({
  startPoint,
  endPoint,
  timeSaved,
  moneySaved,
  kmsDifference,
  explanation
}) {
  // useMemo ensures we only recalculate the midpoint if the start/end points actually change
  const midpoint = useMemo(() => {
    if (!startPoint || !endPoint) return null;
    return calculateMidpoint(startPoint, endPoint);
  }, [startPoint, endPoint]);

  if (!midpoint) return null;

  const [longitude, latitude] = midpoint;

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      offset={[0, -15]} // Lifts the card slightly so the pointer doesn't block the route line
    >
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

        {/* CSS triangle pointing down */}
        <div className="route-card-triangle" />
      </div>
    </Marker>
  );
}