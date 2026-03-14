-- Add currency support to money_entries table
-- currency: the original currency of the entry
-- converted_amount: amount converted to the account's currency
-- exchange_rate: the exchange rate used for conversion

ALTER TABLE money_entries ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD';
ALTER TABLE money_entries ADD COLUMN converted_amount NUMERIC(12,2);
ALTER TABLE money_entries ADD COLUMN exchange_rate NUMERIC(18,8);
