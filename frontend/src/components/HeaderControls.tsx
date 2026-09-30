import React from 'react';
import { Point } from '../types';
import { MapPin, Calendar, Sprout, Clock } from 'lucide-react';

interface HeaderControlsProps {
  points: Point[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  dates: string[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
}

export const HeaderControls: React.FC<HeaderControlsProps> = ({
  points,
  selectedPointId,
  setSelectedPointId,
  dates,
  selectedDate,
  setSelectedDate,
  selectedCrop,
  setSelectedCrop,
  selectedStage,
  setSelectedStage
}) => {
  const crops = ["Rice", "Maize", "Tomato", "Potato", "Apple", "Wheat", "Other"];
  const stages = [
    "Sowing / Planting",
    "Vegetative",
    "Flowering / Pollination",
    "Fruit / Grain Filling",
    "Harvesting / Post-Harvest"
  ];

  return (
    <div className="bg-white border border-[#F2D7D3] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F2D7D3] pb-3">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <span>Kangra Agro-Meteorological Advisory System</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            AI-assisted localized weather intelligence for agricultural decision support
          </p>
        </div>
      </div>

      {/* Control selectors grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {/* District */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#6E4E4B] uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#7A3F39]" /> District
          </label>
          <input
            type="text"
            readOnly
            value="Kangra (Fixed)"
            className="w-full bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-2 text-xs font-bold text-[#7A3F39] focus:outline-none cursor-not-allowed"
          />
        </div>

        {/* Date Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#6E4E4B] uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#1565C0]" /> Forecast Date
          </label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39] focus:bg-white transition"
          >
            {dates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Grid Location Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#6E4E4B] uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#9E7A77]" /> Grid Location
          </label>
          <select
            value={selectedPointId}
            onChange={(e) => setSelectedPointId(e.target.value)}
            className="w-full bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39] focus:bg-white transition font-mono"
          >
            {points.map((p) => (
              <option key={p.point_id} value={p.point_id}>
                {p.point_id} ({p.lat.toFixed(2)}°, {p.lon.toFixed(2)}°)
              </option>
            ))}
          </select>
        </div>

        {/* Crop Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#6E4E4B] uppercase tracking-wider flex items-center gap-1">
            <Sprout className="w-3 h-3 text-[#7A3F39]" /> Target Crop
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39] focus:bg-white transition"
          >
            {crops.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Growth Stage Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#6E4E4B] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#9E7A77]" /> Growth Stage
          </label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-2 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39] focus:bg-white transition"
          >
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
