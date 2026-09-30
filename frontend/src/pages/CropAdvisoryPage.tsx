import React from 'react';
import { AdvisoryResponse, Point } from '../types';
import { AdvisoryCard } from '../components/AdvisoryCard';
import { Sprout, ArrowDown, ShieldCheck } from 'lucide-react';

interface CropAdvisoryPageProps {
  points: Point[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  dates: string[];
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedCrop: string;
  setSelectedCrop: (crop: string) => void;
  selectedStage: string;
  setSelectedStage: (stage: string) => void;
  advisoryData: AdvisoryResponse | null;
}

export const CropAdvisoryPage: React.FC<CropAdvisoryPageProps> = ({
  points,
  selectedPointId,
  setSelectedPointId,
  dates,
  selectedDate,
  setSelectedDate,
  selectedCrop,
  setSelectedCrop,
  selectedStage,
  setSelectedStage,
  advisoryData
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2D7D3] p-5 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <Sprout className="w-5 h-5 text-[#7A3F39]" />
            <span>Crop-Specific Advisory Rule Engine</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Transparent, rule-based decision support system transforming downscaled weather predictions into actionable farm guidance.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-[#FAF1F0] p-3 rounded-xl border border-[#E6B8B2]">
          <div>
            <label className="text-[10px] font-bold text-[#6E4E4B] uppercase tracking-wider block mb-1">
              Select Crop:
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-white border border-[#E6B8B2] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#6E4E4B] uppercase tracking-wider block mb-1">
              Growth Stage:
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full bg-white border border-[#E6B8B2] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#6E4E4B] uppercase tracking-wider block mb-1">
              Location Point:
            </label>
            <select
              value={selectedPointId}
              onChange={(e) => setSelectedPointId(e.target.value)}
              className="w-full bg-white border border-[#E6B8B2] rounded-lg px-3 py-1.5 text-xs font-mono font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {points.map((p) => (
                <option key={p.point_id} value={p.point_id}>{p.point_id}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#6E4E4B] uppercase tracking-wider block mb-1">
              Target Date:
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-[#E6B8B2] rounded-lg px-3 py-1.5 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {dates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Advisory Workflow Concept Card */}
      <div className="bg-white border border-[#F2D7D3] p-4 rounded-xl text-xs text-[#6E4E4B] space-y-2 shadow-sm">
        <div className="font-bold text-[#2D1412] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#7A3F39]" />
          <span>Decision Support Rule Flow Architecture</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E4E4B] font-mono py-1">
          <span className="bg-[#FAF1F0] px-2.5 py-1 rounded border border-[#E6B8B2] text-[#2D1412]">1. Downscaled Weather Prediction</span>
          <ArrowDown className="w-3 h-3 text-[#6E4E4B] sm:-rotate-90" />
          <span className="bg-[#FAF1F0] px-2.5 py-1 rounded border border-[#E6B8B2] text-[#2D1412]">2. Threshold Classification</span>
          <ArrowDown className="w-3 h-3 text-[#6E4E4B] sm:-rotate-90" />
          <span className="bg-[#FAF1F0] px-2.5 py-1 rounded border border-[#E6B8B2] text-[#2D1412]">3. Crop &amp; Growth Stage Rules</span>
          <ArrowDown className="w-3 h-3 text-[#6E4E4B] sm:-rotate-90" />
          <span className="bg-[#FAF1F0] text-[#7A3F39] font-bold px-2.5 py-1 rounded border border-[#E6B8B2]">4. Actionable Advisory</span>
        </div>
      </div>

      {/* Advisory Card Component */}
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
  );
};
