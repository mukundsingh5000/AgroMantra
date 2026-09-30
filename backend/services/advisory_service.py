import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from config import BASE_DIR
from services.data_service import data_service

logger = logging.getLogger("kangra_backend")

RULES_FILE = BASE_DIR / "config" / "advisory_rules.json"
if not RULES_FILE.exists():
    RULES_FILE = BASE_DIR / "backend" / "config" / "advisory_rules.json"

class AdvisoryEngine:
    def __init__(self):
        self.rules_config: Dict[str, Any] = {}
        self.load_rules()

    def load_rules(self):
        """Load rules configuration from JSON file."""
        if RULES_FILE.exists():
            try:
                with open(RULES_FILE, "r", encoding="utf-8") as f:
                    self.rules_config = json.load(f)
                logger.info(f"Loaded advisory rules from {RULES_FILE}")
            except Exception as e:
                logger.error(f"Failed to load advisory rules file: {e}")
                self.rules_config = {}
        else:
            logger.warning(f"Advisory rules file not found at {RULES_FILE}")

    def evaluate_advisory(
        self,
        point_id: str,
        target_date: str,
        crop: str = "Rice",
        growth_stage: str = "Vegetative"
    ) -> Dict[str, Any]:
        """Evaluate weather prediction against advisory rules."""
        # Fetch target date predictions
        summary = data_service.get_summary(point_id, target_date)
        
        tmax_p10 = summary["tmax"]["p10"]
        tmax_p50 = summary["tmax"]["p50"]
        tmax_p90 = summary["tmax"]["p90"]
        
        tmin_p10 = summary["tmin"]["p10"]
        tmin_p50 = summary["tmin"]["p50"]
        tmin_p90 = summary["tmin"]["p90"]

        rain_p10 = summary["rain"]["p10"]
        rain_p50 = summary["rain"]["p50"]
        rain_p90 = summary["rain"]["p90"]

        # Fetch next 3 days predictions to check upcoming multi-day trend
        point_preds = data_service.get_predictions_by_point(point_id)
        upcoming = [p for p in point_preds if p['date'] >= target_date][:3]
        
        avg_3day_rain = sum(p['rain_p50'] for p in upcoming) if upcoming else rain_p50
        max_3day_rain_p90 = max((p['rain_p90'] for p in upcoming), default=rain_p90)
        consecutive_dry_days = sum(1 for p in upcoming if p['rain_p50'] < 1.0)

        # Context environment for rule evaluation
        context = {
            "rain_p10": rain_p10,
            "rain_p50": rain_p50,
            "rain_p90": rain_p90,
            "tmax_p10": tmax_p10,
            "tmax_p50": tmax_p50,
            "tmax_p90": tmax_p90,
            "tmin_p10": tmin_p10,
            "tmin_p50": tmin_p50,
            "tmin_p90": tmin_p90,
            "avg_3day_rain": avg_3day_rain,
            "max_3day_rain_p90": max_3day_rain_p90,
            "consecutive_dry_days": consecutive_dry_days,
            "crop": crop,
            "growth_stage": growth_stage
        }

        generated_advisories = []

        # 1. Evaluate general rules
        general_rules = self.rules_config.get("general_rules", [])
        for rule in general_rules:
            if self._eval_condition(rule.get("condition", ""), context):
                adv_text = rule.get("advisory", "").format(
                    rain_p50=f"{rain_p50:.1f}",
                    rain_p90=f"{rain_p90:.1f}",
                    tmax_p50=f"{tmax_p50:.1f}",
                    tmin_p50=f"{tmin_p50:.1f}"
                )
                generated_advisories.append({
                    "id": rule.get("id"),
                    "category": rule.get("category"),
                    "title": rule.get("title"),
                    "advisory": adv_text,
                    "severity": rule.get("severity", "Info"),
                    "reason": rule.get("reason"),
                    "scope": "General Agronomic"
                })

        # 2. Evaluate crop-specific rules
        crop_rules = self.rules_config.get("crop_specific_rules", {}).get(crop, [])
        for rule in crop_rules:
            if self._eval_condition(rule.get("condition", ""), context):
                adv_text = rule.get("advisory", "").format(
                    rain_p50=f"{rain_p50:.1f}",
                    rain_p90=f"{rain_p90:.1f}",
                    tmax_p50=f"{tmax_p50:.1f}",
                    tmin_p50=f"{tmin_p50:.1f}"
                )
                generated_advisories.append({
                    "id": rule.get("id", f"{crop}_rule"),
                    "category": rule.get("category"),
                    "title": rule.get("title"),
                    "advisory": adv_text,
                    "severity": rule.get("severity", "Moderate"),
                    "reason": rule.get("reason"),
                    "scope": f"Crop Specific ({crop})"
                })

        # Assess overall risk level
        severities = [a["severity"] for a in generated_advisories]
        if "High" in severities:
            overall_risk = "High Risk"
        elif "Moderate" in severities:
            overall_risk = "Moderate Risk"
        else:
            overall_risk = "Favorable / Normal"

        return {
            "point_id": point_id,
            "date": target_date,
            "crop": crop,
            "growth_stage": growth_stage,
            "weather_summary": {
                "tmax_p50": f"{tmax_p50:.1f} °C",
                "tmax_range": f"{tmax_p10:.1f} – {tmax_p90:.1f} °C",
                "tmin_p50": f"{tmin_p50:.1f} °C",
                "tmin_range": f"{tmin_p10:.1f} – {tmin_p90:.1f} °C",
                "rain_p50": f"{rain_p50:.1f} mm",
                "rain_range": f"{rain_p10:.1f} – {rain_p90:.1f} mm",
                "classification": summary["weather_classification"]["rain_status"]
            },
            "risk_level": overall_risk,
            "advisories": generated_advisories,
            "disclaimer": "Advisory is decision support and should be interpreted with local agricultural guidance.",
            "data_basis": f"Grid Point {point_id} (Lat {summary['lat']}, Lon {summary['lon']}) downscaled prediction quantiles (P10/P50/P90)."
        }

    def generate_alerts(
        self,
        point_id: Optional[str] = None,
        date: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate system-wide or point/date specific weather alerts."""
        all_alerts = []
        
        target_dates = [date] if date else data_service.available_dates[:15] # limit sample if no date
        if not target_dates:
            return []

        points = [p["point_id"] for p in data_service.get_points()]
        if point_id:
            points = [point_id]
        else:
            # Pick a subset of points if sweeping all dates to keep performance snappy
            points = points[:20]

        for p_id in points:
            for d in target_dates:
                summary = data_service.get_summary(p_id, d)
                rain_p50 = summary["rain"]["p50"]
                rain_p90 = summary["rain"]["p90"]
                tmax_p50 = summary["tmax"]["p50"]
                tmin_p50 = summary["tmin"]["p50"]

                # 1. Heavy rain alert
                if rain_p50 >= 20.0 or rain_p90 >= 40.0:
                    all_alerts.append({
                        "alert_id": f"alert_rain_{p_id}_{d}",
                        "type": "Heavy Rainfall Risk",
                        "severity": "High" if rain_p50 >= 35.0 else "Moderate",
                        "point_id": p_id,
                        "lat": summary["lat"],
                        "lon": summary["lon"],
                        "date": d,
                        "observed_condition": f"Expected Rainfall P50: {rain_p50:.1f} mm (P90: {rain_p90:.1f} mm)",
                        "suggested_action": "Postpone field spraying, harvesting, and irrigation. Inspect drainage in low-lying crop fields."
                    })
                
                # 2. High temp alert
                if tmax_p50 >= 34.0:
                    all_alerts.append({
                        "alert_id": f"alert_heat_{p_id}_{d}",
                        "type": "High Temperature Warning",
                        "severity": "Moderate",
                        "point_id": p_id,
                        "lat": summary["lat"],
                        "lon": summary["lon"],
                        "date": d,
                        "observed_condition": f"Daytime Maximum Temp P50: {tmax_p50:.1f} °C",
                        "suggested_action": "Provide protective mulch or light evening irrigation for heat-sensitive horticulture."
                    })

                # 3. Dry spell alert
                if rain_p50 < 0.5 and rain_p90 < 2.0 and tmax_p50 >= 32.0:
                    all_alerts.append({
                        "alert_id": f"alert_dry_{p_id}_{d}",
                        "type": "Dry & Warm Spell",
                        "severity": "Info",
                        "point_id": p_id,
                        "lat": summary["lat"],
                        "lon": summary["lon"],
                        "date": d,
                        "observed_condition": f"Rain P50: {rain_p50:.1f} mm, TMAX P50: {tmax_p50:.1f} °C",
                        "suggested_action": "Schedule light supplemental irrigation and check soil moisture levels."
                    })

        return sorted(all_alerts, key=lambda x: (x["date"], x["severity"]), reverse=True)

    def _eval_condition(self, condition: str, context: Dict[str, Any]) -> bool:
        """Safely evaluate boolean condition string against context."""
        if not condition:
            return False
        try:
            # Restricted safe eval context
            return bool(eval(condition, {"__builtins__": None}, context))
        except Exception:
            return False

advisory_engine = AdvisoryEngine()
