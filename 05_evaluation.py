
"""
STEP 5 — FINAL EVALUATION + VISUALIZATION

Uses:
    outputs/metrics_all.csv
    outputs/metrics.csv              (optional/reference)
    outputs/kangra_predictions.csv
    outputs/kangra_predictions.parquet

Does NOT require:
    Panchayat boundaries
    Station observations

Generates:
    outputs/evaluation/
        metrics_clean.csv
        model_summary.csv
        target_summary.csv
        spatial_validation_summary.csv
        rainfall_summary.csv

        rmse_tmax.png
        rmse_tmin.png
        rmse_rain.png

        mae_tmax.png
        mae_tmin.png
        mae_rain.png

        spatial_rmse_tmax.png
        spatial_rmse_tmin.png
        spatial_rmse_rain.png

        rainfall_pod1.png
        rainfall_far1.png
        rainfall_csi1.png

        tmax_spatial_map.png
        tmin_spatial_map.png
        rain_spatial_map.png

        tmax_uncertainty.png
        tmin_uncertainty.png
        rain_uncertainty.png

        point_temperature_timeseries.png
        point_rainfall_timeseries.png

        evaluation_summary.txt
"""


# ============================================================
# IMPORTS
# ============================================================

from pathlib import Path
import warnings

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore")


# ============================================================
# PATHS
# ============================================================

ROOT = Path(
    "/content/drive/MyDrive/SIH_PS74_Downscaling"
)

OUT = ROOT / "outputs"

EVAL = OUT / "evaluation"

EVAL.mkdir(
    parents=True,
    exist_ok=True
)


METRICS_ALL = OUT / "metrics_all.csv"
METRICS = OUT / "metrics.csv"

PRED_PARQUET = (
    OUT / "kangra_predictions.parquet"
)

PRED_CSV = (
    OUT / "kangra_predictions.csv"
)


# ============================================================
# HELPERS
# ============================================================

def require_file(path):

    if not path.exists():

        raise FileNotFoundError(
            f"\nRequired file not found:\n{path}"
        )


def savefig(
    name,
    dpi=200
):

    path = EVAL / name

    plt.tight_layout()

    plt.savefig(
        path,
        dpi=dpi,
        bbox_inches="tight"
    )

    plt.close()

    print(
        f"Saved figure: {path}"
    )


def safe_float(x):

    try:
        return float(x)

    except Exception:
        return np.nan


# ============================================================
# START
# ============================================================

print("=" * 70)
print("STEP 5: FINAL EVALUATION")
print("=" * 70)


# ============================================================
# LOAD METRICS
# ============================================================

require_file(
    METRICS_ALL
)

metrics = pd.read_csv(
    METRICS_ALL
)


print(
    "\nLoaded metrics:"
)

print(
    metrics.shape
)


# ============================================================
# LOAD PREDICTIONS
# ============================================================

if PRED_PARQUET.exists():

    predictions = pd.read_parquet(
        PRED_PARQUET
    )

    print(
        f"\nLoaded predictions from:\n"
        f"{PRED_PARQUET}"
    )

elif PRED_CSV.exists():

    predictions = pd.read_csv(
        PRED_CSV,
        parse_dates=["date"]
    )

    print(
        f"\nLoaded predictions from:\n"
        f"{PRED_CSV}"
    )

else:

    raise FileNotFoundError(
        "\nNeither prediction file exists:\n"
        f"{PRED_PARQUET}\n"
        f"{PRED_CSV}"
    )


print(
    "\nLoaded predictions:"
)

print(
    predictions.shape
)


# ============================================================
# NORMALIZE METRICS
# ============================================================

metrics.columns = [
    str(c).strip().lower()
    for c in metrics.columns
]


# ============================================================
# NORMALIZE PREDICTIONS
# ============================================================

predictions.columns = [
    str(c).strip().lower()
    for c in predictions.columns
]


if "date" not in predictions.columns:

    raise KeyError(
        "Prediction file does not contain 'date'."
    )


predictions["date"] = (
    pd.to_datetime(
        predictions["date"]
    )
    .dt.normalize()
)


print(
    "\nMetrics columns:"
)

print(
    metrics.columns.tolist()
)


print(
    "\nPrediction columns:"
)

print(
    predictions.columns.tolist()
)


# ============================================================
# REQUIRED METRIC COLUMNS
# ============================================================

