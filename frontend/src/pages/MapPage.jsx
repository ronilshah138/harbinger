import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { getVessels } from '../services/api';

const CHOKEPOINTS = [
  { name: 'Persian Gulf', bounds: [[24, 50], [30, 56]] },
  { name: 'Strait of Malacca', bounds: [[1, 103], [5, 105]] },
  { name: 'Red Sea', bounds: [[12, 42], [30, 32]] },
  { name: 'North Sea', bounds: [[51, 1], [60, 4]] }
];

export default function MapPage() {
  const [vessels, setVessels] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    let isMounted = true;
    const fetchVesselData = async () => {
      const data = await getVessels();
      if (isMounted && data) {
        setVessels(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    };
    
    fetchVesselData();
    const timer = setInterval(fetchVesselData, 30000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const totalVessels = vessels.length;
  const movingVessels = vessels.filter(v => v.speed > 1.0).length;
  const avgSpeed = totalVessels > 0 
    ? (vessels.reduce((acc, v) => acc + (v.speed || 0), 0) / totalVessels).toFixed(1) 
    : 0;

  const chokepointCounts = CHOKEPOINTS.map(cp => {
    const count = vessels.filter(v => {
      const latMin = Math.min(cp.bounds[0][0], cp.bounds[1][0]);
      const latMax = Math.max(cp.bounds[0][0], cp.bounds[1][0]);
      const lonMin = Math.min(cp.bounds[0][1], cp.bounds[1][1]);
      const lonMax = Math.max(cp.bounds[0][1], cp.bounds[1][1]);
      return v.lat >= latMin && v.lat <= latMax && v.lon >= lonMin && v.lon <= lonMax;
    }).length;
    return { name: cp.name, count };
  });

  const getMarkerColor = (speed) => {
    if (speed < 1) return 'rgba(99,179,237,0.4)';
    if (speed < 5) return 'rgba(99,179,237,0.7)';
    if (speed < 15) return '#63B3ED';
    return '#9F7AEA';
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex-1 bg-obsidian">
      {/* Overlay Panel Top Left */}
      <div className="absolute top-6 left-6 z-[400] w-80 glass p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-brand-textSecondary text-[10px] font-bold tracking-widest uppercase mb-2">Global Fleet</h2>
          <div className="text-5xl font-bold font-display text-white drop-shadow-[0_0_20px_rgba(99,179,237,0.3)]">
            {totalVessels}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-brand-textSecondary text-[10px] uppercase tracking-wider mb-1">Avg Speed</div>
            <div className="text-xl font-bold font-display text-white">{avgSpeed} kn</div>
          </div>
          <div>
            <div className="text-brand-textSecondary text-[10px] uppercase tracking-wider mb-1">In Transit</div>
            <div className="text-xl font-bold font-display text-white">{movingVessels}</div>
          </div>
        </div>

        <div className="h-px bg-white/10 w-full my-2"></div>

        <div>
          <h2 className="text-brand-textSecondary text-[10px] font-bold tracking-widest uppercase mb-4">Key Chokepoints</h2>
          <div className="flex flex-col gap-3">
            {chokepointCounts.map(cp => (
              <div key={cp.name} className="flex justify-between items-center">
                <span className="text-sm text-brand-textPrimary font-medium">{cp.name}</span>
                <span className="text-brand-accentBlue font-bold text-sm bg-brand-accentBlueDim px-2 py-0.5 rounded">{cp.count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-2 text-xs text-brand-textSecondary flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-success animate-pulse"></div>
          Last sync: {lastUpdated}
        </div>
      </div>

      {/* Legend Bottom Right */}
      <div className="absolute bottom-6 right-6 z-[400] glass p-4 flex flex-col gap-3">
        <div className="text-[10px] font-bold tracking-widest uppercase text-brand-textSecondary mb-1">Vessel Speed</div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(99,179,237,0.4)' }}></div>
          <span>Anchored (0-1 kn)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(99,179,237,0.7)' }}></div>
          <span>Slow (1-5 kn)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#63B3ED' }}></div>
          <span>Transit (5-15 kn)</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9F7AEA' }}></div>
          <span>Fast (15+ kn)</span>
        </div>
      </div>

      {/* Map */}
      <MapContainer 
        center={[20, 0]} 
        zoom={3} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {vessels.map((vessel, idx) => {
          const speed = vessel.speed || 0;
          const color = getMarkerColor(speed);
          return (
            <CircleMarker
              key={vessel.mmsi || idx}
              center={[vessel.lat, vessel.lon]}
              radius={4}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 1,
                weight: 0
              }}
            >
              <Popup className="glass-popup">
                <div className="font-sans text-brand-textPrimary">
                  <div className="font-bold text-sm mb-1 text-white">{vessel.vessel_name || `MMSI: ${vessel.mmsi}`}</div>
                  <div className="text-xs space-y-1 text-brand-textSecondary">
                    {vessel.vessel_name && <div><span className="opacity-70">MMSI:</span> {vessel.mmsi}</div>}
                    <div><span className="opacity-70">Speed:</span> {speed.toFixed(1)} kn</div>
                    <div><span className="opacity-70">Heading:</span> {vessel.heading ? `${vessel.heading}°` : 'Unknown'}</div>
                    {vessel.cargo_type && <div><span className="opacity-70">Cargo:</span> {vessel.cargo_type}</div>}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Custom CSS for Popup */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          background: rgba(10,10,15,0.85) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(20px) !important;
          border-radius: 12px !important;
          color: #F0F4FF !important;
          box-shadow: 0 0 20px rgba(99,179,237,0.1) !important;
        }
        .leaflet-popup-tip {
          background: rgba(10,10,15,0.85) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
      `}} />
    </div>
  );
}
