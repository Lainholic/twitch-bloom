# Twitch Bloom & Junkyard — Devpost Hackathon Submission Package

> **대회 정보**: OpenAI Codex x TwitchCon Hackathon  
> **공식 Codex 세션 ID**: `01a17ae2-0503-7173-ace9-d83891dec75a`  
> **마감 일시**: 2026-11-03 07:00 KST (2026-11-02 14:00 PT)  
> **결과물 형태**: Three.js 기반 투명 배경 OBS 브라우저 오버레이 (정적 3D 웹앱)

---

## 1. Devpost 필수 제출 폼 영문 & 국문 명세

### 1) 프로젝트 제목 및 한 줄 슬로건 (Title & Tagline)
- **Title**: `Twitch Bloom & Junkyard`
- **Tagline**:  
  *(EN)* A 3D interactive OBS overlay where Twitch chatters collaboratively grow flowers or dump junkyard trash along the stream's bottom border — culminating in a celebratory 3D recap card.  
  *(KO)* 트위치 채팅 명령어로 방송 하단 테두리에 꽃을 피우거나 쓰레기를 투척·청소하며 시청자와 스트리머가 함께 가꾸는 Three.js 3D 대화형 오버레이 & 일일 결산 카드 시스템.

---

### 2) 영문 제출 본문 (Devpost Form Fields)

#### Inspiration
Streamers often struggle to keep passive viewers engaged without cluttering their main gameplay or webcam canvas. Most Twitch extensions either cover crucial UI elements or rely on static, flat 2D overlays that feel disconnected from the broadcast.  
We envisioned a living, bottom-border ecosystem: a garden where viewers can plant and nurture flowers (`!water`), while mischievous viewers can toss junkyard trash (`!trash`). Eco-conscious chatters can sweep away the mess (`!clean`), creating a playful tug-of-war. At stream sign-off, a rotating 3D recap card honors the top contributors of the day.

#### What It Does
- **Bottom-Band Bounded 3D Ecosystem**: Operates entirely within the lowest 20% of the screen. Zero interference with center gameplay.
- **4-Stage Plant Lifecycle**: Seeds germinate into Sprouts, bloom into vibrant Roses, flourish into Sunflowers, and radiate as majestic Golden Flowers.
- **Dynamic Physics Junkyard**: Crushed soda cans, banana peels, fishbones, and tangled weeds drop with bouncy gravity physics. Cleaning triggers ascending star-burst particles.
- **Floating Viewer Nameplates**: Each flower sports a sleek, semi-transparent name tag displaying the owner's Twitch username.
- **Zero-Dependency Web Audio Synth**: Custom procedural sound synthesis for splashing water, windchime arpeggios, metallic clanks, sweep sweeps, and 3D card swooshes.
- **Instant Anonymous Twitch IRC**: Connects directly via WebSocket without requiring complicated OAuth tokens—just type the streamer's channel name!
- **End-of-Stream 3D Recap Card**: Summarizes flowers grown, watering count, trash dumped/cleaned, and ranks MVP chatters in a 3D spinning card exportable as high-res PNG.


#### How We Built It
- **Three.js (ES Modules)**: Procedural meshes, dynamic HSL tinting, and animated particle physics without loading bulky external 3D model files.
- **Native Web Audio API**: Procedural sound generation bypassing external audio hosting and CORS pitfalls.
- **Vanilla JavaScript Architecture**: Strict separation between the deterministic state engine (`garden.mjs`), network adapter (`twitch-irc.mjs`), audio synth (`audio.mjs`), 3D renderer (`renderer.mjs`), and demo simulator (`demo-sim.mjs`).
- **OBS Studio Optimization**: URL parameters (`?obs=1`, `?channel=name`, `?demo=1`, `?mute=1`) and keybinds (`H`, `D`) provide one-click streamer readiness with zero background opacity.

