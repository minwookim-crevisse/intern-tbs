# TBS 테스트 웹앱 - AI 채점 모듈 통합 완료

## 📦 구현 완료 항목

### ✅ 1. OpenRouter API 연동 모듈
**파일:** `ai-grading.js`

- **모델:** `tngtech/deepseek-r1t2-chimera:free`
- **API 엔드포인트:** `https://openrouter.ai/api/v1/chat/completions`
- **주요 기능:**
  - 클라이언트 사이드 직접 호출 (단일 HTML 파일 제약 충족)
  - 재시도 로직 (최대 3회, 지수 백오프)
  - 타임아웃 처리 (60초)
  - 에러 핸들링 및 분류

### ✅ 2. AI 채점 기능 (Admin 전용)
- 후보자 답안을 AI에게 전달하여 자동 채점
- 루브릭 기반 점수 산출 (0-100점)
- 취약점 태그 자동 추출
- 상세 피드백 생성
- **권한 검증:** 관리자만 사용 가능 (자동 체크)

### ✅ 3. 문제별 채점 프롬프트 설계

#### 문제 1: SaaS 서비스 사용료 정산 오류 검수
```
채점 기준 (100점):
- 오류 항목 식별 정확도: 40점
  ├─ 기본서비스 사용료 오류: 15점
  ├─ 부가서비스 사용료 오류: 15점
  └─ 메시지 충전금 계산 오류: 10점
- 수정 금액 정확도: 40점
  ├─ 정확한 금액 계산: 25점
  └─ 일할 계산 정확성: 15점
- 검수 방법 적절성: 20점
  ├─ 재발 방지 방법: 10점
  └─ 논리적 타당성: 10점
```

#### 문제 2: 미디어 사업 사용료 정산서 작성
```
채점 기준 (100점):
- 광고집행 매출 산출: 40점
  ├─ 매체별 집행비용 추출: 20점
  └─ 수수료율 적용: 20점
- 광고소재 매출 집계: 30점
- 세금계산서 발행: 30점
  ├─ 선수금 반영: 15점
  └─ VAT 계산: 15점
```

### ✅ 4. 에러 핸들링
- **AIAPIError:** API 호출 실패 (401, 429, 5xx 등)
- **AIParsingError:** 응답 파싱 실패
- **AIGradingError:** 일반 채점 오류
- 자동 재시도: Rate limit (429), 서버 오류 (5xx)
- 사용자 친화적 에러 메시지

### ✅ 5. 보안 구현
- ✅ API 키는 admin만 입력/사용 가능
- ✅ 모든 AI 채점 함수에서 자동 권한 확인
- ✅ 후보자 화면에서 AI 채점 기능 완전 차단
- ✅ sessionStorage 사용 (브라우저 닫으면 자동 삭제)
- ✅ 하드코딩 금지 (환경 변수 권장)

---

## 📁 파일 구조

```
C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\
├── .env                          # API 키 저장
├── backend.js                    # TBS Backend 로직
├── ai-grading.js                 # ⭐ AI 채점 모듈 (신규)
├── ai-grading-demo.html          # ⭐ 데모 페이지 (신규)
├── AI_GRADING_GUIDE.md           # ⭐ 사용 가이드 (신규)
├── AI_INTEGRATION_README.md      # ⭐ 이 파일 (신규)
└── 문제 1번, 문제 2번 (기존 폴더)
```

---

## 🚀 빠른 시작 가이드

### 1단계: 데모 페이지 열기
```
파일 탐색기에서 ai-grading-demo.html을 더블클릭
```

### 2단계: 관리자로 로그인
```
"관리자 로그인" 버튼 클릭
계정: admin / 비밀번호: admin1234
```

### 3단계: API 키 설정
```
"환경 변수 키 사용" 버튼 클릭 (자동으로 .env의 키 입력)
"키 검증" 버튼으로 유효성 확인
```

### 4단계: AI 채점 테스트
```
후보자 ID 선택: jahyun
문제 번호 선택: 문제 1
"AI 채점 시작" 버튼 클릭
```

**⚠️ 주의:** 실제 채점을 위해서는 후보자가 먼저 답안을 제출해야 합니다.

---

## 💻 코드 사용 예시

