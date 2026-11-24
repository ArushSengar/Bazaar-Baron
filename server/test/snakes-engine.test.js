import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRID_SIZE,
  LADDERS,
  SNAKES,
  SNAKES_PHASES,
  MAX_CONSECUTIVE_SIXES,
  SNAKES_COLORS
} from '../engine/snakes/constants.js';
import {
  createInitialSnakesState,
  createSnakesPlayer
} from '../engine/snakes/state.js';
import { snakesReducer } from '../engine/snakes/reducer.js';
import { runSnakesBotTurnsIfNeeded, snakesBotTimers } from '../engine/snakes/bot.js';

test('1. Board Constants & Snake/Ladder Invariants', () => {
  assert.equal(GRID_SIZE, 100, 'Board must have 100 squares');

  // Verify all 8 ladders have start < end
  const ladderKeys = Object.keys(LADDERS);
  assert.equal(ladderKeys.length, 8, 'Must have exactly 8 ladders');
  for (const [start, end] of Object.entries(LADDERS)) {
    assert.ok(Number(start) < Number(end), `Ladder start (${start}) must be less than end (${end})`);
  }

  // Verify all 8 snakes have head > tail
  const snakeKeys = Object.keys(SNAKES);
  assert.equal(snakeKeys.length, 8, 'Must have exactly 8 snakes');
  for (const [head, tail] of Object.entries(SNAKES)) {
    assert.ok(Number(head) > Number(tail), `Snake head (${head}) must be greater than tail (${tail})`);
  }

  // Verify no ladder bottom is on a snake head
  for (const start of ladderKeys) {
    assert.equal(SNAKES[start], undefined, `Ladder bottom ${start} must not be on a snake head`);
  }

  // Verify square 100 has neither snake head nor ladder bottom
  assert.equal(LADDERS[100], undefined, 'Square 100 must not have ladder start');
  assert.equal(SNAKES[100], undefined, 'Square 100 must not have snake head');
});

test('2. Initial State Creation', () => {
  const host = { id: 'p1', name: 'Alice', token: 'tok_1' };
  const state = createInitialSnakesState('SNK1', host);

  assert.equal(state.roomCode, 'SNK1');
  assert.equal(state.gameType, 'snakes_and_ladders');
  assert.equal(state.phase, SNAKES_PHASES.LOBBY);
  assert.equal(state.turnIndex, 0);
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].position, 0, 'Host starts off-board at position 0');
  assert.equal(state.diceValue, null);
  assert.equal(state.winnerId, null);
  assert.equal(state.lastMove, null);
});

test('3. Game Start Execution', () => {
  const host = { id: 'p1', name: 'Alice' };
  let state = createInitialSnakesState('SNK1', host);
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state.playerOrder.push('p2');

  const started = snakesReducer(state, { type: 'START_GAME' });
  assert.equal(started.phase, SNAKES_PHASES.PLAYING);
  assert.equal(started.turnIndex, 0);
  assert.equal(started.players[0].position, 0);
  assert.equal(started.players[1].position, 0);
  assert.notEqual(started.players[0].color, started.players[1].color);
});

test('4. Basic Dice Roll & Pawn Progression', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Alice rolls 3 -> moves to square 3
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 3 });
  assert.equal(state.players[0].position, 3);
  assert.equal(state.turnIndex, 1, 'Turn should pass to Bob after non-6 roll');
  assert.equal(state.lastMove.to, 3);

  // Bob rolls 2 -> moves to square 2
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p2', diceValue: 2 });
  assert.equal(state.players[1].position, 2);
  assert.equal(state.turnIndex, 0, 'Turn should rotate back to Alice');
});

test('5. Ladder Climb Mechanics', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Alice at 0 rolls 4 -> lands on 4, climbs ladder 4 -> 14
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 4 });
  assert.equal(state.players[0].position, 14, 'Player must climb ladder from 4 to 14');
  assert.equal(state.lastMove.ladder, true);
  assert.equal(state.lastMove.intermediate, 4);
  assert.equal(state.lastMove.to, 14);
});

