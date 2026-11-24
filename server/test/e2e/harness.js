/**
 * Bazaar Arcade E2E Test Harness
 * 
 * Provides ephemeral loopback Socket.IO server, connected test client factories,
 * state transition listeners, multi-player/bot room builders, and headless browser shims.
 */

import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import {
  createRoom,
  joinRoom,
  handlePlayerIntent,
  handleDisconnect,
  setPlayerColor,
  setPlayerAvatar,
  addBotPlayer,
  kickPlayer,
  rooms,
  socketMap,
  saveRoomState
} from '../../rooms.js';

// Global timer tracker to prevent 60-second disconnect timers and bot timeouts from blocking exit
const activeTimers = new Set();
const origSetTimeout = globalThis.setTimeout;
const origClearTimeout = globalThis.clearTimeout;

globalThis.setTimeout = function (fn, ms, ...args) {
  const t = origSetTimeout((...cbArgs) => {
    activeTimers.delete(t);
    return fn(...cbArgs);
  }, ms, ...args);
  activeTimers.add(t);
  if (ms >= 3000 && typeof t.unref === 'function') {
    t.unref();
  }
  return t;
};

globalThis.clearTimeout = function (t) {
  activeTimers.delete(t);
  return origClearTimeout(t);
};

export function clearAllTimers() {
  for (const t of activeTimers) {
    origClearTimeout(t);
  }
  activeTimers.clear();
}
let ludoStateModule = null;
let ludoReducerModule = null;
let snakesStateModule = null;
let snakesReducerModule = null;

try {
  ludoStateModule = await import('../../engine/ludo/state.js');
  ludoReducerModule = await import('../../engine/ludo/reducer.js');
} catch (_) {}

try {
  snakesStateModule = await import('../../engine/snakes/state.js');
  snakesReducerModule = await import('../../engine/snakes/reducer.js');
} catch (_) {}

/**
 * Starts an ephemeral HTTP + Socket.IO server bound to port 0 on 127.0.0.1.
 * Wires all production room events and intent handling.
 */
