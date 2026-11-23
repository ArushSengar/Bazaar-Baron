import { GAME_PHASES, TURN_STEPS, RULES, PLAYER_COLORS } from './constants.js';
import boardData from '../data/board.json' with { type: 'json' };
import cardsData from '../data/cards.json' with { type: 'json' };

/**
 * Shuffle an array immutably.
 */
export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Initialize properties dictionary for all buyable tiles on the board.
 */
export function initializeProperties(board = boardData) {
  const properties = {};
  for (const tile of board) {
    if (['property', 'station', 'utility'].includes(tile.type)) {
      properties[tile.id] = {
        ownerId: null,
        houses: 0,
        mortgaged: false
      };
    }
  }
  return properties;
}

/**
 * Create initial game state for a new room.
 */
export function createInitialGameState(roomCode, hostPlayer) {
  const host = {
    id: hostPlayer.id,
    token: hostPlayer.token,
    name: hostPlayer.name || 'Host',
    color: hostPlayer.color || PLAYER_COLORS[0].id,
    avatar: hostPlayer.avatar || '👩‍💼',
    cash: RULES.STARTING_CASH,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
    connected: true,
    isHost: true
  };

  const chanceDeck = shuffleArray(cardsData.chance.map((_, i) => i));
  const communityDeck = shuffleArray(cardsData.community.map((_, i) => i));

  return {
    roomCode,
    phase: GAME_PHASES.LOBBY,
    step: TURN_STEPS.INITIAL,
    players: [host],
    playerOrder: [host.id],
    turnIndex: 0,
    properties: initializeProperties(),
    bank: {
      houses: RULES.MAX_HOUSES_BANK,
      hotels: RULES.MAX_HOTELS_BANK
    },
    dice: [1, 1],
    doublesCount: 0,
    lastRollDoubles: false,
    currentTile: 0,
    auction: null,
    activeTrade: null,
    drawnCard: null,
    debt: null, // { creditorId: string | 'BANK', amount: number, tileId?: number }
    winnerId: null,
    chanceDeck,
    communityDeck,
    logs: [
      {
        id: 'init-1',
        time: new Date().toISOString(),
        text: `Room ${roomCode} created. Welcome to Bazaar Baron!`,
        type: 'info'
      }
    ]
  };
}
