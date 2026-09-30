# Kangra Agro-Meteorological Advisory System (SIH PS74)

> **AI-Assisted Localized Weather Intelligence & Decision Support Platform for Kangra District**

---

## 🌟 Value Proposition Workflow

```
COARSE METEOROLOGICAL DATA (ERA5 / DEM / CHIRPS)
          ↓
LOCALIZED ML DOWNSCALING (LightGBM Quantile Models)
          ↓
GRID-LEVEL WEATHER INFORMATION (120 Points, P10/P50/P90)
          ↓
WEATHER RISK INTERPRETATION (Alert Engine)
          ↓
CROP-SPECIFIC ADVISORY (Transparent Agronomic Rules)
          ↓
FARMER DECISION SUPPORT
```

---

## 📌 Project Overview

The **Kangra Agro-Meteorological Advisory System** transforms coarse atmospheric forecasts into localized, high-resolution agricultural decision support. Developed for **Smart India Hackathon (SIH PS74)**, the platform uses machine-learning spatial downscaling (LightGBM quantile regression) to provide grid-level predictions for Maximum Temperature (`TMAX`), Minimum Temperature (`TMIN`), and Daily Rainfall (`RAIN`).

### Key Features
1. **Interactive Spatial Map**: Visualizes 120 prediction grid points across Kangra District (Lat 31.7°–32.6° N, Lon 75.8°–76.9° E) with configurable rainfall and temperature threshold legends.
2. **Quantile Uncertainty Visualization**: Displays median forecast (`P50`) alongside 10th (`P10`) and 90th (`P90`) percentile prediction uncertainty bands.
3. **Location Time-Series Forecasts**: Filterable forecast charts over 7, 14, 30 days or the complete available evaluation period.
4. **Transparent Crop Advisory Engine**: Evaluates downscaled weather quantiles against crop growth stage rules for Rice, Maize, Tomato, Potato, Apple, Wheat, and other crops.
5. **Weather Alert Dashboard**: Identifies model-based risk conditions (Heavy Rainfall, High Temperature Stress, Dry Spells, Spraying Window Risks).
6. **Empirical Model Performance**: Presents factual evaluation metrics from temporal holdout and 5-fold spatial-block holdout experiments directly from `metrics_all.csv`.

---

## 📁 System Architecture & Directory Structure

```
SIHPS74/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint
│   ├── config.py                   # Environment & path configuration
│   ├── requirements.txt            # Python dependencies
│   ├── config/
│   │   └── advisory_rules.json     # Configurable agronomic rules
│   ├── api/
│   │   └── endpoints.py            # FastAPI REST routes
│   └── services/
│       ├── data_service.py         # Memory dataset loader & query engine
│       ├── advisory_service.py     # Rule-based advisory generator
│       └── inference_service.py    # Joblib model inference service
├── frontend/
│   ├── package.json                # Frontend NPM dependencies
│   ├── vite.config.ts              # Vite proxy configuration
│   ├── tailwind.config.js          # Agricultural color palette styling
│   ├── index.html                  # HTML entry point with Leaflet styling
│   └── src/
│       ├── App.tsx                 # Main application state container
│       ├── main.tsx                # React root renderer
│       ├── types/                  # TypeScript interfaces
│       ├── services/               # API client service
│       ├── components/             # Reusable UI components
│       └── pages/                  # Main platform views
├── kangra_predictions.csv          # Evaluation prediction dataset (14,640 rows)
├── kangra_predictions.parquet      # Fast parquet evaluation dataset
├── metrics_all.csv                 # 84-row empirical validation metrics
├── models_lgbm.joblib              # Trained LightGBM model weights
├── .env.example                    # Environment settings template
└── README.md                       # Complete documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm

### 1. Launch Backend Server

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI application
uvicorn main:app --reload --port 8000
```
Backend server will be active at: `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 2. Launch Frontend Application

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend web application will open at: `http://localhost:3000`.

---

