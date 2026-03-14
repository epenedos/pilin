import { useState, useEffect } from 'react';
import { accountsApi } from '../api/accounts.api';
import { AccountWithBalance } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CurrencySelector } from '../components/ui/CurrencySelector';
import { formatCurrency } from '../utils/currency';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newCurrency, setNewCurrency] = useState('USD');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const data = await accountsApi.balances();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await accountsApi.create({ name: newName.trim(), currency: newCurrency });
    setNewName('');
    setNewCurrency('USD');
    load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await accountsApi.update(id, { name: editName.trim() });
    setEditingId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await accountsApi.remove(deleteId);
      setDeleteId(null);
      load();
    } catch {
      setDeleteId(null);
      alert('Cannot delete account with existing entries. Move or delete entries first.');
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div>
      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Account"
        message="Are you sure you want to delete this account? This action cannot be undone."
      />

      <h2 className="text-2xl font-bold mb-6">Accounts</h2>

      <form onSubmit={handleCreate} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New account name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <CurrencySelector
          value={newCurrency}
          onChange={setNewCurrency}
          className="w-48"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Add Account
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow p-6">
            {editingId === a.id ? (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(a.id)}
                />
                <CurrencySelector
                  value={editCurrency}
                  onChange={setEditCurrency}
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(a.id)} className="text-indigo-600 text-sm font-medium">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.currency}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingId(a.id); setEditName(a.name); setEditCurrency(a.currency); }}
                    className="text-gray-400 hover:text-indigo-600 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="text-gray-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            <p className={`text-2xl font-bold ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(a.balance, a.currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
