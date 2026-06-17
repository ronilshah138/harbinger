import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  getCommodityPrices, 
  getPrediction, 
  getMarketImpact,
  triggerRetrain
} from '../services/api';

const DISPLAY_NAMES = {
  gold: 'Gold', silver: 'Silver', oil: 'Crude Oil', copper: 'Copper',
  platinum: 'Platinum', palladium: 'Palladium', natural_gas: 'Natural Gas',
  aluminum: 'Aluminum', wheat: 'Wheat', corn: 'Corn', soybeans: 'Soybeans'
};

const CircularProgress = ({ percentage }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48" cy="48" r={radius}
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
          fill="transparent"
        />
        <circle
          cx="48" cy="48" r={radius}
          stroke="#63B3ED"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold font-display text-white">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default function CommodityDetail() {
  const { name } = useParams();
  const [data, setData] = useState({
    prices: [],
    prediction: null,
    marketImpact: null,
    loading: true
  });
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      const [prices, prediction, marketImpact] = await Promise.all([
        getCommodityPrices(name),
        getPrediction(name),
        getMarketImpact(name)
      ]);
      
      if (isMounted) {
        const chartData = (prices || []).slice(0, 168).reverse().map(p => ({
          ...p,
          timestampStr: new Date(p.timestamp).toLocaleDateString(undefined, { 
            month: 'short', day: 'numeric', hour: '2-digit' 
          })
        }));
        
        setData({
          prices: chartData,
          prediction,
          marketImpact,
          loading: false
        });
      }
    };
    
    fetchData();
    return () => { isMounted = false; };
  }, [name]);

  const handleRetrain = async () => {
    setRetraining(true);
    await triggerRetrain(name);
    setTimeout(() => setRetraining(false), 2000);
  };

  if (data.loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian">
        <div className="glass p-8 flex flex-col items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-full border-t-2 border-brand-accentBlue animate-spin"></div>
          <span className="text-brand-textSecondary text-sm font-medium uppercase tracking-widest">Ingesting Data Streams...</span>
        </div>
      </div>
    );
  }

  const { prices, prediction, marketImpact } = data;
  const commodityName = DISPLAY_NAMES[name] || name;
  const currentPrice = prices.length > 0 ? prices[prices.length - 1].price : (prediction?.current_price || 0);

  const pctChange = prediction?.price_change_pct || 0;
  const isUp = pctChange > 0;
  const predictedPrice = prediction?.predicted_price || 0;
  const confidence = prediction?.confidence || 0;

  const rippleScore = marketImpact?.overall_ripple_score || 0;
  const affectedAssets = (marketImpact?.affected_assets || []).slice(0, 5);

  const vesselCount = prediction?.vessel_count || 120;
  const avgSpeed = prediction?.avg_speed || 12.5;
  const movingRatio = prediction?.moving_vessel_ratio || 0.85;
  
  const hourlyVessels = Array.from({ length: 24 }).map((_, i) => ({
    hour: `${i}h`,
    count: vesselCount
  }));

  return (
    <div className="flex-1 bg-obsidian py-8 px-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Navigation & Header */}
        <div>
          <Link to="/commodities" className="text-brand-accentBlue hover:text-white transition-colors text-sm font-medium flex items-center gap-2 mb-4">
            ← Back to Commodities
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold font-display text-white">{commodityName}</h1>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-brand-textSecondary text-xs uppercase tracking-widest font-bold">Live Stream</div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT COLUMN - 60% */}
          <div className="flex flex-col gap-6 lg:w-3/5">
            
            {/* Price Chart */}
            <div className="glass p-6 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-lg font-bold text-white font-display mb-1">{commodityName} — 7 Day Price History</h2>
                  <div className="text-brand-textSecondary text-sm">Real-time market ingestion</div>
                </div>
                <div className="text-3xl font-bold font-display text-white">
                  ${currentPrice.toFixed(2)}
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prices}>
                    <defs>
                      <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgba(99,179,237,0.3)" stopOpacity={1}/>
                        <stop offset="95%" stopColor="rgba(99,179,237,0)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="timestampStr" 
                      stroke="#4A5568" 
                      fontSize={11}
                      tickLine={false}
                      minTickGap={50}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#4A5568" 
                      fontSize={11}
                      tickFormatter={(val) => `$${val}`}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(10,10,15,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#F0F4FF' }}
                      itemStyle={{ color: '#63B3ED' }}
                      labelStyle={{ color: '#8892A4', marginBottom: '8px' }}
                      formatter={(value) => [`$${value.toFixed(2)}`, 'Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#63B3ED" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#blueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Shipping Signals */}
            <div className="glass p-6">
              <h2 className="text-[10px] font-bold text-brand-accentPurple tracking-widest uppercase mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-brand-accentPurple rounded-full animate-pulse"></span>
                Shipping Intelligence
              </h2>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-brand-textSecondary text-[10px] uppercase tracking-wider mb-1">Vessel Count</div>
                  <div className="text-2xl font-bold font-display text-white">{vesselCount}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-brand-textSecondary text-[10px] uppercase tracking-wider mb-1">Avg Speed</div>
                  <div className="text-2xl font-bold font-display text-white">{avgSpeed.toFixed(1)} kn</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="text-brand-textSecondary text-[10px] uppercase tracking-wider mb-1">In Transit</div>
                  <div className="text-2xl font-bold font-display text-white">{(movingRatio * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div>
                <div className="text-brand-textSecondary text-xs mb-4">Hourly Vessel Activity (24h)</div>
                <div className="h-[100px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyVessels}>
                      <Bar dataKey="count" fill="#63B3ED" radius={[2, 2, 0, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>

          {/* RIGHT COLUMN - 40% */}
          <div className="flex flex-col gap-6 lg:w-2/5">
            
            {/* ML Prediction */}
            <div className="glass p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-[10px] font-bold text-brand-accentBlue tracking-widest uppercase mb-6">24H Forecast</h2>
                
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-[40px] font-bold font-display text-white leading-none drop-shadow-[0_0_15px_rgba(99,179,237,0.2)] mb-3">
                      ${predictedPrice.toFixed(2)}
                    </div>
                    <div className={`inline-flex items-center gap-2 text-lg font-bold px-3 py-1 rounded-md ${isUp ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>
                      <span>{isUp ? '▲' : '▼'}</span>
                      <span>{Math.abs(pctChange).toFixed(2)}%</span>
                    </div>
                  </div>
                  <CircularProgress percentage={confidence} />
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6 text-sm text-brand-textSecondary flex justify-between items-center">
                  <span>Prediction window:</span>
                  <span className="text-white font-medium">24 hours</span>
                </div>
              </div>
              
              <button 
                onClick={handleRetrain}
                disabled={retraining}
                className="btn-glass w-full text-sm uppercase tracking-wider py-3"
              >
                {retraining ? 'Retraining...' : 'Retrain Model'}
              </button>
            </div>

            {/* Market Impact */}
            <div className="glass p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[10px] font-bold text-brand-textSecondary tracking-widest uppercase mb-1">Cross-Asset Ripple</h2>
                  <div className="text-white font-medium">Market Impact</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-display text-brand-accentPurple">{rippleScore.toFixed(0)}<span className="text-sm text-brand-textSecondary">/100</span></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {affectedAssets.length > 0 ? affectedAssets.map(asset => {
                  const impactIsUp = asset.estimated_impact_pct > 0;
                  return (
                    <div key={asset.ticker} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-sm">{asset.ticker}</span>
                          <span className="text-xs text-brand-textSecondary truncate max-w-[100px] hidden sm:block">{asset.name}</span>
                        </div>
                        <span className={`font-bold text-sm ${impactIsUp ? 'text-brand-success' : 'text-brand-danger'}`}>
                          {impactIsUp ? '+' : ''}{asset.estimated_impact_pct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-black/30 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-accentBlue h-full opacity-80 shadow-[0_0_8px_#63B3ED]" 
                          style={{ width: `${Math.abs(asset.correlation) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-6 text-brand-textSecondary text-sm">
                    No correlated assets.
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center text-xs text-brand-textSecondary border-t border-white/10 pt-4">
                Powered by live shipping data
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
