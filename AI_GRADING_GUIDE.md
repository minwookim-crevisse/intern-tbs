# AI 채점 모듈 사용 가이드

## 📋 개요

TBS 테스트 웹앱에 OpenRouter API (DeepSeek R1T2 Chimera 모델)를 연동하여 자동 채점 기능을 제공합니다.

**파일 위치:** `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\ai-grading.js`

---

## 🔧 설치 및 설정

### 1. HTML에 스크립트 추가

기존 `index.html` 또는 관리자 페이지에 다음 스크립트를 추가하세요:

```html
<!DOCTYPE html>
<html>
<head>
    <title>TBS 테스트 웹앱</title>
</head>
<body>
    <!-- 기존 콘텐츠 -->

    <!-- 순서 중요: backend.js를 먼저 로드 -->
    <script src="backend.js"></script>

    <!-- AI 채점 모듈 로드 -->
    <script src="ai-grading.js"></script>

    <!-- 관리자 UI 스크립트 -->
    <script src="admin-ui.js"></script>
</body>
</html>
```

### 2. API 키 설정 확인

`.env` 파일에 이미 API 키가 설정되어 있습니다:

```
OPENROUTER_API_KEY=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
```

**⚠️ 보안 주의사항:**
- 클라이언트 사이드에서는 `.env` 파일을 직접 읽을 수 없습니다
- 관리자가 매번 API 키를 입력하거나, sessionStorage에 임시 저장하는 방식을 권장합니다
- 절대 소스코드에 API 키를 하드코딩하지 마세요

---

## 🎯 주요 기능

### 1. AI 자동 채점

후보자의 제출 답안을 AI에게 전달하여 자동으로 채점합니다.

**채점 항목:**
- **점수 (score):** 0-100점
- **취약점 태그 (weaknessTags):** 오류 유형 분류
- **피드백 (feedback):** 상세 평가 의견
- **세부 점수 (detailedScores):** 평가 항목별 점수

### 2. 문제별 채점 기준

#### 문제 1: SaaS 서비스 사용료 정산 오류 검수
```
총 100점
├─ 오류 항목 식별 정확도: 40점
│  ├─ 기본서비스 사용료 오류: 15점
│  ├─ 부가서비스 사용료 오류: 15점
│  └─ 메시지 충전금 계산 오류: 10점
├─ 수정 금액 정확도: 40점
│  ├─ 정확한 금액 계산: 25점
│  └─ 일할 계산 정확성: 15점
└─ 검수 방법 적절성: 20점
   ├─ 재발 방지 방법: 10점
   └─ 논리적 타당성: 10점
```

**취약점 태그 예시:**
- "계산 오류"
- "규칙 미적용"
- "데이터 누락"
- "일할 계산 오류"
- "메시지 충전금 오류"
- "검수방법 부족"

#### 문제 2: 미디어 사업 사용료 정산서 작성
```
총 100점
├─ 광고집행 매출 산출: 40점
│  ├─ 매체별 집행비용 추출: 20점
│  └─ 수수료율 적용: 20점
├─ 광고소재 매출 집계: 30점
└─ 세금계산서 발행: 30점
   ├─ 선수금 반영: 15점
   └─ VAT 계산: 15점
```

**취약점 태그 예시:**
- "수수료율 오류"
- "매체 누락"
- "선수금 미반영"
- "VAT 계산 오류"
- "광고소재 누락"

---

## 💻 사용 방법

### 기본 사용법 (권장)

```javascript
// 1. 관리자 권한 확인
if (!TBSBackend.auth.isAdmin()) {
    alert('관리자만 접근 가능합니다.');
    return;
}

// 2. API 키 입력 받기
const apiKey = prompt('OpenRouter API 키를 입력하세요:');
if (!apiKey) return;

// 3. API 키 검증 (선택사항)
const isValid = await AIGrading.validateAPIKey(apiKey);
if (!isValid) {
    alert('유효하지 않은 API 키입니다.');
    return;
}

// 4. AI 채점 수행
try {
    const result = await AIGrading.gradeSubmission(
        apiKey,      // OpenRouter API 키
        'jahyun',    // 후보자 ID
        1            // 문제 ID (1 또는 2)
    );

    console.log('채점 완료!');
    console.log('점수:', result.score);
    console.log('취약점:', result.weaknessTags);
    console.log('피드백:', result.feedback);

    // 결과는 자동으로 TBSBackend에 저장됨

} catch (error) {
    console.error('채점 실패:', error.message);
}
```

