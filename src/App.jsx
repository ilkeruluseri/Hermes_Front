import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './features/core/components/Layout';
import Dashboard from './features/dashboard/components/Dashboard';
import AnalyticsDashboard from './features/analytics/components/AnalyticsDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}