import React from 'react';

interface QuantileBandProps {
  label: string;
  unit: string;
  p10: number;
  p50: number;
  p90: number;
  colorTheme?: 'orange' | 'sky' | 'blue';
}

export const QuantileBand: React.FC<QuantileBandProps> = ({
  label,
  unit,
  p10,
  p50,
  p90,
  colorTheme = 'orange'
}) => {
  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'sky':
        return {
          barBg: 'bg-[#E1F5FE]',
          indicator: 'bg-[#0277BD]',
          textP50: 'text-[#0277BD]',
          border: 'border-[#B3E5FC]'
        };
      case 'blue':
        return {
          barBg: 'bg-[#E3F2FD]',
          indicator: 'bg-[#1565C0]',
          textP50: 'text-[#1565C0]',
          border: 'border-[#BBDEFB]'
        };
      default:
        return {
          barBg: 'bg-[#FFF3E0]',
          indicator: 'bg-[#E65100]',
          textP50: 'text-[#E65100]',
          border: 'border-[#FFE0B2]'
        };
    }
  };

  const theme = getThemeClasses();

  // Calculate relative percent position of P50 between P10 and P90
  const range = p90 - p10;
  const percent = range > 0 ? Math.min(Math.max(((p50 - p10) / range) * 100, 5), 95) : 50;

  return (
    <div className="bg-white border border-[#F2D7D3] p-4 rounded-xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#2D1412]">{label} Quantile Band</span>
        <span className="text-[#6E4E4B] font-mono">Unit: {unit}</span>
      </div>

      {/* Visual Bar */}
      <div className="space-y-1.5">
        <div className={`h-3 w-full rounded-full ${theme.barBg} relative overflow-hidden flex items-center border border-[#F2D7D3]`}>
          <div
            className={`w-3 h-3 rounded-full ${theme.indicator} absolute top-0 transform -translate-x-1/2 shadow-sm`}
            style={{ left: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] text-[#6E4E4B] font-mono pt-1">
          <div>
            <span className="text-[#7A4F4A]">P10: </span>
            <span className="font-bold text-[#2D1412]">{p10.toFixed(1)} {unit}</span>
          </div>
          <div className="text-center">
            <span className="text-[#6E4E4B]">P50 (Median): </span>
            <span className={`font-bold ${theme.textP50}`}>{p50.toFixed(1)} {unit}</span>
          </div>
          <div>
            <span className="text-[#7A4F4A]">P90: </span>
            <span className="font-bold text-[#2D1412]">{p90.toFixed(1)} {unit}</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#6E4E4B] leading-snug">
        P10–P90 represents the model's prediction range across the 10th to 90th percentiles.
      </p>
    </div>
  );
};
