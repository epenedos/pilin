/**
 * Currency utility functions for formatting and currency options
 */

export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

/**
 * List of supported currencies with their display information
 */
export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'GBP', label: 'British Pound', symbol: '£' },
  { value: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { value: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { value: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { value: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { value: 'CNY', label: 'Chinese Yuan', symbol: '¥' },
  { value: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { value: 'MXN', label: 'Mexican Peso', symbol: 'MX$' },
  { value: 'BRL', label: 'Brazilian Real', symbol: 'R$' },
  { value: 'KRW', label: 'South Korean Won', symbol: '₩' },
  { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { value: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$' },
  { value: 'NOK', label: 'Norwegian Krone', symbol: 'kr' },
  { value: 'SEK', label: 'Swedish Krona', symbol: 'kr' },
  { value: 'DKK', label: 'Danish Krone', symbol: 'kr' },
  { value: 'NZD', label: 'New Zealand Dollar', symbol: 'NZ$' },
  { value: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { value: 'RUB', label: 'Russian Ruble', symbol: '₽' },
  { value: 'TRY', label: 'Turkish Lira', symbol: '₺' },
  { value: 'PLN', label: 'Polish Zloty', symbol: 'zł' },
  { value: 'THB', label: 'Thai Baht', symbol: '฿' },
  { value: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp' },
  { value: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
  { value: 'PHP', label: 'Philippine Peso', symbol: '₱' },
  { value: 'CZK', label: 'Czech Koruna', symbol: 'Kč' },
  { value: 'ILS', label: 'Israeli Shekel', symbol: '₪' },
  { value: 'CLP', label: 'Chilean Peso', symbol: 'CLP$' },
  { value: 'AED', label: 'UAE Dirham', symbol: 'د.إ' },
  { value: 'COP', label: 'Colombian Peso', symbol: 'COP$' },
  { value: 'SAR', label: 'Saudi Riyal', symbol: '﷼' },
  { value: 'TWD', label: 'Taiwan Dollar', symbol: 'NT$' },
  { value: 'ARS', label: 'Argentine Peso', symbol: 'ARS$' },
  { value: 'EGP', label: 'Egyptian Pound', symbol: 'E£' },
];

/**
 * Format an amount in a specific currency using Intl.NumberFormat
 * @param amount - The numeric amount to format
 * @param currency - ISO 4217 currency code (e.g., 'USD', 'EUR')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    locale = 'en-US',
  } = options;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    // Fallback for invalid currency codes
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency options formatted for select dropdowns
 * @returns Array of options with value and label
 */
export function getCurrencyOptions(): { value: string; label: string }[] {
  return SUPPORTED_CURRENCIES.map((c) => ({
    value: c.value,
    label: `${c.value} - ${c.label}`,
  }));
}

/**
 * Get a currency's display information
 * @param code - ISO 4217 currency code
 * @returns CurrencyOption or undefined if not found
 */
export function getCurrencyInfo(code: string): CurrencyOption | undefined {
  return SUPPORTED_CURRENCIES.find((c) => c.value === code);
}

/**
 * Get the symbol for a currency code
 * @param code - ISO 4217 currency code
 * @returns Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(code: string): string {
  const currency = getCurrencyInfo(code);
  return currency?.symbol ?? code;
}

/**
 * Check if a currency code is supported
 * @param code - ISO 4217 currency code
 * @returns true if the currency is supported
 */
export function isSupportedCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some((c) => c.value === code);
}
