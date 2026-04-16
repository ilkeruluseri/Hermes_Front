import React from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';
import './MapViewer.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapViewer({ routes }) {
  return (
    <div className="map-viewer-container">
      <Map
        initialViewState={{
          longitude: 26.7644, // Centered near Urla
          latitude: 38.3229,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11" 
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
      >
        {routes && routes.map((routeData, index) => (
          <Source 
            key={`source-${routeData.id || index}`} 
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
                'line-color': routeData.color || '#3b82f6', 
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        ))}
      </Map>
      
      {/* Overlay to give it a premium feel */}
      <div className="map-overlay-layer pointer-events-none"></div>
    </div>
  );
}
