/**
 * TBS 테스트 웹앱 - AI 채점 모듈
 *
 * OpenRouter API (tngtech/deepseek-r1t2-chimera:free) 연동
 * 관리자 전용 AI 채점 기능
 *
 * 주요 기능:
 * - 후보자 답안을 AI에게 전달하여 자동 채점
 * - 루브릭 기반 점수 산출 (0-100점)
 * - 취약점 태그 추출
 * - 상세 피드백 생성
 */

// ============================================================
// 1. 상수 및 설정
// ============================================================

const AI_GRADING_CONFIG = {
    API_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
    MODEL: 'tngtech/deepseek-r1t2-chimera:free',
    DEFAULT_TEMPERATURE: 0.3, // 채점은 일관성이 중요하므로 낮은 온도 사용
    DEFAULT_MAX_TOKENS: 2048,
    REQUEST_TIMEOUT: 60000, // 60초
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2초
    BACKOFF_MULTIPLIER: 2
};

/**
 * 문제별 채점 프롬프트 템플릿
 */
const GRADING_PROMPTS = {
    1: {
        systemPrompt: `당신은 사업지원 업무의 전문 채점자입니다.
SaaS 서비스 사용료 정산 업무에 대한 후보자의 답안을 평가합니다.

**채점 기준 (총 100점):**

1. 오류 항목 식별 정확도 (40점)
   - 기본서비스 사용료 오류 식별: 15점
   - 부가서비스 사용료 오류 식별: 15점
   - 메시지 충전금 계산 오류 식별: 10점

2. 수정 금액 정확도 (40점)
   - 정확한 금액 계산: 25점
   - 일할 계산 정확성: 15점

3. 검수 방법 적절성 (20점)
   - 재발 방지를 위한 검수 방법 제시: 10점
   - 논리적 타당성: 10점

**평가 시 주의사항:**
- 실제 업무에서 사용 가능한 수준인지 평가
- 계산 과정의 논리성 확인
- 부분 점수 적극 활용`,

        userPromptTemplate: (candidateAnswer) => `
**후보자 답안:**

${candidateAnswer}

---

**요구사항:**
위 후보자의 답안을 채점 기준에 따라 평가하고, 다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "score": 85,
  "weaknessTags": ["계산 오류", "참고자료 누락"],
  "feedback": "전반적으로 양호하나 일부 개선이 필요합니다...",
  "detailedScores": {
    "오류항목식별": 35,
    "수정금액정확도": 30,
    "검수방법적절성": 20
  }
}
\`\`\`

**응답 형식 주의:**
- score: 0-100 사이의 정수
- weaknessTags: 취약점을 나타내는 태그 배열 (예: "계산 오류", "규칙 미적용", "데이터 누락", "검수방법 부족")
- feedback: 200자 이내의 간결한 피드백
- detailedScores: 각 평가 항목별 점수
`
    },

    2: {
        systemPrompt: `당신은 미디어 사업 정산 업무의 전문 채점자입니다.
광고집행 매출 정산에 대한 후보자의 답안을 평가합니다.

**채점 기준 (총 100점):**

1. 광고집행 매출 산출 정확도 (40점)
   - 매체별 집행비용 추출 정확성: 20점
   - 수수료율 적용 정확성: 20점

2. 광고소재 매출 집계 정확도 (30점)
   - 광고소재 A, B 매출 반영: 30점

3. 세금계산서 발행 금액 (30점)
   - 선수금 반영 정확성: 15점
   - VAT 계산 정확성: 15점

**평가 시 주의사항:**
- 실무에서 통용되는 정산 방식인지 확인
- 수수료율 적용 오류 체크
- 선수금 처리 로직 검증
- 부분 점수 적극 활용`,

        userPromptTemplate: (candidateAnswer) => `
**후보자 답안:**

${candidateAnswer}

---

**요구사항:**
위 후보자의 답안을 채점 기준에 따라 평가하고, 다음 JSON 형식으로 응답해주세요:

\`\`\`json
{
  "score": 85,
  "weaknessTags": ["수수료율 오류", "선수금 미반영"],
  "feedback": "광고소재 매출은 정확하나 선수금 처리에 오류가 있습니다...",
  "detailedScores": {
    "광고집행매출산출": 35,
    "광고소재매출집계": 30,
    "세금계산서발행금액": 20
  }
}
\`\`\`

**응답 형식 주의:**
- score: 0-100 사이의 정수
- weaknessTags: 취약점을 나타내는 태그 배열 (예: "수수료율 오류", "매체 누락", "선수금 미반영", "VAT 계산 오류")
- feedback: 200자 이내의 간결한 피드백
- detailedScores: 각 평가 항목별 점수
`
    }
};

