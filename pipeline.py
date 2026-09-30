"""Data fetch + feature assembly. Place in ps74/pipeline.py"""
import time
import socket
from functools import lru_cache
import numpy as np
import pandas as pd
import requests
import xarray as xr
from config import *
from terrain import get_terrain

OM_URL = "https://archive-api.open-meteo.com/v1/archive"
POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

# ---------- grids ----------
def grid_points(region, res=FINE_RES):
    b = REGIONS[region]
    lats = np.round(np.arange(np.ceil(round(b["lat"][0] / res, 6)) * res, b["lat"][1] + 1e-9, res), 4)
    lons = np.round(np.arange(np.ceil(round(b["lon"][0] / res, 6)) * res, b["lon"][1] + 1e-9, res), 4)
    pts = pd.DataFrame([(a, o) for a in lats for o in lons], columns=["lat", "lon"])
    bf = RAW / f"{region}_boundary.geojson"
    if bf.exists():
        import geopandas as gpd
        from shapely.geometry import Point
        g = gpd.read_file(bf).to_crs(4326).unary_union.buffer(res / 2)
        pts = pts[[g.contains(Point(o, a)) for a, o in zip(pts.lat, pts.lon)]]
    pts = pts.reset_index(drop=True)
    pts["region"] = region
    pts["point_id"] = [f"{region}_{i:04d}" for i in range(len(pts))]
    return pts

# ---------- Open-Meteo ----------
def fetch_om(pts, model, year, daily=None, hourly=None, batch=100):
    key = "daily" if daily else "hourly"
    rows = []
    for i in range(0, len(pts), batch):
        ch = pts.iloc[i:i + batch]
        params = {"latitude": ",".join(map(str, ch.lat)), "longitude": ",".join(map(str, ch.lon)),
                  "start_date": f"{year}-01-01", "end_date": f"{year}-12-31", "models": model,
                  "timezone": "Asia/Kolkata", "wind_speed_unit": "ms",
                  key: ",".join(daily or hourly)}
        for attempt in range(30):
            r = requests.get(OM_URL, params=params, timeout=180)
            if r.status_code == 200:
                break
            if r.status_code == 429:
                try:
                    reason = r.json().get("reason", "")
                except Exception:
                    reason = ""
                low = reason.lower()
                if "daily" in low:
                    raise SystemExit("Open-Meteo DAILY limit reached. Re-run 01_download.py tomorrow; "
                                     "it resumes from the cached years.")
                wait = 65 if "minut" in low else 300
                print(f"429: {reason or 'rate limited'} -> waiting {wait}s (attempt {attempt+1}/30)")
                time.sleep(wait)
                continue
            r.raise_for_status()
        else:
            raise SystemExit("Open-Meteo still rate-limiting after 30 tries. Re-run later.")
        js = r.json()
        js = js if isinstance(js, list) else [js]
        for (la, lo), j in zip(zip(ch.lat, ch.lon), js):
            d = pd.DataFrame(j[key])
            d["lat"], d["lon"] = la, lo
            rows.append(d)
        time.sleep(2)
    out = pd.concat(rows, ignore_index=True)
    out["time"] = pd.to_datetime(out["time"])
    return out

def _cached(path, fn):
    if path.exists():
        return pd.read_parquet(path)
    df = fn()
    df.to_parquet(path)
    return df

def download_fine(region, years=None):
    pts = grid_points(region)
    pts[["point_id", "lat", "lon"]].to_parquet(RAW / f"points_{region}.parquet")
    for y in (years or range(START_YEAR, END_YEAR + 1)):
        def f():
            d = fetch_om(pts, "era5_land", y, daily=["temperature_2m_max", "temperature_2m_min", "precipitation_sum"])
            return d.rename(columns={"time": "date", "temperature_2m_max": "y_tmax",
                                     "temperature_2m_min": "y_tmin", "precipitation_sum": "y_rain"})
        _cached(RAW / f"fine_{region}_{y}.parquet", f)
        print("fine", region, y)

# ---------- NASA POWER (Coarse) ----------
def download_coarse():
    """Coarse covariates from NASA POWER (MERRA-2). One cached file for all regions."""
    out = RAW / "power_coarse.parquet"
    if out.exists():
        return
    lat0 = min(r["lat"][0] for r in REGIONS.values()); lat1 = max(r["lat"][1] for r in REGIONS.values())
    lon0 = min(r["lon"][0] for r in REGIONS.values()); lon1 = max(r["lon"][1] for r in REGIONS.values())
    lats = np.arange(np.floor(lat0 / 0.5) * 0.5, lat1 + 0.5 + 1e-9, 0.5)
    lons = np.arange(np.floor(lon0 / 0.625) * 0.625, lon1 + 0.625 + 1e-9, 0.625)
    rows = []
    for la in lats:
        for lo in lons:
            la, lo = round(float(la), 4), round(float(lo), 4)
            p = {"parameters": "T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS10M,WD10M", "community": "AG",
                 "latitude": la, "longitude": lo, "start": f"{START_YEAR}0101",
                 "end": f"{END_YEAR}1231", "format": "JSON"}
            for attempt in range(6):
                r = requests.get(POWER_URL, params=p, timeout=180)
                if r.status_code == 200:
                    break
                time.sleep(20 * (attempt + 1))
            else:
                r.raise_for_status()
            d = pd.DataFrame(r.json()["properties"]["parameter"])
            d.index.name = "date"
            d = d.reset_index()
            d["date"] = pd.to_datetime(d["date"], format="%Y%m%d")
            d["latc"], d["lonc"] = la, lo
            rows.append(d)
            print("power", la, lo)
            time.sleep(1)
    df = pd.concat(rows, ignore_index=True).replace(-999, np.nan)
    df = df.rename(columns={"T2M_MAX": "e_tmax", "T2M_MIN": "e_tmin", "PRECTOTCORR": "e_rain",
                            "RH2M": "e_rh", "WS10M": "e_ws", "WD10M": "e_wd"})
    df.to_parquet(out)

