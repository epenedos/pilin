import { entryRepo } from '../repositories/entry.repository';
import { budgetRepo } from '../repositories/budget.repository';
import { getNextOccurrence } from '../utils/recurrence';
import { entriesService } from './entries.service';
import { RecurrenceInterval } from '../types';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function monthStart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthEnd(dateStr: string): string {
  const d = new Date(dateStr);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

export const dashboardService = {
  async getSummary(userId: string, month: string) {
    const ms = monthStart(month);
    const me = monthEnd(month);

    // Generate recurring entries for the month
    await entriesService.generateRecurringEntries(userId, ms, me);

    const todayStr = today();
    const [totalIncome, totalExpenses, monthIncome, monthExpenses] = await Promise.all([
      entryRepo.sumByTypeUpToDate(userId, 'income', todayStr),
      entryRepo.sumByTypeUpToDate(userId, 'expense', todayStr),
      entryRepo.sumByTypeAndDateRange(userId, 'income', ms, me),
      entryRepo.sumByTypeAndDateRange(userId, 'expense', ms, me),
    ]);

    const currentBalance = totalIncome - totalExpenses;

    const budgets = await budgetRepo.findByMonth(userId, ms);
    const budgetStatus = budgets.map((b: any) => ({
      categoryId: b.category_id,
      name: b.category_name,
      color: b.category_color,
      budgeted: parseFloat(b.amount),
      spent: parseFloat(b.spent),
      pct: parseFloat(b.amount) > 0 ? Math.round((parseFloat(b.spent) / parseFloat(b.amount)) * 100) : 0,
    }));

    // Upcoming recurring
    const recurring = await entryRepo.activeRecurringDefinitions(userId);
    const upcomingRecurring = recurring
      .map((r: any) => {
        const nextDate = getNextOccurrence(
          r.recurrence as RecurrenceInterval,
          r.recurrence_start.toISOString().split('T')[0],
          r.recurrence_end ? r.recurrence_end.toISOString().split('T')[0] : null,
          todayStr
        );
        return nextDate ? {
          id: r.id,
          description: r.description,
          amount: parseFloat(r.amount),
          type: r.type,
          nextDate,
        } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.nextDate.localeCompare(b.nextDate))
      .slice(0, 5);

    const recentEntries = await entryRepo.recentEntries(userId, 10);

    return {
      currentBalance,
      monthIncome,
      monthExpenses,
      monthNet: monthIncome - monthExpenses,
      budgetStatus,
      upcomingRecurring,
      recentEntries: recentEntries.map((e: any) => ({
        id: e.id,
        description: e.description,
        amount: parseFloat(e.amount),
        type: e.type,
        entryDate: e.entry_date,
        categoryName: e.category_name,
        categoryColor: e.category_color,
      })),
    };
  },
};
