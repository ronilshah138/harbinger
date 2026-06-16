from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List

from app.database import get_db
from app.services.commodity_config import COMMODITY_TICKERS

router = APIRouter()

@router.get("/commodities")
def get_commodities() -> Dict[str, Any]:
    """
    Returns the full list of supported commodities.
    """
    return {
        "commodities": list(COMMODITY_TICKERS.keys())
    }

@router.get("/{commodity}")
def get_price_history(commodity: str, db=Depends(get_db)) -> List[Dict[str, Any]]:
    """
    Returns up to 200 rows (7 days of hourly data) for the commodity.
    """
    comm_lower = commodity.lower()
    if comm_lower not in COMMODITY_TICKERS:
        raise HTTPException(
            status_code=404,
            detail="Commodity not supported"
        )

    try:
        response = db.table("prices").select("*").eq("commodity", comm_lower).order("timestamp", desc=True).limit(200).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
