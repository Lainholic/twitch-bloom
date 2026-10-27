# -*- coding: utf-8 -*-
import json
import sys
from pathlib import Path

# Add azure_worker to path
sys.path.insert(0, r"C:\AI\tools\azure_worker")
import worker

def run_sol_4th_audit():
    print("=== Starting Sol 6.1 (gpt-6.1-sol) 4th Final Audit for Twitch Bloom ===")
    settings = worker.load_settings("gpt-6.1-sol")
    client = worker.AzureClient(settings)

    task_prompt = """[디렉터 환님의 작업 지시 — 솔(Sol 6.1) 4차 최종 검수 의뢰]

"한번 더 검수"

디렉터 환님의 지시에 따라, 3차 감사에서 지적된 런타임 결함 조치 및 디렉터 지시 사항을 완벽히 반영한 상태에서 4차 최종 검수를 의뢰합니다.

---

[직전 조치 완료 내역]

1. [P0 런타임 에러 완치]:
   - `src/renderer.mjs`에 누락되었던 `let nameplatesEnabled = true;`를 즉시 복원하여 `ReferenceError` 위험을 원천 차단했습니다.
2. [디렉터 환님의 명확한 기획 지시 반영]:
   - "물약을 치우라니까? 그냥 쓰레기로 랜덤에 넣어버려."
   - `src/garden.mjs`에서 `!물약`, `!포션`, `!비료` 입력 시 물약만 확정 투척되도록 하던 억지 분기(`if (/!(?:물약.../...)`)를 전면 삭제했습니다.
   - 이제 모든 쓰레기 투척 명령은 피자, 깡통, 바나나껍질, 생선가시, 버섯 등과 동일하게 `TRASH_TYPES` 7종 풀에서 1/N 무작위로 자연스럽게 생성됩니다.
3. [브라우저 런타임 실측 완료]:
   - Playwright 기반 브라우저(`http://localhost:8089/`)에서 실제 2D 캔버스 구동 확인.
   - 브라우저 콘솔 에러: 0건 (Errors: 0, Warnings: 0) 실측 확인.
4. [단위 테스트 12/12 ALL PASS]:
   - 물약 무작위 쓰레기 검증을 포함한 네이티브 테스트 12종 전체 통과 확인 (`node --test tests/core.test.mjs`).

---

[검수 파일 목록]
- C:/AI/twitch-bloom/src/garden.mjs
- C:/AI/twitch-bloom/src/renderer.mjs
- C:/AI/twitch-bloom/src/twitch-irc.mjs
- C:/AI/twitch-bloom/index.html
- C:/AI/twitch-bloom/tests/core.test.mjs
- C:/AI/twitch-bloom/_reports/sol_re_audit_report.md (3차 재감사서)

위 파일들을 직접 읽고 검증하여, 솔(Sol 6.1)의 4차 최종 평가 점수(100점 만점), 지적 사항 완치 판정, 최종 출시 및 해커톤 출품 적격성(GO / CONDITIONAL GO / NO-GO)을 판정해 주십시오."""

    files = [
        r"C:\AI\twitch-bloom\src\garden.mjs",
        r"C:\AI\twitch-bloom\src\renderer.mjs",
        r"C:\AI\twitch-bloom\src\twitch-irc.mjs",
        r"C:\AI\twitch-bloom\index.html",
        r"C:\AI\twitch-bloom\tests\core.test.mjs",
        r"C:\AI\twitch-bloom\_reports\sol_re_audit_report.md"
    ]

    result = worker.review(task_prompt, files, client, max_tokens=24000, max_turns=8)
    print("State:", result.get("state"))
    report = result.get("report", "")
    out_file = Path(r"C:\AI\twitch-bloom\_reports\sol_4th_audit_report.md")
    out_file.write_text(report, encoding="utf-8")
    print(f"Report saved to {out_file} (length: {len(report)})")

if __name__ == "__main__":
    run_sol_4th_audit()
