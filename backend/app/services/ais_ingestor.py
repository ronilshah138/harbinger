import asyncio
import json
import logging
import threading
import websocket
from datetime import datetime

from app.database import get_db
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOUNDING_BOXES = [
    [[-90, -180], [90, 180]]
]

def parse_ais_timestamp(raw: str) -> str:
    try:
        # Remove trailing " UTC" if present
        raw = raw.replace(" UTC", "").strip()
        # Parse the datetime (handles nanoseconds by truncating to microseconds)
        raw = raw[:26] + raw[26:].split("+")[0].split("-")[0]
        dt = datetime.strptime(raw[:26], "%Y-%m-%d %H:%M:%S.%f")
        return dt.isoformat() + "+00:00"
    except Exception:
        return datetime.utcnow().isoformat() + "+00:00"

def connect_and_stream():
    buffer = []

    def on_open(ws):
        logger.info("Connected to AISStream WebSocket")
        sub = {
            "APIKey": settings.AISSTREAM_API_KEY,
            "BoundingBoxes": BOUNDING_BOXES,
            "FilterMessageTypes": ["PositionReport"]
        }
        ws.send(json.dumps(sub))
        logger.info("Subscription sent")

    def on_message(ws, message_str):
        try:
            if isinstance(message_str, bytes):
                message_str = message_str.decode('utf-8')
                
            message = json.loads(message_str)
            if "MetaData" in message and "Message" in message:
                meta = message["MetaData"]
                pos_report = message["Message"].get("PositionReport", {})
                
                mmsi = str(meta["MMSI"])
                name = meta.get("ShipName", "").strip()
                lat = meta["latitude"]
                lon = meta["longitude"]
                speed = pos_report.get("Sog", 0)
                heading = pos_report.get("TrueHeading", 0)
                cargo_type = str(pos_report.get("ShipType", "unknown"))
                timestamp = parse_ais_timestamp(meta.get("time_utc", ""))
                
                buffer.append({
                    "mmsi": mmsi,
                    "name": name,
                    "lat": lat,
                    "lon": lon,
                    "speed": speed,
                    "heading": heading,
                    "cargo_type": cargo_type,
                    "timestamp": timestamp
                })

                if len(buffer) >= 50:
                    try:
                        db = get_db()
                        db.table("vessels").upsert(buffer).execute()
                        logger.info(f"Upserted {len(buffer)} vessels to Supabase")
                    except Exception as e:
                        logger.error(f"Error upserting to Supabase: {e}")
                    buffer.clear()
                    
        except json.JSONDecodeError:
            pass
        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def on_error(ws, error):
        logger.error(f"AISStream error: {error}")

    def on_close(ws, close_status_code, close_msg):
        logger.warning(f"AISStream closed: {close_status_code} {close_msg}")

    ws = websocket.WebSocketApp(
        "wss://stream.aisstream.io/v0/stream",
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws.run_forever()

async def run_ais_stream():
    logger.info("Starting AIS stream thread manager...")
    while True:
        thread = threading.Thread(target=connect_and_stream, daemon=True)
        thread.start()
        
        while thread.is_alive():
            await asyncio.sleep(5)
            
        logger.warning("AIS stream thread died. Restarting in 5 seconds...")
        await asyncio.sleep(5)
