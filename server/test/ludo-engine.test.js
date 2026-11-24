import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TRACK_LENGTH,
  STEPS_TO_HOME,
  START_POSITIONS,
  SAFE_STAR_INDICES,
  LUDO_PHASES,
  TOKEN_STATES,
  LUDO_COLORS
} from '../engine/ludo/constants.js';
import {
  createInitialLudoState,
  createLudoPlayer,
  createInitialLudoTokens
} from '../engine/ludo/state.js';
import {
  isSafeStar,
  getTrackPosition,
  canTokenMove,
  getMovableTokens,
  calculateNewTokenState,
  checkCaptures
} from '../engine/ludo/rules.js';
import { ludoReducer } from '../engine/ludo/reducer.js';
import { chooseBestLudoToken, runLudoBotTurnsIfNeeded, ludoBotTimers } from '../engine/ludo/bot.js';

test('1. Board Layout, Safe Stars & Track Geometry', () => {
  assert.equal(TRACK_LENGTH, 52, 'Track perimeter must be 52 cells');
  assert.equal(STEPS_TO_HOME, 57, 'Total steps to home must be 57');
  assert.deepEqual(START_POSITIONS, { red: 0, green: 13, yellow: 26, blue: 39 });
  assert.deepEqual(SAFE_STAR_INDICES, [0, 8, 13, 21, 26, 34, 39, 47]);
  assert.equal(isSafeStar(0), true);
  assert.equal(isSafeStar(8), true);
  assert.equal(isSafeStar(10), false);
  assert.equal(isSafeStar(-1), false);

  // Perimeter track wrapping
  assert.equal(getTrackPosition('red', 0), 0);
  assert.equal(getTrackPosition('red', 51), 51);
  assert.equal(getTrackPosition('green', 0), 13);
  assert.equal(getTrackPosition('green', 40), 1); // (13 + 40) % 52 = 1
  assert.equal(getTrackPosition('blue', 15), 2); // (39 + 15) % 52 = 2
});

test('2. Initial State & Base Tokens Creation', () => {
  const host = { id: 'p1', name: 'Alice', token: 'tok_1', color: 'red' };
  const state = createInitialLudoState('ROOM1', host);

  assert.equal(state.roomCode, 'ROOM1');
  assert.equal(state.gameType, 'ludo');
  assert.equal(state.phase, LUDO_PHASES.LOBBY);
  assert.equal(state.turnIndex, 0);
  assert.equal(state.players.length, 1);
  assert.equal(state.players[0].tokens.length, 4);

  for (const token of state.players[0].tokens) {
    assert.equal(token.state, TOKEN_STATES.BASE);
    assert.equal(token.position, -1);
    assert.equal(token.step, -1);
  }
});

test('3. Game Start Transitions & Distinct Color Assignment', () => {
  const host = { id: 'p1', name: 'Alice', color: 'red' };
  const state = createInitialLudoState('ROOM1', host);
  const p2 = createLudoPlayer({ id: 'p2', name: 'Bob', color: 'red' }); // duplicate color
  state.players.push(p2);
  state.playerOrder.push('p2');

  const nextState = ludoReducer(state, { type: 'START_GAME' });
  assert.equal(nextState.phase, LUDO_PHASES.PLAYING);
  assert.equal(nextState.turnIndex, 0);
  assert.equal(nextState.hasRolled, false);
  assert.equal(nextState.diceValue, null);
  // Distinct colors assigned
  assert.notEqual(nextState.players[0].color, nextState.players[1].color);
});

test('4. Exiting Base on 6 and Auto-Advance on No Moves', () => {
  const host = { id: 'p1', name: 'Alice', color: 'red' };
  let state = createInitialLudoState('ROOM1', host);
  state.players.push(createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' }));
  state = ludoReducer(state, { type: 'START_GAME' });

  // Roll 3 with all tokens in base -> 0 movable tokens, auto advances turn to Bob (turnIndex 1)
  const rolled3 = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 3 });
  assert.equal(rolled3.turnIndex, 1, 'Turn should auto-advance to player 2 when no moves exist');
  assert.equal(rolled3.hasRolled, false);

  // Bob's turn: roll 6 -> can move token from base
  const rolled6 = ludoReducer(rolled3, { type: 'ROLL_DICE', diceValue: 6 });
  assert.equal(rolled6.turnIndex, 1);
  assert.equal(rolled6.hasRolled, true);
  assert.deepEqual(rolled6.movableTokenIds, [0, 1, 2, 3]);

  // Bob moves token 0 out of base
  const moved = ludoReducer(rolled6, { type: 'MOVE_TOKEN', tokenId: 0 });
  const bobToken0 = moved.players[1].tokens[0];
  assert.equal(bobToken0.state, TOKEN_STATES.TRACK);
  assert.equal(bobToken0.position, START_POSITIONS.green); // 13
  assert.equal(bobToken0.step, 0);
  // Rolling 6 gives extra roll, so turnIndex remains 1 and hasRolled resets to false
  assert.equal(moved.turnIndex, 1);
  assert.equal(moved.hasRolled, false);
});

