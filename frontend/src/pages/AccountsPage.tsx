import { useState, useEffect } from 'react';
import { accountsApi } from '../api/accounts.api';
import { AccountWithBalance } from '../types';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AccountDialog } from '../components/accounts/AccountDialog';
import { formatCurrency } from '../utils/currency';

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountWithBalance | null>(null);

  const load = async () => {
    const data = await accountsApi.balances();
    setAccounts(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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

  const openCreateDialog = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const openEditDialog = (account: AccountWithBalance) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAccount(null);
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

      <AccountDialog
        open={dialogOpen}
        onClose={closeDialog}
        account={editingAccount}
        onSaved={load}
      />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Accounts</h2>
        <button
          onClick={openCreateDialog}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          + Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-xl shadow p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-sm text-gray-500 font-medium">{a.name}</p>
                <p className="text-xs text-gray-400">{a.currency}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditDialog(a)}
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
            <p className={`text-2xl font-bold ${a.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(a.balance, a.currency)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
