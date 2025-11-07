-- 1. Add a new temporary jsonb column
ALTER TABLE user_books ADD COLUMN memorable_quotes_new jsonb;

-- 2. Update the new column with transformed data
UPDATE user_books
SET memorable_quotes_new = (
  SELECT jsonb_agg(
    jsonb_build_object('quote', quote, 'page', '', 'thought', '')
  )
  FROM unnest(memorable_quotes) AS quote
)
WHERE memorable_quotes IS NOT NULL AND array_length(memorable_quotes, 1) > 0;

-- 3. Drop the old column
ALTER TABLE user_books DROP COLUMN memorable_quotes;

-- 4. Rename the new column
ALTER TABLE user_books RENAME COLUMN memorable_quotes_new TO memorable_quotes;
