-- 1. Add the new memos column
ALTER TABLE user_books ADD COLUMN memos text[];

-- 2. Migrate data from summary to memos
UPDATE user_books
SET memos = string_to_array(summary, E'
')
WHERE summary IS NOT NULL AND summary != '';

-- 3. (Optional) You can drop the summary column if it's no longer needed
-- ALTER TABLE user_books DROP COLUMN summary;
-- For now, we will keep it to avoid breaking other parts of the app.

