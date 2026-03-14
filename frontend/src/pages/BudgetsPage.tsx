import { useState, useEffect, useCallback } from 'react';
import { budgetsApi } from '../api/budgets.api';
import { categoriesApi } from '../api/categories.api';
import { Budget, Category } from '../types';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function BudgetsPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthDate = month + '-01';

  const load = useCallback(async () => {
    const [data, cats] = await Promise.all([
      budgetsApi.list(monthDate),
      categoriesApi.list(),
    ]);
    setBudgets(data);
    setCategories(cats.filter((c) => !c.isIncome));
    setLoading(false);
  }, [monthDate]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await budgetsApi.create({ categoryId: newCatId, month: monthDate, amount: parseFloat(newAmount) });
    setShowForm(false);
    setNewAmount('');
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await budgetsApi.remove(deleteId);
    setDeleteId(null);
    load();
  };

  const handleCopy = async () => {
    const d = new Date(monthDate);
    d.setMonth(d.getMonth() - 1);
    const prevMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    await budgetsApi.copy(prevMonth, monthDate);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Budgets</h2>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button onClick={handleCopy} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
            Copy from previous
          </button>
          <button onClick={() => setShowForm(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
            + Add Budget
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Budget"
        message="Are you sure you want to delete this budget? This action cannot be undone."
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Budget">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newCatId}
              onChange={(e) => setNewCatId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={!newCatId || !newAmount}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : budgets.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No budgets set for this month</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
            const over = pct > 100;
            return (
              <div key={b.id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                    <span className="font-medium">{b.categoryName}</span>
                  </div>
                  <button onClick={() => setDeleteId(b.id)} className="text-gray-400 hover:text-red-600 text-sm">
                    &times;
                  </button>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={over ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="text-gray-400">of {formatCurrency(b.amount)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: over ? '#EF4444' : b.categoryColor,
                    }}
                  />
                </div>
                <p className={`text-right text-xs mt-1 ${over ? 'text-red-600' : 'text-gray-400'}`}>
                  {pct}%
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
