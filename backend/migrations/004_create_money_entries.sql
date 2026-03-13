DO $$ BEGIN
    CREATE TYPE entry_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE recurrence_interval AS ENUM ('weekly', 'biweekly', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS money_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type                entry_type NOT NULL,
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    description         VARCHAR(500) NOT NULL,
    entry_date          DATE NOT NULL,

    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence          recurrence_interval,
    recurrence_start    DATE,
    recurrence_end      DATE,
    parent_recurring_id UUID REFERENCES money_entries(id) ON DELETE SET NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_recurring_fields CHECK (
        (is_recurring = FALSE AND recurrence IS NULL AND recurrence_start IS NULL)
        OR
        (is_recurring = TRUE AND recurrence IS NOT NULL AND recurrence_start IS NOT NULL)
    ),
    CONSTRAINT chk_recurrence_dates CHECK (
        recurrence_end IS NULL OR recurrence_end > recurrence_start
    ),
    CONSTRAINT chk_parent_not_self CHECK (parent_recurring_id != id)
);

CREATE INDEX IF NOT EXISTS idx_money_entries_user_id ON money_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_money_entries_user_date ON money_entries (user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_money_entries_user_type_date ON money_entries (user_id, type, entry_date);
CREATE INDEX IF NOT EXISTS idx_money_entries_category ON money_entries (category_id);
CREATE INDEX IF NOT EXISTS idx_money_entries_parent ON money_entries (parent_recurring_id) WHERE parent_recurring_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_money_entries_recurring ON money_entries (user_id, is_recurring) WHERE is_recurring = TRUE AND parent_recurring_id IS NULL;
