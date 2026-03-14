import { useState, useEffect, FormEvent } from 'react';
import { Category, EntryType, Account } from '../../types';
import { CurrencySelector } from '../ui/CurrencySelector';

interface Props {
  type: EntryType;
  categories: Category[];
  accounts: Account[];
  onSubmit: (data: {
    categoryId?: string | null;
    accountId: string;
    toAccountId?: string | null;
    amount: number;
    currency: string;
    description: string;
    entryDate: string;
    isRecurring: boolean;
    recurrence?: string;
    recurrenceStart?: string;
    recurrenceEnd?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function EntryForm({ type, categories, accounts, onSubmit, onCancel }: Props) {
  const filtered = type !== 'transfer' ? categories.filter((c) => c.isIncome === (type === 'income')) : [];
  const [categoryId, setCategoryId] = useState(filtered[0]?.id || '');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrence, setRecurrence] = useState('monthly');
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Currency support
  const selectedAccount = accounts.find(a => a.id === accountId);
  const [currency, setCurrency] = useState(selectedAccount?.currency || 'USD');

  // Update currency when account changes (default to account's currency)
  useEffect(() => {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
      setCurrency(account.currency);
    }
  }, [accountId, accounts]);

  // Check if currency conversion will happen
  const needsConversion = selectedAccount && currency !== selectedAccount.currency;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        categoryId: type === 'transfer' ? null : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        amount: parseFloat(amount),
        currency,
        description,
        entryDate,
        isRecurring: type === 'transfer' ? false : isRecurring,
        ...(isRecurring && type !== 'transfer' && {
          recurrence,
          recurrenceStart: entryDate,
          recurrenceEnd: recurrenceEnd || null,
        }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {type === 'transfer' ? 'From Account' : 'Account'}
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {type === 'transfer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {accounts.filter((a) => a.id !== accountId).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {type !== 'transfer' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <CurrencySelector
          value={currency}
          onChange={setCurrency}
          label="Currency"
        />
      </div>
      {needsConversion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <span className="font-medium">Currency conversion:</span> This entry will be converted from {currency} to {selectedAccount?.currency} using the current exchange rate.
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {type !== 'transfer' && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <label htmlFor="recurring" className="text-sm text-gray-700">Recurring</label>
          </div>
          {isRecurring && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date (optional)</label>
                <input
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </>
          )}
        </>
      )}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