### 고급 사용법 (직접 답안 전달)

```javascript
// 후보자 답안 텍스트를 직접 준비
const candidateAnswer = `
[답안 1-1]
오류 분석:
1. 기본서비스 사용료: FR-0002 상품 3월분 누락
2. 확장서비스: DQT-00001 일할 계산 오류 (17일분)
3. 메시지 충전금: 전월 잔액 미반영

수정 내역:
- FR-0002: +50,000원
- DQT-00001: 18,445원 → 18,445원 (정확함)
...
`;

try {
    const result = await AIGrading.grade(
        apiKey,
        1,  // 문제 ID
        candidateAnswer,
        {
            temperature: 0.3,  // 선택사항: 낮을수록 일관성 높음 (0.0~1.0)
            maxTokens: 2048    // 선택사항: 최대 응답 길이
        }
    );

    // 결과는 자동 저장되지 않으므로 수동 저장 필요
    TBSBackend.admin.saveGrade(
        'jahyun',
        1,
        result.score,
        result.weaknessTags,
        result.feedback
    );

} catch (error) {
    console.error('채점 실패:', error);
}
```

---

## 🖥️ 관리자 UI 통합 예시

### HTML 버튼 추가

```html
<!-- 관리자 대시보드 -->
<div class="admin-panel">
    <h2>후보자 채점</h2>

    <div class="candidate-row">
        <span>홍자현 (jahyun)</span>
        <span>문제 1</span>
        <button onclick="performAIGrading('jahyun', 1)">
            🤖 AI 채점
        </button>
    </div>

    <div id="grading-result"></div>
</div>
```

### JavaScript 함수 구현

```javascript
// API 키 관리 (sessionStorage 사용)
function getAPIKey() {
    let apiKey = sessionStorage.getItem('openrouter_api_key');

    if (!apiKey) {
        apiKey = prompt('OpenRouter API 키를 입력하세요:\n(이 세션 동안 저장됩니다)');
        if (!apiKey) return null;

        sessionStorage.setItem('openrouter_api_key', apiKey);
    }

    return apiKey;
}

// AI 채점 수행
async function performAIGrading(userId, problemId) {
    // 1. 권한 확인
    if (!TBSBackend.auth.isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }

    // 2. API 키 가져오기
    const apiKey = getAPIKey();
    if (!apiKey) return;

    // 3. 로딩 UI
    const resultDiv = document.getElementById('grading-result');
    resultDiv.innerHTML = '<p>⏳ AI 채점 중... (최대 60초 소요)</p>';

    try {
        // 4. AI 채점 수행
        const result = await AIGrading.gradeSubmission(apiKey, userId, problemId);

        // 5. 결과 표시
        resultDiv.innerHTML = `
            <div class="grading-success">
                <h3>✅ 채점 완료</h3>
                <p><strong>점수:</strong> ${result.score}점</p>
                <p><strong>취약점:</strong> ${result.weaknessTags.join(', ')}</p>
                <p><strong>피드백:</strong> ${result.feedback}</p>
                <p><small>소요 시간: ${result.metadata.elapsedTime}ms</small></p>
            </div>
        `;

        // 6. 채점 테이블 갱신
        refreshGradingTable();

    } catch (error) {
        handleAIGradingError(error, resultDiv);
    }
}

// 에러 처리
function handleAIGradingError(error, resultDiv) {
    let errorMessage = '채점 중 오류가 발생했습니다.';

    if (error instanceof AIGrading.errors.AIAPIError) {
        if (error.status === 401) {
            errorMessage = 'API 키가 유효하지 않습니다. 다시 입력해주세요.';
            sessionStorage.removeItem('openrouter_api_key');
        } else if (error.status === 429) {
            errorMessage = 'API 호출 한도를 초과했습니다. 1분 후 다시 시도해주세요.';
        } else if (error.status === 408) {
            errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        } else {
            errorMessage = `API 오류: ${error.message}`;
        }
    } else if (error instanceof AIGrading.errors.AIParsingError) {
        errorMessage = 'AI 응답을 해석하는 데 실패했습니다.';
        console.error('원본 응답:', error.rawResponse);
    } else {
        errorMessage = error.message;
    }

    resultDiv.innerHTML = `
        <div class="grading-error">
            <h3>❌ 채점 실패</h3>
            <p>${errorMessage}</p>
        </div>
    `;

    console.error('[AI Grading Error]', error);
}

// 채점 테이블 갱신
function refreshGradingTable() {
    // 후보자별 채점 현황 테이블 다시 렌더링
    const candidates = TBSBackend.admin.getCandidateList();
    // ... 테이블 업데이트 로직
}
```

