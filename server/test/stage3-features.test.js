import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../engine/state.js';
import { gameReducer } from '../engine/reducer.js';
import { TURN_STEPS } from '../engine/constants.js';

function createGame() {
  const host = { id: 'p1', token: 'tok-1', name: 'Sethji', color: 'red' };
  let state = createInitialGameState('STG3', host);
  state.players.push({
    id: 'p2',
    token: 'tok-2',
    name: 'Raja',
    color: 'blue',
    cash: 2500,
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

describe('Stage 3 Features: Houses/Hotels, Mortgages, Jail & Cards', () => {

  describe('Houses and Hotels (Even Building Rule & Bank Supply)', () => {
    it('enforces even building across color set and upgrades to hotel', () => {
      let state = createGame();
      const p1 = state.players.find(p => p.id === 'p1');
      p1.cash = 3000;

      // Give Brown group (Chandni Chowk: 1, Daryaganj: 3, house cost 50 each)
      state.properties[1].ownerId = 'p1';
      state.properties[3].ownerId = 'p1';

      // 1. Build house on tile 1
      state = gameReducer(state, { type: 'BUILD_HOUSE', playerId: 'p1', tileId: 1 });
      assert.equal(state.properties[1].houses, 1);
      assert.equal(state.bank.houses, 31);
      assert.equal(state.players.find(p => p.id === 'p1').cash, 3000 - 50);

      // 2. Try to build 2nd house on tile 1 before tile 3 has 1st house (Should Fail)
      const stateBeforeIllegal = state;
      state = gameReducer(state, { type: 'BUILD_HOUSE', playerId: 'p1', tileId: 1 });
      assert.equal(state.properties[1].houses, 1, 'Even building rule should prevent 2nd house on tile 1');

      // 3. Build house on tile 3
      state = gameReducer(state, { type: 'BUILD_HOUSE', playerId: 'p1', tileId: 3 });
      assert.equal(state.properties[3].houses, 1);
      assert.equal(state.bank.houses, 30);

      // 4. Build up to 4 houses on both
      state.properties[1].houses = 4;
      state.properties[3].houses = 4;
      state.bank.houses = 32 - 8;

      // 5. Upgrade tile 1 to Hotel (5 houses)
      const cashBeforeHotel = state.players.find(p => p.id === 'p1').cash;
      state = gameReducer(state, { type: 'BUILD_HOUSE', playerId: 'p1', tileId: 1 });
      assert.equal(state.properties[1].houses, 5, 'Tile 1 should now have a hotel (5)');
      assert.equal(state.bank.hotels, 11, 'Hotel bank supply should decrement by 1');
      assert.equal(state.bank.houses, (32 - 8) + 4, '4 houses returned to bank supply');
      assert.equal(state.players.find(p => p.id === 'p1').cash, cashBeforeHotel - 50);
    });

    it('selling a house refunds half price and returns house to bank', () => {
      let state = createGame();
      state.properties[1].ownerId = 'p1';
      state.properties[3].ownerId = 'p1';
      state.properties[1].houses = 1;
      state.properties[3].houses = 1;
      state.bank.houses = 30;

      const p1Cash = state.players.find(p => p.id === 'p1').cash;

      // Sell house from tile 1 (house cost 50 -> refund 25)
      state = gameReducer(state, { type: 'SELL_HOUSE', playerId: 'p1', tileId: 1 });
      assert.equal(state.properties[1].houses, 0);
      assert.equal(state.bank.houses, 31);
      assert.equal(state.players.find(p => p.id === 'p1').cash, p1Cash + 25);
    });
  });

  describe('Mortgages and Unmortgages', () => {
    it('allows mortgaging unimproved property and unmortgaging with 10% interest', () => {
      let state = createGame();
      // Marine Drive (tile 39, cost 400, mortgageValue 200)
      state.properties[39].ownerId = 'p1';
      const initialCash = state.players.find(p => p.id === 'p1').cash;

      // Mortgage tile 39
      state = gameReducer(state, { type: 'MORTGAGE', playerId: 'p1', tileId: 39 });
      assert.equal(state.properties[39].mortgaged, true);
      assert.equal(state.players.find(p => p.id === 'p1').cash, initialCash + 200);

      // Unmortgage tile 39: Cost is 200 * 1.10 = 220
      state = gameReducer(state, { type: 'UNMORTGAGE', playerId: 'p1', tileId: 39 });
      assert.equal(state.properties[39].mortgaged, false);
      assert.equal(state.players.find(p => p.id === 'p1').cash, initialCash + 200 - 220);
    });

    it('blocks mortgaging if any property in the color group has houses', () => {
      let state = createGame();
      state.properties[1].ownerId = 'p1';
      state.properties[3].ownerId = 'p1';
      state.properties[1].houses = 1;

      // Attempt to mortgage tile 3
      state = gameReducer(state, { type: 'MORTGAGE', playerId: 'p1', tileId: 3 });
      assert.equal(state.properties[3].mortgaged, false, 'Cannot mortgage when buildings exist in group');
    });
  });

  describe('Jail Bailout Mechanics', () => {
    it('paying ₹50 bail fine releases player immediately and allows rolling', () => {
      let state = createGame();
      const p1 = state.players.find(p => p.id === 'p1');
      p1.inJail = true;
      p1.position = 10;
      p1.cash = 1500;

      // Pay bail fine
      state = gameReducer(state, { type: 'PAY_JAIL_FINE', playerId: 'p1' });

      const p1After = state.players.find(p => p.id === 'p1');
      assert.equal(p1After.inJail, false);
      assert.equal(p1After.cash, 1450);
      assert.equal(state.step, TURN_STEPS.INITIAL, 'Player can now roll to move');
    });

    it('using Get Out of Jail Free card releases player immediately', () => {
      let state = createGame();
      const p1 = state.players.find(p => p.id === 'p1');
      p1.inJail = true;
      p1.position = 10;
      p1.getOutOfJailCards = 1;

      state = gameReducer(state, { type: 'USE_JAIL_CARD', playerId: 'p1' });

      const p1After = state.players.find(p => p.id === 'p1');
      assert.equal(p1After.inJail, false);
      assert.equal(p1After.getOutOfJailCards, 0);
      assert.equal(state.step, TURN_STEPS.INITIAL);
    });
  });

  describe('Card Mechanics and Dismissal', () => {
    it('dismisses card from active state', () => {
      let state = createGame();
      state.drawnCard = { text: 'Test card', deckType: 'chance' };

      state = gameReducer(state, { type: 'DISMISS_CARD' });
      assert.equal(state.drawnCard, null);
    });
  });

});
