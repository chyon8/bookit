-- 1. Add a new temporary text[] column
ALTER TABLE user_books ADD COLUMN summary_new text[];

-- 2. Update the new column with transformed data
-- Split existing summary by newline and store as an array.
-- If summary is null or empty, the new column will be null.
UPDATE user_books
SET summary_new = string_to_array(summary, E'\n')
WHERE summary IS NOT NULL AND summary != '';

-- 3. Drop the old column
ALTER TABLE user_books DROP COLUMN summary;

-- 4. Rename the new column
ALTER TABLE user_books RENAME COLUMN summary_new TO summary;
