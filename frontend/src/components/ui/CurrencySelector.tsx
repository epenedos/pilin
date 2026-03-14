import { SUPPORTED_CURRENCIES } from '../../utils/currency';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  label,
  disabled = false,
  className = '',
}: CurrencySelectorProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        {SUPPORTED_CURRENCIES.map((currency) => (
          <option key={currency.value} value={currency.value}>
            {currency.value} - {currency.label}
          </option>
        ))}
      </select>
    </div>
  );
}
