@echo off
title SMARTDRIVE 3D - Run All Automated Tests
color 0B

echo ===============================================================================
echo     SMARTDRIVE 3D - RUNNING FULL TEST SUITE (BACKEND + FRONTEND)
echo ===============================================================================
echo.

cd /d "%~dp0"

call npm test

echo.
echo ===============================================================================
echo All tests finished.
echo ===============================================================================
pause
