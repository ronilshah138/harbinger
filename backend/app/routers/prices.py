from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.services.price_ingestor import fetch_prices_for_commodity
from app.services.commodity_config import COMMODITY_TICKERS

router = APIRouter()

@router.get("/commodities")
async def get_commodities() -> Dict[str, Any]:
    """
    Returns the full list of supported commodities with their tickers.
    """
    return {
        "commodities": [
            {"name": k, "ticker": v} for k, v in COMMODITY_TICKERS.items()
        ]
    }

@router.get("/{commodity}")
async def get_price_history(commodity: str, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Returns latest price and 7-day history for the commodity.
    """
    comm_lower = commodity.lower()
    if comm_lower not in COMMODITY_TICKERS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{commodity}'."
        )

    history = []
    
    # Try database
    try:
        if "placeholder" not in db.supabase_url.lower():
            seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            response = db.table("prices") \
                         .select("*") \
                         .eq("commodity", comm_lower) \
                         .gte("timestamp", seven_days_ago) \
                         .order("timestamp", desc=False) \
                         .execute()
            if response.data:
                history = response.data
    except Exception:
        pass

    # Fallback to direct yfinance ingestor fetch
    if not history:
        history = fetch_prices_for_commodity(comm_lower)

    if not history:
        raise HTTPException(status_code=404, detail=f"No price records found for {commodity}.")

    latest = history[-1]

    return {
        "commodity": comm_lower,
        "latest": latest,
        "history": history
    }
