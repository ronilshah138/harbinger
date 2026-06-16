import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Map from './pages/Map';
import Commodity from './pages/Commodity';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-brand-bg text-slate-100">
        
        {/* Navigation Navbar with glassmorphism */}
        <header className="sticky top-0 z-[2000] border-b border-brand-border bg-brand-bg/85 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition duration-300">⚓</span>
                <span className="text-lg font-extrabold tracking-wider font-display bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  HARBINGER
                </span>
              </Link>

              {/* Main Navigation Links */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `transition hover:text-indigo-400 ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/map" 
                  className={({ isActive }) => 
                    `transition hover:text-indigo-400 ${isActive ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`
                  }
                >
                  Vessel Map
                </NavLink>
              </nav>
            </div>

            {/* Commodities Quick Navigation Dropdown/Selector */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline-block">
                Commodities:
              </span>
              <div className="flex gap-2">
                {['gold', 'silver', 'oil', 'copper'].map((comm) => (
                  <NavLink
                    key={comm}
                    to={`/commodity/${comm}`}
                    className={({ isActive }) =>
                      `text-xs px-2.5 py-1 rounded-md border font-semibold transition capitalize ${
                        isActive 
                          ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30' 
                          : 'bg-slate-900 border-brand-border text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`
                    }
                  >
                    {comm}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="/commodity/:name" element={<Commodity />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t border-brand-border py-6 mt-16 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>⚓</span>
              <span>© {new Date().getFullYear()} Harbinger Shipping Intelligence. All rights reserved.</span>
            </div>
            <div className="flex gap-6">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-glow animate-pulse"></span>
                API v1.0 Live
              </span>
              <span>Supabase Postgres</span>
              <span>XGBoost Retrainer v2.1</span>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}
