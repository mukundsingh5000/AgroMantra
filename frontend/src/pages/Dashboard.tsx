import React from 'react';
import { Point, PredictionRow, WeatherSummary, AdvisoryResponse, Alert } from '../types';
import { WeatherCard } from '../components/WeatherCard';
import { MapView } from '../components/MapView';
import { ForecastChart } from '../components/ForecastChart';
import { AdvisoryCard } from '../components/AdvisoryCard';
import { AlertBadge } from '../components/AlertBadge';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';

interface DashboardProps {
  points: Point[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedCrop: string;
  selectedStage: string;
  summary: WeatherSummary | null;
  mapPredictions: PredictionRow[];
  pointPredictions: PredictionRow[];
  advisoryData: AdvisoryResponse | null;
  alerts: Alert[];
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedPointId,
  setSelectedPointId,
  selectedDate,
  summary,
  mapPredictions,
  pointPredictions,
  advisoryData,
  alerts,
  setActiveTab
}) => {
  return (
    <div className="space-y-6">
      {/* Weather Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WeatherCard
          type="tmax"
          p50={summary?.tmax.p50}
          p10={summary?.tmax.p10}
          p90={summary?.tmax.p90}
          blockBaseline={summary?.tmax.block_baseline}
          statusText={summary?.weather_classification.temp_max_status}
        />
        <WeatherCard
          type="tmin"
          p50={summary?.tmin.p50}
          p10={summary?.tmin.p10}
          p90={summary?.tmin.p90}
          blockBaseline={summary?.tmin.block_baseline}
          statusText={summary?.weather_classification.temp_min_status}
        />
        <WeatherCard
          type="rain"
          p50={summary?.rain.p50}
          p10={summary?.rain.p10}
          p90={summary?.rain.p90}
          blockBaseline={summary?.rain.block_baseline}
          statusText={summary?.weather_classification.rain_status}
        />
        <WeatherCard
          type="alert"
          alertCount={alerts.length}
          alertSeverity={advisoryData?.risk_level}
          onViewDetails={() => setActiveTab('alerts')}
        />
      </div>

      {/* Main Grid: Left Map + Right Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7A3F39]" />
              <span>Spatial Downscaled Grid (120 Points)</span>
            </h3>
            <button
              onClick={() => setActiveTab('map')}
              className="text-xs text-[#7A3F39] hover:text-[#2D1412] font-bold flex items-center gap-1 transition"
            >
              Full Screen Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <MapView
            predictions={mapPredictions}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
            selectedDate={selectedDate}
            height="460px"
          />
        </div>

        {/* Advisory Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7A3F39]" />
              <span>Crop Advisory Support</span>
            </h3>
            <button
              onClick={() => setActiveTab('advisory')}
              className="text-xs text-[#7A3F39] hover:text-[#2D1412] font-bold flex items-center gap-1 transition"
            >
              Full Rules View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {advisoryData && (
            <AdvisoryCard
              advisories={advisoryData.advisories}
              riskLevel={advisoryData.risk_level}
              crop={advisoryData.crop}
              growthStage={advisoryData.growth_stage}
              weatherSummary={advisoryData.weather_summary}
            />
          )}
        </div>
      </div>

      {/* Forecast Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide">
            Grid Point Time-Series & Quantile Uncertainty
          </h3>
          <button
            onClick={() => setActiveTab('forecast')}
            className="text-xs text-[#7A3F39] hover:text-[#2D1412] font-bold flex items-center gap-1 transition"
          >
            Detailed Time-Series <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <ForecastChart data={pointPredictions} pointId={selectedPointId} />
      </div>

      {/* Active Alerts Panel Preview */}
      {alerts.length > 0 && (
        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2D7D3] pb-3">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
              <span>Model-Generated Weather Alerts ({alerts.length})</span>
            </h3>
            <button
              onClick={() => setActiveTab('alerts')}
              className="text-xs text-[#7A3F39] hover:text-[#2D1412] font-bold flex items-center gap-1 transition"
            >
              All Alerts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((alt) => (
              <AlertBadge key={alt.alert_id} alert={alt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
