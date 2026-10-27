# Twitch Bloom & Junkyard — Devpost Hackathon Submission Package

> **대회 정보**: OpenAI Codex x TwitchCon Hackathon  
> **공식 Codex 세션 ID**: `01a17ae2-0503-7173-ace9-d83891dec75a`  
> **마감 일시**: 2026-11-03 07:00 KST (2026-11-02 14:00 PT)  
> **결과물 형태**: HTML5 2D Canvas 레트로 픽셀 아트 기반 투명 배경 OBS 브라우저 오버레이  
> **공식 데모 영상 (YouTube)**: https://youtu.be/h_0PVTRr6I8

---

## 1. Devpost 필수 제출 폼 영문 & 국문 명세

### 1) 프로젝트 제목 및 한 줄 슬로건 (Title & Tagline)
- **Title**: `Twitch Bloom & Junkyard`
- **Tagline**:  
  *(EN)* A retro 2D pixel-art interactive OBS overlay where Twitch chatters collaboratively grow flowers or dump junkyard trash along the stream's bottom border — featuring high-traffic crowd control and a celebratory daily recap card.  
  *(KO)* 트위치 채팅 명령어로 방송 하단 테두리에 꽃을 피우거나 쓰레기를 투척·청소하며 시청자와 스트리머가 함께 가꾸는 레트로 픽셀 아트 대화형 오버레이 & 고트래픽 군중 제어 & 일일 결산 카드 시스템.

---

### 2) 영문 제출 본문 (Devpost Form Fields)

#### Inspiration
Streamers often struggle to keep passive viewers engaged without cluttering their main gameplay or webcam canvas. Most Twitch extensions either cover crucial UI elements or rely on clunky, resource-heavy overlays that stutter during chat storms.  
We envisioned a living, bottom-border ecosystem crafted with crisp 2D retro pixel art: a vibrant garden where viewers can plant and nurture flowers (`!water`), while playful viewers can toss junkyard trash (`!trash`). Eco-conscious chatters can sweep away the mess (`!clean`), creating an engaging tug-of-war. Under high-traffic chat raids, our dedicated crowd-control engine prevents visual chaos. At stream sign-off, a pixelated recap card honors the top contributors of the day.

#### What It Does
- **Bottom-Band Bounded 2D Pixel Ecosystem**: Operates entirely within the lowest 20% of the screen. Zero interference with center gameplay or webcam.
- **4-Stage Plant Lifecycle**: Seeds germinate into Sprouts, bloom into vibrant Roses, flourish into Sunflowers, and radiate as majestic Golden Flowers.
- **Dynamic Physics Junkyard**: Crushed soda cans, banana peels, fishbones, potions, and weeds drop with gravity physics. Cleaning triggers ascending star-burst particles.
- **High-Traffic Crowd Control**: Protects the stream from chaos. Laughter reactions have a per-user 1.5s cooldown and a 1s global throttling window, while trash bounces are capped at 4 items to keep the broadcaster's view crystal clear.
- **24/7 Memory Capping (LRU 500)**: Automatically evicts inactive user records past 500 users, guaranteeing zero memory leaks during non-stop broadcasts.
- **Floating Viewer Nameplates**: Each flower sports a crisp, retro pixelated name tag displaying the owner's Twitch username.
- **Zero-Dependency Web Audio Synth**: Custom procedural sound synthesis for splashing water, windchime arpeggios, metallic clanks, sweep sweeps, and bouncy chimes.
- **Instant Anonymous Twitch IRC**: Connects directly via WebSocket without requiring complicated OAuth tokens—just type the streamer's channel name!
- **End-of-Stream Daily Recap Card**: Summarizes flowers grown, watering count, trash dumped/cleaned, and ranks MVP chatters in a card exportable as high-res PNG.

#### How We Built It
- **HTML5 2D Canvas Engine**: 1:1 crisp pixel art with `imageSmoothingEnabled = false`, zero external 3D engine overhead.
- **Native Web Audio API**: Procedural sound generation bypassing external audio hosting and CORS pitfalls.
- **Strict Separation of Concerns**: Pure deterministic state engine (`garden.mjs`), network adapter (`twitch-irc.mjs`), audio synth (`audio.mjs`), 2D renderer (`renderer.mjs`), and demo simulator (`demo-sim.mjs`).
- **OBS Studio Optimization**: URL parameters (`?obs=1`, `?channel=name`, `?demo=1`, `?mute=1`) and keybinds (`H`, `D`) provide one-click streamer readiness with zero background opacity.

