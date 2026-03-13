import { entryRepo } from '../repositories/entry.repository';
import { getOccurrences } from '../utils/recurrence';
import { RecurrenceInterval } from '../types';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonthsStr(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

export const forecastService = {
  async getForecast(userId: string, months: number) {
    const todayStr = today();

    // Current balance
    const [totalIncome, totalExpenses] = await Promise.all([
      entryRepo.sumByTypeUpToDate(userId, 'income', todayStr),
      entryRepo.sumByTypeUpToDate(userId, 'expense', todayStr),
    ]);
    const startBalance = totalIncome - totalExpenses;

    // Get recurring definitions and future one-time entries
    const [recurring, futureOneTime] = await Promise.all([
      entryRepo.activeRecurringDefinitions(userId),
      entryRepo.futureOneTimeEntries(userId),
    ]);

    const endDate = addMonthsStr(todayStr, months);
    const points: { date: string; projectedBalance: number; incomeTotal: number; expenseTotal: number }[] = [];

    // Generate weekly points
    let balance = startBalance;
    let cursor = todayStr;

    while (cursor <= endDate) {
      const weekEnd = addDaysStr(cursor, 6);
      let weekIncome = 0;
      let weekExpense = 0;

      // Check recurring entries
      for (const def of recurring) {
        const occurrences = getOccurrences(
          cursor, weekEnd,
          def.recurrence as RecurrenceInterval,
          def.recurrence_start.toISOString().split('T')[0],
          def.recurrence_end ? def.recurrence_end.toISOString().split('T')[0] : null
        );
        for (const _occ of occurrences) {
          const amount = parseFloat(def.amount);
          if (def.type === 'income') weekIncome += amount;
          else weekExpense += amount;
        }
      }

      // Check future one-time entries
      for (const entry of futureOneTime) {
        const entryDate = entry.entry_date.toISOString().split('T')[0];
        if (entryDate >= cursor && entryDate <= weekEnd) {
          const amount = parseFloat(entry.amount);
          if (entry.type === 'income') weekIncome += amount;
          else weekExpense += amount;
        }
      }

      balance += weekIncome - weekExpense;

      points.push({
        date: cursor,
        projectedBalance: Math.round(balance * 100) / 100,
        incomeTotal: Math.round(weekIncome * 100) / 100,
        expenseTotal: Math.round(weekExpense * 100) / 100,
      });

      cursor = addDaysStr(cursor, 7);
    }

    return { startBalance, points };
  },
};
