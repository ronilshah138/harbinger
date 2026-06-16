from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any
from datetime import datetime

from app.database import get_db
from app.services.ml_engine import CommodityModel, train_and_predict_commodity_task

router = APIRouter()
model_engine = CommodityModel()

VALID_COMMODITIES = {"gold", "silver", "oil", "copper"}

@router.get("/{commodity}")
def get_prediction(commodity: str, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Returns latest predictions and market impact scores.
    """
    comm_lower = commodity.lower()
    if comm_lower not in VALID_COMMODITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{commodity}'. Options: gold, silver, oil, copper."
        )

    prediction_data = None
    try:
        if "placeholder" not in db.supabase_url.lower():
            response = db.table("predictions") \
                         .select("*") \
                         .eq("commodity", comm_lower) \
                         .order("created_at", desc=True) \
                         .limit(1) \
                         .execute()
            if response.data:
                prediction_data = response.data[0]
    except Exception:
        pass

    if not prediction_data:
        # Predict on the fly using CommodityModel
        prediction_data = model_engine.predict(comm_lower)

    # Compile market impact summaries
    # affected assets mapping based on chokepoint routes
    assets = {
        "gold": [
            {"asset": "Swiss Bullion Vaults", "ripple_score": 3.5, "sentiment": "positive"},
            {"asset": "London Bullion Market Association (LBMA)", "ripple_score": 6.8, "sentiment": "positive"},
            {"asset": "Red Sea Shipping Lanes", "ripple_score": 8.2, "sentiment": "negative"}
        ],
        "silver": [
            {"asset": "Comex Silver Depository", "ripple_score": 4.1, "sentiment": "positive"},
            {"asset": "Shanghai Gold Exchange (SGE) Silver Vaults", "ripple_score": 5.4, "sentiment": "negative"}
        ],
        "oil": [
            {"asset": "Strait of Hormuz Tanker Channels", "ripple_score": 9.5, "sentiment": "negative"},
            {"asset": "Cushing Oil Storage Terminal", "ripple_score": 7.3, "sentiment": "positive"},
            {"asset": "North Sea Refining Terminals", "ripple_score": 5.1, "sentiment": "positive"}
        ],
        "copper": [
            {"asset": "LME Registered Warehouses", "ripple_score": 7.8, "sentiment": "positive"},
            {"asset": "Strait of Malacca Congestion Checkpoint", "ripple_score": 6.2, "sentiment": "negative"},
            {"asset": "Shanghai Port Storage Yards", "ripple_score": 4.9, "sentiment": "negative"}
        ]
    }.get(comm_lower, [{"asset": "Global Freight Logistics", "ripple_score": 5.0, "sentiment": "neutral"}])

    return {
        "prediction": prediction_data,
        "market_impact": {
            "commodity": comm_lower,
            "affected_assets": assets,
            "ripple_score": round(sum(a["ripple_score"] for a in assets) / len(assets), 1)
        }
    }

@router.post("/{commodity}/trigger")
def trigger_prediction(commodity: str, background_tasks: BackgroundTasks, db=Depends(get_db)) -> Dict[str, Any]:
    """
    Triggers ML model training and updating.
    """
    comm_lower = commodity.lower()
    if comm_lower not in VALID_COMMODITIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported commodity '{commodity}'. Options: gold, silver, oil, copper."
        )

    task_id = None
    engine = "Celery"
    try:
        task = train_and_predict_commodity_task.delay(comm_lower)
        task_id = task.id
    except Exception:
        # Fallback to FastAPI Background Tasks
        engine = "FastAPI BackgroundTask"
        background_tasks.add_task(model_engine.train, comm_lower)
        background_tasks.add_task(model_engine.predict, comm_lower)

    return {
        "status": "triggered",
        "commodity": comm_lower,
        "engine": engine,
        "task_id": task_id,
        "message": f"ML model training pipeline triggered successfully for {comm_lower}."
    }
