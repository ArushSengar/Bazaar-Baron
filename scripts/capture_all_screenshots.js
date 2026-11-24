import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { io as ioClient } from 'socket.io-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(PROJECT_ROOT, 'docs', 'screenshots');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = 9333;
const SERVER_URL = 'http://localhost:3000';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function isServerResponding() {
  try {
    const res = await fetch(SERVER_URL, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServerRunning() {
  if (await isServerResponding()) {
    console.log(`[Server] Existing server detected at ${SERVER_URL}`);
    return { serverProc: null, spawnedByUs: false };
  }

  console.log('[Server] Starting node server/index.js...');
  const serverProc = spawn('node', ['server/index.js'], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProc.stderr?.on('data', (chunk) => {
    const msg = chunk.toString().trim();
    if (msg) console.error(`[Server stderr] ${msg}`);
  });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await isServerResponding()) {
      console.log(`[Server] Ready at ${SERVER_URL}`);
      return { serverProc, spawnedByUs: true };
    }
    await sleep(250);
  }

  serverProc.kill('SIGKILL');
  throw new Error(`Server at ${SERVER_URL} failed to respond within 15 seconds.`);
}

async function waitForChromeReady() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, {
        signal: AbortSignal.timeout(1000)
      });
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(200);
  }
  throw new Error(`Chrome CDP on port ${CDP_PORT} did not become ready within 15 seconds.`);
}

function createCdpClient(ws) {
  let nextId = 1;
  const pending = new Map();

  ws.addEventListener('message', (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) {
        reject(new Error(`CDP error (${data.error.code}): ${data.error.message}`));
      } else {
        resolve(data.result);
      }
    }
  });

  ws.addEventListener('close', () => {
    for (const [id, entry] of pending.entries()) {
      entry.reject(new Error(`CDP WebSocket closed before response for "${entry.method}"`));
      pending.delete(id);
    }
  });

  async function send(method, params = {}, timeoutMs = 20000) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new Error(`CDP command "${method}" timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      pending.set(id, {
        method,
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });

      try {
        ws.send(JSON.stringify({ id, method, params }));
      } catch (err) {
        clearTimeout(timer);
        pending.delete(id);
        reject(err);
      }
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res?.exceptionDetails) {
      throw new Error(`Page eval exception: ${res.exceptionDetails.text || JSON.stringify(res.exceptionDetails)}`);
    }
    return res?.result?.value;
  }

  async function waitFor(predicateExpr, timeoutMs = 15000, description = 'condition') {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const ok = await evaluate(`Boolean(${predicateExpr})`);
      if (ok) return true;
      await sleep(200);
    }
    throw new Error(`Timed out waiting for ${description} after ${timeoutMs}ms`);
  }

  async function setViewport(width, height, mobile = false) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile
    });
    await sleep(500);
  }

  async function capture(filename) {
    await sleep(400);
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true
    });
    const buffer = Buffer.from(result.data, 'base64');
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot] Saved ${filename} (${buffer.length} bytes)`);
    return outPath;
  }

  return { send, evaluate, waitFor, setViewport, capture };
}

async function resetToFreshLobby(cdp) {
  await cdp.evaluate(`localStorage.clear()`);
  await cdp.send('Page.reload', { ignoreCache: true });
  await cdp.waitFor(
    `document.body && document.body.innerText.includes('BAZAAR ARCADE')`,
    15000,
    'fresh Bazaar Arcade lobby'
  );
  await sleep(1500);
}

async function startMatchInLobby(cdp, { gameTitle, playerName = 'Arush', botCount = 2 }) {
  await resetToFreshLobby(cdp);

  // Select game card by title if specified
  if (gameTitle) {
    const selected = await cdp.evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('form div.cursor-pointer'));
      const target = cards.find(el => el.textContent && el.textContent.includes(${JSON.stringify(gameTitle)}));
      if (target) {
        target.click();
        return true;
      }
      return false;
    })()`);
    if (!selected) {
      throw new Error(`Could not find game card for "${gameTitle}"`);
    }
    await sleep(300);
  }

  // Fill player name using React-compatible native value setter
  await cdp.evaluate(`(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
    const nameInput = inputs[inputs.length - 1];
    if (!nameInput) throw new Error('Player name input not found');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(nameInput, ${JSON.stringify(playerName)});
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await sleep(250);

  // Click CREATE ARCADE ROOM
  await cdp.evaluate(`(() => {
    const btn = Array.from(document.querySelectorAll('button[type="submit"], button')).find(
      b => b.textContent && b.textContent.includes('CREATE ARCADE ROOM')
    );
    if (!btn) throw new Error('CREATE ARCADE ROOM button not found');
    btn.click();
  })()`);

  // Wait for Waiting Room Lobby
  await cdp.waitFor(
    `document.body && document.body.innerText.includes('Players in Lobby')`,
    15000,
    `${gameTitle || 'game'} waiting room lobby`
  );
  await sleep(800);

  // Add AI bots
  for (let i = 0; i < botCount; i++) {
    await cdp.evaluate(`(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && b.textContent.includes('Add AI Player')
      );
      if (!addBtn) throw new Error('Add AI Player button not found');
      addBtn.click();
    })()`);
    await sleep(350);

    await cdp.evaluate(`(() => {
      const botBtns = Array.from(document.querySelectorAll('button')).filter(
        b => b.textContent && b.textContent.includes('Automated Bot')
      );
      const botBtn = botBtns[${i}] || botBtns[0];
      if (!botBtn) throw new Error('Bot option not found in picker');
      botBtn.click();
    })()`);
    await sleep(500);
  }

  // Click START MATCH
  await cdp.evaluate(`(() => {
    const startBtn = Array.from(document.querySelectorAll('button')).find(
      b => b.textContent && b.textContent.includes('START MATCH') && !b.disabled
    );
    if (!startBtn) throw new Error('Enabled START MATCH button not found');
    startBtn.click();
  })()`);

  await sleep(2000);
}

