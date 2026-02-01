#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TBS 테스트 웹앱 - AI 채점 모듈 테스트 스크립트

OpenRouter API를 사용하여 AI 채점 기능을 테스트합니다.
JavaScript 구현과 동일한 로직을 Python으로 구현하여 검증합니다.
"""

import os
import json
import requests
from dotenv import load_dotenv

# .env 파일에서 API 키 로드
load_dotenv()

API_KEY = os.getenv("OPENROUTER_API_KEY")
API_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "tngtech/deepseek-r1t2-chimera:free"


def test_api_connection():
    """API 연결 테스트"""
    print("=" * 60)
    print("1. API 연결 테스트")
    print("=" * 60)

    response = requests.post(
        url=API_ENDPOINT,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "user", "content": "안녕하세요! 'API 연결 성공'이라고 응답해주세요."}
            ],
            "max_tokens": 50
        }
    )

    print(f"상태 코드: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        print(f"응답: {result['choices'][0]['message']['content']}")
        print("✅ API 연결 성공!\n")
        return True
    else:
        print(f"❌ API 연결 실패: {response.text}\n")
        return False


def test_grading_problem1():
    """문제 1 채점 테스트"""
    print("=" * 60)
    print("2. 문제 1 채점 테스트")
    print("=" * 60)

    # 테스트용 후보자 답안
    candidate_answer = """
[답안 1-1]
오류 분석:
1. 기본서비스 사용료 오류:
   - FR-0002 상품이 3월 1일부터 적용되어야 하나 정산서에 누락되었습니다.
   - FR-0001 상품은 3월분부터 제외되어야 하나 여전히 포함되어 있습니다.

2. 확장서비스 사용료 오류:
   - DQT-00001 1개 추가분의 일할 계산이 잘못되었습니다.
   - 3월 14일부터 31일까지 17일분인데, 계산 금액이 정확하지 않습니다.

3. 메시지 충전금 오류:
   - 전월 기말 충전금 잔액이 당월 기초에 반영되지 않았습니다.
   - 메시지 사용료 계산 시 충전금 차감이 누락되었습니다.

수정 내역:
- FR-0001 제외: -30,000원
- FR-0002 추가: +50,000원
- DQT-00001 일할 계산 수정: 기존 금액 검토 필요
- 메시지 충전금: 전월 잔액 8,500원 반영

[답안 1-2]
수정된 정산서는 Excel 파일로 첨부하였습니다.
검수 방법:
1. 상품 변경 요청서 확인 후 체크리스트 작성
2. 일할 계산 시 일수 계산기 사용
3. 메시지 충전금은 전월 정산서와 대조 확인
"""

    # 문제 1 채점 프롬프트
    system_prompt = """당신은 사업지원 업무의 전문 채점자입니다.
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
- 부분 점수 적극 활용"""

    user_prompt = f"""
**후보자 답안:**

{candidate_answer}

---

**요구사항:**
위 후보자의 답안을 채점 기준에 따라 평가하고, 다음 JSON 형식으로 응답해주세요:

```json
{{
  "score": 85,
  "weaknessTags": ["계산 오류", "참고자료 누락"],
  "feedback": "전반적으로 양호하나 일부 개선이 필요합니다...",
  "detailedScores": {{
    "오류항목식별": 35,
    "수정금액정확도": 30,
    "검수방법적절성": 20
  }}
}}
```

**응답 형식 주의:**
- score: 0-100 사이의 정수
- weaknessTags: 취약점을 나타내는 태그 배열
- feedback: 200자 이내의 간결한 피드백
- detailedScores: 각 평가 항목별 점수
"""

    response = requests.post(
        url=API_ENDPOINT,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://tbs-test-webapp.local",
            "X-Title": "TBS Test WebApp"
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2048
        },
        timeout=60
    )

    print(f"상태 코드: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        ai_content = result['choices'][0]['message']['content']

        print(f"\n[AI 응답 원본]")
        print(ai_content)
        print()

        # JSON 추출 시도
        try:
            # JSON 코드 블록에서 추출
            import re
            json_match = re.search(r'```json\s*(.*?)\s*```', ai_content, re.DOTALL)
            if json_match:
                grading_result = json.loads(json_match.group(1))
            else:
                # 직접 JSON 찾기
                json_match = re.search(r'\{.*\}', ai_content, re.DOTALL)
                grading_result = json.loads(json_match.group(0))

            print("[채점 결과]")
            print(f"점수: {grading_result['score']}점")
            print(f"취약점 태그: {', '.join(grading_result['weaknessTags'])}")
            print(f"피드백: {grading_result['feedback']}")
            if 'detailedScores' in grading_result:
                print("\n[세부 점수]")
                for key, value in grading_result['detailedScores'].items():
                    print(f"  - {key}: {value}점")

            print("\n✅ 문제 1 채점 성공!\n")
            return grading_result

        except Exception as e:
            print(f"❌ JSON 파싱 실패: {e}\n")
            return None

    else:
        print(f"❌ API 호출 실패: {response.text}\n")
        return None


def test_grading_problem2():
    """문제 2 채점 테스트"""
    print("=" * 60)
    print("3. 문제 2 채점 테스트")
    print("=" * 60)

    candidate_answer = """