export async function startTestServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    // 1. Create Room
    socket.on('create_room', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const payload = typeof data === 'object' && data !== null ? data : {};
      const result = createRoom(socket, payload);

      // Multi-game adapter support if rooms.js hasn't yet merged M4 registry
      if (result.success && payload.gameType) {
        const room = rooms.get(result.roomCode);
        if (room && room.gameState.gameType !== payload.gameType) {
          if (payload.gameType === 'ludo' && ludoStateModule?.createInitialLudoState) {
            room.gameState = ludoStateModule.createInitialLudoState(result.roomCode, result.player);
            result.gameState = room.gameState;
          } else if (payload.gameType === 'snakes_and_ladders' && snakesStateModule?.createInitialSnakesState) {
            room.gameState = snakesStateModule.createInitialSnakesState(result.roomCode, result.player);
            result.gameState = room.gameState;
          }
        }
      }

      if (cb) cb(result);
    });

    // 2. Join Room (or Reconnect)
    socket.on('join_room', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const payload = typeof data === 'object' && data !== null ? data : {};
      const result = joinRoom(socket, payload);

      if (result.success) {
        const room = rooms.get(result.roomCode);
        // Ensure Ludo/Snakes player structure if needed
        if (room) {
          const joinedPlayer = room.gameState.players.find((p) => p.id === result.playerId);
          if (joinedPlayer) {
            if (room.gameState.gameType === 'ludo' && !joinedPlayer.tokens && ludoStateModule?.createInitialLudoTokens) {
              joinedPlayer.tokens = ludoStateModule.createInitialLudoTokens();
              joinedPlayer.completedTokens = 0;
              joinedPlayer.rank = null;
            } else if (room.gameState.gameType === 'snakes_and_ladders' && joinedPlayer.position === undefined) {
              joinedPlayer.position = 0;
            }
          }
        }
        io.to(result.roomCode).emit('game_state_updated', result.gameState);
      }
      if (cb) cb(result);
    });

    // 3. Set Color
    socket.on('set_color', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const color = data?.color;
      const result = setPlayerColor(socket, color, io);
      if (cb) cb(result);
    });

    // 4. Set Avatar
    socket.on('set_avatar', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const avatar = data?.avatar;
      const result = setPlayerAvatar(socket, avatar, io);
      if (cb) cb(result);
    });

    // 5. Add AI Bot
    socket.on('add_bot', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const payload = typeof data === 'object' && data !== null ? data : {};
      const result = addBotPlayer(socket, payload, io);

      if (result.success && result.bot) {
        const session = socketMap.get(socket.id);
        const room = session ? rooms.get(session.roomCode) : null;
        if (room) {
          if (room.gameState.gameType === 'ludo' && !result.bot.tokens && ludoStateModule?.createInitialLudoTokens) {
            result.bot.tokens = ludoStateModule.createInitialLudoTokens();
            result.bot.completedTokens = 0;
            result.bot.rank = null;
          } else if (room.gameState.gameType === 'snakes_and_ladders' && result.bot.position === undefined) {
            result.bot.position = 0;
          }
        }
      }

      if (cb) cb(result);
    });

    // 6. Kick Player
    socket.on('kick_player', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const targetPlayerId = data?.targetPlayerId;
      const result = kickPlayer(socket, targetPlayerId, io);
      if (cb) cb(result);
    });

    // 7. Start Game
    socket.on('start_game', (data, callback) => {
      const cb = typeof data === 'function' ? data : typeof callback === 'function' ? callback : null;
      const session = socketMap.get(socket.id);
      const room = session ? rooms.get(session.roomCode) : null;

      if (room && room.gameState.gameType === 'ludo' && ludoReducerModule?.ludoReducer) {
        room.gameState = ludoReducerModule.ludoReducer(room.gameState, { type: 'START_GAME' });
        saveRoomState(room);
        io.to(room.code).emit('game_state_updated', room.gameState);
        if (cb) cb({ success: true, gameState: room.gameState });
        return;
      }

      if (room && room.gameState.gameType === 'snakes_and_ladders' && snakesReducerModule?.snakesReducer) {
        room.gameState = snakesReducerModule.snakesReducer(room.gameState, { type: 'START_GAME' });
        saveRoomState(room);
        io.to(room.code).emit('game_state_updated', room.gameState);
        if (cb) cb({ success: true, gameState: room.gameState });
        return;
      }

      const result = handlePlayerIntent(socket, { type: 'START_GAME' }, io);
      if (cb) cb(result);
    });

    // 8. Game Intent
    socket.on('game_intent', (intent, callback) => {
      const cb = typeof intent === 'function' ? intent : typeof callback === 'function' ? callback : null;
      const payload = typeof intent === 'object' && intent !== null ? intent : {};

      const session = socketMap.get(socket.id);
      if (!session) {
        if (cb) cb({ success: false, error: 'Not in a room' });
        return;
      }

      const room = rooms.get(session.roomCode);
      if (!room) {
        if (cb) cb({ success: false, error: 'Room does not exist' });
        return;
      }

      // Check Ludo fallback
      if (room.gameState.gameType === 'ludo' && ludoReducerModule?.ludoReducer) {
        const enrichedIntent = { ...payload, playerId: session.playerId };
        const prevPhase = room.gameState.phase;
        room.gameState = ludoReducerModule.ludoReducer(room.gameState, enrichedIntent);
        saveRoomState(room);
        io.to(room.code).emit('game_state_updated', room.gameState);
        if (cb) cb({ success: true, gameState: room.gameState });
        return;
      }

      // Check Snakes fallback
      if (room.gameState.gameType === 'snakes_and_ladders' && snakesReducerModule?.snakesReducer) {
        const enrichedIntent = { ...payload, playerId: session.playerId };
        room.gameState = snakesReducerModule.snakesReducer(room.gameState, enrichedIntent);
        saveRoomState(room);
        io.to(room.code).emit('game_state_updated', room.gameState);
        if (cb) cb({ success: true, gameState: room.gameState });
        return;
      }

      const result = handlePlayerIntent(socket, payload, io);
      if (cb) cb(result);
    });

    // 9. Disconnect
    socket.on('disconnect', () => {
      handleDisconnect(socket, io);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const url = `http://127.0.0.1:${port}`;

      resolve({
        server,
        io,
        port,
        url,
        async close() {
          try {
            io.disconnectSockets(true);
            await new Promise((r) => io.close(r));
            await new Promise((r) => server.close(r));
            server.unref();
          } catch (_) {}
          clearAllTimers();
          rooms.clear();
          socketMap.clear();
        }
      });
    });
  });
}

/**
 * Creates an enhanced socket.io-client connected to the given URL with async helpers.
 */
