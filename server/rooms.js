import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_PHASES, PLAYER_COLORS, TURN_STEPS } from './engine/constants.js';
import { getActivePlayer, gameReducer } from './engine/reducer.js';
import {
  getGame,
  isValidGameType,
  runMonopolyBotTurns,
  runUnoBotTurns,
  monopolyBotTimers,
  unoBotTimers
} from './games/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVE_FILE_PATH = path.join(__dirname, 'data', 'save.json');

// In-memory store of active rooms
export const rooms = new Map();
// Socket ID -> { roomCode, playerId }
export const socketMap = new Map();
// Disconnect timers: playerId -> NodeJS.Timeout
const disconnectTimers = new Map();

// Backwards-compatible bot turn re-exports
export const runUnoBotTurnsIfNeeded = runUnoBotTurns;
export const runBotTurnsIfNeeded = runMonopolyBotTurns;

/**
 * Generate a clean 4-letter uppercase room code (avoiding ambiguous chars like O, I).
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

/**
 * Save current state to data/save.json.
 */
export function saveRoomState(room) {
  try {
    const dataDir = path.dirname(SAVE_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const saveData = {
      roomCode: room.code,
      gameState: room.gameState,
      savedAt: new Date().toISOString()
    };
    fs.writeFileSync(SAVE_FILE_PATH, JSON.stringify(saveData, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save state to save.json:', err.message);
  }
}

/**
 * Load saved state on server startup.
 */
export function loadSavedRoomState() {
  try {
    if (fs.existsSync(SAVE_FILE_PATH)) {
      const content = fs.readFileSync(SAVE_FILE_PATH, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.roomCode && data.gameState) {
        // Mark all players as disconnected on server restart until they reconnect
        data.gameState.players.forEach(p => {
          p.connected = false;
        });
        const restoredRoom = {
          code: data.roomCode,
          gameState: data.gameState,
          playerSockets: new Map() // playerId -> socketId
        };
        restoredRoom.saveState = () => saveRoomState(restoredRoom);
        rooms.set(data.roomCode, restoredRoom);
        console.log(`[Save/Resume] Restored room ${data.roomCode} from save.json (saved at ${data.savedAt})`);
      }
    }
  } catch (err) {
    console.warn('[Save/Resume] Could not restore saved game state:', err.message);
  }
}

/**
 * Get an unused color for a room.
 */
function getAvailableColor(gameState, requestedColor, gameDef) {
  const usedColors = new Set((gameState?.players || []).map(p => p.color));
  if (requestedColor && !usedColors.has(requestedColor)) {
    return requestedColor;
  }
  const colorList = gameDef?.availableColors || PLAYER_COLORS.map(c => c.id);
  for (const c of colorList) {
    const colorId = typeof c === 'object' && c?.id ? c.id : c;
    if (!usedColors.has(colorId)) {
      return colorId;
    }
  }
  const first = colorList[0];
  return typeof first === 'object' && first?.id ? first.id : first;
}

/**
 * Create a new room.
 */
export function createRoom(socket, { name, color, avatar, gameType }) {
  const roomCode = generateRoomCode();
  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const playerToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const gameDef = getGame(gameType);
  const assignedColor = getAvailableColor({ players: [] }, color, gameDef);

  const hostPlayer = gameDef.createPlayer({
    id: playerId,
    token: playerToken,
    name: (name || 'Host').trim().substring(0, 16),
    color: assignedColor,
    avatar: avatar || '👳',
    isHost: true,
    isBot: false
  });

  const gameState = gameDef.createInitialState(roomCode, hostPlayer);
  gameState.gameType = gameDef.id;

  const playerSockets = new Map();
  playerSockets.set(playerId, socket.id);

  const room = {
    code: roomCode,
    gameState,
    playerSockets,
    saveState() {
      saveRoomState(room);
    }
  };

  rooms.set(roomCode, room);
  socketMap.set(socket.id, { roomCode, playerId });
  socket.join(roomCode);

  saveRoomState(room);

  return {
    success: true,
    roomCode,
    playerToken,
    playerId,
    player: gameState.players[0],
    gameState
  };
}

/**
 * Join an existing room (or reconnect with playerToken).
 */
export function joinRoom(socket, { roomCode, name, color, avatar, playerToken }) {
  const code = (roomCode || '').trim().toUpperCase();
  const room = rooms.get(code);

  if (!room) {
    return { success: false, error: 'Room not found. Check the 4-letter code.' };
  }

  // Check if this is a reconnecting player with token
  if (playerToken) {
    const existingPlayer = room.gameState.players.find(p => p.token === playerToken);
    if (existingPlayer) {
      // Reconnect
      existingPlayer.connected = true;
      room.playerSockets.set(existingPlayer.id, socket.id);
      socketMap.set(socket.id, { roomCode: code, playerId: existingPlayer.id });
      socket.join(code);

      // Cancel disconnect timer if active
      if (disconnectTimers.has(existingPlayer.id)) {
        clearTimeout(disconnectTimers.get(existingPlayer.id));
        disconnectTimers.delete(existingPlayer.id);
      }

      room.gameState.logs.push({
        id: `log-${Date.now()}`,
        time: new Date().toISOString(),
        text: `🟢 ${existingPlayer.name} reconnected.`,
        type: 'info'
      });

      saveRoomState(room);

      return {
        success: true,
        reconnected: true,
        roomCode: code,
        playerToken: existingPlayer.token,
        playerId: existingPlayer.id,
        player: existingPlayer,
        gameState: room.gameState
      };
    }
  }

  // New player joining
  if (room.gameState.phase !== GAME_PHASES.LOBBY && room.gameState.phase !== 'LOBBY') {
    return { success: false, error: 'Game is already in progress in this room.' };
  }

  const gameDef = getGame(room.gameState.gameType);
  const maxPlayers = gameDef.maxPlayers || 6;
  if (room.gameState.players.length >= maxPlayers) {
    return { success: false, error: `Room is full (maximum ${maxPlayers} players).` };
  }

  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const assignedColor = getAvailableColor(room.gameState, color, gameDef);

  const cleanName = (name || `Player ${room.gameState.players.length + 1}`).trim().substring(0, 16);

  const newPlayer = gameDef.createPlayer({
    id: playerId,
    token: newToken,
    name: cleanName,
    color: assignedColor,
    avatar: avatar || '👩‍💼',
    isHost: false,
    isBot: false
  });

  room.gameState.players.push(newPlayer);
  room.gameState.playerOrder.push(playerId);
  room.playerSockets.set(playerId, socket.id);
  socketMap.set(socket.id, { roomCode: code, playerId });
  socket.join(code);

  room.gameState.logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    text: `👋 ${newPlayer.name} joined the room.`,
    type: 'info'
  });

  saveRoomState(room);

  return {
    success: true,
    reconnected: false,
    roomCode: code,
    playerToken: newToken,
    playerId,
    player: newPlayer,
    gameState: room.gameState
  };
}

/**
 * Handle player intent (dispatch to pure reducer).
 */
export function handlePlayerIntent(socket, intent, io) {
  const session = socketMap.get(socket.id);
  if (!session) return { success: false, error: 'Not in a room' };

  const room = rooms.get(session.roomCode);
  if (!room) return { success: false, error: 'Room does not exist' };

  // Attach verified playerId from session
  const intentWithPlayer = { ...intent, playerId: session.playerId };

  const gameDef = getGame(room.gameState.gameType);
  const nextState = gameDef.reducer(room.gameState, intentWithPlayer);
  room.gameState = nextState;

  saveRoomState(room);

  // Broadcast new state to all clients in the room
  io.to(room.code).emit('game_state_updated', room.gameState);

  // Trigger automated AI Bot actions
  if (typeof gameDef.runBotTurn === 'function') {
    gameDef.runBotTurn(room, io);
  }

  return { success: true };
}

/**
 * Handle player disconnect.
 */
export function handleDisconnect(socket, io) {
  const session = socketMap.get(socket.id);
  if (!session) return;

  const { roomCode, playerId } = session;
  socketMap.delete(socket.id);

  const room = rooms.get(roomCode);
  if (!room) return;

  const player = room.gameState.players.find(p => p.id === playerId);
  if (!player) return;

  player.connected = false;
  room.playerSockets.delete(playerId);

  room.gameState.logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    text: `🔴 ${player.name} disconnected. (Turn timer: 60s)`,
    type: 'warning'
  });

  io.to(roomCode).emit('game_state_updated', room.gameState);

  // 60-second timer to skip player's turn if currently their turn in a live game
  if (room.gameState.phase === GAME_PHASES.PLAYING || room.gameState.phase === 'PLAYING') {
    const timer = setTimeout(() => {
      const currentActive = getActivePlayer(room.gameState);
      if (currentActive && currentActive.id === playerId && !currentActive.bankrupt) {
        room.gameState.logs.push({
          id: `log-${Date.now()}`,
          time: new Date().toISOString(),
          text: `⏰ ${player.name}'s turn skipped due to 60s disconnect timeout.`,
          type: 'warning'
        });

        // Force turn end
        let updated = room.gameState;
        if (updated.step === TURN_STEPS.AWAITING_BUY) {
          updated = gameReducer(updated, { type: 'DECLINE_BUY', playerId });
        }
        updated = gameReducer(updated, { type: 'END_TURN', playerId });
        room.gameState = updated;
        saveRoomState(room);
        io.to(roomCode).emit('game_state_updated', room.gameState);
      }
      disconnectTimers.delete(playerId);
    }, 60000);

    disconnectTimers.set(playerId, timer);
  }
}

