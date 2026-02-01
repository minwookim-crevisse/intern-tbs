/**
 * TBS 테스트 웹앱 - Backend Logic Module
 *
 * localStorage 기반 데이터 관리 및 핵심 비즈니스 로직
 *
 * localStorage 키 구조:
 * - tbs_users: 사용자 계정 정보 배열
 * - tbs_problems: 문제 데이터 배열 (후보자용, 정답 제외)
 * - tbs_problems_admin: 문제 데이터 배열 (관리자용, 정답 포함)
 * - tbs_submissions: 제출 데이터 객체 {oderId_problemId: {...}}
 * - tbs_grades: 채점 결과 객체 {oderId_problemId: {...}}
 * - tbs_current_user: 현재 로그인 사용자 정보
 */

// ============================================================
// 1. 초기 데이터 정의
// ============================================================

/**
 * 계정 정보 (계정정보.xlsx 기반)
 * 보안 주의: 비밀번호는 실제 운영 시 해시 처리 필요
 */
const INITIAL_USERS = [
    { id: 'jahyun', password: 'pass1', role: 'candidate', name: '홍자현' },
    { id: 'candidate1', password: 'test1234', role: 'candidate', name: '후보자1' },
    { id: 'candidate2', password: 'test1234', role: 'candidate', name: '후보자2' },
    { id: 'admin', password: 'admin1234', role: 'admin', name: '관리자' },
    { id: 'minchang', password: 'adminpass', role: 'admin', name: '김민창' }
];

/**
 * 문제 데이터 (후보자용 - 정답/채점기준 제외)
 * 보안 주의: 이 데이터는 후보자 화면에 노출됨
 */
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
                content: null // xlsx 파일은 프론트엔드에서 별도 처리
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

/**
 * 문제 데이터 (관리자용 - 정답/채점기준 포함)
 * 보안 주의: 이 데이터는 관리자 화면에서만 사용
 */
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
// 2. localStorage 키 상수
// ============================================================

const STORAGE_KEYS = {
    USERS: 'tbs_users',
    PROBLEMS: 'tbs_problems',
    PROBLEMS_ADMIN: 'tbs_problems_admin',
    SUBMISSIONS: 'tbs_submissions',
    GRADES: 'tbs_grades',
    CURRENT_USER: 'tbs_current_user'
};


// ============================================================
// 3. 유틸리티 함수
// ============================================================

/**
 * localStorage에서 데이터 읽기
 * @param {string} key - localStorage 키
 * @returns {any} 파싱된 데이터 또는 null
 */
function getFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error(`Error reading from localStorage [${key}]:`, error);
        return null;
    }
}

/**
 * localStorage에 데이터 저장
 * @param {string} key - localStorage 키
 * @param {any} data - 저장할 데이터
 * @returns {boolean} 성공 여부
 */
function setToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage [${key}]:`, error);
        return false;
    }
}

/**
 * localStorage에서 데이터 삭제
 * @param {string} key - localStorage 키
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error removing from localStorage [${key}]:`, error);
    }
}

/**
 * ISO 8601 형식의 현재 시각 반환
 * @returns {string} ISO 8601 형식 시각
 */
function getCurrentTimestamp() {
    return new Date().toISOString();
}

