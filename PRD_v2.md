# TBS 테스트 웹앱 PRD v2.0 - 문제 화면 개선판
# (Product Requirements Document)

## 문서 개정 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2026-02-01 | Product Manager | 최초 작성 |
| 2.0 | 2026-02-02 | Product Manager | 문제 화면 개선 (보기 분리, 편집 가능 테이블, 참고자료 전체 노출) |

---

## 변경 요약 (v1.0 → v2.0)

### 주요 개선 사항
1. **보기(View) 표시 개선**: 문제 화면에 복수의 보기를 각각 분리하여 표시
2. **편집 가능 테이블**: Word/Excel 보기를 HTML 테이블로 렌더링하고, 입력 가능 셀만 input 필드로 변환
3. **참고자료 전체 노출**: 아코디언 형태로 모든 참고자료를 문제 화면에 직접 노출
4. **데이터 구조 변경**: `views` 필드 추가, `answer` 구조 개선

---

## 1. 제품 개요

### 1.1 제품 비전 및 미션
인턴 후보자의 업무 역량을 평가하기 위한 시나리오 기반 테스트 플랫폼으로, 실무와 유사한 환경에서 문제 해결 능력과 데이터 분석 역량을 객관적으로 평가한다.

### 1.2 프로젝트 배경 및 목적
- **배경**: 인턴 채용 시 실무 역량을 효과적으로 평가할 수 있는 표준화된 테스트 도구 필요
- **목적**:
  - 후보자가 제한된 시간 내에 2문제를 풀고 제출할 수 있는 웹 기반 테스트 환경 제공
  - 관리자가 후보자의 성적과 취약점을 진단할 수 있는 채점 시스템 구축
  - 서버 없이 로컬 환경에서 즉시 실행 가능한 단일 파일 형태의 경량화된 솔루션 제공
  - **[NEW] 실무와 동일한 테이블 편집 경험 제공 (Excel/Word 직접 편집 시뮬레이션)**

### 1.3 성공 지표 (KPIs)
- **시스템 안정성**: 제출 후 재열람 차단율 100% (새로고침/뒤로가기/직접 접근 모두 차단)
- **보안성**: 후보자 화면에 정답/해설/채점기준 노출 건수 0건
- **사용성**: 관리자의 평균 채점 소요 시간 문제당 5분 이내
- **실행 편의성**: 로컬 실행 성공률 100% (별도 서버 설정 불필요)
- **[NEW] 사용자 만족도**: 후보자가 참고자료를 찾기 위한 평균 클릭 횟수 1회 이하 (아코디언 직접 노출)**
- **[NEW] 답안 입력 오류율**: 테이블 셀 입력 오류 건수 0건 (명확한 input 필드 구분)**

### 1.4 범위 및 제약 조건
- **기술 범위**: 단일 HTML 파일 (index_pdf.html), JavaScript, localStorage 기반
- **기능 범위**: 로그인, 문제 풀이, 제출, 관리자 채점 기능만 포함
- **제약 조건**:
  - 서버 없이 동작 (백엔드 API 없음)
  - localStorage를 활용한 데이터 관리
  - OpenRouter API는 관리자 채점 시에만 사용
  - **[UPDATED] 참고자료는 아코디언 형태로 문제 화면에 직접 노출 (별도 모달 불필요)**
  - **[NEW] Word/Excel 파일은 HTML 테이블로 변환하여 렌더링 (SheetJS, Mammoth.js 활용)**

---

## 2. 사용자 요구사항

### 2.1 타겟 사용자 페르소나

#### 페르소나 1: 후보자 (Candidate)
- **역할**: 인턴 지원자
- **목표**: 주어진 문제를 정확하게 이해하고 제한 시간 내에 답안 작성 및 제출
- **니즈**:
  - 문제 내용과 참고자료를 명확하게 확인
  - **[NEW] 복수의 보기를 각각 명확하게 구분하여 확인**
  - **[NEW] 테이블 형태의 보기를 실무와 동일하게 편집**
  - **[NEW] 모든 참고자료를 한 화면에서 빠르게 탐색**
  - 답안 작성 중 중간 저장 가능
  - 제출 후 실수로 답안이 노출되지 않도록 보호
- **기술 수준**: 기본적인 웹 브라우저 사용 능력
- **[NEW] 페인 포인트**:
  - 기존: 여러 보기가 혼재되어 어떤 자료를 참조해야 하는지 혼란
  - 기존: 참고자료를 찾기 위해 모달을 반복 열어야 함
  - 기존: 테이블 편집 시 입력 가능 셀과 읽기 전용 셀 구분 어려움

#### 페르소나 2: 관리자 (Admin)
- **역할**: 인사담당자 또는 평가자
- **목표**: 후보자의 답안을 효율적으로 채점하고 역량 평가
- **니즈**:
  - 모든 후보자의 제출 현황 한눈에 확인
  - AI 기반 자동 채점 보조 기능
  - 후보자별 취약점 진단 및 성적 요약
  - **[NEW] 후보자가 입력한 테이블 데이터를 정답과 비교**
- **기술 수준**: 중급 이상의 웹 애플리케이션 사용 능력

### 2.2 사용자 시나리오 및 유스케이스

#### UC-01: 후보자 로그인 및 문제 확인
1. 후보자가 브라우저에서 index_pdf.html 파일을 실행
2. 계정ID와 비밀번호를 입력하여 로그인
3. 문제 목록 화면에서 2개의 문제 확인 (문제1, 문제2)
4. 각 문제의 제목과 진행 상태 (미제출/제출완료) 표시

#### UC-02: 문제 풀이 및 보기 확인 **[UPDATED]**
1. 문제 목록에서 특정 문제 선택
2. 문제 내용 화면에 문제 지문 표시
3. **[NEW] 복수의 보기가 있는 경우, 각 보기를 별도 섹션으로 분리 표시**
   - 문제 1번: "[1번 보기]", "[2번 보기]" 제목으로 구분
   - 문제 2번: "[보기]" 단일 섹션
4. **[NEW] 보기가 테이블인 경우, HTML 테이블로 렌더링**
   - 입력 가능 셀: `<input>` 필드로 표시 (배경색 강조)
   - 읽기 전용 셀: 일반 텍스트로 표시
5. **[NEW] 참고자료 아코디언 섹션에서 모든 참고자료 확인**
   - 클릭하면 펼쳐지고, 다시 클릭하면 접힘
   - 문제 1번: 6개 참고자료 (텍스트 3개, Excel 3개)
   - 문제 2번: 5개 참고자료 (텍스트 2개, Excel 3개)
6. 테이블 셀에 직접 답안 입력 또는 자유 서술형 답안 작성
7. "임시 저장" 버튼으로 중간 저장 (localStorage에 저장)

#### UC-03: 답안 제출 및 잠금
1. 답안 작성 완료 후 "제출하기" 버튼 클릭
2. "제출 시 다시 볼 수 없습니다" 경고 모달 표시
3. 최종 확인 후 제출
4. localStorage에 제출 상태 (isSubmitted: true) 및 **[NEW] 테이블 셀 답안 데이터** 저장
5. "제출 완료" 화면으로 자동 이동
6. 이후 해당 문제 접근 시 문제/참고자료/답안 모두 렌더링 차단, "제출 완료" 메시지만 표시

#### UC-04: 관리자 채점 및 취약점 진단
1. 관리자가 admin 계정으로 로그인
2. 관리자 대시보드 진입
3. 후보자 목록에서 특정 후보자 선택
4. 후보자의 제출된 답안 확인
   - **[NEW] 테이블 답안의 경우, 셀별 입력값을 정답과 비교 테이블로 표시**
5. "AI 채점" 버튼 클릭 시 OpenRouter API 호출하여 자동 채점
6. 채점 결과 (점수, 취약점 태그) 확인 및 수동 조정
7. 최종 성적 저장

### 2.3 사용자 여정 맵

