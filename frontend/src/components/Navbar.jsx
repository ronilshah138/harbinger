import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './Logo';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-[100] h-16 flex items-center justify-between px-6 lg:px-10"
      style={{
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}
    >
      <div className="flex items-center gap-12 h-full">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo variant="full" />
        </Link>
        <nav className="hidden md:flex gap-8 h-full">
          <NavLink 
            to="/" 
            className={({isActive}) => `flex items-center h-full text-sm font-medium transition-all ${
              isActive 
                ? "text-brand-accentBlue border-b-2 border-brand-accentBlue [text-shadow:0_0_10px_rgba(99,179,237,0.5)]" 
                : "text-brand-textSecondary hover:text-brand-textPrimary"
            }`}
            end
          >
            Overview
          </NavLink>
          <NavLink 
            to="/map" 
            className={({isActive}) => `flex items-center h-full text-sm font-medium transition-all ${
              isActive 
                ? "text-brand-accentBlue border-b-2 border-brand-accentBlue [text-shadow:0_0_10px_rgba(99,179,237,0.5)]" 
                : "text-brand-textSecondary hover:text-brand-textPrimary"
            }`}
          >
            Vessel Map
          </NavLink>
          <NavLink 
            to="/commodities" 
            className={({isActive}) => `flex items-center h-full text-sm font-medium transition-all ${
              isActive 
                ? "text-brand-accentBlue border-b-2 border-brand-accentBlue [text-shadow:0_0_10px_rgba(99,179,237,0.5)]" 
                : "text-brand-textSecondary hover:text-brand-textPrimary"
            }`}
          >
            Commodities
          </NavLink>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Vessel Count Badge */}
        <div className="hidden sm:flex items-center gap-2 glass px-3 py-1.5 !rounded-full">
          <span className="text-brand-textPrimary text-xs font-medium">500 vessels</span>
        </div>
        {/* Live Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-accentBlue animate-pulse shadow-[0_0_8px_#63B3ED]"></div>
          <span className="text-xs font-bold text-brand-accentBlue uppercase tracking-wider">Live</span>
        </div>
      </div>
    </header>
  );
}
