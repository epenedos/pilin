export interface User {
  id: string;
  email: string;
  displayName: string;
  defaultCurrency: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isIncome: boolean;
  sortOrder: number;
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  initialBalanceEntryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export type EntryType = 'income' | 'expense' | 'transfer';
export type RecurrenceInterval = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface MoneyEntry {
  id: string;
  type: EntryType;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string;
  accountName: string;
  accountCurrency: string;
  toAccountId: string | null;
  toAccountName: string | null;
  toAccountCurrency: string | null;
  amount: number;
  currency: string;
  convertedAmount: number | null;
  exchangeRate: number | null;
  description: string;
  entryDate: string;
  isRecurring: boolean;
  parentRecurringId: string | null;
  createdAt: string;
}

export interface RecurringEntry {
  id: string;
  type: EntryType;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  accountId: string;
  accountName: string;
  amount: number;
  currency: string;
  convertedAmount: number | null;
  exchangeRate: number | null;
  description: string;
  recurrence: RecurrenceInterval;
  recurrenceStart: string;
  recurrenceEnd: string | null;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  month: string;
  amount: number;
  spent: number;
}

export interface DashboardSummary {
  currentBalance: number;
  monthIncome: number;
  monthExpenses: number;
  monthNet: number;
  accountBalances: {
    id: string;
    name: string;
    balance: number;
    currency: string;
  }[];
  budgetStatus: {
    categoryId: string;
    name: string;
    color: string;
    budgeted: number;
    spent: number;
    pct: number;
  }[];
  upcomingRecurring: {
    id: string;
    description: string;
    amount: number;
    type: EntryType;
    nextDate: string;
  }[];
  recentEntries: {
    id: string;
    description: string;
    amount: number;
    type: EntryType;
    entryDate: string;
    categoryName: string | null;
    categoryColor: string | null;
    accountName: string;
    toAccountName: string | null;
    currency: string;
    convertedAmount: number | null;
    accountCurrency: string;
  }[];
}

export interface SankeyData {
  nodes: { id: string; name: string; color: string }[];
  links: { source: string; target: string; value: number }[];
}

export interface ForecastData {
  startBalance: number;
  points: {
    date: string;
    projectedBalance: number;
    incomeTotal: number;
    expenseTotal: number;
  }[];
}