/**
 * 공통 취약점 태그 정의 (참고용)
 */
const COMMON_WEAKNESS_TAGS = {
    1: [
        "계산 오류",
        "규칙 미적용",
        "데이터 누락",
        "일할 계산 오류",
        "메시지 충전금 오류",
        "검수방법 부족",
        "상품 변경 미반영",
        "참고자료 누락"
    ],
    2: [
        "수수료율 오류",
        "매체 누락",
        "선수금 미반영",
        "VAT 계산 오류",
        "광고소재 누락",
        "집행비용 추출 오류",
        "데이터 집계 오류"
    ]
};


// ============================================================
// 2. API 호출 유틸리티
// ============================================================

/**
 * OpenRouter API 호출 (재시도 로직 포함)
 * @param {string} apiKey - OpenRouter API 키
 * @param {Array} messages - 메시지 배열 [{role, content}]
 * @param {object} options - 추가 옵션
 * @returns {Promise<object>} API 응답
 */
async function callOpenRouterAPI(apiKey, messages, options = {}) {
    const {
        temperature = AI_GRADING_CONFIG.DEFAULT_TEMPERATURE,
        maxTokens = AI_GRADING_CONFIG.DEFAULT_MAX_TOKENS,
        timeout = AI_GRADING_CONFIG.REQUEST_TIMEOUT
    } = options;

    const requestBody = {
        model: AI_GRADING_CONFIG.MODEL,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
    };

    // AbortController로 타임아웃 구현
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(AI_GRADING_CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'TBS Test WebApp'
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new AIAPIError(
                errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                response.status,
                errorData
            );
        }

        const data = await response.json();
        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new AIAPIError('요청 시간 초과 (60초)', 408);
        }

        if (error instanceof AIAPIError) {
            throw error;
        }

        throw new AIAPIError(
            `네트워크 오류: ${error.message}`,
            0,
            { originalError: error }
        );
    }
}

/**
 * 재시도 로직이 적용된 API 호출
 * @param {string} apiKey - OpenRouter API 키
 * @param {Array} messages - 메시지 배열
 * @param {object} options - 추가 옵션
 * @returns {Promise<object>} API 응답
 */
async function callOpenRouterAPIWithRetry(apiKey, messages, options = {}) {
    let lastError = null;
    let retryDelay = AI_GRADING_CONFIG.RETRY_DELAY;

    for (let attempt = 1; attempt <= AI_GRADING_CONFIG.MAX_RETRIES; attempt++) {
        try {
            console.log(`[AI Grading] API 호출 시도 ${attempt}/${AI_GRADING_CONFIG.MAX_RETRIES}`);
            return await callOpenRouterAPI(apiKey, messages, options);

        } catch (error) {
            lastError = error;
            console.error(`[AI Grading] API 호출 실패 (시도 ${attempt}):`, error.message);

            // Rate limit 또는 서버 오류인 경우 재시도
            if (error.status === 429 || error.status >= 500) {
                if (attempt < AI_GRADING_CONFIG.MAX_RETRIES) {
                    console.log(`[AI Grading] ${retryDelay}ms 후 재시도...`);
                    await delay(retryDelay);
                    retryDelay *= AI_GRADING_CONFIG.BACKOFF_MULTIPLIER; // 지수 백오프
                    continue;
                }
            }

            // 재시도 불가능한 오류 (인증 오류, 잘못된 요청 등)
            throw error;
        }
    }

    throw lastError;
}