required_metric_columns = [
    "experiment",
    "target",
    "model",
    "rmse",
    "mae",
    "bias"
]

missing_metric_columns = [
    c
    for c in required_metric_columns
    if c not in metrics.columns
]

if missing_metric_columns:

    raise KeyError(
        "metrics_all.csv is missing required columns: "
        f"{missing_metric_columns}"
    )


# ============================================================
# IMPORTANT FIX
# DERIVE RMSE GAIN AGAINST BLOCK BASELINE
# ============================================================

print(
    "\n"
    + "=" * 70
)

print(
    "DERIVING RMSE GAIN AGAINST BLOCK BASELINE"
)

print(
    "=" * 70
)


# If the column already exists, remove it temporarily.
# This prevents duplicate-column problems when merging.
if "rmse_gain_vs_block_%" in metrics.columns:

    metrics = metrics.drop(
        columns=["rmse_gain_vs_block_%"]
    )


# ------------------------------------------------------------
# Find block-copy baseline
# ------------------------------------------------------------

block_rmse = (
    metrics.loc[
        metrics["model"]
        .astype(str)
        .str.lower()
        .eq("block_copy"),
        [
            "experiment",
            "target",
            "rmse"
        ]
    ]
    .copy()
)


# Rename baseline RMSE
block_rmse = block_rmse.rename(
    columns={
        "rmse": "block_rmse"
    }
)


# Make sure each experiment + target has
# only one baseline row.
block_rmse = (
    block_rmse
    .drop_duplicates(
        subset=[
            "experiment",
            "target"
        ]
    )
)


print(
    "\nBlock baseline rows:"
)

print(
    block_rmse.to_string(
        index=False
    )
)


# ------------------------------------------------------------
# Merge baseline RMSE
# ------------------------------------------------------------

metrics = metrics.merge(
    block_rmse,
    on=[
        "experiment",
        "target"
    ],
    how="left"
)


# ------------------------------------------------------------
# Calculate percentage RMSE improvement
# ------------------------------------------------------------

metrics[
    "rmse_gain_vs_block_%"
] = np.where(

    (
        metrics["block_rmse"].notna()
    )
    &
    (
        metrics["block_rmse"] != 0
    ),

    100.0
    *
    (
        metrics["block_rmse"]
        -
        metrics["rmse"]
    )
    /
    metrics["block_rmse"],

    np.nan
)


print(
    "\nDerived RMSE gain:"
)


print(
    metrics[
        [
            "experiment",
            "target",
            "model",
            "rmse",
            "block_rmse",
            "rmse_gain_vs_block_%"
        ]
    ]
    .round(3)
    .to_string(index=False)
)


# ============================================================
# BASIC DATASET SUMMARY
# ============================================================

summary_lines = []


summary_lines.append(
    "KANGRA DOWNSCALING — FINAL EVALUATION SUMMARY"
)

summary_lines.append(
    "=" * 60
)


summary_lines.append(
    f"Prediction rows: "
    f"{len(predictions):,}"
)


if "point_id" in predictions.columns:

    summary_lines.append(
        f"Unique points: "
        f"{predictions.point_id.nunique():,}"
    )


summary_lines.append(
    f"Prediction start: "
    f"{predictions.date.min().date()}"
)


summary_lines.append(
    f"Prediction end: "
    f"{predictions.date.max().date()}"
)


if "lat" in predictions.columns:

    summary_lines.append(
        f"Latitude range: "
        f"{predictions.lat.min():.4f} -> "
        f"{predictions.lat.max():.4f}"
    )


if "lon" in predictions.columns:

    summary_lines.append(
        f"Longitude range: "
        f"{predictions.lon.min():.4f} -> "
        f"{predictions.lon.max():.4f}"
    )


summary_lines.append(
    f"Metrics rows: {len(metrics):,}"
)


summary_lines.append(
    f"Experiments: "
    f"{', '.join(sorted(metrics['experiment'].astype(str).unique()))}"
)


summary_lines.append(
    f"Targets: "
    f"{', '.join(sorted(metrics['target'].astype(str).unique()))}"
)


# ============================================================
# SAVE CLEAN METRICS
# ============================================================

metrics.to_csv(
    EVAL / "metrics_clean.csv",
    index=False
)

print(
    f"\nSaved: "
    f"{EVAL / 'metrics_clean.csv'}"
)


