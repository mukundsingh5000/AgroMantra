import React, { useState } from 'react';
import { MetricRow, ModelInfo } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { BarChart2, CheckCircle2, Layers } from 'lucide-react';

interface ModelPerformancePageProps {
  metrics: MetricRow[];
  modelInfo: ModelInfo | null;
}

export const ModelPerformancePage: React.FC<ModelPerformancePageProps> = ({
  metrics
}) => {
  const [targetFilter, setTargetFilter] = useState<'tmax' | 'tmin' | 'rain'>('tmax');
  const [expFilter, setExpFilter] = useState<string>('A_temporal_kangra');

  // Available experiments from metrics
  const uniqueExperiments = Array.from(new Set(metrics.map(m => m.experiment)));

  // Filter metrics
  const filteredMetrics = metrics.filter(m => m.target === targetFilter && m.experiment === expFilter);

  // Prepare data for bar chart comparison
  const chartData = filteredMetrics.map(m => ({
    model: m.model,
    RMSE: m.rmse,
    MAE: m.mae,
    Bias: m.bias
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#F2D7D3] p-5 rounded-2xl shadow-sm space-y-3">
        <div>
          <h2 className="text-lg font-bold text-[#2D1412] flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[#7A3F39]" />
            <span>Spatial Downscaling Model Performance & Validation</span>
          </h2>
          <p className="text-xs text-[#6E4E4B] mt-0.5">
            Empirical validation results comparing LightGBM downscaling model against physical and coarse resolution baselines.
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F2D7D3]">
          {/* Target Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E4E4B] font-bold uppercase">Target:</span>
            <div className="flex bg-[#FAF1F0] p-1 rounded-xl border border-[#E6B8B2] text-xs font-semibold">
              <button
                onClick={() => setTargetFilter('tmax')}
                className={`px-3 py-1 rounded-lg transition ${targetFilter === 'tmax' ? 'bg-[#E65100] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
              >
                TMAX (Max Temp)
              </button>
              <button
                onClick={() => setTargetFilter('tmin')}
                className={`px-3 py-1 rounded-lg transition ${targetFilter === 'tmin' ? 'bg-[#0277BD] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
              >
                TMIN (Min Temp)
              </button>
              <button
                onClick={() => setTargetFilter('rain')}
                className={`px-3 py-1 rounded-lg transition ${targetFilter === 'rain' ? 'bg-[#1565C0] text-white shadow-sm' : 'text-[#6E4E4B] hover:text-[#2D1412]'}`}
              >
                RAINFALL
              </button>
            </div>
          </div>

          {/* Experiment Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6E4E4B] font-bold uppercase">Experiment:</span>
            <select
              value={expFilter}
              onChange={(e) => setExpFilter(e.target.value)}
              className="bg-[#FAF1F0] border border-[#E6B8B2] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#2D1412] focus:outline-none focus:border-[#7A3F39]"
            >
              {uniqueExperiments.map(exp => (
                <option key={exp} value={exp}>
                  {exp === 'A_temporal_kangra' ? 'Temporal Holdout (Exp A)' : `Spatial Block (${exp})`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Model Overview Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#F2D7D3] pb-3">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide">
              Model Error Comparison (RMSE / MAE)
            </h3>
            <span className="text-xs font-mono font-bold text-[#7A3F39] bg-[#FAF1F0] px-2 py-0.5 rounded border border-[#E6B8B2]">
              {targetFilter.toUpperCase()} • {expFilter}
            </span>
          </div>

          <div className="h-64 w-full bg-[#FAF1F0]/50 p-2 rounded-xl border border-[#F2D7D3]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2D7D3" opacity={0.7} />
                <XAxis dataKey="model" stroke="#6E4E4B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6E4E4B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#F2D7D3', borderRadius: '8px', color: '#2D1412', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(val: any) => typeof val === 'number' ? val.toFixed(3) : val}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar dataKey="RMSE" fill="#7A3F39" radius={[4, 4, 0, 0]} name="RMSE (Lower is Better)" />
                <Bar dataKey="MAE" fill="#1565C0" radius={[4, 4, 0, 0]} name="MAE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Validation Experiments Breakdown */}
        <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#F2D7D3] pb-3">
            <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#7A3F39]" />
              <span>Validation Methodology</span>
            </h3>
          </div>

          <div className="space-y-3 text-xs text-[#6E4E4B]">
            <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
              <span className="font-bold text-[#7A3F39] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#7A3F39]" />
                1. Temporal Holdout (Experiment A)
              </span>
              <p className="text-[#6E4E4B] leading-relaxed">
                Evaluates model generalization across unobserved temporal forecast horizons. Demonstrates dramatic RMSE reduction compared to baseline models.
              </p>
            </div>

            <div className="p-3 bg-[#FAF1F0] rounded-xl border border-[#E6B8B2] space-y-1">
              <span className="font-bold text-[#1565C0] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1565C0]" />
                2. Spatial-Block Holdout (Experiment C - 5 Folds)
              </span>
              <p className="text-[#6E4E4B] leading-relaxed">
                5-fold spatial block cross-validation where contiguous spatial clusters are held out during training to test spatial generalization capability across unseen grid locations.
              </p>
            </div>

            <div className="p-3 bg-[#FAF1F0]/50 rounded-xl border border-[#F2D7D3] text-[11px] text-[#6E4E4B] space-y-1">
              <span className="font-bold text-[#2D1412]">Baseline Definitions:</span>
              <ul className="list-disc pl-4 space-y-0.5">
                <li><strong className="text-[#2D1412]">block_copy:</strong> Coarse grid cell spatial copy baseline.</li>
                <li><strong className="text-[#2D1412]">era5_copy:</strong> Raw ERA5 reanalysis grid output.</li>
                <li><strong className="text-[#2D1412]">lapse_rate:</strong> Standard atmospheric temperature lapse-rate elevation correction.</li>
                <li><strong className="text-[#2D1412]">lgbm_p50:</strong> LightGBM spatial downscaling median model.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Metrics Table */}
      <div className="bg-white border border-[#F2D7D3] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#F2D7D3] pb-3">
          <h3 className="text-sm font-bold text-[#2D1412] uppercase tracking-wide">
            Detailed Evaluation Metrics Table (Loaded from metrics_all.csv)
          </h3>
          <span className="text-xs text-[#6E4E4B] font-mono">Total Evaluation Rows: {metrics.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#2D1412]">
            <thead className="bg-[#FAF1F0] text-[#6E4E4B] font-mono uppercase text-[11px] border-b border-[#E6B8B2]">
              <tr>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Target</th>
                <th className="py-2.5 px-3">Experiment</th>
                <th className="py-2.5 px-3">Sample N</th>
                <th className="py-2.5 px-3">RMSE</th>
                <th className="py-2.5 px-3">MAE</th>
                <th className="py-2.5 px-3">Bias</th>
                {targetFilter === 'rain' && (
                  <>
                    <th className="py-2.5 px-3">POD1</th>
                    <th className="py-2.5 px-3">FAR1</th>
                    <th className="py-2.5 px-3">CSI1</th>
                    <th className="py-2.5 px-3">POD10</th>
                    <th className="py-2.5 px-3">FAR10</th>
                    <th className="py-2.5 px-3">CSI10</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2D7D3] font-mono">
              {filteredMetrics.map((row, idx) => (
                <tr key={idx} className={row.model.includes('lgbm') ? 'bg-[#FAF1F0]/80 font-bold text-[#7A3F39]' : 'hover:bg-[#FAF1F0]/40'}>
                  <td className="py-2 px-3">{row.model}</td>
                  <td className="py-2 px-3 uppercase text-[#6E4E4B]">{row.target}</td>
                  <td className="py-2 px-3 text-[#6E4E4B]">{row.experiment}</td>
                  <td className="py-2 px-3">{row.n}</td>
                  <td className="py-2 px-3 font-extrabold text-[#7A3F39]">{row.rmse.toFixed(3)}</td>
                  <td className="py-2 px-3">{row.mae.toFixed(3)}</td>
                  <td className="py-2 px-3">{row.bias.toFixed(3)}</td>
                  {targetFilter === 'rain' && (
                    <>
                      <td className="py-2 px-3">{row.pod1 !== null && row.pod1 !== undefined ? row.pod1.toFixed(3) : '-'}</td>
                      <td className="py-2 px-3">{row.far1 !== null && row.far1 !== undefined ? row.far1.toFixed(3) : '-'}</td>
                      <td className="py-2 px-3">{row.csi1 !== null && row.csi1 !== undefined ? row.csi1.toFixed(3) : '-'}</td>
                      <td className="py-2 px-3">{row.pod10 !== null && row.pod10 !== undefined ? row.pod10.toFixed(3) : '-'}</td>
                      <td className="py-2 px-3">{row.far10 !== null && row.far10 !== undefined ? row.far10.toFixed(3) : '-'}</td>
                      <td className="py-2 px-3">{row.csi10 !== null && row.csi10 !== undefined ? row.csi10.toFixed(3) : '-'}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
