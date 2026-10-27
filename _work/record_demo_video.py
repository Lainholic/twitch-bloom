# -*- coding: utf-8 -*-
import os
import time
import base64
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

def record_hackathon_demo():
    output_dir = Path(r"C:\AI\twitch-bloom\_reports\video_recordings")
    output_dir.mkdir(parents=True, exist_ok=True)
    target_video_path = Path(r"C:\AI\twitch-bloom\_reports\twitch-bloom-submission-demo.webm")
    temp_audio_path = output_dir / "temp_demo_audio.webm"
    ffmpeg_exe = r"C:\AI\tools\liveportrait\ffmpeg\ffmpeg.exe"

    print("=== [1/5] Starting Playwright Engine with Web Audio Capture (1920x1080) ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--autoplay-policy=no-user-gesture-required",
                "--disable-features=PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies"
            ]
        )
        t_context_start = time.time()
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(output_dir),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        print("=== [2/5] Navigating to Overlay App (http://localhost:8089/) ===")
        page.goto("http://localhost:8089/")
        page.wait_for_load_state("networkidle")

        # Initialize audio and attach MediaStream audio recorder
        setup_result = page.evaluate("""() => {
            window.twitchBloom.audio.initAudio();
            const ctx = window.twitchBloom.audio.getAudioContext();
            if (!ctx) return { ok: false, error: 'No AudioContext' };
            if (ctx.state === 'suspended') ctx.resume();

            const dest = ctx.createMediaStreamDestination();
            window.__bloomMasterGain.connect(dest);

            const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
            const recorder = new MediaRecorder(dest.stream, { mimeType: mime });
            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };
            window.__demoAudioRecorder = recorder;
            window.__demoAudioChunks = chunks;
            recorder.start(50);
            return { ok: true, mime, sampleRate: ctx.sampleRate, state: ctx.state };
        }""")
        t_audio_start = time.time()
        offset_ms = max(0, int((t_audio_start - t_context_start) * 1000))
        print(f"  -> Audio Engine Activated: {setup_result} (Sync Offset: {offset_ms}ms)")

        # Helper to type mock chat via window.twitchBloom.handleEvent
        def chat(user, text):
            page.evaluate(f"window.twitchBloom.handleEvent({{ user: '{user}', text: '{text}' }})")

        print("=== [3/5] Executing 140s (2m 20s) Structured Demo Scenario with Full Audio ===")
        
        # --- Section 1: Intro & Atmosphere (0s ~ 15s) ---
        print("  -> Section 1: Intro (0s - 15s) - Live Game Screen & Pixel Vine Borders")
        time.sleep(3)
        chat("welcome_bot", "!water")
        time.sleep(9)

        # --- Section 2: Flower Cultivation & Growth (15s ~ 45s) ---
        print("  -> Section 2: Cultivation (15s - 45s) - Seeds sprouting, Roses, Sunflowers, Golden Bloom")
        chat("green_thumb", "!water")
        time.sleep(3)
        chat("alice_gardener", "!water")
        time.sleep(2)
        chat("green_thumb", "!water")
        time.sleep(3)
        chat("bob_sprout", "!water")
        time.sleep(2.5)
        chat("alice_gardener", "!sun")
        time.sleep(3)
        chat("green_thumb", "!water")
        time.sleep(3)
        chat("bob_sprout", "!sun")
        time.sleep(2.5)
        chat("flora_queen", "!water")
        time.sleep(2)
        chat("green_thumb", "!sun")
        time.sleep(3)
        chat("flora_queen", "!sun")
        time.sleep(3)

        # --- Section 3: Junkyard Chaos & Eco Cleanup (45s ~ 75s) ---
        print("  -> Section 3: Junkyard Chaos (45s - 75s) - Cans, Pizza, Bananas dropping & Broom Cleanup")
        chat("troll_master", "!trash")
        time.sleep(2)
        chat("pizza_lover", "!trash")
        time.sleep(2)
        chat("sneaky_ninja", "!trash")
        time.sleep(2.5)
        chat("troll_master", "!trash")
        time.sleep(2)
        chat("potion_crafter", "!potion")
        time.sleep(3)
        chat("clean_freak", "!clean")
        time.sleep(3)
        chat("eco_warrior", "!clean")
        time.sleep(3)
        chat("troll_master", "!trash")
        time.sleep(2)
        chat("chaos_bringer", "!trash")
        time.sleep(2.5)
        chat("clean_freak", "!clean")
        time.sleep(4)

        # --- Section 4: High-Traffic Crowd Control Showcase (75s ~ 100s) ---
        print("  -> Section 4: Crowd Control (75s - 100s) - Laugh raid throttling & soft bounce physics")
        # Spamming laughter from multiple viewers
        for i in range(12):
            chat(f"chatter_{i}", "LUL")
            time.sleep(0.3)
        time.sleep(2)
        for i in range(10):
            chat(f"viewer_{i}", "lol")
            time.sleep(0.35)
        time.sleep(3)
        chat("happy_camper", "lmao")
        time.sleep(2)
        chat("chatter_0", "lol")
        time.sleep(3)

        # --- Section 5: End-of-Stream Daily Recap Card (100s ~ 125s) ---
        print("  -> Section 5: Daily Recap Card (100s - 125s) - MVP Announcement & PNG Souvenir")
        page.locator("#btn-toggle-card").click()
        time.sleep(12)
        # Close card
        page.locator("#btn-toggle-card").click()
        time.sleep(4)

        # --- Section 6: Outro - Transparent OBS Mode (125s ~ 140s) ---
        print("  -> Section 6: Outro (125s - 140s) - Switching to 100% Transparent OBS Overlay Mode")
        page.locator("#btn-toggle-mock").click() # Switch to transparent
        time.sleep(12)

        print("=== [4/5] Extracting High-Definition Audio Stream ===")
        audio_payload = page.evaluate("""() => {
            return new Promise((resolve) => {
                if (!window.__demoAudioRecorder) return resolve(null);
                window.__demoAudioRecorder.onstop = () => {
                    const blob = new Blob(window.__demoAudioChunks, { type: window.__demoAudioRecorder.mimeType });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({
                            base64: reader.result.split(',')[1],
                            size: blob.size,
                            mime: window.__demoAudioRecorder.mimeType
                        });
                    };
                    reader.readAsDataURL(blob);
                };
                window.__demoAudioRecorder.stop();
            });
        }""")

        if audio_payload and audio_payload.get("size", 0) > 0:
            raw_audio_bytes = base64.b64decode(audio_payload["base64"])
            temp_audio_path.write_bytes(raw_audio_bytes)
            print(f"  -> Captured Audio Track: {len(raw_audio_bytes)} bytes ({temp_audio_path})")
        else:
            print("  -> WARNING: No audio data captured.")

        context.close()
        browser.close()

    print("=== [5/5] Multiplexing Video and Audio via FFmpeg ===")
    recorded_videos = list(output_dir.glob("*.webm"))
    video_candidates = [f for f in recorded_videos if f.name != temp_audio_path.name]

    if not video_candidates:
        print("ERROR: No recorded video file found.")
        return

    latest_video = max(video_candidates, key=os.path.getctime)
    print(f"  -> Raw Video Track: {latest_video} ({latest_video.stat().st_size / (1024*1024):.2f} MB)")

    if temp_audio_path.exists() and temp_audio_path.stat().st_size > 0:
        temp_target = output_dir / "merged_final.webm"
        cmd = [
            ffmpeg_exe, "-y",
            "-i", str(latest_video),
            "-i", str(temp_audio_path),
            "-filter_complex", f"[1:a]adelay={offset_ms}|{offset_ms},volume=10dB,alimiter=limit=0.95[a]",
            "-map", "0:v",
            "-map", "[a]",
            "-c:v", "copy",
            "-c:a", "libopus",
            "-b:a", "192k",
            "-shortest",
            str(temp_target)
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if res.returncode == 0 and temp_target.exists():
            if target_video_path.exists():
                target_video_path.unlink()
            temp_target.rename(target_video_path)
            print(f"SUCCESS: Synced Video + Audio Demo saved to: {target_video_path}")
            print(f"Final File Size: {target_video_path.stat().st_size / (1024 * 1024):.2f} MB")
        else:
            print("ERROR: FFmpeg merge failed:\n", res.stderr)
            if target_video_path.exists():
                target_video_path.unlink()
            latest_video.rename(target_video_path)
    else:
        print("WARNING: Audio not found, using video only fallback.")
        if target_video_path.exists():
            target_video_path.unlink()
        latest_video.rename(target_video_path)

    # Clean up intermediate recordings
    for f in output_dir.glob("*"):
        try:
            f.unlink()
        except Exception:
            pass

if __name__ == "__main__":
    record_hackathon_demo()
