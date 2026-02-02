-- ============================================================
-- TBS 테스트 웹앱 - Supabase 데이터베이스 스키마
-- ============================================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- 기존 테이블 삭제 (주의: 데이터가 삭제됩니다)
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- 1. users 테이블 (사용자 계정)
-- ============================================================
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'admin')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 초기 사용자 데이터 삽입
INSERT INTO users (id, password, role, name) VALUES
    ('jahyun', 'pass1', 'candidate', '홍자현'),
    ('candidate1', 'test1234', 'candidate', '후보자1'),
    ('candidate2', 'test1234', 'candidate', '후보자2'),
    ('admin', 'admin1234', 'admin', '관리자'),
    ('minchang', 'adminpass', 'admin', '김민창');

-- ============================================================
-- 2. sessions 테이블 (로그인 세션)
-- ============================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================================
-- 3. submissions 테이블 (답안 제출)
-- ============================================================
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL CHECK (problem_id IN (1, 2)),
    answers JSONB DEFAULT '{}',
    is_submitted BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_is_submitted ON submissions(is_submitted);

-- ============================================================
-- 4. grades 테이블 (채점 결과)
-- ============================================================
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id INTEGER NOT NULL CHECK (problem_id IN (1, 2)),
    score INTEGER CHECK (score >= 0 AND score <= 100),
    weakness_tags TEXT[] DEFAULT '{}',
    feedback TEXT,
    detailed_scores JSONB,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_by TEXT REFERENCES users(id),
    UNIQUE(user_id, problem_id)
);

CREATE INDEX idx_grades_user_id ON grades(user_id);
CREATE INDEX idx_grades_problem_id ON grades(problem_id);
CREATE INDEX idx_grades_score ON grades(score);

-- ============================================================
-- 5. Row Level Security (RLS) 설정
-- ============================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- users 테이블 정책
CREATE POLICY "Public read access for users" ON users
    FOR SELECT USING (true);

-- sessions 테이블 정책
CREATE POLICY "Anyone can manage sessions" ON sessions
    FOR ALL USING (true);

-- submissions 테이블 정책
CREATE POLICY "Public read access for submissions" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Public insert for submissions" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update for submissions" ON submissions
    FOR UPDATE USING (true);

-- grades 테이블 정책
CREATE POLICY "Public read access for grades" ON grades
    FOR SELECT USING (true);

CREATE POLICY "Public insert for grades" ON grades
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update for grades" ON grades
    FOR UPDATE USING (true);

-- ============================================================
-- 6. 함수 및 트리거
-- ============================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- users 테이블에 트리거 적용
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 만료된 세션 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    UPDATE sessions SET is_active = FALSE WHERE expires_at < NOW() AND is_active = TRUE;
END;
$$ language 'plpgsql';

-- ============================================================
-- 7. 뷰 (View) 생성
-- ============================================================

-- 후보자 목록 뷰 (채점 현황 포함)
CREATE OR REPLACE VIEW candidate_summary AS
SELECT
    u.id,
    u.name,
    u.created_at,
    COALESCE(sub.submitted_count, 0) as submitted_count,
    COALESCE(g.graded_count, 0) as graded_count,
    g.average_score
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as submitted_count
    FROM submissions
    WHERE is_submitted = TRUE
    GROUP BY user_id
) sub ON u.id = sub.user_id
LEFT JOIN (
    SELECT user_id,
           COUNT(*) as graded_count,
           ROUND(AVG(score)::numeric, 1) as average_score
    FROM grades
    GROUP BY user_id
) g ON u.id = g.user_id
WHERE u.role = 'candidate';

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE 'TBS 테스트 웹앱 데이터베이스 스키마가 성공적으로 생성되었습니다!';
END $$;
