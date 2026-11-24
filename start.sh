#!/usr/bin/env bash

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "====================================================================="
echo "                Bazaar Arcade — LAN Board Games                      "
echo "====================================================================="
echo ""

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not found in your system PATH!"
    echo "Please install Node.js (v20 or higher) using your package manager:"
    echo "  Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm"
    echo "  Arch Linux:    sudo pacman -S nodejs npm"
    echo "  Fedora:        sudo dnf install nodejs npm"
    echo "  macOS:         brew install node"
    echo ""
    exit 1
fi

# 2. Check and install root dependencies if missing
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing server dependencies (npm install)..."
    npm install || { echo "[ERROR] Failed to install server dependencies."; exit 1; }
fi

# 3. Check and install client dependencies if missing
if [ ! -d "client/node_modules" ]; then
    echo "[SETUP] Installing client dependencies..."
    (cd client && npm install) || { echo "[ERROR] Failed to install client dependencies."; exit 1; }
fi

# 4. Check and build client bundle if missing
if [ ! -d "client/dist" ]; then
    echo "[BUILD] Building optimized client production bundle..."
    npm run build || { echo "[ERROR] Client build failed."; exit 1; }
fi

echo ""
echo "====================================================================="
echo " Starting Bazaar Arcade on http://localhost:3000"
echo " Scan the terminal QR code from your phone to join over Wi-Fi!"
echo "====================================================================="
echo ""

# Open default browser (Linux xdg-open or macOS open)
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" >/dev/null 2>&1 &
fi

# Start Node.js server
exec node server/index.js
