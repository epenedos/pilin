import { useState, useEffect } from 'react';
import { chartsApi } from '../api/charts.api';
import { SankeyData } from '../types';
import { SankeyChart } from '../components/charts/SankeyChart';

export function SankeyPage() {
  const [view, setView] = useState<'monthly' | 'annual'>('monthly');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<SankeyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const promise = view === 'monthly'
      ? chartsApi.monthlySankey(month + '-01')
      : chartsApi.annualSankey(year);

    promise.then(setData).finally(() => setLoading(false));
  }, [view, month, year]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sankey</h2>
        <div className="flex gap-3 items-center">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setView('monthly')}
              className={`px-3 py-1 rounded text-sm ${view === 'monthly' ? 'bg-white shadow' : ''}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView('annual')}
              className={`px-3 py-1 rounded text-sm ${view === 'annual' ? 'bg-white shadow' : ''}`}
            >
              Annual
            </button>
          </div>
          {view === 'monthly' ? (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          ) : (
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {loading ? (
          <div className="animate-pulse h-96 flex items-center justify-center">Loading...</div>
        ) : data && data.nodes.length > 0 ? (
          <SankeyChart data={data} width={960} height={540} />
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-400">
            No data for this period. Add some entries first.
          </div>
        )}
      </div>
    </div>
  );
}
