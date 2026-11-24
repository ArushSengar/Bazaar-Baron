/**
 * Server-Side Game Registry
 * 
 * Central registry defining contracts, metadata, pure reducers, and bot runners
 * for all games in Bazaar Arcade:
 * 1. 'monopoly' (Bazaar Baron - 2-6 players)
 * 2. 'uno' (Bazaar UNO - 2-10 players)
 * 3. 'ludo' (Bazaar Ludo - 2-4 players)
 * 4. 'snakes_and_ladders' (Snakes & Ladders - 2-6 players)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Monopoly imports
import { createInitialGameState } from '../engine/state.js';
import { gameReducer, getActivePlayer } from '../engine/reducer.js';
import { GAME_PHASES, PLAYER_COLORS, TURN_STEPS, RULES } from '../engine/constants.js';

// UNO imports
import { createInitialUnoState, unoReducer } from '../engine/uno/reducer.js';
import { canPlayUnoCard } from '../engine/uno/rules.js';
import { UNO_PHASES, UNO_COLORS } from '../engine/uno/constants.js';

// Ludo imports
import { createInitialLudoState, createLudoPlayer } from '../engine/ludo/state.js';
import { ludoReducer } from '../engine/ludo/reducer.js';
import { LUDO_COLORS, DEFAULT_LUDO_BOT_NAMES } from '../engine/ludo/constants.js';
import { runLudoBotTurnsIfNeeded } from '../engine/ludo/bot.js';

// Snakes & Ladders imports
import { createInitialSnakesState, createSnakesPlayer } from '../engine/snakes/state.js';
import { snakesReducer } from '../engine/snakes/reducer.js';
import { SNAKES_COLORS, DEFAULT_SNAKES_BOT_NAMES } from '../engine/snakes/constants.js';
import { runSnakesBotTurnsIfNeeded } from '../engine/snakes/bot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOARD_DATA_PATH = path.join(__dirname, '..', 'data', 'board.json');
let boardData = [];
try {
  boardData = JSON.parse(fs.readFileSync(BOARD_DATA_PATH, 'utf-8'));
} catch (_) {}

// Timers for automated bot execution
export const monopolyBotTimers = new Map();
export const unoBotTimers = new Map();

/**
 * Automated bot turn runner for Monopoly (Bazaar Baron)
 */
export function runMonopolyBotTurns(room, io) {
  if (!room || !room.gameState || room.gameState.phase !== GAME_PHASES.PLAYING) return;

  if (monopolyBotTimers.has(room.code)) {
    clearTimeout(monopolyBotTimers.get(room.code));
    monopolyBotTimers.delete(room.code);
  }

  const activePlayer = getActivePlayer(room.gameState);

  // Auction bot bidding / passing
  if (room.gameState.step === TURN_STEPS.AUCTION && room.gameState.auction) {
    const auction = room.gameState.auction;
    const activeBotBidder = (auction.activeBidders || []).find(id => {
      const p = room.gameState.players.find(x => x.id === id);
      return p && p.isBot && id !== auction.highestBidderId;
    });

    if (activeBotBidder) {
      const timer = setTimeout(() => {
        monopolyBotTimers.delete(room.code);
        if (!room.gameState.auction) return;
        const bot = room.gameState.players.find(p => p.id === activeBotBidder);
        const tile = boardData[auction.tileId];
        const nextBid = (auction.currentBid || 0) + 10;
        const intent = (bot && bot.cash >= nextBid && nextBid <= (tile?.cost || 200) * 0.75)
          ? { type: 'AUCTION_BID', amount: nextBid, playerId: bot.id }
          : { type: 'AUCTION_PASS', playerId: activeBotBidder };

        room.gameState = gameReducer(room.gameState, intent);
        if (typeof room.saveState === 'function') room.saveState();
        if (io && typeof io.to === 'function') {
          io.to(room.code).emit('game_state_updated', room.gameState);
        }
        runMonopolyBotTurns(room, io);
      }, 950);
      monopolyBotTimers.set(room.code, timer);
      return;
    }
  }

  // Active player bot turn
  if (!activePlayer || !activePlayer.isBot || activePlayer.bankrupt) return;

  const timer = setTimeout(() => {
    monopolyBotTimers.delete(room.code);
    if (room.gameState.phase !== GAME_PHASES.PLAYING) return;

    const currentActive = getActivePlayer(room.gameState);
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    const step = room.gameState.step;

    let intent = null;
    if (step === TURN_STEPS.INITIAL) {
      if (currentActive.inJail) {
        intent = (currentActive.cash >= 150)
          ? { type: 'PAY_JAIL_FINE', playerId: currentActive.id }
          : { type: 'ROLL_DICE', playerId: currentActive.id };
      } else {
        intent = { type: 'ROLL_DICE', playerId: currentActive.id };
      }
    } else if (step === TURN_STEPS.AWAITING_BUY) {
      const tile = boardData[currentActive.position];
      intent = (tile && currentActive.cash >= tile.cost + 100)
        ? { type: 'BUY_PROPERTY', playerId: currentActive.id }
        : { type: 'DECLINE_BUY', playerId: currentActive.id };
    } else if (room.gameState.drawnCard) {
      intent = { type: 'DISMISS_CARD', playerId: currentActive.id };
    } else if (step === TURN_STEPS.TURN_END) {
      intent = { type: 'END_TURN', playerId: currentActive.id };
    } else if (step === TURN_STEPS.BANKRUPTCY_CHECK && room.gameState.debt) {
      intent = (currentActive.cash >= room.gameState.debt.amount)
        ? { type: 'RESOLVE_DEBT', playerId: currentActive.id }
        : { type: 'BANKRUPT', playerId: currentActive.id };
    }

    if (intent) {
      room.gameState = gameReducer(room.gameState, intent);
      if (typeof room.saveState === 'function') room.saveState();
      if (io && typeof io.to === 'function') {
        io.to(room.code).emit('game_state_updated', room.gameState);
      }
      runMonopolyBotTurns(room, io);
    }
  }, 950);

  monopolyBotTimers.set(room.code, timer);
}

