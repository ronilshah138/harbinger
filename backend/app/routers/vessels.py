from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime, timedelta
import random

from app.models.schemas import Vessel
from app.database import get_db

router = APIRouter()

MOCK_VESSELS = [
    {
        "mmsi": 211281040,
        "name": "VULCAN CRUDE",
        "lat": 24.5074,
        "lon": 54.1278,
        "speed": 12.5,
        "heading": 210.0,
        "cargo_type": "Crude Oil",
        "timestamp": datetime.utcnow()
    },
    {
        "mmsi": 311000898,
        "name": "MALACCA EMERALD",
        "lat": 2.8568,
        "lon": 101.6503,
        "speed": 14.2,
        "heading": 125.0,
        "cargo_type": "Copper Ore",
        "timestamp": datetime.utcnow()
    },
    {
        "mmsi": 477432600,
        "name": "RED SEA EXPLORER",
        "lat": 18.2902,
        "lon": 38.8519,
        "speed": 13.8,
        "heading": 340.0,
        "cargo_type": "Gold Bullion",
        "timestamp": datetime.utcnow()
    },
    {
        "mmsi": 235112000,
        "name": "NORTH CRUSADER",
        "lat": 54.8607,
        "lon": 2.0011,
        "speed": 11.7,
        "heading": 45.0,
        "cargo_type": "Brent Crude",
        "timestamp": datetime.utcnow()
    }
]

@router.get("/", response_model=List[Vessel])
def get_vessels(db=Depends(get_db)):
    """
    Fetch the latest positions for all tracked vessels.
    """
    try:
        if "placeholder" not in db.supabase_url.lower():
            response = db.table("vessels").select("*").order("timestamp", desc=True).execute()
            if response.data:
                return response.data
    except Exception:
        pass

    # Dynamic coordinates drift simulation
    refreshed_vessels = []
    for v in MOCK_VESSELS:
        drift_lat = random.uniform(-0.02, 0.02)
        drift_lon = random.uniform(-0.02, 0.02)
        vessel_copy = v.copy()
        vessel_copy["lat"] += drift_lat
        vessel_copy["lon"] += drift_lon
        vessel_copy["timestamp"] = datetime.utcnow()
        refreshed_vessels.append(vessel_copy)
        
    return refreshed_vessels

@router.get("/{mmsi}", response_model=List[Vessel])
def get_vessel_history(mmsi: int, db=Depends(get_db)):
    """
    Get position history logs for a specific vessel.
    """
    try:
        if "placeholder" not in db.supabase_url.lower():
            response = db.table("vessels").select("*").eq("mmsi", mmsi).order("timestamp", desc=True).limit(50).execute()
            if response.data:
                return response.data
    except Exception:
        pass

    target_vessel = next((v for v in MOCK_VESSELS if v["mmsi"] == mmsi), None)
    if not target_vessel:
        raise HTTPException(status_code=404, detail=f"Vessel with MMSI {mmsi} not found.")

    history = []
    now = datetime.utcnow()
    for i in range(15):
        hist_time = now - timedelta(hours=i * 2)
        history.append({
            "mmsi": target_vessel["mmsi"],
            "name": target_vessel["name"],
            "lat": target_vessel["lat"] - (i * 0.05),
            "lon": target_vessel["lon"] - (i * 0.03),
            "speed": target_vessel["speed"] + random.uniform(-0.5, 0.5),
            "heading": target_vessel["heading"],
            "cargo_type": target_vessel["cargo_type"],
            "timestamp": hist_time
        })
    return history