---

## 🔐 보안 가이드

### ✅ 권장 사항

1. **API 키 입력 방식**
   ```javascript
   // sessionStorage 사용 (브라우저 닫으면 삭제됨)
   sessionStorage.setItem('openrouter_api_key', apiKey);
   ```

2. **권한 검증**
   ```javascript
   // 모든 AI 채점 함수에서 자동으로 권한 확인
   if (!TBSBackend.auth.isAdmin()) {
       throw new Error('관리자만 사용 가능');
   }
   ```

3. **후보자 화면 차단**
   ```javascript
   // 후보자 화면에서는 ai-grading.js를 로드하지 않음
   // 또는 UI에서 버튼 자체를 렌더링하지 않음

   if (TBSBackend.auth.isCandidate()) {
       // AI 채점 UI 완전 숨김
       document.getElementById('ai-grading-section').style.display = 'none';
   }
   ```

### ❌ 절대 금지

```javascript
// ❌ 하드코딩 금지
const apiKey = 'sk-or-v1-73cae755...'; // 절대 안됨!

// ❌ localStorage 사용 금지 (영구 저장)
localStorage.setItem('api_key', apiKey); // 위험!

// ❌ 후보자에게 노출 금지
// 후보자 화면에서는 ai-grading.js 자체를 로드하지 말 것
```

---

## 🧪 테스트 방법

### 1. API 키 검증 테스트

```javascript
// 브라우저 콘솔에서 실행
const testKey = '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';
const isValid = await AIGrading.validateAPIKey(testKey);
console.log('API 키 유효:', isValid);
```

### 2. 간단한 채점 테스트

```javascript
// 테스트 답안
const testAnswer = `
[답안 1-1]
오류 분석:
1. FR-0002 상품이 3월분 정산서에 누락되었습니다.
2. 일할 계산이 잘못되었습니다.

[답안 1-2]
엑셀 파일 첨부됨
`;

const result = await AIGrading.grade(
    testKey,
    1,
    testAnswer
);

console.log('채점 결과:', result);
```

### 3. 전체 통합 테스트

```javascript
// 1. 관리자 로그인
TBSBackend.auth.login('admin', 'admin1234');

// 2. 후보자 jahyun의 문제 1 제출 확인
const submissions = TBSBackend.admin.getSubmissionsByUser('jahyun');
console.log('제출 내역:', submissions);

// 3. AI 채점 수행
const result = await AIGrading.gradeSubmission(testKey, 'jahyun', 1);
console.log('채점 완료:', result);

// 4. 저장된 채점 결과 확인
const grades = TBSBackend.admin.getGradesByUser('jahyun');
console.log('채점 결과:', grades);
```

---

## 📊 API 사용량 및 비용

### 모델 정보
- **모델명:** `tngtech/deepseek-r1t2-chimera:free`
- **제공자:** OpenRouter
- **비용:** 무료 (Free tier)

### 예상 토큰 사용량 (문제당)
- **입력 토큰:** ~1,000 tokens (프롬프트 + 답안)
- **출력 토큰:** ~500 tokens (채점 결과)

### 무료 모델 제한사항
- 일일 요청 제한이 있을 수 있음
- Rate limiting 발생 시 재시도 로직 작동 (최대 3회, 지수 백오프)

---

## 🐛 오류 처리

### 에러 타입

#### 1. AIAPIError - API 호출 실패
```javascript
try {
    await AIGrading.gradeSubmission(apiKey, userId, problemId);
} catch (error) {
    if (error instanceof AIGrading.errors.AIAPIError) {
        switch (error.status) {
            case 401:
                alert('API 키가 유효하지 않습니다.');
                break;
            case 429:
                alert('API 호출 한도 초과. 잠시 후 재시도하세요.');
                break;
            case 408:
                alert('요청 시간 초과 (60초). 다시 시도하세요.');
                break;
            default:
                alert(`API 오류: ${error.message}`);
        }
    }
}
```

#### 2. AIParsingError - 응답 파싱 실패
```javascript
catch (error) {
    if (error instanceof AIGrading.errors.AIParsingError) {
        console.error('파싱 실패:', error.message);
        console.error('원본 응답:', error.rawResponse);
    }
}
```

