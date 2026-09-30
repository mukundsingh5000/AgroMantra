import React from 'react';
import { PredictionRow, Point } from '../types';
import { ForecastChart } from '../components/ForecastChart';
import { QuantileBand } from '../components/QuantileBand';
import { MapPin, LineChart } from 'lucide-react';

interface LocationForecastPageProps {
  points: Point[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  pointPredictions: PredictionRow[];
}

export const LocationForecastPage: React.FC<LocationForecastPageProps> = ({
  points,
  selectedPointId,
  setSelectedPointId,
  pointPredictions
}) => {
  const latestRow = pointPredictions[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2D7D3] p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#7A3F39]" />
            <span>Grid Location Time-Series Forecast & Uncertainty</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Evaluate temporal trends and model prediction quantile bands (P10–P90) for individual grid points.
          </p>
        </div>

        {/* Location selector */}
        <div className="flex items-center gap-2 bg-[#FAF1F0] px-3 py-2 rounded-xl border border-[#E6B8B2]">
          <MapPin className="w-4 h-4 text-[#7A3F39]" />
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="bg-transparent text-xs font-mono font-bold text-[#2D1412] focus:outline-none cursor-pointer"
          >
            {points.map((p) => (
              <option key={p.point_id} value={p.point_id} className="bg-white text-[#2D1412]">
                {p.point_id} (Lat {p.lat.toFixed(2)}°, Lon {p.lon.toFixed(2)}°)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantile Bands Row for selected point */}
      {latestRow && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuantileBand
            label="Day Max Temp (TMAX)"
            unit="°C"
            p10={latestRow.tmax_p10}
            p50={latestRow.tmax_p50}
            p90={latestRow.tmax_p90}
            colorTheme="orange"
          />
          <QuantileBand
            label="Night Min Temp (TMIN)"
            unit="°C"
            p10={latestRow.tmin_p10}
            p50={latestRow.tmin_p50}
            p90={latestRow.tmin_p90}
            colorTheme="sky"
          />
          <QuantileBand
            label="Daily Rainfall"
            unit="mm"
            p10={latestRow.rain_p10}
            p50={latestRow.rain_p50}
            p90={latestRow.rain_p90}
            colorTheme="blue"
          />
        </div>
      )}

      {/* Main Time-Series Forecast Charts */}
      <ForecastChart data={pointPredictions} pointId={selectedPointId} />
    </div>
  );
};
