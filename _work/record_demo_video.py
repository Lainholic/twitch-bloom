# -*- coding: utf-8 -*-
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

def record_hackathon_demo():
    output_dir = Path(r"C:\AI\twitch-bloom\_reports\video_recordings")
    output_dir.mkdir(parents=True, exist_ok=True)
    target_video_path = Path(r"C:\AI\twitch-bloom\_reports\twitch-bloom-submission-demo.webm")

    print("=== [1/4] Starting Playwright Video Recording Engine (1920x1080) ===")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(output_dir),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        print("=== [2/4] Navigating to Overlay App (http://localhost:8089/) ===")
        page.goto("http://localhost:8089/")
        page.wait_for_load_state("networkidle")

        # Helper to type mock chat via window.twitchBloom.handleEvent
        def chat(user, text):
            page.evaluate(f"window.twitchBloom.handleEvent({{ user: '{user}', text: '{text}' }})")

        print("=== [3/4] Executing 140s (2m 20s) Structured Demo Scenario ===")
        
        # --- Section 1: Intro & Atmosphere (0s ~ 15s) ---
        print("  -> Section 1: Intro (0s - 15s) - Live Game Screen & Pixel Vine Borders")
        time.sleep(12)

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

        print("=== [4/4] Finalizing and Saving Recorded Video ===")
        context.close()
        browser.close()

    # Move recorded video to target location
    recorded_files = list(output_dir.glob("*.webm"))
    if recorded_files:
        latest_video = max(recorded_files, key=os.path.getctime)
        if target_video_path.exists():
            target_video_path.unlink()
        latest_video.rename(target_video_path)
        print(f"SUCCESS: Video saved to {target_video_path}")
        print(f"Size: {target_video_path.stat().st_size / (1024 * 1024):.2f} MB")
    else:
        print("ERROR: No recorded video file found.")

if __name__ == "__main__":
    record_hackathon_demo()
