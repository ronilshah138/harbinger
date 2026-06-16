from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime, timedelta

from app.database import get_db
from app.services.price_ingestor import fetch_price

router = APIRouter()

@router.get("/{commodity}")
async def get_price_history(commodity: str, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Returns latest price and 7-day history for the commodity.
    Supported: gold, silver, oil, copper.
    """
    comm_lower = commodity.lower()
    if comm_lower not in {"gold", "silver", "oil", "copper"}:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{commodity}'. Options: gold, silver, oil, copper."
        )

    history = []
    
    # Try database
    try:
        if "placeholder" not in db.supabase_url.lower():
            seven_days_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
            response = db.table("commodity_prices") \
                         .select("*") \
                         .eq("commodity", comm_lower) \
                         .gte("timestamp", seven_days_ago) \
                         .order("timestamp", desc=False) \
                         .execute()
            if response.data:
                history = response.data
    except Exception:
        pass

    # Fallback to direct yfinance ingestor fetch (which returns CommodityPrice objects)
    if not history:
        raw_prices = fetch_price(comm_lower)
        history = [
            {
                "commodity": p.commodity,
                "price": p.price,
                "currency": p.currency,
                "timestamp": p.timestamp.isoformat() if isinstance(p.timestamp, datetime) else p.timestamp
            } for p in raw_prices
        ]

    if not history:
        raise HTTPException(status_code=404, detail=f"No price records found for {commodity}.")

    latest = history[-1]

    return {
        "commodity": comm_lower,
        "latest": latest,
        "history": history
    }