export async function createTestClient(url, options = {}) {
  const client = Client(url, {
    reconnection: false,
    forceNew: true,
    transports: ['websocket'],
    ...options
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 4000);
    client.once('connect', () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  client.emitAsync = function (event, data) {
    return new Promise((resolve) => {
      client.emit(event, data, (response) => {
        resolve(response);
      });
    });
  };

  client.waitForState = function (predicate, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      let timer = null;

      function handler(state) {
        try {
          if (predicate(state)) {
            if (timer) clearTimeout(timer);
            client.off('game_state_updated', handler);
            resolve(state);
          }
        } catch (_) {
          // ignore predicate evaluation errors while state evolves
        }
      }

      timer = setTimeout(() => {
        client.off('game_state_updated', handler);
        reject(new Error(`Timed out after ${timeoutMs}ms waiting for state matching predicate`));
      }, timeoutMs);

      client.on('game_state_updated', handler);
    });
  };

  client.waitForEvent = function (event, predicate = () => true, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      let timer = null;

      function handler(payload) {
        try {
          if (predicate(payload)) {
            if (timer) clearTimeout(timer);
            client.off(event, handler);
            resolve(payload);
          }
        } catch (_) {}
      }

      timer = setTimeout(() => {
        client.off(event, handler);
        reject(new Error(`Timed out after ${timeoutMs}ms waiting for event ${event}`));
      }, timeoutMs);

      client.on(event, handler);
    });
  };

  return client;
}

/**
 * High-level setup utility to build an active room with N clients & M bots.
 */
export async function setupTestRoom({
  gameType = 'monopoly',
  hostName = 'HostPlayer',
  numClients = 1,
  botCount = 0
} = {}) {
  const serverInstance = await startTestServer();
  const clients = [];

  const host = await createTestClient(serverInstance.url);
  clients.push(host);

  const createRes = await host.emitAsync('create_room', {
    name: hostName,
    gameType
  });

  const roomCode = createRes.roomCode;

  for (let i = 1; i < numClients; i++) {
    const guest = await createTestClient(serverInstance.url);
    clients.push(guest);
    await guest.emitAsync('join_room', {
      roomCode,
      name: `Player_${i + 1}`
    });
  }

  for (let b = 0; b < botCount; b++) {
    await host.emitAsync('add_bot', {
      name: `Bot_${b + 1} (AI)`
    });
  }

  return {
    ...serverInstance,
    roomCode,
    host,
    clients,
    createRes,
    async teardown() {
      for (const c of clients) {
        try {
          if (c.connected) c.disconnect();
        } catch (_) {}
      }
      await serverInstance.close();
    }
  };
}

/**
 * Headless browser polyfill for Web Audio API & localStorage in Node.js test environment.
 */
export function mockBrowserEnvironment() {
  const store = new Map();
  const mockLocalStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };

  class MockAudioParam {
    setValueAtTime() { return this; }
    exponentialRampToValueAtTime() { return this; }
    linearRampToValueAtTime() { return this; }
    cancelScheduledValues() { return this; }
  }

  class MockAudioNode {
    constructor() {
      this.frequency = new MockAudioParam();
      this.gain = new MockAudioParam();
      this.Q = new MockAudioParam();
      this.type = 'sine';
    }
    connect() { return this; }
    disconnect() { return this; }
    setValueAtTime() { return this; }
    exponentialRampToValueAtTime() { return this; }
    linearRampToValueAtTime() { return this; }
    cancelScheduledValues() { return this; }
    start() {}
    stop() {}
  }

  class MockAudioContext {
    constructor() {
      this.state = 'running';
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.destination = new MockAudioNode();
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    createOscillator() {
      return new MockAudioNode();
    }
    createGain() {
      return new MockAudioNode();
    }
    createBuffer(channels, length, sampleRate) {
      return {
        getChannelData: () => new Float32Array(length)
      };
    }
    createBufferSource() {
      return new MockAudioNode();
    }
    createBiquadFilter() {
      return new MockAudioNode();
    }
  }

  const prevLocalStorage = globalThis.localStorage;
  const prevWindow = globalThis.window;

  globalThis.localStorage = mockLocalStorage;
  globalThis.window = {
    localStorage: mockLocalStorage,
    AudioContext: MockAudioContext,
    webkitAudioContext: MockAudioContext,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  return {
    storage: mockLocalStorage,
    AudioContext: MockAudioContext,
    restore() {
      if (prevLocalStorage) {
        globalThis.localStorage = prevLocalStorage;
      } else {
        delete globalThis.localStorage;
      }
      if (prevWindow) {
        globalThis.window = prevWindow;
      } else {
        delete globalThis.window;
      }
    }
  };
}
