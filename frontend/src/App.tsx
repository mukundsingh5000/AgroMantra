import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeaderControls } from './components/HeaderControls';

// Pages
import { Dashboard } from './pages/Dashboard';
import { WeatherMapPage } from './pages/WeatherMapPage';
import { LocationForecastPage } from './pages/LocationForecastPage';
import { CropAdvisoryPage } from './pages/CropAdvisoryPage';
import { AlertsPage } from './pages/AlertsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';

// Types & Services
import {
  Point,
  PredictionRow,
  WeatherSummary,
  AdvisoryResponse,
  Alert,
  MetricRow,
  ModelInfo
} from './types';
import {
  fetchPoints,
  fetchDates,
  fetchPredictionsByDate,
  fetchPredictionsByPoint,
  fetchSummary,
  fetchAlerts,
  fetchAdvisory,
  fetchMetrics,
  fetchModelInfo
} from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Controls state
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string>('kangra_0000');
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2023-06-01');
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [selectedStage, setSelectedStage] = useState<string>('Vegetative');

  // Data states
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [mapPredictions, setMapPredictions] = useState<PredictionRow[]>([]);
  const [pointPredictions, setPointPredictions] = useState<PredictionRow[]>([]);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryResponse | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

  // Status states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: Points, Dates, Metrics, ModelInfo
  useEffect(() => {
    async function initData() {
      try {
        setLoading(true);
        setError(null);
        
        const [ptsData, datesData, metricsData, infoData] = await Promise.all([
          fetchPoints(),
          fetchDates(),
          fetchMetrics(),
          fetchModelInfo()
        ]);

        setPoints(ptsData);
        if (ptsData.length > 0) {
          setSelectedPointId(ptsData[0].point_id);
        }

        setDates(datesData.dates);
        if (datesData.dates.length > 0) {
          setSelectedDate(datesData.dates[0]);
        }

        setMetrics(metricsData);
        setModelInfo(infoData);
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to connect to backend server. Make sure FastAPI backend is running on port 8000.');
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Fetch date-dependent map predictions & alerts when selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;
    async function loadDateData() {
      try {
        const mapData = await fetchPredictionsByDate(selectedDate);
        setMapPredictions(mapData);

        const alertList = await fetchAlerts(undefined, selectedDate);
        setAlerts(alertList);
      } catch (err) {
        console.error('Error fetching date data:', err);
      }
    }
    loadDateData();
  }, [selectedDate]);

  // Fetch point-dependent time-series predictions when selectedPointId changes
  useEffect(() => {
    if (!selectedPointId) return;
    async function loadPointPredictions() {
      try {
        const pointData = await fetchPredictionsByPoint(selectedPointId);
        setPointPredictions(pointData);
      } catch (err) {
        console.error('Error fetching point predictions:', err);
      }
    }
    loadPointPredictions();
  }, [selectedPointId]);

  // Fetch summary & crop advisory whenever selectedPointId, selectedDate, selectedCrop, selectedStage changes
  useEffect(() => {
    if (!selectedPointId || !selectedDate) return;
    async function loadSummaryAndAdvisory() {
      try {
        const [sumRes, advRes] = await Promise.all([
          fetchSummary(selectedPointId, selectedDate),
          fetchAdvisory(selectedPointId, selectedDate, selectedCrop, selectedStage)
        ]);
        setSummary(sumRes);
        setAdvisoryData(advRes);
      } catch (err) {
        console.error('Error fetching summary/advisory:', err);
      }
    }
    loadSummaryAndAdvisory();
  }, [selectedPointId, selectedDate, selectedCrop, selectedStage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center text-[#2D1412] p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-[#E6B8B2] flex items-center justify-center text-[#7A3F39] animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[#2D1412]">Loading Kangra Agro-Meteorological Advisory System...</h2>
        <p className="text-xs text-[#6E4E4B]">Loading 120 spatial points and model prediction quantiles.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAF8] flex flex-col items-center justify-center text-[#2D1412] p-6">
        <div className="bg-white border border-[#FFCDD2] rounded-2xl p-8 max-w-md w-full space-y-4 shadow-sm text-center">
          <AlertCircle className="w-12 h-12 text-[#C62828] mx-auto" />
          <h2 className="text-lg font-bold text-[#2D1412]">Backend Connection Error</h2>
          <p className="text-xs text-[#6E4E4B] leading-relaxed">{error}</p>
          <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#E6B8B2] text-[11px] font-mono text-[#7A3F39] text-left">
            <div># Start backend server command:</div>
            <div className="text-[#2D1412]">cd backend</div>
            <div className="text-[#2D1412]">uvicorn main:app --reload --port 8000</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-[#7A3F39] hover:bg-[#5C2B27] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#2D1412] flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header Controls (Visible on Dashboard, Map, Advisory, Forecast) */}
        {(activeTab === 'dashboard' || activeTab === 'map' || activeTab === 'advisory' || activeTab === 'forecast') && (
          <HeaderControls
            points={points}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            dates={dates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
          />
        )}

        {/* Tab pages */}
        {activeTab === 'dashboard' && (
          <Dashboard
            points={points}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCrop={selectedCrop}
            selectedStage={selectedStage}
            summary={summary}
            mapPredictions={mapPredictions}
            pointPredictions={pointPredictions}
            advisoryData={advisoryData}
            alerts={alerts}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'map' && (
          <WeatherMapPage
            mapPredictions={mapPredictions}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            dates={dates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {activeTab === 'forecast' && (
          <LocationForecastPage
            points={points}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            pointPredictions={pointPredictions}
          />
        )}

        {activeTab === 'advisory' && (
          <CropAdvisoryPage
            points={points}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            dates={dates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedCrop={selectedCrop}
            setSelectedCrop={setSelectedCrop}
            selectedStage={selectedStage}
            setSelectedStage={setSelectedStage}
            advisoryData={advisoryData}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            points={points}
            selectedPointId={selectedPointId}
            setSelectedPointId={setSelectedPointId}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        )}

        {activeTab === 'performance' && (
          <ModelPerformancePage metrics={metrics} modelInfo={modelInfo} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
