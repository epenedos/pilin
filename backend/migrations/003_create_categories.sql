CREATE TABLE IF NOT EXISTS categories (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       VARCHAR(100) NOT NULL,
    color      VARCHAR(7) NOT NULL DEFAULT '#6B7280',
    icon       VARCHAR(50),
    is_income  BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, name, is_income)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);
