import React from 'react';
import { ShieldAlert, Info, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAF1F0] border-t border-[#E6B8B2] text-[#6E4E4B] text-xs py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2D1412]">
              <Database className="w-4 h-4 text-[#7A3F39]" />
              <span>Demonstration Dataset Scope</span>
            </div>
            <p className="text-[#593936] leading-relaxed">
              Demonstration predictions cover <strong className="text-[#2D1412]">01 Jun 2023 – 30 Sep 2023</strong> across <strong className="text-[#2D1412]">120 spatial grid points</strong> in Kangra District, Himachal Pradesh.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2D1412]">
              <Info className="w-4 h-4 text-[#1565C0]" />
              <span>Quantile Predictions (P10 / P50 / P90)</span>
            </div>
            <p className="text-[#593936] leading-relaxed">
              P50 represents median forecast. P10–P90 represents the model prediction quantile uncertainty band.
            </p>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#2D1412]">
              <ShieldAlert className="w-4 h-4 text-[#F57F17]" />
              <span>Agricultural Decision Support</span>
            </div>
            <p className="text-[#593936] leading-relaxed">
              Advisories are decision-support guidance generated via transparent rules and should be interpreted alongside local agricultural extension services.
            </p>
          </div>
        </div>

        <div className="border-t border-[#E6B8B2] pt-4 flex flex-col sm:flex-row items-center justify-between text-[#7A3F39] gap-2">
          <div>
            Agro-Meteorological Advisory System
          </div>
          <div>
            Kangra Localized Spatial Downscaling &amp; Agro-Meteorological System
          </div>
        </div>
      </div>
    </footer>
  );
};
