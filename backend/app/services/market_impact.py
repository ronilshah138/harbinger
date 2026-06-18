import os
import json
import logging
from datetime import datetime
from typing import Optional
import numpy as np
import pandas as pd
import yfinance as yf
import time

from app.database import get_db
from app.services.ml_engine import predict, get_model_path
from app.services.commodity_config import COMMODITY_TICKERS

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_price_cache = {}
_cache_timestamp = {}
CACHE_TTL = 3600

CROSS_ASSET_MAP = {
  "gold": [
    {"ticker": "GDX", "name": "Gold Miners ETF", "correlation": 0.85},
    {"ticker": "XAUUSD=X", "name": "Gold/USD FX", "correlation": 0.95},
    {"ticker": "TLT", "name": "20Y Treasury Bond ETF", "correlation": 0.45},
    {"ticker": "DXY", "name": "US Dollar Index", "correlation": -0.65},
    {"ticker": "SLV", "name": "Silver ETF", "correlation": 0.72},
  ],
  "silver": [
    {"ticker": "SLV", "name": "Silver ETF", "correlation": 0.92},
    {"ticker": "GDX", "name": "Gold Miners ETF", "correlation": 0.68},
    {"ticker": "XAGUSD=X", "name": "Silver/USD FX", "correlation": 0.95},
    {"ticker": "DXY", "name": "US Dollar Index", "correlation": -0.55},
  ],
  "oil": [
    {"ticker": "XLE", "name": "Energy Sector ETF", "correlation": 0.82},
    {"ticker": "USO", "name": "Oil ETF", "correlation": 0.95},
    {"ticker": "XOM", "name": "Exxon Mobil", "correlation": 0.75},
    {"ticker": "DXY", "name": "US Dollar Index", "correlation": -0.45},
    {"ticker": "IAI", "name": "Transport ETF", "correlation": -0.55},
  ],
  "copper": [
    {"ticker": "COPX", "name": "Copper Miners ETF", "correlation": 0.88},
    {"ticker": "FCX", "name": "Freeport-McMoRan", "correlation": 0.82},
    {"ticker": "EEM", "name": "Emerging Markets ETF", "correlation": 0.65},
    {"ticker": "FXI", "name": "China Large-Cap ETF", "correlation": 0.70},
  ],
  "natural_gas": [
    {"ticker": "UNG", "name": "Natural Gas ETF", "correlation": 0.92},
    {"ticker": "XLE", "name": "Energy Sector ETF", "correlation": 0.55},
    {"ticker": "FCG", "name": "Natural Gas Stocks ETF", "correlation": 0.85},
  ],
  "platinum": [
    {"ticker": "PPLT", "name": "Platinum ETF", "correlation": 0.95},
    {"ticker": "PALL", "name": "Palladium ETF", "correlation": 0.65},
    {"ticker": "GDX", "name": "Gold Miners ETF", "correlation": 0.55},
  ],
  "palladium": [
    {"ticker": "PALL", "name": "Palladium ETF", "correlation": 0.95},
    {"ticker": "PPLT", "name": "Platinum ETF", "correlation": 0.65},
    {"ticker": "F", "name": "Ford Motor (auto demand)", "correlation": 0.45},
  ],
  "aluminum": [
    {"ticker": "AA", "name": "Alcoa Corp", "correlation": 0.85},
    {"ticker": "XME", "name": "Metals & Mining ETF", "correlation": 0.75},
    {"ticker": "EEM", "name": "Emerging Markets ETF", "correlation": 0.55},
  ],
}

def fetch_asset_current_price(ticker: str) -> Optional[float]:
    if ticker in _price_cache and time.time() - _cache_timestamp.get(ticker, 0) < CACHE_TTL:
        return _price_cache[ticker]

    try:
        data = yf.Ticker(ticker).history(period="5d", interval="1d")
        if not data.empty:
            price = float(data['Close'].iloc[-1])
            _price_cache[ticker] = price
            _cache_timestamp[ticker] = time.time()
            return price
        return None
    except Exception as e:
        logger.error(f"Error fetching price for {ticker}: {e}")
        return None

def compute_asset_impact(commodity: str, price_change_pct: float, prediction: dict) -> list[dict]:
    related_assets = CROSS_ASSET_MAP.get(commodity.lower(), [])
    results = []
    
    for asset in related_assets:
        ticker = asset["ticker"]
        correlation = asset["correlation"]
        current_price = fetch_asset_current_price(ticker)
        
        if current_price is None:
            continue
            
        estimated_impact_pct = price_change_pct * correlation
        estimated_new_price = current_price * (1 + estimated_impact_pct / 100)
        impact_score = abs(estimated_impact_pct) * abs(correlation)
        direction = "up" if estimated_impact_pct > 0 else "down"
        
        results.append({
            "ticker": ticker,
            "name": asset["name"],
            "correlation": correlation,
            "current_price": current_price,
            "estimated_impact_pct": estimated_impact_pct,
            "estimated_new_price": estimated_new_price,
            "impact_score": impact_score,
            "direction": direction
        })
        
    results.sort(key=lambda x: x["impact_score"], reverse=True)
    return results

def analyze_market_impact(commodity: str) -> dict:
    try:
        prediction = predict(commodity)
    except Exception as e:
        logger.error(f"Prediction failed for {commodity}: {e}")
        raise ValueError(f"Could not get prediction for {commodity}: {e}")
        
    price_change_pct = prediction.get("price_change_pct", 0.0)
    direction = prediction.get("direction", "unknown")
    horizon_hours = prediction.get("horizon_hours", 24)
    
    affected_assets = compute_asset_impact(commodity, price_change_pct, prediction)
    
    if not affected_assets:
        overall_ripple_score = 0.0
    else:
        raw_score = sum(abs(a["estimated_impact_pct"]) * abs(a["correlation"]) for a in affected_assets)
        normalized = (raw_score / (len(affected_assets) * 10)) * 100
        overall_ripple_score = min(100.0, float(normalized))
        
    analysis_notes = f"Predicted {direction} {abs(price_change_pct):.1f}% in {horizon_hours}h"
    
    db = get_db()
    try:
        db.table("market_impact").insert({
            "commodity": commodity,
            "affected_assets": json.dumps(affected_assets),
            "ripple_score": overall_ripple_score,
            "analysis_notes": analysis_notes
        }).execute()
    except Exception as e:
        logger.warning(f"Could not insert market impact to DB: {e}")
        
    summary = f"A {abs(price_change_pct):.1f}% {direction} move in {commodity} is estimated to impact {len(affected_assets)} related assets with an overall market ripple score of {overall_ripple_score:.1f}/100"
    
    return {
        "commodity": commodity,
        "prediction": prediction,
        "affected_assets": affected_assets,
        "overall_ripple_score": overall_ripple_score,
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "summary": summary
    }

def analyze_all_commodities() -> list[dict]:
    results = []
    for commodity in COMMODITY_TICKERS.keys():
        model_path = get_model_path(commodity)
        if os.path.exists(model_path):
            try:
                res = analyze_market_impact(commodity)
                results.append(res)
            except Exception as e:
                logger.error(f"Error analyzing market impact for {commodity}: {e}")
                continue
    return results
