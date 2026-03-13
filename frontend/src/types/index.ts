export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isIncome: boolean;
  sortOrder: number;
}

export type EntryType = 'income' | 'expense';
export type RecurrenceInterval = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface MoneyEntry {
  id: string;
  type: EntryType;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  description: string;
  entryDate: string;
  isRecurring: boolean;
  parentRecurringId: string | null;
  createdAt: string;
}

export interface RecurringEntry {
  id: string;
  type: EntryType;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
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
    categoryName: string;
    categoryColor: string;
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
