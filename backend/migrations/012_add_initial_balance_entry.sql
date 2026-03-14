-- Add initial_balance_entry_id to accounts table
-- This links an account to its initial balance income entry
ALTER TABLE accounts ADD COLUMN initial_balance_entry_id UUID REFERENCES money_entries(id) ON DELETE SET NULL;

CREATE INDEX idx_accounts_initial_balance_entry ON accounts (initial_balance_entry_id) WHERE initial_balance_entry_id IS NOT NULL;
