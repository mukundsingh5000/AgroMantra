from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from services.data_service import data_service
from services.advisory_service import advisory_engine
from services.inference_service import inference_service

router = APIRouter(prefix="/api")

@router.get("/health")
def get_health():
    return {"status": "ok", "service": "Kangra Agro-Meteorological Advisory Backend"}

@router.get("/points")
def get_points():
    return data_service.get_points()

@router.get("/dates")
def get_dates():
    return data_service.get_dates()

@router.get("/predictions")
def get_predictions(
    point_id: Optional[str] = Query(None, description="Grid Point ID (e.g. kangra_0000)"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    return data_service.get_predictions(point_id, start_date, end_date)

@router.get("/predictions/date/{date}")
def get_predictions_by_date(date: str):
    """Returns predictions for all 120 grid points on a given date. Powers the Weather Map."""
    return data_service.get_predictions_by_date(date)

@router.get("/predictions/{point_id}")
def get_predictions_by_point(point_id: str):
    """Returns full time series for a single grid point."""
    res = data_service.get_predictions_by_point(point_id)
    if not res:
        raise HTTPException(status_code=404, detail=f"Point ID '{point_id}' not found.")
    return res

@router.get("/summary/{point_id}")
def get_summary(
    point_id: str,
    date: Optional[str] = Query(None, description="Target date YYYY-MM-DD")
):
    """Returns latest/selected weather summary, prediction ranges, and classification."""
    available_dates = data_service.get_dates()["dates"]
    target_date = date if date else (available_dates[0] if available_dates else "2023-06-01")
    return data_service.get_summary(point_id, target_date)

@router.get("/alerts")
def get_alerts(
    point_id: Optional[str] = Query(None, description="Optional Point ID filter"),
    date: Optional[str] = Query(None, description="Optional Date filter YYYY-MM-DD")
):
    """Returns weather risk alerts generated from model prediction quantiles."""
    return advisory_engine.generate_alerts(point_id, date)

@router.get("/advisory")
def get_advisory(
    point_id: str = Query(..., description="Grid Point ID"),
    date: str = Query(..., description="Target Date YYYY-MM-DD"),
    crop: str = Query("Rice", description="Crop name (Rice, Maize, Tomato, Potato, Apple, Wheat, Other)"),
    growth_stage: str = Query("Vegetative", description="Growth Stage")
):
    """Generates transparent rule-based agro-meteorological advisory."""
    return advisory_engine.evaluate_advisory(point_id, date, crop, growth_stage)

@router.get("/metrics")
def get_metrics():
    """Returns model evaluation metrics from metrics_all.csv."""
    return data_service.get_metrics()

@router.get("/model-info")
def get_model_info():
    """Returns ML pipeline, dataset, and spatial validation metadata."""
    return data_service.get_model_info()

@router.post("/predict_live")
def predict_live(features: Dict[str, Any]):
    """Optional live model inference endpoint using LightGBM joblib model."""
    return inference_service.predict(features)