/**
 * Host kicks a player from the room.
 */
export function kickPlayer(socket, targetPlayerId, io) {
  const session = socketMap.get(socket.id);
  if (!session) return { success: false, error: 'Not in a room' };

  const room = rooms.get(session.roomCode);
  if (!room) return { success: false, error: 'Room does not exist' };

  const hostPlayer = room.gameState.players.find(p => p.id === session.playerId);
  if (!hostPlayer || !hostPlayer.isHost) {
    return { success: false, error: 'Only the room host can kick players.' };
  }

  const targetPlayer = room.gameState.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer || targetPlayer.isHost) {
    return { success: false, error: 'Cannot kick host.' };
  }

  if (room.gameState.phase === GAME_PHASES.LOBBY || room.gameState.phase === 'LOBBY') {
    // Remove from lobby
    room.gameState.players = room.gameState.players.filter(p => p.id !== targetPlayerId);
    room.gameState.playerOrder = room.gameState.playerOrder.filter(id => id !== targetPlayerId);
  } else {
    // In game: bankrupt if monopoly, else disconnect
    if (room.gameState.gameType === 'monopoly') {
      room.gameState = gameReducer(room.gameState, { type: 'BANKRUPT', playerId: targetPlayerId });
    } else {
      targetPlayer.connected = false;
    }
  }

  room.gameState.logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    text: `👢 ${targetPlayer.name} was kicked by host.`,
    type: 'warning'
  });

  const targetSocketId = room.playerSockets.get(targetPlayerId);
  if (targetSocketId) {
    io.to(targetSocketId).emit('kicked', { message: 'You have been kicked by the host.' });
  }

  saveRoomState(room);
  io.to(room.code).emit('game_state_updated', room.gameState);
  return { success: true };
}

