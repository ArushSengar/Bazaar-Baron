import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gameReducer } from '../engine/reducer.js';
import { createInitialGameState } from '../engine/state.js';
import { TURN_STEPS } from '../engine/constants.js';
import { validateBuildHouse, validateMortgage } from '../engine/rules.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boardData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/board.json'), 'utf8'));

test('Headless Simulation: 200 random turns with 4 simulated players adheres to all invariant rules', () => {
  const host = { id: 'p1', token: 'tok-1', name: 'Aarav', color: 'red' };
  let state = createInitialGameState('SIM4', host);
  state.playerOrder = ['p1'];

  const extraPlayers = [
    { id: 'p2', token: 'tok-2', name: 'Diya', color: 'blue' },
    { id: 'p3', token: 'tok-3', name: 'Rohan', color: 'green' },
    { id: 'p4', token: 'tok-4', name: 'Priya', color: 'amber' }
  ];

  for (const p of extraPlayers) {
    state.players.push({
      id: p.id,
      token: p.token,
      name: p.name,
      color: p.color,
      cash: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
      connected: true,
      isHost: false
    });
    state.playerOrder.push(p.id);
  }

  state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

  assert.equal(state.phase, 'PLAYING');
  assert.equal(state.players.length, 4);

  let totalTurnsCompleted = 0;
  let safetyCounter = 0;

  // Invariant verification helper
  function verifyInvariants(currentState, stepDesc) {
    let housesOnBoard = 0;
    let hotelsOnBoard = 0;

    for (const [tileId, prop] of Object.entries(currentState.properties || {})) {
      if (prop.houses === 5) {
        hotelsOnBoard += 1;
      } else if (prop.houses > 0) {
        housesOnBoard += prop.houses;
      }
    }

    // 1. Bank house/hotel limit invariants
    assert.ok(currentState.bank.houses >= 0 && currentState.bank.houses <= 32, `Bank houses out of bounds: ${currentState.bank.houses} at ${stepDesc}`);
    assert.ok(currentState.bank.hotels >= 0 && currentState.bank.hotels <= 12, `Bank hotels out of bounds: ${currentState.bank.hotels} at ${stepDesc}`);
    assert.ok(housesOnBoard + currentState.bank.houses <= 32, `Total houses exceed 32 at ${stepDesc}`);
    assert.ok(hotelsOnBoard + currentState.bank.hotels <= 12, `Total hotels exceed 12 at ${stepDesc}`);

    // 2. Player position and cash invariants
    for (const p of currentState.players) {
      assert.ok(p.position >= 0 && p.position < 40, `Player ${p.name} on invalid tile ${p.position} at ${stepDesc}`);

      // Cash must not be negative unless bankrupt or resolving active debt
      if (!p.bankrupt && !currentState.debt) {
        assert.ok(p.cash >= 0, `Player ${p.name} has negative cash (₹${p.cash}) without bankruptcy at ${stepDesc}`);
      }
    }
  }

  // Run up to 200 full player turns or until winner
  while (totalTurnsCompleted < 200 && state.phase === 'PLAYING' && safetyCounter < 3000) {
    safetyCounter++;
    const activePlayerId = state.playerOrder[state.turnIndex];
    const player = state.players.find(p => p.id === activePlayerId);

    if (!player || player.bankrupt) {
      state = gameReducer(state, { type: 'END_TURN', playerId: activePlayerId });
      verifyInvariants(state, 'turn_end_skip_bankrupt');
      continue;
    }

    // Handle Active Debt Resolution if needed
    if (state.debt) {
      if (player.cash >= state.debt.amount) {
        state = gameReducer(state, { type: 'RESOLVE_DEBT', playerId: player.id });
      } else {
        // Try mortgaging unimproved properties
        let raised = false;
        for (const [tId, prop] of Object.entries(state.properties)) {
          if (prop.ownerId === player.id && !prop.mortgaged) {
            const val = validateMortgage(boardData, state.properties, player, parseInt(tId, 10));
            if (val.valid) {
              state = gameReducer(state, { type: 'MORTGAGE', tileId: parseInt(tId, 10), playerId: player.id });
              raised = true;
              break;
            }
          }
        }
        if (!raised && player.cash < state.debt.amount) {
          // Cannot raise cash -> declare bankruptcy
          state = gameReducer(state, { type: 'BANKRUPT', playerId: player.id });
        }
      }
      verifyInvariants(state, 'debt_resolution');
      continue;
    }

    // Dismiss drawn card if present
    if (state.drawnCard) {
      state = gameReducer(state, { type: 'DISMISS_CARD', playerId: player.id });
      verifyInvariants(state, 'dismiss_card');
      continue;
    }

    // In Jail decision
    if (player.inJail && state.step === TURN_STEPS.INITIAL) {
      if (player.getOutOfJailCards > 0 && Math.random() < 0.5) {
        state = gameReducer(state, { type: 'USE_JAIL_CARD', playerId: player.id });
      } else if (player.cash >= 50 && Math.random() < 0.4) {
        state = gameReducer(state, { type: 'PAY_JAIL_FINE', playerId: player.id });
      } else {
        state = gameReducer(state, { type: 'ROLL_DICE', playerId: player.id });
      }
      verifyInvariants(state, 'jail_step');
      continue;
    }

    // Step: INITIAL (Roll Dice)
    if (state.step === TURN_STEPS.INITIAL) {
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: player.id });
      verifyInvariants(state, 'roll_dice');
      continue;
    }

    // Step: AWAITING_BUY
    if (state.step === TURN_STEPS.AWAITING_BUY) {
      const tile = boardData[player.position];
      if (tile && player.cash >= tile.cost && Math.random() < 0.8) {
        state = gameReducer(state, { type: 'BUY_PROPERTY', playerId: player.id });
      } else {
        // Trigger auction or decline
        state = gameReducer(state, { type: 'DECLINE_BUY', playerId: player.id, skipAuction: Math.random() < 0.5 });
      }
      verifyInvariants(state, 'awaiting_buy');
      continue;
    }

    // Step: AUCTION
    if (state.step === TURN_STEPS.AUCTION && state.auction) {
      const activeBidders = state.auction.activeBidders || [];
      const highestId = state.auction.highestBidderId;
      // Pick a bidder other than current highest bidder
      const candidateId = activeBidders.find(id => id !== highestId) || activeBidders[0];

      if (candidateId) {
        const bidder = state.players.find(p => p.id === candidateId);
        const nextMinBid = (state.auction.currentBid || 0) + 10;

        if (bidder && bidder.cash >= nextMinBid && Math.random() < 0.5) {
          state = gameReducer(state, { type: 'AUCTION_BID', amount: nextMinBid, playerId: candidateId });
        } else {
          state = gameReducer(state, { type: 'AUCTION_PASS', playerId: candidateId });
        }
      }
      verifyInvariants(state, 'auction_step');
      continue;
    }

    // Step: TURN_END
    if (state.step === TURN_STEPS.TURN_END) {
      // Opportunistic building: try building on an owned monopoly
      for (const [tId, prop] of Object.entries(state.properties)) {
        if (prop.ownerId === player.id) {
          const tile = boardData[parseInt(tId, 10)];
          if (tile && player.cash >= (tile.houseCost + 200)) {
            const bVal = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, player, tile.id);
            if (bVal.valid && Math.random() < 0.4) {
              state = gameReducer(state, { type: 'BUILD_HOUSE', tileId: tile.id, playerId: player.id });
              break;
            }
          }
        }
      }

      state = gameReducer(state, { type: 'END_TURN', playerId: player.id });
      totalTurnsCompleted++;
      verifyInvariants(state, `turn_end_${totalTurnsCompleted}`);
      continue;
    }
  }

  console.log(`Simulation finished! Completed ${totalTurnsCompleted} turns safely. Final Phase: ${state.phase}`);
  assert.ok(totalTurnsCompleted >= 100, `Simulation should complete at least 100 turns (completed: ${totalTurnsCompleted})`);
});
