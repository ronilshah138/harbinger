import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { getLatestPrice, getPrediction } from '../services/api';

const DISPLAY_NAMES = {
  gold: 'Gold', silver: 'Silver', oil: 'Crude Oil', copper: 'Copper',
  platinum: 'Platinum', palladium: 'Palladium', natural_gas: 'Natural Gas',
  aluminum: 'Aluminum', wheat: 'Wheat', corn: 'Corn', soybeans: 'Soybeans'
};

const ICONS = {
  gold: '🥇', silver: '🥈', oil: '🛢️', copper: '🔶',
  platinum: '⚪', palladium: '🔘', natural_gas: '🔥',
  aluminum: '🪨', wheat: '🌾', corn: '🌽', soybeans: '🫘'
};

const COMMODITIES_LIST = Object.keys(DISPLAY_NAMES);

const AnchorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"></circle>
    <line x1="12" y1="22" x2="12" y2="8"></line>
    <path d="M5 12H2a10 10 0 0 0 20 0h-3"></path>
  </svg>
);
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"></path>
    <path d="M18 9l-5 5-4-4-6 6"></path>
  </svg>
);
const LightningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

export default function Landing() {
  const [tickerData, setTickerData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchTicker = async () => {
      const dataPromises = COMMODITIES_LIST.map(async (c) => {
        const [priceData, predData] = await Promise.all([
          getLatestPrice(c),
          getPrediction(c)
        ]);
        const currentPrice = priceData?.price || predData?.current_price || 0;
        const pctChange = predData?.price_change_pct || 0;
        return {
          id: c,
          name: DISPLAY_NAMES[c],
          icon: ICONS[c],
          price: currentPrice,
          pctChange: pctChange
        };
      });
      const results = await Promise.all(dataPromises);
      if (isMounted) {
        setTickerData(results);
        setLoading(false);
      }
    };
    fetchTicker();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* SECTION 1 - HERO */}
      <section 
        className="relative flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 text-center"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,179,237,0.08), transparent)'
        }}
      >
        <div className="flex flex-col items-center max-w-4xl z-10">
          <div className="glass px-4 py-1.5 rounded-full border-brand-accentBlueDim mb-8 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-accentBlue animate-pulse"></div>
            <span className="text-xs font-bold text-brand-accentBlue tracking-widest uppercase">AIS · ML · REAL-TIME</span>
          </div>
          
          <h1 className="text-5xl md:text-[72px] font-bold text-white leading-[1.1] mb-6">
            Predict Markets.<br/>Before They Move.
          </h1>
          
          <p className="text-brand-textSecondary text-lg md:text-xl max-w-2xl mb-10 leading-relaxed font-sans">
            Harbinger tracks 500+ vessels across global shipping chokepoints, using live AIS telemetry as a leading indicator for commodity price prediction.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link to="/map" className="btn-primary flex items-center justify-center gap-2">
              View Live Map <span>→</span>
            </Link>
            <Link to="/commodities" className="btn-glass flex items-center justify-center gap-2">
              Explore Predictions <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-3xl">
            <div className="glass p-4 md:p-6 flex flex-col items-center justify-center text-center">
              <div className="text-brand-accentBlue text-3xl font-bold mb-1 font-display">500+</div>
              <div className="text-brand-textPrimary text-sm font-medium">Vessels</div>
            </div>
            <div className="glass p-4 md:p-6 flex flex-col items-center justify-center text-center">
              <div className="text-brand-accentBlue text-3xl font-bold mb-1 font-display">11</div>
              <div className="text-brand-textPrimary text-sm font-medium">Commodities</div>
            </div>
            <div className="glass p-4 md:p-6 flex flex-col items-center justify-center text-center">
              <div className="text-brand-accentBlue text-3xl font-bold mb-1 font-display">24h</div>
              <div className="text-brand-textPrimary text-sm font-medium">Forecasts</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F0F4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* SECTION 2 - HOW IT WORKS */}
      <section className="py-24 px-6 bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-brand-accentBlueDim text-brand-accentBlue flex items-center justify-center mb-6">
                <AnchorIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">1. Track</h3>
              <p className="text-brand-textSecondary leading-relaxed">
                Live AIS data from 500+ vessels across Persian Gulf, Strait of Malacca, Red Sea, North Sea
              </p>
            </div>
            <div className="glass p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-brand-accentPurple/20 text-brand-accentPurple flex items-center justify-center mb-6">
                <ChartIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">2. Analyze</h3>
              <p className="text-brand-textSecondary leading-relaxed">
                XGBoost models process vessel density, speed, and congestion as leading price indicators
              </p>
            </div>
            <div className="glass p-8 flex flex-col">
              <div className="w-12 h-12 rounded-xl bg-brand-success/20 text-brand-success flex items-center justify-center mb-6">
                <LightningIcon />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">3. Predict</h3>
              <p className="text-brand-textSecondary leading-relaxed">
                24-hour price forecasts for 11 commodities with confidence scores and market impact analysis
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - LIVE PREVIEW TICKER */}
      <section className="py-12 bg-black/20 border-y border-white/5 overflow-hidden flex flex-col items-center">
        <h2 className="text-sm font-bold text-brand-textSecondary uppercase tracking-widest mb-8 text-center">Live Market Signals</h2>
        
        <div className="w-full flex overflow-x-hidden relative">
          <div className="flex animate-[scroll_40s_linear_infinite] w-max hover:[animation-play-state:paused]">
            {[...tickerData, ...tickerData].map((item, i) => (
              <div key={`${item.id}-${i}`} className="glass flex items-center gap-4 px-6 py-3 mx-3 min-w-[250px] shrink-0">
                {loading ? (
                  <div className="flex w-full items-center justify-between animate-pulse">
                    <div className="w-24 h-6 bg-white/10 rounded"></div>
                    <div className="w-12 h-6 bg-white/10 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <div className="flex-1 text-right font-display font-bold">
                      ${item.price.toFixed(2)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-md font-bold ${item.pctChange > 0 ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>
                      {item.pctChange > 0 ? '▲' : '▼'} {Math.abs(item.pctChange).toFixed(1)}%
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />
      </section>

      {/* SECTION 4 - FEATURES */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-10 group">
              <h3 className="text-2xl font-bold mb-3 text-brand-accentBlue group-hover:text-white transition-colors">Flight Radar for Ships</h3>
              <p className="text-brand-textSecondary">Real-time geospatial tracking of global maritime commodity flows.</p>
            </div>
            <div className="glass p-10 group">
              <h3 className="text-2xl font-bold mb-3 text-brand-accentPurple group-hover:text-white transition-colors">Per-Commodity ML Models</h3>
              <p className="text-brand-textSecondary">Specialized XGBoost models continuously retrained on specific asset routes.</p>
            </div>
            <div className="glass p-10 group">
              <h3 className="text-2xl font-bold mb-3 text-brand-success group-hover:text-white transition-colors">Cross-Asset Ripple Analysis</h3>
              <p className="text-brand-textSecondary">Simulate the directional impact of commodity price swings on ETFs and FX.</p>
            </div>
            <div className="glass p-10 group">
              <h3 className="text-2xl font-bold mb-3 text-brand-accentGold group-hover:text-white transition-colors">Live AIS Feed</h3>
              <p className="text-brand-textSecondary">Sub-second updates via high-frequency ingestion of Automatic Identification System data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 - FOOTER */}
      <footer className="border-t border-white/5 py-8 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="opacity-70 scale-75 origin-left">
            <Logo variant="full" />
          </div>
          <div className="text-brand-textTertiary text-sm">
            Built with live AIS data and gradient boosting.
          </div>
          <a href="#" className="text-brand-textSecondary hover:text-white transition-colors text-sm">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
