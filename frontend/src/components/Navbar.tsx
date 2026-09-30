import React from 'react';
import {
  LayoutDashboard,
  Map,
  LineChart,
  Sprout,
  AlertTriangle,
  BarChart2,
  CloudSun
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Weather Map', icon: Map },
    { id: 'forecast', label: 'Location Forecast', icon: LineChart },
    { id: 'advisory', label: 'Crop Advisory', icon: Sprout },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'performance', label: 'Model Performance', icon: BarChart2 },
  ];

  return (
    <header className="bg-[#FAF1F0] text-[#2D1412] border-b border-[#E6B8B2] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E6B8B2] flex items-center justify-center text-[#7A3F39] shadow-sm">
              <CloudSun className="w-6 h-6 text-[#7A3F39]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6E4E4B] font-medium tracking-wide">
                  Kangra District, Himachal Pradesh
                </span>
              </div>
              <h1 className="text-base font-bold text-[#2D1412] tracking-tight leading-none mt-1">
                Agro-Meteorological Advisory System
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation bar tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-[#E6B8B2] no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${isActive
                    ? 'bg-[#7A3F39] text-white shadow-sm font-bold'
                    : 'text-[#6E4E4B] hover:text-[#2D1412] hover:bg-white/70'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#7A3F39]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
