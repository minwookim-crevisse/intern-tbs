/**
 * TBS 테스트 웹앱 - Supabase Backend Module
 *
 * Supabase 연동 데이터 관리 및 핵심 비즈니스 로직
 * 기존 localStorage 기반 backend.js와 동일한 API 인터페이스 제공
 *
 * 테이블 구조:
 * - users: 사용자 계정 정보
 * - sessions: 로그인 세션
 * - submissions: 제출 데이터
 * - grades: 채점 결과
 */

// ============================================================
// 1. Supabase 설정
// ============================================================

const SUPABASE_CONFIG = {
    URL: 'https://hdnrikvdiomofcpuuvuq.supabase.co',
    ANON_KEY: 'sb_publishable_agGsKK5iYbvfZRjJfiEmdg__yv73JM4'
};

// Supabase 클라이언트 (CDN으로 로드 필요)
let supabaseClient = null;

/**
 * Supabase 클라이언트 초기화
 */
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.error('Supabase 라이브러리가 로드되지 않았습니다. CDN 스크립트를 확인하세요.');
        return false;
    }

    supabaseClient = supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
    console.log('[Supabase] 클라이언트 초기화 완료');
    return true;
}

// ============================================================
// 2. 문제 데이터 (정적 데이터 - 후보자용)
// ============================================================

