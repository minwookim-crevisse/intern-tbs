# TBS 테스트 웹앱 - 가독성 개선 UX 가이드

## 문서 정보
- **작성일**: 2026-02-02
- **작성자**: UX Designer
- **목적**: 문제 본문 및 참고자료의 가독성 개선을 위한 UX 가이드라인 제공

---

## 1. 개선 전략 (UX Strategy)

### 1.1 핵심 UX 원칙

#### ✓ 정보 계층 구조 (Information Hierarchy)
- **문제 제목** → **배경 설명** → **요구사항** 순으로 명확한 계층 구성
- 시각적 가중치: 제목(가장 큼) > 섹션 헤더 > 본문 > 메타데이터(가장 작음)

#### ✓ 스캔 가능성 (Scannability)
- F-패턴 읽기 행동 고려: 중요 정보를 좌측 상단에 배치
- 핵심 키워드를 시각적으로 강조 (배경색, 볼드, 아이콘)
- 충분한 여백으로 시각적 휴식 공간 제공

#### ✓ 그룹핑 (Grouping)
- Gestalt의 근접성 원리: 관련 정보를 시각적으로 묶음
- 박스, 테두리, 배경색으로 섹션 구분
- 일관된 패턴 유지

#### ✓ 인지 부하 감소 (Cognitive Load Reduction)
- 한 번에 처리할 정보량을 제한 (Miller's Law: 7±2 청크)
- 복잡한 정보는 단계적으로 노출 (Progressive Disclosure)
- 예측 가능한 레이아웃 패턴 사용

---

## 2. 비주얼 디자인 시스템

### 2.1 색상 팔레트

| 용도 | 색상 코드 | 사용 예시 |
|------|----------|----------|
| **섹션 제목 배경** | `#1E3A8A` (진한 파란색) | 【문제】, 【요구사항】 |
| **섹션 제목 텍스트** | `#FFFFFF` (흰색) | 제목 텍스트 |
| **중요 정보 강조** | `#FEF3C7` (연한 노란색) | 금액, 날짜, 핵심 키워드 |
| **주의사항 배경** | `#FEF2F2` (연한 빨강) | 규칙, 주의사항 |
| **예시/보조 정보** | `#F3F4F6` (연한 회색) | 예시, 참고 |
| **구분선** | `#D1D5DB` (회색) | 섹션 구분선 |
| **테이블 헤더** | `#3B82F6` (파란색) | 테이블 헤더 배경 |
| **테이블 짝수 행** | `#F9FAFB` (매우 연한 회색) | Zebra striping |

### 2.2 타이포그래피

| 요소 | 폰트 크기 | 폰트 굵기 | 행간 | 색상 |
|------|----------|----------|------|------|
| **페이지 제목** | 24px | 700 (Bold) | 1.3 | #111827 |
| **섹션 제목** | 18px | 700 (Bold) | 1.4 | #FFFFFF (배경색 위) |
| **하위 섹션** | 16px | 600 (Semibold) | 1.4 | #374151 |
| **본문 텍스트** | 14px | 400 (Regular) | 1.6 | #4B5563 |
| **강조 텍스트** | 14px | 600 (Semibold) | 1.6 | #111827 |
| **메타데이터** | 12px | 400 (Regular) | 1.5 | #9CA3AF |

### 2.3 간격 시스템

```
여백 스케일 (8px 기준 배수):
- xs: 4px (요소 간 최소 간격)
- sm: 8px (관련 요소 간)
- md: 16px (섹션 내부 패딩)
- lg: 24px (섹션 간 간격)
- xl: 32px (주요 블록 간 간격)
- 2xl: 48px (페이지 섹션 간 간격)
```

---

## 3. UI 컴포넌트 디자인

### 3.1 섹션 헤더 (Section Header)

**디자인 명세:**
```css
.section-header {
  background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%);
  color: #FFFFFF;
  padding: 12px 20px;
  border-radius: 6px 6px 0 0;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

**사용 예시:**
```html
<div class="section-header">
  <span class="icon">📋</span>
  【문제】
</div>
```

### 3.2 강조 박스 (Highlight Box)

**유형별 스타일:**

#### A. 요구사항 박스
```css
.requirement-box {
  background: #FEF3C7;
  border-left: 4px solid #F59E0B;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
}
```

#### B. 주의사항 박스
```css
.warning-box {
  background: #FEF2F2;
  border-left: 4px solid #EF4444;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
}
```

#### C. 정보 박스
```css
.info-box {
  background: #EFF6FF;
  border-left: 4px solid #3B82F6;
  padding: 16px;
  margin: 16px 0;
  border-radius: 4px;
}
```

### 3.3 숫자/금액 강조 (Number Highlight)

```css
.number-highlight {
  background: #FEF3C7;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: nowrap;
}
```

**사용 예시:**
```html
<span class="number-highlight">8,656,853원</span>
```

### 3.4 소통 이력 카드 (Communication Card)

```css
.comm-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.comm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 12px;
}