/**
 * HTML 이스케이프 처리 (XSS 방지)
 * @param {string} str - 이스케이프할 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


// ============================================================
// 4. 초기화 모듈
// ============================================================

const InitModule = {
    /**
     * 앱 초기화 - localStorage에 초기 데이터 설정
     * 기존 데이터가 있으면 유지, 없으면 초기화
     */
    initialize() {
        // 사용자 데이터 초기화
        if (!getFromStorage(STORAGE_KEYS.USERS)) {
            setToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
            console.log('Users data initialized');
        }

        // 문제 데이터 초기화 (후보자용)
        if (!getFromStorage(STORAGE_KEYS.PROBLEMS)) {
            setToStorage(STORAGE_KEYS.PROBLEMS, PROBLEMS_CANDIDATE);
            console.log('Problems (candidate) data initialized');
        }

        // 문제 데이터 초기화 (관리자용)
        if (!getFromStorage(STORAGE_KEYS.PROBLEMS_ADMIN)) {
            setToStorage(STORAGE_KEYS.PROBLEMS_ADMIN, PROBLEMS_ADMIN);
            console.log('Problems (admin) data initialized');
        }

        // 제출 데이터 초기화
        if (!getFromStorage(STORAGE_KEYS.SUBMISSIONS)) {
            setToStorage(STORAGE_KEYS.SUBMISSIONS, {});
            console.log('Submissions data initialized');
        }

        // 채점 데이터 초기화
        if (!getFromStorage(STORAGE_KEYS.GRADES)) {
            setToStorage(STORAGE_KEYS.GRADES, {});
            console.log('Grades data initialized');
        }

        console.log('TBS Backend initialized successfully');
    },

    /**
     * 모든 데이터 초기화 (개발/테스트용)
     */
    resetAll() {
        removeFromStorage(STORAGE_KEYS.USERS);
        removeFromStorage(STORAGE_KEYS.PROBLEMS);
        removeFromStorage(STORAGE_KEYS.PROBLEMS_ADMIN);
        removeFromStorage(STORAGE_KEYS.SUBMISSIONS);
        removeFromStorage(STORAGE_KEYS.GRADES);
        removeFromStorage(STORAGE_KEYS.CURRENT_USER);
        this.initialize();
        console.log('All data reset to initial state');
    }
};


// ============================================================
// 5. 인증 모듈
// ============================================================

const AuthModule = {
    /**
     * 로그인
     * @param {string} id - 계정 ID
     * @param {string} password - 비밀번호
     * @returns {{success: boolean, message: string, user?: object}} 로그인 결과
     */
    login(id, password) {
        if (!id || !password) {
            return { success: false, message: '아이디와 비밀번호를 입력해주세요.' };
        }

        const users = getFromStorage(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.id === id && u.password === password);

        if (!user) {
            return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
        }

        // 현재 사용자 정보 저장 (비밀번호 제외)
        const currentUser = {
            id: user.id,
            role: user.role,
            name: user.name,
            loginAt: getCurrentTimestamp()
        };
        setToStorage(STORAGE_KEYS.CURRENT_USER, currentUser);

        return {
            success: true,
            message: '로그인 성공',
            user: currentUser
        };
    },

    /**
     * 로그아웃
     * @returns {{success: boolean, message: string}}
     */
    logout() {
        removeFromStorage(STORAGE_KEYS.CURRENT_USER);
        return { success: true, message: '로그아웃 되었습니다.' };
    },

    /**
     * 현재 로그인한 사용자 정보 반환
     * @returns {object|null} 현재 사용자 정보 또는 null
     */
    getCurrentUser() {
        return getFromStorage(STORAGE_KEYS.CURRENT_USER);
    },

    /**
     * 현재 사용자가 관리자인지 확인
     * @returns {boolean} 관리자 여부
     */
    isAdmin() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.role === 'admin';
    },

    /**
     * 현재 사용자가 후보자인지 확인
     * @returns {boolean} 후보자 여부
     */
    isCandidate() {
        const currentUser = this.getCurrentUser();
        return currentUser && currentUser.role === 'candidate';
    },

    /**
     * 로그인 상태 확인
     * @returns {boolean} 로그인 여부
     */
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    /**
     * 권한 확인
     * @param {string} requiredRole - 필요한 권한 ('admin' | 'candidate')
     * @returns {boolean} 권한 보유 여부
     */
    hasPermission(requiredRole) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        return currentUser.role === requiredRole;
    }
};


// ============================================================
// 6. 문제 모듈
// ============================================================

const ProblemModule = {
    /**
     * 모든 문제 목록 조회 (후보자용)
     * @returns {Array} 문제 목록
     */
    getAllProblems() {
        return getFromStorage(STORAGE_KEYS.PROBLEMS) || [];
    },

    /**
     * 특정 문제 조회 (후보자용)
     * @param {number} problemId - 문제 ID
     * @returns {object|null} 문제 데이터 또는 null
     */
    getProblem(problemId) {
        const problems = this.getAllProblems();
        return problems.find(p => p.id === problemId) || null;
    },

    /**
     * 문제 목록 조회 (관리자용 - 채점기준 포함)
     * @returns {Array} 문제 목록 (채점기준 포함)
     */
    getProblemsForAdmin() {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to admin problems');
            return [];
        }
        return getFromStorage(STORAGE_KEYS.PROBLEMS_ADMIN) || [];
    },

    /**
     * 특정 문제의 채점 기준 조회 (관리자용)
     * @param {number} problemId - 문제 ID
     * @returns {object|null} 채점 기준 데이터 또는 null
     */
    getGradingCriteria(problemId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to grading criteria');
            return null;
        }
        const adminProblems = getFromStorage(STORAGE_KEYS.PROBLEMS_ADMIN) || [];
        return adminProblems.find(p => p.id === problemId) || null;
    }
};


