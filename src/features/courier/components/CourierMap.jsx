import React, { useEffect, useCallback, useState } from 'react';
import Map, { Source, Layer, Marker, useMap } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './CourierMap.css';

const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const routeLayerStyle = {
  id: 'courier-route',
  type: 'line',
  paint: {
    'line-color': '#3b82f6',
    'line-width': 6,
    'line-opacity': 0.9,
  },
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
};

function MapController({ livePosition, stops }) {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map) return;
    if (livePosition) {
      map.flyTo({ center: [livePosition.longitude, livePosition.latitude], zoom: 15, duration: 800 });
    } else if (stops?.length) {
      const lngs = stops.map(s => s.longitude);
      const lats = stops.map(s => s.latitude);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, duration: 800 }
      );
    }
  }, [livePosition, map, stops]);

  return null;
}

export default function CourierMap({ routeGeometry, stops, livePosition }) {
  const [userPanned, setUserPanned] = useState(false);

  const handleRecenter = useCallback(() => {
    setUserPanned(false);
  }, []);

  const initialViewState = {
    longitude: stops?.[0]?.longitude ?? 37.015,
    latitude: stops?.[0]?.latitude ?? 39.75,
    zoom: 13,
  };

  return (
    <div className="courier-map-container">
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={TOKEN}
        onDragStart={() => setUserPanned(true)}
      >
        {!userPanned && <MapController livePosition={livePosition} stops={stops} />}

        {routeGeometry && (
          <Source id="courier-route-src" type="geojson" data={routeGeometry}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {stops?.map((stop, i) => (
          <Marker
            key={stop.stop_sequence ?? i}
            longitude={stop.longitude}
            latitude={stop.latitude}
            anchor="center"
          >
            <div className="stop-marker">
              <span className="stop-marker-num">{stop.stop_sequence ?? i + 1}</span>
            </div>
          </Marker>
        ))}

        {livePosition && (
          <Marker
            longitude={livePosition.longitude}
            latitude={livePosition.latitude}
            anchor="center"
          >
            <div className="live-marker">
              <div className="live-marker-pulse" />
              <div className="live-marker-dot" />
            </div>
          </Marker>
        )}
      </Map>

      {userPanned && (
        <button className="recenter-btn" onClick={handleRecenter}>
          Re-center
        </button>
      )}
    </div>
  );
}