/**
 * Automated bot turn runner for UNO (Bazaar UNO)
 */
export function runUnoBotTurns(room, io) {
  if (!room || !room.gameState || room.gameState.phase !== UNO_PHASES.PLAYING) return;

  const timerKey = `uno_${room.code}`;
  if (unoBotTimers.has(timerKey)) {
    clearTimeout(unoBotTimers.get(timerKey));
    unoBotTimers.delete(timerKey);
  }

  // Check catching opponents who forgot to call UNO
  const vulnerableOpponent = room.gameState.players.find(p => p.cards && p.cards.length === 1 && !p.calledUno && !p.isBot);
  if (vulnerableOpponent) {
    const catchTimer = setTimeout(() => {
      if (room.gameState.phase !== UNO_PHASES.PLAYING) return;
      const target = room.gameState.players.find(p => p.id === vulnerableOpponent.id);
      if (target && target.cards && target.cards.length === 1 && !target.calledUno) {
        const botCatcher = room.gameState.players.find(p => p.isBot);
        if (botCatcher) {
          room.gameState = unoReducer(room.gameState, {
            type: 'CATCH_UNO',
            playerId: botCatcher.id,
            targetPlayerId: target.id
          });
          if (typeof room.saveState === 'function') room.saveState();
          if (io && typeof io.to === 'function') {
            io.to(room.code).emit('game_state_updated', room.gameState);
          }
        }
      }
    }, 1400);
    unoBotTimers.set(`${timerKey}_catch`, catchTimer);
  }

  // Active player bot turn
  const activePlayer = room.gameState.players[room.gameState.turnIndex];
  if (!activePlayer || !activePlayer.isBot) return;

  const timer = setTimeout(() => {
    unoBotTimers.delete(timerKey);
    if (room.gameState.phase !== UNO_PHASES.PLAYING) return;

    const currentActive = room.gameState.players[room.gameState.turnIndex];
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    const topCard = room.gameState.discardPile[room.gameState.discardPile.length - 1];
    const playableCards = (currentActive.cards || []).filter(c => canPlayUnoCard(c, topCard, room.gameState.activeColor));

    if (playableCards.length > 0) {
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

      if (typeof room.saveState === 'function') room.saveState();
      if (io && typeof io.to === 'function') {
        io.to(room.code).emit('game_state_updated', room.gameState);
      }
      runUnoBotTurns(room, io);
    } else {
      room.gameState = unoReducer(room.gameState, {
        type: 'DRAW_CARD',
        playerId: currentActive.id
      });

      if (typeof room.saveState === 'function') room.saveState();
      if (io && typeof io.to === 'function') {
        io.to(room.code).emit('game_state_updated', room.gameState);
      }
      runUnoBotTurns(room, io);
    }
  }, 950);

  unoBotTimers.set(timerKey, timer);
}

// Registry map
export const GAME_REGISTRY = new Map();

/**
 * Register a game definition.
 */