#### How OpenAI Codex Accelerated Development
OpenAI Codex served as our real-time co-pilot across every layer of the stack:
1. **Mathematical Physics & Collision Modeling**: Codex assisted in structuring vertical stacking, settling physics, and responsive viewport sizing.
2. **High-Traffic Crowd Control Architecture**: Codex helped architect the per-user cooldowns, global throttling windows, and LRU eviction buffers.
3. **Web Audio Synthesis**: Codex provided the frequency sweeps and gain envelope curves for procedural sound effects, eliminating external MP3 assets.
4. **Comprehensive Unit Testing**: Generated 13 rigorous native `node:test` assertions covering IRC fragmentation, crowd throttling, LRU memory caps, detached snapshots, and recap card lifecycle.

---

## 2. 3분 시연 비디오 콘티 및 대본 (Recording Script)

> **총 목표 길이**: 2분 30초 ~ 2분 50초 (3분 엄수)  
> **화면 준비**: 브라우저 전체화면 (`http://localhost:8089/?demo=1`)

| 시간 | 화면 연출 | 한국어 진행 대본 (가이드) | English Voiceover / Subtitles |
| :--- | :--- | :--- | :--- |
| **0:00 ~ 0:30** | 투명 배경 오버레이 소개 및 게임 방송 하단 시연 | "안녕하세요! 시청자와 방송인이 화면 하단에서 함께 정원을 가꾸고 장난을 치는 인터랙티브 2D 레트로 픽셀 오버레이, Twitch Bloom & Junkyard입니다." | "Welcome to Twitch Bloom & Junkyard — a crisp 2D retro pixel-art OBS overlay where chatters cultivate a living garden or dump junkyard trash along the screen's bottom border." |
| **0:30 ~ 1:00** | 시청자 닉네임과 함께 `!water` 입력으로 새싹에서 장미로 자라는 장면 | "시청자가 `!water`를 입력하면 자신의 이름표가 달린 새싹이 피어나고, 물을 줄 때마다 장미, 해바라기, 황금꽃으로 화려하게 성장합니다." | "When chatters type `!water`, their personal flower sprouts with a floating name tag, evolving across 4 procedural growth stages." |
| **1:00 ~ 1:30** | 장난꾸러기 시청자의 `!trash` 투척 및 `!clean` 청소 시연 | "하지만 방송엔 장난도 빠질 수 없죠! `!trash`로 깡통과 바나나껍질을 던지고, 에코 시청자들이 `!clean`으로 반짝이는 별가루와 함께 청소합니다." | "Mischievous viewers can toss cans and banana peels with `!trash`, while helpful chatters sweep them clean with `!clean` and sparkling particles." |
| **1:30 ~ 2:00** | 고트래픽 군중 제어 및 '결산 카드' 등장 연출 | "수천 명이 `ㅋㅋㅋㅋ`를 연타해도 똑똑한 군중 제어 엔진이 화면 난장판을 막아줍니다. 방송을 마칠 땐 '결산 카드'로 오늘의 MVP를 선정하고 고해상도 PNG로 간직할 수 있습니다." | "Even under massive laugh spam, our crowd control prevents screen chaos. At stream wrap-up, a recap card celebrates MVP chatters and exports high-res souvenir PNGs." |
| **2:00 ~ 2:40** | Codex 협업 개발 과정 및 기술적 강점 브리핑 | "OpenAI Codex와 협력하여 13종의 엄격한 단위 테스트를 통과하고, 토큰 없이 채널명만 적으면 1초 만에 즉시 작동합니다!" | "Built in collaboration with OpenAI Codex, verified across 13 comprehensive unit tests, and instantly connects with zero OAuth tokens required." |

---

## 3. 원클릭 실행 가이드

```powershell
# 1. 단위 테스트 (13개 항목 전체 검증 100% ALL PASS)
npm test

# 2. 로컬 웹 서버 실행 (포트 8089)
npm start

# 3. 브라우저/OBS 모드 접속
# - 일반 데모 모드: http://localhost:8089/
# - 자동 시연 즉시 시작: http://localhost:8089/?demo=1
# - OBS 투명 오버레이 모드: http://localhost:8089/?obs=1&channel=스트리머ID
```
