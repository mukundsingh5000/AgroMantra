import {
  Point,
  DatesResponse,
  PredictionRow,
  WeatherSummary,
  Alert,
  AdvisoryResponse,
  MetricRow,
  ModelInfo
} from '../types';

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/+$/, '');

export const fetchHealth = async (): Promise<{ status: string }> => {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
};

export const fetchPoints = async (): Promise<Point[]> => {
  const res = await fetch(`${API_BASE_URL}/points`);
  if (!res.ok) throw new Error('Failed to fetch grid points');
  return res.json();
};

export const fetchDates = async (): Promise<DatesResponse> => {
  const res = await fetch(`${API_BASE_URL}/dates`);
  if (!res.ok) throw new Error('Failed to fetch date bounds');
  return res.json();
};

export const fetchPredictionsByDate = async (date: string): Promise<PredictionRow[]> => {
  const res = await fetch(`${API_BASE_URL}/predictions/date/${date}`);
  if (!res.ok) throw new Error(`Failed to fetch map predictions for date ${date}`);
  return res.json();
};

export const fetchPredictionsByPoint = async (pointId: string): Promise<PredictionRow[]> => {
  const res = await fetch(`${API_BASE_URL}/predictions/${pointId}`);
  if (!res.ok) throw new Error(`Failed to fetch predictions for point ${pointId}`);
  return res.json();
};

export const fetchSummary = async (pointId: string, date: string): Promise<WeatherSummary> => {
  const res = await fetch(`${API_BASE_URL}/summary/${pointId}?date=${date}`);
  if (!res.ok) throw new Error('Failed to fetch weather summary');
  return res.json();
};

export const fetchAlerts = async (pointId?: string, date?: string): Promise<Alert[]> => {
  let url = `${API_BASE_URL}/alerts?`;
  if (pointId) url += `point_id=${pointId}&`;
  if (date) url += `date=${date}&`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather alerts');
  return res.json();
};

export const fetchAdvisory = async (
  pointId: string,
  date: string,
  crop: string,
  growthStage: string
): Promise<AdvisoryResponse> => {
  const url = `${API_BASE_URL}/advisory?point_id=${pointId}&date=${date}&crop=${encodeURIComponent(crop)}&growth_stage=${encodeURIComponent(growthStage)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch crop advisory');
  return res.json();
};

export const fetchMetrics = async (): Promise<MetricRow[]> => {
  const res = await fetch(`${API_BASE_URL}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch model evaluation metrics');
  return res.json();
};

export const fetchModelInfo = async (): Promise<ModelInfo> => {
  const res = await fetch(`${API_BASE_URL}/model-info`);
  if (!res.ok) throw new Error('Failed to fetch model info');
  return res.json();
};
