import { useState, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl/mapbox';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const show_frontend = 0;

export default function App() {
  // We store an array of route objects so the dispatcher can see multiple couriers
  const [routes, setRoutes] = useState([]);

  // A function to call the backend we just built
  const fetchRoute = async () => {
    try {
      const response = await fetch('/api/route/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stops: [
            { lat: 38.3229, lon: 26.7644, name: "Urla Center" },
            { lat: 38.3166, lon: 26.8322, name: "Güzelbahçe" },
            { lat: 38.3188, lon: 26.6388, name: "IZTECH Campus" }
          ]
        })
      });

      if (response.ok) {
        console.log(`Route fetched successfully: ${response}`);
        const data = await response.json();
        // Add the new route to our array of existing routes
        setRoutes(prevRoutes => [...prevRoutes, data]);
      } else {
        console.error("Failed to fetch route");
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
    }
  };

  // Fetch a sample route when the component mounts
  useEffect(() => {
    console.log("Fetching initial route...");
    fetchRoute();
  }, []);

  if (show_frontend == 0) {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        I see you
      </div>
    )
  }
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map
        initialViewState={{
          longitude: 26.7644, // Centered near Urla
          latitude: 38.3229,
          zoom: 11
        }}
        mapStyle="mapbox://styles/mapbox/dark-v11" // Dark mode looks great for dispatcher dashboards
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {/* Iterate over our routes and draw them on the map */}
        {routes.map((routeData, index) => (
          <Source 
            key={`source-${index}`} 
            id={`route-${index}`} 
            type="geojson" 
            data={routeData.geometry}
          >
            <Layer
              id={`layer-${index}`}
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                // Give each route a slightly different color or just use a solid dispatcher blue
                'line-color': index % 2 === 0 ? '#3b82f6' : '#10b981', 
                'line-width': 5,
                'line-opacity': 0.8
              }}
            />
          </Source>
        ))}
      </Map>

      {/* A simple UI overlay to test adding more routes later */}
      <div style={{
        position: 'absolute', top: 20, left: 20, 
        background: 'white', padding: '15px', borderRadius: '8px', zIndex: 1
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: 'black' }}>Dispatcher Controls</h3>
        <button onClick={fetchRoute} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Fetch Another Route
        </button>
        <p style={{ color: 'black', margin: '10px 0 0 0' }}>Active Routes: {routes.length}</p>
      </div>
    </div>
  );
}