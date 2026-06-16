import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPrices, getPrediction } from '../services/api';
import PriceDashboard from '../components/PriceDashboard';
import MarketImpact from '../components/MarketImpact';

const VALID_COMMODITIES = ['gold', 'silver', 'oil', 'copper'];

export default function Commodity() {
  const { name } = useParams();
  const commodity = name?.toLowerCase();
  
  const [priceData, setPriceData] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!VALID_COMMODITIES.includes(commodity)) {
      setError(`Commodity '${name}' is not supported. Please select Gold, Silver, Oil, or Copper.`);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const priceRes = await getPrices(commodity);
      const predictionRes = await getPrediction(commodity);
      
      setPriceData(priceRes);
      setPredictionData(predictionRes);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch data from Harbinger intelligence service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [commodity]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <span className="w-8 h-8 rounded-full border-4 border-indigo-600/30 border-t-indigo-500 animate-spin"></span>
        <p className="text-slate-400 text-sm">Querying Harbinger Intelligence Core...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl">
          <p className="font-semibold text-lg">⚠️ Analysis Blocked</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
        <Link 
          to="/" 
          className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold px-6 py-2.5 rounded-xl transition text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Get dynamic textual analysis insights
  const getInsights = (comm) => {
    switch (comm) {
      case 'gold':
        return 'Our ML models suggest bullion transport routing through standard European security hubs remains steady. Minor congestions at Singapore transshipment docks are currently elevating the gold ripple score, indicating tight short-term supply capacity.';
      case 'silver':
        return 'Silver concentrate bulk movements have slowed down along Asian shipping lines. The resulting supply-side compression is forecasted to maintain a bullish pressure on prices over the next 24 hours.';
      case 'oil':
        return 'A high volume of tankers entering the Strait of Malacca has triggered an elevated Ripple Score. This concentration of cargo represents high short-term inventory clearances, predicting potential near-term price softening.';
      case 'copper':
        return 'LME copper inventory volumes continue to fluctuate. Recent bulk carrier dockings at Port of Shanghai show a significant unloading surge, reflecting potential oversupply in global copper manufacturing hubs.';
      default:
        return 'Physical supply flow telemetry is actively being compiled. Watch the vessel routing and retrain models to update predictions.';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header breadcrumb & title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-indigo-400 mb-1.5 font-semibold">
            <Link to="/" className="hover:underline">Dashboard</Link>
            <span>&rarr;</span>
            <span className="text-slate-400 capitalize">{commodity}</span>
          </div>
          <h1 className="text-3xl font-extrabold font-display text-white capitalize flex items-center gap-3">
            <span>{commodity === 'gold' ? '🪙' : commodity === 'silver' ? '🥈' : commodity === 'oil' ? '🛢️' : '🧱'}</span>
            {commodity} Market Analysis
          </h1>
        </div>

        <button 
          onClick={loadData}
          className="self-start md:self-auto bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition"
        >
          🔄 Refresh Forecasts
        </button>
      </div>

      {/* Main Grid Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PriceDashboard commodity={commodity} priceData={priceData} />
        <MarketImpact commodity={commodity} predictionData={predictionData} onTriggerComplete={loadData} />
      </div>

      {/* Narrative Insights Panel */}
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest pb-3 border-b border-brand-border mb-4">
          Supply Flow Intelligence Insights
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed">
          {getInsights(commodity)}
        </p>
      </div>
    </div>
  );
}
