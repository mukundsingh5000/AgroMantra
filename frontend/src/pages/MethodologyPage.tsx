import React from 'react';
import { ModelInfo } from '../types';
import { BookOpen, Database, ShieldAlert, Cpu, Layers } from 'lucide-react';

interface MethodologyPageProps {
  modelInfo: ModelInfo | null;
}

export const MethodologyPage: React.FC<MethodologyPageProps> = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2D7D3] p-5 rounded-2xl shadow-sm">
        <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#7A3F39]" />
          <span>System Architecture & Scientific Methodology</span>
        </h2>
        <p className="text-xs text-[#6E4E4B] mt-0.5">
          SIH PS74 — Spatial Downscaling Pipeline and Agro-Meteorological Decision Support
        </p>
      </div>

      {/* End-to-End Workflow Diagram */}
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#7A3F39]" />
          <span>End-to-End System Pipeline</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-center">
          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center font-bold text-xs">1</span>
            <span className="text-xs font-bold text-[#2D1412]">INPUT DATA</span>
            <span className="text-[10px] text-[#6E4E4B]">ERA5 Reanalysis, DEM Elevation, Fine-grid predictors</span>
          </div>

          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#FAF1F0] text-[#7A3F39] flex items-center justify-center font-bold text-xs border border-[#E6B8B2]">2</span>
            <span className="text-xs font-bold text-[#2D1412]">FEATURE ENG.</span>
            <span className="text-[10px] text-[#6E4E4B]">Spatial lapse rates, topography, temporal lags</span>
          </div>

          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#F3E5F5] text-[#7B1FA2] flex items-center justify-center font-bold text-xs">3</span>
            <span className="text-xs font-bold text-[#2D1412]">ML DOWNSCALING</span>
            <span className="text-[10px] text-[#6E4E4B]">LightGBM Quantile Models for TMAX, TMIN, RAIN</span>
          </div>

          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center font-bold text-xs">4</span>
            <span className="text-xs font-bold text-[#2D1412]">QUANTILE PREDICTIONS</span>
            <span className="text-[10px] text-[#6E4E4B]">P10 (10th), P50 (Median), P90 (90th percentile)</span>
          </div>

          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#E0F7FA] text-[#00838F] flex items-center justify-center font-bold text-xs">5</span>
            <span className="text-xs font-bold text-[#2D1412]">SPATIAL VALIDATION</span>
            <span className="text-[10px] text-[#6E4E4B]">Temporal &amp; 5-fold Spatial-Block Holdouts</span>
          </div>

          <div className="bg-[#FAF1F0] p-4 rounded-xl border border-[#E6B8B2] flex flex-col items-center justify-center space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#7A3F39] text-white flex items-center justify-center font-bold text-xs">6</span>
            <span className="text-xs font-bold text-[#7A3F39]">CROP ADVISORY</span>
            <span className="text-[10px] text-[#7A3F39]">Transparent agronomic rule decision engine</span>
          </div>
        </div>
      </div>

      {/* Dataset Specifications & Validation Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
            <Database className="w-4 h-4 text-[#7A3F39]" />
            <span>Dataset Specification</span>
          </h3>
          <ul className="space-y-2 text-xs text-[#2D1412]">
            <li className="flex justify-between border-b border-[#F2D7D3] pb-1.5">
              <span className="text-[#6E4E4B]">Target Region:</span>
              <span className="font-bold text-[#2D1412]">Kangra District, HP, India</span>
            </li>
            <li className="flex justify-between border-b border-[#F2D7D3] pb-1.5">
              <span className="text-[#6E4E4B]">Spatial Grid Points:</span>
              <span className="font-bold text-[#7A3F39]">120 points (Lat 31.7°–32.6° N, Lon 75.8°–76.9° E)</span>
            </li>
            <li className="flex justify-between border-b border-[#F2D7D3] pb-1.5">
              <span className="text-[#6E4E4B]">Demonstration Date Period:</span>
              <span className="font-bold text-[#2D1412]">01 June 2023 – 30 September 2023 (122 Days)</span>
            </li>
            <li className="flex justify-between border-b border-[#F2D7D3] pb-1.5">
              <span className="text-[#6E4E4B]">Total Prediction Rows:</span>
              <span className="font-bold text-[#2D1412]">14,640 rows (120 points × 122 days)</span>
            </li>
            <li className="flex justify-between">
              <span className="text-[#6E4E4B]">Model Targets:</span>
              <span className="font-bold text-[#2D1412]">TMAX, TMIN, RAIN (P10 / P50 / P90)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1565C0]" />
            <span>Quantile Interpretation</span>
          </h3>
          <div className="space-y-2 text-xs text-[#6E4E4B]">
            <p className="leading-relaxed">
              The spatial downscaling machine learning model utilizes <strong>Pinball Loss Quantile Regression</strong> to output uncertainty intervals alongside point predictions:
            </p>
            <div className="bg-[#FAF1F0] p-3 rounded-xl border border-[#E6B8B2] space-y-1 font-mono text-[11px]">
              <div><strong className="text-[#E65100]">P50:</strong> Median forecast (50th percentile)</div>
              <div><strong className="text-[#2D1412]">P10 – P90:</strong> 80% prediction range bounding spatial model uncertainty</div>
            </div>
            <p className="text-[#6E4E4B] italic">
              Note: P10/P90 represent prediction quantiles, not direct empirical confidence intervals.
            </p>
          </div>
        </div>
      </div>

      {/* Model Limitations Section */}
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#F57F17]" />
          <span>Scientific Disclaimers &amp; System Limitations</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#6E4E4B]">
          <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
            <span className="font-bold text-[#E65100]">1. Grid-Based Representation</span>
            <p className="text-[#6E4E4B] leading-relaxed">
              Predictions are generated for 120 spatial grid points across Kangra district. Grid points are identified by coordinate centroids rather than official Panchayat administrative polygon boundaries.
            </p>
          </div>

          <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
            <span className="font-bold text-[#E65100]">2. Pre-Computed Evaluation Dataset</span>
            <p className="text-[#6E4E4B] leading-relaxed">
              Current demonstration predictions cover the evaluation season from 01 Jun 2023 to 30 Sep 2023. Real-time inference capability is optional and dependent on model backend connectivity.
            </p>
          </div>

          <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
            <span className="font-bold text-[#E65100]">3. Decision-Support Advisory Engine</span>
            <p className="text-[#6E4E4B] leading-relaxed">
              Agricultural recommendations are generated via transparent, rule-based decision support logic and should be interpreted in conjunction with local Krishi Vigyan Kendra (KVK) guidance.
            </p>
          </div>

          <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
            <span className="font-bold text-[#E65100]">4. Official Warning Disclaimer</span>
            <p className="text-[#6E4E4B] leading-relaxed">
              This decision-support tool does not constitute an official government disaster or extreme weather warning service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