/**
 * 지연 함수
 * @param {number} ms - 지연 시간 (밀리초)
 * @returns {Promise<void>}
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================
// 3. AI 응답 파싱
// ============================================================

/**
 * AI 응답에서 JSON 추출 및 파싱
 * @param {string} aiResponse - AI의 원본 응답
 * @returns {object} 파싱된 채점 결과
 */
function parseAIGradingResponse(aiResponse) {
    try {
        // JSON 코드 블록 추출 시도
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[1]);
            return validateGradingResult(parsed);
        }

        // 코드 블록 없이 JSON만 있는 경우
        const directJsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (directJsonMatch) {
            const parsed = JSON.parse(directJsonMatch[0]);
            return validateGradingResult(parsed);
        }

        throw new Error('응답에서 JSON을 찾을 수 없습니다.');

    } catch (error) {
        throw new AIParsingError(`AI 응답 파싱 실패: ${error.message}`, aiResponse);
    }
}

/**
 * 채점 결과 유효성 검증
 * @param {object} result - 파싱된 결과
 * @returns {object} 검증된 결과
 */
function validateGradingResult(result) {
    // 필수 필드 확인
    if (typeof result.score !== 'number') {
        throw new Error('score 필드가 없거나 숫자가 아닙니다.');
    }

    if (!Array.isArray(result.weaknessTags)) {
        result.weaknessTags = [];
    }

    if (typeof result.feedback !== 'string') {
        result.feedback = '';
    }

    // 점수 범위 제한
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));

    // 태그 정제 (빈 문자열 제거)
    result.weaknessTags = result.weaknessTags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => tag.trim());

    // 피드백 길이 제한 (500자)
    if (result.feedback.length > 500) {
        result.feedback = result.feedback.substring(0, 497) + '...';
    }

    return result;
}


// ============================================================
// 4. 메인 채점 함수
// ============================================================

/**
 * AI를 사용한 자동 채점
 * @param {string} apiKey - OpenRouter API 키
 * @param {number} problemId - 문제 ID (1 또는 2)
 * @param {string} candidateAnswer - 후보자 답안 (텍스트)
 * @param {object} options - 추가 옵션
 * @returns {Promise<object>} 채점 결과 {score, weaknessTags, feedback, detailedScores, metadata}
 */
async function gradeWithAI(apiKey, problemId, candidateAnswer, options = {}) {
    // 1. 입력 검증
    if (!apiKey || typeof apiKey !== 'string') {
        throw new AIGradingError('유효한 API 키가 필요합니다.');
    }

    if (!candidateAnswer || typeof candidateAnswer !== 'string' || candidateAnswer.trim().length === 0) {
        throw new AIGradingError('유효한 후보자 답안이 필요합니다.');
    }

    if (![1, 2].includes(problemId)) {
        throw new AIGradingError('유효하지 않은 문제 ID입니다. (1 또는 2만 가능)');
    }

    // 2. 프롬프트 생성
    const promptConfig = GRADING_PROMPTS[problemId];
    if (!promptConfig) {
        throw new AIGradingError(`문제 ${problemId}에 대한 채점 프롬프트가 정의되지 않았습니다.`);
    }

    const messages = [
        {
            role: 'system',
            content: promptConfig.systemPrompt
        },
        {
            role: 'user',
            content: promptConfig.userPromptTemplate(candidateAnswer)
        }
    ];

    // 3. API 호출
    console.log(`[AI Grading] 문제 ${problemId} 채점 시작...`);
    const startTime = Date.now();

    const apiResponse = await callOpenRouterAPIWithRetry(apiKey, messages, options);

    const elapsedTime = Date.now() - startTime;
    console.log(`[AI Grading] API 응답 수신 완료 (${elapsedTime}ms)`);

    // 4. 응답 추출
    if (!apiResponse.choices || apiResponse.choices.length === 0) {
        throw new AIParsingError('API 응답에 choices가 없습니다.', JSON.stringify(apiResponse));
    }

    const aiContent = apiResponse.choices[0]?.message?.content;
    if (!aiContent) {
        throw new AIParsingError('AI 응답 내용이 비어있습니다.', JSON.stringify(apiResponse));
    }

    console.log('[AI Grading] AI 응답:', aiContent.substring(0, 200) + '...');

    // 5. 응답 파싱
    const gradingResult = parseAIGradingResponse(aiContent);

    // 6. 메타데이터 추가
    return {
        ...gradingResult,
        metadata: {
            problemId: problemId,
            model: AI_GRADING_CONFIG.MODEL,
            gradedAt: new Date().toISOString(),
            elapsedTime: elapsedTime,
            apiUsage: apiResponse.usage || null
        }
    };
}


