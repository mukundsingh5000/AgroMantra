export interface Point {
  point_id: string;
  lat: number;
  lon: number;
}

export interface DatesResponse {
  dates: string[];
  min_date: string;
  max_date: string;
  total_days: number;
}

export interface PredictionRow {
  point_id: string;
  lat: number;
  lon: number;
  date: string;
  tmax_p10: number;
  tmax_p50: number;
  tmax_p90: number;
  tmax_block: number;
  tmin_p10: number;
  tmin_p50: number;
  tmin_p90: number;
  tmin_block: number;
  rain_p10: number;
  rain_p50: number;
  rain_p90: number;
  rain_block: number;
}

export interface WeatherSummary {
  point_id: string;
  lat: number;
  lon: number;
  date: string;
  tmax: {
    p10: number;
    p50: number;
    p90: number;
    block_baseline: number;
  };
  tmin: {
    p10: number;
    p50: number;
    p90: number;
    block_baseline: number;
  };
  rain: {
    p10: number;
    p50: number;
    p90: number;
    block_baseline: number;
  };
  weather_classification: {
    rain_status: string;
    temp_max_status: string;
    temp_min_status: string;
  };
}

export interface Alert {
  alert_id: string;
  type: string;
  severity: "Info" | "Moderate" | "High";
  point_id: string;
  lat: number;
  lon: number;
  date: string;
  observed_condition: string;
  suggested_action: string;
}

export interface AdvisoryItem {
  id: string;
  category: string;
  title: string;
  advisory: string;
  severity: "Info" | "Moderate" | "High";
  reason: string;
  scope: string;
}

export interface AdvisoryResponse {
  point_id: string;
  date: string;
  crop: string;
  growth_stage: string;
  weather_summary: {
    tmax_p50: string;
    tmax_range: string;
    tmin_p50: string;
    tmin_range: string;
    rain_p50: string;
    rain_range: string;
    classification: string;
  };
  risk_level: string;
  advisories: AdvisoryItem[];
  disclaimer: string;
  data_basis: string;
}

export interface MetricRow {
  n: number;
  rmse: number;
  mae: number;
  bias: number;
  experiment: string;
  target: 'tmax' | 'tmin' | 'rain';
  model: string;
  cov80?: number;
  monthly_rmse?: number;
  pod1?: number;
  far1?: number;
  csi1?: number;
  pod10?: number;
  far10?: number;
  csi10?: number;
}

export interface ModelInfo {
  targets: string[];
  prediction_quantiles: string[];
  spatial_points: number;
  total_rows: number;
  date_range: {
    start: string;
    end: string;
    total_days: number;
  };
  model_type: string;
  validation_experiments: {
    name: string;
    description: string;
  }[];
  baselines: string[];
  has_live_model: boolean;
}
