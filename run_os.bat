@echo off
title Driver Monitoring OS - Launcher
echo ====================================================
echo        DRIVER MONITORING OPERATING SYSTEM
echo ====================================================
echo.

:: Check for QEMU in PATH or common install directories
set QEMU_BIN=
where qemu-system-i386 >nul 2>&1 && set QEMU_BIN=qemu-system-i386
if "%QEMU_BIN%"=="" (
    where qemu-system-x86_64 >nul 2>&1 && set QEMU_BIN=qemu-system-x86_64
)
if "%QEMU_BIN%"=="" (
    if exist "C:\Program Files\qemu\qemu-system-i386.exe" set QEMU_BIN="C:\Program Files\qemu\qemu-system-i386.exe"
    if exist "C:\Program Files\qemu\qemu-system-x86_64.exe" set QEMU_BIN="C:\Program Files\qemu\qemu-system-x86_64.exe"
)

if "%QEMU_BIN%"=="" (
    echo [ERROR] QEMU was not found on your system.
    echo.
    echo To run the Driver Monitoring OS:
    echo 1. Install QEMU for Windows from: https://www.qemu.org/download/#windows
    echo    or via Chocolatey: choco install qemu
    echo    or via Winget: winget install SoftwareFreedomConservancy.QEMU
    echo.
    echo 2. OR load the provided 'driver_monitoring_os.iso' into VirtualBox / VMware as an "Other / Unknown 32-bit OS" VM.
    echo.
    pause
    exit /b 1
)

if exist "driver_monitoring_os.iso" (
    echo Launching Driver Monitoring OS from ISO...
    %QEMU_BIN% -cdrom driver_monitoring_os.iso -m 128M
) else if exist "build\kernel.bin" (
    echo Launching Driver Monitoring Kernel directly...
    %QEMU_BIN% -kernel build\kernel.bin -m 128M
) else (
    echo [ERROR] Neither driver_monitoring_os.iso nor build\kernel.bin found!
    echo Please build the project first using 'make' or check your files.
    pause
    exit /b 1
)

