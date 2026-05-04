-- Idempotent: safe if column already exists (e.g. fresh create_all).
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS content JSONB;
