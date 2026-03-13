import { useState, useEffect } from 'react';
import { entriesApi } from '../api/entries.api';
import { categoriesApi } from '../api/categories.api';
import { RecurringEntry, Category } from '../types';
import { EntryForm } from '../components/entries/EntryForm';
import { Modal } from '../components/ui/Modal';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function RecurringPage() {
  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState<'income' | 'expense' | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [data, cats] = await Promise.all([
      entriesApi.listRecurring(),
      categoriesApi.list(),
    ]);
    setEntries(data);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: any) => {
    await entriesApi.create({ ...data, type: showForm!, isRecurring: true });
    setShowForm(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await entriesApi.deleteRecurring(id, true);
    load();
  };

  const expenseEntries = entries.filter((e) => e.type === 'expense');
  const incomeEntries = entries.filter((e) => e.type === 'income');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Recurring</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm('expense')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            + Recurring Expense
          </button>
          <button
            onClick={() => setShowForm('income')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            + Recurring Income
          </button>
        </div>
      </div>

      {showForm && (
        <Modal open={true} onClose={() => setShowForm(null)} title={`Add Recurring ${showForm === 'income' ? 'Income' : 'Expense'}`}>
          <EntryForm type={showForm} categories={categories} onSubmit={handleCreate} onCancel={() => setShowForm(null)} />
        </Modal>
      )}

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Recurring Expenses</h3>
            {expenseEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">No recurring expenses</p>
            ) : (
              <div className="space-y-2">
                {expenseEntries.map((e) => (
                  <div key={e.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.categoryColor }} />
                          {e.categoryName}
                        </span>
                        {' '}&middot; {e.recurrence}
                        {e.recurrenceEnd && ` until ${e.recurrenceEnd}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-medium">{formatCurrency(e.amount)}</span>
                      <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Recurring Income</h3>
            {incomeEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">No recurring income</p>
            ) : (
              <div className="space-y-2">
                {incomeEntries.map((e) => (
                  <div key={e.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{e.description}</p>
                      <p className="text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.categoryColor }} />
                          {e.categoryName}
                        </span>
                        {' '}&middot; {e.recurrence}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 font-medium">{formatCurrency(e.amount)}</span>
                      <button onClick={() => handleDelete(e.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