// ============================================================
// 7. 제출 잠금 모듈
// ============================================================

const SubmissionModule = {
    /**
     * 제출 키 생성
     * @param {string} userId - 사용자 ID
     * @param {number} problemId - 문제 ID
     * @returns {string} 제출 키
     */
    _getSubmissionKey(userId, problemId) {
        return `${userId}_${problemId}`;
    },

    /**
     * 답안 임시 저장
     * @param {number} problemId - 문제 ID
     * @param {string|object} answer - 답안 내용
     * @param {string} subId - 소문항 ID (예: '1-1', '1-2')
     * @returns {{success: boolean, message: string}}
     */
    saveAnswer(problemId, answer, subId = null) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        // 이미 제출된 문제인지 확인
        if (this.isSubmitted(problemId)) {
            return { success: false, message: '이미 제출된 문제입니다.' };
        }

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        const key = this._getSubmissionKey(currentUser.id, problemId);

        // 기존 제출 데이터 가져오기 또는 새로 생성
        if (!submissions[key]) {
            submissions[key] = {
                userId: currentUser.id,
                problemId: problemId,
                answers: {},
                isSubmitted: false,
                createdAt: getCurrentTimestamp()
            };
        }

        // 소문항별 답안 저장
        if (subId) {
            submissions[key].answers[subId] = answer;
        } else {
            submissions[key].answers['main'] = answer;
        }

        submissions[key].lastSavedAt = getCurrentTimestamp();

        setToStorage(STORAGE_KEYS.SUBMISSIONS, submissions);
        return { success: true, message: '저장되었습니다.' };
    },

    /**
     * 답안 최종 제출
     * @param {number} problemId - 문제 ID
     * @param {string|object} answer - 최종 답안 (선택적)
     * @param {string} subId - 소문항 ID (선택적)
     * @returns {{success: boolean, message: string}}
     */
    submitAnswer(problemId, answer = null, subId = null) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) {
            return { success: false, message: '로그인이 필요합니다.' };
        }

        // 이미 제출된 문제인지 확인
        if (this.isSubmitted(problemId)) {
            return { success: false, message: '이미 제출된 문제입니다. 다시 제출할 수 없습니다.' };
        }

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        const key = this._getSubmissionKey(currentUser.id, problemId);

        // 기존 저장 데이터가 있으면 업데이트, 없으면 새로 생성
        if (!submissions[key]) {
            submissions[key] = {
                userId: currentUser.id,
                problemId: problemId,
                answers: {},
                createdAt: getCurrentTimestamp()
            };
        }

        // 최종 답안 저장 (제공된 경우)
        if (answer !== null) {
            if (subId) {
                submissions[key].answers[subId] = answer;
            } else {
                submissions[key].answers['main'] = answer;
            }
        }

        // 제출 완료 상태로 변경 (핵심 잠금 로직)
        submissions[key].isSubmitted = true;
        submissions[key].submittedAt = getCurrentTimestamp();

        setToStorage(STORAGE_KEYS.SUBMISSIONS, submissions);

        return {
            success: true,
            message: '제출이 완료되었습니다. 이 문제는 더 이상 열람할 수 없습니다.'
        };
    },

    /**
     * 문제가 제출되었는지 확인 (핵심 잠금 체크)
     * @param {number} problemId - 문제 ID
     * @returns {boolean} 제출 완료 여부
     */
    isSubmitted(problemId) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) return false;

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        const key = this._getSubmissionKey(currentUser.id, problemId);

        return submissions[key]?.isSubmitted === true;
    },

    /**
     * 특정 문제의 제출 정보 조회
     * @param {number} problemId - 문제 ID
     * @returns {object|null} 제출 정보 또는 null
     */
    getSubmission(problemId) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) return null;

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        const key = this._getSubmissionKey(currentUser.id, problemId);

        return submissions[key] || null;
    },

    /**
     * 현재 사용자의 모든 제출 정보 조회
     * @returns {Array} 제출 정보 배열
     */
    getMySubmissions() {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) return [];

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        return Object.values(submissions).filter(s => s.userId === currentUser.id);
    },

    /**
     * 문제 접근 가능 여부 확인
     * 제출된 문제는 접근 불가
     * @param {number} problemId - 문제 ID
     * @returns {{canAccess: boolean, reason: string}}
     */
    canAccessProblem(problemId) {
        const currentUser = AuthModule.getCurrentUser();
        if (!currentUser) {
            return { canAccess: false, reason: '로그인이 필요합니다.' };
        }

        if (currentUser.role !== 'candidate') {
            return { canAccess: false, reason: '후보자만 문제에 접근할 수 있습니다.' };
        }

        if (this.isSubmitted(problemId)) {
            return { canAccess: false, reason: '이미 제출한 문제입니다. 다시 열람할 수 없습니다.' };
        }

        return { canAccess: true, reason: '' };
    }
};


