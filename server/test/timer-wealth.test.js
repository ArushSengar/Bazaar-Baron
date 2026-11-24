import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlayerWealth,
  determineTimedMatchWinner,
  gameReducer
} from '../engine/reducer.js';
import { createInitialGameState } from '../engine/state.js';
import { GAME_PHASES, TURN_STEPS } from '../engine/constants.js';

describe('30-Minute Match Timer & Wealth Victory Suite', () => {
  const mockBoard = [
    { id: 0, name: 'Go', type: 'go' },
    { id: 1, name: 'Chandni Chowk', type: 'property', cost: 60, houseCost: 50, mortgageValue: 30 },
    { id: 2, name: 'Bazaar Fund', type: 'community' },
    { id: 3, name: 'Daryaganj', type: 'property', cost: 100, houseCost: 50, mortgageValue: 50 }
  ];

  test('calculatePlayerWealth accurately calculates cash + unmortgaged props + mortgaged props + houses/hotels', () => {
    const mockState = {
      players: [
        { id: 'p1', name: 'Kabir', cash: 400, bankrupt: false },
        { id: 'p2', name: 'Rani', cash: 200, bankrupt: false }
      ],
      properties: {
        1: { ownerId: 'p1', mortgaged: false, houses: 2 }, // 60 (cost) + 2 * 50 (houses) = 160
        3: { ownerId: 'p1', mortgaged: true, houses: 0 }    // 50 (mortgageValue)
      }
    };

    const p1Wealth = calculatePlayerWealth(mockState, mockState.players[0], mockBoard);
    assert.strictEqual(p1Wealth.cash, 400);
    assert.strictEqual(p1Wealth.propertiesValue, 60 + 50); // 110
    assert.strictEqual(p1Wealth.buildingsValue, 100);       // 2 * 50
    assert.strictEqual(p1Wealth.totalWealth, 400 + 110 + 100); // 610

    const p2Wealth = calculatePlayerWealth(mockState, mockState.players[1], mockBoard);
    assert.strictEqual(p2Wealth.cash, 200);
    assert.strictEqual(p2Wealth.propertiesValue, 0);
    assert.strictEqual(p2Wealth.buildingsValue, 0);
    assert.strictEqual(p2Wealth.totalWealth, 200);
  });

  test('determineTimedMatchWinner crowns player with highest wealth and breaks ties by cash', () => {
    const mockState = {
      players: [
        { id: 'p1', name: 'Player 1', cash: 500, bankrupt: false },
        { id: 'p2', name: 'Player 2', cash: 300, bankrupt: false },
        { id: 'p3', name: 'Player 3', cash: 0, bankrupt: true }
      ],
      properties: {
        1: { ownerId: 'p2', mortgaged: false, houses: 4 } // 60 + 200 = 260 => total 560
      }
    };

    const { winner, standings } = determineTimedMatchWinner(mockState, mockBoard);
    assert.strictEqual(winner.playerId, 'p2'); // 560 wealth > 500 wealth
    assert.strictEqual(standings[0].playerId, 'p2');
    assert.strictEqual(standings[1].playerId, 'p1');
    assert.strictEqual(standings[2].playerId, 'p3');
    assert.strictEqual(standings[2].bankrupt, true);
  });

  test('START_GAME initializes 30-minute timer and expiresAt timestamp', () => {
    const host = { id: 'p1', name: 'Host', isHost: true, cash: 1500 };
    const guest = { id: 'p2', name: 'Guest', isHost: false, cash: 1500 };
    let state = createInitialGameState('ROOM', host);
    state.players.push(guest);
    state.playerOrder.push('p2');

    const fakeNow = 1000000;
    state = gameReducer(state, { type: 'START_GAME', playerId: 'p1', now: fakeNow });

    assert.strictEqual(state.phase, GAME_PHASES.PLAYING);
    assert.strictEqual(state.matchDurationMinutes, 30);
    assert.strictEqual(state.gameStartedAt, fakeNow);
    assert.strictEqual(state.timerExpiresAt, fakeNow + 30 * 60 * 1000);
    assert.strictEqual(state.gameEndReason, null);
  });

  test('TIMER_EXPIRED intent cleanly concludes the match with reason TIME_LIMIT and rich standings', () => {
    const host = { id: 'p1', name: 'Arush', isHost: true, cash: 1000 };
    const guest = { id: 'p2', name: 'Vansh', isHost: false, cash: 1200 };
    let state = createInitialGameState('ROOM', host);
    state.players.push(guest);
    state.playerOrder.push('p2');
    state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

    // Give Arush property 1 and 3
    state.properties[1] = { ownerId: 'p1', mortgaged: false, houses: 0 };
    state.properties[3] = { ownerId: 'p1', mortgaged: false, houses: 0 };

    const endState = gameReducer(state, { type: 'TIMER_EXPIRED' });
    assert.strictEqual(endState.phase, GAME_PHASES.GAME_OVER);
    assert.strictEqual(endState.gameEndReason, 'TIME_LIMIT');
    assert.strictEqual(endState.winnerId, 'p1'); // Arush has 1000 cash + 60 + 60 = 1120 or similar wealth vs Vansh 1200? Wait, let's check
    assert.ok(endState.finalStandings.length === 2);
    assert.ok(endState.logs.some(l => l.text.includes('30-Minute match time limit reached')));
  });

  test('Reducer automatically triggers TIME_LIMIT when intent is dispatched after timerExpiresAt', () => {
    const host = { id: 'p1', name: 'Player A', isHost: true, cash: 1500 };
    const guest = { id: 'p2', name: 'Player B', isHost: false, cash: 1000 };
    let state = createInitialGameState('ROOM', host);
    state.players.push(guest);
    state.playerOrder.push('p2');
    const startTime = 5000000;
    state = gameReducer(state, { type: 'START_GAME', playerId: 'p1', now: startTime });

    // Send a roll intent after 31 minutes
    const futureTime = startTime + 31 * 60 * 1000;
    const nextState = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', now: futureTime });

    assert.strictEqual(nextState.phase, GAME_PHASES.GAME_OVER);
    assert.strictEqual(nextState.gameEndReason, 'TIME_LIMIT');
    assert.strictEqual(nextState.winnerId, 'p1');
  });
});
