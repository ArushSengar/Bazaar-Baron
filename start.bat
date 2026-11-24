@echo off
title Bazaar Baron — LAN Tabletop Board Game
cd /d "%~dp0"

echo =====================================================================
echo                 Bazaar Baron — LAN Board Game
echo =====================================================================
echo.

:: 1. Check for Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please download and install Node.js (v20 or higher) from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Check and install root dependencies if missing
if not exist "node_modules\" (
    echo [SETUP] Installing server dependencies (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install server dependencies.
        pause
        exit /b 1
    )
)

:: 3. Check and install client dependencies if missing
if not exist "client\node_modules\" (
    echo [SETUP] Installing client dependencies...
    cd client
    call npm install
    cd ..
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install client dependencies.
        pause
        exit /b 1
    )
)

:: 4. Check and build client bundle if missing
if not exist "client\dist\" (
    echo [BUILD] Building optimized client production bundle...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Client build failed.
        pause
        exit /b 1
    )
)

echo.
echo =====================================================================
echo  Starting Bazaar Baron on http://localhost:3000
echo  Scan the terminal QR code from your phone to join over Wi-Fi!
echo =====================================================================
echo.

:: Open browser automatically
start "" "http://localhost:3000"

:: Start Node.js server
node server/index.js

if %errorlevel% neq 0 (
    echo.
    echo [SERVER STOPPED] Press any key to exit...
    pause >nul
)
