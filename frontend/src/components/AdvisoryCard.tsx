import React from 'react';
import { AdvisoryItem } from '../types';
import { Sprout, AlertCircle, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface AdvisoryCardProps {
  advisories: AdvisoryItem[];
  riskLevel: string;
  crop: string;
  growthStage: string;
  weatherSummary?: {
    tmax_p50: string;
    tmax_range: string;
    tmin_p50: string;
    tmin_range: string;
    rain_p50: string;
    rain_range: string;
    classification: string;
  };
}

export const AdvisoryCard: React.FC<AdvisoryCardProps> = ({
  advisories,
  riskLevel,
  crop,
  growthStage,
  weatherSummary
}) => {
  return (
    <div className="bg-white border border-[#F2D7D3] rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2D7D3] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FAF1F0] text-[#7A3F39] flex items-center justify-center border border-[#E6B8B2]">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2D1412] flex items-center gap-2">
              <span>AGRICULTURAL ADVISORY</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF1F0] text-[#6E4E4B] border border-[#E6B8B2]">
                {crop} • {growthStage}
              </span>
            </h3>
            <p className="text-xs text-[#6E4E4B] mt-0.5">
              Transparent rule-based decision support system driven by downscaled forecasts.
            </p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${riskLevel === 'High Risk'
            ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
            : riskLevel === 'Moderate Risk'
              ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]'
              : 'bg-[#FAF1F0] text-[#7A3F39] border-[#E6B8B2]'
          }`}>
          {riskLevel === 'High Risk' && <ShieldAlert className="w-4 h-4 text-[#C62828]" />}
          {riskLevel === 'Moderate Risk' && <AlertCircle className="w-4 h-4 text-[#F57F17]" />}
          {riskLevel === 'Favorable / Normal' && <CheckCircle2 className="w-4 h-4 text-[#7A3F39]" />}
          <span>{riskLevel}</span>
        </div>
      </div>

      {/* Weather Summary Pill Row */}
      {weatherSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF1F0] p-3 rounded-xl border border-[#E6B8B2] text-xs">
          <div>
            <span className="text-[#6E4E4B] block">Rainfall P50:</span>
            <span className="font-bold text-[#1565C0]">{weatherSummary.rain_p50}</span>
            <span className="text-[10px] text-[#9E7A77] block">{weatherSummary.rain_range}</span>
          </div>
          <div>
            <span className="text-[#6E4E4B] block">Day Temp (TMAX):</span>
            <span className="font-bold text-[#E65100]">{weatherSummary.tmax_p50}</span>
            <span className="text-[10px] text-[#9E7A77] block">{weatherSummary.tmax_range}</span>
          </div>
          <div>
            <span className="text-[#6E4E4B] block">Night Temp (TMIN):</span>
            <span className="font-bold text-[#0277BD]">{weatherSummary.tmin_p50}</span>
            <span className="text-[10px] text-[#9E7A77] block">{weatherSummary.tmin_range}</span>
          </div>
          <div>
            <span className="text-[#6E4E4B] block">Condition:</span>
            <span className="font-bold text-[#7A3F39]">{weatherSummary.classification}</span>
          </div>
        </div>
      )}

      {/* List of Advisories */}
      {advisories.length === 0 ? (
        <div className="bg-[#FAF1F0]/50 border border-[#E6B8B2] rounded-xl p-5 text-center text-xs text-[#2D1412] space-y-1">
          <p className="font-bold text-[#7A3F39]">Normal Agro-Meteorological Conditions</p>
          <p className="text-[#6E4E4B]">No high-risk weather triggers detected for {crop} ({growthStage}). Proceed with standard farm management practices.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {advisories.map((adv, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border space-y-2 transition ${adv.severity === 'High'
                  ? 'bg-[#FFEBEE]/60 border-[#FFCDD2]'
                  : adv.severity === 'Moderate'
                    ? 'bg-[#FFF8E1]/80 border-[#FFE082]'
                    : 'bg-[#FAF1F0] border-[#E6B8B2]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D1412] flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${adv.severity === 'High' ? 'bg-[#C62828]' : adv.severity === 'Moderate' ? 'bg-[#F57F17]' : 'bg-[#7A3F39]'
                    }`} />
                  {adv.category} — {adv.title}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#6E4E4B] border border-[#E6B8B2]">
                  {adv.scope}
                </span>
              </div>

              <div className="text-xs text-[#2D1412] font-semibold leading-relaxed pl-4 border-l-2 border-[#7A3F39]">
                {adv.advisory}
              </div>

              <div className="text-[11px] text-[#6E4E4B] flex items-start gap-1.5 pt-1">
                <span className="font-bold text-[#2D1412]">Reason:</span>
                <span>{adv.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mandatory Disclaimer */}
      <div className="pt-3 border-t border-[#F2D7D3] flex items-start gap-2 text-[11px] text-[#6E4E4B] italic">
        <Info className="w-4 h-4 text-[#7A3F39] flex-shrink-0 mt-0.5" />
        <p>
          Advisory is decision support and should be interpreted with local agricultural guidance.
        </p>
      </div>
    </div>
  );
};
