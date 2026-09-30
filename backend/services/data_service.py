import pandas as pd
import numpy as np
import json
from typing import List, Dict, Any, Optional, Set
import logging
from config import PREDICTIONS_PARQUET, PREDICTIONS_CSV, METRICS_CSV, MODEL_PATH, BOUNDARY_GEOJSON

logger = logging.getLogger("kangra_backend")

class DataService:
    def __init__(self):
        self.predictions_df: pd.DataFrame = pd.DataFrame()
        self.metrics_df: pd.DataFrame = pd.DataFrame()
        self.points_list: List[Dict[str, Any]] = []
        self.available_dates: List[str] = []
        self.boundary_geojson: Optional[Dict[str, Any]] = None
        self.boundary_bounds: Dict[str, float] = {}
        self.inside_point_ids: Set[str] = set()
        self.excluded_point_ids: Set[str] = set()
        self.is_loaded: bool = False

    def load_data(self):
        """Load datasets & spatial boundary into memory on startup."""
        try:
            # 1. Load predictions
            if PREDICTIONS_PARQUET.exists():
                try:
                    logger.info(f"Loading predictions from Parquet: {PREDICTIONS_PARQUET}")
                    self.predictions_df = pd.read_parquet(PREDICTIONS_PARQUET)
                except Exception as e:
                    logger.warning(f"Failed to read Parquet ({e}), falling back to CSV: {PREDICTIONS_CSV}")
                    self.predictions_df = pd.read_csv(PREDICTIONS_CSV)
            elif PREDICTIONS_CSV.exists():
                logger.info(f"Loading predictions from CSV: {PREDICTIONS_CSV}")
                self.predictions_df = pd.read_csv(PREDICTIONS_CSV)
            else:
                raise FileNotFoundError("Neither kangra_predictions.parquet nor kangra_predictions.csv found!")

            # Ensure date column is string formatted YYYY-MM-DD
            self.predictions_df['date'] = self.predictions_df['date'].astype(str)

            # Extract unique points
            pts_df = self.predictions_df[['point_id', 'lat', 'lon']].drop_duplicates().sort_values('point_id')
            self.points_list = pts_df.to_dict(orient='records')

            # Extract available dates
            self.available_dates = sorted(self.predictions_df['date'].unique().tolist())

            # 2. Load evaluation metrics
            if METRICS_CSV.exists():
                logger.info(f"Loading metrics from CSV: {METRICS_CSV}")
                self.metrics_df = pd.read_csv(METRICS_CSV)
                self.metrics_df = self.metrics_df.replace({np.nan: None})
            else:
                self.metrics_df = pd.DataFrame()

            # 3. Load Kangra boundary & perform spatial point-in-polygon classification
            self._load_boundary_and_mask()

            self.is_loaded = True
            logger.info(f"Data successfully loaded. Total Points: {len(self.points_list)} (Inside Kangra: {len(self.inside_point_ids)}, Excluded: {len(self.excluded_point_ids)}), Dates: {len(self.available_dates)}")

        except Exception as e:
            logger.error(f"Error loading datasets: {e}")
            raise e

    def _load_boundary_and_mask(self):
        """Load GeoJSON boundary and classify points inside vs outside polygon."""
        if not BOUNDARY_GEOJSON.exists():
            logger.warning(f"Boundary GeoJSON not found at {BOUNDARY_GEOJSON}")
            self.inside_point_ids = {p['point_id'] for p in self.points_list}
            return

        try:
            with open(BOUNDARY_GEOJSON, 'r', encoding='utf-8') as f:
                self.boundary_geojson = json.load(f)

            # Perform spatial point-in-polygon filtering
            try:
                from shapely.geometry import shape, Point
                features = self.boundary_geojson.get('features', [])
                if features:
                    geom = shape(features[0]['geometry'])
                    bounds = geom.bounds  # (minx, miny, maxx, maxy) -> (min_lon, min_lat, max_lon, max_lat)
                    self.boundary_bounds = {
                        "min_lon": float(bounds[0]),
                        "min_lat": float(bounds[1]),
                        "max_lon": float(bounds[2]),
                        "max_lat": float(bounds[3])
                    }

                    for p in self.points_list:
                        pt = Point(float(p['lon']), float(p['lat']))
                        if geom.contains(pt) or geom.touches(pt):
                            self.inside_point_ids.add(p['point_id'])
                        else:
                            self.excluded_point_ids.add(p['point_id'])
                else:
                    self.inside_point_ids = {p['point_id'] for p in self.points_list}
            except ImportError:
                logger.warning("Shapely not installed, falling back to all points inside.")
                self.inside_point_ids = {p['point_id'] for p in self.points_list}

        except Exception as e:
            logger.error(f"Failed to process boundary GeoJSON: {e}")
            self.inside_point_ids = {p['point_id'] for p in self.points_list}

    def get_points(self, only_inside: bool = False) -> List[Dict[str, Any]]:
        if only_inside and self.inside_point_ids:
            return [p for p in self.points_list if p['point_id'] in self.inside_point_ids]
        return self.points_list

    def get_dates(self) -> Dict[str, Any]:
        if not self.available_dates:
            return {"dates": [], "min_date": None, "max_date": None}
        return {
            "dates": self.available_dates,
            "min_date": self.available_dates[0],
            "max_date": self.available_dates[-1],
            "total_days": len(self.available_dates)
        }

    def get_boundary(self) -> Dict[str, Any]:
        return {
            "boundary_geojson": self.boundary_geojson,
            "bounds": self.boundary_bounds,
            "total_points": len(self.points_list),
            "inside_count": len(self.inside_point_ids),
            "excluded_count": len(self.excluded_point_ids)
        }

    def get_predictions(
        self,
        point_id: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        only_inside: bool = False
    ) -> List[Dict[str, Any]]:
        df = self.predictions_df
        if only_inside and self.inside_point_ids:
            df = df[df['point_id'].isin(self.inside_point_ids)]
        if point_id:
            df = df[df['point_id'] == point_id]
        if start_date:
            df = df[df['date'] >= start_date]
        if end_date:
            df = df[df['date'] <= end_date]
        
        df = df.sort_values(['date', 'point_id'])
        return df.to_dict(orient='records')

    def get_predictions_by_date(self, target_date: str, only_inside: bool = True) -> List[Dict[str, Any]]:
        """Returns predictions for target date. Default only_inside=True masks map visualization to Kangra boundary."""
        df = self.predictions_df[self.predictions_df['date'] == target_date]
        if df.empty and self.available_dates:
            target_date = self.available_dates[0]
            df = self.predictions_df[self.predictions_df['date'] == target_date]

        if only_inside and self.inside_point_ids:
            df = df[df['point_id'].isin(self.inside_point_ids)]

        return df.to_dict(orient='records')

    def get_predictions_by_point(self, point_id: str) -> List[Dict[str, Any]]:
        df = self.predictions_df[self.predictions_df['point_id'] == point_id]
        df = df.sort_values('date')
        return df.to_dict(orient='records')

    def get_summary(self, point_id: str, target_date: str) -> Dict[str, Any]:
        df = self.predictions_df[
            (self.predictions_df['point_id'] == point_id) & 
            (self.predictions_df['date'] == target_date)
        ]
        
        if df.empty:
            df = self.predictions_df[self.predictions_df['point_id'] == point_id]
            if not df.empty:
                row = df.iloc[0].to_dict()
            else:
                row = self.predictions_df.iloc[0].to_dict()
        else:
            row = df.iloc[0].to_dict()

        rain_val = row.get('rain_p50', 0.0)
        tmax_val = row.get('tmax_p50', 0.0)
        tmin_val = row.get('tmin_p50', 0.0)

        if rain_val < 1.0:
            rain_class = "Dry / Clear"
        elif rain_val < 10.0:
            rain_class = "Light Rain"
        elif rain_val < 30.0:
            rain_class = "Moderate Rain"
        else:
            rain_class = "Heavy Rain"

        return {
            "point_id": row.get("point_id"),
            "lat": row.get("lat"),
            "lon": row.get("lon"),
            "date": row.get("date"),
            "is_inside_kangra": row.get("point_id") in self.inside_point_ids,
            "tmax": {
                "p10": row.get("tmax_p10"),
                "p50": row.get("tmax_p50"),
                "p90": row.get("tmax_p90"),
                "block_baseline": row.get("tmax_block")
            },
            "tmin": {
                "p10": row.get("tmin_p10"),
                "p50": row.get("tmin_p50"),
                "p90": row.get("tmin_p90"),
                "block_baseline": row.get("tmin_block")
            },
            "rain": {
                "p10": row.get("rain_p10"),
                "p50": row.get("rain_p50"),
                "p90": row.get("rain_p90"),
                "block_baseline": row.get("rain_block")
            },
            "weather_classification": {
                "rain_status": rain_class,
                "temp_max_status": "Warm" if tmax_val >= 30 else ("Cool" if tmax_val <= 20 else "Mild"),
                "temp_min_status": "Cold" if tmin_val <= 12 else "Moderate"
            }
        }

    def get_metrics(self) -> List[Dict[str, Any]]:
        if self.metrics_df.empty:
            return []
        return self.metrics_df.to_dict(orient='records')

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "targets": ["tmax", "tmin", "rain"],
            "prediction_quantiles": ["P10 (10th percentile)", "P50 (median prediction)", "P90 (90th percentile)"],
            "spatial_points": len(self.points_list),
            "inside_kangra_points": len(self.inside_point_ids),
            "excluded_points": len(self.excluded_point_ids),
            "total_rows": len(self.predictions_df),
            "date_range": {
                "start": self.available_dates[0] if self.available_dates else None,
                "end": self.available_dates[-1] if self.available_dates else None,
                "total_days": len(self.available_dates)
            },
            "model_type": "LightGBM Spatial Downscaling Quantile Model",
            "validation_experiments": [
                {
                    "name": "Experiment A - Temporal Holdout",
                    "description": "Evaluated model predictions on future temporal unseen periods across Kangra grid."
                },
                {
                    "name": "Experiment C - Spatial-Block Holdout (5 Folds)",
                    "description": "5-fold spatial block cross-validation to evaluate spatial generalization across unobserved spatial locations."
                }
            ],
            "baselines": ["block_copy", "era5_copy", "lapse_rate"],
            "has_live_model": MODEL_PATH.exists()
        }

data_service = DataService()
