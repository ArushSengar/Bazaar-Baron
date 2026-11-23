import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../engine/state.js';
import { gameReducer } from '../engine/reducer.js';
import { TURN_STEPS } from '../engine/constants.js';

function createGame() {
  const host = { id: 'p1', token: 'tok-1', name: 'Sethji', color: 'red' };
  let state = createInitialGameState('STG2', host);
  state.players.push({
    id: 'p2',
    token: 'tok-2',
    name: 'Raja',
    color: 'blue',
    cash: 1500,
    position: 0,
    inJail: false,
    jailTurns: 0,
    getOutOfJailCards: 0,
    bankrupt: false,
    connected: true,
    isHost: false
  });
  return gameReducer(state, { type: 'START_GAME', playerId: 'p1' });
}

describe('Stage 2 Gameplay: Movement, Buying, Rent & Turn Flow', () => {

  it('Player rolls dice, moves token and lands on unowned tile', () => {
    let state = createGame();
    assert.equal(state.playerOrder[state.turnIndex], 'p1');
    assert.equal(state.step, TURN_STEPS.INITIAL);

    // Roll [1, 2] = 3 -> lands on Daryaganj (tile 3)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });

    const p1 = state.players.find(p => p.id === 'p1');
    assert.equal(p1.position, 3);
    assert.equal(state.currentTile, 3);
    assert.equal(state.step, TURN_STEPS.AWAITING_BUY);
  });

  it('Player buys unowned property: cash deducted, ownership recorded, step moves to TURN_END', () => {
    let state = createGame();
    // Roll [1, 2] = 3 -> tile 3 (Daryaganj, cost 60)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });

    // Buy Daryaganj
    state = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p1' });

    const p1 = state.players.find(p => p.id === 'p1');
    assert.equal(p1.cash, 1500 - 60);
    assert.equal(state.properties[3].ownerId, 'p1');
    assert.equal(state.step, TURN_STEPS.TURN_END);
  });

  it('Collecting ₹200 salary when passing Go', () => {
    let state = createGame();
    const p1 = state.players.find(p => p.id === 'p1');
    p1.position = 38; // Luxury Tax

    // Roll [2, 3] = 5 -> (38 + 5) % 40 = 3 (passes Go)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 3] });

    const p1After = state.players.find(p => p.id === 'p1');
    assert.equal(p1After.position, 3);
    assert.equal(p1After.cash, 1500 + 200, 'Should have collected ₹200 passing Start');
  });

  it('Landing on another player’s property automatically deducts and transfers rent', () => {
    let state = createGame();
    // Give tile 1 (Chandni Chowk, base rent 2) to p1
    state.properties[1].ownerId = 'p1';

    // End p1's turn to pass to p2
    state.step = TURN_STEPS.TURN_END;
    state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });

    assert.equal(state.playerOrder[state.turnIndex], 'p2');
    assert.equal(state.step, TURN_STEPS.INITIAL);

    // p2 rolls [0+1, 0]=1 -> lands on tile 1 (Chandni Chowk, owned by p1)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p2', dice: [1, 0] });

    const p1 = state.players.find(p => p.id === 'p1');
    const p2 = state.players.find(p => p.id === 'p2');

    assert.equal(p2.position, 1);
    assert.equal(p2.cash, 1500 - 2, 'p2 paid ₹2 rent');
    assert.equal(p1.cash, 1500 + 2, 'p1 collected ₹2 rent');
    assert.equal(state.step, TURN_STEPS.TURN_END);
  });

  it('End turn rotates turn to next player', () => {
    let state = createGame();
    state.step = TURN_STEPS.TURN_END;
    state.lastRollDoubles = false;

    state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });

    assert.equal(state.playerOrder[state.turnIndex], 'p2');
    assert.equal(state.step, TURN_STEPS.INITIAL);
  });

  it('Rolling doubles awards an extra roll after ending turn step', () => {
    let state = createGame();
    // p1 rolls doubles [2, 2] = 4 -> lands on GST (tile 4)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 2] });
    assert.equal(state.doublesCount, 1);
    assert.equal(state.step, TURN_STEPS.TURN_END);

    // End turn -> p1 rolls again
    state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });
    assert.equal(state.playerOrder[state.turnIndex], 'p1');
    assert.equal(state.step, TURN_STEPS.INITIAL);
  });

});
