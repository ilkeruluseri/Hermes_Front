import React from 'react';
import CourierCard from './CourierCard';
import './CourierList.css';

export default function CourierList({ couriers, selectedCourierId, onSelectCourier }) {
  if (!couriers || couriers.length === 0) {
    return <div className="no-couriers text-center">No active couriers found.</div>;
  }

  return (
    <div className="courier-list-grid">
      {couriers.map(courier => (
        <CourierCard 
          key={courier.id} 
          courier={courier} 
          isSelected={selectedCourierId === courier.id} 
          onSelect={() => onSelectCourier(courier.id)} 
        />
      ))}
    </div>
  );
}
