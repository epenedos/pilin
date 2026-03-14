import { useState, useEffect } from 'react';
import { entriesApi } from '../api/entries.api';
import { categoriesApi } from '../api/categories.api';
import { accountsApi } from '../api/accounts.api';
import { RecurringEntry, Category, Account } from '../types';
import { EntryForm } from '../components/entries/EntryForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/currency';

export function RecurringPage() {
  const [entries, setEntries] = useState<RecurringEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState<'income' | 'expense' | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const [data, cats, accts] = await Promise.all([
      entriesApi.listRecurring(),
      categoriesApi.list(),
      accountsApi.list(),
    ]);
    setEntries(data);
    setCategories(cats);
    setAccounts(accts);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (data: any) => {
    await entriesApi.create({ ...data, type: showForm!, isRecurring: true });
    setShowForm(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await entriesApi.deleteRecurring(deleteId, true);
    setDeleteId(null);
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

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Recurring Entry"
        message="Are you sure you want to delete this recurring entry and all its generated transactions? This action cannot be undone."
      />

      {showForm && (
        <Modal open={true} onClose={() => setShowForm(null)} title={`Add Recurring ${showForm === 'income' ? 'Income' : 'Expense'}`}>
          <EntryForm type={showForm} categories={categories} accounts={accounts} onSubmit={handleCreate} onCancel={() => setShowForm(null)} />
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
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.categoryColor || '#ccc' }} />
                          {e.categoryName}
                        </span>
                        {' '}&middot; {e.recurrence}
                        {e.recurrenceEnd && ` until ${e.recurrenceEnd}`}
                        {' '}&middot; {e.accountName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-medium">{formatCurrency(e.amount, e.currency)}</span>
                      <button onClick={() => setDeleteId(e.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
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
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.categoryColor || '#ccc' }} />
                          {e.categoryName}
                        </span>
                        {' '}&middot; {e.recurrence}
                        {' '}&middot; {e.accountName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-green-600 font-medium">{formatCurrency(e.amount, e.currency)}</span>
                      <button onClick={() => setDeleteId(e.id)} className="text-gray-400 hover:text-red-600 text-sm">Delete</button>
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
