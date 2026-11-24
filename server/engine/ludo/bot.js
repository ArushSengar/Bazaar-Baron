import { TOKEN_STATES } from './constants.js';
import { calculateNewTokenState, checkCaptures } from './rules.js';
import { ludoReducer } from './reducer.js';

export const ludoBotTimers = new Map();

/**
 * Tactical decision evaluator for Ludo bots:
 * Heuristic priority: Capture > Goal > Exit Base on 6 > Advance Furthest Token
 */
export function chooseBestLudoToken(player, diceValue, allPlayers) {
  if (!player || !player.tokens || player.tokens.length === 0) return null;

  const validTokenIds = player.tokens
    .filter(t => {
      if (t.state === TOKEN_STATES.HOME) return false;
      if (t.state === TOKEN_STATES.BASE) return diceValue === 6;
      return t.step + diceValue <= 57;
    })
    .map(t => t.id);

  if (validTokenIds.length === 0) return null;
  if (validTokenIds.length === 1) return validTokenIds[0];

  let bestTokenId = validTokenIds[0];
  let highestScore = -Infinity;

  for (const tokenId of validTokenIds) {
    const token = player.tokens.find(t => t.id === tokenId);
    const nextState = calculateNewTokenState(token, player.color, diceValue);
    if (!nextState) continue;

    let score = 0;

    // 1. Capture Opponent (Priority 1: ~10,000 pts)
    if (nextState.state === TOKEN_STATES.TRACK) {
      const captures = checkCaptures(player.id, nextState.position, allPlayers);
      if (captures.length > 0) {
        score = 10000 + captures.length * 1000;
      }
    }

    // 2. Reach Goal (Priority 2: ~5,000 pts)
    if (score === 0 && nextState.state === TOKEN_STATES.HOME) {
      score = 5000;
    }

    // 3. Exit Base on 6 (Priority 3: ~1,000 pts)
    if (score === 0 && token.state === TOKEN_STATES.BASE && diceValue === 6) {
      score = 1000;
    }

    // 4. Advance Furthest Token (Priority 4: 100 + step pts)
    if (score === 0) {
      score = 100 + nextState.step;
    }

    if (score > highestScore) {
      highestScore = score;
      bestTokenId = tokenId;
    }
  }

  return bestTokenId;
}

/**
 * Automated turn runner for AI bots in Ludo with ~950ms realistic human pacing.
 */
export function runLudoBotTurnsIfNeeded(room, io, options = {}) {
  if (!room || !room.gameState || room.gameState.phase !== 'PLAYING') return;

  const timerKey = `ludo_${room.code}`;
  if (ludoBotTimers.has(timerKey)) {
    clearTimeout(ludoBotTimers.get(timerKey));
    ludoBotTimers.delete(timerKey);
  }

  const activePlayer = room.gameState.players?.find(p => p.id === room.gameState.playerOrder?.[room.gameState.turnIndex]);
  if (!activePlayer || !activePlayer.isBot) return;

  const delayMs = typeof options.delayMs === 'number' ? options.delayMs : 950;

  const timer = setTimeout(() => {
    ludoBotTimers.delete(timerKey);
    if (!room.gameState || room.gameState.phase !== 'PLAYING') return;

    const currentActive = room.gameState.players?.find(p => p.id === room.gameState.playerOrder?.[room.gameState.turnIndex]);
    if (!currentActive || currentActive.id !== activePlayer.id || !currentActive.isBot) return;

    // Step A: Roll dice if hasn't rolled
    if (!room.gameState.hasRolled) {
      room.gameState = ludoReducer(room.gameState, {
        type: 'ROLL_DICE',
        playerId: currentActive.id,
        diceValue: options.forcedDice
      });

      if (typeof room.saveState === 'function') room.saveState();
      if (io && typeof io.to === 'function') {
        io.to(room.code).emit('game_state_updated', room.gameState);
      }

      // Trigger next step (move token or pass to next bot)
      runLudoBotTurnsIfNeeded(room, io, options);
      return;
    }

    // Step B: Move token if rolled and moves available
    if (room.gameState.hasRolled && Array.isArray(room.gameState.movableTokenIds) && room.gameState.movableTokenIds.length > 0) {
      const chosenTokenId = chooseBestLudoToken(currentActive, room.gameState.diceValue, room.gameState.players);
      if (chosenTokenId !== null) {
        room.gameState = ludoReducer(room.gameState, {
          type: 'MOVE_TOKEN',
          playerId: currentActive.id,
          tokenId: chosenTokenId
        });

        if (typeof room.saveState === 'function') room.saveState();
        if (io && typeof io.to === 'function') {
          io.to(room.code).emit('game_state_updated', room.gameState);
        }

        // Continue if bonus roll earned or next player is also a bot
        runLudoBotTurnsIfNeeded(room, io, options);
      }
    }
  }, delayMs);

  ludoBotTimers.set(timerKey, timer);
}
