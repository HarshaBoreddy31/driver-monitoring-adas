@echo off
title SMARTDRIVE 3D - Run All Automated Tests
color 0B

cd /d "%~dp0smartdrive-3d"
call test_all.bat