#### 3. AIGradingError - 일반 채점 오류
```javascript
catch (error) {
    if (error instanceof AIGrading.errors.AIGradingError) {
        alert(`채점 오류: ${error.message}`);
    }
}
```

### 자동 재시도 로직

API 호출 실패 시 자동으로 재시도합니다:
- **최대 재시도:** 3회
- **초기 지연:** 2초
- **지수 백오프:** 2배씩 증가 (2초 → 4초 → 8초)
- **재시도 대상:** 429 (Rate Limit), 5xx (서버 오류)

---

## 📝 응답 형식

### 성공 응답 예시

```json
{
  "score": 85,
  "weaknessTags": [
    "계산 오류",
    "참고자료 누락"
  ],
  "feedback": "전반적으로 양호하나 FR-0002 상품 변경 사항이 반영되지 않았으며, 메시지 충전금 계산에 오류가 있습니다. 일할 계산은 정확합니다.",
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

## 🔍 디버깅

### 프롬프트 확인

```javascript
// 문제 1의 채점 프롬프트 확인
const prompt = AIGrading.getPrompt(1);
console.log('시스템 프롬프트:', prompt.systemPrompt);
console.log('사용자 프롬프트 템플릿:', prompt.userPromptTemplate);
```

### 콘솔 로그 활성화

AI 채점 모듈은 자동으로 다음 정보를 콘솔에 출력합니다:
- API 호출 시도 횟수
- API 응답 수신 완료 시간
- AI 응답 내용 (첫 200자)
- 채점 완료 로그

```
[AI Grading] API 호출 시도 1/3
[AI Grading] API 응답 수신 완료 (3245ms)
[AI Grading] AI 응답: {"score":85,"weaknessTags":["계산 오류"]...
[AI Grading] 채점 완료 - jahyun / 문제1 / 점수: 85점
```

---

## 📚 API 레퍼런스

### AIGrading 객체

```javascript
AIGrading = {
    // 설정
    config: {
        API_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
        MODEL: 'tngtech/deepseek-r1t2-chimera:free',
        DEFAULT_TEMPERATURE: 0.3,
        DEFAULT_MAX_TOKENS: 2048,
        REQUEST_TIMEOUT: 60000,
        MAX_RETRIES: 3
    },

    // 메소드
    grade(apiKey, problemId, candidateAnswer, options),
    gradeSubmission(apiKey, userId, problemId),
    prepareAnswer(submission),
    validateAPIKey(apiKey),
    getPrompt(problemId),

    // 에러 클래스
    errors: {
        AIGradingError,
        AIAPIError,
        AIParsingError
    },

    // 취약점 태그
    commonWeaknessTags: {
        1: [...],
        2: [...]
    }
}
```

---

## ❓ FAQ

### Q1. API 키를 어디서 얻나요?
**A:** OpenRouter 웹사이트 (https://openrouter.ai)에서 계정 생성 후 API 키를 발급받을 수 있습니다. 현재 `.env` 파일에 이미 키가 설정되어 있습니다.

### Q2. 무료 모델인데 제한이 있나요?
**A:** 네, 무료 모델은 일일 요청 수나 토큰 사용량에 제한이 있을 수 있습니다. Rate limit 발생 시 자동으로 재시도합니다.

### Q3. 채점 시간이 얼마나 걸리나요?
**A:** 평균 3-5초, 최대 60초입니다. 네트워크 상태와 API 서버 상태에 따라 달라질 수 있습니다.

### Q4. 후보자가 AI 채점 기능을 사용할 수 있나요?
**A:** 아니요. `AIGrading.gradeSubmission()` 함수는 내부적으로 관리자 권한을 확인하며, 관리자가 아니면 오류를 반환합니다.

### Q5. 채점 결과를 수동으로 수정할 수 있나요?
**A:** 네, AI 채점 후에도 `TBSBackend.admin.saveGrade()`를 사용하여 점수나 피드백을 수정할 수 있습니다.

### Q6. 파일 업로드 답안도 채점 가능한가요?
**A:** 현재 버전은 텍스트 기반 채점만 지원합니다. 파일 내용을 텍스트로 변환한 후 `candidateAnswer`로 전달하면 채점 가능합니다.

---

## 📞 지원

문제 발생 시:
1. 브라우저 개발자 콘솔 확인 (`F12`)
2. `[AI Grading]` 로그 메시지 확인
3. 에러 객체의 `status`와 `message` 확인

---

**작성일:** 2026-02-01
**버전:** 1.0.0
**작성자:** AI Integration Specialist
