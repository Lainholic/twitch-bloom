# -*- coding: utf-8 -*-
import json
import sys
from pathlib import Path

# Add azure_worker to path
sys.path.insert(0, r"C:\AI\tools\azure_worker")
import worker

def run_sol_re_audit():
    print("=== Starting Sol 6.1 (gpt-6.1-sol) 3rd Verification Re-Audit for Twitch Bloom ===")
    settings = worker.load_settings("gpt-6.1-sol")
    client = worker.AzureClient(settings)

    task_prompt = """[디렉터 환님의 작업 지시 — 솔(Sol 6.1) 3차 최종 재검수 의뢰]

"솔에게 다시 검수받아와."

솔(Sol 6.1)이 2차 심층 감사(점수 61/100, NO-GO 판정)에서 지적했던 모든 치명적 결함(군중 제어 부재, 웃음 쿨다운 프리패스, 쓰레기 전체 공중 재발사, userActions 무한 메모리 누수, setSize 뷰포트 불일치, 렌더 루프 GC 객체 할당 등)에 대해 전면적인 핀셋 완치 패치를 완료했습니다.

디렉터 환님의 지시에 따라, 수정된 실제 코드와 12종 테스트 전체 통과 결과를 바탕으로 솔의 최종 재감사 및 출시/출품 적격성(GO / CONDITIONAL GO / NO-GO)을 재판정해 주십시오.

---

[주요 결함 완치 및 군중 제어 구축 내역]

1. [환님의 군중 제어 & 웃음 폭주 방어 체계 완비]
   - `src/garden.mjs`:
     * `command === 'laugh'`에 1.5초(1,500ms) 사용자별 쿨다운(`laughCooldownMs`)을 적용하여, 동일 시청자의 연속 도배 시 `{ accepted: false, reason: 'cooldown' }`으로 즉각 차단.
     * `lastGlobalLaughTime` 기반 1,000ms 전역 스로틀링 윈도우 신설. 수천 명이 동시에 웃어도 1초에 단 1번만 시각/청각 연출 신호(`emitEffect: true`)가 발생하고, 그 사이의 웃음은 수치 카운트만 안전하게 집계(`emitEffect: false`).
   - `index.html`:
     * `rawText.includes('ㅋㅋㅋ')`로 쿨다운/수락 여부와 무관하게 무조건 소리와 흔들림을 재생하던 이중 호출 결함을 완전 제거.
     * `res.accepted && res.emitEffect` 상태에서만 절제된 오디오와 흔들림이 연출되도록 완전 통제.

2. [쓰레기 전체 재발사 방지 및 렌더러 시야 보호]
   - `src/renderer.mjs`의 `triggerLaughEffect()`:
     * 화면 내 모든 쓰레기(최대 100개)가 하늘로 미친듯이 솟구치던 방식을 전면 폐기.
     * 바닥에 쉬고 있는 쓰레기(`isResting`) 중 최대 4개만 살짝 들썩이도록(`item.vy = -75~-110`, `bounceCount = 1`) 절제.
     * 하트 파티클 난사(20개 ➔ 6개 축소), 꽃 jiggle 강도(0.45 ➔ 0.25 완화)로 방송 시야 및 스트리머 캠/게임 영역을 철저히 보호.
     * `triggerGoldEffect()`의 반딧불이(`fireflies`)에 최대 60개 상한(Cap)을 부여하여 무한 증식 원천 방어.

3. [장기 무중단 송출 메모리 상한(LRU) 및 불변 스냅샷 방어]
   - `src/garden.mjs`:
     * `MAX_USERS = 500` LRU 상한 적용. 500명을 초과하는 고유 시청자가 유입되면 가장 오래된 비활성 유저를 자동 방출하여 24시간 연속 송출 시에도 힙 메모리가 지속 증가하지 않도록 원천 차단.
     * `getStats().topUsers` 반환 시 객체 얕은 복사(`.map(u => ({ ...u }))`)를 적용하여 외부 조작으로 내부 데이터가 오염되는 현상 방어.

4. [캔버스 리사이즈 뷰포트 동기화 & 렌더 루프 GC 제로화]
   - `src/renderer.mjs`:
     * `setSize(w, h)`에 `width = canvas.width = w; height = canvas.height = h;` 동기화 코드를 추가하여 OBS 소스 크기 조절 시 좌표 불일치 버그 완치.
     * 매 프레임 선언되던 48개 덩굴 설정 객체를 모듈 스코프 상수(`STATIC_LEFT_VINES`, `STATIC_RIGHT_VINES`, `STATIC_CEILING_VINES`)로 추출하여 렌더 루프 내 힙 메모리 할당을 제로화.

5. [단위 테스트 12/12 100% ALL PASS]
   - `tests/core.test.mjs`:
     * 군중 제어(동일 유저 쿨다운 차단 + 전역 1초 스로틀링) 검증 테스트 통과.
     * 520명 대규모 유저 유입 시 500명 하드캡 유지 및 불변 복사본 검증 테스트 통과.

---

[검수 파일 목록]
- C:/AI/twitch-bloom/src/garden.mjs
- C:/AI/twitch-bloom/src/renderer.mjs
- C:/AI/twitch-bloom/src/twitch-irc.mjs
- C:/AI/twitch-bloom/index.html
- C:/AI/twitch-bloom/tests/core.test.mjs
- C:/AI/twitch-bloom/_reports/sol_review_report.md (솔의 직전 2차 감사서)

위 파일들을 직접 읽고 검증하여, 솔(Sol 6.1)의 재평가 점수(100점 만점), 이전 지적 사항 완치 여부, 최종 출시 및 해커톤 출품 적격성(GO / CONDITIONAL GO / NO-GO)을 판정해 주십시오."""

    files = [
        r"C:\AI\twitch-bloom\src\garden.mjs",
        r"C:\AI\twitch-bloom\src\renderer.mjs",
        r"C:\AI\twitch-bloom\src\twitch-irc.mjs",
        r"C:\AI\twitch-bloom\index.html",
        r"C:\AI\twitch-bloom\tests\core.test.mjs",
        r"C:\AI\twitch-bloom\_reports\sol_review_report.md"
    ]

    result = worker.review(task_prompt, files, client, max_tokens=24000, max_turns=8)
    print("State:", result.get("state"))
    report = result.get("report", "")
    out_file = Path(r"C:\AI\twitch-bloom\_reports\sol_re_audit_report.md")
    out_file.write_text(report, encoding="utf-8")
    print(f"Report saved to {out_file} (length: {len(report)})")

if __name__ == "__main__":
    run_sol_re_audit()