// ============================================================
// 8. 집계 모듈 (관리자용)
// ============================================================

const AdminModule = {
    /**
     * 모든 제출 정보 조회
     * @returns {Array} 모든 제출 정보 배열
     */
    getAllSubmissions() {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to all submissions');
            return [];
        }

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        return Object.values(submissions);
    },

    /**
     * 특정 사용자의 제출 정보 조회
     * @param {string} userId - 사용자 ID
     * @returns {Array} 해당 사용자의 제출 정보 배열
     */
    getSubmissionsByUser(userId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to user submissions');
            return [];
        }

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        return Object.values(submissions).filter(s => s.userId === userId);
    },

    /**
     * 특정 문제의 모든 제출 정보 조회
     * @param {number} problemId - 문제 ID
     * @returns {Array} 해당 문제의 제출 정보 배열
     */
    getSubmissionsByProblem(problemId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to problem submissions');
            return [];
        }

        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        return Object.values(submissions).filter(s => s.problemId === problemId);
    },

    /**
     * 채점 결과 저장
     * @param {string} userId - 사용자 ID
     * @param {number} problemId - 문제 ID
     * @param {number} score - 점수 (0-100)
     * @param {Array<string>} weaknessTags - 취약점 태그 배열
     * @param {string} feedback - 피드백 내용
     * @returns {{success: boolean, message: string}}
     */
    saveGrade(userId, problemId, score, weaknessTags = [], feedback = '') {
        if (!AuthModule.isAdmin()) {
            return { success: false, message: '관리자 권한이 필요합니다.' };
        }

        const currentUser = AuthModule.getCurrentUser();
        const grades = getFromStorage(STORAGE_KEYS.GRADES) || {};
        const key = `${userId}_${problemId}`;

        grades[key] = {
            userId: userId,
            problemId: problemId,
            score: Math.min(100, Math.max(0, score)), // 0-100 범위 제한
            weaknessTags: weaknessTags,
            feedback: feedback,
            gradedAt: getCurrentTimestamp(),
            gradedBy: currentUser.id
        };

        setToStorage(STORAGE_KEYS.GRADES, grades);
        return { success: true, message: '채점 결과가 저장되었습니다.' };
    },

    /**
     * 특정 사용자의 채점 결과 조회
     * @param {string} userId - 사용자 ID
     * @returns {Array} 채점 결과 배열
     */
    getGradesByUser(userId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to grades');
            return [];
        }

        const grades = getFromStorage(STORAGE_KEYS.GRADES) || {};
        return Object.values(grades).filter(g => g.userId === userId);
    },

    /**
     * 특정 문제의 채점 결과 조회
     * @param {number} problemId - 문제 ID
     * @returns {Array} 채점 결과 배열
     */
    getGradesByProblem(problemId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to grades');
            return [];
        }

        const grades = getFromStorage(STORAGE_KEYS.GRADES) || {};
        return Object.values(grades).filter(g => g.problemId === problemId);
    },

    /**
     * 취약점 통계 조회
     * @returns {object} 취약점별 발생 빈도
     */
    getWeaknessStats() {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to weakness stats');
            return {};
        }

        const grades = getFromStorage(STORAGE_KEYS.GRADES) || {};
        const stats = {};

        Object.values(grades).forEach(grade => {
            if (grade.weaknessTags && Array.isArray(grade.weaknessTags)) {
                grade.weaknessTags.forEach(tag => {
                    stats[tag] = (stats[tag] || 0) + 1;
                });
            }
        });

        return stats;
    },

    /**
     * 후보자 목록 조회 (채점 현황 포함)
     * @returns {Array} 후보자 목록
     */
    getCandidateList() {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to candidate list');
            return [];
        }

        const users = getFromStorage(STORAGE_KEYS.USERS) || [];
        const submissions = getFromStorage(STORAGE_KEYS.SUBMISSIONS) || {};
        const grades = getFromStorage(STORAGE_KEYS.GRADES) || {};
        const problems = getFromStorage(STORAGE_KEYS.PROBLEMS) || [];

        const candidates = users.filter(u => u.role === 'candidate');

        return candidates.map(candidate => {
            // 제출 현황 집계
            const userSubmissions = Object.values(submissions)
                .filter(s => s.userId === candidate.id && s.isSubmitted);

            // 채점 현황 집계
            const userGrades = Object.values(grades)
                .filter(g => g.userId === candidate.id);

            // 평균 점수 계산
            const avgScore = userGrades.length > 0
                ? userGrades.reduce((sum, g) => sum + g.score, 0) / userGrades.length
                : null;

            return {
                id: candidate.id,
                name: candidate.name,
                submittedCount: userSubmissions.length,
                totalProblems: problems.length,
                gradedCount: userGrades.length,
                averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null
            };
        });
    },

    /**
     * 특정 후보자의 상세 정보 조회
     * @param {string} userId - 사용자 ID
     * @returns {object|null} 후보자 상세 정보
     */
    getCandidateDetail(userId) {
        if (!AuthModule.isAdmin()) {
            console.error('Unauthorized access to candidate detail');
            return null;
        }

        const users = getFromStorage(STORAGE_KEYS.USERS) || [];
        const user = users.find(u => u.id === userId && u.role === 'candidate');

        if (!user) return null;

        const submissions = this.getSubmissionsByUser(userId);
        const grades = this.getGradesByUser(userId);
        const problems = ProblemModule.getAllProblems();

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
    }
};


