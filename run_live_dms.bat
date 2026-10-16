@echo off
title Driver Monitoring System - Live Camera HUD
echo ====================================================
echo   CONTEXT-AWARE DRIVER MONITORING SYSTEM (LIVE DMS)
echo   Real-Time Computer Vision & Fatigue Detection
echo ====================================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in PATH.
    pause
    exit /b 1
)

echo Starting Live Camera HUD...
echo.
python live_dms.py
if errorlevel 1 (
    py -3.12 live_dms.py
)
echo.
pause