.comm-meta {
  font-size: 12px;
  color: #9CA3AF;
}

.comm-content {
  font-size: 14px;
  line-height: 1.6;
  color: #4B5563;
}
```

### 3.5 리스트 스타일

**번호 리스트:**
```css
.numbered-list {
  counter-reset: item;
  list-style: none;
  padding-left: 0;
}

.numbered-list li {
  counter-increment: item;
  padding-left: 40px;
  position: relative;
  margin-bottom: 12px;
}

.numbered-list li:before {
  content: counter(item);
  background: #3B82F6;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  left: 0;
  top: 2px;
  font-size: 12px;
  font-weight: 600;
}
```

**불릿 리스트:**
```css
.bullet-list {
  list-style: none;
  padding-left: 0;
}

.bullet-list li {
  padding-left: 24px;
  position: relative;
  margin-bottom: 8px;
}

.bullet-list li:before {
  content: "▶";
  color: #3B82F6;
  position: absolute;
  left: 0;
  font-size: 12px;
}
```

---

## 4. 테이블 디자인 가이드

### 4.1 참고자료 테이블

```css
.reference-table {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.reference-table thead {
  background: #3B82F6;
  color: white;
}

.reference-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.reference-table td {
  padding: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.reference-table tbody tr:nth-child(even) {
  background: #F9FAFB;
}

.reference-table tbody tr:hover {
  background: #EFF6FF;
  transition: background 0.2s ease;
}
```

---

## 5. 아이콘 사용 가이드

### 5.1 섹션별 추천 아이콘

| 섹션 | 아이콘 | 용도 |
|------|--------|------|
| 문제 제목 | 📋 | 문제 지문 표시 |
| 요구사항 | ✅ | 해야 할 작업 표시 |
| 참고자료 | 📄 | 텍스트 참고자료 |
| 데이터 | 📊 | Excel 참고자료 |
| 주의사항 | ⚠️ | 중요 규칙/주의 |
| 절차/단계 | ① ② ③ | 순서가 있는 단계 |
| 핵심 포인트 | ★ | 중요 정보 |
| 체크 포인트 | ✓ | 확인 사항 |
| 금액 정보 | 💰 | 돈과 관련된 정보 |
| 날짜 정보 | 📅 | 날짜/기간 정보 |

---

## 6. 반응형 디자인 고려사항

### 6.1 브레이크포인트

```css
/* 모바일 */
@media (max-width: 640px) {
  .section-header {
    font-size: 16px;
    padding: 10px 16px;
  }

  .comm-card {
    padding: 12px;
  }
}

/* 태블릿 */
@media (min-width: 641px) and (max-width: 1024px) {
  .section-header {
    font-size: 17px;
  }
}

/* 데스크톱 */
@media (min-width: 1025px) {
  .content-container {
    max-width: 900px;
    margin: 0 auto;
  }
}
```

---

## 7. 접근성 체크리스트

### 7.1 필수 요구사항

- [ ] **색상 대비**: 모든 텍스트는 WCAG 2.1 AA 기준 충족 (4.5:1 이상)
- [ ] **의미론적 HTML**: `<h1>`, `<h2>`, `<section>`, `<article>` 태그 사용
- [ ] **ARIA 레이블**: 중요 섹션에 `aria-label` 속성 추가
  ```html
  <div class="section-header" aria-label="문제 지문">
    📋 【문제】
  </div>
  ```
- [ ] **키보드 탐색**: 모든 인터랙티브 요소가 Tab 키로 접근 가능
- [ ] **폰트 크기**: 최소 14px 이상 (본문 기준)
- [ ] **행간**: 최소 1.5 이상 (본문 기준)

### 7.2 스크린 리더 지원

```html
<!-- 숨김 텍스트로 맥락 제공 -->
<span class="sr-only">발신일</span>
<span>03월 01일</span>

<style>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
</style>
```

---

## 8. 구현 우선순위

### Phase 1: 긴급 개선 (High Priority)
1. ✅ 섹션 헤더 스타일 적용 (문제, 요구사항, 참고자료)
2. ✅ 숫자/금액 강조 스타일 추가
3. ✅ 소통 이력 카드 형식으로 변경
4. ✅ 요구사항 박스 강조

### Phase 2: 중요 개선 (Medium Priority)
5. 📊 테이블 스타일 개선
6. 📝 리스트 스타일 개선
7. 🎨 색상 시스템 전체 적용

### Phase 3: 추가 개선 (Low Priority)
8. 🔍 호버 효과 추가
9. 📱 모바일 최적화
10. ♿ 접근성 강화

---

## 9. 성공 지표 (Success Metrics)

### 9.1 정량적 지표
- **스캔 시간 감소**: 문제 내용 파악 시간 30% 감소 목표
- **오답률 감소**: 문제 오독으로 인한 오답 20% 감소
- **사용자 만족도**: "문제가 읽기 쉬웠나요?" 설문 4.0/5.0 이상

### 9.2 정성적 지표
- 후보자 피드백: "핵심 정보를 빠르게 찾을 수 있었다"
- 시선 추적 테스트: F-패턴 읽기 행동 확인
- 인지 부하 평가: "정보가 명확하게 구조화되어 있었다"

---

## 10. 유지보수 가이드

### 10.1 새로운 문제 추가 시
1. 템플릿 파일 복사
2. 섹션 헤더 먼저 작성
3. 콘텐츠 채우기 (본문 → 요구사항 → 참고자료 순)
4. 숫자/금액에 `.number-highlight` 클래스 적용
5. 접근성 체크리스트 확인

### 10.2 스타일 변경 시 주의사항
- 색상 변경 시 반드시 대비율 체크 (https://webaim.org/resources/contrastchecker/)
- 폰트 크기 변경 시 모바일 화면 확인
- 새로운 컴포넌트 추가 시 이 문서에 명세 추가

---

## 부록: 디자인 토큰 (Design Tokens)

```javascript
// 재사용 가능한 디자인 토큰
const tokens = {
  colors: {
    primary: '#3B82F6',
    primaryDark: '#1E3A8A',
    warning: '#F59E0B',
    danger: '#EF4444',
    success: '#10B981',
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      500: '#9CA3AF',
      600: '#4B5563',
      700: '#374151',
      900: '#111827'
    },
    highlight: {
      yellow: '#FEF3C7',
      red: '#FEF2F2',
      blue: '#EFF6FF'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px'
  },
  fontWeight: {
    regular: 400,
    semibold: 600,
    bold: 700
  },
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    full: '9999px'
  },
  boxShadow: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 6px rgba(0,0,0,0.1)'
  }
};
```

---

**문서 작성 완료**
- 작성일: 2026-02-02
- 다음 리뷰 예정일: 개발 완료 후
