import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialGameState } from './engine/state.js';
import { gameReducer, getActivePlayer } from './engine/reducer.js';
import { GAME_PHASES, PLAYER_COLORS, TURN_STEPS } from './engine/constants.js';
import { createInitialUnoState, unoReducer } from './engine/uno/reducer.js';
import { canPlayUnoCard } from './engine/uno/rules.js';
import { UNO_PHASES, UNO_COLORS } from './engine/uno/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAVE_FILE_PATH = path.join(__dirname, 'data', 'save.json');
const BOARD_DATA_PATH = path.join(__dirname, 'data', 'board.json');
const boardData = JSON.parse(fs.readFileSync(BOARD_DATA_PATH, 'utf-8'));

// In-memory store of active rooms
export const rooms = new Map();
// Socket ID -> { roomCode, playerId }
export const socketMap = new Map();
// Disconnect timers: playerId -> NodeJS.Timeout
const disconnectTimers = new Map();
// Bot turn timeouts: roomCode -> NodeJS.Timeout
const botTimers = new Map();

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
        rooms.set(data.roomCode, {
          code: data.roomCode,
          gameState: data.gameState,
          playerSockets: new Map() // playerId -> socketId
        });
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
function getAvailableColor(gameState, requestedColor) {
  const usedColors = new Set(gameState.players.map(p => p.color));
  if (requestedColor && !usedColors.has(requestedColor)) {
    return requestedColor;
  }
  for (const c of PLAYER_COLORS) {
    if (!usedColors.has(c.id)) {
      return c.id;
    }
  }
  return PLAYER_COLORS[0].id;
}

/**
 * Create a new room.
 */
