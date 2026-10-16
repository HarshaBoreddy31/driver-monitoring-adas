@echo off
title Context-Aware Driver Monitoring System - Simulation
echo ====================================================
echo   CONTEXT-AWARE DRIVER MONITORING SYSTEM SIMULATION
echo ====================================================
echo.

:: Check for Python
where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in PATH.
    echo Please install Python from https://www.python.org/ or Microsoft Store.
    pause
    exit /b 1
)

echo Installing / Verifying Python dependencies...
python -m pip install -r requirements.txt

echo.
echo Running Driver Monitoring Simulation...
echo.
python main.py
echo.
pause

