# Supabase 연동 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 프로젝트 설정
1. [https://supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - **Name**: `tbs-test-webapp`
   - **Database Password**: 안전한 비밀번호 설정 (저장해 두세요)
   - **Region**: `Northeast Asia (Seoul)` 선택
6. "Create new project" 클릭

### 1.2 API 키 확인
1. 프로젝트 대시보드에서 좌측 메뉴 "Settings" → "API" 클릭
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 1.3 환경 변수 설정
`.env` 파일에 다음 추가:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

---

## 2. 데이터베이스 테이블 생성

Supabase 대시보드에서 "SQL Editor" → "New Query"로 이동 후 아래 SQL 실행:

### 2.1 users 테이블 (사용자 계정)
```sql
-- users 테이블 생성
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
```

### 2.2 submissions 테이블 (답안 제출)
```sql
-- submissions 테이블 생성
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    problem_id INTEGER NOT NULL,
    answers JSONB DEFAULT '{}',
    is_submitted BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, problem_id)
);

-- 인덱스 생성
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_problem_id ON submissions(problem_id);
CREATE INDEX idx_submissions_is_submitted ON submissions(is_submitted);
```

### 2.3 grades 테이블 (채점 결과)
```sql
-- grades 테이블 생성
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    problem_id INTEGER NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    weakness_tags TEXT[] DEFAULT '{}',
    feedback TEXT,
    detailed_scores JSONB,
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_by TEXT REFERENCES users(id),
    UNIQUE(user_id, problem_id)
);

-- 인덱스 생성
CREATE INDEX idx_grades_user_id ON grades(user_id);
CREATE INDEX idx_grades_problem_id ON grades(problem_id);
```

### 2.4 sessions 테이블 (로그인 세션)
```sql
-- sessions 테이블 생성
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id),
    login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스 생성
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_is_active ON sessions(is_active);
```

---

## 3. Row Level Security (RLS) 설정

보안을 위한 RLS 정책 설정:

```sql
-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- users 테이블 정책: 로그인 시 모든 사용자 조회 가능 (비밀번호 검증용)
CREATE POLICY "Anyone can read users for login" ON users
    FOR SELECT USING (true);

-- submissions 테이블 정책
CREATE POLICY "Users can read own submissions" ON submissions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own submissions" ON submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own submissions" ON submissions
    FOR UPDATE USING (true);

-- grades 테이블 정책
CREATE POLICY "Anyone can read grades" ON grades
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert grades" ON grades
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update grades" ON grades
    FOR UPDATE USING (true);

-- sessions 테이블 정책
CREATE POLICY "Anyone can manage sessions" ON sessions
    FOR ALL USING (true);
```

---

## 4. 전체 SQL 스크립트 (한번에 실행)

`supabase-schema.sql` 파일을 SQL Editor에서 실행하세요.

---

## 5. 연동 확인

1. `.env` 파일에 Supabase URL과 anon key 추가
2. 브라우저에서 `index_pdf.html` 열기
3. 개발자 도구 콘솔에서 `Supabase connected` 메시지 확인
4. 로그인 테스트 (jahyun / pass1)

---

## 문제 해결

### "relation does not exist" 오류
- 테이블이 생성되지 않았습니다. SQL 스크립트를 다시 실행하세요.

### "permission denied" 오류
- RLS 정책이 설정되지 않았습니다. RLS 스크립트를 실행하세요.

### 연결 실패
- SUPABASE_URL과 SUPABASE_ANON_KEY가 올바른지 확인하세요.