export function registerGame(gameDef) {
  if (!gameDef || !gameDef.id) {
    throw new Error('Game definition must specify an id');
  }
  GAME_REGISTRY.set(gameDef.id, gameDef);
}

/**
 * Normalizes gameType string, handling aliases.
 */
export function normalizeGameType(gameType) {
  if (!gameType || typeof gameType !== 'string') return 'monopoly';
  const lower = gameType.trim().toLowerCase();
  if (lower === 'snakes' || lower === 'snakes_and_ladders' || lower === 'snakes-and-ladders' || lower === 'snakesladders') {
    return 'snakes_and_ladders';
  }
  if (lower === 'baron' || lower === 'monopoly') {
    return 'monopoly';
  }
  return lower;
}

/**
 * Check if a gameType is registered.
 */
export function isValidGameType(gameType) {
  const normalized = normalizeGameType(gameType);
  return GAME_REGISTRY.has(normalized);
}

/**
 * Get game definition (defaults to 'monopoly').
 */
export function getGame(gameType) {
  const normalized = normalizeGameType(gameType);
  return GAME_REGISTRY.get(normalized) || GAME_REGISTRY.get('monopoly');
}

/**
 * Get all registered games as array.
 */
export function getAllGames() {
  return Array.from(GAME_REGISTRY.values());
}

// --- Register Core 4 Games ---

// 1. Monopoly (Bazaar Baron)
registerGame({
  id: 'monopoly',
  title: 'Bazaar Baron',
  icon: 'Building2',
  minPlayers: 2,
  maxPlayers: 6,
  defaultBotNames: ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)', 'Meera (AI)', 'Vikram (AI)'],
  availableColors: PLAYER_COLORS.map(c => c.id),
  createInitialState: (roomCode, hostPlayer) => {
    const state = createInitialGameState(roomCode, hostPlayer);
    state.gameType = 'monopoly';
    return state;
  },
  createPlayer: (data) => ({
    id: data.id,
    token: data.token || `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: (data.name || 'Player').trim().substring(0, 16),
    color: data.color || PLAYER_COLORS[0].id,
    avatar: data.avatar || '👩‍💼',
    cash: RULES.STARTING_CASH,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
    connected: true,
    isHost: Boolean(data.isHost),
    isBot: Boolean(data.isBot)
  }),
  reducer: gameReducer,
  runBotTurn: runMonopolyBotTurns
});

// 2. UNO (Bazaar UNO)
registerGame({
  id: 'uno',
  title: 'Bazaar UNO',
  icon: 'Flame',
  minPlayers: 2,
  maxPlayers: 10,
  defaultBotNames: ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)', 'Meera (AI)', 'Vikram (AI)', 'Ananya (AI)', 'Rohan (AI)'],
  availableColors: UNO_COLORS,
  createInitialState: (roomCode, hostPlayer) => {
    return createInitialUnoState(roomCode, hostPlayer);
  },
  createPlayer: (data) => ({
    id: data.id,
    token: data.token || `tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: (data.name || 'Player').trim().substring(0, 16),
    color: data.color || UNO_COLORS[0],
    avatar: data.avatar || '👩‍💼',
    cards: [],
    score: 0,
    calledUno: false,
    connected: true,
    isHost: Boolean(data.isHost),
    isBot: Boolean(data.isBot)
  }),
  reducer: unoReducer,
  runBotTurn: runUnoBotTurns
});

// 3. Ludo (Bazaar Ludo)
registerGame({
  id: 'ludo',
  title: 'Bazaar Ludo',
  icon: 'Gamepad2',
  minPlayers: 2,
  maxPlayers: 4,
  defaultBotNames: DEFAULT_LUDO_BOT_NAMES,
  availableColors: LUDO_COLORS,
  createInitialState: (roomCode, hostPlayer) => {
    return createInitialLudoState(roomCode, hostPlayer);
  },
  createPlayer: (data) => createLudoPlayer(data),
  reducer: ludoReducer,
  runBotTurn: runLudoBotTurnsIfNeeded
});

// 4. Snakes & Ladders
registerGame({
  id: 'snakes_and_ladders',
  title: 'Snakes & Ladders',
  icon: 'Dice5',
  minPlayers: 2,
  maxPlayers: 6,
  defaultBotNames: DEFAULT_SNAKES_BOT_NAMES,
  availableColors: SNAKES_COLORS,
  createInitialState: (roomCode, hostPlayer) => {
    return createInitialSnakesState(roomCode, hostPlayer);
  },
  createPlayer: (data) => createSnakesPlayer(data),
  reducer: snakesReducer,
  runBotTurn: runSnakesBotTurnsIfNeeded
});