test('5. Track Progression & Movement Calculation', () => {
  const token = { id: 0, state: TOKEN_STATES.TRACK, position: 0, step: 0 };
  const movedState = calculateNewTokenState(token, 'red', 4);
  assert.equal(movedState.state, TOKEN_STATES.TRACK);
  assert.equal(movedState.step, 4);
  assert.equal(movedState.position, 4);

  // Wrapping test for blue (starts at 39)
  const blueToken = { id: 1, state: TOKEN_STATES.TRACK, position: 50, step: 11 };
  const blueMoved = calculateNewTokenState(blueToken, 'blue', 4);
  assert.equal(blueMoved.step, 15);
  assert.equal(blueMoved.position, 2); // (39 + 15) % 52 = 2
});

test('6. Safe Star Protection Against Captures', () => {
  const p1 = createLudoPlayer({ id: 'p1', name: 'Alice', color: 'red' });
  const p2 = createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' });

  // Place Bob's token on safe star cell 8
  p2.tokens[0].state = TOKEN_STATES.TRACK;
  p2.tokens[0].position = 8;
  p2.tokens[0].step = 47;

  // Alice checks captures landing on cell 8
  const captures = checkCaptures('p1', 8, [p1, p2]);
  assert.equal(captures.length, 0, 'Safe star index 8 must protect tokens from being captured');
});

test('7. Track Capture Sends Opponent to Base & Awards Bonus Roll', () => {
  let state = createInitialLudoState('ROOM1', { id: 'p1', name: 'Alice', color: 'red' });
  state.players.push(createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' }));
  state = ludoReducer(state, { type: 'START_GAME' });

  // Set up Alice token at cell 2 (step 2) and Bob token at cell 5 (step 44)
  state.players[0].tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 2, step: 2 };
  state.players[1].tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 5, step: 44 };

  // Alice rolls 3 -> lands on cell 5 (unsafe tile)
  state = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 3 });
  assert.equal(state.movableTokenIds.includes(0), true);

  state = ludoReducer(state, { type: 'MOVE_TOKEN', tokenId: 0 });

  // Bob's token must be sent back to base
  assert.equal(state.players[1].tokens[0].state, TOKEN_STATES.BASE);
  assert.equal(state.players[1].tokens[0].position, -1);
  assert.equal(state.players[1].tokens[0].step, -1);

  // Alice earned bonus roll: turnIndex remains 0, hasRolled resets to false
  assert.equal(state.turnIndex, 0);
  assert.equal(state.hasRolled, false);
});

test('8. Home Stretch Progression & Isolation', () => {
  const redToken = { id: 0, state: TOKEN_STATES.TRACK, position: 51, step: 51 };
  // Step 51 + 2 = step 53 (home stretch index 1)
  const inStretch = calculateNewTokenState(redToken, 'red', 2);
  assert.equal(inStretch.state, TOKEN_STATES.HOME_STRETCH);
  assert.equal(inStretch.step, 53);
  assert.equal(inStretch.position, 1); // 53 - 52 = 1
});

test('9. Home Goal Arrival & Overshoot Prevention', () => {
  const token = { id: 0, state: TOKEN_STATES.HOME_STRETCH, position: 3, step: 55 };

  // Roll 3 -> 55 + 3 = 58 > 57 (overshoot, cannot move)
  assert.equal(canTokenMove(token, 3), false);
  assert.equal(calculateNewTokenState(token, 'red', 3), null);

  // Roll 2 -> 55 + 2 = 57 (exact goal arrival)
  assert.equal(canTokenMove(token, 2), true);
  const reachedGoal = calculateNewTokenState(token, 'red', 2);
  assert.equal(reachedGoal.state, TOKEN_STATES.HOME);
  assert.equal(reachedGoal.step, 57);
  assert.equal(reachedGoal.position, 5);
});

test('10. Three Consecutive 6s Forfeits Turn', () => {
  let state = createInitialLudoState('ROOM1', { id: 'p1', name: 'Alice', color: 'red' });
  state.players.push(createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' }));
  state = ludoReducer(state, { type: 'START_GAME' });

  // Alice has a token on track so roll 6 has a move
  state.players[0].tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 0, step: 0 };

  // 1st six
  state = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 6 });
  assert.equal(state.consecutiveSixes, 1);
  state = ludoReducer(state, { type: 'MOVE_TOKEN', tokenId: 0 });
  assert.equal(state.turnIndex, 0);

  // 2nd six
  state = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 6 });
  assert.equal(state.consecutiveSixes, 2);
  state = ludoReducer(state, { type: 'MOVE_TOKEN', tokenId: 0 });
  assert.equal(state.turnIndex, 0);

  // 3rd six -> forfeits turn, auto-advances to Bob (turnIndex 1)
  state = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 6 });
  assert.equal(state.turnIndex, 1, 'Third consecutive 6 must forfeit turn');
  assert.equal(state.consecutiveSixes, 0);
  assert.equal(state.hasRolled, false);
});

