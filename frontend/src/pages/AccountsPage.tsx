import { useState, useEffect } from 'react';
import { accountsApi } from '../api/accounts.api';
import { AccountWithBalance } from '../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    const data = await accountsApi.balances();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await accountsApi.create({ name: newName.trim() });
    setNewName('');
    load();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await accountsApi.update(id, { name: editName.trim() });
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    try {
      await accountsApi.remove(id);
      load();
    } catch {
      alert('Cannot delete account with existing entries. Move or delete entries first.');
    }
  };

  if (loading) return <div className="animate-pulse">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Accounts</h2>

      <form onSubmit={handleCreate} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New account name"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleUpdate(a.id)}
                />
                <button onClick={() => handleUpdate(a.id)} className="text-indigo-600 text-sm font-medium">Save</button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 text-sm">Cancel</button>
              </div>
            ) : (
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-500 font-medium">{a.name}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingId(a.id); setEditName(a.name); }}
                    className="text-gray-400 hover:text-indigo-600 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-gray-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
            <p className={`text-2xl font-bold ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(a.balance)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
