# Twitch Bloom & Junkyard

Three.js 기반의 투명 배경 OBS 브라우저 소스 오버레이로, 실시간 Twitch 채팅과 상호작용하여 방송 하단 테두리에 꽃이 피어나고 쓰레기가 쌓이는 대화형 정원 & 쓰레기장 시스템입니다.

## 아키텍처 및 데이터 흐름

```text
Twitch IRC WebSocket (익명/인증) ──┐
                                  ├──> garden.apply(event, now) ──> snapshot ──> Three.js 3D 렌더러
로컬 테스트 UI 컨트롤 ────────────┘                                    │          (하단 밴드 영역 한정)
                                                                       ├────> Web Audio 합성 효과음
                                                                       └────> 3D 결산 카드 & PNG 저장
```

- **상태의 단일 출처 (Single Source of Truth)**: `garden` 인스턴스가 꽃/쓰레기/활동 통계의 모든 상태를 소유합니다.
- **입력 경로 일원화**: Twitch 채팅 메시지와 로컬 테스트 버튼은 정확히 동일한 `handleEvent({ user, text, id })` 경로를 통해 처리됩니다.
- **화면 영역 보호**: 게임 화면 및 방송 중앙을 일절 침범하지 않으며, 화면 최하단 약 20% 영역에서 모든 연출이 완결됩니다.

## 지원 명령어

- `!water`: 식물에 물을 주어 4단계로 성장 및 개화 (새싹 -> 장미 -> 해바라기 -> 황금꽃). 미보유 시 새싹 자동 발아.
- `!trash`: 공용 쓰레기장에 4종 쓰레기 투척 (깡통, 바나나 껍질, 생선 가시, 잡초). 상단에서 부드럽게 낙하 및 바운스.
- `!clean`: 가장 오래된 쓰레기를 정리하고 청소 파티클 효과음과 함께 소멸.
- `!plant`, `!bloom`: (하위 호환) 개별 발아 및 개화 촉진.

## 주요 기능 및 구현 사양

1. **절차적 3D 렌더링 (Three.js)**:
   - 꽃 4종: 새싹(`sprout`), 장미(`rose`), 해바라기(`sunflower`), 황금꽃(`golden`).
   - 시청자 고유 해시(`traits.hue`)에 따른 동적 꽃잎 HSL 색조 변주.
   - 꽃 머리 위에 부유하는 반투명 2D 캔버스 닉네임 태그(Nameplate Sprite).
   - 쓰레기 4종: 깡통(`can`), 바나나 껍질(`banana`), 생선 가시(`fishbone`), 잡초(`weed`).
   - 하단 덩굴(Vine): 바닥 곡면을 따라 부드럽게 뻗어나가는 튜브 메쉬.
   - 윈도우 리사이즈 반응형 및 탭 비활성화 후 복귀 시 애니메이션 폭주 방지(Delta Time Capping).
2. **자동 시연 시뮬레이터 (Crowd Demo Simulation)**:
   - 10여 명의 가상 시청자 페르소나가 참여하는 현실적인 15초 풀 시연 시나리오 내장.
   - `?demo=1` 또는 상단 [🎬 자동 시연] 버튼 하나로 영상 녹화 및 프리뷰 완결.
3. **순수 절차적 오디오 (Web Audio API)**:
   - 외부 음원/오디오 파일 의존 0%.
   - 물방울 소리, 차임벨 아르페지오, 캔 부딪힘 충격음, 청소 스윕 사운드, 결산 카드 회전 스우시 합성.
   - 브라우저 자동재생 정책 대응, 볼륨 조절 슬라이더 및 원클릭 음소거 기능 제공.
4. **3D 결산 카드 (Summary Card) & PNG 다운로드**:
   - 세션 누적 활동량(물주기, 청소, 쓰레기, 활성 꽃 수) 및 기여 랭킹 1~5위 자동 집계.
   - 3D 카드가 360도 회전하며 화면 중앙으로 유려하게 등장.
   - 고해상도(960x1280) 무결점 PNG 파일로 즉시 다운로드 가능.
5. **Twitch IRC 연동**:
   - `wss://irc-ws.chat.twitch.tv:443` 기반.
   - **익명 읽기 전용 접속(`justinfan<random>`)** 완벽 지원 (별도 토큰 없이 채널명 입력만으로 즉시 연동).
   - OAuth 토큰 인증 접속도 하위 호환 지원.
   - PING/PONG keepalive, 자동 재연결(지수 백오프), 쿨다운(3초) 및 용량 상한 처리.
6. **OBS 스튜디오 최적화**:
   - 배경 완전 투명 (`alpha: true`, ClearColor 0).
   - OBS 브라우저 소스 URL에 `?obs=1` 쿼리 파라미터를 추가하거나 `H` 키를 누르면 컨트롤 UI가 즉시 숨겨져 투명 오버레이로 전환.
   - `?channel=스트리머ID`, `?demo=1`, `?names=0`, `?mute=1`, `?volume=0.5` 등 원클릭 설정 쿼리 지원.

## 실행 및 검증 방법

### 로컬 테스트 실행
```powershell
# 1. 단위 테스트 실행 (10개 항목 전체 검증)
node --test tests/core.test.mjs

# 2. 로컬 웹 서버 실행
python -m http.server 8089

# 3. 브라우저 접속
# 일반 모드: http://127.0.0.1:8089/index.html
# 자동 시연 모드: http://127.0.0.1:8089/index.html?demo=1
# OBS 오버레이 모드: http://127.0.0.1:8089/index.html?obs=1&channel=채널명
```

## 파일 구조

- `index.html`: 투명 오버레이 메인 웹앱 및 컨트롤 바.
- `src/garden.mjs`: 순수 정원 및 쓰레기장 규칙, 통계 집계, 명령어 파서.
- `src/twitch-irc.mjs`: 익명/인증 양방향 Twitch WebSocket IRC 어댑터.
- `src/demo-sim.mjs`: 현실적 시연 영상 녹화 및 프리뷰를 위한 15초 자동 군중 시뮬레이터.
- `src/audio.mjs`: Web Audio API 기반 신디사이저.
- `src/renderer.mjs`: Three.js 3D 정원, 네임플레이트, 쓰레기 물리 낙하, 파티클 렌더러.
- `src/summary-card.mjs`: 3D 결산 카드 애니메이션 및 고해상도 PNG 내보내기.
- `vendor/three.module.js`: 오프라인 로컬 구동을 위한 Three.js ESM 라이브러리.
- `tests/core.test.mjs`: 코어 로직 및 통신 단위 테스트.
- `PROJECT_SPEC.md`: 프로젝트 전체 기술 명세서.
- `SUBMISSION.md`: Devpost 공식 제출 폼 텍스트 및 3분 영상 녹화 대본.

