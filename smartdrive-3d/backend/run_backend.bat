@echo off
title SMARTDRIVE 3D - Run Backend Server
color 0A

echo ===============================================================================
echo     SMARTDRIVE 3D - NODE.JS & TYPESCRIPT BACKEND ENGINE
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
    echo [SETUP] Installing backend dependencies...
    call npm install
)

echo [START] Launching backend server on port 4000...
echo [INFO] Health check available at: http://localhost:4000/api/health
echo.
call npm run dev

pause
