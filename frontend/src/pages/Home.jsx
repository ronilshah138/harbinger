import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPrices, getPrediction } from '../services/api';

const COMMODITIES = ['gold', 'silver', 'oil', 'copper'];

export default function Home() {
  const [cardsData, setCardsData] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const dataObj = {};
      for (const comm of COMMODITIES) {
        const prices = await getPrices(comm);
        const prediction = await getPrediction(comm);
        dataObj[comm] = {
          prices,
          prediction
        };
      }
      setCardsData(dataObj);
    } catch (err) {
      console.error("Failed loading home dashboard cards", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getCardColor = (comm) => {
    switch (comm) {
      case 'gold': return 'border-amber-500/20 hover:border-amber-500/40 text-amber-500';
      case 'silver': return 'border-slate-500/20 hover:border-slate-500/40 text-slate-400';
      case 'oil': return 'border-emerald-500/20 hover:border-emerald-500/40 text-emerald-500';
      case 'copper': return 'border-orange-500/20 hover:border-orange-500/40 text-orange-500';
      default: return 'border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-brand-border p-8 md:p-12 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/20 font-semibold tracking-wider uppercase">
            Commodity Intel
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold font-display tracking-tight text-white">
            Shipping & Telemetry Meet <span className="bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">ML Prediction</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed">
            Harbinger monitors global bulk carriers across critical sea lanes as a leading indicator to predict futures pricing before standard market reporting cycles clear.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link 
              to="/map" 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition text-sm flex items-center gap-1.5"
            >
              ⚓ Interactive Vessel Map
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Commodity Cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <span>📦</span> Commodity Ticker Summary
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMODITIES.map(c => (
              <div key={c} className="bg-brand-card border border-brand-border rounded-2xl p-6 h-40 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMMODITIES.map((comm) => {
              const item = cardsData[comm];
              if (!item) return null;

              const latestPrice = item.prices.latest.price;
              const predPrice = item.prediction.prediction.predicted_price;
              
              // Determine direction arrow based on prediction relative to current price
              const isUp = predPrice > latestPrice;
              const isDown = predPrice < latestPrice;

              return (
                <Link 
                  key={comm}
                  to={`/commodity/${comm}`}
                  className={`bg-brand-card border hover:bg-slate-900/40 rounded-2xl p-6 shadow-xl transition-all duration-300 group block relative overflow-hidden ${getCardColor(comm)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 group-hover:text-indigo-300 transition">
                      {comm}
                    </span>
                    
                    {/* Predicted Direction Indicator Tag */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Forecast:</span>
                      {isUp && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          ▲ UP
                        </span>
                      )}
                      {isDown && (
                        <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          ▼ DOWN
                        </span>
                      )}
                      {!isUp && !isDown && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          ● FLAT
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-slate-100">
                      ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">USD</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Forecast: ${predPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="font-semibold text-indigo-400 group-hover:underline">
                      Open Insights &rarr;
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Network Stats / Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Network Metrics Panel */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest pb-3 border-b border-brand-border">
            System Operations
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-slate-200">Price Ingestion</span>
                <span className="block text-[10px] text-slate-500">yfinance scheduler</span>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Online
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-slate-200">AIS WebSockets</span>
                <span className="block text-[10px] text-slate-500">stream.aisstream.io/v0</span>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Listening
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-brand-border text-xs">
              <div>
                <span className="font-semibold text-slate-200">ML Predictions</span>
                <span className="block text-[10px] text-slate-500">XGBoost Regressor</span>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Models Trained
              </span>
            </div>
          </div>
        </div>

        {/* Operational Overview description */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest pb-3 border-b border-brand-border">
            Intelligence Synopsis
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            By monitoring specific chokepoints (Persian Gulf, Strait of Malacca, Red Sea, and North Sea), Harbinger compiles real-time ship volume counts and average sailing speeds. 
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">
            The machine learning engine leverages these telemetry indices to compute congestion ratios, feeding features directly to trained gradient-boosted trees. This enables near-term predictive pricing estimates, offering shipping analysts leading indicators before standard financial clearing releases.
          </p>
        </div>
      </div>
    </div>
  );
}
