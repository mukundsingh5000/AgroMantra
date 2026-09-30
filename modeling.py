"""Models, baselines, metrics. Place in ps74/modeling.py"""
import numpy as np
import pandas as pd
import lightgbm as lgb
import xgboost as xgb

FEATS = ["elev_pt", "d_elev_era", "d_elev_imdT", "slope", "asp_e", "asp_n", "rough", "dist_high",
         "doy_s", "doy_c", "c_tmax", "c_tmin", "c_rain_log", "e_tmax", "e_tmin", "e_rain_log",
         "e_rh", "e_ws", "e_wd_s", "e_wd_c"]           # lat/lon excluded on purpose (region transfer)
# target: (fine column, coarse "block" column, transform)
TARGETS = {"tmax": ("y_tmax", "c_tmax", "resid"),
           "tmin": ("y_tmin", "c_tmin", "resid"),
           "rain": ("y_rain", "c_rain", "lograin")}
QS = (0.1, 0.5, 0.9)
LAPSE = 0.0065  # K per m


def to_t(df, tgt):
    y, c, kind = TARGETS[tgt]
    return (df[y] - df[c]).values if kind == "resid" else np.log1p(df[y].clip(lower=0)).values


def from_t(pred, df, tgt):
    _, c, kind = TARGETS[tgt]
    return pred + df[c].values if kind == "resid" else np.clip(np.expm1(pred), 0, None)


def fit_lgb_quantiles(train, val, tgt):
    models = {}
    for q in QS:
        m = lgb.LGBMRegressor(objective="quantile", alpha=q, n_estimators=600 if val is not None else 400,
                              learning_rate=0.05, num_leaves=63, min_child_samples=50, subsample=0.8,
                              subsample_freq=1, colsample_bytree=0.8, verbose=-1, n_jobs=-1)
        if val is not None:
            m.fit(train[FEATS], to_t(train, tgt), eval_set=[(val[FEATS], to_t(val, tgt))],
                  callbacks=[lgb.early_stopping(50, verbose=False)])
        else:
            m.fit(train[FEATS], to_t(train, tgt))
        models[q] = m
    return models


def predict_quantiles(models, df, tgt):
    P = np.column_stack([from_t(models[q].predict(df[FEATS]), df, tgt) for q in QS])
    P.sort(axis=1)                                     # remove quantile crossing
    return pd.DataFrame(P, columns=["p10", "p50", "p90"], index=df.index)


def fit_xgb(train, tgt):
    m = xgb.XGBRegressor(n_estimators=500, learning_rate=0.05, max_depth=8, subsample=0.8,
                         colsample_bytree=0.8, tree_method="hist", n_jobs=-1)
    return m.fit(train[FEATS], to_t(train, tgt))


def baselines(df, tgt):
    if tgt in ("tmax", "tmin"):
        c, e = TARGETS[tgt][1], "e_" + tgt
        return {"block_copy": df[c].values,
                "lapse_rate": (df[c] - LAPSE * df["d_elev_imdT"]).values,
                "era5_copy": df[e].values}
    return {"block_copy": df["c_rain"].values, "era5_copy": df["e_rain"].values}


def _rmse(a, b):
    return float(np.sqrt(np.mean((np.asarray(a) - np.asarray(b)) ** 2)))


def score(d, y, p, tgt, lo=None, hi=None):
    y, p = np.asarray(y, float), np.asarray(p, float)
    ok = ~np.isnan(y) & ~np.isnan(p)
    d = d.reset_index(drop=True)[ok]
    y, p = y[ok], p[ok]
    out = {"n": int(ok.sum()), "rmse": _rmse(y, p), "mae": float(np.mean(np.abs(y - p))),
           "bias": float(np.mean(p - y))}
    if tgt == "rain":
        m = pd.DataFrame({"pid": d.point_id.values, "ym": d.date.dt.to_period("M").values,
                          "y": y, "p": p}).groupby(["pid", "ym"]).sum()
        out["monthly_rmse"] = _rmse(m.y, m.p)
        for th in (1, 10):
            hit, miss, fa = ((p >= th) & (y >= th)).sum(), ((p < th) & (y >= th)).sum(), ((p >= th) & (y < th)).sum()
            out[f"pod{th}"] = hit / max(hit + miss, 1)
            out[f"far{th}"] = fa / max(hit + fa, 1)
            out[f"csi{th}"] = hit / max(hit + miss + fa, 1)
    if lo is not None:
        lo, hi = np.asarray(lo, float)[ok], np.asarray(hi, float)[ok]
        out["cov80"] = float(np.mean((y >= lo) & (y <= hi)))
    return out
