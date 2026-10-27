@echo off
chcp 949 >nul
title Twitch Bloom Demo Recording Launcher

echo ========================================================
echo   Twitch Bloom - OBS / Demo Recording Environment
echo ========================================================
echo.

:: 1. Check Local Web Server (Port 8089)
netstat -ano | findstr :8089 >nul
if %errorlevel% neq 0 (
    echo [*] Starting local web server on port 8089...
    start /min python -m http.server 8089 --directory "C:\AI\twitch-bloom"
    timeout /t 2 /nobreak >nul
) else (
    echo [v] Local web server is running on port 8089.
)

:: 2. Launch Browser (Brave preferred, fallback to Chrome, Edge, default)
set BRAVE="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
set CHROME="C:\Program Files\Google\Chrome\Application\chrome.exe"
set URL=http://localhost:8089/
set ARGS=--window-size=1920,1080 --autoplay-policy=no-user-gesture-required

if exist %BRAVE% (
    echo [*] Launching Brave Browser (1920x1080)...
    start "" %BRAVE% %ARGS% %URL%
) else if exist %CHROME% (
    echo [*] Launching Chrome Browser (1920x1080)...
    start "" %CHROME% %ARGS% %URL%
) else (
    echo [*] Launching Default Browser...
    start "" %URL%
)

echo.
echo ========================================================
echo   [Recording Ready Guide]
echo   1. When browser opens, click anywhere once to unlock sound.
echo   2. Start your recording tool (OBS, GeForce, or Win + Alt + R).
echo   3. Click [Demo Simulator] or follow the timeline buttons.
echo   4. Press [H] to hide the top control bar for clean visuals.
echo ========================================================
echo.
pause