// ============================================================
// 5. 답안 준비 헬퍼 함수
// ============================================================

/**
 * 후보자 제출 데이터를 채점용 텍스트로 변환
 * @param {object} submission - 제출 데이터 (TBSBackend.submissions.get() 반환값)
 * @returns {string} 채점용 텍스트
 */
function prepareAnswerForGrading(submission) {
    if (!submission || !submission.answers) {
        return '';
    }

    let answerText = '';

    // 답안을 소문항별로 정리
    Object.entries(submission.answers).forEach(([subId, answer]) => {
        answerText += `\n[답안 ${subId}]\n`;

        if (typeof answer === 'string') {
            answerText += answer;
        } else if (typeof answer === 'object') {
            // 파일 업로드 등 객체인 경우
            if (answer.fileName) {
                answerText += `파일명: ${answer.fileName}\n`;
            }
            if (answer.content) {
                answerText += answer.content;
            } else {
                answerText += JSON.stringify(answer, null, 2);
            }
        } else {
            answerText += String(answer);
        }

        answerText += '\n';
    });

    return answerText.trim();
}


// ============================================================
// 6. 에러 클래스 정의
// ============================================================

/**
 * AI 채점 기본 에러
 */
class AIGradingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIGradingError';
    }
}

/**
 * AI API 호출 에러
 */
class AIAPIError extends Error {
    constructor(message, status = 0, details = {}) {
        super(message);
        this.name = 'AIAPIError';
        this.status = status;
        this.details = details;
    }
}

/**
 * AI 응답 파싱 에러
 */
class AIParsingError extends Error {
    constructor(message, rawResponse = '') {
        super(message);
        this.name = 'AIParsingError';
        this.rawResponse = rawResponse;
    }
}


// ============================================================
// 7. TBSBackend 통합 함수
// ============================================================

/**
 * TBSBackend와 연동된 AI 채점 함수
 * 관리자 권한 확인 및 자동 채점 결과 저장
 *
 * @param {string} apiKey - OpenRouter API 키
 * @param {string} userId - 후보자 ID
 * @param {number} problemId - 문제 ID
 * @returns {Promise<object>} 채점 결과
 */
