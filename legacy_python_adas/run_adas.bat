@echo off
title ADAS Surrounding Vehicle Distance & Collision Warning System
echo ================================================================
echo   ADAS TOP-DOWN SURROUNDING VEHICLE RADAR & COLLISION WARNING
echo   3D Isometric Distance Modeling + Background Driver Eye Monitoring
echo ================================================================
echo.

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found in system PATH.
    pause
    exit /b 1
)

echo Starting ADAS Vehicle Distance Radar...
echo.
python adas_distance.py
if errorlevel 1 (
    py -3.12 adas_distance.py
)
echo.
pause
