import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const CommodityCard = ({ commodity, data, loading }) => {
  if (loading) {
    return (
      <div className="glass p-6 flex flex-col gap-4 animate-pulse">
        <div className="flex justify-between">
          <div className="w-24 h-6 bg-white/10 rounded"></div>
          <div className="w-4 h-4 bg-white/10 rounded-full"></div>
        </div>
        <div className="w-32 h-10 bg-white/10 rounded mt-2"></div>
        <div className="w-24 h-6 bg-white/10 rounded"></div>
        <div className="w-full h-1.5 bg-white/10 rounded mt-4"></div>
        <div className="w-20 h-4 bg-white/10 rounded mt-auto"></div>
      </div>
    );
  }

  const { price, prediction } = data || {};
  const currentPrice = price?.price || prediction?.current_price || 0;
  const pctChange = prediction?.price_change_pct || 0;
  const isUp = pctChange > 0;
  const predictedPrice = prediction?.predicted_price || 0;
  const confidence = prediction?.confidence || 0;

  return (
    <div className="glass p-6 flex flex-col relative group">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ICONS[commodity]}</span>
          <span className="font-bold text-white text-lg">{DISPLAY_NAMES[commodity]}</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_8px_#48BB78]"></div>
      </div>
      
      <div className="flex items-end justify-between mb-4">
        <div className="text-[28px] font-bold font-display text-white leading-none">
          ${currentPrice.toFixed(2)}
        </div>
        <div className={`text-xs font-bold px-2.5 py-1 rounded-md ${isUp ? 'bg-brand-success/20 text-brand-success' : 'bg-brand-danger/20 text-brand-danger'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
        </div>
      </div>

      <div className="text-sm text-brand-textSecondary mb-6">
        → ${predictedPrice.toFixed(2)} in 24h
      </div>

      <div className="mt-auto">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-textSecondary mb-1.5 font-bold">
          <span>Confidence</span>
          <span className="text-brand-accentBlue">{confidence.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-6">
          <div 
            className="bg-brand-accentBlue h-full transition-all duration-1000 shadow-[0_0_10px_#63B3ED]" 
            style={{ width: `${confidence}%` }}
          ></div>
        </div>
        
        <Link to={`/commodity/${commodity}`} className="text-sm font-bold text-brand-accentBlue hover:text-white transition-colors flex items-center gap-2 group-hover:gap-3">
          Analyze <span>→</span>
        </Link>
      </div>
    </div>
  );
};

export default function CommoditiesPage() {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('All');
  const [sortBy, setSortBy] = useState('Name');

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      const results = {};
      const promises = COMMODITIES_LIST.map(async (c) => {
        const [priceData, predData] = await Promise.all([
          getLatestPrice(c),
          getPrediction(c)
        ]);
        results[c] = { price: priceData, prediction: predData };
      });
      await Promise.all(promises);
      if (isMounted) {
        setDataMap(results);
        setLoading(false);
      }
    };
    fetchAll();
    return () => { isMounted = false; };
  }, []);

  const filteredList = COMMODITIES_LIST.filter(c => {
    const nameMatch = DISPLAY_NAMES[c].toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;
    
    if (filterDirection === 'All') return true;
    const pctChange = dataMap[c]?.prediction?.price_change_pct || 0;
    if (filterDirection === 'Up') return pctChange > 0;
    if (filterDirection === 'Down') return pctChange < 0;
    return true;
  }).sort((a, b) => {
    if (loading) return 0;
    const dataA = dataMap[a];
    const dataB = dataMap[b];
    
    if (sortBy === 'Price') {
      const priceA = dataA?.price?.price || dataA?.prediction?.current_price || 0;
      const priceB = dataB?.price?.price || dataB?.prediction?.current_price || 0;
      return priceB - priceA;
    }
    if (sortBy === 'Change') {
      const chgA = dataA?.prediction?.price_change_pct || 0;
      const chgB = dataB?.prediction?.price_change_pct || 0;
      return Math.abs(chgB) - Math.abs(chgA);
    }
    if (sortBy === 'Confidence') {
      const confA = dataA?.prediction?.confidence || 0;
      const confB = dataB?.prediction?.confidence || 0;
      return confB - confA;
    }
    return DISPLAY_NAMES[a].localeCompare(DISPLAY_NAMES[b]);
  });

  return (
    <div className="flex-1 bg-obsidian py-12 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-display text-white mb-3">Commodity Intelligence</h1>
          <p className="text-brand-textSecondary text-lg max-w-2xl">
            Live prices and 24h ML forecasts across 11 global commodities
          </p>
        </div>

        {/* Filters/Sort Bar */}
        <div className="glass p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <input 
            type="text" 
            placeholder="Search commodities..."
            className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-accentBlue transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
              {['All', 'Up', 'Down'].map(dir => (
                <button 
                  key={dir}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${filterDirection === dir ? 'bg-brand-accentBlue text-obsidian' : 'text-brand-textSecondary hover:text-white'}`}
                  onClick={() => setFilterDirection(dir)}
                >
                  {dir}
                </button>
              ))}
            </div>
            
            <select 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-brand-accentBlue appearance-none min-w-[140px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Name">Sort by Name</option>
              <option value="Price">Sort by Price</option>
              <option value="Change">Sort by Volatility</option>
              <option value="Confidence">Sort by Confidence</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredList.map(c => (
            <CommodityCard 
              key={c} 
              commodity={c} 
              data={dataMap[c]} 
              loading={loading} 
            />
          ))}
          {filteredList.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-brand-textSecondary">
              No commodities match your filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