@lru_cache(maxsize=1)
def _era5():
    df = pd.read_parquet(RAW / "power_coarse.parquet")
    df["date"] = pd.to_datetime(df["date"])
    return df

# ---------- IMD ----------
def download_imd(retries=8, wait=20):
    import imdlib as imd
    socket.setdefaulttimeout(60)
    lat0 = min(r["lat"][0] for r in REGIONS.values()) - 1.5
    lat1 = max(r["lat"][1] for r in REGIONS.values()) + 1.5
    lon0 = min(r["lon"][0] for r in REGIONS.values()) - 1.5
    lon1 = max(r["lon"][1] for r in REGIONS.values()) + 1.5
    for v in ("rain", "tmax", "tmin"):
        out = RAW / f"imd_{v}.nc"
        if out.exists():
            continue
        for y in range(START_YEAR, END_YEAR + 1):
            if (RAW / "imd" / v / f"{y}.GRD").exists():
                continue                                   
            for a in range(retries):
                try:
                    imd.get_data(v, y, y, fn_format="yearwise", file_dir=str(RAW / "imd"))
                    break
                except Exception as e:
                    print(f"IMD {v} {y}: attempt {a+1}/{retries} failed ({type(e).__name__})")
                    time.sleep(wait * (a + 1))
            else:
                raise SystemExit(f"IMD server unreachable for {v} {y}. Use manual download fallback.")
        data = imd.open_data(v, START_YEAR, END_YEAR, "yearwise", str(RAW / "imd"))
        ds = data.get_xarray().sortby("lat").sortby("lon")
        ds = ds.sel(lat=slice(lat0, lat1), lon=slice(lon0, lon1))
        ds.to_netcdf(out)
        print("IMD", v, dict(ds.sizes))

@lru_cache(maxsize=1)
def _imd():
    out = {}
    for v in ("rain", "tmax", "tmin"):
        ds = xr.open_dataset(RAW / f"imd_{v}.nc")
        out[v] = ds[list(ds.data_vars)[0]].load()
    return out

# ---------- feature frame ----------
def build_feature_frame(points, start=None, end=None):
    P = points.reset_index(drop=True)[["point_id", "lat", "lon"]].copy()
    n, imd, T = len(P), _imd(), get_terrain()
    la_i, lo_i = xr.DataArray(P.lat.values, dims="p"), xr.DataArray(P.lon.values, dims="p")
    frames, cell = {}, {}
    for v, da in imd.items():
        s = da.sel(lat=la_i, lon=lo_i, method="nearest")
        cell[v] = (s.lat.values, s.lon.values)
        times = pd.to_datetime(s.time.values)
        frames[v] = pd.DataFrame({"date": np.repeat(times, n),
                                  "point_id": np.tile(P.point_id.values, len(times)),
                                  f"c_{v}": s.transpose("time", "p").values.ravel()})
    df = frames["rain"].merge(frames["tmax"], on=["date", "point_id"]).merge(frames["tmin"], on=["date", "point_id"])

    P["latc"] = (np.round(P.lat / 0.5) * 0.5).round(4)
    P["lonc"] = (np.round(P.lon / 0.625) * 0.625).round(4)
    e = _era5().merge(P[["point_id", "latc", "lonc"]], on=["latc", "lonc"]).drop(columns=["latc", "lonc"])
    df = df.merge(e, on=["date", "point_id"], how="inner")

    tf = T.sample(P.lat.values, P.lon.values)
    tf["d_elev_era"] = tf.elev_pt - T.box_mean(P.latc.values, P.lonc.values, ERA5_RES)
    tf["d_elev_imdT"] = tf.elev_pt - T.box_mean(cell["tmax"][0], cell["tmax"][1], IMD_T_RES)
    tf["point_id"], tf["lat"], tf["lon"] = P.point_id.values, P.lat.values, P.lon.values
    df = df.merge(tf, on="point_id")

    if start is not None:
        df = df[df.date >= pd.Timestamp(start)]
    if end is not None:
        df = df[df.date <= pd.Timestamp(end)]
    doy = df.date.dt.dayofyear.values
    df["doy_s"], df["doy_c"] = np.sin(2 * np.pi * doy / 365.25), np.cos(2 * np.pi * doy / 365.25)
    wd = np.radians(df.e_wd.values)
    df["e_wd_s"], df["e_wd_c"] = np.sin(wd), np.cos(wd)
    df["c_rain_log"] = np.log1p(df.c_rain.clip(lower=0))
    df["e_rain_log"] = np.log1p(df.e_rain.clip(lower=0))
    return df.reset_index(drop=True)