# ============================================================
# MODEL SUMMARY
# ============================================================

summary_cols = [
    "experiment",
    "target",
    "model",
    "n",
    "rmse",
    "mae",
    "bias",
    "block_rmse",
    "rmse_gain_vs_block_%",
    "cov80",
    "monthly_rmse",
    "pod1",
    "far1",
    "csi1",
    "pod10",
    "far10",
    "csi10"
]


summary_cols = [
    c
    for c in summary_cols
    if c in metrics.columns
]


model_summary = (
    metrics[
        summary_cols
    ]
    .sort_values(
        [
            c
            for c in [
                "experiment",
                "target",
                "rmse"
            ]
            if c in metrics.columns
        ]
    )
)


model_summary.to_csv(
    EVAL / "model_summary.csv",
    index=False
)


print(
    f"Saved: "
    f"{EVAL / 'model_summary.csv'}"
)


# ============================================================
# TARGET SUMMARY
# ============================================================

target_summary = (
    metrics
    .groupby(
        [
            "experiment",
            "target"
        ],
        as_index=False
    )
    .agg(
        models=(
            "model",
            "count"
        ),

        min_rmse=(
            "rmse",
            "min"
        ),

        min_mae=(
            "mae",
            "min"
        ),

        max_rmse_gain=(
            "rmse_gain_vs_block_%",
            "max"
        )
    )
)


target_summary.to_csv(
    EVAL / "target_summary.csv",
    index=False
)


print(
    f"Saved: "
    f"{EVAL / 'target_summary.csv'}"
)


# ============================================================
# SPATIAL VALIDATION SUMMARY
# ============================================================

spatial = metrics[
    metrics["experiment"]
    .astype(str)
    .str.lower()
    == "c"
].copy()


if not spatial.empty:

    spatial_summary = (
        spatial
        .groupby(
            [
                "target",
                "model"
            ],
            as_index=False
        )
        .agg(
            mean_rmse=(
                "rmse",
                "mean"
            ),

            std_rmse=(
                "rmse",
                "std"
            ),

            mean_mae=(
                "mae",
                "mean"
            ),

            mean_bias=(
                "bias",
                "mean"
            ),

            mean_rmse_gain=(
                "rmse_gain_vs_block_%",
                "mean"
            )
        )
        .sort_values(
            [
                "target",
                "mean_rmse"
            ]
        )
    )

else:

    spatial_summary = (
        pd.DataFrame()
    )


spatial_summary.to_csv(
    EVAL / "spatial_validation_summary.csv",
    index=False
)


print(
    f"Saved: "
    f"{EVAL / 'spatial_validation_summary.csv'}"
)


# ============================================================
# RAINFALL SUMMARY
# ============================================================

rain = metrics[
    metrics["target"]
    .astype(str)
    .str.lower()
    == "rain"
].copy()


if not rain.empty:

    rain_cols = [
        "experiment",
        "model",
        "rmse",
        "mae",
        "bias",
        "block_rmse",
        "rmse_gain_vs_block_%",
        "monthly_rmse",
        "pod1",
        "far1",
        "csi1",
        "pod10",
        "far10",
        "csi10"
    ]


    rain_cols = [
        c
        for c in rain_cols
        if c in rain.columns
    ]


    rainfall_summary = (
        rain[
            rain_cols
        ]
        .sort_values(
            [
                "experiment",
                "rmse"
            ]
        )
    )

else:

    rainfall_summary = (
        pd.DataFrame()
    )


rainfall_summary.to_csv(
    EVAL / "rainfall_summary.csv",
    index=False
)


print(
    f"Saved: "
    f"{EVAL / 'rainfall_summary.csv'}"
)


# ============================================================
# FIGURE 1 — RMSE COMPARISON
# ============================================================

print(
    "\nCreating RMSE comparison figures..."
)


plot_df = metrics.copy()


for target in [
    "tmax",
    "tmin",
    "rain"
]:

    sub = plot_df[
        plot_df["target"]
        .astype(str)
        .str.lower()
        == target
    ].copy()


    if sub.empty:
        continue


    labels = (
        sub["experiment"].astype(str)
        + " / "
        + sub["model"].astype(str)
    )


    plt.figure(
        figsize=(12, 6)
    )


    plt.bar(
        np.arange(len(sub)),
        sub["rmse"]
    )


    plt.xticks(
        np.arange(len(sub)),
        labels,
        rotation=60,
        ha="right"
    )


    plt.ylabel(
        "RMSE"
    )


    plt.title(
        f"{target.upper()} — RMSE Comparison"
    )


    savefig(
        f"rmse_{target}.png"
    )


