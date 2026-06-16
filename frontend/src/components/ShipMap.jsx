import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getVessels } from '../services/api';

// Create a custom SVG divIcon based on cargo type
const createVesselIcon = (cargoType) => {
  let color = '#3b82f6'; // default blue (general cargo)
  const cargo = cargoType.toLowerCase();

  if (cargo.includes('gold')) {
    color = '#f59e0b'; // Amber/Gold
  } else if (cargo.includes('oil') || cargo.includes('gas') || cargo.includes('brent')) {
    color = '#10b981'; // Emerald/Green
  } else if (cargo.includes('copper')) {
    color = '#ea580c'; // Orange/Copper
  } else if (cargo.includes('silver')) {
    color = '#9ca3af'; // Gray/Silver
  }

  const html = `
    <div style="display: flex; align-items: center; justify-content: center; position: relative;">
      <span class="absolute inline-flex h-5 w-5 rounded-full opacity-75 animate-ping" style="background-color: ${color}; opacity: 0.2;"></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="${color}" stroke="#090d16" stroke-width="2"/>
        <path d="M12 2L12 22M2 12L22 12" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity="0.3"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'vessel-marker-icon',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
};

export default function ShipMap() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVessels = async () => {
    const data = await getVessels();
    setVessels(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVessels();
    // Fetch vessels every 30 seconds
    const interval = setInterval(loadVessels, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-brand-border shadow-2xl bg-brand-card">
      <div className="absolute top-4 left-14 z-[1000] bg-brand-card/95 backdrop-blur-md px-4 py-2 rounded-lg border border-brand-border shadow-md">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          Live Maritime Map
        </h3>
        <p className="text-[10px] text-slate-400">Updates automatically every 30s</p>
      </div>

      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={true} 
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {vessels.map((vessel) => (
          <Marker
            key={vessel.mmsi}
            position={[vessel.lat, vessel.lon]}
            icon={createVesselIcon(vessel.cargo_type)}
          >
            <Popup className="custom-leaflet-popup">
              <div className="p-1 text-slate-900 font-sans">
                <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                  <h4 className="font-bold text-sm text-indigo-700">{vessel.name}</h4>
                  <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-mono text-slate-700">
                    {vessel.mmsi}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <p><span className="font-semibold text-slate-600">Cargo Type:</span> {vessel.cargo_type}</p>
                  <p><span className="font-semibold text-slate-600">Speed:</span> {vessel.speed.toFixed(1)} knots</p>
                  <p><span className="font-semibold text-slate-600">Coordinates:</span> {vessel.lat.toFixed(4)}, {vessel.lon.toFixed(4)}</p>
                  <p><span className="font-semibold text-slate-600">Reported:</span> {new Date(vessel.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
