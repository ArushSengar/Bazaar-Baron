import {
  SNAKES_PHASES,
  LADDERS,
  SNAKES,
  MAX_CONSECUTIVE_SIXES,
  SNAKES_COLORS
} from './constants.js';

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

export function snakesReducer(currentState, intent) {
  if (!currentState || !intent) return currentState;
  const state = structuredClone(currentState);
  const activePlayerId = state.playerOrder?.[state.turnIndex];
  const activePlayer = state.players?.find(p => p.id === activePlayerId);

  switch (intent.type) {
    case 'START_GAME': {
      if (state.phase !== SNAKES_PHASES.LOBBY) return state;
      if (!state.players || (state.players.length < 2 && !intent.allowSinglePlayer)) return state;

      state.playerOrder = state.players.map(p => p.id);

      // Ensure distinct colors
      const assignedColors = new Set();
      state.players.forEach((p, idx) => {
        p.position = 0; // All players start off-board at 0
        if (!p.color || assignedColors.has(p.color)) {
          p.color = SNAKES_COLORS.find(c => !assignedColors.has(c)) || SNAKES_COLORS[idx % SNAKES_COLORS.length];
        }
        assignedColors.add(p.color);
      });

      state.phase = SNAKES_PHASES.PLAYING;
      state.turnIndex = 0;
      state.diceValue = null;
      state.hasRolled = false;
      state.consecutiveSixes = 0;
      state.winnerId = null;
      state.lastMove = null;

      addLog(state, `🎲 The Snakes & Ladders race has begun! ${state.players[0].name} rolls first.`, 'action');
      return state;
    }

    case 'ROLL_DICE': {
      if (state.phase !== SNAKES_PHASES.PLAYING) return state;
      if (!activePlayer) return state;
      if (intent.playerId && intent.playerId !== activePlayerId) return state;

      const roll = (typeof intent.diceValue === 'number' && intent.diceValue >= 1 && intent.diceValue <= 6)
        ? intent.diceValue
        : ((typeof intent.forcedDice === 'number' && intent.forcedDice >= 1 && intent.forcedDice <= 6)
          ? intent.forcedDice
          : Math.floor(Math.random() * 6) + 1);

      state.diceValue = roll;

      // Track consecutive 6s
      if (roll === 6) {
        state.consecutiveSixes = (state.consecutiveSixes || 0) + 1;
        if (state.consecutiveSixes >= MAX_CONSECUTIVE_SIXES) {
          addLog(state, `⚠️ ${activePlayer.name} rolled three consecutive 6s! Turn forfeited.`, 'warning');
          state.consecutiveSixes = 0;
          state.hasRolled = false;
          state.lastMove = {
            playerId: activePlayer.id,
            from: activePlayer.position,
            rolled: roll,
            to: activePlayer.position,
            forfeited: true
          };
          if (state.playerOrder && state.playerOrder.length > 0) {
            state.turnIndex = (state.turnIndex + 1) % state.playerOrder.length;
          }
          return state;
        }
      } else {
        state.consecutiveSixes = 0;
      }

      const currentPos = activePlayer.position || 0;
      const targetPos = currentPos + roll;

      // 1. Overshoot Stay Rule
      if (targetPos > 100) {
        state.lastMove = {
          playerId: activePlayer.id,
          from: currentPos,
          rolled: roll,
          to: currentPos,
          overshoot: true
        };
        addLog(state, `🎲 ${activePlayer.name} rolled a ${roll}, but needs exactly ${100 - currentPos} to reach 100!`, 'info');

        if (roll === 6) {
          state.hasRolled = false;
          addLog(state, `🎉 ${activePlayer.name} rolled a 6 and gets an extra roll!`, 'info');
        } else {
          state.hasRolled = false;
          if (state.playerOrder && state.playerOrder.length > 0) {
            state.turnIndex = (state.turnIndex + 1) % state.playerOrder.length;
          }
        }
        return state;
      }

      // 2. Exact Victory Condition
      if (targetPos === 100) {
        activePlayer.position = 100;
        state.winnerId = activePlayer.id;
        state.phase = SNAKES_PHASES.GAME_OVER;
        state.hasRolled = false;
        state.lastMove = {
          playerId: activePlayer.id,
          from: currentPos,
          rolled: roll,
          to: 100,
          win: true
        };
        addLog(state, `🏆 ${activePlayer.name} reached square 100 and won the game!`, 'winner');
        return state;
      }

      // 3. Movement with Ladder or Snake
      let finalPos = targetPos;
      let ladder = false;
      let snake = false;

      if (LADDERS[targetPos]) {
        finalPos = LADDERS[targetPos];
        ladder = true;
        addLog(state, `🪜 ${activePlayer.name} rolled a ${roll} and climbed a ladder from ${targetPos} to ${finalPos}!`, 'action');
      } else if (SNAKES[targetPos]) {
        finalPos = SNAKES[targetPos];
        snake = true;
        addLog(state, `🐍 Oh no! ${activePlayer.name} rolled a ${roll} and got bitten by a snake at ${targetPos}, sliding down to ${finalPos}!`, 'warning');
      } else {
        addLog(state, `🎲 ${activePlayer.name} rolled a ${roll} and moved from ${currentPos} to ${finalPos}.`, 'action');
      }

      activePlayer.position = finalPos;
      state.lastMove = {
        playerId: activePlayer.id,
        from: currentPos,
        rolled: roll,
        intermediate: (ladder || snake) ? targetPos : undefined,
        to: finalPos,
        ladder,
        snake
      };

      // Extra roll on 6
      if (roll === 6) {
        state.hasRolled = false;
        addLog(state, `🎉 ${activePlayer.name} rolled a 6 and gets an extra roll!`, 'info');
      } else {
        state.hasRolled = false;
        if (state.playerOrder && state.playerOrder.length > 0) {
          state.turnIndex = (state.turnIndex + 1) % state.playerOrder.length;
        }
      }

      return state;
    }

    default:
      return state;
  }
}
