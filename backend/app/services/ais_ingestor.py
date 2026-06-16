import asyncio
import json
import logging
from datetime import datetime
import random
from typing import Dict, List
import websockets

from app.config import settings
from app.database import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AISIngestor")

# Bounding box specifications for major routes
CHOKEPOINTS = {
    "persian_gulf": {"start": {"longitude": 48, "latitude": 22}, "end": {"longitude": 60, "latitude": 28}, "cargo": "Crude Oil"},
    "strait_of_malacca": {"start": {"longitude": 99, "latitude": 1}, "end": {"longitude": 105, "latitude": 6}, "cargo": "Copper Ore / Crude Oil"},
    "red_sea": {"start": {"longitude": 32, "latitude": 12}, "end": {"longitude": 44, "latitude": 22}, "cargo": "Gold / Bullion"},
    "north_sea": {"start": {"longitude": -4, "latitude": 51}, "end": {"longitude": 9, "latitude": 58}, "cargo": "Crude Oil / Gas"}
}

class AISIngestor:
    def __init__(self):
        self.api_key = settings.AISSTREAM_API_KEY
        self.db = get_db()
        self.vessels_buffer: Dict[int, dict] = {}
        self.is_running = False

    def get_subscription_payload(self) -> dict:
        """
        Formats subscription payload using requested bounding boxes.
        Standard AISStream structure: [[[lat_start, lon_start], [lat_end, lon_end]], ...]
        """
        boxes = []
        for name, boundary in CHOKEPOINTS.items():
            s = boundary["start"]
            e = boundary["end"]
            boxes.append([[s["latitude"], s["longitude"]], [e["latitude"], e["longitude"]]])
            
        return {
            "APIKey": self.api_key,
            "BoundingBoxes": boxes,
            "FiltersShipMMSI": [],
            "FilterMessageTypes": ["PositionReport"]
        }

    async def stream_ais_data(self):
        """
        Subscribes to live stream.aisstream.io/v0/stream.
        """
        url = "wss://stream.aisstream.io/v0/stream"
        payload = self.get_subscription_payload()

        async for websocket in websockets.connect(url):
            try:
                logger.info("Connecting to stream.aisstream.io/v0/stream...")
                await websocket.send(json.dumps(payload))
                logger.info("Successfully sent AIS subscription filters.")

                async for message in websocket:
                    data = json.loads(message)
                    metadata = data.get("MetaData", {})
                    pos_report = data.get("Message", {}).get("PositionReport", {})
                    
                    if not pos_report:
                        continue

                    mmsi = metadata.get("MMSI")
                    name = metadata.get("ShipName", "").strip() or f"VESSEL_{mmsi}"
                    
                    # Store latest telemetry in memory buffer
                    self.vessels_buffer[mmsi] = {
                        "mmsi": mmsi,
                        "name": name,
                        "lat": pos_report.get("Latitude"),
                        "lon": pos_report.get("Longitude"),
                        "speed": float(pos_report.get("Sog", 0.0)),
                        "heading": float(pos_report.get("Cog", 0.0)),
                        "cargo_type": metadata.get("CargoType", "General Cargo"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
            except websockets.ConnectionClosed:
                logger.warning("AISStream connection closed. Reconnecting...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error reading from AISStream WebSocket: {e}")
                await asyncio.sleep(5)

    async def simulate_ais_data(self):
        """
        Generates simulated vessel coordinates traversing the 4 designated chokepoints.
        """
        logger.info("Starting chokepoint AIS simulator feed...")
        mock_fleets = [
            {"mmsi": 211281040, "name": "VULCAN CRUDE", "chokepoint": "persian_gulf", "cargo": "Crude Oil"},
            {"mmsi": 311000898, "name": "MALACCA EMERALD", "chokepoint": "strait_of_malacca", "cargo": "Copper Ore"},
            {"mmsi": 477432600, "name": "RED SEA EXPLORER", "chokepoint": "red_sea", "cargo": "Gold Bullion"},
            {"mmsi": 235112000, "name": "NORTH CRUSADER", "chokepoint": "north_sea", "cargo": "Brent Crude"}
        ]

        while self.is_running:
            for ship in mock_fleets:
                # Get bounds
                bounds = CHOKEPOINTS[ship["chokepoint"]]
                lat_start, lat_end = bounds["start"]["latitude"], bounds["end"]["latitude"]
                lon_start, lon_end = bounds["start"]["longitude"], bounds["end"]["longitude"]
                
                # Interpolate coordinate traversal
                t = (asyncio.get_event_loop().time() * 0.02) % 1.0
                curr_lat = lat_start + t * (lat_end - lat_start)
                curr_lon = lon_start + t * (lon_end - lon_start)
                
                # Write to buffer
                self.vessels_buffer[ship["mmsi"]] = {
                    "mmsi": ship["mmsi"],
                    "name": ship["name"],
                    "lat": round(curr_lat, 4),
                    "lon": round(curr_lon, 4),
                    "speed": round(10.0 + random.uniform(1.0, 5.0), 1),
                    "heading": round(random.uniform(0.0, 360.0), 1),
                    "cargo_type": ship["cargo"],
                    "timestamp": datetime.utcnow().isoformat()
                }
            await asyncio.sleep(3)

    async def db_writer_loop(self):
        """
        Periodically writes vessel buffers to Supabase database every 30 seconds.
        """
        while self.is_running:
            await asyncio.sleep(30)
            if not self.vessels_buffer:
                continue

            vessels_to_write = list(self.vessels_buffer.values())
            logger.info(f"Triggering 30s write: Upserting {len(vessels_to_write)} vessel positions to Supabase...")
            
            try:
                if "placeholder" not in self.db.supabase_url.lower():
                    # Batch upsert into vessels table
                    self.db.table("vessels").upsert(vessels_to_write).execute()
                    logger.info("Successfully updated vessel positions database.")
                else:
                    logger.info(f"[Simulator] Wrote batch to database: {vessels_to_write}")
            except Exception as e:
                logger.error(f"Database batch upsert failed: {e}")

    async def start(self):
        self.is_running = True
        
        # Determine if real subscription keys are provided
        use_real = self.api_key and "placeholder" not in self.api_key.lower() and len(self.api_key) > 12

        # Create tasks
        stream_task = self.stream_ais_data() if use_real else self.simulate_ais_data()
        db_task = self.db_writer_loop()

        await asyncio.gather(stream_task, db_task)

    def stop(self):
        self.is_running = False
        logger.info("Ingestor stopped.")
