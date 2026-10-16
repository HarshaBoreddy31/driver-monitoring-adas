@echo off
title ADAS Real-Time Vehicle Distance Detection & Visualization System
cls
echo ==============================================================================
echo        ADAS REAL-TIME VEHICLE DISTANCE DETECTION & VISUALIZATION
echo    YOLOv8 Multi-Object Detection + Calibrated Monocular Metric Distance
echo ==============================================================================
echo.
echo Choose execution mode:
echo   [1] Reference Dashcam Scene (Full detection, tracking, distance & warnings)
echo   [2] Live Webcam Stream (Device 0)
echo   [3] Custom Highway Video File
echo.

set /p MODE_CHOICE="Enter selection [1-3] (Default: 1): "
if "%MODE_CHOICE%"=="" set MODE_CHOICE=1

if "%MODE_CHOICE%"=="1" (
    echo.
    echo Starting ADAS Vehicle Distance Detection in Reference Dashcam Mode...
    py -3.12 run_vehicle_distance.py --mode reference
    if errorlevel 1 python run_vehicle_distance.py --mode reference
)

if "%MODE_CHOICE%"=="2" (
    echo.
    echo Starting ADAS Vehicle Distance Detection in Live Webcam Mode...
    py -3.12 run_vehicle_distance.py --mode webcam
    if errorlevel 1 python run_vehicle_distance.py --mode webcam
)

if "%MODE_CHOICE%"=="3" (
    echo.
    set /p VID_PATH="Enter path to video file (.mp4/.avi): "
    py -3.12 run_vehicle_distance.py --video "%VID_PATH%"
    if errorlevel 1 python run_vehicle_distance.py --video "%VID_PATH%"
)

echo.
echo [ADAS] Session ended.
pause
