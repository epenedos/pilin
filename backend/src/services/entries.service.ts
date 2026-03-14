import { entryRepo } from '../repositories/entry.repository';
import { accountRepo } from '../repositories/account.repository';
import { getOccurrences } from '../utils/recurrence';
import { RecurrenceInterval } from '../types';
import { xeService } from './xe.service';

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
          // Get the account to determine currency conversion
          const account = await accountRepo.findById(def.account_id, userId);
          const entryCurrency = def.currency || account?.currency || 'USD';
          const accountCurrency = account?.currency || 'USD';
          const entryAmount = parseFloat(def.amount);

          let convertedAmount: number | null = null;
          let exchangeRate: number | null = null;

          // Re-convert on each generation (rates may change)
          if (entryCurrency.toUpperCase() !== accountCurrency.toUpperCase()) {
            try {
              const conversion = await xeService.convertAmount(entryAmount, entryCurrency, accountCurrency);
              convertedAmount = conversion.convertedAmount;
              exchangeRate = conversion.exchangeRate;
            } catch (error) {
              // If conversion fails, use the parent's conversion values as fallback
              convertedAmount = def.converted_amount ? parseFloat(def.converted_amount) : null;
              exchangeRate = def.exchange_rate ? parseFloat(def.exchange_rate) : null;
            }
          }

          await entryRepo.create({
            userId,
            categoryId: def.category_id,
            accountId: def.account_id,
            type: def.type,
            amount: entryAmount,
            currency: entryCurrency,
            convertedAmount,
            exchangeRate,
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
    accountId?: string;
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