const PROBLEMS_CANDIDATE = [
    {
        id: 1,
        title: 'SaaS 서비스 사용료 정산 오류 검수',
        content: `당신은 사업지원 인턴으로, SaaS 서비스 도너스의 월별 사용료를 계산(정산)하는 업무를 맡고 있다.

도너스 사용료는 아래 두 가지로 구성된다.

- 기본서비스 사용료: 고객이 구독 중인 상품과 구독기간(1개월/12개월)에 따라 정해지는 금액
- 부가서비스 사용료: 해당 월의 실제 사용량(사용 내역)에 따라 매월 달라지는 금액

당신은 3월 사용료 정산서를 작성해 고객에게 안내했으나, 고객으로부터 "사용료 계산이 잘못된 것 같다"는 문의를 받았다.

요구사항

1. 제공된 정산서(3월분)를 기준으로, 계산이 잘못된 부분이 있다면 정확한 금액으로 수정해 주세요.

2. 같은 문제가 다시 발생하지 않도록, 각 오류가 나온 항목별로 검수 방법을 선택해 주세요.`,
        references: [
            {
                id: 1,
                title: '참고자료 #1: 사용료 정산매뉴얼',
                type: 'txt',
                content: `도너스 사용료 정산 매뉴얼(후보자 제공용)

도너스 사용료는 매월 아래 절차에 따라 산출·정산한다.

전체 흐름

고객 요청 상품 확인

구독 상품 현황 최신화

기본 사용료 산출

부가서비스 사용료 산출

메시지 충전금 반영

1) 고객 요청 상품 확인

고객성공팀을 통해 접수된 상품 주문/변경 요청을 확인한다.

요청받은 상품 주문은 **[요청이력]**에 기록한다.

2) 구독 상품 현황 최신화

**[요청이력]**에 작성된 내용을 근거로 고객별 구독 상품 현황을 최신화한다.

3) 기본 사용료 산출

고객의 구독기간(1개월 / 12개월)에 맞춰 구독 중인 상품 단가를 반영하여 사용료를 산출한다.

예) A-1 상품 단가가 1개월 10,000원 / 12개월 110,000원일 경우

고객이 1개월 구독이면 갱신 시 10,000원을 청구한다.

구독기간 중 상품 주문이 발생한 경우, 해당 상품 사용료는 일단가 기준으로 산출한다.

4) 부가서비스 사용료 산출

매월 집계된 부가서비스 사용량을 기준으로 부가서비스 사용료를 산출한다.

부가서비스 사용료는 부가서비스 사용량 시트의 집계 영역에서 확인한다.

5) 메시지 충전금 반영

부가서비스 사용료 중 메시지 사용료는 고객 요청에 따라 사전 충전이 가능하다.

매월 메시지 사용료를 집계할 때 충전금이 반영된다.

충전금이 모두 소진될 경우, 메시지 사용료 차액은 당월에 청구된다.

정산 관련 규칙(메시지 충전금)

메시지 충전금은 매월 남은 금액이 다음 달로 그대로 넘어간다.

그래서 지난달 마지막에 남아 있던 충전금(전월 기말) = 이번 달 시작할 때의 충전금(당월 기초)이다.

참고 데이터

[요청이력]: 고객 주문/변경 요청 기록

[구독 상품 현황]: 고객별 현재 구독 상태

[상품대장]: 상품 단가 정보

부가서비스 사용량 시트: 부가서비스 사용량 및 월별 집계`
            },
            {
                id: 2,
                title: '참고자료 #2-1: 펀드레이징 상품주문 요청서',
                type: 'txt',
                content: `[참고자료] 상품 변경 요청서(펀드레이징 에디션)

상품요청코드: Request-260201
발신: 고객성공팀
수신: 사업지원팀

사업지원팀 담당자님,
안녕하세요.

고객 사단법인 ABC 재단(고객코드: ABC)의 기본서비스 상품 변경 요청이 접수되어 전달드립니다.
해당 변경은 구독 시작일(2026-03-01)부터 적용 부탁드립니다.

1) 고객 정보

고객코드: ABC

고객명: 사단법인 ABC 재단

구독기간: 2026-03-01 ~ 2026-03-31

2) 상품 변경 요청
주문 변경일: 2026-03-01

구분(상품군): 펀드레이징 에디션

해지 상품: FR-0001

변경(적용) 상품: FR-0002

3) 참고사항(정산 반영 기준)

FR-0001은 2026년 3월 사용료부터 제외합니다.

FR-0002는 2026년 3월 사용료부터 전액 포함합니다.`
            },
            {
                id: 3,
                title: '참고자료 #2-2: 확장서비스 상품주문 요청서',
                type: 'txt',
                content: `[참고자료] 상품 변경 요청서(확장사용량)

상품요청코드: Request-260314
발신: 고객성공팀
수신: 사업지원팀

사업지원팀 담당자님,
안녕하세요.

고객 사단법인 ABC 재단(고객코드: ABC)의 기본서비스(확장서비스) 추가 주문이 접수되어 전달드립니다.
해당 변경은 구독 기간 중인 03월 14일부터 반영부탁드립니다.

1) 고객 정보
- 고객코드: ABC
- 고객명: 사단법인 ABC 재단
- 구독기간: 2026-03-01 ~ 2026-03-31
- 과금기간: 2026-03-14 ~ 2026-03-31 (17일)

2) 상품 수량 변경
- 주문 변경일: 2026-02-01
- 구분(상품군): 확장사용량
- 상품코드: DQT-00001
- 상품명: 사용자계정 1개
- 기존수량: 1개
- 변경수량: 2개 (1개 추가)

3) 참고사항(정산 반영 기준)
- 구독기간 중에 상품 추가된 경우, 추가분에 대해 변경일부터 구독 종료일까지 기간을 일할 단가로 산출합니다.

[사업지원팀 회신내용]
고객성공팀 담당자님, 요청사항 확인했습니다.
구독기간 중 QT-00001 1개 추가 사용함에 따라 18,445원(VAT 포함) 청구합니다.

- 사용료 산출내역
QT-00001 일단가 1,085 * 17일 = 18,445원`
            },
            {
                id: 4,
                title: '참고자료 #3-1: 2월 사용료 정산이력',
                type: 'xlsx',
                fileName: '[참고자료 #3-1] 2월 사용료(정산일 3월 5일) 정산이력.xlsx',
                content: null
            },
            {
                id: 5,
                title: '참고자료 #3-2: 3월 사용료 정산이력',
                type: 'xlsx',
                fileName: '[참고자료 #3-2] 3월 사용료(정산일 4월 5일) 정산이력.xlsx',
                content: null
            },
            {
                id: 6,
                title: '참고자료 #4: 상품목록',
                type: 'xlsx',
                fileName: '[참고자료 #4] 상품목록.xlsx',
                content: null
            }
        ],
        answerTypes: [
            { subId: '1-1', type: 'text', label: '오류 분석 및 수정 내용 (서술형)' },
            { subId: '1-2', type: 'file', label: '수정된 정산서 (Excel 파일 업로드)', accept: '.xlsx,.xls' }
        ]
    },
    {
        id: 2,
        title: '미디어 사업 사용료 정산서 작성',
        content: `당신은 사업지원 인턴으로, 미디어 사업의 월별 사용료(3월분)를 계산(정산)하는 업무를 맡고 있다.

미디어 사업 사용료는 아래 두 가지 매출로 구성된다.

- 광고집행 매출: 광고채널에서 확인된 광고집행비용을 기준으로, 계약된 수수료(%)를 반영해 산출한 금액
- 광고소재 매출: 광고집행담당자가 확인해 준 광고소재 판매/제작 매출 금액

당신은 광고집행담당자의 협조를 받아 3월 사용료 정산서를 작성하고자 한다.

요구사항

1. 광고채널에서 3월 광고집행비용 데이터를 추출하고, 수수료를 반영한 광고집행 매출과 광고소재 매출을 각각 집계하여 정산 항목(정산서)을 작성해 주세요.

2. 완성된 정산서 금액을 기준으로, 고객에게 발행할 세금계산서 발행 금액을 입력해 주세요.`,
        references: [
            {
                id: 1,
                title: '참고자료 #1: 광고집행 매출 산출매뉴얼',
                type: 'txt',
                content: `[참고자료] 광고집행 매출 산출매뉴얼

광고집행 매출은 광고채널에서 확인된 광고집행비용(원가)을 기준으로 산출합니다.

1. 광고집행비용 데이터 추출
- 광고채널에서 해당 월의 광고집행비용 데이터를 추출합니다.
- 매체별로 집행비용을 집계합니다.

2. 수수료 반영
- 계약된 수수료율(%)을 광고집행비용에 적용하여 매출을 산출합니다.
- 수수료율은 매체정의표에서 확인합니다.

3. 광고소재 매출
- 광고집행담당자가 확인해 준 광고소재 판매/제작 매출을 별도 집계합니다.

4. 세금계산서 발행
- 광고집행 매출과 광고소재 매출을 합산한 금액으로 세금계산서를 발행합니다.
- 선수금이 있는 경우, 선수금을 차감한 금액으로 발행합니다.`
            },
            {
                id: 2,
                title: '참고자료 #2: 광고집행비용(원가)',
                type: 'xlsx',
                fileName: '[참고자료 #2] 광고집행비용(원가).xlsx',
                content: null
            },
            {
                id: 3,
                title: '참고자료 #3: 광고집행담당자 소통이력',
                type: 'txt',
                content: `[참고자료] 광고집행담당자 -> 사업지원팀 소통 이력
(이력 1) 선수금 잔액 안내

발신일: 03월 01일

발신자: 광고집행담당자

수신자: 사업지원팀

사업지원팀 담당자님, 안녕하세요. 광고집행담당자입니다.

지난 2월 사용료 청구 이후, **BCD(고객명: 사단법인 BCD 재단)**의 선수금 잔액은 8,656,853원입니다.
3월 사용료 청구 시, 해당 잔액을 제외한 금액에 대해 세금계산서 발행 부탁드립니다.

감사합니다.
광고집행담당자 드림

(이력 2) 추가 입금(선지급) 안내

발신일: 03월 15일

발신자: 광고집행담당자

수신자: 사업지원팀

사업지원팀 담당자님, 안녕하세요. 광고집행담당자입니다.

금일 기준으로 **BCD(고객명: 사단법인 BCD 재단)**에서 10,000,000원을 추가 입금하였습니다.
3월 사용료 청구 시, 기존 선수금 잔액과 금번 입금액을 반영하여 세금계산서 발행 부탁드립니다.

감사합니다.
광고집행담당자 드림

(이력 3) 3월 광고소재 매출 및 집행 매체 공유

발신일: 03월 31일

발신자: 광고집행담당자

수신자: 사업지원팀

사업지원팀 담당자님, 안녕하세요. 광고집행담당자입니다.

3월 기준 광고소재 제작 매출은 아래와 같습니다. (아래 금액은 VAT 제외 금액입니다.)

[3월 광고소재 제작 매출]

광고소재 A: 1,890,000원

광고소재 B: 3,500,000원

또한 3월 동안 집행한 광고 매체는 아래와 같습니다.

[3월 광고집행 매체]

G사

M사

K사

X사

N사

감사합니다.
광고집행담당자 드림`
            },
            {
                id: 4,
                title: '참고자료 #4-1: 매체정의표',
                type: 'xlsx',
                fileName: '[참고자료 #4] 매체정의표.xlsx',
                content: null
            },
            {
                id: 5,
                title: '참고자료 #4-2: 수수료율 정보',
                type: 'xlsx',
                fileName: '[참고자료 #4] 수수료율 정보.xlsx',
                content: null
            }
        ],
        answerTypes: [
            { subId: '2-1', type: 'file', label: '정산서 (Excel 파일 업로드)', accept: '.xlsx,.xls' }
        ]
    }
];

