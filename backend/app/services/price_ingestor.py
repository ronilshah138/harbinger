import logging
from datetime import datetime, timedelta
from typing import List
import random

import yfinance as yf
from app.models.schemas import CommodityPrice
from app.database import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PriceIngestor")

COMMODITY_TICKERS = {
    "gold": "GC=F",
    "silver": "SI=F",
    "oil": "CL=F",
    "copper": "HG=F"
}

# Base prices for fallback mock generator in case yfinance is rate-limited/offline
BASE_PRICES = {
    "gold": 2350.0,
    "silver": 29.5,
    "oil": 82.3,
    "copper": 4.65
}

def fetch_price(commodity: str) -> List[CommodityPrice]:
    """
    Uses yfinance to pull 7d history at 1h interval.
    Returns a list of CommodityPrice objects.
    Falls back to generated mock prices if offline or rate-limited.
    """
    comm_lower = commodity.lower()
    ticker_symbol = COMMODITY_TICKERS.get(comm_lower)
    if not ticker_symbol:
        logger.error(f"Unsupported commodity: {commodity}")
        return []

    prices_list = []
    
    try:
        logger.info(f"Fetching yfinance price history for {comm_lower} ({ticker_symbol})...")
        ticker = yf.Ticker(ticker_symbol)
        # Pull 7 days of historical hourly data
        df = ticker.history(period="7d", interval="1h")
        
        if not df.empty:
            for idx, row in df.iterrows():
                # idx is timestamp (usually timezone-aware)
                timestamp = idx.to_pydatetime()
                price_val = float(row["Close"])
                
                prices_list.append(CommodityPrice(
                    commodity=comm_lower,
                    price=round(price_val, 2),
                    currency="USD",
                    timestamp=timestamp
                ))
            logger.info(f"Successfully fetched {len(prices_list)} records from yfinance for {comm_lower}.")
            return prices_list
    except Exception as e:
        logger.error(f"Failed to fetch yfinance data for {comm_lower} due to: {e}. Falling back to simulated history.")

    # Fallback to simulated pricing if API fails
    now = datetime.utcnow()
    current_price = BASE_PRICES.get(comm_lower, 100.0)
    # 7 days * 24 hours = 168 intervals
    for h in range(168):
        hist_time = now - timedelta(hours=168 - h)
        pct_change = random.uniform(-0.005, 0.005)
        current_price = round(current_price * (1 + pct_change), 2)
        
        prices_list.append(CommodityPrice(
            commodity=comm_lower,
            price=current_price,
            currency="USD",
            timestamp=hist_time
        ))
    return prices_list

def store_prices_to_supabase(prices: List[CommodityPrice]):
    """
    Upserts a list of commodity prices into the Supabase prices database table.
    """
    db = get_db()
    if "placeholder" in db.supabase_url.lower():
        logger.warning("Supabase URL is placeholder. Skipping database write.")
        return

    try:
        # Convert schemas to dict representation
        records = []
        for p in prices:
            records.append({
                "commodity": p.commodity,
                "price": p.price,
                "currency": p.currency,
                "timestamp": p.timestamp.isoformat()
            })
        
        logger.info(f"Upserting {len(records)} prices into Supabase 'commodity_prices' table...")
        # Assume 'commodity' and 'timestamp' are unique/primary keys for upsert
        db.table("commodity_prices").upsert(records).execute()
        logger.info("Supabase database upsert complete.")
    except Exception as e:
        logger.error(f"Supabase upsert failed: {e}")

def fetch_all_prices() -> List[CommodityPrice]:
    """
    Loops all four commodities, fetches their prices, and stores them in Supabase.
    """
    all_prices = []
    for comm in COMMODITY_TICKERS.keys():
        prices = fetch_price(comm)
        all_prices.extend(prices)
    
    store_prices_to_supabase(all_prices)
    return all_prices
