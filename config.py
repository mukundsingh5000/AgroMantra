"""Central settings. Place in project root: ps74/config.py"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW, PROC, OUT = ROOT / "data" / "raw", ROOT / "data" / "processed", ROOT / "outputs"
for _p in (RAW, PROC, OUT):
    _p.mkdir(parents=True, exist_ok=True)

REGIONS = {
    "kangra": {"lat": (31.7, 32.6), "lon": (75.8, 76.9)},   
    "kullu":  {"lat": (31.4, 32.5), "lon": (77.0, 77.9)},   
}

START_YEAR, END_YEAR = 2016, 2023
TRAIN_END, VAL_YEAR, TEST_YEAR = 2021, 2022, 2023

FINE_RES = 0.1     
ERA5_RES = 0.5     # coarse covariate grid (NASA POWER / MERRA-2 is 0.5° x 0.625°)
IMD_R_RES = 0.25   
IMD_T_RES = 1.0    
DEM_PAD = 1.1
