-- =============================================
-- BookIt AI 독서 메이트 — Chat 테이블 마이그레이션
-- =============================================

-- ① 대화 세션 테이블
-- book_id가 NULL이면 "서재 전체" 대화, 값이 있으면 "이 책에 대한" 대화
CREATE TABLE chat_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id uuid REFERENCES books(id) ON DELETE SET NULL,
    title text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ② 메시지 테이블
CREATE TABLE chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ③ 사용량 추적 테이블 (MVP에서는 기록만, 제한 로직 없음)
CREATE TABLE usage_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
    daily_chat_count integer DEFAULT 0,
    daily_reset_at date DEFAULT CURRENT_DATE,
    total_tokens_used bigint DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_user_usage UNIQUE (user_id)
);

-- =============================================
-- 인덱스
-- =============================================

-- 대화 목록 조회 최적화 (user별 최신순)
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id, updated_at DESC);

-- 메시지 조회 최적화 (대화별 시간순)
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id, created_at DESC);

-- =============================================
-- RLS (Row Level Security)
-- =============================================

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 대화만 관리 가능
CREATE POLICY "Users manage own conversations"
ON chat_conversations FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 대화에 속한 메시지만 관리 가능
CREATE POLICY "Users manage own messages"
ON chat_messages FOR ALL
USING (conversation_id IN (
    SELECT id FROM chat_conversations WHERE user_id = auth.uid()
))
WITH CHECK (conversation_id IN (
    SELECT id FROM chat_conversations WHERE user_id = auth.uid()
));

-- 사용자는 자신의 사용량만 관리 가능
CREATE POLICY "Users manage own usage"
ON usage_limits FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 트리거: updated_at 자동 갱신
-- handle_updated_at() 함수는 schema.sql에서 이미 생성됨
-- =============================================

CREATE TRIGGER on_chat_conversations_updated
BEFORE UPDATE ON chat_conversations
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
