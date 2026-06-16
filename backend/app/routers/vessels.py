from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db

router = APIRouter()

@router.get("/")
def get_vessels(db=Depends(get_db)):
    """
    Fetch the latest positions for all tracked vessels.
    """
    try:
        response = db.table("vessels").select("*").order("timestamp", desc=True).limit(500).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{mmsi}")
def get_vessel_history(mmsi: str, db=Depends(get_db)):
    """
    Get position history logs for a specific vessel.
    """
    try:
        response = db.table("vessels").select("*").eq("mmsi", mmsi).order("timestamp", desc=True).limit(100).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
