import React, { useState } from 'react';
import { Alert, Point } from '../types';
import { AlertBadge } from '../components/AlertBadge';
import { AlertTriangle, Search, ShieldAlert } from 'lucide-react';

interface AlertsPageProps {
  alerts: Alert[];
  points: Point[];
  selectedPointId: string;
  setSelectedPointId: (id: string) => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts
}) => {
  const [severityFilter, setSeverityFilter] = useState<'All' | 'High' | 'Moderate' | 'Info'>('All');
  const [typeSearch, setTypeSearch] = useState('');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false;
    if (typeSearch && !a.type.toLowerCase().includes(typeSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2D7D3] p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F57F17]" />
            <span>Agro-Meteorological Risk Alerts Dashboard</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Model-generated weather alerts derived from grid downscaling quantiles for Kangra district.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Severity Pill Selector */}
          <div className="flex bg-[#FAF1F0] p-1 rounded-xl border border-[#E6B8B2] text-xs font-semibold">
            <button
              onClick={() => setSeverityFilter('All')}
              className={`px-3 py-1 rounded-lg transition ${severityFilter === 'All' ? 'bg-[#7A3F39] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setSeverityFilter('High')}
              className={`px-3 py-1 rounded-lg transition ${severityFilter === 'High' ? 'bg-[#C62828] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              High Risk
            </button>
            <button
              onClick={() => setSeverityFilter('Moderate')}
              className={`px-3 py-1 rounded-lg transition ${severityFilter === 'Moderate' ? 'bg-[#F57F17] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Moderate
            </button>
            <button
              onClick={() => setSeverityFilter('Info')}
              className={`px-3 py-1 rounded-lg transition ${severityFilter === 'Info' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
            >
              Info
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6E4E4B] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search alert type..."
              value={typeSearch}
              onChange={(e) => setTypeSearch(e.target.value)}
              className="bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            />
          </div>
        </div>
      </div>

      {/* Alerts Grid */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-12 text-center text-[#6E4E4B] space-y-2 shadow-sm">
          <ShieldAlert className="w-8 h-8 text-[#7A3F39] mx-auto" />
          <p className="font-bold text-[#2D1412]">No active alerts matching filter.</p>
          <p className="text-xs">Weather predictions are within normal non-extreme thresholds for the selected parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alt) => (
            <AlertBadge key={alt.alert_id} alert={alt} />
          ))}
        </div>
      )}
    </div>
  );
};
