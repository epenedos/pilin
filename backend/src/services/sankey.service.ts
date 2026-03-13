import { entryRepo } from '../repositories/entry.repository';
import { entriesService } from './entries.service';

function monthStart(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthEnd(dateStr: string): string {
  const d = new Date(dateStr);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return lastDay.toISOString().split('T')[0];
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const sankeyService = {
  async getMonthlySankey(userId: string, month: string) {
    const ms = monthStart(month);
    const me = monthEnd(month);

    await entriesService.generateRecurringEntries(userId, ms, me);

    const [incomeByCategory, expenseByCategory, expenseEntries] = await Promise.all([
      entryRepo.sumByCategoryAndDateRange(userId, 'income', ms, me),
      entryRepo.sumByCategoryAndDateRange(userId, 'expense', ms, me),
      entryRepo.findByTypeAndDateRange(userId, 'expense', ms, me),
    ]);

    const nodes: { id: string; name: string; color: string }[] = [];
    const links: { source: string; target: string; value: number }[] = [];

    const totalIncome = incomeByCategory.reduce((s: number, c: any) => s + parseFloat(c.total), 0);
    const totalExpenses = expenseByCategory.reduce((s: number, c: any) => s + parseFloat(c.total), 0);

    // Income category nodes
    for (const cat of incomeByCategory) {
      const nodeId = `inc-${cat.category_id}`;
      nodes.push({ id: nodeId, name: cat.category_name, color: cat.category_color });
      links.push({ source: nodeId, target: 'budget', value: parseFloat(cat.total) });
    }

    // Central budget node
    const d = new Date(ms);
    nodes.push({ id: 'budget', name: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, color: '#6366F1' });

    // Expense category nodes
    for (const cat of expenseByCategory) {
      const catNodeId = `exp-cat-${cat.category_id}`;
      nodes.push({ id: catNodeId, name: cat.category_name, color: cat.category_color });
      links.push({ source: 'budget', target: catNodeId, value: parseFloat(cat.total) });

      // Individual expense entries for this category (top 5)
      const catEntries = expenseEntries
        .filter((e: any) => e.category_id === cat.category_id)
        .slice(0, 5);

      let catEntryTotal = 0;
      for (const entry of catEntries) {
        const entryNodeId = `exp-${entry.id}`;
        const amount = parseFloat(entry.amount);
        nodes.push({ id: entryNodeId, name: entry.description, color: cat.category_color });
        links.push({ source: catNodeId, target: entryNodeId, value: amount });
        catEntryTotal += amount;
      }

      // "Other" node for remaining entries
      const remaining = parseFloat(cat.total) - catEntryTotal;
      if (remaining > 0.01) {
        const otherNodeId = `exp-other-${cat.category_id}`;
        nodes.push({ id: otherNodeId, name: `Other ${cat.category_name}`, color: cat.category_color });
        links.push({ source: catNodeId, target: otherNodeId, value: remaining });
      }
    }

    // Savings or Deficit
    const diff = totalIncome - totalExpenses;
    if (diff > 0.01) {
      nodes.push({ id: 'savings', name: 'Savings', color: '#22C55E' });
      links.push({ source: 'budget', target: 'savings', value: diff });
    } else if (diff < -0.01) {
      nodes.push({ id: 'deficit', name: 'Deficit', color: '#EF4444' });
      links.push({ source: 'deficit', target: 'budget', value: Math.abs(diff) });
    }

    return { nodes, links };
  },

  async getAnnualSankey(userId: string, year: number) {
    const monthlyData = await entryRepo.monthlyTotalsByCategory(userId, year);

    const nodes: { id: string; name: string; color: string }[] = [];
    const links: { source: string; target: string; value: number }[] = [];
    const nodeIds = new Set<string>();

    const monthlyIncome: Record<number, number> = {};
    const monthlyExpenses: Record<number, number> = {};

    for (const row of monthlyData) {
      const monthIdx = new Date(row.month).getMonth();
      const amount = parseFloat(row.total);

      if (row.type === 'income') {
        monthlyIncome[monthIdx] = (monthlyIncome[monthIdx] || 0) + amount;
      } else {
        monthlyExpenses[monthIdx] = (monthlyExpenses[monthIdx] || 0) + amount;

        // Category node
        const catNodeId = `cat-${row.category_id}`;
        if (!nodeIds.has(catNodeId)) {
          nodes.push({ id: catNodeId, name: row.category_name, color: row.category_color });
          nodeIds.add(catNodeId);
        }

        // Month → Category link
        const monthNodeId = `month-${monthIdx}`;
        if (!nodeIds.has(monthNodeId)) {
          nodes.push({ id: monthNodeId, name: MONTH_NAMES[monthIdx], color: '#6366F1' });
          nodeIds.add(monthNodeId);
        }

        links.push({ source: monthNodeId, target: catNodeId, value: amount });
      }
    }

    // Savings per month
    let hasSavings = false;
    for (const monthIdx of Object.keys(monthlyIncome).map(Number)) {
      const income = monthlyIncome[monthIdx] || 0;
      const expenses = monthlyExpenses[monthIdx] || 0;
      const savings = income - expenses;
      if (savings > 0.01) {
        hasSavings = true;
        const monthNodeId = `month-${monthIdx}`;
        if (!nodeIds.has(monthNodeId)) {
          nodes.push({ id: monthNodeId, name: MONTH_NAMES[monthIdx], color: '#6366F1' });
          nodeIds.add(monthNodeId);
        }
        links.push({ source: monthNodeId, target: 'savings', value: savings });
      }
    }

    if (hasSavings) {
      nodes.push({ id: 'savings', name: 'Savings', color: '#22C55E' });
    }

    return { nodes, links };
  },
};