# ============================================================
# FIGURE 2 — MAE COMPARISON
# ============================================================

print(
    "\nCreating MAE comparison figures..."
)


for target in [
    "tmax",
    "tmin",
    "rain"
]:

    sub = plot_df[
        plot_df["target"]
        .astype(str)
        .str.lower()
        == target
    ].copy()


    if sub.empty:
        continue


    labels = (
        sub["experiment"].astype(str)
        + " / "
        + sub["model"].astype(str)
    )


    plt.figure(
        figsize=(12, 6)
    )


    plt.bar(
        np.arange(len(sub)),
        sub["mae"]
    )


    plt.xticks(
        np.arange(len(sub)),
        labels,
        rotation=60,
        ha="right"
    )


    plt.ylabel(
        "MAE"
    )


    plt.title(
        f"{target.upper()} — MAE Comparison"
    )


    savefig(
        f"mae_{target}.png"
    )


# ============================================================
# FIGURE 3 — SPATIAL BLOCK RMSE
# ============================================================

if not spatial.empty:

    print(
        "\nCreating spatial validation figures..."
    )


    for target in [
        "tmax",
        "tmin",
        "rain"
    ]:

        sub = spatial[
            spatial["target"]
            .astype(str)
            .str.lower()
            == target
        ].copy()


        if sub.empty:
            continue


        pivot = (
            sub
            .pivot_table(
                index="experiment",
                columns="model",
                values="rmse",
                aggfunc="mean"
            )
        )


        ax = pivot.plot(
            kind="bar",
            figsize=(11, 6)
        )


        ax.set_title(
            f"{target.upper()} — "
            f"Spatial Block RMSE"
        )


        ax.set_ylabel(
            "Mean RMSE"
        )


        plt.xticks(
            rotation=0
        )


        savefig(
            f"spatial_rmse_{target}.png"
        )


# ============================================================
# FIGURE 4 — RAINFALL DETECTION METRICS
# ============================================================

if not rain.empty:

    print(
        "\nCreating rainfall detection figures..."
    )


    # Prefer spatial-block rainfall
    r = rain[
        rain["experiment"]
        .astype(str)
        .str.lower()
        == "c"
    ].copy()


    if r.empty:

        r = rain.copy()


    for metric_name in [
        "pod1",
        "far1",
        "csi1"
    ]:

        if metric_name not in r.columns:
            continue


        sub = r.dropna(
            subset=[
                metric_name
            ]
        )


        if sub.empty:
            continue


        labels = (
            sub["model"]
            .astype(str)
        )


        plt.figure(
            figsize=(10, 6)
        )


        plt.bar(
            np.arange(len(sub)),
            sub[metric_name]
        )


        plt.xticks(
            np.arange(len(sub)),
            labels,
            rotation=45,
            ha="right"
        )


        plt.ylabel(
            metric_name.upper()
        )


        plt.title(
            "Rainfall Detection — "
            f"{metric_name.upper()}"
        )


        savefig(
            f"rainfall_{metric_name}.png"
        )


# ============================================================
# SPATIAL MAP FUNCTION
# ============================================================

def spatial_map(
    df,
    value_col,
    title,
    filename,
    cmap="viridis"
):

    if df.empty:
        return


    if value_col not in df.columns:

        print(
            f"Skipping {filename}: "
            f"{value_col} missing."
        )

        return


    plt.figure(
        figsize=(9, 7)
    )


    sc = plt.scatter(
        df["lon"],
        df["lat"],
        c=df[value_col],
        s=35,
        cmap=cmap
    )


    plt.colorbar(
        sc,
        label=value_col
    )


    plt.xlabel(
        "Longitude"
    )


    plt.ylabel(
        "Latitude"
    )


    plt.title(
        title
    )


    plt.grid(
        alpha=0.25
    )


    savefig(
        filename
    )


# ============================================================
# SELECT REPRESENTATIVE DATE
# ============================================================

preferred_date = pd.Timestamp(
    "2023-08-15"
)


available_dates = (
    predictions[
        "date"
    ]
    .drop_duplicates()
    .sort_values()
)