// 관리자용 문제 데이터 (채점 기준 포함)
const PROBLEMS_ADMIN = [
    {
        id: 1,
        title: 'SaaS 서비스 사용료 정산 오류 검수',
        correctAnswerFile: '[문제]1번정답.docx',
        gradingCriteriaFile: '[문제]1번보기.docx',
        gradingCriteria: `채점 기준:
1. 오류 항목 식별 정확도 (40점)
   - 기본서비스 사용료 오류 식별
   - 부가서비스 사용료 오류 식별
   - 메시지 충전금 계산 오류 식별

2. 수정 금액 정확도 (40점)
   - 정확한 금액 계산
   - 일할 계산 정확성

3. 검수 방법 적절성 (20점)
   - 재발 방지를 위한 검수 방법 제시
   - 논리적 타당성`
    },
    {
        id: 2,
        title: '미디어 사업 사용료 정산서 작성',
        correctAnswerFile: '[문제]정답.xlsx',
        gradingCriteriaFile: '[문제]보기.xlsx',
        gradingCriteria: `채점 기준:
1. 광고집행 매출 산출 정확도 (40점)
   - 매체별 집행비용 추출 정확성
   - 수수료율 적용 정확성

2. 광고소재 매출 집계 정확도 (30점)
   - 광고소재 A, B 매출 반영

3. 세금계산서 발행 금액 (30점)
   - 선수금 반영 정확성
   - VAT 계산 정확성`
    }
];