async function gradeSubmissionWithAI(apiKey, userId, problemId) {
    // 1. 권한 확인
    if (typeof TBSBackend === 'undefined') {
        throw new AIGradingError('TBSBackend가 로드되지 않았습니다.');
    }

    if (!TBSBackend.auth.isAdmin()) {
        throw new AIGradingError('관리자만 AI 채점을 수행할 수 있습니다.');
    }

    // 2. 제출 데이터 조회
    const submissions = TBSBackend.admin.getSubmissionsByUser(userId);
    const submission = submissions.find(s => s.problemId === problemId);

    if (!submission) {
        throw new AIGradingError(`후보자 ${userId}의 문제 ${problemId} 제출 데이터를 찾을 수 없습니다.`);
    }

    if (!submission.isSubmitted) {
        throw new AIGradingError('아직 제출되지 않은 답안입니다.');
    }

    // 3. 답안 텍스트 준비
    const answerText = prepareAnswerForGrading(submission);

    if (answerText.length === 0) {
        throw new AIGradingError('채점할 답안 내용이 없습니다.');
    }

    // 4. AI 채점 수행
    const gradingResult = await gradeWithAI(apiKey, problemId, answerText);

    // 5. 채점 결과 저장
    const saveResult = TBSBackend.admin.saveGrade(
        userId,
        problemId,
        gradingResult.score,
        gradingResult.weaknessTags,
        gradingResult.feedback
    );

    if (!saveResult.success) {
        throw new AIGradingError(`채점 결과 저장 실패: ${saveResult.message}`);
    }

    console.log(`[AI Grading] 채점 완료 - ${userId} / 문제${problemId} / 점수: ${gradingResult.score}점`);

    return {
        ...gradingResult,
        saved: true
    };
}


// ============================================================
// 8. API 인터페이스 (외부 노출용)
// ============================================================

const AIGrading = {
    /**
     * 설정 정보
     */
    config: AI_GRADING_CONFIG,

    /**
     * AI 채점 수행 (저수준 API)
     * @param {string} apiKey - OpenRouter API 키
     * @param {number} problemId - 문제 ID
     * @param {string} candidateAnswer - 후보자 답안
     * @param {object} options - 추가 옵션
     * @returns {Promise<object>} 채점 결과
     */
    grade: gradeWithAI,

    /**
     * TBSBackend와 연동된 AI 채점 (고수준 API, 권장)
     * @param {string} apiKey - OpenRouter API 키
     * @param {string} userId - 후보자 ID
     * @param {number} problemId - 문제 ID
     * @returns {Promise<object>} 채점 결과
     */
    gradeSubmission: gradeSubmissionWithAI,

    /**
     * 답안 준비 헬퍼
     */
    prepareAnswer: prepareAnswerForGrading,

    /**
     * API 키 유효성 검사
     * @param {string} apiKey - OpenRouter API 키
     * @returns {Promise<boolean>} 유효성 여부
     */
    async validateAPIKey(apiKey) {
        try {
            const testMessages = [
                { role: 'user', content: 'Hello' }
            ];
            await callOpenRouterAPI(apiKey, testMessages, { maxTokens: 10 });
            return true;
        } catch (error) {
            console.error('[AI Grading] API 키 검증 실패:', error.message);
            return false;
        }
    },

    /**
     * 에러 클래스
     */
    errors: {
        AIGradingError,
        AIAPIError,
        AIParsingError
    },

    /**
     * 공통 취약점 태그
     */
    commonWeaknessTags: COMMON_WEAKNESS_TAGS,

    /**
     * 채점 프롬프트 조회 (디버깅용)
     */
    getPrompt: (problemId) => GRADING_PROMPTS[problemId]
};


// ============================================================
// 9. 전역 등록
// ============================================================

// 브라우저 환경에서 전역 객체로 등록
if (typeof window !== 'undefined') {
    window.AIGrading = AIGrading;
    console.log('[AI Grading] AI 채점 모듈 로드 완료');
}

// ES 모듈 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIGrading;
}


// ============================================================
// 10. 사용 예시 (주석)
// ============================================================

