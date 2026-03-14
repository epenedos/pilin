-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX idx_accounts_user ON accounts (user_id);

-- Add account columns to money_entries
ALTER TABLE money_entries ADD COLUMN account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;
ALTER TABLE money_entries ADD COLUMN to_account_id UUID REFERENCES accounts(id) ON DELETE RESTRICT;

-- Make category_id nullable (transfers have no category)
ALTER TABLE money_entries ALTER COLUMN category_id DROP NOT NULL;

-- Migrate existing data: create default account per user, backfill entries
INSERT INTO accounts (user_id, name)
SELECT id, 'Main Account' FROM users;

UPDATE money_entries me
SET account_id = a.id
FROM accounts a
WHERE a.user_id = me.user_id AND a.name = 'Main Account';

-- Now make account_id required
ALTER TABLE money_entries ALTER COLUMN account_id SET NOT NULL;

-- Constraints
ALTER TABLE money_entries ADD CONSTRAINT chk_transfer_accounts CHECK (
  (type = 'transfer' AND to_account_id IS NOT NULL AND to_account_id != account_id)
  OR (type != 'transfer' AND to_account_id IS NULL)
);

ALTER TABLE money_entries ADD CONSTRAINT chk_category_required CHECK (
  type = 'transfer' OR category_id IS NOT NULL
);

ALTER TABLE money_entries ADD CONSTRAINT chk_transfer_not_recurring CHECK (
  type != 'transfer' OR is_recurring = FALSE
);

-- Indexes
CREATE INDEX idx_money_entries_account ON money_entries (account_id);
CREATE INDEX idx_money_entries_to_account ON money_entries (to_account_id) WHERE to_account_id IS NOT NULL;
