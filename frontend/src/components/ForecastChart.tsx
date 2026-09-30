import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { PredictionRow } from '../types';
import { Info, Calendar } from 'lucide-react';

interface ForecastChartProps {
  data: PredictionRow[];
  pointId: string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data, pointId }) => {
  const [rangeFilter, setRangeFilter] = useState<'7' | '14' | '30' | 'all'>('30');
  const [chartType, setChartType] = useState<'temperature' | 'rainfall' | 'both'>('both');

  // Filter data based on selected range filter
  const filterData = () => {
    if (!data || data.length === 0) return [];
    if (rangeFilter === 'all') return data;
    const limit = parseInt(rangeFilter, 10);
    return data.slice(0, limit);
  };

  const chartData = filterData().map(row => ({
    date: row.date.substring(5), // MM-DD
    fullDate: row.date,
    tmax_p50: row.tmax_p50,
    tmax_p10: row.tmax_p10,
    tmax_p90: row.tmax_p90,
    tmax_range: [row.tmax_p10, row.tmax_p90],
    tmin_p50: row.tmin_p50,
    tmin_p10: row.tmin_p10,
    tmin_p90: row.tmin_p90,
    tmin_range: [row.tmin_p10, row.tmin_p90],
    rain_p50: row.rain_p50,
    rain_p10: row.rain_p10,
    rain_p90: row.rain_p90,
    tmax_block: row.tmax_block,
    rain_block: row.rain_block
  }));

  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-[#F2D7D3] p-8 rounded-2xl text-center text-[#6E4E4B] shadow-sm">
        No forecast data available for {pointId}.
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-5">
      {/* Controls & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#F2D7D3]">
        <div>
          <h3 className="text-base font-bold text-[#2D1412] flex items-center gap-2">
            <span>Location Weather Time-Series Forecast</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF1F0] text-[#7A3F39] font-mono font-bold border border-[#E6B8B2]">
              {pointId}
            </span>
          </h3>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Displaying median predictions (P50) alongside 10th–90th percentile uncertainty quantiles (P10–P90).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chart view selector */}
          <div className="flex bg-[#FAF1F0] p-1 rounded-xl border border-[#E6B8B2] text-xs font-semibold">
            <button
              onClick={() => setChartType('both')}
              className={`px-3 py-1 rounded-lg transition ${chartType === 'both' ? 'bg-[#7A3F39] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Combined
            </button>
            <button
              onClick={() => setChartType('temperature')}
              className={`px-3 py-1 rounded-lg transition ${chartType === 'temperature' ? 'bg-[#E65100] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Temperature
            </button>
            <button
              onClick={() => setChartType('rainfall')}
              className={`px-3 py-1 rounded-lg transition ${chartType === 'rainfall' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Rainfall
            </button>
          </div>

          {/* Time range buttons */}
          <div className="flex bg-[#FAF1F0] p-1 rounded-xl border border-[#E6B8B2] text-xs font-semibold">
            <button
              onClick={() => setRangeFilter('7')}
              className={`px-2.5 py-1 rounded-lg transition ${rangeFilter === '7' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setRangeFilter('14')}
              className={`px-2.5 py-1 rounded-lg transition ${rangeFilter === '14' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              14 Days
            </button>
            <button
              onClick={() => setRangeFilter('30')}
              className={`px-2.5 py-1 rounded-lg transition ${rangeFilter === '30' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              30 Days
            </button>
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${rangeFilter === 'all' ? 'bg-[#7A3F39] text-white' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Full Period
            </button>
          </div>
        </div>
      </div>

      {/* Dataset period notice */}
      <div className="flex items-center gap-2 text-xs text-[#7A3F39] bg-[#FAF1F0] border border-[#E6B8B2] px-3 py-2 rounded-xl font-medium">
        <Calendar className="w-4 h-4 text-[#7A3F39] flex-shrink-0" />
        <span>
          Available evaluation forecast period: <strong>01 Jun 2023 – 30 Sep 2023</strong>. Displaying {chartData.length} records.
        </span>
      </div>

      {/* Temperature Chart */}
      {(chartType === 'both' || chartType === 'temperature') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#2D1412] font-bold">
            <span className="text-[#E65100]">Temperature Forecast (°C)</span>
            <span className="text-[#6E4E4B] font-normal">Shaded band = P10 – P90 prediction interval</span>
          </div>
          <div className="h-64 w-full bg-[#FAF1F0]/50 p-3 rounded-xl border border-[#F2D7D3]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2D7D3" opacity={0.7} />
                <XAxis dataKey="date" stroke="#6E4E4B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6E4E4B" tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F2D7D3', borderRadius: '8px', color: '#2D1412', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? `${value.toFixed(1)} °C` : value,
                    name === 'tmax_p50' ? 'TMAX (P50 Median)' :
                      name === 'tmin_p50' ? 'TMIN (P50 Median)' :
                        name === 'tmax_p90' ? 'TMAX (P90 High)' :
                          name === 'tmax_p10' ? 'TMAX (P10 Low)' :
                            name === 'tmax_block' ? 'Block Copy Baseline' : name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />

                {/* Quantile Bands */}
                <Area type="monotone" dataKey="tmax_p90" stroke="none" fill="#f97316" fillOpacity={0.2} name="TMAX Upper P90" />
                <Area type="monotone" dataKey="tmax_p10" stroke="none" fill="#FFFFFF" fillOpacity={0.9} name="TMAX Lower P10" />

                {/* Median Lines */}
                <Line type="monotone" dataKey="tmax_p50" stroke="#E65100" strokeWidth={2.5} dot={false} name="TMAX P50" />
                <Line type="monotone" dataKey="tmin_p50" stroke="#0277BD" strokeWidth={2.5} dot={false} name="TMIN P50" />
                <Line type="monotone" dataKey="tmax_block" stroke="#7A6255" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Block Baseline" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Rainfall Chart */}
      {(chartType === 'both' || chartType === 'rainfall') && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-[#2D1412] font-bold">
            <span className="text-[#1565C0]">Daily Rainfall Forecast (mm)</span>
            <span className="text-[#6E4E4B] font-normal">P50 (Median) vs P90 (90th Percentile Risk)</span>
          </div>
          <div className="h-56 w-full bg-[#FAF1F0]/50 p-3 rounded-xl border border-[#F2D7D3]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2D7D3" opacity={0.7} />
                <XAxis dataKey="date" stroke="#6E4E4B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6E4E4B" tick={{ fontSize: 11 }} domain={[0, 'dataMax + 5']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F2D7D3', borderRadius: '8px', color: '#2D1412', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value: any, name: string) => [
                    typeof value === 'number' ? `${value.toFixed(1)} mm` : value,
                    name === 'rain_p50' ? 'Rain P50 (Median)' :
                      name === 'rain_p90' ? 'Rain P90 (90th Percentile)' :
                        name === 'rain_p10' ? 'Rain P10 (10th Percentile)' : name
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="rain_p50" fill="#1565C0" opacity={0.85} name="Rain P50 (Median)" />
                <Line type="monotone" dataKey="rain_p90" stroke="#7B1FA2" strokeWidth={2} dot={false} name="Rain P90 (High Risk)" />
                <Line type="monotone" dataKey="rain_p10" stroke="#7A6255" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Rain P10 (Low)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Scientific Explanation Footer */}
      <div className="flex items-start gap-2 p-3 bg-[#FAF1F0] rounded-xl text-xs text-[#6E4E4B] border border-[#E6B8B2]">
        <Info className="w-4 h-4 text-[#7A3F39] flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Interpretation Guide:</strong> The LightGBM downscaling model outputs quantile predictions.
          <strong className="text-[#2D1412]"> P50</strong> represents the median expected prediction.
          <strong className="text-[#2D1412]"> P10–P90</strong> represents the 80% prediction interval bounding potential weather variation across spatial grid scale.
        </p>
      </div>
    </div>
  );
};
