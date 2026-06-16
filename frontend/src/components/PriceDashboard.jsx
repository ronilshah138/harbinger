import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  ReferenceArea
} from 'recharts';

const COMMODITIES = ['gold', 'silver', 'oil', 'copper'];

export default function PriceDashboard({ commodity, priceData, predictionData }) {
  const navigate = useNavigate();

  if (!priceData || !priceData.history || priceData.history.length === 0) {
    return (
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 h-[450px] flex items-center justify-center">
        <span className="text-slate-400">Loading historical price trends...</span>
      </div>
    );
  }

  // Format historical price points
  const chartData = priceData.history.map((item, idx) => ({
    dateLabel: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }),
    price: item.price,
    predicted: null // Only historical price
  }));

  // Append prediction point at the end if prediction data is loaded
  let predLow = null;
  let predHigh = null;
  let lastHistDate = '';
  let predDate = '';

  if (predictionData && predictionData.prediction) {
    const predVal = predictionData.prediction.predicted_price;
    predLow = predictionData.prediction.confidence_low;
    predHigh = predictionData.prediction.confidence_high;

    // Last historical index
    const lastHist = chartData[chartData.length - 1];
    lastHistDate = lastHist.dateLabel;
    
    // Connect historical line to prediction starting point
    lastHist.predicted = lastHist.price;

    // Create prediction date label
    const pDate = new Date(predictionData.prediction.created_at);
    pDate.setHours(pDate.getHours() + predictionData.prediction.horizon_hours);
    predDate = pDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' }) + ' (FC)';

    // Append forecasted node
    chartData.push({
      dateLabel: predDate,
      price: null,
      predicted: predVal
    });
  }

  const latestPrice = priceData.latest.price;
  const initialPrice = priceData.history[0].price;
  const priceDiff = latestPrice - initialPrice;
  const pctChange = ((priceDiff / initialPrice) * 100).toFixed(2);
  const isPositive = priceDiff >= 0;

  const getThemeColor = (comm) => {
    switch(comm.toLowerCase()) {
      case 'gold': return '#f59e0b';
      case 'oil': return '#10b981';
      case 'copper': return '#ea580c';
      case 'silver': return '#9ca3af';
      default: return '#3b82f6';
    }
  };

  const themeColor = getThemeColor(commodity);

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl flex flex-col justify-between h-[450px]">
      
      {/* Commodity Switcher Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4 mb-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Active Commodity Index
          </span>
          <h2 className="text-xl font-extrabold text-white capitalize flex items-center gap-2 mt-0.5">
            <span>{commodity === 'gold' ? '🪙' : commodity === 'silver' ? '🥈' : commodity === 'oil' ? '🛢️' : '🧱'}</span>
            {commodity} Market
          </h2>
        </div>

        <div className="flex bg-slate-900/60 p-1 rounded-lg border border-brand-border self-start sm:self-auto">
          {COMMODITIES.map((comm) => (
            <button
              key={comm}
              onClick={() => navigate(`/commodity/${comm}`)}
              className={`text-xs px-3 py-1 rounded-md font-semibold transition capitalize ${
                commodity === comm 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {comm}
            </button>
          ))}
        </div>
      </div>

      {/* Header Price stats */}
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold font-mono text-slate-100">
          ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className="text-xs text-slate-400">USD</span>
        <span className={`text-xs ml-3 font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(pctChange)}% (7d)
        </span>
      </div>

      {/* Recharts graph */}
      <div className="flex-1 min-h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.4} />
            <XAxis 
              dataKey="dateLabel" 
              stroke="#6b7280" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={9} 
              tickLine={false} 
              axisLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '8px' }}
              labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            
            {/* Shaded confidence band for predictions */}
            {predLow && predHigh && (
              <ReferenceArea 
                x1={lastHistDate} 
                x2={predDate} 
                y1={predLow} 
                y2={predHigh} 
                fill={themeColor} 
                fillOpacity={0.08} 
              />
            )}

            {/* Historical price line */}
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={themeColor} 
              strokeWidth={2.5} 
              dot={false}
              activeDot={{ r: 5 }}
            />

            {/* Forecast dashed line */}
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke={themeColor} 
              strokeWidth={2} 
              strokeDasharray="4 4"
              dot={{ r: 4, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Prediction legend indicator */}
      {predictionData && (
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-brand-border text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ backgroundColor: themeColor }}></span>
            <span>Historical Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed" style={{ borderColor: themeColor }}></span>
            <span>ML Forecast (+24H)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3 opacity-20 rounded" style={{ backgroundColor: themeColor }}></span>
            <span>Confidence Interval</span>
          </div>
        </div>
      )}
    </div>
  );
}