[답안 2-1]
정산서:

1. 광고집행 매출 산출:
   매체별 집행비용 및 수수료 적용 내역
   - G사: 집행비용 5,000,000원 × 수수료율 15% = 750,000원
   - M사: 집행비용 3,500,000원 × 수수료율 12% = 420,000원
   - K사: 집행비용 2,800,000원 × 수수료율 18% = 504,000원
   - X사: 집행비용 1,200,000원 × 수수료율 10% = 120,000원
   - N사: 집행비용 800,000원 × 수수료율 15% = 120,000원
   광고집행 매출 합계: 1,914,000원 (VAT 별도)

2. 광고소재 매출:
   - 광고소재 A: 1,890,000원
   - 광고소재 B: 3,500,000원
   광고소재 매출 합계: 5,390,000원 (VAT 별도)

3. 총 매출 (VAT 별도): 7,304,000원
   VAT (10%): 730,400원
   총 매출 (VAT 포함): 8,034,400원

4. 선수금 차감:
   - 3월 1일 기준 선수금 잔액: 8,656,853원
   - 3월 15일 추가 입금: 10,000,000원
   - 선수금 합계: 18,656,853원

5. 세금계산서 발행 금액:
   총 매출 (VAT 포함) 8,034,400원 - 선수금 18,656,853원 = -10,622,453원
   → 선수금이 매출보다 많으므로 세금계산서 발행 불필요
   → 잔여 선수금: 10,622,453원
"""

    system_prompt = """당신은 미디어 사업 정산 업무의 전문 채점자입니다.
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
- 선수금 처리 로직 검증"""

    user_prompt = f"""
**후보자 답안:**

{candidate_answer}

---

**요구사항:**
위 후보자의 답안을 채점 기준에 따라 평가하고, 다음 JSON 형식으로 응답해주세요:

```json
{{
  "score": 85,
  "weaknessTags": ["수수료율 오류", "선수금 미반영"],
  "feedback": "광고소재 매출은 정확하나 선수금 처리에 오류가 있습니다...",
  "detailedScores": {{
    "광고집행매출산출": 35,
    "광고소재매출집계": 30,
    "세금계산서발행금액": 20
  }}
}}
```
"""

    response = requests.post(
        url=API_ENDPOINT,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 2048
        },
        timeout=60
    )

    print(f"상태 코드: {response.status_code}")

    if response.status_code == 200:
        result = response.json()
        ai_content = result['choices'][0]['message']['content']

        print(f"\n[AI 응답 원본]")
        print(ai_content)
        print()

        try:
            import re
            json_match = re.search(r'```json\s*(.*?)\s*```', ai_content, re.DOTALL)
            if json_match:
                grading_result = json.loads(json_match.group(1))
            else:
                json_match = re.search(r'\{.*\}', ai_content, re.DOTALL)
                grading_result = json.loads(json_match.group(0))

            print("[채점 결과]")
            print(f"점수: {grading_result['score']}점")
            print(f"취약점 태그: {', '.join(grading_result['weaknessTags'])}")
            print(f"피드백: {grading_result['feedback']}")

            print("\n✅ 문제 2 채점 성공!\n")
            return grading_result

        except Exception as e:
            print(f"❌ JSON 파싱 실패: {e}\n")
            return None

    else:
        print(f"❌ API 호출 실패: {response.text}\n")
        return None


def main():
    """메인 테스트 실행"""
    print("\n" + "=" * 60)
    print("TBS 테스트 웹앱 - AI 채점 모듈 테스트")
    print("=" * 60)
    print(f"API 키: {API_KEY[:20]}..." if API_KEY else "API 키 없음")
    print(f"모델: {MODEL}")
    print("=" * 60 + "\n")

    if not API_KEY:
        print("❌ .env 파일에 OPENROUTER_API_KEY가 설정되지 않았습니다.")
        return

    # 테스트 실행
    results = []

    # 1. API 연결 테스트
    if test_api_connection():
        results.append(("API 연결", "성공"))

        # 2. 문제 1 채점 테스트
        result1 = test_grading_problem1()
        if result1:
            results.append(("문제 1 채점", f"성공 (점수: {result1['score']}점)"))
        else:
            results.append(("문제 1 채점", "실패"))

        # 3. 문제 2 채점 테스트
        result2 = test_grading_problem2()
        if result2:
            results.append(("문제 2 채점", f"성공 (점수: {result2['score']}점)"))
        else:
            results.append(("문제 2 채점", "실패"))
    else:
        results.append(("API 연결", "실패"))

    # 최종 결과 출력
    print("=" * 60)
    print("테스트 결과 요약")
    print("=" * 60)
    for name, status in results:
        print(f"{name}: {status}")
    print("=" * 60)


if __name__ == "__main__":
    main()
