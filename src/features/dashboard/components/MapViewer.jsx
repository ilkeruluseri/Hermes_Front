import React from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import './MapViewer.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const renderCourierIcon = (type) => {
  switch (type) {
    case 'truck': return '🚚';
    case 'motorcycle': return '🏍️';
    case 'car': default: return '🚗';
  }
};

export default function MapViewer({ routes, selectedCourierId }) {
  const routesToRender = selectedCourierId !== null
    ? routes.filter(r => r.id === `route-${selectedCourierId}` || r.vehicle_id === selectedCourierId)
    : routes;

  const naiveRouteToRender = selectedCourierId !== null
    ? routes.find(r => r.id === `route-${selectedCourierId}` || r.vehicle_id === selectedCourierId)?.naiveGeometry 
    : null;

  return (
    <div className="map-viewer-container">
      <Map
        initialViewState={{
          longitude: 37.0150, // Centered near Urla
          latitude: 39.7505,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11" 
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {routesToRender && routesToRender.map((routeData, index) => (
          <React.Fragment key={`fragment-${routeData.id || index}`}>
            <Source 
              id={`route-${routeData.id || index}`} 
              type="geojson" 
              data={routeData.geometry}
            >
              <Layer
                id={`layer-${routeData.id || index}`}
                type="line"
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round'
                }}
                paint={{
                  'line-color': routeData.color || '#eb5647', 
                  'line-width': 5,
                  'line-opacity': 0.8
                }}
              />
            </Source>

            {routeData.currentPosition && (
              <Marker 
                longitude={routeData.currentPosition[0]} 
                latitude={routeData.currentPosition[1]}
                anchor="center"
              >
                <div className="courier-marker" style={{ borderColor: routeData.color || 'var(--primary-accent)' }}>
                  {renderCourierIcon(routeData.vehicleType)}
                </div>
              </Marker>
            )}
          </React.Fragment>
        ))}

        {naiveRouteToRender && (
          <Source 
            id="naive-route-source" 
            type="geojson" 
            data={naiveRouteToRender}
          >
            <Layer
              id="naive-route-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#707070', 
                'line-width': 4,
                'line-opacity': 0.6,
                'line-dasharray': [2, 2]
              }}
            />
          </Source>
        )}
      </Map>
      
      {/* Overlay to give it a premium feel */}
      <div className="map-overlay-layer pointer-events-none"></div>
    </div>
  );
}