test('6. Snake Slide Mechanics', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Alice position set to 13
  state.players[0].position = 13;

  // Alice rolls 4 -> lands on 17 (snake head 17 -> 7)
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 4 });
  assert.equal(state.players[0].position, 7, 'Player must slide down snake from 17 to 7');
  assert.equal(state.lastMove.snake, true);
  assert.equal(state.lastMove.intermediate, 17);
  assert.equal(state.lastMove.to, 7);
});

test('7. Extra Roll on 6', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Alice rolls 6 -> moves to 6, turnIndex remains 0
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
  assert.equal(state.players[0].position, 6);
  assert.equal(state.turnIndex, 0, 'Turn should remain with Alice after rolling a 6');
  assert.equal(state.consecutiveSixes, 1);
});

test('8. Three Consecutive 6s Forfeit', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // 1st six
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
  assert.equal(state.turnIndex, 0);
  assert.equal(state.consecutiveSixes, 1);

  // 2nd six (from 6 + 6 = 12)
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
  assert.equal(state.turnIndex, 0);
  assert.equal(state.consecutiveSixes, 2);
  assert.equal(state.players[0].position, 12);

  // 3rd six -> forfeits! Position stays 12, turn passes to Bob (turnIndex 1)
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
  assert.equal(state.turnIndex, 1, 'Third 6 forfeits turn to next player');
  assert.equal(state.consecutiveSixes, 0);
  assert.equal(state.players[0].position, 12, 'Position should not change on 3rd six forfeit');
  assert.equal(state.lastMove.forfeited, true);
});

test('9. Overshoot "Stay in Place" Rule', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Alice at 97
  state.players[0].position = 97;

  // Alice rolls 5 -> 97 + 5 = 102 > 100 (overshoot)
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 5 });
  assert.equal(state.players[0].position, 97, 'Player must stay at 97 on overshoot');
  assert.equal(state.lastMove.overshoot, true);
  assert.equal(state.turnIndex, 1, 'Turn should pass to Bob after overshoot on non-6');
});

test('10. Exact 100 Victory Condition', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  state = snakesReducer(state, { type: 'START_GAME' });

  state.players[0].position = 97;

  // Alice rolls exactly 3 -> 97 + 3 = 100
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 3 });
  assert.equal(state.players[0].position, 100);
  assert.equal(state.phase, SNAKES_PHASES.GAME_OVER);
  assert.equal(state.winnerId, 'p1');
  assert.equal(state.lastMove.win, true);
});

test('11. AI Bot Automated Play via Reducer', () => {
  let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Alice' });
  state.players.push(createSnakesPlayer({ id: 'bot1', name: 'Arjun (AI)', isBot: true }));
  state = snakesReducer(state, { type: 'START_GAME' });

  // Pass Alice's turn
  state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 2 });
  assert.equal(state.turnIndex, 1);

  // Bot rolls dice
  const botTurn = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'bot1', diceValue: 5 });
  assert.equal(botTurn.players[1].position, 5);
  assert.equal(botTurn.turnIndex, 0);
});

test('12. AI Bot Asynchronous Runner (runSnakesBotTurnsIfNeeded)', async () => {
  let emittedEvent = null;
  const mockIo = {
    to: () => ({
      emit: (event, payload) => {
        emittedEvent = { event, payload };
      }
    })
  };

  const botPlayer = createSnakesPlayer({ id: 'bot1', name: 'Arjun (AI)', isBot: true });
  const room = {
    code: 'SNKTEST',
    gameState: createInitialSnakesState('SNKTEST', botPlayer)
  };
  room.gameState.players[0].isBot = true;
  room.gameState.players.push(createSnakesPlayer({ id: 'p2', name: 'Bob' }));
  room.gameState = snakesReducer(room.gameState, { type: 'START_GAME' });

  runSnakesBotTurnsIfNeeded(room, mockIo, { delayMs: 10, forcedDice: 4 });

  await new Promise(r => setTimeout(r, 50));
  assert.equal(emittedEvent?.event, 'game_state_updated');
  assert.equal(room.gameState.players[0].position, 14, 'Bot should have rolled 4 and climbed ladder to 14');
});
