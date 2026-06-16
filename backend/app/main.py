import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import vessels, prices, predictions
from app.services.price_ingestor import run_scheduler
from app.services.ais_ingestor import run_ais_stream

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("HarbingerApp")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to handle startup and shutdown event logs.
    """
    logger.info("🚀 Starting Harbinger Commodity Shipping Intelligence Platform...")
    
    price_task = asyncio.create_task(run_scheduler())
    logger.info("Started price ingestor")
    
    ais_task = asyncio.create_task(run_ais_stream())
    logger.info("Started AIS stream")
    
    yield
    
    logger.info("🛑 Shutting down Harbinger Commodity Shipping Intelligence Platform...")
    price_task.cancel()
    ais_task.cancel()
    try:
        await asyncio.gather(price_task, ais_task, return_exceptions=True)
    except Exception as e:
        logger.error(f"Error during shutdown tasks: {e}")

# Initialize FastAPI App
app = FastAPI(
    title="Harbinger API",
    description="Commodity Shipping Intelligence Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration (Allow all origins for development/testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers with prefixes
app.include_router(vessels.router, prefix="/api/vessels", tags=["vessels"])
app.include_router(prices.router, prefix="/api/prices", tags=["prices"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])

@app.get("/health")
def health_check():
    """
    Standard application health probe.
    """
    return {
        "status": "ok",
        "project": "harbinger"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
