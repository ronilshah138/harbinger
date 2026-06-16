from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.database import get_db
from app.services.commodity_config import COMMODITY_TICKERS

router = APIRouter()

@router.get("/{commodity}")
def get_prediction(commodity: str, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Returns latest prediction for a commodity.
    """
    comm_lower = commodity.lower()
    if comm_lower not in COMMODITY_TICKERS:
        raise HTTPException(
            status_code=404,
            detail="Commodity not supported"
        )

    try:
        response = db.table("predictions").select("*").eq("commodity", comm_lower).order("created_at", desc=True).limit(1).execute()
        if response.data:
            return response.data[0]
        else:
            return {
                "message": "No prediction available yet",
                "commodity": comm_lower
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{commodity}/trigger")
def trigger_prediction(commodity: str, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Triggers ML model training and updating.
    """
    comm_lower = commodity.lower()
    if comm_lower not in COMMODITY_TICKERS:
        raise HTTPException(
            status_code=404,
            detail="Commodity not supported"
        )

    try:
        # Stub for ML Engine - actual ML implementation to be added in Day 9
        return {
            "message": f"Training triggered for {comm_lower}",
            "status": "queued"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
