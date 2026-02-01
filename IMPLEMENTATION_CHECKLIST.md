# 가독성 개선 구현 체크리스트

## 개요
이 문서는 plain text 형식의 문제 본문과 참고자료를 HTML 포맷팅 버전으로 변환할 때 사용하는 체크리스트입니다.

---

## Phase 1: 구조 분석 (10분)

### ✅ 콘텐츠 구조 파악
- [ ] 문제 지문과 요구사항을 명확히 구분
- [ ] 참고자료 유형 확인 (텍스트 매뉴얼 / 소통 이력 / 데이터)
- [ ] 핵심 정보 식별 (금액, 날짜, 절차, 규칙 등)
- [ ] 계층 구조 설계 (제목 → 섹션 → 하위 항목)

### ✅ 정보 우선순위 결정
- [ ] 가장 중요한 정보 (요구사항, 마감일 등) 식별
- [ ] 중간 중요도 정보 (배경 설명, 절차) 식별
- [ ] 참고 정보 (예시, 부가 설명) 식별

---

## Phase 2: 시각적 설계 (15분)

### ✅ 섹션 헤더 설계
- [ ] 【문제】 섹션: 파란색 그라디언트 배경
- [ ] 【요구사항】 섹션: 노란색 강조 박스
- [ ] 【참고자료】 섹션: 아코디언 형태

### ✅ 강조 요소 적용
- [ ] 금액/숫자: `.number-highlight` 클래스 적용
- [ ] 핵심 키워드: `.highlight` 또는 `.strong` 적용
- [ ] 날짜: 📅 아이콘 + 강조 스타일
- [ ] 중요 규칙: `.warning-box` 적용

### ✅ 리스트 형식 결정
- [ ] 순서가 있는 내용: 번호 리스트 (①②③ 또는 숫자 아이콘)
- [ ] 순서가 없는 내용: 불릿 리스트 (▶)
- [ ] 단계별 절차: `.step-box` 컴포넌트 사용

---

## Phase 3: HTML 마크업 (30분)

### ✅ 기본 구조 작성
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[문제/참고자료 제목]</title>
    <link rel="stylesheet" href="styles_guide.css">
    <!-- 또는 인라인 스타일 -->
</head>
<body>
    <div class="container">
        <!-- 콘텐츠 -->
    </div>
</body>
</html>
```

### ✅ 섹션 헤더 마크업
- [ ] `<div class="section-header">` 사용
- [ ] 아이콘 추가 (📋, ✅, 📄 등)
- [ ] ARIA 속성 추가: `role="heading" aria-level="2"`

### ✅ 콘텐츠 박스 마크업
- [ ] 배경 설명: `.context-box`
- [ ] 요구사항: `.requirement-box` + `.requirement-item`
- [ ] 주의사항: `.warning-box`
- [ ] 정보: `.info-box`
- [ ] 예시: `.example-box`

### ✅ 리스트 마크업
```html
<!-- 불릿 리스트 -->
<ul class="bullet-list">
    <li>항목 1</li>
    <li>항목 2</li>
</ul>

<!-- 번호 리스트 -->
<ol class="numbered-list">
    <li>항목 1</li>
    <li>항목 2</li>
</ol>
```

### ✅ 소통 이력 마크업 (참고자료용)
- [ ] `.comm-card` 컨테이너 생성
- [ ] `.comm-header`: 제목 + 배지
- [ ] `.comm-meta`: 발신일, 발신자, 수신자 정보
- [ ] `.comm-content`: 본문 내용
- [ ] 중요 정보는 `.important-notice` 박스 사용

---

## Phase 4: 스타일링 (20분)

### ✅ 색상 적용
- [ ] 섹션 헤더: `#1E3A8A` → `#3B82F6` 그라디언트
- [ ] 강조 배경: `#FEF3C7` (노란색)
- [ ] 주의사항: `#FEF2F2` (빨강)
- [ ] 정보 박스: `#EFF6FF` (파란색) 또는 `#ECFDF5` (초록)

### ✅ 타이포그래피 조정
- [ ] 제목: 24px, 굵게 (700)
- [ ] 섹션 헤더: 18px, 굵게 (700)
- [ ] 본문: 14px, 보통 (400), 행간 1.6
- [ ] 강조: 14px, 세미볼드 (600)

### ✅ 간격 조정
- [ ] 섹션 간: 32px
- [ ] 박스 패딩: 16px
- [ ] 리스트 항목 간: 10px

---

## Phase 5: 접근성 점검 (10분)

