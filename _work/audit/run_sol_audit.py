# -*- coding: utf-8 -*-
import json
import sys
from pathlib import Path

# Add azure_worker to path
sys.path.insert(0, r"C:\AI\tools\azure_worker")
import worker

def run_sol_audit():
    print("=== Starting Sol 6.1 (gpt-6.1-sol) Deep Cross-Audit for Twitch Bloom ===")
    settings = worker.load_settings("gpt-6.1-sol")
    client = worker.AzureClient(settings)

    task_prompt = """[디렉터 환님의 작업 지시 — 솔(Sol 6.1) 심층 2차 교차 검수 의뢰]

1차 교차 검수 워커인 애니(Google Antigravity Agent, 점수 88/100 A-)의 검수 리포트를 수령한 상태입니다.
디렉터 환님께서 애니의 리포트를 보시고 매우 중요한 방송 실전 관점의 의문과 지시를 내리셨습니다:

"아니 그러면 사용자가 많으면 너무 정신없지않아? 음...
그 애니의 제안도 같이, 솔에게 넘겨.
그리고 솔의 토큰제한을 좀 늘려. 시간도."

애니의 제안과 함께, 환님의 핵심 우려 사항 및 실제 프로젝트 코드를 심층 분석하여 냉정하고 현실적인 2차 교차 감사를 수행해 주십시오.

---

[핵심 검수 및 질의 안건]

1. [환님의 핵심 방송 실전 의문] "사용자가 많으면 너무 정신없지 않은가?"
   - 애니는 한국어 웃음 반응을 기존 `ㅋㅋㅋㅋ`(4글자 이상)에서 `ㅋㅋ`(2글자 이상)으로 대폭 완화하자고 제안했습니다.
   - 하지만 환님의 지적처럼, 시청자가 수백~수천 명인 방송에서 `ㅋㅋ` 2글자만 쳐도 반응하도록 완화하면, 찰나의 순간에 수백 개의 소품/쓰레기가 쏟아져 화면 전체를 가리고 방송 화면(게임/얼굴)이 난장판이 될 위험이 큽니다.
   - 이에 대한 솔(Sol)의 실전 평가와, 대규모 트래픽(Crowd Control) 환경을 대비한 구체적인 방어 설계(예: 전역 쿨다운, 1인당 스로틀링, 화면 내 최대 활성 소품 수 하드캡, 웃음 강도 티어링 등)는 어떻게 구성해야 하는지 제시해 주십시오.

2. [애니(Annie) 검수 결과 교차 검증]
   - C:/AI/twitch-bloom/_reports/annie_review_report.md 를 정독하고, 애니의 지적 사항(렌더러 내 GC Map 재사용, 정규화 가상 슬롯 물리 분리, 이모지 전역 매칭 오작동 등)의 타당성을 평가해 주십시오.
   - 애니가 맞게 본 부분, 과장되거나 해커톤 현실에 맞지 않는 부분, 혹은 애니가 미처 보지 못한 숨은 결함이 있는지 파헤쳐 주십시오.

3. [실제 코드베이스 심층 정밀 감사]
   - 검수 파일:
     * C:/AI/twitch-bloom/src/garden.mjs (상태 머신, 성장/적재/청소 로직)
     * C:/AI/twitch-bloom/src/renderer.mjs (HTML5 Canvas 렌더링, 적재 물리, 애니메이션)
     * C:/AI/twitch-bloom/src/twitch-irc.mjs (트위치 IRC 웹소켓 파서, 명령어 분기)
     * C:/AI/twitch-bloom/tests/core.test.mjs (단위 테스트 슈트)
     * C:/AI/twitch-bloom/_reports/annie_review_report.md (애니의 1차 검수서)
   - 아키텍처, 렌더링 성능(GC/메모리/FPS), 트위치 챗 보안/스팸 방어, 실제 OBS 방송 적합도를 종합 평가해 주십시오.

4. [최종 산출물 규격]
   - 영역별 점수표 (100점 만점 기준, 애니 점수와의 비교)
   - 환님의 '정신없음(군중 제어)' 문제에 대한 명쾌한 솔루션
   - 즉시 수정이 필요한 P0 핀셋 패치 가이드
   - 최종 총평 및 출시/해커톤 출품 적격성(GO / CONDITIONAL GO / NO-GO) 판정
"""

    files = [
        r"C:\AI\twitch-bloom\src\garden.mjs",
        r"C:\AI\twitch-bloom\src\renderer.mjs",
        r"C:\AI\twitch-bloom\src\twitch-irc.mjs",
        r"C:\AI\twitch-bloom\tests\core.test.mjs",
        r"C:\AI\twitch-bloom\_reports\annie_review_report.md"
    ]

    # Max tokens increased to 24000 as instructed by Director Hwan
    result = worker.review(task_prompt, files, client, max_tokens=24000, max_turns=8)
    print("State:", result.get("state"))
    report = result.get("report", "")
    out_file = Path(r"C:\AI\twitch-bloom\_reports\sol_review_report.md")
    out_file.write_text(report, encoding="utf-8")
    print(f"Report saved to {out_file} (length: {len(report)})")

if __name__ == "__main__":
    run_sol_audit()