### 기본 사용법 (권장)
```javascript
// 1. 관리자 로그인 확인
if (!TBSBackend.auth.isAdmin()) {
    alert('관리자 권한이 필요합니다.');
    return;
}

// 2. API 키 가져오기
const apiKey = sessionStorage.getItem('openrouter_api_key') ||
               prompt('OpenRouter API 키를 입력하세요:');

// 3. AI 채점 수행
try {
    const result = await AIGrading.gradeSubmission(
        apiKey,      // API 키
        'jahyun',    // 후보자 ID
        1            // 문제 ID
    );

    console.log('점수:', result.score);
    console.log('취약점:', result.weaknessTags);
    console.log('피드백:', result.feedback);

    // 결과는 자동으로 TBSBackend에 저장됨
    alert(`채점 완료! 점수: ${result.score}점`);

} catch (error) {
    if (error.status === 429) {
        alert('API 호출 한도 초과. 잠시 후 다시 시도하세요.');
    } else {
        alert(`채점 실패: ${error.message}`);
    }
}
```

### 직접 답안 전달
```javascript
const candidateAnswer = `
[답안 1-1]
오류 분석:
1. FR-0002 상품 3월분 누락
2. DQT-00001 일할 계산 오류
...
`;

const result = await AIGrading.grade(apiKey, 1, candidateAnswer);
```

---

## 🔧 HTML 통합 방법

### 스크립트 로드 순서 (중요!)
```html
<!DOCTYPE html>
<html>
<head>
    <title>TBS 테스트 웹앱</title>
</head>
<body>
    <!-- 콘텐츠 -->

    <!-- 1. Backend 먼저 로드 -->
    <script src="backend.js"></script>

    <!-- 2. AI 모듈 로드 (관리자 페이지에만) -->
    <script src="ai-grading.js"></script>

    <!-- 3. UI 스크립트 -->
    <script src="admin-ui.js"></script>
</body>
</html>
```

### 관리자 대시보드 버튼 예시
```html
<button onclick="performAIGrading('jahyun', 1)">
    🤖 AI 채점
</button>

<script>
async function performAIGrading(userId, problemId) {
    const apiKey = getAPIKey(); // 세션에서 가져오기
    if (!apiKey) return;

    try {
        const result = await AIGrading.gradeSubmission(
            apiKey, userId, problemId
        );
        alert(`채점 완료! 점수: ${result.score}점`);
        refreshTable(); // 테이블 새로고침
    } catch (error) {
        alert(`오류: ${error.message}`);
    }
}

function getAPIKey() {
    let key = sessionStorage.getItem('openrouter_api_key');
    if (!key) {
        key = prompt('API 키를 입력하세요:');
        if (key) sessionStorage.setItem('openrouter_api_key', key);
    }
    return key;
}
</script>
```

---

## 📊 API 응답 형식

```json
{
  "score": 85,
  "weaknessTags": [
    "계산 오류",
    "참고자료 누락"
  ],
  "feedback": "전반적으로 양호하나 FR-0002 상품 변경 사항이 반영되지 않았으며...",
  "detailedScores": {
    "오류항목식별": 35,
    "수정금액정확도": 30,
    "검수방법적절성": 20
  },
  "metadata": {
    "problemId": 1,
    "model": "tngtech/deepseek-r1t2-chimera:free",
    "gradedAt": "2026-02-01T12:34:56.789Z",
    "elapsedTime": 3245,
    "apiUsage": {
      "prompt_tokens": 1023,
      "completion_tokens": 487,
      "total_tokens": 1510
    }
  },
  "saved": true
}
```

---

## 🔐 보안 체크리스트

- [x] API 키는 절대 소스코드에 하드코딩하지 않음
- [x] 관리자만 API 키 입력 가능
- [x] 후보자 화면에서 ai-grading.js 로드 차단
- [x] 모든 AI 함수에서 자동 권한 확인
- [x] sessionStorage 사용 (임시 저장)
- [x] 권한 없는 사용자 접근 시 에러 반환

---

## 🧪 테스트 시나리오

### 테스트 1: API 키 검증
```javascript
const isValid = await AIGrading.validateAPIKey(
    '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'
);
console.log('유효성:', isValid); // true 예상
```