if preferred_date in set(
    available_dates
):

    map_date = preferred_date

else:

    map_date = available_dates[
        len(available_dates) // 2
    ]


map_df = predictions[
    predictions["date"]
    == map_date
].copy()


summary_lines.append(
    f"Representative map date: "
    f"{map_date.date()}"
)


print(
    "\nSpatial map date:"
)

print(
    map_date.date()
)


# ============================================================
# FIGURE 5 — TMAX SPATIAL MAP
# ============================================================

spatial_map(
    map_df,
    "tmax_p50",
    f"Kangra TMAX P50 — "
    f"{map_date.date()}",
    "tmax_spatial_map.png"
)


# ============================================================
# FIGURE 6 — TMIN SPATIAL MAP
# ============================================================

spatial_map(
    map_df,
    "tmin_p50",
    f"Kangra TMIN P50 — "
    f"{map_date.date()}",
    "tmin_spatial_map.png"
)


# ============================================================
# FIGURE 7 — RAINFALL SPATIAL MAP
# ============================================================

spatial_map(
    map_df,
    "rain_p50",
    f"Kangra Rainfall P50 — "
    f"{map_date.date()}",
    "rain_spatial_map.png"
)


# ============================================================
# SELECT REPRESENTATIVE POINT
# ============================================================

point_counts = (
    predictions
    .groupby(
        "point_id"
    )
    .size()
)


candidate_points = (
    predictions[
        predictions["point_id"]
        .isin(
            point_counts.index
        )
    ]
    .groupby(
        "point_id"
    )[
        ["lat", "lon"]
    ]
    .first()
)


center_lat = (
    candidate_points["lat"]
    .mean()
)


center_lon = (
    candidate_points["lon"]
    .mean()
)


candidate_points["distance"] = (

    (
        candidate_points["lat"]
        -
        center_lat
    ) ** 2

    +

    (
        candidate_points["lon"]
        -
        center_lon
    ) ** 2
)


central_point = (
    candidate_points[
        "distance"
    ]
    .idxmin()
)


point_df = (
    predictions[
        predictions["point_id"]
        == central_point
    ]
    .sort_values(
        "date"
    )
)


print(
    "\nRepresentative point:"
)

print(
    central_point
)


summary_lines.append(
    f"Representative point: "
    f"{central_point}"
)


# ============================================================
# UNCERTAINTY PLOT FUNCTION
# ============================================================

def uncertainty_plot(
    df,
    p10,
    p50,
    p90,
    block,
    title,
    ylabel,
    filename
):

    required = [
        p10,
        p50,
        p90
    ]


    if not all(
        c in df.columns
        for c in required
    ):

        print(
            f"Skipping {filename}: "
            f"required columns missing."
        )

        return


    plt.figure(
        figsize=(13, 6)
    )


    x = df["date"]


    plt.fill_between(
        x,
        df[p10],
        df[p90],
        alpha=0.25,
        label="P10–P90"
    )


    plt.plot(
        x,
        df[p50],
        label="P50"
    )


    if block in df.columns:

        plt.plot(
            x,
            df[block],
            linestyle="--",
            label="Block baseline"
        )


    plt.xlabel(
        "Date"
    )


    plt.ylabel(
        ylabel
    )


    plt.title(
        title
    )


    plt.legend()


    plt.grid(
        alpha=0.25
    )


    savefig(
        filename
    )


# ============================================================
# UNCERTAINTY — TMAX
# ============================================================

uncertainty_plot(
    point_df,
    "tmax_p10",
    "tmax_p50",
    "tmax_p90",
    "tmax_block",
    f"TMAX Quantile Prediction — "
    f"{central_point}",
    "Temperature",
    "tmax_uncertainty.png"
)


# ============================================================
# UNCERTAINTY — TMIN
# ============================================================

uncertainty_plot(
    point_df,
    "tmin_p10",
    "tmin_p50",
    "tmin_p90",
    "tmin_block",
    f"TMIN Quantile Prediction — "
    f"{central_point}",
    "Temperature",
    "tmin_uncertainty.png"
)


# ============================================================
# UNCERTAINTY — RAIN
# ============================================================

uncertainty_plot(
    point_df,
    "rain_p10",
    "rain_p50",
    "rain_p90",
    "rain_block",
    f"Rainfall Quantile Prediction — "
    f"{central_point}",
    "Rainfall",
    "rain_uncertainty.png"
)


