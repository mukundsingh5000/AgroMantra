import React from 'react';
import { Alert } from '../types';
import { AlertTriangle, MapPin, Calendar } from 'lucide-react';

interface AlertBadgeProps {
  alert: Alert;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({ alert }) => {
  const isHigh = alert.severity === 'High';
  const isModerate = alert.severity === 'Moderate';

  return (
    <div className={`p-4 rounded-xl border transition shadow-sm ${isHigh
        ? 'bg-[#FFEBEE] border-[#FFCDD2] text-[#C62828]'
        : isModerate
          ? 'bg-[#FFF8E1] border-[#FFE082] text-[#E65100]'
          : 'bg-white border-[#F2D7D3] text-[#2D1412]'
      }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
          <AlertTriangle className={`w-4 h-4 ${isHigh ? 'text-[#C62828]' : isModerate ? 'text-[#E65100]' : 'text-[#7A3F39]'}`} />
          <span>{alert.type}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${isHigh
            ? 'bg-[#FFCDD2]/60 text-[#C62828] border-[#EF9A9A]'
            : isModerate
              ? 'bg-[#FFE082]/60 text-[#E65100] border-[#FFB74D]'
              : 'bg-[#FAF1F0] text-[#7A3F39] border-[#E6B8B2]'
          }`}>
          {alert.severity} Severity
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E4E4B] mb-3 border-y border-[#F2D7D3] py-2">
        <div className="flex items-center gap-1 font-mono text-[#7A3F39] font-bold">
          <MapPin className="w-3.5 h-3.5" />
          <span>{alert.point_id}</span>
        </div>
        <div className="flex items-center gap-1 font-mono">
          <Calendar className="w-3.5 h-3.5" />
          <span>{alert.date}</span>
        </div>
        <div>
          Lat: {alert.lat.toFixed(2)}, Lon: {alert.lon.toFixed(2)}
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <span className="font-semibold text-[#6E4E4B] block">Observed Prediction Condition:</span>
          <span className="text-[#2D1412] font-mono font-semibold">{alert.observed_condition}</span>
        </div>
        <div>
          <span className="font-semibold text-[#6E4E4B] block">Suggested Agronomic Action:</span>
          <span className="text-[#2D1412] font-semibold leading-relaxed">{alert.suggested_action}</span>
        </div>
      </div>
    </div>
  );
};
