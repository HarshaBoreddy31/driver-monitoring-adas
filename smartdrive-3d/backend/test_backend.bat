@echo off
title SMARTDRIVE 3D - Run Automated Backend Unit & Integration Tests
color 0B

echo ===============================================================================
echo     SMARTDRIVE 3D - RUNNING AUTOMATED BACKEND TESTS (VITEST)
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

echo [TEST] Executing test suite...
echo.
call npm test

echo.
echo ===============================================================================
echo Tests completed.
echo ===============================================================================
pause
