import React, { useState } from 'react';
import { PredictionRow } from '../types';
import { MapView } from '../components/MapView';
import { MapPin, Calendar, Layers, Info } from 'lucide-react';

interface WeatherMapPageProps {
  mapPredictions: PredictionRow[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  dates: string[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

export const WeatherMapPage: React.FC<WeatherMapPageProps> = ({
  mapPredictions,
  selectedPointId,
  setSelectedPointId,
  dates,
  selectedDate,
  setSelectedDate
}) => {
  const [mapVar, setMapVar] = useState<'tmax' | 'tmin' | 'rain'>('rain');

  const selectedRow = mapPredictions.find(r => r.point_id === selectedPointId) || mapPredictions[0];

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white border border-[#F2D7D3] p-4 sm:p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#7A3F39]" />
            <span>Kangra Spatial Downscaling Weather Map</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Interactive Leaflet spatial visualization across 120 grid points (Lat 31.7°–32.6° N, Lon 75.8°–76.9° E)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#1565C0]" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {dates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Map + Side Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map */}
        <div className="lg:col-span-8">
          <MapView
            predictions={mapPredictions}
            selectedPointId={selectedPointId}
            onSelectPoint={setSelectedPointId}
            variable={mapVar}
            setVariable={setMapVar}
            selectedDate={selectedDate}
            height="620px"
          />
        </div>

        {/* Selected Point Inspector Card */}
        <div className="lg:col-span-4 bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2D7D3] pb-3">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7A3F39]" />
              <span>Grid Point Inspector</span>
            </h3>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#FAF1F0] text-[#7A3F39] border border-[#E6B8B2]">
              {selectedRow?.point_id || 'Select Point'}
            </span>
          </div>

          {selectedRow ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#FAF1F0] p-3 rounded-xl border border-[#E6B8B2] text-[#2D1412] font-mono">
                <div>
                  <span className="text-[#6E4E4B] block text-[10px]">LATITUDE:</span>
                  <span className="font-bold text-[#2D1412]">{selectedRow.lat.toFixed(4)}° N</span>
                </div>
                <div>
                  <span className="text-[#6E4E4B] block text-[10px]">LONGITUDE:</span>
                  <span className="font-bold text-[#2D1412]">{selectedRow.lon.toFixed(4)}° E</span>
                </div>
              </div>

              {/* Rainfall Card */}
              <div className="bg-[#FAF1F0]/60 p-3.5 rounded-xl border border-[#F2D7D3] space-y-1">
                <div className="flex justify-between items-center text-[#6E4E4B] font-semibold">
                  <span>Daily Rainfall</span>
                  <span className="text-[#1565C0] font-bold text-sm">{selectedRow.rain_p50.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between text-[#6E4E4B] text-[11px]">
                  <span>P10–P90 Range:</span>
                  <span className="text-[#2D1412] font-bold">{selectedRow.rain_p10.toFixed(1)} – {selectedRow.rain_p90.toFixed(1)} mm</span>
                </div>
                <div className="flex justify-between text-[#7A4F4A] text-[11px]">
                  <span>Block Baseline:</span>
                  <span>{selectedRow.rain_block.toFixed(1)} mm</span>
                </div>
              </div>

              {/* TMAX Card */}
              <div className="bg-[#FAF1F0]/60 p-3.5 rounded-xl border border-[#F2D7D3] space-y-1">
                <div className="flex justify-between items-center text-[#6E4E4B] font-semibold">
                  <span>Max Temp (TMAX)</span>
                  <span className="text-[#E65100] font-bold text-sm">{selectedRow.tmax_p50.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between text-[#6E4E4B] text-[11px]">
                  <span>P10–P90 Range:</span>
                  <span className="text-[#2D1412] font-bold">{selectedRow.tmax_p10.toFixed(1)} – {selectedRow.tmax_p90.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between text-[#7A4F4A] text-[11px]">
                  <span>Block Baseline:</span>
                  <span>{selectedRow.tmax_block.toFixed(1)} °C</span>
                </div>
              </div>

              {/* TMIN Card */}
              <div className="bg-[#FAF1F0]/60 p-3.5 rounded-xl border border-[#F2D7D3] space-y-1">
                <div className="flex justify-between items-center text-[#6E4E4B] font-semibold">
                  <span>Min Temp (TMIN)</span>
                  <span className="text-[#0277BD] font-bold text-sm">{selectedRow.tmin_p50.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between text-[#6E4E4B] text-[11px]">
                  <span>P10–P90 Range:</span>
                  <span className="text-[#2D1412] font-bold">{selectedRow.tmin_p10.toFixed(1)} – {selectedRow.tmin_p90.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between text-[#7A4F4A] text-[11px]">
                  <span>Block Baseline:</span>
                  <span>{selectedRow.tmin_block.toFixed(1)} °C</span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] text-[11px] text-[#6E4E4B] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#7A3F39]">
                  <Info className="w-3.5 h-3.5 text-[#7A3F39]" /> Threshold Interpretation
                </div>
                <p>
                  Rainfall classification thresholds: Low (&lt; 2.5 mm), Moderate (2.5–15.0 mm), Heavy (&gt; 15.0 mm). Thresholds serve as advisory triggers.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[#6E4E4B] text-xs text-center py-8">Select a point on the map.</div>
          )}
        </div>
      </div>
    </div>
  );
};