```
[후보자 여정 - v2.0]
로그인 → 문제 목록 → 문제 선택 → [NEW] 보기 1/2 확인 → [NEW] 참고자료 아코디언 탐색
→ [NEW] 테이블 셀 입력 → 임시 저장 (반복) → 최종 제출 → 제출 완료

[관리자 여정]
로그인 → Admin 대시보드 → 후보자 선택 → [NEW] 테이블 답안 비교 → AI 채점 → 결과 검토 및 조정 → 성적 저장
```

---

## 3. 기능 명세

### 3.1 핵심 기능 목록 (우선순위)

| 우선순위 | 기능 ID | 기능 명 | 설명 | 변경 |
|---------|---------|---------|------|------|
| Must | F-01 | 로그인 시스템 | 계정ID/비밀번호 기반 인증, 권한별 화면 분기 | - |
| Must | F-02 | 문제 목록 화면 | 후보자에게 2개 문제 목록 표시, 제출 상태 표시 | - |
| Must | F-03 | 문제 풀이 화면 | 문제 지문, 답안 입력란, 임시 저장/제출 버튼 | **[UPDATED]** |
| Must | **F-03A** | **복수 보기 표시** | **문제별 보기를 개별 섹션으로 분리 표시** | **[NEW]** |
| Must | **F-03B** | **편집 가능 테이블 렌더링** | **Word/Excel 보기를 HTML 테이블로 변환, 입력 셀 구분** | **[NEW]** |
| Must | **F-04** | **참고자료 아코디언** | **모든 참고자료를 아코디언 형태로 문제 화면에 노출** | **[UPDATED]** |
| Must | F-05 | 제출 잠금 메커니즘 | 제출 후 문제/답안/참고자료 렌더링 차단 | - |
| Must | F-06 | Admin 대시보드 | 후보자별 성적/취약점 요약 화면 | - |
| Must | F-07 | AI 기반 채점 | OpenRouter API 연동 자동 채점 | **[UPDATED]** |
| Should | F-08 | 임시 저장 기능 | 답안 작성 중 자동/수동 저장 | **[UPDATED]** |
| Could | F-09 | 제출 시간 기록 | 문제별 제출 시각 저장 | - |
| Could | F-10 | 채점 기준 표시 (Admin) | 관리자 화면에만 채점 기준 표시 | - |

### 3.2 상세 기능 요구사항

#### F-01: 로그인 시스템
- **설명**: 계정정보.xlsx 기반 사용자 인증
- **입력**: 계정ID (String), 비밀번호 (String)
- **출력**: 인증 성공 시 권한별 메인 화면 이동
- **수용 기준**:
  - 계정ID와 비밀번호가 일치하는 경우에만 로그인 성공
  - 권한이 "일반"인 경우 후보자 화면으로 이동
  - 권한이 "관리자"인 경우 Admin 대시보드로 이동
  - 인증 실패 시 "아이디 또는 비밀번호가 일치하지 않습니다" 메시지 표시
  - localStorage에 현재 로그인 사용자 정보 저장 (sessionId 형태)

#### F-02: 문제 목록 화면 (후보자)
- **설명**: 총 2개의 문제 목록을 카드 형태로 표시
- **표시 정보**: 문제 번호, 제목, 제출 상태 (미제출/제출완료)
- **수용 기준**:
  - 문제 1번: "SaaS 서비스 사용료 정산 오류 검수"
  - 문제 2번: "미디어 사업 사용료 정산서 작성"
  - 제출 완료된 문제는 "제출 완료" 배지 표시
  - 미제출 문제는 "답안 작성하기" 버튼 표시
  - 제출 완료 문제 클릭 시 "제출 완료" 메시지만 표시 (문제 내용 차단)

#### F-03: 문제 풀이 화면 **[UPDATED]**
- **설명**: 문제 지문, 복수 보기, 참고자료 아코디언, 답안 입력란, 제출 버튼 구성
- **구성 요소**:
  - **문제 지문 영역**: [문제]문항.txt 내용 표시
  - **[NEW] 보기 영역**: F-03A, F-03B 참조
  - **[NEW] 참고자료 아코디언**: F-04 참조
  - **답안 입력란**:
    - 문제 1-1 (요구사항 1): 편집 가능 테이블 (1번 보기) - 정산서 수정
    - 문제 1-2 (요구사항 2): 편집 가능 테이블 (2번 보기) - 검수방법 선택
    - 문제 2-1 (요구사항 1): 편집 가능 테이블 (보기) - 정산서 작성
    - 문제 2-2 (요구사항 2): 텍스트 입력 (자유 서술형) - 세금계산서 발행 금액
  - **임시 저장 버튼**: localStorage에 테이블 데이터 포함 전체 답안 저장
  - **제출하기 버튼**: 최종 제출 (F-05 트리거)
- **수용 기준**:
  - 답안 입력란은 문제 유형에 따라 동적 렌더링
  - **[NEW] 테이블 셀 입력값은 실시간으로 answer.views 객체에 반영**
  - 임시 저장 시 "저장되었습니다" 토스트 메시지
  - 제출 전 "제출 후 다시 볼 수 없습니다" 경고 모달
  - 제출 완료 문제는 본 화면 접근 차단

#### F-03A: 복수 보기 표시 **[NEW]**
- **설명**: 문제별로 제공되는 보기를 각각 분리된 섹션으로 표시
- **문제 1번 보기 구성**:
  - **[1번 보기]**: [문제]1번보기.docx (정산서 - 편집 가능 테이블)
    - 파일 형식: Word 문서 (.docx)
    - 내용: 3월 사용료 정산서 (오류 포함)
    - 렌더링 방식: HTML 테이블로 변환 (Mammoth.js 활용)
  - **[2번 보기]**: [문제]2번보기.xlsx (검수방법 선택표)
    - 파일 형식: Excel 스프레드시트 (.xlsx)
    - 내용: 오류 항목별 검수방법 선택 테이블
    - 렌더링 방식: HTML 테이블로 변환 (SheetJS 활용)
- **문제 2번 보기 구성**:
  - **[보기]**: [문제]보기.xlsx (정산서 양식 - 편집 가능 테이블)
    - 파일 형식: Excel 스프레드시트 (.xlsx)
    - 내용: 빈 정산서 양식 (후보자가 작성)
    - 렌더링 방식: HTML 테이블로 변환 (SheetJS 활용)
- **수용 기준**:
  - 각 보기는 명확한 제목 (예: "1번 보기", "2번 보기")과 구분선으로 분리
  - 보기 순서는 문제에서 요구하는 순서와 일치
  - 보기가 1개인 경우 "[보기]" 제목 사용
  - 보기가 2개 이상인 경우 "[N번 보기]" 제목 사용
  - 각 보기의 원본 파일명을 부제목으로 표시 (예: "파일: [문제]1번보기.docx")

#### F-03B: 편집 가능 테이블 렌더링 **[NEW]**
- **설명**: Word/Excel 보기를 HTML 테이블로 변환하고, 답안 입력이 필요한 셀만 input 필드로 변환
- **렌더링 프로세스**:
  1. **파일 파싱**:
     - Word (.docx): Mammoth.js를 사용하여 테이블 추출
     - Excel (.xlsx): SheetJS를 사용하여 시트 데이터 읽기
  2. **테이블 HTML 생성**:
     - `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>` 구조로 변환
     - 셀 병합 (colspan, rowspan) 정보 유지
  3. **입력 셀 식별 및 변환**:
     - **입력 가능 셀**: 정답 파일과 비교하여 값이 다른 셀 또는 빈 셀
     - **읽기 전용 셀**: 고정된 레이블, 헤더, 계산식 결과 등
     - 입력 가능 셀은 `<input type="text" data-cell="A1">` 형태로 변환
     - 읽기 전용 셀은 `<td class="readonly">텍스트</td>` 형태로 유지
  4. **스타일링**:
     - 입력 가능 셀: 배경색 #FFFACD (연한 노란색), 테두리 강조
     - 읽기 전용 셀: 배경색 #F5F5F5 (회색), 기본 테두리
     - 헤더 셀: 배경색 #4A90E2 (파란색), 폰트 굵게