# ============================================================
# POINT TEMPERATURE TIME SERIES
# ============================================================

if (
    "tmax_p50" in point_df.columns
    and
    "tmin_p50" in point_df.columns
):

    plt.figure(
        figsize=(14, 7)
    )


    plt.plot(
        point_df["date"],
        point_df["tmax_p50"],
        label="TMAX P50"
    )


    plt.plot(
        point_df["date"],
        point_df["tmin_p50"],
        label="TMIN P50"
    )


    plt.xlabel(
        "Date"
    )


    plt.ylabel(
        "Temperature"
    )


    plt.title(
        f"Kangra Downscaled Temperature — "
        f"{central_point}"
    )


    plt.legend()


    plt.grid(
        alpha=0.25
    )


    savefig(
        "point_temperature_timeseries.png"
    )


# ============================================================
# POINT RAINFALL TIME SERIES
# ============================================================

if (
    "rain_p50" in point_df.columns
):

    plt.figure(
        figsize=(14, 7)
    )


    plt.plot(
        point_df["date"],
        point_df["rain_p50"],
        label="Rainfall P50"
    )


    if "rain_p90" in point_df.columns:

        plt.plot(
            point_df["date"],
            point_df["rain_p90"],
            label="Rainfall P90"
        )


    plt.xlabel(
        "Date"
    )


    plt.ylabel(
        "Rainfall"
    )


    plt.title(
        f"Kangra Downscaled Rainfall — "
        f"{central_point}"
    )


    plt.legend()


    plt.grid(
        alpha=0.25
    )


    savefig(
        "point_rainfall_timeseries.png"
    )


# ============================================================
# PREDICTION SANITY CHECKS
# ============================================================

print(
    "\n"
)

print(
    "=" * 70
)

print(
    "PREDICTION SANITY CHECKS"
)

print(
    "=" * 70
)


checks = {}


# ------------------------------------------------------------
# Missing values
# ------------------------------------------------------------

checks[
    "missing_values_total"
] = int(
    predictions
    .isna()
    .sum()
    .sum()
)


# ------------------------------------------------------------
# Quantile ordering
# ------------------------------------------------------------

for target in [
    "tmax",
    "tmin",
    "rain"
]:

    p10 = f"{target}_p10"
    p50 = f"{target}_p50"
    p90 = f"{target}_p90"


    if all(
        c in predictions.columns
        for c in [
            p10,
            p50,
            p90
        ]
    ):

        checks[
            f"{target}_quantiles_ordered"
        ] = bool(

            (
                predictions[p10]
                <= predictions[p50]
            ).all()

            and

            (
                predictions[p50]
                <= predictions[p90]
            ).all()
        )


# ------------------------------------------------------------
# Negative rainfall
# ------------------------------------------------------------

for q in [
    "p10",
    "p50",
    "p90"
]:

    col = f"rain_{q}"


    if col in predictions.columns:

        checks[
            f"negative_rain_{q}"
        ] = int(
            (
                predictions[col]
                < 0
            ).sum()
        )


# ------------------------------------------------------------
# Print checks
# ------------------------------------------------------------

for k, v in checks.items():

    print(
        f"{k}: {v}"
    )

    summary_lines.append(
        f"{k}: {v}"
    )


# ============================================================
# PREDICTION RANGE SUMMARY
# ============================================================

summary_lines.append(
    "\nPREDICTION RANGES"
)


for target in [
    "tmax",
    "tmin",
    "rain"
]:

    summary_lines.append(
        f"\n{target.upper()}:"
    )


    for q in [
        "p10",
        "p50",
        "p90"
    ]:

        col = (
            f"{target}_{q}"
        )


        if col not in predictions.columns:
            continue


        mn = predictions[col].min()
        mean = predictions[col].mean()
        mx = predictions[col].max()


        summary_lines.append(
            f"{col}: "
            f"min={mn:.4f}, "
            f"mean={mean:.4f}, "
            f"max={mx:.4f}"
        )


# ============================================================
# MODEL PERFORMANCE SUMMARY
# ============================================================

summary_lines.append(
    "\n"
)

summary_lines.append(
    "MODEL PERFORMANCE SUMMARY"
)

summary_lines.append(
    "=" * 60
)