// ============================================================
// 9. 페이지 접근 제어 모듈
// ============================================================

const AccessControl = {
    /**
     * 로그인 필요 페이지 체크
     * @returns {boolean} 접근 가능 여부
     */
    requireLogin() {
        if (!AuthModule.isLoggedIn()) {
            console.warn('Login required. Redirecting to login page.');
            return false;
        }
        return true;
    },

    /**
     * 관리자 전용 페이지 체크
     * @returns {boolean} 접근 가능 여부
     */
    requireAdmin() {
        if (!this.requireLogin()) return false;
        if (!AuthModule.isAdmin()) {
            console.warn('Admin permission required.');
            return false;
        }
        return true;
    },

    /**
     * 후보자 전용 페이지 체크
     * @returns {boolean} 접근 가능 여부
     */
    requireCandidate() {
        if (!this.requireLogin()) return false;
        if (!AuthModule.isCandidate()) {
            console.warn('Candidate permission required.');
            return false;
        }
        return true;
    },

    /**
     * 문제 페이지 접근 체크 (제출 잠금 포함)
     * @param {number} problemId - 문제 ID
     * @returns {{canAccess: boolean, reason: string}}
     */
    checkProblemAccess(problemId) {
        if (!this.requireCandidate()) {
            return { canAccess: false, reason: '후보자만 접근할 수 있습니다.' };
        }
        return SubmissionModule.canAccessProblem(problemId);
    }
};


// ============================================================
// 10. API 인터페이스 (외부 노출용)
// ============================================================