/*
// ===== 관리자용 사용 예시 =====

// 1. API 키 검증
const apiKey = 'sk-or-v1-...';
const isValid = await AIGrading.validateAPIKey(apiKey);
if (!isValid) {
    alert('유효하지 않은 API 키입니다.');
}

// 2. 간단한 AI 채점 (TBSBackend와 자동 연동)
try {
    const result = await AIGrading.gradeSubmission(apiKey, 'jahyun', 1);
    console.log('채점 결과:', result);
    // {
    //   score: 85,
    //   weaknessTags: ['계산 오류', '참고자료 누락'],
    //   feedback: '전반적으로 양호하나...',
    //   detailedScores: {...},
    //   metadata: {...},
    //   saved: true
    // }
} catch (error) {
    if (error instanceof AIGrading.errors.AIAPIError) {
        if (error.status === 401) {
            alert('API 키가 유효하지 않습니다.');
        } else if (error.status === 429) {
            alert('API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else {
            alert(`API 오류: ${error.message}`);
        }
    } else if (error instanceof AIGrading.errors.AIParsingError) {
        alert('AI 응답 파싱에 실패했습니다.');
        console.error('원본 응답:', error.rawResponse);
    } else {
        alert(`채점 오류: ${error.message}`);
    }
}

// 3. 저수준 API 사용 (직접 답안 텍스트 전달)
const candidateAnswer = `
[답안 1-1]
오류 항목:
1. 기본서비스 사용료: FR-0002 상품이 3월 1일부터 적용되어야 하나 누락됨
2. 확장서비스: DQT-00001 1개 추가분 일할 계산 오류
...
`;

try {
    const result = await AIGrading.grade(apiKey, 1, candidateAnswer);
    console.log('점수:', result.score);
    console.log('취약점:', result.weaknessTags);
    console.log('피드백:', result.feedback);
} catch (error) {
    console.error('채점 실패:', error);
}

// 4. 프롬프트 확인 (디버깅용)
const prompt = AIGrading.getPrompt(1);
console.log('시스템 프롬프트:', prompt.systemPrompt);


// ===== 보안 주의사항 =====

// 1. API 키는 절대 클라이언트 사이드 코드에 하드코딩하지 말 것
// 2. 관리자만 입력/사용 가능하도록 UI에서 제어할 것
// 3. 후보자 화면에서는 AI 채점 기능 완전 차단할 것

// ===== 권장 사용 패턴 (관리자 대시보드) =====

// HTML
<button onclick="performAIGrading('jahyun', 1)">AI 채점</button>

// JavaScript
async function performAIGrading(userId, problemId) {
    // 관리자 권한 확인
    if (!TBSBackend.auth.isAdmin()) {
        alert('관리자 권한이 필요합니다.');
        return;
    }

    // API 키 입력 받기 (매번 입력 또는 세션에 저장)
    let apiKey = sessionStorage.getItem('openrouter_api_key');
    if (!apiKey) {
        apiKey = prompt('OpenRouter API 키를 입력하세요:');
        if (!apiKey) return;

        // 키 유효성 검증
        const isValid = await AIGrading.validateAPIKey(apiKey);
        if (!isValid) {
            alert('유효하지 않은 API 키입니다.');
            return;
        }

        // 세션에 임시 저장 (브라우저 닫으면 삭제됨)
        sessionStorage.setItem('openrouter_api_key', apiKey);
    }

    // 로딩 UI 표시
    showLoadingSpinner();

    try {
        // AI 채점 수행
        const result = await AIGrading.gradeSubmission(apiKey, userId, problemId);

        // 결과 표시
        alert(`채점 완료!\n점수: ${result.score}점\n피드백: ${result.feedback}`);

        // UI 갱신
        refreshGradingTable();

    } catch (error) {
        handleAIGradingError(error);
    } finally {
        hideLoadingSpinner();
    }
}

function handleAIGradingError(error) {
    if (error instanceof AIGrading.errors.AIAPIError) {
        if (error.status === 401) {
            alert('API 키가 유효하지 않습니다. 다시 입력해주세요.');
            sessionStorage.removeItem('openrouter_api_key');
        } else if (error.status === 429) {
            alert('API 호출 한도 초과. 1분 후 재시도해주세요.');
        } else {
            alert(`API 오류: ${error.message}`);
        }
    } else {
        alert(`채점 실패: ${error.message}`);
    }
    console.error('[AI Grading Error]', error);
}
*/