### ✅ WCAG 2.1 AA 준수
- [ ] 색상 대비율 확인 (https://webaim.org/resources/contrastchecker/)
  - 본문 텍스트: 최소 4.5:1
  - UI 요소: 최소 3:1
- [ ] 의미론적 HTML 사용 (`<h1>`, `<section>`, `<article>`)
- [ ] ARIA 레이블 추가
  ```html
  <div class="section-header" aria-label="문제 지문">
  ```

### ✅ 키보드 탐색
- [ ] Tab 키로 모든 섹션 이동 가능
- [ ] 포커스 표시 명확 (outline: 2px solid)

### ✅ 스크린 리더 지원
- [ ] 숨김 텍스트로 맥락 제공
  ```html
  <span class="sr-only">발신일</span>
  <span>03월 01일</span>
  ```

---

## Phase 6: 반응형 테스트 (10분)

### ✅ 모바일 (< 640px)
- [ ] 컨테이너 패딩: 20px
- [ ] 섹션 헤더 폰트: 16px
- [ ] 흐름도 세로 배치
- [ ] 테이블 가로 스크롤

### ✅ 태블릿 (641px - 1024px)
- [ ] 레이아웃 정상 표시
- [ ] 여백 적절

### ✅ 데스크톱 (> 1025px)
- [ ] 최대 너비 900px
- [ ] 가운데 정렬

---

## Phase 7: 최종 검토 (10분)

### ✅ 콘텐츠 정확성
- [ ] 원본 텍스트와 내용 일치
- [ ] 오타 없음
- [ ] 숫자/금액 정확

### ✅ 시각적 일관성
- [ ] 동일 요소에 동일 스타일 적용
- [ ] 색상 팔레트 일관성
- [ ] 아이콘 일관성

### ✅ 사용성 테스트
- [ ] 중요 정보를 3초 이내에 찾을 수 있는가?
- [ ] 요구사항이 명확하게 강조되어 있는가?
- [ ] 참고자료를 쉽게 탐색할 수 있는가?

---

## 빠른 변환 가이드 (Quick Reference)

### 패턴 1: 문제 지문
```
Plain Text:
당신은 사업지원 인턴으로, SaaS 서비스의 사용료를 계산하는 업무를 맡고 있다.
요구사항
1. 정산서를 수정해 주세요.

↓ HTML

<div class="context-box">
    <p><span class="strong">당신의 역할:</span> 사업지원 인턴으로,
    <span class="highlight">SaaS 서비스</span>의 사용료를 계산하는 업무를 맡고 있습니다.</p>
</div>

<div class="requirement-box">
    <div class="requirement-item">
        <span class="requirement-number">1</span>
        <p>정산서를 수정해 주세요.</p>
    </div>
</div>
```

### 패턴 2: 절차/단계
```
Plain Text:
1) 고객 요청 상품 확인
고객성공팀을 통해 접수된 상품 주문/변경 요청을 확인한다.

↓ HTML

<div class="step-box">
    <div class="step-title">
        <span class="step-number">1</span>
        <span>고객 요청 상품 확인</span>
    </div>
    <div class="step-content">
        <p>고객성공팀을 통해 접수된 상품 주문/변경 요청을 확인합니다.</p>
    </div>
</div>
```

### 패턴 3: 소통 이력
```
Plain Text:
발신일: 03월 01일
발신자: 광고집행담당자
수신자: 사업지원팀
선수금 잔액은 8,656,853원입니다.

↓ HTML

<div class="comm-card">
    <div class="comm-header">
        <div class="comm-title">이력 1</div>
        <span class="comm-badge">선수금 안내</span>
    </div>
    <div class="comm-meta">
        <span class="meta-label">📅 발신일:</span>
        <span class="meta-value">03월 01일</span>
        <span class="meta-label">👤 발신자:</span>
        <span class="meta-value">광고집행담당자</span>
    </div>
    <div class="comm-content">
        <p>선수금 잔액은 <span class="number-highlight">8,656,853원</span>입니다.</p>
    </div>
</div>
```

### 패턴 4: 중요 규칙/주의사항
```
Plain Text:
메시지 충전금은 매월 남은 금액이 다음 달로 그대로 넘어간다.

↓ HTML

<div class="info-box">
    <div class="info-title">
        <span>💰</span>
        <span>충전금 이월 규칙</span>
    </div>
    <p>메시지 충전금은 매월 <span class="strong">남은 금액이 다음 달로 그대로 넘어갑니다</span>.</p>
</div>
```

---

## 일반적인 실수 방지

### ❌ 피해야 할 것
1. **과도한 강조**: 모든 텍스트를 굵게/하이라이트 처리하면 효과 감소
2. **일관성 없는 색상**: 같은 유형의 정보에 다른 색상 사용
3. **너무 작은 폰트**: 12px 미만 사용 금지 (접근성)
4. **너무 좁은 행간**: 최소 1.5 이상 유지
5. **모바일 미고려**: 반응형 디자인 필수

### ✅ 꼭 해야 할 것
1. **명확한 계층 구조**: 제목 → 섹션 → 본문 순으로 크기 차등
2. **충분한 여백**: 섹션 간 최소 24px
3. **색상 대비**: 텍스트는 항상 배경과 4.5:1 이상 대비
4. **일관된 패턴**: 동일 요소는 동일 스타일
5. **테스트**: 실제 사용자 관점에서 검토

---

## 완료 기준 (Definition of Done)

다음 모든 항목이 충족되어야 완료:

- [ ] 모든 체크리스트 항목 완료
- [ ] HTML 유효성 검사 통과 (https://validator.w3.org/)
- [ ] 색상 대비 WCAG AA 통과
- [ ] 크롬, 엣지, 파이어폭스에서 정상 표시
- [ ] 모바일 화면에서 정상 표시
- [ ] 동료 리뷰 완료
- [ ] 원본 텍스트와 내용 일치 확인

---

## 참고 자료

- UX 가이드: `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\UX_GUIDE.md`
- CSS 스타일: `C:\Users\hipho\OneDrive\바탕 화면\바이브코딩\인턴 과제문제\styles_guide.css`
- 샘플 파일:
  - 문제 1번: `formatted_problem1.html`
  - 참고자료 1: `formatted_reference1.html`
  - 문제 2번: `formatted_problem2.html`
  - 소통 이력: `formatted_reference2_communication.html`

---

**최종 업데이트**: 2026-02-02
