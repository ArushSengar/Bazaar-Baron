import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import qrcode from 'qrcode-terminal';
import {
  createRoom,
  joinRoom,
  handlePlayerIntent,
  handleDisconnect,
  kickPlayer,
  setPlayerColor,
  setPlayerAvatar,
  addBotPlayer,
  loadSavedRoomState
} from './rooms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

/**
 * Detect local machine's LAN IPv4 address for Wi-Fi / Ethernet.
 */
function getLanIp() {
  const interfaces = os.networkInterfaces();
  const fallbackCandidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Typical private subnets: 192.168.x.x, 10.x.x.x, 172.16-31.x.x
        if (
          iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(iface.address)
        ) {
          return iface.address;
        }
        fallbackCandidates.push(iface.address);
      }
    }
  }
  return fallbackCandidates[0] || 'localhost';
}

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Try to load save.json if server restarted
loadSavedRoomState();

// Serve static React client build
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    // If request is GET and not an internal or socket route, serve index.html for SPA
    if (req.method === 'GET' && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <div style="font-family: sans-serif; padding: 40px; text-align: center;">
        <h2>Bazaar Baron Server Running!</h2>
        <p>Client build not found at <code>client/dist</code>.</p>
        <p>Run <code>npm run build</code> in the <code>client</code> folder or from the root.</p>
      </div>
    `);
  });
}

// Socket.IO Events
io.on('connection', (socket) => {
  // Create Room
  socket.on('create_room', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const result = createRoom(socket, typeof data === 'object' ? data : {});
    if (cb) cb(result);
  });

  // Join Room (or Reconnect)
  socket.on('join_room', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const result = joinRoom(socket, typeof data === 'object' ? data : {});
    if (result.success) {
      // Broadcast updated room state to all players in the room
      io.to(result.roomCode).emit('game_state_updated', result.gameState);
    }
    if (cb) cb(result);
  });

  // Player Change Color in Lobby
  socket.on('set_color', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const color = data?.color;
    const result = setPlayerColor(socket, color, io);
    if (cb) cb(result);
  });

  // Player Change Avatar in Lobby
  socket.on('set_avatar', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const avatar = data?.avatar;
    const result = setPlayerAvatar(socket, avatar, io);
    if (cb) cb(result);
  });

  // Host Add AI Bot Player
  socket.on('add_bot', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const result = addBotPlayer(socket, typeof data === 'object' ? data : {}, io);
    if (cb) cb(result);
  });

  // Host Kick Player
  socket.on('kick_player', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const targetPlayerId = data?.targetPlayerId;
    const result = kickPlayer(socket, targetPlayerId, io);
    if (cb) cb(result);
  });

  // Start Game (Host only)
  socket.on('start_game', (data, callback) => {
    const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
    const result = handlePlayerIntent(socket, { type: 'START_GAME' }, io);
    if (cb) cb(result);
  });

  // Client intents (roll, buy, decline_buy, auction_bid, build, mortgage, trade, end_turn, etc.)
  socket.on('game_intent', (intent, callback) => {
    const cb = typeof intent === 'function' ? intent : typeof callback === 'function' ? callback : null;
    const result = handlePlayerIntent(socket, typeof intent === 'object' ? intent : {}, io);
    if (cb) cb(result);
  });

  // Disconnect
  socket.on('disconnect', () => {
    handleDisconnect(socket, io);
  });
});

// Start listening on 0.0.0.0
server.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  const localUrl = `http://localhost:${PORT}`;
  const lanUrl = `http://${lanIp}:${PORT}`;

  console.log('\n========================================================');
  console.log('       🕌 BAZAAR BARON — LAN MULTIPLAYER BOARD GAME 🎲   ');
  console.log('========================================================');
  console.log(`Local Access:       ${localUrl}`);
  console.log(`LAN Access (Wi-Fi): ${lanUrl}`);
  console.log('--------------------------------------------------------');
  console.log('Scan QR Code with mobile devices on the same Wi-Fi:');
  
  try {
    qrcode.generate(lanUrl, { small: true }, (qr) => {
      console.log(qr);
    });
  } catch (err) {
    console.log('QR Code generation failed:', err.message);
  }

  console.log('========================================================\n');
});
