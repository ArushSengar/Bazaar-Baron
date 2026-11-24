import { SNAKES_PHASES, SNAKES_COLORS } from './constants.js';

export function createSnakesPlayer({ id, token, name, color, avatar, isHost = false, isBot = false }) {
  return {
    id,
    token: token || `tok_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: (name || 'Player').trim().substring(0, 16),
    color: color || SNAKES_COLORS[0],
    avatar: avatar || '🎲',
    position: 0, // Starts off-board (0); rolls 1-6 land on cells 1-6
    isHost,
    isBot,
    connected: true
  };
}

export function createInitialSnakesState(roomCode, hostPlayer) {
  const host = createSnakesPlayer({
    id: hostPlayer.id,
    token: hostPlayer.token,
    name: hostPlayer.name,
    color: hostPlayer.color || SNAKES_COLORS[0],
    avatar: hostPlayer.avatar || '🎲',
    isHost: true,
    isBot: false
  });

  return {
    roomCode,
    gameType: 'snakes_and_ladders',
    phase: SNAKES_PHASES.LOBBY,
    turnIndex: 0,
    playerOrder: [host.id],
    players: [host],
    diceValue: null,
    hasRolled: false,
    consecutiveSixes: 0,
    lastMove: null,
    winnerId: null,
    logs: [
      {
        id: `log_${Date.now()}`,
        time: new Date().toISOString(),
        text: `Room created by ${host.name}. Welcome to Snakes & Ladders!`,
        type: 'info'
      }
    ]
  };
}
