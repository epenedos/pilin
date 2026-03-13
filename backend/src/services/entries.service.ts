import { entryRepo } from '../repositories/entry.repository';
import { getOccurrences } from '../utils/recurrence';
import { RecurrenceInterval } from '../types';

export const entriesService = {
  async generateRecurringEntries(userId: string, from: string, to: string) {
    const definitions = await entryRepo.activeRecurringDefinitions(userId);

    for (const def of definitions) {
      const dates = getOccurrences(
        from, to,
        def.recurrence as RecurrenceInterval,
        def.recurrence_start.toISOString().split('T')[0],
        def.recurrence_end ? def.recurrence_end.toISOString().split('T')[0] : null
      );

      for (const date of dates) {
        const existing = await entryRepo.findGeneratedByParentAndDate(def.id, date);
        if (!existing) {
          await entryRepo.create({
            userId,
            categoryId: def.category_id,
            type: def.type,
            amount: parseFloat(def.amount),
            description: def.description,
            entryDate: date,
            isRecurring: false,
            parentRecurringId: def.id,
          });
        }
      }
    }
  },

  async getEntries(userId: string, filters: {
    type?: string;
    from?: string;
    to?: string;
    categoryId?: string;
    page: number;
    limit: number;
  }) {
    // Generate recurring entries for the requested range
    if (filters.from && filters.to) {
      await this.generateRecurringEntries(userId, filters.from, filters.to);
    }

    return entryRepo.findFiltered(userId, filters);
  },
};
