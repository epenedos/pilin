import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: Date;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
  is_income: boolean;
  sort_order: number;
  created_at: Date;
}

export type EntryType = 'income' | 'expense' | 'transfer';
export type RecurrenceInterval = 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface MoneyEntry {
  id: string;
  user_id: string;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  type: EntryType;
  amount: string; // NUMERIC comes as string from pg
  description: string;
  entry_date: Date;
  is_recurring: boolean;
  recurrence: RecurrenceInterval | null;
  recurrence_start: Date | null;
  recurrence_end: Date | null;
  parent_recurring_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: Date;
  amount: string;
  created_at: Date;
  updated_at: Date;
}
