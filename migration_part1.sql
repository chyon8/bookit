-- Step 1: Add the new jsonb column to store memos with timestamps.
-- We add it with a default empty array value to ensure existing rows are not null.
ALTER TABLE user_books ADD COLUMN memos_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb;
