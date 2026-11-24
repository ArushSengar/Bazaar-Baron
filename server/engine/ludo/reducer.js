import { LUDO_PHASES, TOKEN_STATES, MAX_CONSECUTIVE_SIXES, LUDO_COLORS } from './constants.js';
import { getMovableTokens, calculateNewTokenState, checkCaptures } from './rules.js';

function addLog(state, text, type = 'info') {
  if (!state.logs) state.logs = [];
  state.logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    time: new Date().toISOString(),
    text,
    type
  });
  if (state.logs.length > 60) {
    state.logs.shift();
  }
}

function advanceTurn(state) {
  state.consecutiveSixes = 0;
  state.hasRolled = false;
  state.movableTokenIds = [];
  if (state.playerOrder && state.playerOrder.length > 0) {
    state.turnIndex = (state.turnIndex + 1) % state.playerOrder.length;
  }
}

export function ludoReducer(currentState, intent) {
  if (!currentState || !intent) return currentState;
  const state = structuredClone(currentState);
  const activePlayerId = state.playerOrder?.[state.turnIndex];
  const activePlayer = state.players?.find(p => p.id === activePlayerId);

  switch (intent.type) {
    case 'START_GAME': {
      if (state.phase !== LUDO_PHASES.LOBBY) return state;
      const host = state.players?.find(p => p.isHost);
      if (intent.playerId && host && intent.playerId !== host.id) return state;
      if (!state.players || (state.players.length < 2 && !intent.allowSinglePlayer)) return state;

      // Ensure playerOrder is populated from players
      state.playerOrder = state.players.map(p => p.id);

      // Assign distinct colors if duplicates or unassigned
      const assignedColors = new Set();
      state.players.forEach((p, idx) => {
        if (!p.color || assignedColors.has(p.color)) {
          p.color = LUDO_COLORS.find(c => !assignedColors.has(c)) || LUDO_COLORS[idx % 4];
        }
        assignedColors.add(p.color);
      });

      state.phase = LUDO_PHASES.PLAYING;
      state.turnIndex = 0;
      state.hasRolled = false;
      state.diceValue = null;
      state.consecutiveSixes = 0;
      state.movableTokenIds = [];
      state.winnerId = null;

      addLog(state, `🎲 The Ludo match has started! ${state.players[0].name} rolls first.`, 'action');
      return state;
    }

    case 'ROLL_DICE': {
      if (state.phase !== LUDO_PHASES.PLAYING) return state;
      if (!activePlayer) return state;
      if (intent.playerId && intent.playerId !== activePlayerId) return state;
      if (state.hasRolled) return state;

      const roll = (typeof intent.diceValue === 'number' && intent.diceValue >= 1 && intent.diceValue <= 6)
        ? intent.diceValue
        : ((typeof intent.forcedDice === 'number' && intent.forcedDice >= 1 && intent.forcedDice <= 6)
          ? intent.forcedDice
          : Math.floor(Math.random() * 6) + 1);

      state.diceValue = roll;

      if (roll === 6) {
        state.consecutiveSixes = (state.consecutiveSixes || 0) + 1;
        if (state.consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
          addLog(state, `⚠️ ${activePlayer.name} rolled three consecutive 6s! Turn forfeited.`, 'warning');
          advanceTurn(state);
          return state;
        }
      } else {
        state.consecutiveSixes = 0;
      }

      state.hasRolled = true;
      const movable = getMovableTokens(activePlayer, roll);
      state.movableTokenIds = movable;

      addLog(state, `🎲 ${activePlayer.name} rolled a ${roll}.`, 'action');

      // If no valid moves, auto-advance turn immediately
      if (movable.length === 0) {
        addLog(state, `${activePlayer.name} has no valid moves.`, 'info');
        advanceTurn(state);
      }

      return state;
    }

    case 'MOVE_TOKEN': {
      if (state.phase !== LUDO_PHASES.PLAYING) return state;
      if (!activePlayer) return state;
      if (intent.playerId && intent.playerId !== activePlayerId) return state;
      if (!state.hasRolled || !Array.isArray(state.movableTokenIds) || !state.movableTokenIds.includes(intent.tokenId)) {
        return state;
      }

      const token = activePlayer.tokens.find(t => t.id === intent.tokenId);
      if (!token) return state;

      const nextTokenState = calculateNewTokenState(token, activePlayer.color, state.diceValue);
      if (!nextTokenState) return state;

      // Update token
      Object.assign(token, nextTokenState);

      let earnedBonusRoll = (state.diceValue === 6);

      // Check capture on track
      if (token.state === TOKEN_STATES.TRACK) {
        const captures = checkCaptures(activePlayer.id, token.position, state.players);
        for (const cap of captures) {
          const opponent = state.players.find(p => p.id === cap.playerId);
          if (opponent) {
            const oppToken = opponent.tokens.find(t => t.id === cap.tokenId);
            if (oppToken) {
              oppToken.state = TOKEN_STATES.BASE;
              oppToken.position = -1;
              oppToken.step = -1;
              earnedBonusRoll = true;
              addLog(state, `⚔️ ${activePlayer.name} captured ${opponent.name}'s token!`, 'action');
            }
          }
        }
      }

      // Check if reached home
      if (token.state === TOKEN_STATES.HOME) {
        activePlayer.completedTokens = (activePlayer.completedTokens || 0) + 1;
        earnedBonusRoll = true;
        addLog(state, `🌟 ${activePlayer.name}'s token reached Home! (${activePlayer.completedTokens}/4)`, 'action');

        if (activePlayer.completedTokens === 4) {
          state.phase = LUDO_PHASES.GAME_OVER;
          state.winnerId = activePlayer.id;
          activePlayer.rank = 1;
          state.hasRolled = false;
          state.movableTokenIds = [];
          addLog(state, `🏆 ${activePlayer.name} wins the game!`, 'winner');
          return state;
        }
      }

      if (earnedBonusRoll) {
        state.hasRolled = false;
        state.movableTokenIds = [];
        addLog(state, `🎉 ${activePlayer.name} earned an extra roll!`, 'info');
      } else {
        advanceTurn(state);
      }

      return state;
    }

    default:
      return state;
  }
}
