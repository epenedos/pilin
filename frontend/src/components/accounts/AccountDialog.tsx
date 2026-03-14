import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { CurrencySelector } from '../ui/CurrencySelector';
import { accountsApi } from '../../api/accounts.api';
import { entriesApi } from '../../api/entries.api';
import { AccountWithBalance } from '../../types';

interface AccountDialogProps {
  open: boolean;
  onClose: () => void;
  account?: AccountWithBalance | null;
  onSaved: () => void;
}

export function AccountDialog({ open, onClose, account, onSaved }: AccountDialogProps) {
  const isEditMode = !!account;

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingInitialBalance, setLoadingInitialBalance] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      if (account) {
        setName(account.name);
        setCurrency(account.currency);
        setInitialBalance('');
        // Fetch initial balance if exists
        if (account.initialBalanceEntryId) {
          setLoadingInitialBalance(true);
          entriesApi.getById(account.initialBalanceEntryId)
            .then((entry) => {
              if (entry) {
                setInitialBalance(entry.amount.toString());
              }
            })
            .catch(() => {
              // Ignore errors fetching initial balance
            })
            .finally(() => {
              setLoadingInitialBalance(false);
            });
        }
      } else {
        setName('');
        setCurrency('USD');
        setInitialBalance('');
      }
    }
  }, [open, account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    setSubmitting(true);
    try {
      const balanceValue = initialBalance.trim() ? parseFloat(initialBalance) : undefined;

      if (isEditMode && account) {
        await accountsApi.update(account.id, {
          name: name.trim(),
          initialBalance: balanceValue,
        });
      } else {
        await accountsApi.create({
          name: name.trim(),
          currency,
          initialBalance: balanceValue,
        });
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Account' : 'Add Account'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Checking Account"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            autoFocus
            disabled={submitting}
          />
        </div>

        {isEditMode ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <input
              type="text"
              value={currency}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Currency cannot be changed after account creation
            </p>
          </div>
        ) : (
          <CurrencySelector
            value={currency}
            onChange={setCurrency}
            label="Currency"
            disabled={submitting}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Initial Balance
          </label>
          <input
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={submitting || loadingInitialBalance}
          />
          <p className="mt-1 text-xs text-gray-500">
            {isEditMode
              ? 'Update the initial balance (set to 0 to remove)'
              : 'Optional: Set an opening balance for this account'}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            disabled={submitting || loadingInitialBalance}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
