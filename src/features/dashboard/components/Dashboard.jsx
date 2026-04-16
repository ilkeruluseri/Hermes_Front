import React, { useState } from 'react';
import './Dashboard.css';
import MapViewer from './MapViewer';
import CourierList from './CourierList';
import PackageList from './PackageList';

// Mock Data
const MOCK_ROUTES = [
  { 
    id: 'route-1', 
    color: '#3b82f6', // primary-accent
    geometry: { 
      type: 'Feature', 
      geometry: { 
        type: 'LineString', 
        coordinates: [ 
          [26.7644, 38.3229], // Urla
          [26.8322, 38.3166], // Guzelbahce
          [26.6388, 38.3188]  // IZTECH
        ] 
      } 
    } 
  },
  { 
    id: 'route-2', 
    color: '#10b981', // success
    geometry: { 
      type: 'Feature', 
      geometry: { 
        type: 'LineString', 
        coordinates: [ 
          [26.7644, 38.3229], // Urla
          [26.3060, 38.3235]  // Cesme roughly
        ] 
      } 
    } 
  }
];

const MOCK_COURIERS = [
  { 
    id: 1, 
    name: 'Alex Johnson', 
    initials: 'AJ', 
    currentStatus: 'En Route', 
    stopsRemaining: 2, 
    routeColor: '#3b82f6', 
    stops: [ 
      { name: 'Urla Center', eta: '10:30 AM', completed: true }, 
      { name: 'Güzelbahçe', eta: '11:15 AM', completed: false }, 
      { name: 'IZTECH Campus', eta: '12:00 PM', completed: false } 
    ] 
  },
  { 
    id: 2, 
    name: 'Sarah Demir', 
    initials: 'SD', 
    currentStatus: 'Approaching', 
    stopsRemaining: 1, 
    routeColor: '#10b981', 
    stops: [ 
      { name: 'Cesme Marina', eta: '1:00 PM', completed: false } 
    ] 
  }
];

const MOCK_PACKAGES = [
  { id: 'PKG-1001', origin: 'Warehouse A', destination: 'Güzelbahçe', courierName: 'Alex Johnson', eta: '11:15 AM', status: 'In Transit' },
  { id: 'PKG-1002', origin: 'Warehouse A', destination: 'IZTECH Campus', courierName: 'Alex Johnson', eta: '12:00 PM', status: 'In Transit' },
  { id: 'PKG-1003', origin: 'Hub 2', destination: 'Cesme Marina', courierName: 'Sarah Demir', eta: '1:00 PM', status: 'In Transit' },
  { id: 'PKG-1004', origin: 'Hub 1', destination: 'Urla Center', courierName: 'Alex Johnson', eta: '10:30 AM', status: 'Delivered' },
  { id: 'PKG-1005', origin: 'Warehouse B', destination: 'Urla Center', courierName: 'Unassigned', eta: 'Pending', status: 'Pending' }
];

export default function Dashboard() {
  const [routes] = useState(MOCK_ROUTES);
  const [couriers] = useState(MOCK_COURIERS);
  const [packages] = useState(MOCK_PACKAGES);

  return (
    <div className="dashboard-container">
      <header className="dashboard-page-header">
        <h1>Live Dispatch Map</h1>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-map-section">
          <MapViewer routes={routes} />
        </section>

        <section className="dashboard-couriers-section">
          <h2 className="section-title">Active Fleet</h2>
          <CourierList couriers={couriers} />
        </section>

        <section className="dashboard-packages-section">
          <h2 className="section-title">Global Manifest</h2>
          <PackageList packages={packages} />
        </section>
      </main>
    </div>
  );
}
