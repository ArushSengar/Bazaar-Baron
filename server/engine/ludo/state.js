import { LUDO_PHASES, TOKEN_STATES, LUDO_COLORS, LUDO_COLOR_HEX } from './constants.js';

export function createInitialLudoTokens() {
  return [0, 1, 2, 3].map(id => ({
    id,
    state: TOKEN_STATES.BASE,
    position: -1,
    step: -1
  }));
}

export function createLudoPlayer({ id, token, name, color, avatar, isHost = false, isBot = false }) {
  return {
    id,
    token: token || `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: (name || 'Player').trim().substring(0, 16),
    color: color || LUDO_COLORS[0],
    avatar: avatar || '👳',
    tokens: createInitialLudoTokens(),
    completedTokens: 0,
    rank: null,
    isHost,
    isBot,
    connected: true
  };
}

export function createInitialLudoState(roomCode, hostPlayer) {
  const host = createLudoPlayer({
    id: hostPlayer.id,
    token: hostPlayer.token,
    name: hostPlayer.name,
    color: hostPlayer.color || 'red',
    avatar: hostPlayer.avatar || '👳',
    isHost: true,
    isBot: false
  });

  return {
    roomCode,
    gameType: 'ludo',
    phase: LUDO_PHASES.LOBBY,
    turnIndex: 0,
    playerOrder: [host.id],
    players: [host],
    diceValue: null,
    hasRolled: false,
    consecutiveSixes: 0,
    movableTokenIds: [],
    winnerId: null,
    logs: [
      {
        id: `log_${Date.now()}`,
        time: new Date().toISOString(),
        text: `Room created by ${host.name}. Welcome to Bazaar Ludo!`,
        type: 'info'
      }
    ]
  };
}