async function triggerBaronCardViaSocket(cdp) {
  const session = await cdp.evaluate(`({
    roomCode: localStorage.getItem('bb_room_code'),
    playerToken: localStorage.getItem('bb_player_token')
  })`);

  if (!session?.roomCode || !session?.playerToken) {
    throw new Error('Missing roomCode or playerToken in localStorage for Baron card modal');
  }

  const socket = ioClient(SERVER_URL, { transports: ['websocket'] });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Socket connect timeout')), 5000);
      socket.on('connect', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.on('connect_error', reject);
    });

    await new Promise((resolve, reject) => {
      socket.emit('join_room', { roomCode: session.roomCode, playerToken: session.playerToken }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'Failed to join Baron room via socket'));
      });
    });

    // Roll deterministic [3, 4] = 7 from tile 0 -> lands on Tile 7 (Kismat / Chance)
    await new Promise((resolve, reject) => {
      socket.emit('game_intent', { type: 'ROLL_DICE', dice: [3, 4] }, (res) => {
        if (res?.success) resolve(res);
        else reject(new Error(res?.error || 'ROLL_DICE intent failed'));
      });
    });

    await sleep(400);
  } finally {
    socket.disconnect();
  }

  await cdp.send('Page.reload', { ignoreCache: false });
  await cdp.waitFor(
    `Boolean(document.querySelector('[data-testid="chance-fund-card-3d"]'))`,
    15000,
    'Baron Chance/Fund CardModal'
  );
  await sleep(1500);
}

