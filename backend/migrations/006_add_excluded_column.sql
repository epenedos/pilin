ALTER TABLE money_entries ADD COLUMN IF NOT EXISTS excluded BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_money_entries_excluded ON money_entries (user_id, excluded) WHERE excluded = TRUE;