/**
 * Update player color in lobby.
 */
export function setPlayerColor(socket, newColor, io) {
  const session = socketMap.get(socket.id);
  if (!session) return { success: false };

  const room = rooms.get(session.roomCode);
  if (!room || (room.gameState.phase !== GAME_PHASES.LOBBY && room.gameState.phase !== 'LOBBY')) return { success: false };

  const player = room.gameState.players.find(p => p.id === session.playerId);
  if (!player) return { success: false };

  // Check if color is already taken by another player
  const isTaken = room.gameState.players.some(p => p.id !== player.id && p.color === newColor);
  if (isTaken) {
    return { success: false, error: 'Color already chosen by another player.' };
  }

  player.color = newColor;
  saveRoomState(room);
  io.to(room.code).emit('game_state_updated', room.gameState);
  return { success: true };
}

/**
 * Update player avatar in lobby.
 */
export function setPlayerAvatar(socket, newAvatar, io) {
  const session = socketMap.get(socket.id);
  if (!session) return { success: false };

  const room = rooms.get(session.roomCode);
  if (!room || (room.gameState.phase !== GAME_PHASES.LOBBY && room.gameState.phase !== 'LOBBY')) return { success: false };

  const player = room.gameState.players.find(p => p.id === session.playerId);
  if (!player) return { success: false };

  player.avatar = newAvatar;
  saveRoomState(room);
  io.to(room.code).emit('game_state_updated', room.gameState);
  return { success: true };
}

/**
 * Add an AI Bot Player to room in lobby (Host only).
 */
export function addBotPlayer(socket, botData, io) {
  const session = socketMap.get(socket.id);
  if (!session) return { success: false, error: 'Not in a room' };

  const room = rooms.get(session.roomCode);
  if (!room || (room.gameState.phase !== GAME_PHASES.LOBBY && room.gameState.phase !== 'LOBBY')) {
    return { success: false, error: 'Cannot add bot once game has started.' };
  }

  const hostPlayer = room.gameState.players.find(p => p.id === session.playerId);
  if (!hostPlayer || !hostPlayer.isHost) {
    return { success: false, error: 'Only the room host can add AI players.' };
  }

  const gameDef = getGame(room.gameState.gameType);
  const maxBots = gameDef.maxPlayers || 6;
  if (room.gameState.players.length >= maxBots) {
    return { success: false, error: `Room is full (maximum ${maxBots} players).` };
  }

  const defaultBotNames = gameDef.defaultBotNames || ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)'];
  const usedNames = new Set(room.gameState.players.map(p => p.name));
  const botName = botData?.name || defaultBotNames.find(n => !usedNames.has(n)) || `Player ${room.gameState.players.length + 1} (AI)`;
  const botAvatar = botData?.avatar || (botName.includes('Priya') ? '👩‍💼' : (botName.includes('Rani') ? '👸' : (botName.includes('Meera') ? '🧕' : '👳')));

  const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const assignedColor = getAvailableColor(room.gameState, botData?.color, gameDef);

  const newBot = gameDef.createPlayer({
    id: botId,
    token: `tok_bot_${Date.now()}`,
    name: botName,
    avatar: botAvatar,
    color: assignedColor,
    isHost: false,
    isBot: true
  });

  room.gameState.players.push(newBot);
  room.gameState.playerOrder.push(botId);

  room.gameState.logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    text: `🤖 ${newBot.name} joined the room as an AI player.`,
    type: 'info'
  });

  saveRoomState(room);
  if (io && typeof io.to === 'function') {
    io.to(room.code).emit('game_state_updated', room.gameState);
  }
  return { success: true, bot: newBot };
}
