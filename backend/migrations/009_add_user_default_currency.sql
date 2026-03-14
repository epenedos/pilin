-- Add default currency column to users table
ALTER TABLE users ADD COLUMN default_currency VARCHAR(3) NOT NULL DEFAULT 'USD';
