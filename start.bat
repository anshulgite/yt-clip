@echo off
setlocal
title ClipShort AI - Local Video Clipper

:: Ensure we are in the script's directory
cd /d "%~dp0"

echo ========================================================
echo               ClipShort AI - Quick Launcher
echo ========================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js v18 or higher from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check if .env.local exists, create from .env.example if missing
if not exist ".env.local" (
    if exist ".env.example" (
        echo [INFO] Creating .env.local from .env.example...
        copy /y ".env.example" ".env.local" >nul
    )
)

:: 3. Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] node_modules folder not found. Installing dependencies...
    echo This may take a minute on first run...
    call npm.cmd install
    if errorlevel 1 (
        echo.
        echo [ERROR] npm install failed. Please check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

:: 4. Ensure temp directories exist
if not exist "temp" mkdir "temp"
if not exist "temp\jobs" mkdir "temp\jobs"

echo [OK] Dependencies and configuration ready.
echo [INFO] Starting Next.js development server...
echo [INFO] The web app will automatically open at: http://localhost:3000
echo.
echo Press Ctrl+C in this window anytime to stop the server.
echo ========================================================
echo.

:: Launch browser in background after server starts
start /min "" cmd /c "ping 127.0.0.1 -n 4 >nul & start http://localhost:3000 & exit"

:: Start Next.js development server
call npm.cmd run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Server exited with an error.
    pause
)