// ============================================================
// 3. 유틸리티 함수
// ============================================================

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// 세션 ID를 localStorage에 저장/조회
function getSessionId() {
    return localStorage.getItem('tbs_session_id');
}

function setSessionId(sessionId) {
    localStorage.setItem('tbs_session_id', sessionId);
}

function clearSessionId() {
    localStorage.removeItem('tbs_session_id');
}

// 현재 사용자 캐시 (API 호출 최소화)
let currentUserCache = null;

// ============================================================
// 4. 인증 모듈 (Supabase 연동)
// ============================================================

const SupabaseAuthModule = {
    /**
     * 로그인
     */
    async login(id, password) {
        if (!supabaseClient) {
            return { success: false, message: 'Supabase가 초기화되지 않았습니다.' };
        }

        if (!id || !password) {
            return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
        }

        try {
            // 사용자 조회
            const { data: user, error } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', id)
                .eq('password', password)
                .single();

            if (error || !user) {
                return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
            }

            // 세션 생성
            const { data: session, error: sessionError } = await supabaseClient
                .from('sessions')
                .insert({
                    user_id: user.id
                })
                .select()
                .single();

            if (sessionError) {
                console.error('세션 생성 오류:', sessionError);
                return { success: false, message: '로그인 처리 중 오류가 발생했습니다.' };
            }

            // 세션 ID 저장
            setSessionId(session.id);

            // 사용자 캐시 저장
            currentUserCache = {
                id: user.id,
                role: user.role,
                name: user.name,
                loginAt: session.login_at
            };

            return {
                success: true,
                message: '로그인 성공',
                user: currentUserCache
            };

        } catch (err) {
            console.error('로그인 오류:', err);
            return { success: false, message: '로그인 처리 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 로그아웃
     */
    async logout() {
        const sessionId = getSessionId();

        if (sessionId && supabaseClient) {
            try {
                await supabaseClient
                    .from('sessions')
                    .update({ is_active: false })
                    .eq('id', sessionId);
            } catch (err) {
                console.error('세션 비활성화 오류:', err);
            }
        }

        clearSessionId();
        currentUserCache = null;

        return { success: true, message: '로그아웃 되었습니다.' };
    },

    /**
     * 현재 로그인한 사용자 정보 반환
     */
    async getCurrentUser() {
        if (currentUserCache) {
            return currentUserCache;
        }

        const sessionId = getSessionId();
        if (!sessionId || !supabaseClient) {
            return null;
        }

        try {
            // 세션 조회
            const { data: session, error: sessionError } = await supabaseClient
                .from('sessions')
                .select('*, users(*)')
                .eq('id', sessionId)
                .eq('is_active', true)
                .single();

            if (sessionError || !session || !session.users) {
                clearSessionId();
                return null;
            }

            // 세션 만료 확인
            if (new Date(session.expires_at) < new Date()) {
                await this.logout();
                return null;
            }

            currentUserCache = {
                id: session.users.id,
                role: session.users.role,
                name: session.users.name,
                loginAt: session.login_at
            };

            return currentUserCache;

        } catch (err) {
            console.error('사용자 조회 오류:', err);
            return null;
        }
    },

    /**
     * 현재 사용자가 관리자인지 확인
     */
    async isAdmin() {
        const user = await this.getCurrentUser();
        return user && user.role === 'admin';
    },

    /**
     * 현재 사용자가 후보자인지 확인
     */
    async isCandidate() {
        const user = await this.getCurrentUser();
        return user && user.role === 'candidate';
    },

    /**
     * 로그인 상태 확인
     */
    async isLoggedIn() {
        const user = await this.getCurrentUser();
        return user !== null;
    }
};


// ============================================================
// 5. 문제 모듈
// ============================================================

const SupabaseProblemModule = {
    getAllProblems() {
        return PROBLEMS_CANDIDATE;
    },

    getProblem(problemId) {
        return PROBLEMS_CANDIDATE.find(p => p.id === problemId) || null;
    },

    async getProblemsForAdmin() {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) {
            console.error('Unauthorized access to admin problems');
            return [];
        }
        return PROBLEMS_ADMIN;
    },

    async getGradingCriteria(problemId) {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) {
            console.error('Unauthorized access to grading criteria');
            return null;
        }
        return PROBLEMS_ADMIN.find(p => p.id === problemId) || null;
    }
};


// ============================================================
// 6. 제출 모듈 (Supabase 연동)
// ============================================================

const SupabaseSubmissionModule = {
    /**
     * 답안 임시 저장
     */
    async saveAnswer(problemId, answer, subId = null) {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        // 이미 제출된 문제인지 확인
        if (await this.isSubmitted(problemId)) {
            return { success: false, message: '이미 제출된 문제입니다.' };
        }

        try {
            // 기존 제출 데이터 조회
            const { data: existing } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('problem_id', problemId)
                .single();

            let answers = existing?.answers || {};

            if (subId) {
                answers[subId] = answer;
            } else {
                answers['main'] = answer;
            }

            if (existing) {
                // 업데이트
                const { error } = await supabaseClient
                    .from('submissions')
                    .update({
                        answers: answers,
                        last_saved_at: getCurrentTimestamp()
                    })
                    .eq('user_id', currentUser.id)
                    .eq('problem_id', problemId);

                if (error) throw error;
            } else {
                // 새로 생성
                const { error } = await supabaseClient
                    .from('submissions')
                    .insert({
                        user_id: currentUser.id,
                        problem_id: problemId,
                        answers: answers,
                        is_submitted: false,
                        last_saved_at: getCurrentTimestamp()
                    });

                if (error) throw error;
            }

            return { success: true, message: '저장되었습니다.' };

        } catch (err) {
            console.error('답안 저장 오류:', err);
            return { success: false, message: '저장 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 답안 최종 제출
     */
    async submitAnswer(problemId, answer = null, subId = null) {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        if (await this.isSubmitted(problemId)) {
            return { success: false, message: '이미 제출된 문제입니다. 다시 제출할 수 없습니다.' };
        }

        try {
            // 기존 데이터 조회
            const { data: existing } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('problem_id', problemId)
                .single();

            let answers = existing?.answers || {};

            if (answer !== null) {
                if (subId) {
                    answers[subId] = answer;
                } else {
                    answers['main'] = answer;
                }
            }

            if (existing) {
                const { error } = await supabaseClient
                    .from('submissions')
                    .update({
                        answers: answers,
                        is_submitted: true,
                        submitted_at: getCurrentTimestamp()
                    })
                    .eq('user_id', currentUser.id)
                    .eq('problem_id', problemId);

                if (error) throw error;
            } else {
                const { error } = await supabaseClient
                    .from('submissions')
                    .insert({
                        user_id: currentUser.id,
                        problem_id: problemId,
                        answers: answers,
                        is_submitted: true,
                        submitted_at: getCurrentTimestamp()
                    });

                if (error) throw error;
            }

            return {
                success: true,
                message: '제출이 완료되었습니다. 이 문제는 더 이상 열람할 수 없습니다.'
            };

        } catch (err) {
            console.error('제출 오류:', err);
            return { success: false, message: '제출 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 문제가 제출되었는지 확인
     */
    async isSubmitted(problemId) {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) return false;

        try {
            const { data } = await supabaseClient
                .from('submissions')
                .select('is_submitted')
                .eq('user_id', currentUser.id)
                .eq('problem_id', problemId)
                .single();

            return data?.is_submitted === true;

        } catch (err) {
            return false;
        }
    },

    /**
     * 특정 문제의 제출 정보 조회
     */
    async getSubmission(problemId) {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) return null;

        try {
            const { data } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('problem_id', problemId)
                .single();

            if (!data) return null;

            return {
                userId: data.user_id,
                problemId: data.problem_id,
                answers: data.answers,
                isSubmitted: data.is_submitted,
                submittedAt: data.submitted_at,
                lastSavedAt: data.last_saved_at,
                createdAt: data.created_at
            };

        } catch (err) {
            return null;
        }
    },

    /**
     * 현재 사용자의 모든 제출 정보 조회
     */
    async getMySubmissions() {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) return [];

        try {
            const { data } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('user_id', currentUser.id);

            return (data || []).map(s => ({
                userId: s.user_id,
                problemId: s.problem_id,
                answers: s.answers,
                isSubmitted: s.is_submitted,
                submittedAt: s.submitted_at,
                lastSavedAt: s.last_saved_at
            }));

        } catch (err) {
            console.error('제출 목록 조회 오류:', err);
            return [];
        }
    },

    /**
     * 문제 접근 가능 여부 확인
     */
    async canAccessProblem(problemId) {
        const currentUser = await SupabaseAuthModule.getCurrentUser();
        if (!currentUser) {
            return { canAccess: false, reason: '로그인이 필요합니다.' };
        }

        if (currentUser.role !== 'candidate') {
            return { canAccess: false, reason: '후보자만 문제에 접근할 수 있습니다.' };
        }

        if (await this.isSubmitted(problemId)) {
            return { canAccess: false, reason: '이미 제출한 문제입니다. 다시 열람할 수 없습니다.' };
        }

        return { canAccess: true, reason: '' };
    }
};


// ============================================================
// 7. 관리자 모듈 (Supabase 연동)
// ============================================================

const SupabaseAdminModule = {
    /**
     * 모든 제출 정보 조회
     */
    async getAllSubmissions() {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) {
            console.error('Unauthorized access');
            return [];
        }

        try {
            const { data } = await supabaseClient
                .from('submissions')
                .select('*')
                .order('submitted_at', { ascending: false });

            return (data || []).map(s => ({
                userId: s.user_id,
                problemId: s.problem_id,
                answers: s.answers,
                isSubmitted: s.is_submitted,
                submittedAt: s.submitted_at
            }));

        } catch (err) {
            console.error('제출 목록 조회 오류:', err);
            return [];
        }
    },

    /**
     * 특정 사용자의 제출 정보 조회
     */
    async getSubmissionsByUser(userId) {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) return [];

        try {
            const { data } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('user_id', userId);

            return (data || []).map(s => ({
                userId: s.user_id,
                problemId: s.problem_id,
                answers: s.answers,
                isSubmitted: s.is_submitted,
                submittedAt: s.submitted_at
            }));

        } catch (err) {
            return [];
        }
    },

    /**
     * 채점 결과 저장
     */
    async saveGrade(userId, problemId, score, weaknessTags = [], feedback = '') {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) {
            return { success: false, message: '관리자 권한이 필요합니다.' };
        }

        const currentUser = await SupabaseAuthModule.getCurrentUser();

        try {
            // 기존 채점 확인
            const { data: existing } = await supabaseClient
                .from('grades')
                .select('*')
                .eq('user_id', userId)
                .eq('problem_id', problemId)
                .single();

            const gradeData = {
                user_id: userId,
                problem_id: problemId,
                score: Math.min(100, Math.max(0, score)),
                weakness_tags: weaknessTags,
                feedback: feedback,
                graded_at: getCurrentTimestamp(),
                graded_by: currentUser.id
            };

            if (existing) {
                const { error } = await supabaseClient
                    .from('grades')
                    .update(gradeData)
                    .eq('user_id', userId)
                    .eq('problem_id', problemId);

                if (error) throw error;
            } else {
                const { error } = await supabaseClient
                    .from('grades')
                    .insert(gradeData);

                if (error) throw error;
            }

            return { success: true, message: '채점 결과가 저장되었습니다.' };

        } catch (err) {
            console.error('채점 저장 오류:', err);
            return { success: false, message: '채점 결과 저장 중 오류가 발생했습니다.' };
        }
    },

    /**
     * 특정 사용자의 채점 결과 조회
     */
    async getGradesByUser(userId) {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) return [];

        try {
            const { data } = await supabaseClient
                .from('grades')
                .select('*')
                .eq('user_id', userId);

            return (data || []).map(g => ({
                userId: g.user_id,
                problemId: g.problem_id,
                score: g.score,
                weaknessTags: g.weakness_tags,
                feedback: g.feedback,
                gradedAt: g.graded_at,
                gradedBy: g.graded_by
            }));

        } catch (err) {
            return [];
        }
    },

    /**
     * 취약점 통계 조회
     */
    async getWeaknessStats() {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) return {};

        try {
            const { data } = await supabaseClient
                .from('grades')
                .select('weakness_tags');

            const stats = {};
            (data || []).forEach(g => {
                if (g.weakness_tags && Array.isArray(g.weakness_tags)) {
                    g.weakness_tags.forEach(tag => {
                        stats[tag] = (stats[tag] || 0) + 1;
                    });
                }
            });

            return stats;

        } catch (err) {
            return {};
        }
    },

    /**
     * 후보자 목록 조회 (채점 현황 포함)
     */
    async getCandidateList() {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) return [];

        try {
            // 후보자 목록
            const { data: users } = await supabaseClient
                .from('users')
                .select('*')
                .eq('role', 'candidate');

            // 제출 현황
            const { data: submissions } = await supabaseClient
                .from('submissions')
                .select('*')
                .eq('is_submitted', true);

            // 채점 현황
            const { data: grades } = await supabaseClient
                .from('grades')
                .select('*');

            return (users || []).map(user => {
                const userSubmissions = (submissions || []).filter(s => s.user_id === user.id);
                const userGrades = (grades || []).filter(g => g.user_id === user.id);

                const avgScore = userGrades.length > 0
                    ? userGrades.reduce((sum, g) => sum + g.score, 0) / userGrades.length
                    : null;

                return {
                    id: user.id,
                    name: user.name,
                    submittedCount: userSubmissions.length,
                    totalProblems: PROBLEMS_CANDIDATE.length,
                    gradedCount: userGrades.length,
                    averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null
                };
            });

        } catch (err) {
            console.error('후보자 목록 조회 오류:', err);
            return [];
        }
    },

    /**
     * 특정 후보자의 상세 정보 조회
     */
    async getCandidateDetail(userId) {
        const isAdmin = await SupabaseAuthModule.isAdmin();
        if (!isAdmin) return null;

        try {
            const { data: user } = await supabaseClient
                .from('users')
                .select('*')
                .eq('id', userId)
                .eq('role', 'candidate')
                .single();

            if (!user) return null;

            const submissions = await this.getSubmissionsByUser(userId);
            const grades = await this.getGradesByUser(userId);
            const problems = SupabaseProblemModule.getAllProblems();

            return {
                id: user.id,
                name: user.name,
                submissions: submissions,
                grades: grades,
                problems: problems.map(p => {
                    const submission = submissions.find(s => s.problemId === p.id);
                    const grade = grades.find(g => g.problemId === p.id);
                    return {
                        problemId: p.id,
                        problemTitle: p.title,
                        submitted: submission?.isSubmitted || false,
                        submittedAt: submission?.submittedAt || null,
                        answers: submission?.answers || null,
                        graded: !!grade,
                        score: grade?.score || null,
                        weaknessTags: grade?.weaknessTags || [],
                        feedback: grade?.feedback || ''
                    };
                })
            };

        } catch (err) {
            console.error('후보자 상세 조회 오류:', err);
            return null;
        }
    }
};


