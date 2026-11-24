# 🎮 Bazaar Arcade — LAN Multiplayer Game Hub (Monopoly + UNO)

[![Node.js](https://img.shields.io/badge/Node.js-20+-68a063.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101.svg?style=flat-square&logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-70%20Passed-brightgreen.svg?style=flat-square)](https://nodejs.org/api/test.html)
[![Linux Support](https://img.shields.io/badge/Linux-Tested%20%26%20Supported-FCC624.svg?style=flat-square&logo=linux&logoColor=black)](https://www.linux.org/)
[![Offline First](https://img.shields.io/badge/Network-100%25%20Offline%20LAN-blue.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)]()

**Bazaar Arcade** is an offline multiplayer LAN tabletop game platform engineered for 2–10 players across local Wi-Fi or mobile hotspots. One host machine runs a unified Node.js server (`port 3000`); all friends and family connect instantly from any mobile phone, tablet, or PC browser without needing internet, accounts, or app store downloads.

Select and play classic tabletop games from a unified interactive lobby:
1. 🃏 **Bazaar UNO**: Full-featured official 108-card UNO with Skip, Reverse, +2, +4, Wild color picker, 3D card table, and real-time "Call UNO!" callout mechanics.
2. 🕌 **Bazaar Baron**: Monopoly-style property trading game set across iconic Indian cities with authentic quad-fold cardboard aesthetic, Munimji AI advisor, and non-blocking modals.

---

## ⚡ 1-Command Instant Launch

Clone the repository and launch the entire arcade in one single command:

### 🐧 Linux & macOS (1-Command Terminal)
```bash
git clone https://github.com/ArushSengar/Bazaar-Baron.git && cd Bazaar-Baron && chmod +x start.sh && ./start.sh
```

### 🪟 Windows (1-Command PowerShell)
```powershell
git clone https://github.com/ArushSengar/Bazaar-Baron.git; cd Bazaar-Baron; .\start.bat
```
*(Or simply double-click `start.bat` in Windows File Explorer)*

> **What `start.sh` and `start.bat` do automatically:**
> 1. Verify Node.js v20+ is present on your system.
> 2. Auto-install server and client dependencies (`npm install`).
> 3. Build the high-performance client production bundle (`npm run build`).
> 4. Launch the game server on `http://localhost:3000` and automatically pop open your browser.
> 5. Print your local Wi-Fi IP and a **scannable terminal QR code** so friends on phones can join in seconds!

---

## 📸 Visual Showcase

<div align="center">

### 🕹️ Arcade Game Hub & Unified Lobby
*Choose between Bazaar Baron (Monopoly) and Bazaar UNO, configure match settings, or invite AI Bot merchants.*

![Bazaar Arcade Lobby & Game Selector](docs/images/arcade-lobby.png)

<br/>

### 🃏 Bazaar UNO Tabletop Experience
*Official 108-card deck, active color glow indicator, 3D draw pile stack, card counters, and pulsing "CALL UNO!" button.*

![Bazaar UNO Live Gameplay](docs/images/uno-gameplay.png)

<br/>

### 🕌 Bazaar Baron Desktop Tabletop Board (1080p & 4K)
*Authentic quad-fold cardboard tabletop board with rotating perimeter tiles, 3D dice, and full territory overview.*

![Bazaar Baron Desktop Tabletop Board](docs/images/desktop-gameplay.png)

<br/>

### 📱 Responsive Mobile Phone & Laptop Views
*Touch-friendly 44px+ tap targets, collapsible bottom sheets, and responsive side panel tailored for phones and laptops.*

| 📱 Mobile Phone (390×844) | 💻 Laptop Screen (1366×768) |
| :---: | :---: |
| ![Mobile View](docs/images/mobile-gameplay.png) | ![Laptop View](docs/images/laptop-gameplay.png) |

</div>

---

## 🐧 Complete Linux Installation Guide

Bazaar Arcade runs natively on all major Linux distributions. Follow the instructions for your distribution below:

### 1. Ubuntu, Debian, Linux Mint, Pop!_OS
```bash
# 1. Install Node.js 20 LTS & Git (if not already installed)
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Clone repository
git clone https://github.com/ArushSengar/Bazaar-Baron.git
cd Bazaar-Baron

# 3. Make launcher executable and start
chmod +x start.sh
./start.sh
```

### 2. Arch Linux, Manjaro, EndeavourOS
```bash
# 1. Install Node.js, NPM, and Git
sudo pacman -S nodejs npm git

# 2. Clone repository and start
git clone https://github.com/ArushSengar/Bazaar-Baron.git
cd Bazaar-Baron
chmod +x start.sh
./start.sh
```

### 3. Fedora, RHEL, Rocky Linux, CentOS Stream
```bash
# 1. Install Node.js and Git
sudo dnf install -y nodejs npm git

# 2. Clone repository and start
git clone https://github.com/ArushSengar/Bazaar-Baron.git
cd Bazaar-Baron
chmod +x start.sh
./start.sh
```

### 4. openSUSE (Tumbleweed / Leap)
```bash
# 1. Install Node.js and Git
sudo zypper install -y nodejs npm git

# 2. Clone repository and start
git clone https://github.com/ArushSengar/Bazaar-Baron.git
cd Bazaar-Baron
chmod +x start.sh
./start.sh
```

### 5. macOS (Homebrew)
```bash
# 1. Install Node.js and Git via Homebrew
brew install node git

# 2. Clone repository and start
git clone https://github.com/ArushSengar/Bazaar-Baron.git
cd Bazaar-Baron
chmod +x start.sh
./start.sh
```

---

## 📱 How to Play with Friends on Wi-Fi (No Internet Needed)

1. **Host Setup**:
   - Run `./start.sh` (Linux/macOS) or `start.bat` (Windows).
   - Open your browser to `http://localhost:3000`.
   - Enter your name, pick an avatar, select your game (**🕌 Bazaar Baron** or **🃏 Bazaar UNO**), and click **Create Room**.
   - A 4-letter room code (e.g. `KISM` or `UNO1`) is displayed.

2. **Friends Join**:
   - Connect all phones, tablets, or laptops to the **same Wi-Fi network** (or phone mobile hotspot).
   - Point any mobile phone camera at the **terminal QR code**, or type `http://<HOST_IP>:3000` into any mobile browser.
   - Enter player name and the 4-letter room code.
   - *(Optional)*: Click **+ Add AI Friend** in lobby to invite *Priya (AI)*, *Rani (AI)*, or *Kabir (AI)*.

3. **Start Playing**:
   - Host clicks **Start Game**. All connected devices transition simultaneously into the live game table!

---

## 🃏 Game 1: Bazaar UNO Features

- **Official 108-Card Deck**:
  - 76 Number cards (0–9 across Red, Blue, Green, Yellow).
  - 24 Action cards (Skip, Reverse, Draw Two +2 across 4 colors).
  - 8 Wild cards (4 Multi-color Wild, 4 Wild Draw Four +4).
- **Interactive Tabletop Card Table**:
  - Draw pile with 3D card stack and real-time remaining card counts.
  - Glowing active color ring indicator (Red, Blue, Green, Yellow).
  - Turn direction indicator showing Clockwise (↻) or Counter-Clockwise (↺) rotation.
- **"CALL UNO!" Mechanics & Penalty Catching**:
  - Prominent pulsing **CALL UNO!** button when holding 1 or 2 cards.
  - If a player holds 1 card without calling UNO, any opponent can hit **Catch! 🚨** to inflict a 2-card penalty!
- **AI Bot Opponents**:
  - Host can invite AI friends (*Priya AI*, *Rani AI*, *Kabir AI*) with realistic ~900ms human pacing, strategic color choices, and automated UNO calls.
- **Round Scoring**:
  - Hand points scored by the winner at round end. First to reach 250 points wins the championship.

---

## 🕌 Game 2: Bazaar Baron (Monopoly) Features

- **Classic Tabletop Aesthetic**:
  - Warm, rich wooden background texture with an authentic cream quad-fold cardboard board (`#F3EBD8`).
  - True tabletop orientation: Left and right perimeter tiles rotate text 90°, top row tiles rotate 180° — zero clipped or overlapping text.
  - Inner color bands on all 22 properties with WCAG AAA compliant text contrast.
  - Distinct SVG pawn tokens (🎩 Top Hat, 🚗 Vintage Car, 🐕 Terrier Dog, 🚢 Steamship, 👢 Leather Boot, 🧵 Brass Thimble).
- **Authentic Indian Locality Theme**:
  - 40 perimeter tiles featuring iconic real-world localities across Delhi, Mumbai, Kolkata, Bengaluru, Pune, Hyderabad, and Chennai.
  - Original Chance & Community card decks (*Kismat* & *Bazaar Welfare Fund*) loaded with witty, culturally resonant events.
- **Munimji AI Financial Advisor**:
  - Real-time in-game advisor analyzing monopoly set completion, cash reserves, and recommended trades.
- **Non-Blocking, Glitch-Free Modals**:
  - Quick property purchase card docked directly inside the side panel.
  - Minimizable, non-blocking **Debt Insolvency** & **Auction** banners: players in debt can freely minimize notices, inspect their properties, mortgage assets, or sell houses without screen freezes.

### 🗺️ Indian Locality Board Mapping

| Color Group | Hex Code | Locality / Landmark | City | Base Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Brown** | `#8B5A2B` | Chandni Chowk, Daryaganj | Old Delhi | ₹60 |
| **Sky Blue** | `#7FD0F0` | Park Street, Howrah, Salt Lake | Kolkata | ₹100 – ₹120 |
| **Pink** | `#E75A9B` | Brigade Road, Commercial Street, MG Road | Bengaluru | ₹140 – ₹160 |
| **Orange** | `#F28C28` | FC Road, JM Road, Koregaon Park | Pune | ₹180 – ₹200 |
| **Red** | `#D62F2F` | Banjara Hills, Jubilee Hills, Hitec City | Hyderabad | ₹220 – ₹240 |
| **Yellow** | `#F2D13A` | T. Nagar, Anna Nagar, Marina Beach | Chennai | ₹260 – ₹280 |
| **Green** | `#2E9D5B` | Colaba Causeway, Bandra Bandstand, Juhu Beach | Mumbai | ₹300 – ₹320 |
| **Navy Blue** | `#1F3FA8` | Connaught Place, Khan Market | New Delhi | ₹350 – ₹400 |
| **Transit** | `#1B1B1B` | NDLS Station, Howrah Junction, CST Terminus, Chennai Central | National Rail | ₹200 |
| **Utilities** | `#475569` | Urja Power Grid, Jal Board Supply | Municipal | ₹150 |

---

## 🛡️ Firewall & LAN Troubleshooting (Linux & Windows)

If mobile devices on your Wi-Fi cannot connect to `http://<YOUR_LAN_IP>:3000`:

### 🐧 Linux (UFW / firewalld / iptables)
Allow inbound connections to port 3000 on your local network:
```bash
# Ubuntu / Debian / Linux Mint (UFW)
sudo ufw allow 3000/tcp

# Fedora / RHEL / CentOS (firewalld)
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# Arch / Generic Linux (iptables)
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
```

### 🪟 Windows Defender Firewall
1. **Network Profile Type (Most Common Issue)**: Open **Windows Settings** > **Network & Internet** > **Wi-Fi** > Click your connected network > Set **Network Profile Type** to **Private Network**. Windows automatically blocks incoming LAN port connections on "Public" networks.
2. **Allow Node through Firewall**: Open **Windows Defender Firewall** > **Allow an app through firewall** > Find `Node.js JavaScript Runtime` > Check both **Private** and **Public**.
3. **Same Subnet / Router**: Ensure phones are on the same Wi-Fi router (not mobile cellular data or router "Guest" isolation network).

---

## 🧪 Automated Test Suite (70 Tests Passing)

Bazaar Arcade includes an exhaustive pure unit, engine, and integration test suite using Node.js's native test runner (`node --test`). Tests verify rent calculations, doubles/jail mechanics, bank supply limits, auctions, trading, UNO 108-card deck rules, AI bots, and headless 200-turn random simulations:

```bash
npm test
```

```
✔ AI Bot Integration: Host can add bots with diverse avatars in lobby
✔ AI Bot Turn Execution: Pure reducer handles bot actions identically to human actions
✔ AI Bot Auction & Jail Behavior: Bot bids proportionally and pays jail fines
✔ Bazaar Baron Pure Engine Tests (Rent, Doubles, Jail, Even Building, Mortgages, Bankruptcy)
✔ UNO Deck: Standard 108 cards with correct distribution
✔ UNO Rules: canPlayUnoCard validation
✔ UNO Reducer: START_GAME deals 7 cards to each player and sets active card
✔ UNO Reducer: Playing cards and action cards (Skip, Reverse, Draw 2, Wild)
✔ UNO Reducer: Calling UNO and Catching missed UNO
✔ UNO Integration: Room creation, bot addition, and game start
✔ Headless Simulation: 200 random turns with 4 simulated players adheres to all invariant rules
✔ Tile Text & Layout: All 40 tiles have valid names and wrap without overflow
✔ Color Contrast: All board tiles exceed WCAG AAA standards

ℹ tests 70
ℹ suites 16
ℹ pass 70
ℹ fail 0
```

---

## 🏗️ Repository Architecture

```
Bazaar-Baron/
├── client/                     # Vite + React 19 Frontend
│   ├── src/
│   │   ├── components/         # UI Components (Lobby, Board, UnoScreen, UnoCard, Modals)
│   │   ├── data/               # Constants, tiles, unoRules, guides
│   │   ├── hooks/              # Custom hooks (useSocket, useSoundFx)
│   │   ├── utils/              # Sound synthesis & Web Audio helpers
│   │   └── index.css           # Tailwind v4 styles, custom animations & glows
│   └── package.json
├── server/                     # Unified Node.js Socket.IO Server
│   ├── engine/                 # Pure Functional Reducer Game Engines
│   │   ├── monopoly/           # Bazaar Baron engine (state, reducer, rules, bot, munimji)
│   │   ├── uno/                # Bazaar UNO engine (deck, rules, reducer, bot)
│   │   ├── ludo/               # Bazaar Ludo engine (state, rules, reducer, bot)
│   │   └── snakes/             # Snakes & Ladders engine (state, rules, reducer, bot)
│   ├── test/                   # Comprehensive Node.js native test runner suites
│   └── index.js                # HTTP server, Socket.IO router & QR code generator
├── docs/
│   └── images/                 # Screenshot gallery (Lobby, UNO, Desktop, Mobile, Laptop)
├── start.sh                    # 1-Command cross-platform launcher for Linux & macOS
├── start.bat                   # 1-Click launcher for Windows
└── package.json
```

---

## 📜 License
Released under the [MIT License](LICENSE). Built with ❤️ for offline tabletop gaming nights with friends and family.