for experiment in sorted(
    metrics[
        "experiment"
    ]
    .astype(str)
    .unique()
):

    for target in [
        "tmax",
        "tmin",
        "rain"
    ]:

        sub = metrics[
            (
                metrics[
                    "experiment"
                ].astype(str)
                == experiment
            )
            &
            (
                metrics[
                    "target"
                ].astype(str)
                .str.lower()
                == target
            )
        ].copy()


        if sub.empty:
            continue


        # Lowest RMSE row is reported
        # descriptively, without adding
        # a qualitative model ranking.
        best = sub.loc[
            sub["rmse"].idxmin()
        ]


        summary_lines.append(
            f"{experiment} / {target}: "
            f"lowest recorded RMSE model = "
            f"{best['model']}, "
            f"RMSE={best['rmse']:.3f}, "
            f"MAE={best['mae']:.3f}"
        )


# ============================================================
# SPATIAL VALIDATION TEXT
# ============================================================

if not spatial.empty:

    summary_lines.append(
        "\n"
    )

    summary_lines.append(
        "SPATIAL BLOCK VALIDATION"
    )

    summary_lines.append(
        "=" * 60
    )


    for target in [
        "tmax",
        "tmin",
        "rain"
    ]:

        sub = spatial[
            spatial["target"]
            .astype(str)
            .str.lower()
            == target
        ]


        if sub.empty:
            continue


        for model in sorted(
            sub[
                "model"
            ]
            .astype(str)
            .unique()
        ):

            x = sub[
                sub["model"].astype(str)
                == model
            ]


            summary_lines.append(
                f"C / {target} / {model}: "
                f"mean RMSE="
                f"{x['rmse'].mean():.3f}, "
                f"mean MAE="
                f"{x['mae'].mean():.3f}, "
                f"mean bias="
                f"{x['bias'].mean():.3f}"
            )


# ============================================================
# RAINFALL PERFORMANCE TEXT
# ============================================================

if not rain.empty:

    summary_lines.append(
        "\n"
    )

    summary_lines.append(
        "RAINFALL EVALUATION"
    )

    summary_lines.append(
        "=" * 60
    )


    for experiment in sorted(
        rain[
            "experiment"
        ]
        .astype(str)
        .unique()
    ):

        r = rain[
            rain[
                "experiment"
            ].astype(str)
            == experiment
        ]


        for _, row in r.iterrows():

            line = (
                f"{experiment} / "
                f"{row['model']}: "
                f"RMSE={row['rmse']:.3f}, "
                f"MAE={row['mae']:.3f}, "
                f"Bias={row['bias']:.3f}"
            )


            if "pod1" in row.index:
                line += (
                    f", POD1="
                    f"{safe_float(row['pod1']):.3f}"
                )


            if "far1" in row.index:
                line += (
                    f", FAR1="
                    f"{safe_float(row['far1']):.3f}"
                )


            if "csi1" in row.index:
                line += (
                    f", CSI1="
                    f"{safe_float(row['csi1']):.3f}"
                )


            summary_lines.append(
                line
            )


# ============================================================
# SAVE TEXT SUMMARY
# ============================================================

summary_path = (
    EVAL /
    "evaluation_summary.txt"
)


summary_path.write_text(
    "\n".join(
        summary_lines
    ),
    encoding="utf-8"
)


print(
    "\nSaved summary:"
)

print(
    summary_path
)


# ============================================================
# FINAL REPORT
# ============================================================

print(
    "\n"
)

print(
    "=" * 70
)

print(
    "FINAL EVALUATION COMPLETE"
)

print(
    "=" * 70
)


print(
    f"\nEvaluation directory:"
)

print(
    EVAL
)


print(
    "\nGenerated tables:"
)


for f in sorted(
    EVAL.glob("*.csv")
):

    print(
        f"  {f.name}"
    )


print(
    "\nGenerated figures:"
)


for f in sorted(
    EVAL.glob("*.png")
):

    print(
        f"  {f.name}"
    )


print(
    "\nSummary:"
)

print(
    summary_path
)


print(
    "\nPrediction dataset:"
)


print(
    f"Rows: "
    f"{len(predictions):,}"
)


if "point_id" in predictions.columns:

    print(
        f"Points: "
        f"{predictions.point_id.nunique():,}"
    )


print(
    f"Dates: "
    f"{predictions.date.min().date()} "
    f"-> "
    f"{predictions.date.max().date()}"
)


print(
    "\nDONE."
)
