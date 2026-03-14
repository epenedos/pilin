-- Add 'transfer' to entry_type enum (must be committed before use)
ALTER TYPE entry_type ADD VALUE IF NOT EXISTS 'transfer';
