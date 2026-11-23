import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../engine/state.js';
import { gameReducer } from '../engine/reducer.js';
import { calculateRent, validateBuildHouse, validateMortgage, validateUnmortgage } from '../engine/rules.js';
import { GAME_PHASES, TURN_STEPS, RULES } from '../engine/constants.js';
import boardData from '../data/board.json' with { type: 'json' };

function createTwoPlayerGame() {
  const host = { id: 'p1', token: 'tok-1', name: 'Alice', color: 'red' };
  const state = createInitialGameState('TEST', host);
  // Add player 2
  state.players.push({
    id: 'p2',
    token: 'tok-2',
    name: 'Bob',
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
  return state;
}

describe('Bazaar Baron Pure Engine Tests', () => {

  describe('1. Rent Calculations', () => {
    it('calculates base rent and doubled monopoly rent correctly', () => {
      const state = createTwoPlayerGame();
      const chandniChowk = 1; // Brown group, base rent 2, cost 60
      const daryaganj = 3;    // Brown group, base rent 4, cost 60

      state.properties[chandniChowk].ownerId = 'p1';

      // Unimproved single property
      const baseRent = calculateRent(boardData, state.properties, chandniChowk, 7);
      assert.equal(baseRent, 2);

      // Complete the color group for p1 (Monopoly)
      state.properties[daryaganj].ownerId = 'p1';
      const monopolyRent = calculateRent(boardData, state.properties, chandniChowk, 7);
      assert.equal(monopolyRent, 4, 'Rent should double on unimproved monopoly');

      // Add 1 house to Chandni Chowk (rent table: [2, 10, 30, 90, 160, 250])
      state.properties[chandniChowk].houses = 1;
      const oneHouseRent = calculateRent(boardData, state.properties, chandniChowk, 7);
      assert.equal(oneHouseRent, 10);

      // Hotel (5 houses)
      state.properties[chandniChowk].houses = 5;
      const hotelRent = calculateRent(boardData, state.properties, chandniChowk, 7);
      assert.equal(hotelRent, 250);
    });

    it('calculates station rent according to count owned', () => {
      const state = createTwoPlayerGame();
      const stations = [5, 15, 25, 35]; // Howrah, CSMT, Chennai Central, New Delhi Station

      state.properties[5].ownerId = 'p1';
      assert.equal(calculateRent(boardData, state.properties, 5), 25);

      state.properties[15].ownerId = 'p1';
      assert.equal(calculateRent(boardData, state.properties, 5), 50);

      state.properties[25].ownerId = 'p1';
      assert.equal(calculateRent(boardData, state.properties, 5), 100);

      state.properties[35].ownerId = 'p1';
      assert.equal(calculateRent(boardData, state.properties, 5), 200);
    });

    it('calculates utility rent based on dice roll multiplier', () => {
      const state = createTwoPlayerGame();
      const bijliBoard = 12;
      const paniNigam = 28;

      state.properties[bijliBoard].ownerId = 'p1';
      // 1 utility owned: 4x dice
      assert.equal(calculateRent(boardData, state.properties, bijliBoard, 8), 32);

      // 2 utilities owned: 10x dice
      state.properties[paniNigam].ownerId = 'p1';
      assert.equal(calculateRent(boardData, state.properties, bijliBoard, 8), 80);
    });

    it('charges 0 rent if property is mortgaged', () => {
      const state = createTwoPlayerGame();
      state.properties[1].ownerId = 'p1';
      state.properties[1].mortgaged = true;

      assert.equal(calculateRent(boardData, state.properties, 1, 7), 0);
    });
  });

  describe('2. Doubles & Jail Rules', () => {
    it('allows player to roll again after rolling doubles', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      // Roll doubles: [2, 2]
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 2] });
      assert.equal(state.doublesCount, 1);
      assert.equal(state.lastRollDoubles, true);

      // End turn should NOT pass to p2, but allow p1 to roll again
      state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });
      assert.equal(state.playerOrder[state.turnIndex], 'p1');
      assert.equal(state.step, TURN_STEPS.INITIAL);
    });

    it('sends player to jail after three consecutive doubles', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      // Double 1: [1, 1] -> lands on 2 (Bazaar Fund) -> resolves to TURN_END
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 1] });
      if (state.step === TURN_STEPS.AWAITING_BUY) {
        state = gameReducer(state, { type: 'DECLINE_BUY', playerId: 'p1' });
        state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p1' });
        state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p2' });
      }
      state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });

      // Double 2: [2, 2]
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 2] });
      if (state.step === TURN_STEPS.AWAITING_BUY) {
        state = gameReducer(state, { type: 'DECLINE_BUY', playerId: 'p1' });
        state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p1' });
        state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p2' });
      }
      state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });

      // Double 3: [3, 3] -> sends directly to jail!
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [3, 3] });
      
      const p1 = state.players.find(p => p.id === 'p1');
      assert.equal(p1.inJail, true, 'Player should be in jail after 3 doubles');
      assert.equal(p1.position, RULES.JAIL_TILE_INDEX);
      assert.equal(state.doublesCount, 0);
    });

    it('releases player from jail immediately when rolling doubles without second roll', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      // Put p1 in jail
      state.players.find(p => p.id === 'p1').inJail = true;
      state.players.find(p => p.id === 'p1').position = RULES.JAIL_TILE_INDEX;

      // Roll doubles in jail: [3, 3]
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [3, 3] });
      const p1 = state.players.find(p => p.id === 'p1');
      assert.equal(p1.inJail, false);
      assert.equal(p1.position, 16); // 10 + 6
      assert.equal(state.doublesCount, 0, 'Doubles out of jail does not grant another roll');
    });

    it('forces player to pay ₹50 fine after 3 failed attempts in jail', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      state.players.find(p => p.id === 'p1').inJail = true;
      state.players.find(p => p.id === 'p1').position = RULES.JAIL_TILE_INDEX;
      const initialCash = state.players.find(p => p.id === 'p1').cash;

      // Turn 1 in jail (fail)
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });
      let p1 = state.players.find(p => p.id === 'p1');
      assert.equal(p1.inJail, true);
      assert.equal(p1.jailTurns, 1);
      state.step = TURN_STEPS.INITIAL; // Simulate turn 2
      
      // Turn 2 in jail (fail)
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 3] });
      p1 = state.players.find(p => p.id === 'p1');
      assert.equal(p1.inJail, true);
      assert.equal(p1.jailTurns, 2);
      state.step = TURN_STEPS.INITIAL; // Simulate turn 3

      // Turn 3 in jail (fail -> forced ₹50 fine & release)
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 4] });
      p1 = state.players.find(p => p.id === 'p1');
      assert.equal(p1.inJail, false, 'Player should be released after 3rd failed turn');
      assert.equal(p1.cash, initialCash - 50);
      assert.equal(p1.position, 15); // 10 + 5
    });
  });

  describe('3. Even Building Rule & Bank Limits', () => {
    it('enforces even building across color group', () => {
      const state = createTwoPlayerGame();
      const p1 = state.players.find(p => p.id === 'p1');

      // Light blue group: [6, 8, 9] (Commercial Street, Brigade Road, MG Road)
      state.properties[6].ownerId = 'p1';
      state.properties[8].ownerId = 'p1';
      state.properties[9].ownerId = 'p1';

      // Can build 1st house on tile 6
      let validation = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, p1, 6);
      assert.equal(validation.valid, true);

      // Build 1st house on 6
      state.properties[6].houses = 1;

      // Cannot build 2nd house on 6 because tiles 8 and 9 have 0 houses!
      validation = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, p1, 6);
      assert.equal(validation.valid, false, 'Cannot build 2nd house before building on others');

      // Can build 1st house on 8
      validation = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, p1, 8);
      assert.equal(validation.valid, true);
    });

    it('respects bank supply limits', () => {
      const state = createTwoPlayerGame();
      const p1 = state.players.find(p => p.id === 'p1');
      state.properties[1].ownerId = 'p1';
      state.properties[3].ownerId = 'p1';

      // If bank has 0 houses
      state.bank.houses = 0;
      let validation = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, p1, 1);
      assert.equal(validation.valid, false);
      assert.match(validation.reason, /No houses left/i);

      // If upgrading to hotel (4 houses -> 5) and bank has 0 hotels
      state.bank.houses = 10;
      state.bank.hotels = 0;
      state.properties[1].houses = 4;
      state.properties[3].houses = 4;
      validation = validateBuildHouse(boardData, state.properties, state.bank.houses, state.bank.hotels, p1, 1);
      assert.equal(validation.valid, false);
      assert.match(validation.reason, /No hotels left/i);
    });
  });

  describe('4. Mortgage & Unmortgage', () => {
    it('prevents mortgaging if buildings exist in group', () => {
      const state = createTwoPlayerGame();
      const p1 = state.players.find(p => p.id === 'p1');
      state.properties[1].ownerId = 'p1';
      state.properties[3].ownerId = 'p1';
      state.properties[1].houses = 1;

      // Try to mortgage 3 while 1 has a house
      const validation = validateMortgage(boardData, state.properties, p1, 3);
      assert.equal(validation.valid, false);
      assert.match(validation.reason, /sell all houses/i);
    });

    it('collects mortgage value and requires 10% interest to unmortgage', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      // Give tile 1 (Chandni Chowk, cost 60, mortgage 30) to p1
      state.properties[1].ownerId = 'p1';
      const initialCash = state.players.find(p => p.id === 'p1').cash;

      // Mortgage
      state = gameReducer(state, { type: 'MORTGAGE', playerId: 'p1', tileId: 1 });
      const p1AfterMortgage = state.players.find(p => p.id === 'p1');
      assert.equal(state.properties[1].mortgaged, true);
      assert.equal(p1AfterMortgage.cash, initialCash + 30);

      // Unmortgage (Cost: 30 + 10% = 33)
      const unmortgageVal = validateUnmortgage(boardData, state.properties, p1AfterMortgage, 1);
      assert.equal(unmortgageVal.valid, true);
      assert.equal(unmortgageVal.cost, 33);

      state = gameReducer(state, { type: 'UNMORTGAGE', playerId: 'p1', tileId: 1 });
      const p1AfterUnmortgage = state.players.find(p => p.id === 'p1');
      assert.equal(state.properties[1].mortgaged, false);
      assert.equal(p1AfterUnmortgage.cash, initialCash - 3);
    });
  });

  describe('5. Bankruptcy Transfer & Winning', () => {
    it('transfers assets to creditor and crowns last survivor', () => {
      let state = createTwoPlayerGame();
      state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });

      // Give assets to p2
      state.properties[6].ownerId = 'p2';
      state.players.find(p => p.id === 'p2').cash = 50;
      state.players.find(p => p.id === 'p2').getOutOfJailCards = 1;

      // Set p2 in debt to p1
      state.debt = { creditorId: 'p1', amount: 200, tileId: 1 };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;

      // p2 declares bankruptcy
      state = gameReducer(state, { type: 'BANKRUPT', playerId: 'p2' });

      const p2 = state.players.find(p => p.id === 'p2');
      const p1 = state.players.find(p => p.id === 'p1');

      assert.equal(p2.bankrupt, true);
      assert.equal(state.properties[6].ownerId, 'p1', 'Property transferred to creditor');
      assert.equal(p1.cash, 1500 + 50, 'Cash transferred to creditor');
      assert.equal(p1.getOutOfJailCards, 1, 'Jail cards transferred');

      // Single survivor -> Game over!
      assert.equal(state.phase, GAME_PHASES.GAME_OVER);
      assert.equal(state.winnerId, 'p1');
    });
  });

});
