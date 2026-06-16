import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getVessels = async () => {
  try {
    const response = await client.get('/api/vessels/');
    return response.data;
  } catch (error) {
    console.warn('Backend API offline. Using mock vessels.', error);
    return [
      { mmsi: 211281040, name: 'VULCAN CRUDE', lat: 24.5074, lon: 54.1278, speed: 12.5, heading: 210.0, cargo_type: 'Crude Oil', timestamp: new Date().toISOString() },
      { mmsi: 311000898, name: 'MALACCA EMERALD', lat: 2.8568, lon: 101.6503, speed: 14.2, heading: 125.0, cargo_type: 'Copper Ore', timestamp: new Date().toISOString() },
      { mmsi: 477432600, name: 'RED SEA EXPLORER', lat: 18.2902, lon: 38.8519, speed: 13.8, heading: 340.0, cargo_type: 'Gold Bullion', timestamp: new Date().toISOString() },
      { mmsi: 235112000, name: 'NORTH CRUSADER', lat: 54.8607, lon: 2.0011, speed: 11.7, heading: 45.0, cargo_type: 'Brent Crude', timestamp: new Date().toISOString() }
    ];
  }
};

export const getVesselHistory = async (mmsi) => {
  try {
    const response = await client.get(`/api/vessels/${mmsi}`);
    return response.data;
  } catch (error) {
    console.warn(`Backend API offline. Using mock history for ${mmsi}.`, error);
    const history = [];
    const baseLat = 15.0;
    const baseLon = 45.0;
    for (let i = 0; i < 10; i++) {
      history.push({
        mmsi: mmsi,
        name: 'TRACKED VESSEL',
        lat: baseLat + i * 0.5,
        lon: baseLon - i * 0.3,
        speed: 14.5 + Math.random() * 2,
        heading: 180,
        cargo_type: 'General Cargo',
        timestamp: new Date(Date.now() - i * 4 * 3600 * 1000).toISOString()
      });
    }
    return history;
  }
};

export const getPrices = async (commodity) => {
  try {
    const response = await client.get(`/api/prices/${commodity}`);
    return response.data;
  } catch (error) {
    console.warn(`Backend API offline. Using mock price for ${commodity}.`, error);
    const basePrice = { gold: 2350.0, silver: 29.5, oil: 82.3, copper: 4.65 }[commodity.toLowerCase()] || 100.0;
    const history = [];
    let currentPrice = basePrice;
    
    for (let i = 0; i < 7; i++) {
      currentPrice = currentPrice * (1 + (Math.random() * 0.04 - 0.02));
      history.push({
        commodity: commodity,
        price: parseFloat(currentPrice.toFixed(2)),
        currency: 'USD',
        timestamp: new Date(Date.now() - (7 - i) * 24 * 3600 * 1000).toISOString()
      });
    }

    return {
      commodity: commodity.toLowerCase(),
      latest: history[history.length - 1],
      history: history
    };
  }
};

export const getPrediction = async (commodity) => {
  try {
    const response = await client.get(`/api/predictions/${commodity}`);
    return response.data;
  } catch (error) {
    console.warn(`Backend API offline. Using mock prediction for ${commodity}.`, error);
    const basePrice = { gold: 2350.0, silver: 29.5, oil: 82.3, copper: 4.65 }[commodity.toLowerCase()] || 100.0;
    const predicted = parseFloat((basePrice * (1 + (Math.random() * 0.06 - 0.02))).toFixed(2));
    const confidence = parseFloat((0.75 + Math.random() * 0.20).toFixed(2));
    const margin = predicted * (1 - confidence) * 0.15;

    const assets = {
      gold: [
        { asset: 'Swiss Bullion Vaults', ripple_score: 3.5, sentiment: 'positive' },
        { asset: 'London Bullion Market Association (LBMA)', ripple_score: 6.8, sentiment: 'positive' },
        { asset: 'Red Sea Shipping Lanes', ripple_score: 8.2, sentiment: 'negative' }
      ],
      silver: [
        { asset: 'Comex Silver Depository', ripple_score: 4.1, sentiment: 'positive' },
        { asset: 'Shanghai Gold Exchange (SGE) Silver Vaults', ripple_score: 5.4, sentiment: 'negative' }
      ],
      oil: [
        { asset: 'Strait of Hormuz Tanker Channels', ripple_score: 9.5, sentiment: 'negative' },
        { asset: 'Cushing Oil Storage Terminal', ripple_score: 7.3, sentiment: 'positive' },
        { asset: 'North Sea Refining Terminals', ripple_score: 5.1, sentiment: 'positive' }
      ],
      copper: [
        { asset: 'LME Registered Warehouses', ripple_score: 7.8, sentiment: 'positive' },
        { asset: 'Strait of Malacca Congestion Checkpoint', ripple_score: 6.2, sentiment: 'negative' },
        { asset: 'Shanghai Port Storage Yards', ripple_score: 4.9, sentiment: 'negative' }
      ]
    }[commodity.toLowerCase()] || [{ asset: 'Global Logistics Hub', ripple_score: 5.0, sentiment: 'neutral' }];

    return {
      prediction: {
        commodity: commodity.toLowerCase(),
        predicted_price: predicted,
        confidence: confidence,
        confidence_low: parseFloat((predicted - margin).toFixed(2)),
        confidence_high: parseFloat((predicted + margin).toFixed(2)),
        horizon_hours: 24,
        created_at: new Date().toISOString()
      },
      market_impact: {
        commodity: commodity.toLowerCase(),
        affected_assets: assets,
        ripple_score: parseFloat((assets.reduce((sum, a) => sum + a.ripple_score, 0) / assets.length).toFixed(1))
      }
    };
  }
};

export const triggerPrediction = async (commodity) => {
  try {
    const response = await client.post(`/api/predictions/${commodity}/trigger`);
    return response.data;
  } catch (error) {
    console.warn(`Backend API offline. Simulating trigger.`, error);
    return {
      status: 'triggered',
      commodity: commodity.toLowerCase(),
      engine: 'Client-side simulation (Offline)',
      task_id: `sim-${Math.random().toString(36).substr(2, 9)}`,
      message: `ML retrain job successfully simulated for ${commodity}.`
    };
  }
};