- **셀 주소 체계**:
  - Excel 스타일 주소 사용: A1, B2, C3, ...
  - 행: 1부터 시작 (1, 2, 3, ...)
  - 열: A부터 시작 (A, B, C, ...)
  - 예: 2행 3열 → C2
- **입력 셀 기준** (문제별 상세):
  - **문제 1번 - 1번 보기 (정산서)**:
    - 입력 가능 셀: 사용료 금액 칼럼 (예: D3, D4, D5, ...)
    - 읽기 전용 셀: 항목명, 수량, 단가, 합계 등
  - **문제 1번 - 2번 보기 (검수방법 선택표)**:
    - 입력 가능 셀: 검수방법 선택 칼럼 (드롭다운 또는 텍스트 입력)
    - 읽기 전용 셀: 오류 항목명
  - **문제 2번 - 보기 (정산서 양식)**:
    - 입력 가능 셀: 모든 데이터 입력 셀 (광고채널, 집행비용, 매출 등)
    - 읽기 전용 셀: 헤더, 합계 라벨
- **수용 기준**:
  - Word/Excel 파일이 HTML 테이블로 정확하게 변환됨
  - 입력 가능 셀과 읽기 전용 셀이 시각적으로 명확히 구분됨
  - 입력 가능 셀에 타이핑 시 즉시 answer.views 객체에 반영됨
  - 테이블 레이아웃이 원본 파일과 최대한 유사하게 유지됨
  - 셀 병합, 정렬, 기본 서식이 HTML 테이블에 반영됨
  - 모바일 화면에서도 테이블이 스크롤 가능하도록 렌더링됨

