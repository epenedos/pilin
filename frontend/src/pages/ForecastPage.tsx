import { useState, useEffect } from 'react';
import { forecastApi } from '../api/forecast.api';
import { ForecastData } from '../types';
import { ForecastChart } from '../components/charts/ForecastChart';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function ForecastPage() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    forecastApi.get(months).then(setData).finally(() => setLoading(false));
  }, [months]);

  const hasNegative = data?.points.some((p) => p.projectedBalance < 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Forecast</h2>
        <div className="flex gap-3 items-center">
          <label className="text-sm text-gray-600">Horizon:</label>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
          </select>
        </div>
      </div>

      {hasNegative && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
          Warning: Your projected balance goes negative during this period. Consider adjusting your spending or adding income.
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        {loading ? (
          <div className="animate-pulse h-96 flex items-center justify-center">Loading...</div>
        ) : data ? (
          <>
            <div className="flex gap-6 mb-4 text-sm">
              <div>
                <span className="text-gray-500">Current balance: </span>
                <span className="font-semibold">{formatCurrency(data.startBalance)}</span>
              </div>
              {data.points.length > 0 && (
                <div>
                  <span className="text-gray-500">Projected ({months}mo): </span>
                  <span className={`font-semibold ${data.points[data.points.length - 1].projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.points[data.points.length - 1].projectedBalance)}
                  </span>
                </div>
              )}
            </div>
            <ForecastChart data={data} width={960} height={400} />
          </>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-400">No data</div>
        )}
      </div>
    </div>
  );
}
