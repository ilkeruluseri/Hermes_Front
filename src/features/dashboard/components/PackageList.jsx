import React, { useState } from 'react';
import './PackageList.css';

export default function PackageList({ packages }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPackages = packages.filter(pkg => 
    pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.courierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="package-list-container glass-panel">
      <div className="package-list-header">
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search manifests, origins, destinations, couriers..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="package-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Courier</th>
              <th>ETA</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackages.length > 0 ? (
              filteredPackages.map(pkg => (
                <tr key={pkg.id}>
                  <td className="font-mono">{pkg.id}</td>
                  <td>{pkg.origin}</td>
                  <td>{pkg.destination}</td>
                  <td>
                    <span className={`courier-chip ${pkg.courierName === 'Unassigned' ? 'unassigned' : ''}`}>
                      {pkg.courierName}
                    </span>
                  </td>
                  <td className="eta-cell">{pkg.eta}</td>
                  <td>
                    <span className={`status-badge status-${pkg.status.toLowerCase().replace(' ', '-')}`}>
                      {pkg.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-results">
                  No packages found matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
