-- Migration: Add reading_sessions table for N-th reading feature
-- This allows users to track multiple readings of the same book

-- Create reading_sessions table
CREATE TABLE reading_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_book_id uuid NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    session_number integer NOT NULL,
    start_date date,
    end_date date,
    rating numeric CHECK (rating >= 0 AND rating <= 5),
    status text CHECK (status IN ('Reading', 'Finished', 'Dropped')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_session UNIQUE (user_book_id, session_number)
);

-- Create index for faster queries
CREATE INDEX idx_reading_sessions_user_book_id ON reading_sessions(user_book_id);

-- Enable RLS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own reading sessions
CREATE POLICY "Users can manage their own reading sessions"
ON reading_sessions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM user_books
        WHERE user_books.id = reading_sessions.user_book_id
        AND user_books.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM user_books
        WHERE user_books.id = reading_sessions.user_book_id
        AND user_books.user_id = auth.uid()
    )
);

-- Trigger for updated_at
CREATE TRIGGER on_reading_sessions_updated
BEFORE UPDATE ON reading_sessions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Migrate existing data from user_books to reading_sessions
-- This creates the first session (session_number = 1) for each existing book
INSERT INTO reading_sessions (user_book_id, session_number, start_date, end_date, rating, status)
SELECT 
    id as user_book_id,
    1 as session_number,
    start_date,
    end_date,
    rating,
    status
FROM user_books
WHERE status IN ('Reading', 'Finished', 'Dropped'); -- Only migrate actual reading sessions (exclude 'Want to Read')

-- Add column to track current session number in user_books
ALTER TABLE user_books ADD COLUMN current_session_number integer DEFAULT 1;