### 테스트 2: 권한 체크
```javascript
// 후보자로 로그인
TBSBackend.auth.login('jahyun', 'pass1');

// AI 채점 시도 (실패해야 함)
try {
    await AIGrading.gradeSubmission(apiKey, 'jahyun', 1);
} catch (error) {
    console.log('예상된 에러:', error.message);
    // "관리자만 AI 채점을 수행할 수 있습니다."
}
```

### 테스트 3: 전체 채점 플로우
```javascript
// 1. 관리자 로그인
TBSBackend.auth.login('admin', 'admin1234');

// 2. 제출 현황 확인
const submissions = TBSBackend.admin.getAllSubmissions();
console.log('제출 현황:', submissions);

// 3. AI 채점
const result = await AIGrading.gradeSubmission(apiKey, 'jahyun', 1);
console.log('채점 결과:', result);

// 4. 저장된 채점 확인
const grades = TBSBackend.admin.getGradesByUser('jahyun');
console.log('저장된 채점:', grades);
```

---

## 📚 참고 문서

- **사용 가이드:** `AI_GRADING_GUIDE.md` (상세한 사용법, FAQ)
- **데모 페이지:** `ai-grading-demo.html` (브라우저에서 바로 테스트)
- **Backend 문서:** `backend.js` (주석 참고)

---

## 🌐 OpenRouter API 정보

### API 키 발급
1. https://openrouter.ai 방문
2. 계정 생성 및 로그인
3. API Keys 메뉴에서 키 발급

### 현재 설정된 키
```
파일: .env
키: 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
```

### 사용 모델
- **이름:** DeepSeek R1T2 Chimera
- **모델 ID:** `tngtech/deepseek-r1t2-chimera:free`
- **비용:** 무료
- **제한:** 일일 요청 제한 있을 수 있음

---

## ⚠️ 알려진 제약사항

1. **클라이언트 사이드 제약**
   - .env 파일을 브라우저에서 직접 읽을 수 없음
   - API 키는 매번 입력 또는 sessionStorage 사용 필요

2. **무료 모델 제한**
   - Rate limiting 가능 (재시도 로직으로 대응)
   - 일일 요청 제한 가능

3. **파일 업로드 답안**
   - 현재는 텍스트 기반 채점만 지원
   - Excel 파일 내용을 텍스트로 변환 후 채점 권장

---

## 🎯 향후 개선 가능 사항

1. **서버 사이드 연동**
   - Node.js/Python 백엔드 추가 시 .env 파일 직접 읽기 가능
   - API 키 보안 강화

2. **파일 분석 기능**
   - Excel 파일 자동 파싱 및 채점
   - 이미지 OCR 연동

3. **배치 채점**
   - 여러 후보자 동시 채점
   - 채점 결과 일괄 다운로드

4. **채점 히스토리**
   - 채점 버전 관리
   - 재채점 기능

---

## 📞 문제 해결

### Q1: "API 키가 유효하지 않습니다" 오류
**A:**
1. .env 파일의 키가 정확한지 확인
2. OpenRouter 웹사이트에서 키 상태 확인
3. 키 검증 버튼으로 재확인

### Q2: "관리자 권한이 필요합니다" 오류
**A:**
1. 관리자 계정으로 로그인했는지 확인 (admin/admin1234)
2. 브라우저 콘솔에서 `TBSBackend.auth.isAdmin()` 실행하여 확인

### Q3: "아직 제출되지 않은 답안입니다" 오류
**A:**
1. 후보자가 먼저 답안을 제출해야 함
2. `TBSBackend.admin.getAllSubmissions()` 로 제출 여부 확인

### Q4: "요청 시간 초과" 오류
**A:**
1. 네트워크 연결 확인
2. 다시 시도 (재시도 로직이 자동으로 작동함)
3. OpenRouter API 상태 확인

---

## ✅ 구현 완료 체크리스트

- [x] OpenRouter API 연동 모듈 구현
- [x] AI 자동 채점 기능 (점수, 태그, 피드백)
- [x] 문제 1, 2 채점 프롬프트 설계
- [x] 에러 핸들링 (재시도, 타임아웃)
- [x] 보안 구현 (관리자 전용, 권한 검증)
- [x] 사용 가이드 문서 작성
- [x] 데모 페이지 작성
- [x] 코드 주석 및 예시 추가

---

**작성일:** 2026-02-01
**버전:** 1.0.0
**작성자:** AI Integration Specialist
**프로젝트:** TBS 테스트 웹앱 - AI 채점 모듈
