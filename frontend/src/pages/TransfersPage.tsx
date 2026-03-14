import { useState, useEffect, useCallback } from 'react';
import { entriesApi } from '../api/entries.api';
import { accountsApi } from '../api/accounts.api';
import { MoneyEntry, Account } from '../types';
import { EntryForm } from '../components/entries/EntryForm';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/currency';

function getMonthRange(dateStr: string) {
  const d = new Date(dateStr);
  const from = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const to = last.toISOString().split('T')[0];
  return { from, to };
}

export function TransfersPage() {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { from, to } = getMonthRange(month + '-01');
    const [result, accts] = await Promise.all([
      entriesApi.list({ type: 'transfer', from, to, limit: 100 }),
      accountsApi.list(),
    ]);
    setEntries(result.data);
    setTotal(result.total);
    setAccounts(accts);
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data: any) => {
    await entriesApi.create({ ...data, type: 'transfer' });
    setShowForm(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await entriesApi.remove(deleteId);
    setDeleteId(null);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transfers</h2>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <button
            onClick={() => setShowForm(true)}
            disabled={accounts.length < 2}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Transfer
          </button>
        </div>
      </div>

      {accounts.length < 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-700">
          You need at least 2 accounts to create transfers. Go to the Accounts page to add more.
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        title="Delete Transfer"
        message="Are you sure you want to delete this transfer? This action cannot be undone."
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Transfer">
        <EntryForm type="transfer" categories={[]} accounts={accounts} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>

      {loading ? (
        <div className="animate-pulse">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No transfers for this month</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{e.entryDate}</td>
                  <td className="px-4 py-3">{e.description}</td>
                  <td className="px-4 py-3">{e.accountName}</td>
                  <td className="px-4 py-3">{e.toAccountName}</td>
                  <td className="px-4 py-3 text-right font-medium text-blue-600">
                    {e.convertedAmount && e.currency !== e.accountCurrency ? (
                      <span className="flex flex-col items-end">
                        <span>{formatCurrency(e.convertedAmount, e.accountCurrency)}</span>
                        <span className="text-xs text-gray-400">
                          {formatCurrency(e.amount, e.currency)}
                        </span>
                      </span>
                    ) : (
                      formatCurrency(e.amount, e.currency)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteId(e.id)}
                      className="text-gray-400 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-gray-50 text-sm text-gray-500">
            {total} transfers total
          </div>
        </div>
      )}
    </div>
  );
}