#### How OpenAI Codex Accelerated Development
OpenAI Codex served as our real-time co-pilot across every layer of the stack:
1. **Mathematical Curve Generation**: Codex drafted the smooth Catmull-Rom spline calculations and procedural geometry for petals, thorny stems, and bouncy trash gravity.
2. **Deterministic State Modeling**: Codex helped architect the state machine ensuring strict deduplication, user cooldowns, and immutable state snapshots.
3. **Web Audio Synthesis**: Codex provided the frequency sweeps and gain envelope curves for procedural sound effects, eliminating external MP3 assets.
4. **Unit Test Coverage**: Generated comprehensive node:test assertions ensuring IRC packet parsing and capacity limits hold up under live chat storms.

---

## 2. 3분 시연 비디오 콘티 및 대본 (Recording Script)

> **총 목표 길이**: 2분 30초 ~ 2분 50초 (3분 엄수)  
> **화면 준비**: OBS Studio 또는 브라우저 전체화면 (`http://127.0.0.1:8089/index.html?demo=1`)

| 시간 | 화면 연출 | 한국어 진행 대본 (가이드) | English Voiceover / Subtitles |
| :--- | :--- | :--- | :--- |
| **0:00 ~ 0:30** | 투명 배경 오버레이 소개 및 게임 방송 하단 시연 | "안녕하세요! 시청자와 방송인이 화면 하단에서 함께 정원을 가꾸고 장난을 치는 인터랙티브 3D 오버레이, Twitch Bloom & Junkyard입니다." | "Welcome to Twitch Bloom & Junkyard — a 3D interactive OBS overlay where chatters cultivate a living garden or dump junkyard trash along the screen's bottom border." |
| **0:30 ~ 1:00** | 시청자 닉네임과 함께 `!water` 입력으로 새싹에서 장미로 자라는 장면 | "시청자가 `!water`를 입력하면 자신의 이름표가 달린 새싹이 피어나고, 물을 줄 때마다 장미, 해바라기, 황금꽃으로 화려하게 성장합니다." | "When chatters type `!water`, their personal flower sprouts with a floating name tag, evolving across 4 procedural growth stages." |
| **1:00 ~ 1:30** | 장난꾸러기 시청자의 `!trash` 투척 및 `!clean` 청소 시연 | "하지만 방송엔 장난도 빠질 수 없죠! `!trash`로 깡통과 바나나껍질을 던지고, 에코 시청자들이 `!clean`으로 반짝이는 별가루와 함께 청소합니다." | "Mischievous viewers can toss cans and banana peels with `!trash`, while helpful chatters sweep them clean with `!clean` and sparkling particles." |
| **1:30 ~ 2:00** | 방송 종료 시 '결산 카드' 등장 및 PNG 저장 연출 | "방송을 마칠 땐 '결산 카드' 버튼을 누르면 3D 카드가 회전하며 등장해 오늘의 활성 꽃과 MVP 시청자를 발표하고, 고해상도 PNG로 즉시 소장할 수 있습니다." | "At stream wrap-up, a 3D recap card spins into view, celebrating top contributors and exporting high-res PNG souvenir cards." |
| **2:00 ~ 2:40** | Codex 협업 개발 과정 및 기술적 강점 브리핑 | "이 프로젝트는 OpenAI Codex와 협력하여 단 1개의 외부 3D/음원 파일 없이 순수 절차적 코드와 Web Audio로 완성되었습니다. 토큰 없이 채널명만 적으면 즉시 작동합니다!" | "Built completely with OpenAI Codex, featuring zero external 3D/audio asset dependencies and instant anonymous Twitch IRC connectivity." |

---

## 3. 원클릭 실행 가이드

```powershell
# 1. 단위 테스트 (10개 항목 전체 검증)
node --test C:\AI\twitch-bloom\tests\core.test.mjs

# 2. 로컬 웹 서버 실행 (포트 8089)
python -m http.server 8089 --directory C:\AI\twitch-bloom

# 3. 브라우저/OBS 모드 접속
# - 일반 데모 모드: http://127.0.0.1:8089/index.html
# - 자동 시연 즉시 시작: http://127.0.0.1:8089/index.html?demo=1
# - OBS 투명 오버레이 모드: http://127.0.0.1:8089/index.html?obs=1&channel=스트리머ID
```
