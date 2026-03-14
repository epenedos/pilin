import { useState, useEffect } from 'react';
import { dashboardApi } from '../api/dashboard.api';
import { DashboardSummary } from '../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.summary().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse">Loading...</div>;
  if (!data) return <div>Failed to load dashboard</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className={`text-2xl font-bold mt-1 ${data.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.currentBalance)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Month Income</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(data.monthIncome)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Month Expenses</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(data.monthExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <p className="text-sm text-gray-500">Month Net</p>
          <p className={`text-2xl font-bold mt-1 ${data.monthNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(data.monthNet)}
          </p>
        </div>
      </div>

      {/* Account Balances */}
      {data.accountBalances.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Account Balances</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.accountBalances.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow p-5">
                <p className="text-sm text-gray-500">{a.name}</p>
                <p className={`text-xl font-bold mt-1 ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(a.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Status */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Budget Status</h3>
          {data.budgetStatus.length === 0 ? (
            <p className="text-gray-400 text-sm">No budgets set for this month</p>
          ) : (
            <div className="space-y-3">
              {data.budgetStatus.map((b) => (
                <div key={b.categoryId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </span>
                    <span className={b.pct > 100 ? 'text-red-600 font-medium' : ''}>
                      {formatCurrency(b.spent)} / {formatCurrency(b.budgeted)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(b.pct, 100)}%`,
                        backgroundColor: b.pct > 100 ? '#EF4444' : b.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Recurring */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming</h3>
          {data.upcomingRecurring.length === 0 ? (
            <p className="text-gray-400 text-sm">No upcoming recurring entries</p>
          ) : (
            <div className="space-y-2">
              {data.upcomingRecurring.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.description}</p>
                    <p className="text-xs text-gray-400">{r.nextDate}</p>
                  </div>
                  <span className={`text-sm font-medium ${r.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Entries */}
        <div className="bg-white rounded-xl shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Entries</h3>
          {data.recentEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">No entries yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Account</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEntries.map((e) => (
                  <tr key={e.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-500">{e.entryDate}</td>
                    <td className="py-2">{e.description}</td>
                    <td className="py-2">
                      {e.type === 'transfer' ? (
                        <span className="text-gray-400">Transfer</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.categoryColor || '#ccc' }} />
                          {e.categoryName}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-gray-500">
                      {e.type === 'transfer'
                        ? `${e.accountName} → ${e.toAccountName}`
                        : e.accountName}
                    </td>
                    <td className={`py-2 text-right font-medium ${
                      e.type === 'income' ? 'text-green-600' : e.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {e.type === 'income' ? '+' : e.type === 'expense' ? '-' : ''}{formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