export function createRoom(socket, { name, color, avatar, gameType }) {
  const roomCode = generateRoomCode();
  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const playerToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const isUno = gameType === 'uno';
  const hostPlayer = {
    id: playerId,
    token: playerToken,
    name: (name || 'Host').trim().substring(0, 16),
    color: color || PLAYER_COLORS[0].id,
    avatar: avatar || '👳',
    score: 0,
    cards: [],
    calledUno: false
  };

  const gameState = isUno
    ? createInitialUnoState(roomCode, hostPlayer)
    : createInitialGameState(roomCode, hostPlayer);
  const playerSockets = new Map();
  playerSockets.set(playerId, socket.id);

  const room = {
    code: roomCode,
    gameState,
    playerSockets
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
  if (room.gameState.phase !== GAME_PHASES.LOBBY) {
    return { success: false, error: 'Game is already in progress in this room.' };
  }

  const maxPlayers = room.gameState.gameType === 'uno' ? 10 : 6;
  if (room.gameState.players.length >= maxPlayers) {
    return { success: false, error: `Room is full (maximum ${maxPlayers} players).` };
  }

  const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const assignedColor = getAvailableColor(room.gameState, color);

  const cleanName = (name || `Player ${room.gameState.players.length + 1}`).trim().substring(0, 16);

  const newPlayer = room.gameState.gameType === 'uno'
    ? {
        id: playerId,
        token: newToken,
        name: cleanName,
        color: assignedColor,
        avatar: avatar || '👩‍💼',
        cards: [],
        score: 0,
        calledUno: false,
        connected: true,
        isHost: false,
        isBot: false
      }
    : {
        id: playerId,
        token: newToken,
        name: cleanName,
        color: assignedColor,
        avatar: avatar || '👩‍💼',
        cash: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        bankrupt: false,
        connected: true,
        isHost: false,
        isBot: false
      };

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

  const isUno = room.gameState.gameType === 'uno';
  const nextState = isUno
    ? unoReducer(room.gameState, intentWithPlayer)
    : gameReducer(room.gameState, intentWithPlayer);
  room.gameState = nextState;

  saveRoomState(room);

  // Broadcast new state to all clients in the room
  io.to(room.code).emit('game_state_updated', room.gameState);

  // Trigger automated AI Bot actions
  if (isUno) {
    runUnoBotTurnsIfNeeded(room, io);
  } else {
    runBotTurnsIfNeeded(room, io);
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
  if (room.gameState.phase === GAME_PHASES.PLAYING) {
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

  if (room.gameState.phase === GAME_PHASES.LOBBY) {
    // Remove from lobby
    room.gameState.players = room.gameState.players.filter(p => p.id !== targetPlayerId);
    room.gameState.playerOrder = room.gameState.playerOrder.filter(id => id !== targetPlayerId);
  } else {
    // In game: bankrupt player
    room.gameState = gameReducer(room.gameState, { type: 'BANKRUPT', playerId: targetPlayerId });
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
  if (!room || room.gameState.phase !== GAME_PHASES.LOBBY) return { success: false };

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
  if (!room || room.gameState.phase !== GAME_PHASES.LOBBY) return { success: false };

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
  if (!room || room.gameState.phase !== GAME_PHASES.LOBBY) {
    return { success: false, error: 'Cannot add bot once game has started.' };
  }

  const hostPlayer = room.gameState.players.find(p => p.id === session.playerId);
  if (!hostPlayer || !hostPlayer.isHost) {
    return { success: false, error: 'Only the room host can add AI players.' };
  }

  const maxBots = room.gameState.gameType === 'uno' ? 10 : 6;
  if (room.gameState.players.length >= maxBots) {
    return { success: false, error: `Room is full (maximum ${maxBots} players).` };
  }

  const defaultBotNames = ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)', 'Meera (AI)', 'Vikram (AI)', 'Ananya (AI)', 'Rohan (AI)'];
  const usedNames = new Set(room.gameState.players.map(p => p.name));
  const botName = botData?.name || defaultBotNames.find(n => !usedNames.has(n)) || `Player ${room.gameState.players.length + 1} (AI)`;
  const botAvatar = botData?.avatar || (botName.includes('Priya') ? '👩‍💼' : (botName.includes('Rani') ? '👸' : (botName.includes('Meera') ? '🧕' : '👳')));

  const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const assignedColor = getAvailableColor(room.gameState, botData?.color);

  const isUno = room.gameState.gameType === 'uno';
  const newBot = isUno
    ? {
        id: botId,
        token: `tok_bot_${Date.now()}`,
        name: botName,
        avatar: botAvatar,
        color: assignedColor,
        cards: [],
        score: 0,
        calledUno: false,
        connected: true,
        isHost: false,
        isBot: true
      }
    : {
        id: botId,
        token: `tok_bot_${Date.now()}`,
        name: botName,
        avatar: botAvatar,
        color: assignedColor,
        cash: 1500,
        position: 0,
        inJail: false,
        jailTurns: 0,
        getOutOfJailCards: 0,
        bankrupt: false,
        connected: true,
        isHost: false,
        isBot: true
      };

  room.gameState.players.push(newBot);
  room.gameState.playerOrder.push(botId);

  room.gameState.logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    text: `🤖 ${newBot.name} joined the room as an AI Merchant.`,
    type: 'info'
  });

  saveRoomState(room);
  io.to(room.code).emit('game_state_updated', room.gameState);
  return { success: true, bot: newBot };
}

/**
 * Dispatch bot intent safely through pure reducer.
 */
function handleBotIntent(room, intent, io) {
  room.gameState = gameReducer(room.gameState, intent);
  saveRoomState(room);
  io.to(room.code).emit('game_state_updated', room.gameState);
  runBotTurnsIfNeeded(room, io);
}

/**
 * Automated turn runner for AI bots: executes turns with readable ~850ms human pacing.
 */
function runBotTurnsIfNeeded(room, io) {
  if (!room || !room.gameState || room.gameState.phase !== GAME_PHASES.PLAYING) return;

  // Clear existing timer if any
  if (botTimers.has(room.code)) {
    clearTimeout(botTimers.get(room.code));
    botTimers.delete(room.code);
  }

  const activePlayer = getActivePlayer(room.gameState);

  // Check if an auction is running where a bot needs to bid or pass
  if (room.gameState.step === TURN_STEPS.AUCTION && room.gameState.auction) {
    const auction = room.gameState.auction;
    const activeBotBidder = (auction.activeBidders || []).find(id => {
      const p = room.gameState.players.find(x => x.id === id);
      return p && p.isBot && id !== auction.highestBidderId;
    });

    if (activeBotBidder) {
      const timer = setTimeout(() => {
        botTimers.delete(room.code);
        if (!room.gameState.auction) return;
        const bot = room.gameState.players.find(p => p.id === activeBotBidder);
        const tile = boardData[auction.tileId];
        const nextBid = (auction.currentBid || 0) + 10;
        if (bot && bot.cash >= nextBid && nextBid <= (tile?.cost || 200) * 0.75) {
          handleBotIntent(room, { type: 'AUCTION_BID', amount: nextBid, playerId: bot.id }, io);
        } else {
          handleBotIntent(room, { type: 'AUCTION_PASS', playerId: activeBotBidder }, io);
        }
      }, 950);
      botTimers.set(room.code, timer);
      return;
    }
  }

  // Active player turn
  if (!activePlayer || !activePlayer.isBot || activePlayer.bankrupt) return;

  const timer = setTimeout(() => {
    botTimers.delete(room.code);
    if (room.gameState.phase !== GAME_PHASES.PLAYING) return;

    const currentActive = getActivePlayer(room.gameState);
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    const step = room.gameState.step;

    if (step === TURN_STEPS.INITIAL) {
      if (currentActive.inJail) {
        if (currentActive.cash >= 150) {
          handleBotIntent(room, { type: 'PAY_JAIL_FINE', playerId: currentActive.id }, io);
        } else {
          handleBotIntent(room, { type: 'ROLL_DICE', playerId: currentActive.id }, io);
        }
      } else {
        handleBotIntent(room, { type: 'ROLL_DICE', playerId: currentActive.id }, io);
      }
      return;
    }

    if (step === TURN_STEPS.AWAITING_BUY) {
      const tile = boardData[currentActive.position];
      if (tile && currentActive.cash >= tile.cost + 100) {
        handleBotIntent(room, { type: 'BUY_PROPERTY', playerId: currentActive.id }, io);
      } else {
        handleBotIntent(room, { type: 'DECLINE_BUY', playerId: currentActive.id }, io);
      }
      return;
    }

    if (room.gameState.drawnCard) {
      handleBotIntent(room, { type: 'DISMISS_CARD', playerId: currentActive.id }, io);
      return;
    }

    if (step === TURN_STEPS.TURN_END) {
      handleBotIntent(room, { type: 'END_TURN', playerId: currentActive.id }, io);
      return;
    }

    if (step === TURN_STEPS.BANKRUPTCY_CHECK && room.gameState.debt) {
      if (currentActive.cash >= room.gameState.debt.amount) {
        handleBotIntent(room, { type: 'RESOLVE_DEBT', playerId: currentActive.id }, io);
      } else {
        handleBotIntent(room, { type: 'BANKRUPT', playerId: currentActive.id }, io);
      }
      return;
    }
  }, 950);

  botTimers.set(room.code, timer);
}

/**
 * Automated turn runner for AI bots in UNO: plays cards or draws with ~950ms realistic human pacing.
 */
export function runUnoBotTurnsIfNeeded(room, io) {
  if (!room || !room.gameState || room.gameState.phase !== UNO_PHASES.PLAYING) return;

  const timerKey = `uno_${room.code}`;
  if (botTimers.has(timerKey)) {
    clearTimeout(botTimers.get(timerKey));
    botTimers.delete(timerKey);
  }

  // 1. Check if any opponent has 1 card without calling UNO (chance to catch them)
  const vulnerableOpponent = room.gameState.players.find(p => p.cards.length === 1 && !p.calledUno && !p.isBot);
  if (vulnerableOpponent) {
    const catchTimer = setTimeout(() => {
      if (room.gameState.phase !== UNO_PHASES.PLAYING) return;
      const target = room.gameState.players.find(p => p.id === vulnerableOpponent.id);
      if (target && target.cards.length === 1 && !target.calledUno) {
        const botCatcher = room.gameState.players.find(p => p.isBot);
        if (botCatcher) {
          room.gameState = unoReducer(room.gameState, {
            type: 'CATCH_UNO',
            playerId: botCatcher.id,
            targetPlayerId: target.id
          });
          saveRoomState(room);
          io.to(room.code).emit('game_state_updated', room.gameState);
        }
      }
    }, 1400);
    botTimers.set(`${timerKey}_catch`, catchTimer);
  }

  // 2. Active player bot turn
  const activePlayer = room.gameState.players[room.gameState.turnIndex];
  if (!activePlayer || !activePlayer.isBot) return;

  const timer = setTimeout(() => {
    botTimers.delete(timerKey);
    if (room.gameState.phase !== UNO_PHASES.PLAYING) return;

    const currentActive = room.gameState.players[room.gameState.turnIndex];
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    const topCard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
    const playableCards = currentActive.cards.filter(c => canPlayUnoCard(c, topCard, room.gameState.activeColor));

    if (playableCards.length > 0) {
      // Pick card: prefer matching number/color, then action, then wild last
      const nonWilds = playableCards.filter(c => c.color !== 'wild');
      const chosenCard = nonWilds.length > 0 ? nonWilds[0] : playableCards[0];

      let chosenColor = null;
      if (chosenCard.color === 'wild' || chosenCard.type === 'wild' || chosenCard.type === 'wild4') {
        const colorCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        for (const c of currentActive.cards) {
          if (colorCounts[c.color] !== undefined) colorCounts[c.color]++;
        }
        chosenColor = Object.entries(colorCounts).sort((a, b) => b[1] - a[1])[0][0] || 'red';
      }

      const shouldCallUno = currentActive.cards.length === 2;

      room.gameState = unoReducer(room.gameState, {
        type: 'PLAY_CARD',
        playerId: currentActive.id,
        cardId: chosenCard.id,
        chosenColor,
        calledUno: shouldCallUno
      });

      saveRoomState(room);
      io.to(room.code).emit('game_state_updated', room.gameState);
      runUnoBotTurnsIfNeeded(room, io);
    } else {
      // Draw card
      room.gameState = unoReducer(room.gameState, {
        type: 'DRAW_CARD',
        playerId: currentActive.id
      });

      saveRoomState(room);
      io.to(room.code).emit('game_state_updated', room.gameState);
      runUnoBotTurnsIfNeeded(room, io);
    }
  }, 950);

  botTimers.set(timerKey, timer);
}
