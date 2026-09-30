import React from 'react';
import { Thermometer, ThermometerSnowflake, CloudRain, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface WeatherCardProps {
  type: 'tmax' | 'tmin' | 'rain' | 'alert';
  p50?: number;
  p10?: number;
  p90?: number;
  blockBaseline?: number;
  alertCount?: number;
  alertSeverity?: string;
  statusText?: string;
  onViewDetails?: () => void;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  type,
  p50 = 0,
  p10 = 0,
  p90 = 0,
  blockBaseline,
  alertCount = 0,
  alertSeverity = 'Normal',
  statusText,
  onViewDetails
}) => {
  if (type === 'tmax') {
    return (
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6E4E4B] uppercase tracking-wider">Maximum Temp (TMAX)</span>
          <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center border border-[#FFE0B2]">
            <Thermometer className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#2D1412]">{p50.toFixed(1)}</span>
          <span className="text-sm font-semibold text-[#6E4E4B]">°C</span>
          {statusText && (
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] font-semibold">
              {statusText}
            </span>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-[#F2D7D3] space-y-1.5">
          <div className="flex justify-between text-xs text-[#6E4E4B]">
            <span>Prediction range (P10 – P90):</span>
            <span className="font-bold text-[#2D1412]">{p10.toFixed(1)} – {p90.toFixed(1)} °C</span>
          </div>
          {blockBaseline !== undefined && (
            <div className="flex justify-between text-[11px] text-[#9E7A77]">
              <span>Block Baseline:</span>
              <span>{blockBaseline.toFixed(1)} °C</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'tmin') {
    return (
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6E4E4B] uppercase tracking-wider">Minimum Temp (TMIN)</span>
          <div className="w-9 h-9 rounded-xl bg-[#E1F5FE] text-[#0277BD] flex items-center justify-center border border-[#B3E5FC]">
            <ThermometerSnowflake className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#2D1412]">{p50.toFixed(1)}</span>
          <span className="text-sm font-semibold text-[#6E4E4B]">°C</span>
          {statusText && (
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-[#E1F5FE] text-[#0277BD] border border-[#B3E5FC] font-semibold">
              {statusText}
            </span>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-[#F2D7D3] space-y-1.5">
          <div className="flex justify-between text-xs text-[#6E4E4B]">
            <span>Prediction range (P10 – P90):</span>
            <span className="font-bold text-[#2D1412]">{p10.toFixed(1)} – {p90.toFixed(1)} °C</span>
          </div>
          {blockBaseline !== undefined && (
            <div className="flex justify-between text-[11px] text-[#9E7A77]">
              <span>Block Baseline:</span>
              <span>{blockBaseline.toFixed(1)} °C</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'rain') {
    return (
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6E4E4B] uppercase tracking-wider">Daily Rainfall</span>
          <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] text-[#1565C0] flex items-center justify-center border border-[#BBDEFB]">
            <CloudRain className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-[#2D1412]">{p50.toFixed(1)}</span>
          <span className="text-sm font-semibold text-[#6E4E4B]">mm</span>
          {statusText && (
            <span className="ml-auto text-xs px-2.5 py-0.5 rounded-full bg-[#E3F2FD] text-[#1565C0] border border-[#BBDEFB] font-semibold">
              {statusText}
            </span>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-[#F2D7D3] space-y-1.5">
          <div className="flex justify-between text-xs text-[#6E4E4B]">
            <span>Prediction range (P10 – P90):</span>
            <span className="font-bold text-[#2D1412]">{p10.toFixed(1)} – {p90.toFixed(1)} mm</span>
          </div>
          {blockBaseline !== undefined && (
            <div className="flex justify-between text-[11px] text-[#9E7A77]">
              <span>Block Baseline:</span>
              <span>{blockBaseline.toFixed(1)} mm</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Alert card
  return (
    <div
      onClick={onViewDetails}
      className={`bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm relative overflow-hidden ${onViewDetails ? 'cursor-pointer hover:border-[#7A3F39] transition' : ''
        }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#6E4E4B] uppercase tracking-wider">Active Weather Alerts</span>
        <div className="w-9 h-9 rounded-xl bg-[#FFF8E1] text-[#F57F17] flex items-center justify-center border border-[#FFE082]">
          <AlertTriangle className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-[#2D1412]">{alertCount}</span>
        <span className="text-sm font-semibold text-[#6E4E4B]">active</span>
        <span className={`ml-auto text-xs px-2.5 py-0.5 rounded-full font-bold border ${alertSeverity === 'High Risk'
          ? 'bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]'
          : alertSeverity === 'Moderate Risk'
            ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]'
            : 'bg-[#FAF1F0] text-[#7A3F39] border-[#E6B8B2]'
          }`}>
          {alertSeverity}
        </span>
      </div>
      <div className="mt-4 pt-3 border-t border-[#F2D7D3] flex justify-between items-center text-xs text-[#6E4E4B]">
        <span>Model-generated risk status</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) onViewDetails();
          }}
          className="flex items-center text-[#7A3F39] hover:text-[#4A2320] font-bold transition"
        >
          View details <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
};