async function run() {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome executable not found at: ${CHROME_PATH}`);
  }

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bazaar-cdp-'));
  const { serverProc, spawnedByUs } = await ensureServerRunning();

  console.log('[Chrome] Launching headless Chrome...');
  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--remote-allow-origins=*',
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${userDataDir}`
  ], {
    stdio: 'ignore'
  });

  let ws;
  try {
    await waitForChromeReady();
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?${encodeURIComponent(SERVER_URL)}`, {
      method: 'PUT'
    });
    const target = await res.json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    const cdp = createCdpClient(ws);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // 1. Arcade Lobby Desktop (1920x1080)
    await cdp.setViewport(1920, 1080, false);
    await resetToFreshLobby(cdp);
    await cdp.capture('arcade-lobby-desktop.png');

    // 2. Arcade Lobby Mobile (390x844)
    await cdp.setViewport(390, 844, true);
    await sleep(1000);
    await cdp.capture('arcade-lobby-mobile.png');

    // 14. Rules Guide Modal (captured from desktop lobby)
    await cdp.setViewport(1920, 1080, false);
    await cdp.evaluate(`(() => {
      const ruleBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && (b.textContent.includes('Rulebook') || b.textContent.includes('Rules'))
      );
      if (!ruleBtn) throw new Error('Rulebook button not found');
      ruleBtn.click();
    })()`);
    await cdp.waitFor(
      `Boolean(document.querySelector('[role="dialog"]')) && document.body.innerText.toLowerCase().includes('arcade rulebook')`,
      10000,
      'Rules Guide Modal'
    );
    await sleep(1500);
    await cdp.capture('rules-modal.png');

    // Close Rules Modal
    await cdp.evaluate(`(() => {
      const closeBtn = document.querySelector('[aria-label="Close guide modal"]');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(400);

    // Start Bazaar Baron match (Desktop)
    await startMatchInLobby(cdp, { gameTitle: 'Bazaar Baron', botCount: 2 });
    await cdp.waitFor(
      `Boolean(document.querySelector('[data-testid="tabletop-board"]'))`,
      15000,
      'Bazaar Baron board'
    );
    await sleep(1500);

    // 5. Bazaar Baron 3D Isometric View Desktop (default is3DView = true)
    await cdp.waitFor(
      `document.querySelector('[data-testid="tabletop-board"]').classList.contains('board-perspective-3d')`,
      5000,
      'Baron 3D perspective class'
    );
    await cdp.capture('baron-board-3d-isometric.png');

    // 3. Bazaar Baron Tabletop Board Desktop (2D top-down mode toggle verified)
    await cdp.evaluate(`(() => {
      const toggle = document.querySelector('[data-testid="gamescreen-perspective-toggle"]');
      if (toggle) toggle.click();
    })()`);
    await sleep(1500);
    await cdp.capture('baron-board-desktop.png');

    // Toggle back to 3D View before Deed & Mobile
    await cdp.evaluate(`(() => {
      const toggle = document.querySelector('[data-testid="gamescreen-perspective-toggle"]');
      if (toggle) toggle.click();
    })()`);
    await sleep(1000);

    // 6. Bazaar Baron Title Deed Modal (click Marine Drive tile 39)
    await cdp.evaluate(`(() => {
      const tile = document.querySelector('[data-tile-id="39"]');
      if (!tile) throw new Error('Marine Drive tile 39 not found');
      tile.click();
    })()`);
    await cdp.waitFor(
      `document.body.innerText.includes('TITLE DEED') && document.body.innerText.includes('MARINE DRIVE')`,
      8000,
      'Baron Title Deed Modal'
    );
    await sleep(1500);
    await cdp.capture('baron-deed-modal.png');

    // Close Deed Modal
    await cdp.evaluate(`(() => {
      const doneBtn = Array.from(document.querySelectorAll('button')).find(
        b => b.textContent && b.textContent.trim() === 'Done'
      );
      if (doneBtn) doneBtn.click();
    })()`);
    await sleep(500);

    // 4. Bazaar Baron Tabletop Board Mobile (390x844)
    await cdp.setViewport(390, 844, true);
    await sleep(1500);
    const mobileBoardDims = await cdp.evaluate(`(() => {
      const board = document.querySelector('[data-testid="tabletop-board"]');
      if (!board) return null;
      return { width: board.offsetWidth, height: board.offsetHeight };
    })()`);
    if (!mobileBoardDims || Math.abs(mobileBoardDims.width - mobileBoardDims.height) > 2) {
      throw new Error(
        `Mobile Baron board aspect ratio distortion detected: ${JSON.stringify(mobileBoardDims)}`
      );
    }
    console.log(`[Verify] Mobile Baron board layout is 1:1 square (${mobileBoardDims.width}x${mobileBoardDims.height})`);
    await cdp.capture('baron-board-mobile.png');

    // 7. Bazaar Baron Chance/Fund Card Modal (Desktop 1920x1080)
    await cdp.setViewport(1920, 1080, false);
    await triggerBaronCardViaSocket(cdp);
    await cdp.capture('baron-card-modal.png');

    // 8 & 9. Bazaar UNO Desktop & Mobile
    await cdp.setViewport(1920, 1080, false);
    await startMatchInLobby(cdp, { gameTitle: 'Bazaar UNO', botCount: 2 });
    await cdp.waitFor(
      `document.body.innerText.includes('Bazaar UNO') && document.body.innerText.includes('Draw Pile')`,
      15000,
      'Bazaar UNO active game'
    );
    await sleep(2000);
    await cdp.capture('uno-board-desktop.png');

    await cdp.setViewport(390, 844, true);
    await sleep(1500);
    await cdp.capture('uno-board-mobile.png');

    // 10 & 11. Bazaar Ludo Desktop & Mobile
    await cdp.setViewport(1920, 1080, false);
    await startMatchInLobby(cdp, { gameTitle: 'Bazaar Ludo', botCount: 3 });
    await cdp.waitFor(
      `document.body.innerText.includes('Bazaar Ludo') && document.body.innerText.includes('ROOM')`,
      15000,
      'Bazaar Ludo active game'
    );
    await sleep(1500);
    await cdp.capture('ludo-board-desktop.png');

    await cdp.setViewport(390, 844, true);
    await sleep(1500);
    await cdp.capture('ludo-board-mobile.png');

    // 12 & 13. Snakes & Ladders Desktop & Mobile
    await cdp.setViewport(1920, 1080, false);
    await startMatchInLobby(cdp, { gameTitle: 'Snakes & Ladders', botCount: 2 });
    await cdp.waitFor(
      `document.body.innerText.includes('Snakes & Ladders') && document.body.innerText.includes('ROOM')`,
      15000,
      'Snakes & Ladders active game'
    );
    await sleep(1500);
    await cdp.capture('snakes-board-desktop.png');

    await cdp.setViewport(390, 844, true);
    await sleep(1500);
    await cdp.capture('snakes-board-mobile.png');

    console.log('\n[Success] All 14 screenshots captured to docs/screenshots/');
  } finally {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    } catch {
      // ignore
    }
    try {
      chromeProc.kill('SIGKILL');
    } catch {
      // ignore
    }
    if (spawnedByUs && serverProc) {
      console.log('[Server] Stopping spawned server...');
      serverProc.kill('SIGTERM');
      await sleep(500);
      if (!serverProc.killed) {
        serverProc.kill('SIGKILL');
      }
    }
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

run().catch((err) => {
  console.error('[Error] Screenshot capture failed:', err);
  process.exit(1);
});
