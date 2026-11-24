import { snakesReducer } from './reducer.js';

export const snakesBotTimers = new Map();

/**
 * Automated turn runner for AI bots in Snakes & Ladders with ~950ms realistic human pacing.
 */
export function runSnakesBotTurnsIfNeeded(room, io, options = {}) {
  if (!room || !room.gameState || room.gameState.phase !== 'PLAYING') return;

  const timerKey = `snakes_${room.code}`;
  if (snakesBotTimers.has(timerKey)) {
    clearTimeout(snakesBotTimers.get(timerKey));
    snakesBotTimers.delete(timerKey);
  }

  const activePlayer = room.gameState.players?.find(p => p.id === room.gameState.playerOrder?.[room.gameState.turnIndex]);
  if (!activePlayer || !activePlayer.isBot) return;

  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 950;

  const timer = setTimeout(() => {
    snakesBotTimers.delete(timerKey);
    if (!room.gameState || room.gameState.phase !== 'PLAYING') return;

    const currentActive = room.gameState.players?.find(p => p.id === room.gameState.playerOrder?.[room.gameState.turnIndex]);
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    room.gameState = snakesReducer(room.gameState, {
      type: 'ROLL_DICE',
      playerId: currentActive.id,
      diceValue: options.forcedDice
    });

    if (typeof room.saveState === 'function') room.saveState();
    if (io && typeof io.to === 'function') {
      io.to(room.code).emit('game_state_updated', room.gameState);
    }

    // Continue if next player is also a bot or if the bot earned an extra roll on 6
    runSnakesBotTurnsIfNeeded(room, io, options);
  }, delayMs);

  snakesBotTimers.set(timerKey, timer);
}
