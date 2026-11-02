@echo off
title SMARTDRIVE 3D - Real-Time ADAS & Operating Systems Simulation
color 0B

echo ===============================================================================
echo     SMARTDRIVE 3D - REAL-TIME VEHICLE DISTANCE MONITORING & COLLISION WARNING
echo            Academic Operating Systems & ADAS 3D Simulation Suite
echo ===============================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

:: 2. Ensure dependencies
if not exist "node_modules\" (
    echo [SETUP] Installing root dependencies...
    call npm install
)
if not exist "backend\node_modules\" (
    echo [SETUP] Installing backend dependencies...
    call npm install --prefix backend
)
if not exist "frontend\node_modules\" (
    echo [SETUP] Installing frontend dependencies...
    call npm install --prefix frontend
)

echo.
echo ===============================================================================
echo [LAUNCH] Starting Backend Server (Port 4000) and Frontend Vite (Port 5180)...
echo [INFO] Web UI will open at: http://localhost:5180
echo ===============================================================================
echo.

:: Wait 3 seconds and launch browser
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5180"

:: Run full-stack application concurrently
call npm run dev

pause