// ============================================================
// 8. 접근 제어 모듈
// ============================================================

const SupabaseAccessControl = {
    async requireLogin() {
        if (!(await SupabaseAuthModule.isLoggedIn())) {
            console.warn('Login required.');
            return false;
        }
        return true;
    },

    async requireAdmin() {
        if (!(await this.requireLogin())) return false;
        if (!(await SupabaseAuthModule.isAdmin())) {
            console.warn('Admin permission required.');
            return false;
        }
        return true;
    },

    async requireCandidate() {
        if (!(await this.requireLogin())) return false;
        if (!(await SupabaseAuthModule.isCandidate())) {
            console.warn('Candidate permission required.');
            return false;
        }
        return true;
    },

    async checkProblemAccess(problemId) {
        if (!(await this.requireCandidate())) {
            return { canAccess: false, reason: '후보자만 접근할 수 있습니다.' };
        }
        return await SupabaseSubmissionModule.canAccessProblem(problemId);
    }
};


// ============================================================
// 9. API 인터페이스 (TBSBackend 호환)
// ============================================================

const TBSSupabase = {
    // 초기화
    init: () => {
        const result = initSupabase();
        console.log('[TBSSupabase] 초기화 완료');
        return result;
    },

    // 인증 (비동기)
    auth: {
        login: (id, password) => SupabaseAuthModule.login(id, password),
        logout: () => SupabaseAuthModule.logout(),
        getCurrentUser: () => SupabaseAuthModule.getCurrentUser(),
        isAdmin: () => SupabaseAuthModule.isAdmin(),
        isCandidate: () => SupabaseAuthModule.isCandidate(),
        isLoggedIn: () => SupabaseAuthModule.isLoggedIn()
    },

    // 문제
    problems: {
        getAll: () => SupabaseProblemModule.getAllProblems(),
        get: (problemId) => SupabaseProblemModule.getProblem(problemId),
        getForAdmin: () => SupabaseProblemModule.getProblemsForAdmin(),
        getGradingCriteria: (problemId) => SupabaseProblemModule.getGradingCriteria(problemId)
    },

    // 제출 (비동기)
    submissions: {
        save: (problemId, answer, subId) => SupabaseSubmissionModule.saveAnswer(problemId, answer, subId),
        submit: (problemId, answer, subId) => SupabaseSubmissionModule.submitAnswer(problemId, answer, subId),
        isSubmitted: (problemId) => SupabaseSubmissionModule.isSubmitted(problemId),
        get: (problemId) => SupabaseSubmissionModule.getSubmission(problemId),
        getMine: () => SupabaseSubmissionModule.getMySubmissions(),
        canAccess: (problemId) => SupabaseSubmissionModule.canAccessProblem(problemId)
    },

    // 관리자 기능 (비동기)
    admin: {
        getAllSubmissions: () => SupabaseAdminModule.getAllSubmissions(),
        getSubmissionsByUser: (userId) => SupabaseAdminModule.getSubmissionsByUser(userId),
        getSubmissionsByProblem: (problemId) => SupabaseAdminModule.getSubmissionsByProblem?.(problemId) || [],
        saveGrade: (userId, problemId, score, tags, feedback) =>
            SupabaseAdminModule.saveGrade(userId, problemId, score, tags, feedback),
        getGradesByUser: (userId) => SupabaseAdminModule.getGradesByUser(userId),
        getGradesByProblem: (problemId) => SupabaseAdminModule.getGradesByProblem?.(problemId) || [],
        getWeaknessStats: () => SupabaseAdminModule.getWeaknessStats(),
        getCandidateList: () => SupabaseAdminModule.getCandidateList(),
        getCandidateDetail: (userId) => SupabaseAdminModule.getCandidateDetail(userId)
    },

    // 접근 제어 (비동기)
    access: {
        requireLogin: () => SupabaseAccessControl.requireLogin(),
        requireAdmin: () => SupabaseAccessControl.requireAdmin(),
        requireCandidate: () => SupabaseAccessControl.requireCandidate(),
        checkProblemAccess: (problemId) => SupabaseAccessControl.checkProblemAccess(problemId)
    },

    // 유틸리티
    utils: {
        escapeHtml: (str) => escapeHtml(str),
        getCurrentTimestamp: () => getCurrentTimestamp()
    },

    // Supabase 클라이언트 직접 접근
    getClient: () => supabaseClient
};