test('11. Victory Condition when 4 Tokens Reach Home', () => {
  let state = createInitialLudoState('ROOM1', { id: 'p1', name: 'Alice', color: 'red' });
  state.players.push(createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' }));
  state = ludoReducer(state, { type: 'START_GAME' });

  // Setup 3 tokens already home, 4th token on home stretch step 56 (needs 1)
  state.players[0].completedTokens = 3;
  state.players[0].tokens[0].state = TOKEN_STATES.HOME;
  state.players[0].tokens[1].state = TOKEN_STATES.HOME;
  state.players[0].tokens[2].state = TOKEN_STATES.HOME;
  state.players[0].tokens[3] = { id: 3, state: TOKEN_STATES.HOME_STRETCH, position: 4, step: 56 };

  state = ludoReducer(state, { type: 'ROLL_DICE', diceValue: 1 });
  state = ludoReducer(state, { type: 'MOVE_TOKEN', tokenId: 3 });

  assert.equal(state.phase, LUDO_PHASES.GAME_OVER);
  assert.equal(state.winnerId, 'p1');
  assert.equal(state.players[0].completedTokens, 4);
});

test('12. AI Bot Tactical Heuristic & Automated Runner', async () => {
  const p1 = createLudoPlayer({ id: 'bot1', name: 'Kabir (AI)', color: 'red', isBot: true });
  const p2 = createLudoPlayer({ id: 'p2', name: 'Bob', color: 'green' });

  // Scenario A: Capture priority over normal advance
  p1.tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 2, step: 2 }; // will land on cell 6
  p1.tokens[1] = { id: 1, state: TOKEN_STATES.TRACK, position: 10, step: 10 }; // will land on cell 14
  p2.tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 6, step: 45 }; // vulnerable opponent on cell 6

  let bestToken = chooseBestLudoToken(p1, 4, [p1, p2]);
  assert.equal(bestToken, 0, 'Bot must choose token 0 to capture opponent on cell 6');

  // Scenario B: Goal priority over normal advance
  p1.tokens[0] = { id: 0, state: TOKEN_STATES.HOME_STRETCH, position: 4, step: 56 }; // step 56 + 1 = 57 (Goal!)
  p1.tokens[1] = { id: 1, state: TOKEN_STATES.TRACK, position: 10, step: 10 };
  bestToken = chooseBestLudoToken(p1, 1, [p1, p2]);
  assert.equal(bestToken, 0, 'Bot must choose token 0 to enter home goal');

  // Scenario C: Exit base on 6 priority over advancing furthest
  p1.tokens[0] = { id: 0, state: TOKEN_STATES.BASE, position: -1, step: -1 };
  p1.tokens[1] = { id: 1, state: TOKEN_STATES.TRACK, position: 5, step: 5 };
  bestToken = chooseBestLudoToken(p1, 6, [p1, p2]);
  assert.equal(bestToken, 0, 'Bot must choose token in base to exit on roll of 6');

  // Scenario D: Advance furthest token in absence of capture/goal/base exit
  p1.tokens[0] = { id: 0, state: TOKEN_STATES.TRACK, position: 4, step: 4 };
  p1.tokens[1] = { id: 1, state: TOKEN_STATES.TRACK, position: 20, step: 20 };
  bestToken = chooseBestLudoToken(p1, 3, [p1, p2]);
  assert.equal(bestToken, 1, 'Bot must choose furthest token (token 1 at step 20)');

  // Test automated runner with short delay
  let emittedEvent = null;
  const mockIo = {
    to: () => ({
      emit: (event, payload) => {
        emittedEvent = { event, payload };
      }
    })
  };

  const room = {
    code: 'TEST',
    gameState: createInitialLudoState('TEST', p1)
  };
  room.gameState.players[0].isBot = true;
  room.gameState.players.push(p2);
  room.gameState = ludoReducer(room.gameState, { type: 'START_GAME' });

  // Execute bot turn with forced dice roll 6 and fast 5ms delay
  runLudoBotTurnsIfNeeded(room, mockIo, { delayMs: 5, forcedDice: 6 });

  await new Promise(r => setTimeout(r, 150));
  assert.equal(emittedEvent?.event, 'game_state_updated');
  assert.equal(room.gameState.players[0].tokens[0].state, TOKEN_STATES.TRACK);
});
