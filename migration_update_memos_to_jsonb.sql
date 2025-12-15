-- 1. Add the new jsonb column with a default value of an empty array '[]'
ALTER TABLE user_books ADD COLUMN memos_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Create a function to migrate text[] to jsonb[]
CREATE OR REPLACE FUNCTION migrate_memos_to_jsonb()
RETURNS void AS $$
DECLARE
    r RECORD;
    memo_text TEXT;
    json_array JSONB;
BEGIN
    FOR r IN SELECT id, memos FROM user_books WHERE memos IS NOT NULL AND array_length(memos, 1) > 0 LOOP
        json_array := '[]'::jsonb;
        FOREACH memo_text IN ARRAY r.memos
        LOOP
            -- For existing memos, we use the current timestamp for createdAt
            json_array := json_array || jsonb_build_object('text', memo_text, 'createdAt', now());
        END LOOP;
        UPDATE user_books SET memos_jsonb = json_array WHERE id = r.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. Run the migration function
SELECT migrate_memos_to_jsonb();

-- 4. Drop the migration function
DROP FUNCTION migrate_memos_to_jsonb();

-- 5. Drop the old memos column
ALTER TABLE user_books DROP COLUMN memos;

-- 6. Rename the new column to 'memos'
ALTER TABLE user_books RENAME COLUMN memos_jsonb TO memos;
