-- user_books 테이블에 rating과 status 컬럼을 추가합니다.
-- rating은 소수점 첫째 자리까지 허용하는 숫자형으로, status는 텍스트형으로 추가합니다.
ALTER TABLE public.user_books
ADD COLUMN rating DECIMAL(2, 1),
ADD COLUMN status TEXT;