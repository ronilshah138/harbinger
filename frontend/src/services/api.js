import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

export const getCommodityPrices = async (commodity) => {
  try {
    const response = await api.get(`/api/prices/${commodity}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching prices for ${commodity}:`, error);
    return null;
  }
};

export const getLatestPrice = async (commodity) => {
  try {
    const response = await api.get(`/api/prices/${commodity}`);
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching latest price for ${commodity}:`, error);
    return null;
  }
};

export const getPrediction = async (commodity) => {
  try {
    const response = await api.get(`/api/predictions/${commodity}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching prediction for ${commodity}:`, error);
    return null;
  }
};

export const getVessels = async () => {
  try {
    const response = await api.get(`/api/vessels`);
    return response.data;
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return null;
  }
};

export const getMarketImpact = async (commodity) => {
  try {
    const response = await api.get(`/api/predictions/market-impact/${commodity}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching market impact for ${commodity}:`, error);
    return null;
  }
};

export const triggerRetrain = async (commodity) => {
  try {
    const response = await api.post(`/api/predictions/${commodity}/trigger`);
    return response.data;
  } catch (error) {
    console.error(`Error triggering retrain for ${commodity}:`, error);
    return null;
  }
};

export const getCommodities = async () => {
  try {
    const response = await api.get('/api/commodities');
    return response.data;
  } catch (error) {
    console.error('Error fetching commodities list:', error);
    return null;
  }
};
