
"""
Step 4 (CP8-CP9): Panchayat predictions + station validation.

Panchayat inference:
    python 04_predict.py panchayats \
        --boundaries data/raw/kangra_gp.geojson \
        --name-col GP_NAME \
        --start 2023-06-01 \
        --end 2023-09-30

Station validation:
    python 04_predict.py stations \
        --stations data/raw/stations_aws.csv

Optional station date range:
    python 04_predict.py stations \
        --stations data/raw/stations_aws.csv \
        --start 2023-06-01 \
        --end 2023-09-30

Station CSV columns:
    station,lat,lon,date,tmax,tmin,rain
"""

import argparse
import joblib
import numpy as np
import pandas as pd

from config import *
from modeling import *
import pipeline as pl


# ============================================================
# 1. LOAD SAVED MODELS
# ============================================================

def load_models():

    model_path = OUT / "models_lgbm.joblib"

    if not model_path.exists():
        raise FileNotFoundError(
            f"Saved model not found:\n{model_path}"
        )

    models = joblib.load(model_path)

    print(
        f"Loaded saved model: {model_path}"
    )

    print(
        f"Targets in saved model: "
        f"{list(models.keys())}"
    )

    # Make sure every configured target exists
    for tgt in TARGETS:

        if tgt not in models:

            raise KeyError(
                f"Target '{tgt}' is missing from saved model.\n"
                f"Available targets: {list(models.keys())}"
            )

    return models


# ============================================================
# 2. COMMON PREDICTION FUNCTION
# ============================================================

def predict_df(df, models):
    """
    Generate predictions using the SAME interface used
    by the existing trained model.

    Interface:
        models[tgt]
        ->
        predict_quantiles(models[tgt], df, tgt)

    Output:
        point_id
        lat
        lon
        date

        <target>_p10
        <target>_p50
        <target>_p90
        <target>_block
    """

    if df.empty:
        raise ValueError(
            "Feature frame is empty. "
            "No rows available for prediction."
        )

    required_base = [
        "point_id",
        "lat",
        "lon",
        "date"
    ]

    missing_base = [
        c for c in required_base
        if c not in df.columns
    ]

    if missing_base:

        raise KeyError(
            f"Feature frame missing required columns: "
            f"{missing_base}"
        )

    out = df[
        required_base
    ].copy()

    # --------------------------------------------------------
    # Predict each target
    # --------------------------------------------------------

    for tgt in TARGETS:

        print(
            f"\nPredicting target: {tgt}"
        )

        # IMPORTANT:
        # This is the same interface already used in
        # your training/evaluation code.
        q = predict_quantiles(
            models[tgt],
            df,
            tgt
        )

        # Save all returned quantiles
        for k, v in q.items():

            out[
                f"{tgt}_{k}"
            ] = np.asarray(v)

        # Save original block/coarse baseline
        baseline_col = TARGETS[tgt][1]

        if baseline_col not in df.columns:

            raise KeyError(
                f"Baseline column '{baseline_col}' "
                f"required for target '{tgt}' "
                f"is missing from feature frame."
            )

        out[
            f"{tgt}_block"
        ] = df[
            baseline_col
        ].values

    return out


# ============================================================
# 3. PANCHAYAT INFERENCE
# ============================================================

