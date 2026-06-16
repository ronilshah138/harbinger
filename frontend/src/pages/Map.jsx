import React from 'react';
import ShipMap from '../components/ShipMap';

export default function Map() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-white">
          🚢 Live Maritime Telemetry
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time tracking of bulk carriers traversing major global shipping chokepoints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Chokepoint Reference Panel */}
        <div className="lg:col-span-1 bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest pb-2 border-b border-brand-border">
            Monitored Chokepoints
          </h3>

          <div className="space-y-4">
            <div className="p-3 bg-slate-900/40 border border-brand-border rounded-xl">
              <span className="text-xs font-bold text-emerald-400 block">🛢️ Persian Gulf chokepoint</span>
              <span className="text-[10px] text-slate-400 block mt-1">Boundaries: 48°E - 60°E, 22°N - 28°N</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Primary Cargo: Crude Oil</span>
            </div>

            <div className="p-3 bg-slate-900/40 border border-brand-border rounded-xl">
              <span className="text-xs font-bold text-orange-400 block">🧱 Strait of Malacca chokepoint</span>
              <span className="text-[10px] text-slate-400 block mt-1">Boundaries: 99°E - 105°E, 1°N - 6°N</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Primary Cargo: Copper / Crude Oil</span>
            </div>

            <div className="p-3 bg-slate-900/40 border border-brand-border rounded-xl">
              <span className="text-xs font-bold text-amber-500 block">🪙 Red Sea chokepoint</span>
              <span className="text-[10px] text-slate-400 block mt-1">Boundaries: 32°E - 44°E, 12°N - 22°N</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Primary Cargo: Gold Bullion</span>
            </div>

            <div className="p-3 bg-slate-900/40 border border-brand-border rounded-xl">
              <span className="text-xs font-bold text-slate-400 block">🌊 North Sea chokepoint</span>
              <span className="text-[10px] text-slate-400 block mt-1">Boundaries: -4°E - 9°E, 51°N - 58°N</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Primary Cargo: Brent Crude / Gas</span>
            </div>
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="lg:col-span-3">
          <ShipMap />
        </div>
      </div>
    </div>
  );
}
