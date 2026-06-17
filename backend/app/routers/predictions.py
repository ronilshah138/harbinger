from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
import threading

from app.database import get_db
from app.services.commodity_config import COMMODITY_TICKERS
from app.services.ml_engine import predict, train_model
from typing import List
from app.services.market_impact import analyze_market_impact, analyze_all_commodities

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
        try:
            return predict(comm_lower)
        except ValueError:
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
        thread = threading.Thread(target=train_model, args=(comm_lower,))
        thread.start()
        
        return {
            "message": f"Training started for {comm_lower}",
            "status": "training"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-impact/{commodity}")
def get_market_impact(commodity: str) -> Dict[str, Any]:
    """
    Returns market impact analysis for a commodity.
    """
    comm_lower = commodity.lower()
    if comm_lower not in COMMODITY_TICKERS:
        raise HTTPException(
            status_code=404,
            detail="Commodity not supported"
        )
    
    try:
        return analyze_market_impact(comm_lower)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-impact")
def get_all_market_impact() -> List[Dict[str, Any]]:
    """
    Returns market impact analysis for all commodities with trained models.
    """
    try:
        return analyze_all_commodities()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
