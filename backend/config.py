import os
from pathlib import Path

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent

# Check for data directory or root fallback
DATA_DIR = BASE_DIR / "data"
ROOT_DIR = BASE_DIR

def find_file(filename: str) -> Path:
    """Find file in data/ or root directory or backend directory."""
    candidates = [
        DATA_DIR / filename,
        ROOT_DIR / filename,
        BASE_DIR / "backend" / filename,
        BASE_DIR / "backend" / "config" / filename,
        Path.cwd() / filename,
        Path.cwd() / "data" / filename,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    # Default return candidate path
    return ROOT_DIR / filename

PREDICTIONS_CSV = find_file("kangra_predictions.csv")
PREDICTIONS_PARQUET = find_file("kangra_predictions.parquet")
METRICS_CSV = find_file("metrics_all.csv")
MODEL_PATH = find_file("models_lgbm.joblib")
POINTS_PARQUET = find_file("points_kangra.parquet")
BOUNDARY_GEOJSON = find_file("kangra_boundary.geojson")

# Environment / Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
