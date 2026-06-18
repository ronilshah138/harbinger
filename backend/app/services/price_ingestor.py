import asyncio
import logging
from typing import List

import yfinance as yf

from app.database import get_db
from app.services.commodity_config import COMMODITY_TICKERS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fetch_prices_for_commodity(commodity: str) -> List[dict]:
    ticker_symbol = COMMODITY_TICKERS.get(commodity)
    if not ticker_symbol:
        logger.warning(f"Ticker symbol not found for commodity: {commodity}")
        return []

    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period="7d", interval="1h")

        if df.empty:
            logger.warning(f"No price history found for {commodity}")
            return []

        records = []
        for idx, row in df.iterrows():
            price_val = float(row["Close"])
            volume_val = int(row["Volume"]) if "Volume" in row else 0

            records.append({
                "commodity": commodity,
                "price": round(price_val, 4),
                "currency": "USD",
                "volume": volume_val,
                "timestamp": idx.to_pydatetime().isoformat()
            })
        return records

    except Exception as e:
        logger.error(f"Error fetching prices for {commodity}: {e}")
        return []

def store_to_supabase(records: List[dict]):
    if not records:
        return

    try:
        db = get_db()
        response = db.table("prices").upsert(
            records,
            on_conflict="commodity,timestamp"
        ).execute()
        
        logger.info(f"Successfully stored {len(records)} records")
    except Exception as e:
        logger.error(f"Error storing to supabase: {e}")

async def run_once() -> int:
    total_stored = 0
    for commodity in COMMODITY_TICKERS.keys():
        records = fetch_prices_for_commodity(commodity)
        if records:
            store_to_supabase(records)
            total_stored += len(records)
        await asyncio.sleep(2)
            
    logger.info(f"Total records stored across all commodities: {total_stored}")
    return total_stored

async def run_scheduler():
    await run_once()
    while True:
        await asyncio.sleep(3600)
        await run_once()
