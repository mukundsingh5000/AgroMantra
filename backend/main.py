import sys
from pathlib import Path
import logging

# Ensure backend root is in python path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.endpoints import router
from services.data_service import data_service
from config import CORS_ORIGINS, HOST, PORT

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("kangra_backend")

app = FastAPI(
    title="Kangra Agro-Meteorological Advisory System API",
    description="SIH PS74 — AI-assisted localized weather downscaling and decision-support system for Kangra district.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/demo simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("Initializing dataset into memory...")
    data_service.load_data()
    logger.info("Backend startup complete!")

@app.get("/")
def root():
    return {
        "title": "Kangra Agro-Meteorological Advisory System API",
        "system": "SIH PS74",
        "district": "Kangra",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