def run_panchayat_prediction(args, models):

    import geopandas as gpd

    print("\n" + "=" * 70)
    print("PANCHAYAT INFERENCE")
    print("=" * 70)

    # --------------------------------------------------------
    # Read Panchayat boundaries
    # --------------------------------------------------------

    print(
        f"Reading boundaries: {args.boundaries}"
    )

    g = gpd.read_file(
        args.boundaries
    )

    if g.empty:

        raise ValueError(
            "Boundary file contains no features."
        )

    print(
        f"Panchayat polygons: {len(g):,}"
    )

    # --------------------------------------------------------
    # Validate name column
    # --------------------------------------------------------

    if args.name_col:

        if args.name_col not in g.columns:

            raise KeyError(
                f"Name column '{args.name_col}' "
                f"not found in boundary file.\n\n"
                f"Available columns:\n"
                f"{list(g.columns)}"
            )

    # --------------------------------------------------------
    # Generate representative points
    # --------------------------------------------------------
    #
    # EPSG:32643 = UTM Zone 43N
    # Kangra/Himachal Pradesh lies in this UTM zone.
    #
    # representative_point() gives a point guaranteed to
    # lie within the polygon.
    # --------------------------------------------------------

    rp = (
        g.to_crs(32643)
         .geometry
         .representative_point()
         .to_crs(4326)
    )

    pts = pd.DataFrame({

        "point_id": [
            f"gp_{i:04d}"
            for i in range(len(g))
        ],

        "lat": rp.y.values,

        "lon": rp.x.values
    })

    # Add Panchayat name
    if args.name_col:

        pts["name"] = (
            g[args.name_col]
            .astype(str)
            .values
        )

    print(
        f"Representative points created: "
        f"{len(pts):,}"
    )

    print(
        f"Latitude range: "
        f"{pts['lat'].min():.4f} -> "
        f"{pts['lat'].max():.4f}"
    )

    print(
        f"Longitude range: "
        f"{pts['lon'].min():.4f} -> "
        f"{pts['lon'].max():.4f}"
    )

    # --------------------------------------------------------
    # Date validation
    # --------------------------------------------------------

    if not args.start:

        raise ValueError(
            "--start is required for Panchayat inference."
        )

    if not args.end:

        raise ValueError(
            "--end is required for Panchayat inference."
        )

    start = pd.Timestamp(
        args.start
    ).normalize()

    end = pd.Timestamp(
        args.end
    ).normalize()

    if start > end:

        raise ValueError(
            f"Invalid date range:\n"
            f"start={start}\n"
            f"end={end}"
        )

    print(
        f"Prediction period: "
        f"{start.date()} -> {end.date()}"
    )

    # --------------------------------------------------------
    # Build the SAME feature frame used during training
    # --------------------------------------------------------

    print(
        "\nBuilding feature frame..."
    )

    F = pl.build_feature_frame(
        pts[
            [
                "point_id",
                "lat",
                "lon"
            ]
        ],
        str(start.date()),
        str(end.date())
    )

    if F.empty:

        raise ValueError(
            "build_feature_frame() returned zero rows."
        )

    print(
        f"Feature frame rows: {len(F):,}"
    )

    print(
        f"Feature frame points: "
        f"{F['point_id'].nunique():,}"
    )

    print(
        f"Feature frame date range: "
        f"{pd.to_datetime(F['date']).min().date()} "
        f"-> "
        f"{pd.to_datetime(F['date']).max().date()}"
    )

    # --------------------------------------------------------
    # Run saved models
    # --------------------------------------------------------

    print(
        "\nRunning saved-model inference..."
    )

    out = predict_df(
        F,
        models
    )

    # --------------------------------------------------------
    # Add Panchayat metadata
    # --------------------------------------------------------

    metadata_cols = [
        "point_id"
    ]

    if "name" in pts.columns:

        metadata_cols.append(
            "name"
        )

    out = out.merge(
        pts[
            metadata_cols
        ],
        on="point_id",
        how="left",
        validate="many_to_one"
    )

    # --------------------------------------------------------
    # Arrange columns
    # --------------------------------------------------------

    first_cols = [
        "point_id"
    ]

    if "name" in out.columns:

        first_cols.append(
            "name"
        )

    first_cols += [
        "lat",
        "lon",
        "date"
    ]

    remaining_cols = [
        c
        for c in out.columns
        if c not in first_cols
    ]

    out = out[
        first_cols + remaining_cols
    ]

    out = out.sort_values(
        [
            "point_id",
            "date"
        ]
    ).reset_index(
        drop=True
    )

    # --------------------------------------------------------
    # Check quantile ordering
    # --------------------------------------------------------

    print(
        "\nChecking prediction quantiles..."
    )

    for tgt in TARGETS:

        p10 = f"{tgt}_p10"
        p50 = f"{tgt}_p50"
        p90 = f"{tgt}_p90"

        if (
            p10 in out.columns
            and
            p50 in out.columns
            and
            p90 in out.columns
        ):

            invalid = (
                (out[p10] > out[p50])
                |
                (out[p50] > out[p90])
            ).sum()

            print(
                f"{tgt}: "
                f"invalid P10/P50/P90 ordering = "
                f"{invalid:,}"
            )

    # --------------------------------------------------------
    # Save Parquet
    # --------------------------------------------------------

    output_parquet = (
        OUT /
        "panchayat_predictions.parquet"
    )

    out.to_parquet(
        output_parquet,
        index=False
    )

    # --------------------------------------------------------
    # Also save CSV for easy inspection
    # --------------------------------------------------------

    output_csv = (
        OUT /
        "panchayat_predictions.csv"
    )

    out.to_csv(
        output_csv,
        index=False
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("PANCHAYAT INFERENCE COMPLETE")
    print("=" * 70)

    print(
        f"Rows: {len(out):,}"
    )

    print(
        f"Points: "
        f"{out['point_id'].nunique():,}"
    )

    print(
        f"Dates: "
        f"{out['date'].min()} -> "
        f"{out['date'].max()}"
    )

    print(
        f"\nSaved Parquet:\n"
        f"{output_parquet}"
    )

    print(
        f"\nSaved CSV:\n"
        f"{output_csv}"
    )

    # --------------------------------------------------------
    # Prediction ranges
    # --------------------------------------------------------

    print(
        "\nPrediction ranges:"
    )

    for tgt in TARGETS:

        print(
            f"\n{tgt.upper()}"
        )

        for q in [
            "p10",
            "p50",
            "p90"
        ]:

            col = f"{tgt}_{q}"

            if col in out.columns:

                print(
                    f"  {q}: "
                    f"{out[col].min():.3f} -> "
                    f"{out[col].max():.3f}"
                )

        block_col = (
            f"{tgt}_block"
        )

        if block_col in out.columns:

            print(
                f"  block: "
                f"{out[block_col].min():.3f} -> "
                f"{out[block_col].max():.3f}"
            )

    print(
        "\nFirst 5 rows:"
    )

    print(
        out.head().to_string(
            index=False
        )
    )

    return out


# ============================================================
# 4. STATION VALIDATION
# ============================================================

def run_station_validation(args, models):

    print("\n" + "=" * 70)
    print("STATION VALIDATION")
    print("=" * 70)

    # --------------------------------------------------------
    # Read observations
    # --------------------------------------------------------

    print(
        f"Reading stations: {args.stations}"
    )

    obs = pd.read_csv(
        args.stations,
        parse_dates=["date"]
    )

    required = [
        "station",
        "lat",
        "lon",
        "date",
        "tmax",
        "tmin",
        "rain"
    ]

    missing = [
        c
        for c in required
        if c not in obs.columns
    ]

    if missing:

        raise KeyError(
            f"Station file missing columns: "
            f"{missing}"
        )

    obs["date"] = (
        pd.to_datetime(
            obs["date"]
        )
        .dt.normalize()
    )

    # --------------------------------------------------------
    # Optional date filtering
    # --------------------------------------------------------

    if args.start:

        obs = obs[
            obs["date"]
            >=
            pd.Timestamp(
                args.start
            ).normalize()
        ]

    if args.end:

        obs = obs[
            obs["date"]
            <=
            pd.Timestamp(
                args.end
            ).normalize()
        ]

    if obs.empty:

        raise ValueError(
            "No station observations remain "
            "after date filtering."
        )

    print(
        f"Station observations: "
        f"{len(obs):,}"
    )

    print(
        f"Stations: "
        f"{obs['station'].nunique():,}"
    )

    print(
        f"Observation period: "
        f"{obs['date'].min().date()} -> "
        f"{obs['date'].max().date()}"
    )

    # --------------------------------------------------------
    # Station coordinates
    # --------------------------------------------------------

    pts = (
        obs
        .drop_duplicates(
            "station"
        )
        .rename(
            columns={
                "station":
                "point_id"
            }
        )
        [
            [
                "point_id",
                "lat",
                "lon"
            ]
        ]
    )

    # --------------------------------------------------------
    # Build feature frame
    # --------------------------------------------------------

    print(
        "\nBuilding station feature frame..."
    )

    F = pl.build_feature_frame(
        pts,
        str(
            obs["date"]
            .min()
            .date()
        ),
        str(
            obs["date"]
            .max()
            .date()
        )
    )

    print(
        f"Feature rows before observation merge: "
        f"{len(F):,}"
    )

    # --------------------------------------------------------
    # Prepare observations
    # --------------------------------------------------------

    observed = (
        obs
        .rename(
            columns={
                "station": "point_id",
                "tmax": "o_tmax",
                "tmin": "o_tmin",
                "rain": "o_rain"
            }
        )
        [
            [
                "point_id",
                "date",
                "o_tmax",
                "o_tmin",
                "o_rain"
            ]
        ]
    )

    # --------------------------------------------------------
    # Merge observations with feature frame
    # --------------------------------------------------------

    F = F.merge(
        observed,
        on=[
            "point_id",
            "date"
        ],
        how="inner"
    )

    if F.empty:

        raise ValueError(
            "No station observations matched "
            "the generated feature frame."
        )

    print(
        f"Matched station rows: "
        f"{len(F):,}"
    )

    # --------------------------------------------------------
    # Evaluate every target
    # --------------------------------------------------------

    rows = []

    for tgt in TARGETS:

        print(
            f"\nEvaluating target: {tgt}"
        )

        # SAME saved-model interface
        q = predict_quantiles(
            models[tgt],
            F,
            tgt
        )

        # Existing baselines
        preds = baselines(
            F,
            tgt
        )

        # Add trained LightGBM P50
        preds[
            "lgbm_p50"
        ] = q[
            "p50"
        ].values

        # ----------------------------------------------------
        # Score every prediction method
        # ----------------------------------------------------

        for model_name, prediction in preds.items():

            if model_name == "lgbm_p50":

                r = score(
                    F,
                    F[
                        "o_" + tgt
                    ],
                    prediction,
                    tgt,
                    q["p10"],
                    q["p90"]
                )

            else:

                r = score(
                    F,
                    F[
                        "o_" + tgt
                    ],
                    prediction,
                    tgt
                )

            r.update(
                target=tgt,
                model=model_name
            )

            rows.append(r)

    # --------------------------------------------------------
    # Save station metrics
    # --------------------------------------------------------

    R = pd.DataFrame(
        rows
    )

    output_file = (
        OUT /
        "metrics_stations.csv"
    )

    R.to_csv(
        output_file,
        index=False
    )

    print("\n" + "=" * 70)
    print("STATION VALIDATION COMPLETE")
    print("=" * 70)

    print(
        R.round(3).to_string(
            index=False
        )
    )

    print(
        f"\nSaved:\n"
        f"{output_file}"
    )

    return R


# ============================================================
# 5. COMMAND-LINE INTERFACE
# ============================================================

if __name__ == "__main__":

    ap = argparse.ArgumentParser(
        description=(
            "Step 4: Panchayat inference "
            "and station validation"
        )
    )

    # --------------------------------------------------------
    # Mode
    # --------------------------------------------------------

    ap.add_argument(
        "mode",
        choices=[
            "panchayats",
            "stations"
        ],
        help=(
            "Run Panchayat predictions "
            "or station validation"
        )
    )

    # --------------------------------------------------------
    # Panchayat arguments
    # --------------------------------------------------------

    ap.add_argument(
        "--boundaries",
        default=None,
        help=(
            "Panchayat boundary GeoJSON/shapefile"
        )
    )

    ap.add_argument(
        "--name-col",
        default=None,
        help=(
            "Panchayat name column"
        )
    )

    # --------------------------------------------------------
    # Station arguments
    # --------------------------------------------------------

    ap.add_argument(
        "--stations",
        default=None,
        help=(
            "Station CSV file"
        )
    )

    # --------------------------------------------------------
    # Date arguments
    # --------------------------------------------------------

    ap.add_argument(
        "--start",
        default=None,
        help=(
            "Prediction/validation start date "
            "YYYY-MM-DD"
        )
    )

    ap.add_argument(
        "--end",
        default=None,
        help=(
            "Prediction/validation end date "
            "YYYY-MM-DD"
        )
    )

    args = ap.parse_args()

    # --------------------------------------------------------
    # Start
    # --------------------------------------------------------

    print("\n" + "=" * 70)
    print("STEP 4: INFERENCE / VALIDATION")
    print("=" * 70)

    print(
        f"Mode: {args.mode}"
    )

    # --------------------------------------------------------
    # Load saved models
    # --------------------------------------------------------

    models = load_models()

    # --------------------------------------------------------
    # Run requested mode
    # --------------------------------------------------------

    if args.mode == "panchayats":

        if not args.boundaries:

            ap.error(
                "--boundaries is required "
                "for panchayats mode"
            )

        if not args.start:

            ap.error(
                "--start is required "
                "for panchayats mode"
            )

        if not args.end:

            ap.error(
                "--end is required "
                "for panchayats mode"
            )

        run_panchayat_prediction(
            args,
            models
        )

    elif args.mode == "stations":

        if not args.stations:

            ap.error(
                "--stations is required "
                "for stations mode"
            )

        run_station_validation(
            args,
            models
        )

    print("\n" + "=" * 70)
    print("STEP 4 FINISHED")
    print("=" * 70)
