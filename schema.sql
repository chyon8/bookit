-- books 테이블 생성
CREATE TABLE books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    title text NOT NULL,
    author text,
    category text,
    genre text,
    cover_image_url text,
    isbn13 text,
    -- 여러 사용자가 같은 책을 추가할 수 있으므로, 책 정보는 고유해야 합니다.
    CONSTRAINT unique_book UNIQUE (isbn13)
);

-- user_books 테이블 생성
CREATE TABLE user_books (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    start_date date DEFAULT CURRENT_DATE,
    end_date date DEFAULT CURRENT_DATE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    one_line_review text,
    motivation text,
    summary text,
    memorable_quotes text[],
    learnings text,
    questions_from_book text[],
    reread_will boolean,
    reread_reason text,
    connected_thoughts text,
    overall_impression text,
    worth_owning boolean DEFAULT false,
    -- 한 사용자는 같은 책을 한 번만 추가할 수 있습니다.
    CONSTRAINT unique_user_book UNIQUE (user_id, book_id)
);

-- RLS (Row Level Security) 활성화
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_books ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 books 테이블을 읽을 수 있도록 허용하는 정책
CREATE POLICY "Allow all users to read books"
ON books
FOR SELECT
USING (true);

-- 인증된 사용자가 books 테이블에 책을 추가하고 수정할 수 있도록 허용하는 정책
CREATE POLICY "Allow authenticated users to insert and update books"
ON books
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 사용자가 자신의 user_books 데이터만 다룰 수 있도록 하는 정책
CREATE POLICY "Allow users to manage their own books"
ON user_books
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- updated_at 자동 갱신을 위한 함수 및 트리거
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_books_updated
BEFORE UPDATE ON user_books
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();