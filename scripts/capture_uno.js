import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

async function captureUnoScreenshot() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9333',
    '--remote-allow-origins=*',
    '--window-size=1920,1080',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-gpu'
  ]);

  // Wait 1.5s for Chrome to bind port 9333
  await new Promise(r => setTimeout(r, 1500));

  try {
    const res = await fetch('http://127.0.0.1:9333/json/new?http://localhost:3000', { method: 'PUT' });
    const target = await res.json();
    console.log('Target created:', target.webSocketDebuggerUrl);

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const handler = (msg) => {
          const data = JSON.parse(msg.data);
          if (data.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });

    // Wait 2s for page load
    await new Promise(r => setTimeout(r, 2000));

    // Fill name and create room
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          if (input) {
            input.value = 'Arush';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
          const buttons = Array.from(document.querySelectorAll('button'));
          const createBtn = buttons.find(b => b.textContent.includes('Create Room') || b.textContent.includes('Create Match') || b.textContent.includes('Host'));
          if (createBtn) createBtn.click();
        })()
      `
    });

    // Wait for lobby to load
    await new Promise(r => setTimeout(r, 1500));

    // Switch game to UNO, add bot, and start game
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Click UNO selector card
          const cards = Array.from(document.querySelectorAll('button, div'));
          const unoCard = cards.find(el => el.textContent && el.textContent.includes('Bazaar UNO') && el.tagName === 'BUTTON');
          if (unoCard) unoCard.click();

          // Add bot
          setTimeout(() => {
            const addBotBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Add Bot') || b.textContent.includes('Add AI Friend')));
            if (addBotBtn) {
              addBotBtn.click();
              setTimeout(() => {
                const addBotBtn2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Add Bot') || b.textContent.includes('Add AI Friend')));
                if (addBotBtn2) addBotBtn2.click();

                // Start game
                setTimeout(() => {
                  const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Start Game'));
                  if (startBtn) startBtn.click();
                }, 800);
              }, 600);
            }
          }, 600);
        })()
      `
    });

    // Wait for game start transition and card dealing animation
    await new Promise(r => setTimeout(r, 4000));

    // Capture screenshot
    const screenshot = await send('Page.captureScreenshot', { format: 'png', quality: 100 });
    const buffer = Buffer.from(screenshot.data, 'base64');
    const outPath = path.resolve('docs/images/uno-gameplay.png');
    fs.writeFileSync(outPath, buffer);
    console.log(`Saved screenshot to ${outPath} (${buffer.length} bytes)`);

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

captureUnoScreenshot().catch(console.error);