// ============================================================
// 10. 전역 등록
// ============================================================

if (typeof window !== 'undefined') {
    window.TBSSupabase = TBSSupabase;

    // DOM 로드 완료 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TBSSupabase.init();
        });
    } else {
        TBSSupabase.init();
    }
}

// ES 모듈 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TBSSupabase;
}


// ============================================================
// 11. 사용 예시 (주석)
// ============================================================

/*
// ===== 기본 사용 예시 (async/await 필수) =====

// 1. 로그인
const result = await TBSSupabase.auth.login('jahyun', 'pass1');
if (result.success) {
    console.log('로그인 성공:', result.user);
}

// 2. 문제 목록 조회
const problems = TBSSupabase.problems.getAll();
console.log('문제 목록:', problems);

// 3. 문제 접근 가능 여부 확인
const accessCheck = await TBSSupabase.submissions.canAccess(1);
if (accessCheck.canAccess) {
    // 문제 내용 표시
} else {
    console.log('접근 불가:', accessCheck.reason);
}

// 4. 답안 임시 저장
await TBSSupabase.submissions.save(1, '답안 내용...', '1-1');

// 5. 답안 최종 제출
const submitResult = await TBSSupabase.submissions.submit(1);
console.log(submitResult.message);

// 6. 제출 여부 확인
if (await TBSSupabase.submissions.isSubmitted(1)) {
    // 문제 렌더링 차단
}

// 7. 관리자: 후보자 목록 조회
if (await TBSSupabase.auth.isAdmin()) {
    const candidates = await TBSSupabase.admin.getCandidateList();
    console.log('후보자 목록:', candidates);
}

// 8. 관리자: 채점 결과 저장
await TBSSupabase.admin.saveGrade('jahyun', 1, 85, ['계산 오류', '참고자료 누락'], '전반적으로 양호함');
*/
