import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import MapPage from './pages/MapPage';
import CommoditiesPage from './pages/CommoditiesPage';
import CommodityDetail from './pages/CommodityDetail';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-obsidian text-brand-textPrimary font-sans selection:bg-brand-accentBlueDim">
        <Navbar />
        <main className="flex-1 flex flex-col relative">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/commodities" element={<CommoditiesPage />} />
            <Route path="/commodity/:name" element={<CommodityDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
