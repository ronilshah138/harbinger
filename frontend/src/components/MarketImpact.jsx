import React, { useState } from 'react';
import { triggerPrediction } from '../services/api';

export default function MarketImpact({ commodity, predictionData, onTriggerComplete }) {
  const [isTraining, setIsTraining] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!predictionData || !predictionData.prediction || !predictionData.market_impact) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 h-[450px] flex items-center justify-center">
        <span className="text-slate-400">Loading ML Forecasts...</span>
      </div>
    );
  }

  const { prediction, market_impact } = predictionData;

  const handleRetrain = async () => {
    setIsTraining(true);
    setStatusMsg('Triggering training task...');
    
    const res = await triggerPrediction(commodity);
    setStatusMsg(res.message);

    setTimeout(() => {
      setIsTraining(false);
      setStatusMsg('');
      if (onTriggerComplete) onTriggerComplete();
    }, 2000);
  };

  // Color code asset sentiment texts
  const getSentimentStyle = (sentiment) => {
    if (sentiment === 'positive') return 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10';
    if (sentiment === 'negative') return 'text-rose-400 bg-rose-500/5 border-rose-500/10';
    return 'text-slate-300 bg-slate-800 border-slate-700/50';
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-[450px]">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-brand-border mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
            ML Predictions & Impact
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-900 border border-brand-border px-2 py-0.5 rounded text-slate-400 font-mono">
              Conf: {(prediction.confidence * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
              24H Predictor
            </span>
          </div>
        </div>

        {/* Forecast Card values */}
        <div className="bg-slate-900/40 p-4 rounded-xl border border-brand-border mb-4">
          <div className="flex justify-between items-baseline">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Predicted Close (+24H)</span>
              <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
                ${prediction.predicted_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 uppercase block">Confidence Interval</span>
              <span className="text-xs font-mono text-indigo-300 font-semibold block mt-1">
                ${prediction.confidence_low} - ${prediction.confidence_high}
              </span>
            </div>
          </div>
        </div>

        {/* Affected Assets list with individual progress bars */}
        <div className="space-y-3">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Affected Assets & Ripple Risk
          </span>

          <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin">
            {market_impact.affected_assets.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-2.5 rounded-xl border flex flex-col gap-2 ${getSentimentStyle(item.sentiment)}`}
              >
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>⚓ {item.asset}</span>
                  <span className="font-mono font-bold">Ripple: {item.ripple_score}</span>
                </div>
                
                {/* Ripple Score Progress Bar */}
                <div className="w-full bg-slate-950/60 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.sentiment === 'positive' ? 'bg-emerald-500' : item.sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-500'
                    }`}
                    style={{ width: `${item.ripple_score * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retrain Action footer */}
      <div className="border-t border-brand-border pt-4 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
            {statusMsg || `Updated: ${new Date(prediction.created_at).toLocaleTimeString()}`}
          </span>

          <button
            onClick={handleRetrain}
            disabled={isTraining}
            className={`text-xs px-4 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              isTraining
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold'
            }`}
          >
            {isTraining ? 'Training...' : 'Retrain Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}
