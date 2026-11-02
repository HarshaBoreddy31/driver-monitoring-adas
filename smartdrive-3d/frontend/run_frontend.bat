@echo off
title SMARTDRIVE 3D - Run Frontend Dashboard
color 0D

echo ===============================================================================
echo     SMARTDRIVE 3D - REACT 18 + THREE.JS DASHBOARD
echo ===============================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [SETUP] Installing frontend dependencies...
    call npm install
)

echo [START] Starting Vite Dev Server on port 5180 (http://localhost:5180)...
echo.
call npm run dev

pause