#### F-04: 참고자료 아코디언 **[UPDATED]**
- **설명**: 문제별 모든 참고자료를 아코디언 형태로 문제 화면 하단에 표시
- **참고자료 목록**:
  - **문제 1번** (총 6개):
    1. [참고자료 #1] 사용료 정산매뉴얼.txt
    2. [참고자료 #2-1] 펀드레이징 상품주문 요청서(from 고객성공팀).txt
    3. [참고자료 #2-2] 확장서비스 상품주문 요청서(from 고객성공팀).txt
    4. [참고자료 #3-1] 2월 사용료(정산일 3월 5일) 정산이력.xlsx
    5. [참고자료 #3-2] 3월 사용료(정산일 4월 5일) 정산이력.xlsx
    6. [참고자료 #4] 상품목록.xlsx
  - **문제 2번** (총 5개):
    1. [참고자료 #1] 광고집행 매출 산출매뉴얼.txt
    2. [참고자료 #2] 광고집행비용(원가).xlsx
    3. [참고자료 #3] 광고집행담당자 소통이력.txt
    4. [참고자료 #4] 매체정의표.xlsx
    5. [참고자료 #5] 수수료율 정보.xlsx
- **아코디언 UI 구조**:
  ```html
  <div class="references-accordion">
    <div class="accordion-item">
      <div class="accordion-header" onclick="toggleAccordion(1)">
        <h4>📄 참고자료 #1: 사용료 정산매뉴얼</h4>
        <span class="icon">▼</span>
      </div>
      <div class="accordion-content" id="accordion-1">
        <!-- 파일 내용 렌더링 -->
      </div>
    </div>
    <!-- 반복 -->
  </div>
  ```
- **렌더링 방식**:
  - **txt 파일**: `<pre>` 태그로 텍스트 직접 렌더링
  - **xlsx 파일**: SheetJS로 HTML 테이블 변환하여 렌더링
  - **기본 상태**: 모든 아코디언 닫힘 (collapsed)
  - **클릭 동작**: 클릭하면 펼쳐지고(expand), 다시 클릭하면 접힘(collapse)
  - **다중 열기**: 여러 참고자료를 동시에 펼칠 수 있음
- **수용 기준**:
  - **[BREAKING CHANGE] 기존 모달 방식 제거, 아코디언으로 전면 대체**
  - 참고자료가 문제 화면에 직접 노출되어 별도 팝업 없이 탐색 가능
  - 아코디언 헤더에 참고자료 제목과 파일 형식 아이콘 표시
  - 클릭 시 부드러운 애니메이션 (expand/collapse transition 300ms)
  - 펼쳐진 참고자료는 스크롤 가능하도록 max-height 제한
  - txt 파일은 고정폭 폰트로 표시 (Courier New 또는 monospace)
  - xlsx 파일은 테이블 형태로 표시 (읽기 전용, input 필드 없음)
  - 모바일 화면에서도 아코디언이 정상 작동
  - 제출 완료 후 참고자료 아코디언 접근 차단

#### F-05: 제출 잠금 메커니즘 (DoD)
- **설명**: 제출 완료 시 해당 문제의 모든 콘텐츠 접근 차단
- **수용 기준**:
  - 제출 즉시 localStorage에 `submissions[userId][problemId].isSubmitted = true` 저장
  - **[NEW] 테이블 셀 답안 데이터 (answer.views) 함께 저장**
  - 제출 완료 후 다음 접근 시도 시:
    - 문제 지문 렌더링 차단
    - **[NEW] 보기 영역 렌더링 차단**
    - **[NEW] 참고자료 아코디언 렌더링 차단**
    - 답안 입력란 렌더링 차단
    - "제출 완료" 메시지만 화면에 표시
  - 새로고침, 뒤로가기, URL 직접 입력 모두 차단
  - 브라우저 개발자도구로 localStorage 수정 시에도 서버 검증 없이 클라이언트 검증만 수행 (보안 한계 인지)

#### F-06: Admin 대시보드
- **설명**: 관리자가 모든 후보자의 제출 현황과 성적을 확인
- **표시 정보**:
  - 후보자 목록 (계정ID, 이름, 제출 상태, 평균 점수)
  - 후보자 선택 시 상세 화면: 문제별 답안, 채점 결과, 취약점 태그
  - **[NEW] 테이블 답안의 경우, 셀별 입력값과 정답을 비교 테이블로 표시**
    - 예: A1 셀 - 후보자 답안: "10,000" / 정답: "12,000" (오답 강조)
- **수용 기준**:
  - 권한이 "일반"인 사용자는 Admin 대시보드 접근 차단
  - 후보자별 제출 완료 문제 수 표시 (예: 2/2)
  - 미채점 답안은 "채점 대기" 상태 표시
  - 채점 완료 답안은 점수와 취약점 태그 표시
  - **[NEW] 테이블 답안 비교 뷰 제공 (정답 대비 정확도 %)**

#### F-07: AI 기반 채점 **[UPDATED]**
- **설명**: OpenRouter API를 활용한 자동 채점 보조 기능
- **API 정보**:
  - 모델: tngtech/deepseek-r1t2-chimera:free
  - 입력: 문제 지문, 정답 예시, 후보자 답안
  - **[NEW] 테이블 답안의 경우, 셀별 데이터를 JSON 형태로 입력**
  - 출력: 점수 (0-100), 취약점 태그 (예: "계산 오류", "논리 비약")
- **수용 기준**:
  - "AI 채점" 버튼 클릭 시 API 호출
  - 채점 중 로딩 스피너 표시
  - 채점 결과를 관리자가 수동으로 조정 가능
  - API 호출 실패 시 "수동 채점으로 전환하세요" 안내 메시지
  - 후보자 화면에서는 절대 API 호출 불가 (API 키 노출 방지)
  - **[NEW] 테이블 답안의 경우, 셀별 정확도 계산 (일치 셀 수 / 전체 입력 셀 수)**

#### F-08: 임시 저장 기능 **[UPDATED]**
- **설명**: 답안 작성 중 자동/수동 저장
- **수용 기준**:
  - "임시 저장" 버튼 클릭 시 즉시 localStorage에 저장
  - **[NEW] 테이블 셀 입력값도 함께 저장 (answer.views 객체)**
  - 30초마다 자동 저장 (백그라운드)
  - 저장 성공 시 "저장되었습니다" 토스트 메시지 (3초 후 자동 사라짐)
  - **[NEW] 새로고침 후 복원 시 테이블 셀 값도 정확히 복원**

---

## 4. 데이터 모델

### 4.1 계정 정보 (Accounts)
```javascript
{
  id: "jahyun",           // 계정ID (String, Primary Key)
  password: "pass1",      // 비밀번호 (String)
  role: "candidate",      // 권한 (candidate | admin)
  name: "홍자현"          // 이름 (String)
}
```
- **초기 데이터 소스**: 계정정보.xlsx
- **매핑 규칙**:
  - 권한 "일반" → role: "candidate"
  - 권한 "관리자" → role: "admin"

### 4.2 문제 데이터 (Problems) **[UPDATED]**
```javascript
{
  id: 1,                         // 문제 ID (Number)
  title: "SaaS 서비스 사용료 정산 오류 검수",  // 제목
  content: "...",                // 문제 지문 (HTML String)

  // [NEW] 보기 배열 추가
  views: [
    {
      id: "view-1",              // 보기 ID (String, unique within problem)
      title: "1번 보기",         // 보기 제목
      fileName: "[문제]1번보기.docx",  // 원본 파일명
      type: "editable-table",    // 보기 유형 (editable-table | readonly-table | text)
      fileType: "docx",          // 파일 형식 (docx | xlsx | txt)

      // 테이블 데이터 구조 (편집 가능 테이블인 경우)
      tableData: {
        headers: ["항목", "수량", "단가", "사용료"],  // 헤더 행
        rows: [
          {
            cells: [
              { value: "기본서비스", readonly: true },
              { value: "1", readonly: true },
              { value: "50,000", readonly: true },
              { value: "", editable: true, address: "D3" }  // 입력 가능 셀
            ]
          },
          // 추가 행...
        ],
        editableCells: ["D3", "D4", "D5", "D6", "D7"]  // 입력 가능 셀 주소 목록
      },

      // 원본 파일 Base64 인코딩 (파싱용)
      fileContent: "Base64EncodedString..."
    },
    {
      id: "view-2",
      title: "2번 보기",
      fileName: "[문제]2번보기.xlsx",
      type: "editable-table",
      fileType: "xlsx",
      tableData: { /* ... */ },
      fileContent: "Base64EncodedString..."
    }
  ],

  // 참고자료 배열 (기존 유지)
  references: [
    {
      id: 1,
      title: "참고자료 #1: 사용료 정산매뉴얼",
      fileName: "[참고자료 #1] 사용료 정산매뉴얼.txt",
      type: "txt",               // txt | xlsx
      content: "...",            // txt는 텍스트, xlsx는 Base64
      // xlsx인 경우 렌더링용 테이블 데이터 추가
      tableData: {
        headers: [...],
        rows: [...]
      }
    },
    // 총 6개 (문제 1번) 또는 5개 (문제 2번)
  ],

  answerType: "mixed",           // [UPDATED] mixed (테이블 + 텍스트) | table | text
  correctAnswer: {               // [UPDATED] 정답 구조 변경
    views: {
      "view-1": {
        cells: {
          "D3": "50,000",
          "D4": "30,000",
          "D5": "20,000"
        }
      },
      "view-2": {
        cells: {
          "B3": "참고자료 대조",
          "B4": "계산식 검증"
        }
      }
    },
    text: "세금계산서 발행 금액: 110,000원"  // 자유 서술형 정답 (문제 2-2)
  },
  gradingCriteria: "..."         // 채점 기준 (Admin용)
}
```

**보기 유형 정의**:
- `editable-table`: 입력 가능한 테이블 (후보자가 셀에 값을 입력)
- `readonly-table`: 읽기 전용 테이블 (참고용, 입력 불가)
- `text`: 일반 텍스트 (txt 파일)

**문제별 보기 구성**:
- **문제 1번**:
  - `views[0]`: 1번 보기 (정산서) - editable-table, docx
  - `views[1]`: 2번 보기 (검수방법 선택표) - editable-table, xlsx
- **문제 2번**:
  - `views[0]`: 보기 (정산서 양식) - editable-table, xlsx

### 4.3 답안 데이터 (Submissions) **[UPDATED]**
```javascript
{
  userId: "jahyun",              // 후보자 계정ID
  problemId: 1,                  // 문제 ID

  // [UPDATED] 답안 구조 개선
  answer: {
    // 테이블 답안 (보기별 셀 데이터)
    views: {
      "view-1": {
        cells: {
          "D3": "50,000",        // 셀 주소: 입력값
          "D4": "30,000",
          "D5": "20,000",
          "D6": "15,000",
          "D7": "5,000"
        }
      },
      "view-2": {
        cells: {
          "B3": "참고자료 대조",
          "B4": "계산식 검증",
          "B5": "매뉴얼 확인"
        }
      }
    },

    // 자유 서술형 답안 (문제 2-2)
    text: "세금계산서 발행 금액: 110,000원\n부가세 포함 금액: 121,000원"
  },

  submittedAt: "2026-02-01T14:30:00",  // 제출 시각 (ISO 8601)
  isSubmitted: true,             // 제출 완료 여부 (Boolean)
  lastSavedAt: "2026-02-01T14:25:00"   // 마지막 임시 저장 시각
}
```

**셀 주소 규칙**:
- 열: A, B, C, D, ... (알파벳)
- 행: 1, 2, 3, 4, ... (숫자)
- 예시: A1 (1행 1열), B2 (2행 2열), D5 (5행 4열)

**데이터 검증 규칙**:
- 입력 가능 셀(`editableCells`)에 명시된 주소만 저장
- 읽기 전용 셀에 대한 입력은 무시
- 빈 셀은 빈 문자열(`""`)로 저장

### 4.4 채점 결과 (GradingResults) **[UPDATED]**
```javascript
{
  userId: "jahyun",
  problemId: 1,
  score: 85,                     // 점수 (0-100)

  // [NEW] 테이블 답안 평가 상세
  tableEvaluation: {
    "view-1": {
      totalCells: 5,             // 전체 입력 셀 수
      correctCells: 4,           // 정답 셀 수
      accuracy: 80,              // 정확도 (%)
      incorrectCells: [          // 오답 셀 목록
        {
          address: "D6",
          userAnswer: "15,000",
          correctAnswer: "18,000"
        }
      ]
    },
    "view-2": {
      totalCells: 3,
      correctCells: 2,
      accuracy: 66.7,
      incorrectCells: [
        {
          address: "B5",
          userAnswer: "매뉴얼 확인",
          correctAnswer: "계산 재검토"
        }
      ]
    }
  },

  weaknessTags: [                // 취약점 태그 배열
    "계산 오류",
    "참고자료 미활용"
  ],
  feedback: "...",               // 피드백 (선택 사항)
  gradedAt: "2026-02-01T15:00:00",  // 채점 시각
  gradedBy: "minchang"           // 채점자 계정ID
}
```

---

## 5. 화면 설계

### 5.1 문제 풀이 화면 와이어프레임 **[NEW]**

```
┌─────────────────────────────────────────────────────────────┐
│ 문제 1번: SaaS 서비스 사용료 정산 오류 검수                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ [문제 지문]                                                   │
│ 당신은 사업지원 인턴으로, SaaS 서비스 도너스의 월별 사용료를 │
│ 계산(정산)하는 업무를 맡고 있다. ...                          │
│                                                               │
│ 요구사항:                                                     │
│ 1. 제공된 정산서(3월분)를 기준으로, 계산이 잘못된 부분이 ...  │
│ 2. 같은 문제가 다시 발생하지 않도록, 각 오류가 나온 ...      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [1번 보기]                                        ▼ 접기/펼치기 │
│ 파일: [문제]1번보기.docx                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 3월 사용료 정산서                                       │ │
│ ├──────────┬──────┬──────┬──────────┤                     │ │
│ │ 항목     │ 수량 │ 단가 │ 사용료   │ (읽기전용: 회색)  │ │
│ ├──────────┼──────┼──────┼──────────┤                     │ │
│ │기본서비스│  1   │50,000│[입력필드]│ (입력가능: 노란색)│ │
│ │부가서비스│  2   │30,000│[입력필드]│                     │ │
│ │확장기능  │  1   │20,000│[입력필드]│                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [2번 보기]                                        ▼ 접기/펼치기 │
│ 파일: [문제]2번보기.xlsx                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 오류 항목별 검수방법 선택표                              │ │
│ ├──────────────────────┬──────────────────────┤           │ │
│ │ 오류 항목            │ 검수방법             │           │ │
│ ├──────────────────────┼──────────────────────┤           │ │
│ │ 기본서비스 사용료    │ [입력 또는 선택]     │           │ │
│ │ 부가서비스 사용료    │ [입력 또는 선택]     │           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│ [참고자료]                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ 📄 참고자료 #1: 사용료 정산매뉴얼                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▼ 📄 참고자료 #2-1: 펀드레이징 상품주문 요청서          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ [펼쳐진 내용]                                            │ │
│ │ 주문 상품: 펀드레이징 프리미엄                           │ │
│ │ 구독 기간: 12개월                                        │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ 📄 참고자료 #2-2: 확장서비스 상품주문 요청서          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ 📊 참고자료 #3-1: 2월 사용료 정산이력                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ 📊 참고자료 #3-2: 3월 사용료 정산이력                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ▶ 📊 참고자료 #4: 상품목록                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    [임시 저장]    [제출하기]                  │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 테이블 셀 스타일 가이드 **[NEW]**

| 셀 유형 | 배경색 | 테두리 | 폰트 | 커서 | 예시 |
|---------|--------|--------|------|------|------|
| 입력 가능 셀 | #FFFACD (연한 노란색) | 2px solid #FFD700 | 기본, 검정색 | text | `<input>` |
| 읽기 전용 셀 | #F5F5F5 (회색) | 1px solid #DDDDDD | 기본, 회색 | default | `<td>` |
| 헤더 셀 | #4A90E2 (파란색) | 1px solid #FFFFFF | 굵게, 흰색 | default | `<th>` |
| 오답 셀 (Admin) | #FFE6E6 (연한 빨강) | 2px solid #FF0000 | 기본, 빨강 | default | `<td class="incorrect">` |
| 정답 셀 (Admin) | #E6FFE6 (연한 초록) | 2px solid #00AA00 | 기본, 초록 | default | `<td class="correct">` |

### 5.3 참고자료 아코디언 UI 가이드 **[NEW]**

**아코디언 헤더**:
- 높이: 48px
- 배경색: #F8F9FA (닫힘), #E9ECEF (펼침)
- 폰트: 16px, 굵게
- 아이콘:
  - 📄 (txt 파일)
  - 📊 (xlsx 파일)
  - ▶ (닫힘)
  - ▼ (펼침)

**아코디언 컨텐츠**:
- 최대 높이: 400px (스크롤 가능)
- 배경색: #FFFFFF
- 패딩: 16px
- 애니메이션: max-height transition 300ms ease-in-out

**반응형 디자인**:
- 데스크톱: 전체 너비, 좌우 패딩 24px
- 태블릿: 전체 너비, 좌우 패딩 16px
- 모바일: 전체 너비, 좌우 패딩 12px, 테이블 가로 스크롤

---

## 6. 권한 체계

### 6.1 권한 정의

| 권한 | 역할 | 접근 가능 화면 | 제한 사항 |
|------|------|----------------|-----------|
| candidate | 후보자 | 로그인, 문제 목록, 문제 풀이, 제출 완료 | - Admin 대시보드 접근 불가<br>- 정답/채점기준 절대 노출 금지<br>- API 키 노출 금지<br>**[NEW] - 제출 후 보기/참고자료 접근 차단** |
| admin | 관리자 | 로그인, Admin 대시보드 | - 후보자 문제 풀이 화면 접근 불가<br>- Admin 대시보드만 접근 가능<br>**[NEW] - 테이블 정답 비교 뷰 제공** |

### 6.2 화면별 접근 제어

| 화면 | candidate | admin |
|------|-----------|-------|
| 로그인 화면 | O | O |
| 문제 목록 | O | X |
| 문제 풀이 화면 | O (제출 전) | X |
| **보기 영역** | **O (제출 전)** | **X** |
| **참고자료 아코디언** | **O (제출 전)** | **X** |
| 제출 완료 화면 | O (제출 후) | X |
| Admin 대시보드 | X | O |
| **테이블 답안 비교 뷰** | **X** | **O** |

### 6.3 데이터 접근 제어
- **후보자**: 자신의 답안 데이터만 읽기/쓰기 가능
- **관리자**: 모든 후보자의 답안 및 채점 결과 읽기/쓰기 가능
- **정답/채점기준**: 관리자만 접근 가능, 후보자 화면 JavaScript 코드에서 완전히 제거
- **[NEW] 보기 정답 데이터**: 후보자 화면에서 `correctAnswer.views` 객체 완전히 제거, 관리자 화면에만 포함

---

## 7. 비기능 요구사항

### 7.1 성능 요구사항
- **페이지 로딩 시간**: 초기 로딩 3초 이내
- **localStorage 읽기/쓰기**: 100ms 이내
- **API 응답 시간**: AI 채점 요청 시 15초 이내 (타임아웃 20초)
- **[NEW] 테이블 렌더링 시간**: Excel/Word 파일 파싱 및 HTML 변환 2초 이내
- **[NEW] 아코디언 애니메이션**: 펼침/접힘 전환 300ms 이내

### 7.2 보안 요구사항
- **정답 보호**: 후보자 화면 JavaScript 코드에 정답/채점기준 하드코딩 절대 금지
- **[NEW] 보기 정답 보호**: `correctAnswer.views` 객체는 관리자 화면에서만 로드, 후보자 화면 코드에서 완전히 제거
- **API 키 보호**: OpenRouter API 키는 관리자 화면에서만 사용, 후보자 화면 코드에서 완전히 제거
- **제출 잠금**: localStorage 기반 잠금 메커니즘 (클라이언트 검증, 서버 검증 불가 인지)
- **XSS 방지**: 사용자 입력 렌더링 시 HTML 이스케이프 처리
- **[NEW] 파일 파싱 안전성**: Word/Excel 파싱 시 악성 코드 실행 방지 (라이브러리 최신 버전 사용)

### 7.3 확장성 요구사항
- **문제 추가**: 문제 데이터 구조에 새로운 문제 추가 시 코드 수정 최소화
- **참고자료 확장**: 참고자료 유형 (PDF, 이미지 등) 추가 가능하도록 설계
- **[NEW] 보기 유형 확장**: 새로운 보기 유형 (예: 동영상, PDF) 추가 가능하도록 `type` 필드 활용
- **[NEW] 테이블 렌더러 모듈화**: Word/Excel 파싱 로직을 별도 모듈로 분리하여 유지보수 용이

### 7.4 접근성 요구사항
- **키보드 내비게이션**: Tab 키로 모든 인터랙티브 요소 접근 가능
- **[NEW] 테이블 셀 내비게이션**: 화살표 키로 테이블 셀 간 이동 가능 (선택 사항)
- **화면 낭독기 지원**: ARIA 레이블 적용
  - **[NEW] `aria-label="1번 보기: 정산서 편집 테이블"`**
  - **[NEW] `aria-label="참고자료 #1: 사용료 정산매뉴얼, 펼치기"`**
- **색상 대비**: WCAG 2.1 AA 수준 준수
- **[NEW] 입력 셀 포커스**: 입력 가능 셀 포커스 시 명확한 테두리 강조 (2px solid #FFD700)

### 7.5 브라우저 호환성 **[NEW]**
- **지원 브라우저**: Chrome 90+, Edge 90+, Firefox 88+, Safari 14+
- **필수 기능**:
  - localStorage API
  - ES6+ (화살표 함수, Promise, async/await)
  - CSS Grid, Flexbox
  - `<input>` 이벤트 리스너
- **테스트 우선순위**: Chrome 최신 버전 (90% 사용자 예상)

---

## 8. 개발 일정

### 8.1 마일스톤 및 주요 일정

| 마일스톤 | 기간 | 주요 산출물 | 담당자 | 변경 |
|---------|------|-------------|--------|------|
| M1: 요구사항 정의 | 1일 | PRD v2.0 문서 | PM | **[UPDATED]** |
| M2: 데이터 구조 설계 | 1.5일 | 데이터 모델 정의서, localStorage 스키마 | Backend Dev | **[UPDATED +0.5일]** |
| M3: UI/UX 설계 | 2.5일 | 와이어프레임, 디자인 시안, 테이블 스타일 가이드 | Frontend Dev | **[UPDATED +0.5일]** |
| **M4A: 파일 파싱 모듈 개발** | **2일** | **Word/Excel 파서, HTML 테이블 변환기** | **Frontend Dev** | **[NEW]** |
| M4B: 후보자 화면 개발 | 4일 | 로그인, 문제 목록, 문제 풀이, 제출 기능 | Frontend Dev | **[UPDATED +1일]** |
| M5: 관리자 화면 개발 | 2.5일 | Admin 대시보드, 채점 기능, 테이블 비교 뷰 | Frontend Dev | **[UPDATED +0.5일]** |
| M6: AI 채점 연동 | 1일 | OpenRouter API 통합 | AI Integration | - |
| M7: 테스트 및 QA | 3일 | 테스트 케이스 작성, 버그 수정, 테이블 렌더링 테스트 | QA Engineer | **[UPDATED +1일]** |
| M8: 최종 배포 | 1일 | index_pdf.html 최종 빌드 | DevOps | - |

**총 예상 기간**: 18.5일 (약 3주 2일) **[+5.5일 증가]**

### 8.2 단계별 산출물

#### Phase 1: 설계 (2.5일)
- PRD v2.0 문서
- 데이터 모델 정의서 (views 필드 포함)
- localStorage 스키마 문서 (answer.views 구조)
- 와이어프레임 (Figma 또는 Sketch)
- **[NEW] 테이블 스타일 가이드 (CSS 샘플)**
- **[NEW] 아코디언 UI 프로토타입**

#### Phase 2: 파일 파싱 모듈 개발 (2일) **[NEW]**
- **Word 파서** (Mammoth.js 활용):
  - .docx 파일 읽기
  - 테이블 추출 및 HTML 변환
  - 셀 병합, 스타일 정보 유지
- **Excel 파서** (SheetJS 활용):
  - .xlsx 파일 읽기
  - 시트 데이터를 JSON으로 변환
  - HTML 테이블 생성
- **편집 가능 셀 식별 로직**:
  - 정답 파일과 비교하여 editableCells 배열 생성
  - 입력 필드 렌더링 로직
- **단위 테스트**: 각 파서 함수에 대한 테스트 케이스 작성

#### Phase 3: 후보자 화면 개발 (4일)
- 로그인 화면 (0.5일)
- 문제 목록 화면 (0.5일)
- **문제 풀이 화면** (2일):
  - 문제 지문 렌더링 (0.5일)
  - **[NEW] 복수 보기 섹션 렌더링** (0.5일)
  - **[NEW] 편집 가능 테이블 렌더링 및 셀 입력 핸들링** (0.5일)
  - **[NEW] 참고자료 아코디언 구현** (0.5일)
- **임시 저장 기능** (0.5일):
  - 테이블 셀 데이터 저장/복원
- **제출 잠금 메커니즘** (0.5일):
  - 보기/참고자료 렌더링 차단

#### Phase 4: 관리자 화면 개발 (2.5일)
- Admin 대시보드 레이아웃 (0.5일)
- 후보자 목록 + 상세 화면 (1일)
- **[NEW] 테이블 답안 비교 뷰** (0.5일):
  - 셀별 정답/오답 비교 테이블
  - 정확도 계산 및 표시
- 수동 채점 인터페이스 (0.5일)

#### Phase 5: AI 채점 연동 (1일)
- OpenRouter API 통합
- **[NEW] 테이블 답안 JSON 직렬화 및 API 입력 포맷 변환**
- 채점 결과 파싱 및 저장

#### Phase 6: QA 및 배포 (4일)
- **기능 테스트** (1.5일):
  - 로그인/문제 풀이/제출 플로우
  - **[NEW] 테이블 셀 입력/저장/복원**
  - **[NEW] 아코디언 펼치기/접기**
- **보안 테스트** (1일):
  - 제출 잠금, 정답 노출 방지
  - **[NEW] 보기 정답 데이터 후보자 코드에서 완전히 제거 확인**
- **브라우저 호환성 테스트** (0.5일):
  - Chrome, Edge, Firefox, Safari
  - **[NEW] 테이블 렌더링 크로스 브라우저 테스트**
- **최종 빌드 및 배포** (1일):
  - 단일 HTML 파일 번들링
  - 라이브러리 (Mammoth.js, SheetJS) CDN 또는 인라인 포함

### 8.3 리소스 계획

| 역할 | 인원 | 투입 기간 | 주요 업무 |
|------|------|-----------|-----------|
| 제품 기획자 (PM) | 1명 | 1일 | PRD v2.0 작성, 요구사항 정의 |
| Frontend Developer | 1명 | **10일** | UI/UX 개발, 테이블 파서, localStorage 연동 | **[+3일]** |
| Backend Developer | 1명 | 1.5일 | 데이터 모델 설계 (서버 없음) | **[+0.5일]** |
| AI Integration Specialist | 1명 | 1일 | OpenRouter API 연동 |
| QA Engineer | 1명 | **3일** | 테스트 케이스 작성 및 실행 | **[+1일]** |

### 8.4 리스크 및 대응 방안

| 리스크 | 발생 가능성 | 영향도 | 대응 방안 |
|--------|------------|--------|-----------|
| localStorage 용량 제한 (5MB) | 중 | 높음 | Excel 파일 Base64 인코딩 시 압축 적용 |
| **[NEW] Word/Excel 파싱 오류** | **중** | **높음** | **라이브러리 최신 버전 사용, 파싱 실패 시 에러 메시지 표시** |
| **[NEW] 복잡한 테이블 레이아웃 미지원** | **중** | **중** | **병합 셀, 기본 서식만 지원, 고급 기능 (차트, 매크로) 제외** |
| OpenRouter API 호출 실패 | 중 | 중 | 수동 채점 대체 기능 제공 |
| 제출 잠금 우회 (개발자도구) | 높음 | 중 | 클라이언트 검증의 한계 인정, 감독관 모니터링 병행 권장 |
| 브라우저 호환성 문제 | 낮음 | 중 | Chrome, Edge 최신 버전 권장 안내 |
| **[NEW] 참고자료 렌더링 오류 (xlsx)** | **중** | **중** | **SheetJS 라이브러리 안정성 검증, 대체 뷰어 준비** |
| **[NEW] 아코디언 다중 열기 시 성능 저하** | **낮음** | **낮음** | **가상 스크롤 적용 (선택 사항), 최대 높이 제한** |

---

## 9. 기술 스택

### 9.1 권장사항 **[UPDATED]**

- **Frontend**: HTML5, CSS3 (또는 Tailwind CSS), Vanilla JavaScript (ES6+)
- **데이터 저장**: localStorage API
- **Excel 처리**: SheetJS (xlsx.js) 라이브러리 - **참고자료 + 보기 렌더링**
- **[NEW] Word 처리**: Mammoth.js 라이브러리 - **Word 문서 테이블 추출**
- **AI 채점**: OpenRouter API (tngtech/deepseek-r1t2-chimera:free)
- **빌드**: 단일 파일 번들링 (Webpack 또는 Rollup)
- **[NEW] CSS 프레임워크**: Bootstrap 5 또는 Tailwind CSS (아코디언, 테이블 스타일링)

### 9.2 라이브러리 버전 **[NEW]**

| 라이브러리 | 버전 | 용도 | CDN 링크 |
|-----------|------|------|----------|
| SheetJS (xlsx.js) | 0.18.5+ | Excel 파일 파싱 | https://cdn.sheetjs.com/xlsx-0.18.5/package/dist/xlsx.full.min.js |
| Mammoth.js | 1.6.0+ | Word 문서 파싱 | https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js |
| Bootstrap | 5.3.0+ (선택) | UI 컴포넌트 | https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css |

### 9.3 빌드 옵션 **[NEW]**

**옵션 A: CDN 방식** (권장)
- 장점: 빌드 간단, 파일 크기 작음
- 단점: 인터넷 연결 필요
- 구현: HTML에 `<script src="CDN링크">` 추가

**옵션 B: 인라인 방식**
- 장점: 완전 오프라인 동작
- 단점: 파일 크기 증가 (약 500KB)
- 구현: 라이브러리 코드를 HTML 내부에 `<script>` 태그로 포함

---

## 10. 화면 흐름도 (Screen Flow)

```
[로그인]
   ├─ (candidate) → [문제 목록]
   │                   ├─ [문제 1 풀이]
   │                   │      ├─ [문제 지문]
   │                   │      ├─ [1번 보기: 편집 가능 테이블] ← [NEW]
   │                   │      ├─ [2번 보기: 편집 가능 테이블] ← [NEW]
   │                   │      ├─ [참고자료 아코디언] ← [NEW]
   │                   │      │    ├─ 참고자료 #1 (펼침/접힘)
   │                   │      │    ├─ 참고자료 #2-1 (펼침/접힘)
   │                   │      │    ├─ 참고자료 #2-2 (펼침/접힘)
   │                   │      │    ├─ 참고자료 #3-1 (펼침/접힘)
   │                   │      │    ├─ 참고자료 #3-2 (펼침/접힘)
   │                   │      │    └─ 참고자료 #4 (펼침/접힘)
   │                   │      ├─ [임시 저장]
   │                   │      └─ [제출 완료]
   │                   └─ [문제 2 풀이]
   │                          ├─ [문제 지문]
   │                          ├─ [보기: 편집 가능 테이블] ← [NEW]
   │                          ├─ [참고자료 아코디언 (5개)] ← [NEW]
   │                          ├─ [임시 저장]
   │                          └─ [제출 완료]
   └─ (admin) → [Admin 대시보드]
                   ├─ [후보자 A 상세]
                   │      ├─ [테이블 답안 비교 뷰] ← [NEW]
                   │      └─ [AI 채점]
                   └─ [후보자 B 상세]
                          ├─ [테이블 답안 비교 뷰] ← [NEW]
                          └─ [수동 채점]
```

---

## 11. 부록

### 11.1 용어 정의

| 용어 | 정의 |
|------|------|
| TBS | Test-Based Selection, 테스트 기반 선발 |
| 제출 잠금 (Submission Lock) | 제출 완료 후 문제/답안/참고자료 재접근 차단 메커니즘 |
| localStorage | 브라우저 로컬 저장소 (최대 5MB) |
| DoD (Definition of Done) | 완료 조건, 기능 구현 완료 판단 기준 |
| 수용 기준 (Acceptance Criteria) | 기능이 요구사항을 충족했는지 판단하는 테스트 가능한 조건 |
| OpenRouter API | LLM 모델 API 게이트웨이 서비스 |
| **[NEW] 보기 (View)** | **문제 풀이 시 제공되는 편집 가능한 테이블 또는 텍스트 자료** |
| **[NEW] 편집 가능 테이블 (Editable Table)** | **후보자가 셀에 직접 값을 입력할 수 있는 HTML 테이블** |
| **[NEW] 아코디언 (Accordion)** | **클릭하면 펼쳐지거나 접히는 UI 패턴** |
| **[NEW] 셀 주소 (Cell Address)** | **테이블 셀의 위치를 나타내는 좌표 (예: A1, B2, C3)** |
| **[NEW] SheetJS** | **JavaScript 기반 Excel 파일 파싱 라이브러리** |
| **[NEW] Mammoth.js** | **JavaScript 기반 Word 문서 파싱 라이브러리** |

### 11.2 참고 파일 경로

- 계정정보: `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\계정정보.xlsx`
- 문제 1번 데이터: `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\문제 1번\*`
  - **[문제]1번보기.docx** (정산서)
  - **[문제]2번보기.xlsx** (검수방법 선택표)
  - [참고자료 #1~#4] (총 6개 파일)
- 문제 2번 데이터: `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\문제 2번\*`
  - **[문제]보기.xlsx** (정산서 양식)
  - [참고자료 #1~#5] (총 5개 파일)

### 11.3 UI 라이브러리 참고 자료 **[NEW]**

**아코디언 구현 예시** (Bootstrap 5):
```html
<div class="accordion" id="referencesAccordion">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button class="accordion-button collapsed" type="button"
              data-bs-toggle="collapse" data-bs-target="#collapseOne">
        📄 참고자료 #1: 사용료 정산매뉴얼
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse"
         data-bs-parent="#referencesAccordion">
      <div class="accordion-body">
        <pre>참고자료 내용...</pre>
      </div>
    </div>
  </div>
</div>
```

**편집 가능 테이블 예시**:
```html
<table class="editable-table">
  <thead>
    <tr>
      <th>항목</th>
      <th>수량</th>
      <th>단가</th>
      <th>사용료</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="readonly">기본서비스</td>
      <td class="readonly">1</td>
      <td class="readonly">50,000</td>
      <td>
        <input type="text" data-cell="D3" placeholder="금액 입력" />
      </td>
    </tr>
  </tbody>
</table>
```

### 11.4 테스트 시나리오 **[NEW]**

#### TC-01: 복수 보기 표시 테스트
- **전제 조건**: 후보자로 로그인, 문제 1번 선택
- **테스트 단계**:
  1. 문제 화면에서 "[1번 보기]" 섹션 확인
  2. "[2번 보기]" 섹션 확인
  3. 두 보기가 명확히 구분되는지 확인
- **예상 결과**: 각 보기가 제목과 구분선으로 분리되어 표시됨

#### TC-02: 편집 가능 테이블 입력 테스트
- **전제 조건**: 문제 1번 - 1번 보기 표시
- **테스트 단계**:
  1. 입력 가능 셀 (노란색 배경) 클릭
  2. "50,000" 입력
  3. Tab 키로 다음 셀 이동
  4. 읽기 전용 셀 클릭 시도
- **예상 결과**:
  - 입력 가능 셀: 값 입력됨, answer.views.view-1.cells.D3 = "50,000"
  - 읽기 전용 셀: 클릭해도 입력 불가

#### TC-03: 참고자료 아코디언 펼치기/접기 테스트
- **전제 조건**: 문제 1번 화면
- **테스트 단계**:
  1. "참고자료 #1" 헤더 클릭
  2. 내용 펼쳐지는지 확인
  3. 다시 클릭하여 접기
  4. "참고자료 #2-1", "#3-1" 동시에 펼치기
- **예상 결과**:
  - 클릭 시 부드러운 애니메이션으로 펼쳐짐/접힘
  - 여러 참고자료를 동시에 펼칠 수 있음
  - xlsx 파일은 테이블로, txt 파일은 텍스트로 표시됨

#### TC-04: 테이블 답안 저장 및 복원 테스트
- **전제 조건**: 문제 1번 - 1번 보기에 값 입력
- **테스트 단계**:
  1. D3 셀에 "50,000" 입력
  2. D4 셀에 "30,000" 입력
  3. "임시 저장" 클릭
  4. 브라우저 새로고침 (F5)
  5. 문제 1번 재진입
- **예상 결과**:
  - D3 셀에 "50,000", D4 셀에 "30,000" 복원됨
  - localStorage에 answer.views.view-1.cells 저장 확인

#### TC-05: 제출 후 접근 차단 테스트
- **전제 조건**: 문제 1번 답안 입력 완료
- **테스트 단계**:
  1. "제출하기" 클릭
  2. 경고 모달 확인 후 "확인"
  3. "제출 완료" 화면 표시 확인
  4. 뒤로가기 버튼 클릭
  5. URL 직접 입력으로 문제 1번 접근 시도
- **예상 결과**:
  - 문제 지문, 보기, 참고자료 모두 렌더링 차단
  - "제출 완료" 메시지만 표시

---

## 12. 개발 가이드라인 **[NEW]**

### 12.1 코드 구조

```
index_pdf.html
├─ [HTML]
│  ├─ 로그인 화면
│  ├─ 문제 목록 화면
│  ├─ 문제 풀이 화면 템플릿
│  │  ├─ 문제 지문 섹션
│  │  ├─ 보기 섹션 (동적 렌더링)
│  │  ├─ 참고자료 아코디언
│  │  └─ 제출 버튼
│  └─ Admin 대시보드
├─ [CSS]
│  ├─ 전역 스타일
│  ├─ 테이블 스타일 (.editable-table, .readonly, .header)
│  ├─ 아코디언 스타일 (.accordion-item, .accordion-header)
│  └─ 반응형 디자인
└─ [JavaScript]
   ├─ app.js (메인 애플리케이션 로직)
   ├─ auth.js (인증 및 권한 관리)
   ├─ problems.js (문제 데이터 로딩)
   ├─ views.js (보기 렌더링 모듈) ← [NEW]
   │  ├─ parseWordTable(docxBase64)
   │  ├─ parseExcelTable(xlsxBase64)
   │  ├─ renderEditableTable(tableData, viewId)
   │  └─ handleCellInput(event, cellAddress, viewId)
   ├─ references.js (참고자료 아코디언 모듈) ← [NEW]
   │  ├─ renderAccordion(references)
   │  ├─ toggleAccordion(refId)
   │  └─ renderReferenceContent(reference)
   ├─ submissions.js (답안 저장/제출)
   │  ├─ saveAnswer(userId, problemId, answer) ← [UPDATED]
   │  ├─ submitAnswer(userId, problemId)
   │  └─ loadAnswer(userId, problemId) ← [UPDATED]
   ├─ grading.js (채점 로직)
   │  ├─ gradeTableAnswer(userAnswer, correctAnswer) ← [NEW]
   │  ├─ calculateAccuracy(userCells, correctCells) ← [NEW]
   │  └─ callAIGrading(problemId, userAnswer)
   └─ utils.js (유틸리티 함수)
      ├─ cellAddressToCoords(address) ← [NEW]
      ├─ coordsToCellAddress(row, col) ← [NEW]
      └─ escapeHtml(text)
```

### 12.2 핵심 함수 명세 **[NEW]**

#### parseExcelTable(xlsxBase64, editableCells)
```javascript
/**
 * Excel 파일을 HTML 테이블로 변환
 * @param {string} xlsxBase64 - Base64 인코딩된 Excel 파일
 * @param {string[]} editableCells - 입력 가능 셀 주소 배열 (예: ["D3", "D4"])
 * @returns {object} - { headers, rows } 형태의 테이블 데이터
 */
function parseExcelTable(xlsxBase64, editableCells = []) {
  // SheetJS로 파일 읽기
  const workbook = XLSX.read(xlsxBase64, { type: 'base64' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // 테이블 데이터 추출
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // headers, rows 구조로 변환
  return {
    headers: data[0],
    rows: data.slice(1).map((row, rowIndex) => ({
      cells: row.map((value, colIndex) => {
        const address = coordsToCellAddress(rowIndex + 2, colIndex + 1);
        return {
          value: value || "",
          editable: editableCells.includes(address),
          readonly: !editableCells.includes(address),
          address: address
        };
      })
    }))
  };
}
```

#### renderEditableTable(tableData, viewId)
```javascript
/**
 * 테이블 데이터를 HTML 테이블로 렌더링
 * @param {object} tableData - { headers, rows } 형태의 데이터
 * @param {string} viewId - 보기 ID (예: "view-1")
 * @returns {string} - HTML 문자열
 */
function renderEditableTable(tableData, viewId) {
  let html = '<table class="editable-table">';

  // 헤더 렌더링
  html += '<thead><tr>';
  tableData.headers.forEach(header => {
    html += `<th>${escapeHtml(header)}</th>`;
  });
  html += '</tr></thead>';

  // 바디 렌더링
  html += '<tbody>';
  tableData.rows.forEach(row => {
    html += '<tr>';
    row.cells.forEach(cell => {
      if (cell.editable) {
        html += `<td><input type="text" data-cell="${cell.address}"
                 data-view="${viewId}" value="${escapeHtml(cell.value)}"
                 oninput="handleCellInput(event)" /></td>`;
      } else {
        html += `<td class="readonly">${escapeHtml(cell.value)}</td>`;
      }
    });
    html += '</tr>';
  });
  html += '</tbody></table>';

  return html;
}
```

#### handleCellInput(event)
```javascript
/**
 * 테이블 셀 입력 이벤트 핸들러
 * @param {Event} event - input 이벤트
 */
function handleCellInput(event) {
  const input = event.target;
  const cellAddress = input.dataset.cell;
  const viewId = input.dataset.view;
  const value = input.value;

  // answer 객체 업데이트
  if (!window.currentAnswer.views) {
    window.currentAnswer.views = {};
  }
  if (!window.currentAnswer.views[viewId]) {
    window.currentAnswer.views[viewId] = { cells: {} };
  }
  window.currentAnswer.views[viewId].cells[cellAddress] = value;

  // 자동 저장 타이머 리셋 (30초 후 자동 저장)
  clearTimeout(window.autoSaveTimer);
  window.autoSaveTimer = setTimeout(() => {
    saveAnswer(window.currentUserId, window.currentProblemId, window.currentAnswer);
  }, 30000);
}
```

#### gradeTableAnswer(userAnswer, correctAnswer)
```javascript
/**
 * 테이블 답안 채점
 * @param {object} userAnswer - answer.views 객체
 * @param {object} correctAnswer - correctAnswer.views 객체
 * @returns {object} - { totalCells, correctCells, accuracy, incorrectCells[] }
 */
function gradeTableAnswer(userAnswer, correctAnswer) {
  const results = {};

  for (const viewId in correctAnswer) {
    const correctCells = correctAnswer[viewId].cells;
    const userCells = userAnswer[viewId]?.cells || {};

    const totalCells = Object.keys(correctCells).length;
    let correctCount = 0;
    const incorrectList = [];

    for (const address in correctCells) {
      const userValue = (userCells[address] || "").trim();
      const correctValue = correctCells[address].trim();

      if (userValue === correctValue) {
        correctCount++;
      } else {
        incorrectList.push({
          address,
          userAnswer: userValue,
          correctAnswer: correctValue
        });
      }
    }

    results[viewId] = {
      totalCells,
      correctCells: correctCount,
      accuracy: (correctCount / totalCells * 100).toFixed(1),
      incorrectCells: incorrectList
    };
  }

  return results;
}
```

### 12.3 보안 체크리스트 **[NEW]**

**후보자 화면 코드에서 제거해야 할 데이터**:
- [ ] `correctAnswer.views` 객체 완전히 제거
- [ ] `gradingCriteria` 필드 완전히 제거
- [ ] OpenRouter API 키 완전히 제거
- [ ] 정답 파일 (예: [문제]1번정답.docx) Base64 데이터 제거

**관리자 화면 전용 데이터**:
- [ ] `correctAnswer` 객체 (views, text 포함)
- [ ] `gradingCriteria` 문자열
- [ ] OpenRouter API 키
- [ ] 테이블 답안 비교 로직

**코드 분리 방법**:
```javascript
// 후보자 화면 (index_pdf.html)
const problemsForCandidate = problems.map(p => ({
  id: p.id,
  title: p.title,
  content: p.content,
  views: p.views,  // 보기 데이터 (정답 제외)
  references: p.references,
  answerType: p.answerType
  // correctAnswer, gradingCriteria 제외
}));

// 관리자 화면 (index_pdf.html 내 admin 섹션)
const problemsForAdmin = problems;  // 전체 데이터 포함
```

---

## 문서 승인

- **작성자**: Product Manager
- **검토자**: Frontend Developer, Backend Developer, QA Engineer
- **최종 승인자**: Project Lead
- **승인 날짜**: 2026-02-02

---

**[END OF DOCUMENT]**
