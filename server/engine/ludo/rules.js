import {
  TRACK_LENGTH,
  STEPS_TO_HOME,
  START_POSITIONS,
  SAFE_STAR_INDICES,
  TOKEN_STATES
} from './constants.js';

export function isSafeStar(position) {
  return typeof position === 'number' && position >= 0 && SAFE_STAR_INDICES.includes(position);
}

export function getTrackPosition(color, step) {
  if (typeof step !== 'number' || step < 0 || step > 51) return -1;
  const start = START_POSITIONS[color] ?? 0;
  return (start + step) % TRACK_LENGTH;
}

export function canTokenMove(token, diceValue) {
  if (!token || !diceValue) return false;
  if (token.state === TOKEN_STATES.HOME) return false;
  if (token.state === TOKEN_STATES.BASE) {
    return diceValue === 6;
  }
  return token.step + diceValue <= STEPS_TO_HOME;
}

export function getMovableTokens(player, diceValue) {
  if (!player || !player.tokens || !diceValue) return [];
  return player.tokens
    .filter(token => canTokenMove(token, diceValue))
    .map(token => token.id);
}

export function calculateNewTokenState(token, color, diceValue) {
  if (!token || !diceValue) return null;

  if (token.state === TOKEN_STATES.BASE) {
    if (diceValue !== 6) return null;
    return {
      id: token.id,
      state: TOKEN_STATES.TRACK,
      position: START_POSITIONS[color] ?? 0,
      step: 0
    };
  }

  const newStep = token.step + diceValue;
  if (newStep > STEPS_TO_HOME) return null;

  if (newStep === STEPS_TO_HOME) {
    return {
      id: token.id,
      state: TOKEN_STATES.HOME,
      position: 5,
      step: STEPS_TO_HOME
    };
  }

  if (newStep >= 52) {
    return {
      id: token.id,
      state: TOKEN_STATES.HOME_STRETCH,
      position: newStep - 52, // 0..4
      step: newStep
    };
  }

  return {
    id: token.id,
    state: TOKEN_STATES.TRACK,
    position: getTrackPosition(color, newStep),
    step: newStep
  };
}

/**
 * Checks for opponents on the target track position.
 * Returns array of captured tokens: [{ playerId, tokenId }]
 */
export function checkCaptures(movingPlayerId, targetPosition, players) {
  if (isSafeStar(targetPosition) || targetPosition < 0 || !Array.isArray(players)) {
    return [];
  }

  const captures = [];
  for (const player of players) {
    if (player.id === movingPlayerId) continue;
    for (const token of (player.tokens || [])) {
      if (token.state === TOKEN_STATES.TRACK && token.position === targetPosition) {
        captures.push({ playerId: player.id, tokenId: token.id });
      }
    }
  }
  return captures;
}
