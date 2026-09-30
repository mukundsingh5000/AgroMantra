import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional
import logging
from config import MODEL_PATH

logger = logging.getLogger("kangra_backend")

class InferenceService:
    def __init__(self):
        self.models: Optional[Dict[str, Any]] = None
        self.is_available: bool = False
        self.load_model()

    def load_model(self):
        if MODEL_PATH.exists():
            try:
                logger.info(f"Loading LightGBM model from {MODEL_PATH}")
                self.models = joblib.load(MODEL_PATH)
                self.is_available = True
                logger.info("LightGBM joblib model loaded successfully.")
            except Exception as e:
                logger.warning(f"Could not load joblib model: {e}")
                self.models = None
                self.is_available = False
        else:
            logger.info("Joblib model file not found; running in pre-computed prediction mode.")

    def get_status(self) -> Dict[str, Any]:
        return {
            "model_path": str(MODEL_PATH),
            "is_available": self.is_available,
            "targets": ["tmax", "tmin", "rain"],
            "description": "LightGBM spatial downscaling model for Kangra district"
        }

    def predict(self, feature_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform inference using loaded joblib models if feature dictionary is provided."""
        if not self.is_available or self.models is None:
            return {
                "error": "Live inference model is not loaded. Pre-computed prediction dataset is active.",
                "is_fallback": True
            }
        try:
            # Format dataframe from features dict
            df_in = pd.DataFrame([feature_data])
            predictions = {}

            # Evaluate targets
            for target in ["tmax", "tmin", "rain"]:
                if target in self.models:
                    model_obj = self.models[target]
                    if hasattr(model_obj, "predict"):
                        pred_val = model_obj.predict(df_in)[0]
                        predictions[f"{target}_p50"] = float(pred_val)

            return {
                "status": "success",
                "predictions": predictions,
                "note": "Live model inference prediction result"
            }
        except Exception as e:
            logger.error(f"Inference error: {e}")
            return {
                "error": str(e),
                "status": "failed"
            }

inference_service = InferenceService()