const TBSBackend = {
    // 초기화
    init: () => InitModule.initialize(),
    reset: () => InitModule.resetAll(),

    // 인증
    auth: {
        login: (id, password) => AuthModule.login(id, password),
        logout: () => AuthModule.logout(),
        getCurrentUser: () => AuthModule.getCurrentUser(),
        isAdmin: () => AuthModule.isAdmin(),
        isCandidate: () => AuthModule.isCandidate(),
        isLoggedIn: () => AuthModule.isLoggedIn()
    },

    // 문제
    problems: {
        getAll: () => ProblemModule.getAllProblems(),
        get: (problemId) => ProblemModule.getProblem(problemId),
        getForAdmin: () => ProblemModule.getProblemsForAdmin(),
        getGradingCriteria: (problemId) => ProblemModule.getGradingCriteria(problemId)
    },

    // 제출 (핵심 잠금 로직)
    submissions: {
        save: (problemId, answer, subId) => SubmissionModule.saveAnswer(problemId, answer, subId),
        submit: (problemId, answer, subId) => SubmissionModule.submitAnswer(problemId, answer, subId),
        isSubmitted: (problemId) => SubmissionModule.isSubmitted(problemId),
        get: (problemId) => SubmissionModule.getSubmission(problemId),
        getMine: () => SubmissionModule.getMySubmissions(),
        canAccess: (problemId) => SubmissionModule.canAccessProblem(problemId)
    },

    // 관리자 기능
    admin: {
        getAllSubmissions: () => AdminModule.getAllSubmissions(),
        getSubmissionsByUser: (userId) => AdminModule.getSubmissionsByUser(userId),
        getSubmissionsByProblem: (problemId) => AdminModule.getSubmissionsByProblem(problemId),
        saveGrade: (userId, problemId, score, tags, feedback) =>
            AdminModule.saveGrade(userId, problemId, score, tags, feedback),
        getGradesByUser: (userId) => AdminModule.getGradesByUser(userId),
        getGradesByProblem: (problemId) => AdminModule.getGradesByProblem(problemId),
        getWeaknessStats: () => AdminModule.getWeaknessStats(),
        getCandidateList: () => AdminModule.getCandidateList(),
        getCandidateDetail: (userId) => AdminModule.getCandidateDetail(userId)
    },

    // 접근 제어
    access: {
        requireLogin: () => AccessControl.requireLogin(),
        requireAdmin: () => AccessControl.requireAdmin(),
        requireCandidate: () => AccessControl.requireCandidate(),
        checkProblemAccess: (problemId) => AccessControl.checkProblemAccess(problemId)
    },

    // 유틸리티
    utils: {
        escapeHtml: (str) => escapeHtml(str),
        getCurrentTimestamp: () => getCurrentTimestamp()
    },

    // 상수
    STORAGE_KEYS: STORAGE_KEYS
};


// ============================================================
// 11. 전역 등록 및 자동 초기화
// ============================================================

// 브라우저 환경에서 전역 객체로 등록
if (typeof window !== 'undefined') {
    window.TBSBackend = TBSBackend;

    // DOM 로드 완료 시 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            TBSBackend.init();
        });
    } else {
        TBSBackend.init();
    }
}

// ES 모듈 환경 지원
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TBSBackend;
}


// ============================================================
// 12. 사용 예시 (주석)
// ============================================================

/*
// 1. 로그인
const result = TBSBackend.auth.login('jahyun', 'pass1');
if (result.success) {
    console.log('로그인 성공:', result.user);
}

// 2. 문제 목록 조회
const problems = TBSBackend.problems.getAll();
console.log('문제 목록:', problems);

// 3. 문제 접근 가능 여부 확인
const accessCheck = TBSBackend.submissions.canAccess(1);
if (accessCheck.canAccess) {
    // 문제 내용 표시
} else {
    console.log('접근 불가:', accessCheck.reason);
}

// 4. 답안 임시 저장
TBSBackend.submissions.save(1, '답안 내용...', '1-1');

// 5. 답안 최종 제출
const submitResult = TBSBackend.submissions.submit(1);
console.log(submitResult.message);

// 6. 제출 여부 확인 (새로고침/뒤로가기 시)
if (TBSBackend.submissions.isSubmitted(1)) {
    // 문제 렌더링 차단, "제출 완료" 메시지만 표시
}

// 7. 관리자: 후보자 목록 조회
if (TBSBackend.auth.isAdmin()) {
    const candidates = TBSBackend.admin.getCandidateList();
    console.log('후보자 목록:', candidates);
}

// 8. 관리자: 채점 결과 저장
TBSBackend.admin.saveGrade('jahyun', 1, 85, ['계산 오류', '참고자료 누락'], '전반적으로 양호함');

// 9. 관리자: 취약점 통계 조회
const stats = TBSBackend.admin.getWeaknessStats();
console.log('취약점 통계:', stats);
*/
