import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import vessels, prices, predictions

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
    # Custom startup operations can be added here (e.g., seeding DB, starting async polls)
    yield
    logger.info("🛑 Shutting down Harbinger Commodity Shipping Intelligence Platform...")

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