## 📡 API Endpoint Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Returns server status (`{"status": "ok"}`) |
| `/api/points` | GET | Returns all 120 spatial grid points (`point_id`, `lat`, `lon`) |
| `/api/dates` | GET | Returns available forecast dates (Min/Max date bounds) |
| `/api/predictions` | GET | Query time series by `point_id`, `start_date`, `end_date` |
| `/api/predictions/date/{date}` | GET | Returns map grid predictions for all 120 points on a target date |
| `/api/predictions/{point_id}` | GET | Returns full time-series forecast for a single grid point |
| `/api/summary/{point_id}` | GET | Returns weather summary and threshold classification |
| `/api/alerts` | GET | Returns active model-generated weather alerts |
| `/api/advisory` | GET | Evaluates crop-specific rules for `point_id`, `date`, `crop`, `growth_stage` |
| `/api/metrics` | GET | Returns model performance rows from `metrics_all.csv` |
| `/api/model-info` | GET | Returns model architecture and experiment metadata |
| `/api/predict_live` | POST | Optional live model inference using `models_lgbm.joblib` |

---

## 📊 Dataset & Prediction Schema

The dataset contains spatial predictions for **120 grid points** across **122 days** (2023-06-01 to 2023-09-30 = 14,640 prediction rows):

| Column | Description |
|---|---|
| `point_id` | Grid point identifier (`kangra_0000` to `kangra_0119`) |
| `lat`, `lon` | Geographic coordinates |
| `date` | Forecast date (`YYYY-MM-DD`) |
| `tmax_p10`, `tmax_p50`, `tmax_p90` | Daily Maximum Temp quantiles (10th, 50th median, 90th percentile) in °C |
| `tmin_p10`, `tmin_p50`, `tmin_p90` | Daily Minimum Temp quantiles in °C |
| `rain_p10`, `rain_p50`, `rain_p90` | Daily Rainfall quantiles in mm |
| `tmax_block`, `tmin_block`, `rain_block` | Baseline spatial block reference values |

---

## 🌾 Transparent Advisory Engine

Agricultural guidance is computed using a rule pipeline defined in `backend/config/advisory_rules.json`:

1. **Irrigation Rules**: Recommends postponing irrigation when `rain_p50 >= 10 mm` or `rain_p90 >= 25 mm` to avoid waterlogging.
2. **Plant Protection Rules**: Advises avoiding chemical pesticide/fungicide sprays when rainfall is expected within 6 hours.
3. **Crop-Specific Rules**:
   - **Rice**: Drainage warnings for young nursery beds during heavy rain; standing water buffering against cold night temperatures (`TMIN P50 < 15 °C`).
   - **Maize**: Drainage alerts for waterlogging-sensitive maize root zones.
   - **Tomato**: Late Blight fungal risk alerts during warm rainy spells (`rain_p50 >= 10 mm`, `24–30 °C`).
   - **Potato**: Digging suspension alerts during wet soil conditions to prevent soft rot.
   - **Apple**: Apple Scab infection risk monitoring during extended wet leaf periods.

---

## 📈 Model Validation Summary

The downscaling system was validated across two rigorous holdout experiments:
1. **Experiment A (Temporal Holdout)**: Future unseen dates across Kangra.
   - **TMAX RMSE**: LightGBM `1.152 °C` vs Baseline `11.859 °C`
   - **TMIN RMSE**: LightGBM `1.669 °C` vs Baseline `10.673 °C`
   - **RAIN RMSE**: LightGBM `19.408 mm` vs Baseline `20.565 mm`
2. **Experiment C (Spatial-Block Holdout)**: 5-fold spatial cluster holdout across unobserved grid points.

---

## ⚠️ Scientific Limitations & Honesty

- Demonstration predictions cover the 2023 monsoon season (**01 Jun 2023 – 30 Sep 2023**).
- Spatial coverage is represented by **120 grid points** rather than polygon boundaries.
- `P10/P50/P90` represent quantile model outputs, bounding model uncertainty.
- Advisories serve as **decision-support guidance** and should be combined with local agricultural extension expertise.
- This platform does not replace official meteorological disaster warnings.

---

## 🏆 SIH Demonstration Workflow

1. **Open Dashboard**: View district-wide weather summary cards and active alerts.
2. **Explore Map**: Select dates and toggle between `Rainfall`, `TMAX`, and `TMIN` color markers.
3. **Click a Grid Point**: Inspect localized temperature and rainfall prediction ranges.
4. **View Location Forecast**: Analyze 7-day to 30-day time-series charts with `P10–P90` shaded bands.
5. **Generate Advisory**: Select crop (e.g. *Tomato* or *Rice*) and growth stage to produce transparent actionable guidance.
6. **Review Performance**: Inspect empirical RMSE/MAE tables and validation charts on the *Model Performance* page.
