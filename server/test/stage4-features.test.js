import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialGameState } from '../engine/state.js';
import { gameReducer } from '../engine/reducer.js';
import { TURN_STEPS, GAME_PHASES } from '../engine/constants.js';

function createGame() {
  const host = { id: 'p1', token: 'tok-1', name: 'Sethji', color: 'red' };
  let state = createInitialGameState('STG4', host);
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

describe('Stage 4 Features: Auctions, Trades, Bankruptcy & Game Over', () => {

  describe('1. Public Property Auction', () => {
    it('declining purchase triggers auction, bidding and pass awards property to highest bidder', () => {
      let state = createGame();
      // p1 lands on tile 1 (Chandni Chowk)
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 0] });
      assert.equal(state.step, TURN_STEPS.AWAITING_BUY);

      // p1 declines to buy at list price -> Auction starts!
      state = gameReducer(state, { type: 'DECLINE_BUY', playerId: 'p1' });
      assert.equal(state.step, TURN_STEPS.AUCTION);
      assert.ok(state.auction);
      assert.equal(state.auction.tileId, 1);
      assert.equal(state.auction.currentBid, 0);

      // p1 bids ₹40
      state = gameReducer(state, { type: 'AUCTION_BID', playerId: 'p1', amount: 40 });
      assert.equal(state.auction.currentBid, 40);
      assert.equal(state.auction.highestBidderId, 'p1');

      // p2 counter-bids ₹65
      state = gameReducer(state, { type: 'AUCTION_BID', playerId: 'p2', amount: 65 });
      assert.equal(state.auction.currentBid, 65);
      assert.equal(state.auction.highestBidderId, 'p2');

      // p1 passes
      state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p1' });

      // Auction should conclude: p2 won for ₹65!
      assert.equal(state.auction, null);
      assert.equal(state.step, TURN_STEPS.TURN_END);
      assert.equal(state.properties[1].ownerId, 'p2');
      assert.equal(state.players.find(p => p.id === 'p2').cash, 1500 - 65);
    });

    it('if all players pass without bids, property remains unowned', () => {
      let state = createGame();
      state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 0] });
      state = gameReducer(state, { type: 'DECLINE_BUY', playerId: 'p1' });

      // Both pass
      state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p1' });
      state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p2' });

      assert.equal(state.auction, null);
      assert.equal(state.step, TURN_STEPS.TURN_END);
      assert.equal(state.properties[1].ownerId, null);
    });
  });

  describe('2. Player-to-Player Trading', () => {
    it('successfully proposes and executes trade of properties, cash and cards', () => {
      let state = createGame();
      // Setup assets
      state.properties[1].ownerId = 'p1'; // Chandni Chowk
      state.properties[3].ownerId = 'p2'; // Daryaganj
      state.players.find(p => p.id === 'p1').getOutOfJailCards = 1;

      // p1 proposes trade: offers tile 1 + ₹100 + 1 card, requests tile 3
      state = gameReducer(state, {
        type: 'TRADE_OFFER',
        playerId: 'p1',
        targetPlayerId: 'p2',
        offerPropertyIds: [1],
        offerCash: 100,
        offerJailCards: 1,
        requestPropertyIds: [3],
        requestCash: 0,
        requestJailCards: 0
      });

      assert.ok(state.activeTrade);
      assert.equal(state.activeTrade.senderId, 'p1');
      assert.equal(state.activeTrade.targetPlayerId, 'p2');

      // p2 accepts trade
      state = gameReducer(state, { type: 'TRADE_ACCEPT', playerId: 'p2' });

      // Verify assets swapped
      assert.equal(state.activeTrade, null);
      assert.equal(state.properties[1].ownerId, 'p2');
      assert.equal(state.properties[3].ownerId, 'p1');
      assert.equal(state.players.find(p => p.id === 'p1').cash, 1500 - 100);
      assert.equal(state.players.find(p => p.id === 'p2').cash, 1500 + 100);
      assert.equal(state.players.find(p => p.id === 'p1').getOutOfJailCards, 0);
      assert.equal(state.players.find(p => p.id === 'p2').getOutOfJailCards, 1);
    });

    it('rejecting trade clears activeTrade offer', () => {
      let state = createGame();
      state = gameReducer(state, {
        type: 'TRADE_OFFER',
        playerId: 'p1',
        targetPlayerId: 'p2',
        offerCash: 50,
        requestCash: 0
      });

      state = gameReducer(state, { type: 'TRADE_REJECT', playerId: 'p2' });
      assert.equal(state.activeTrade, null);
    });
  });

  describe('3. Debt Resolution and Bankruptcy', () => {
    it('allows mortgaging to raise cash and resolving debt', () => {
      let state = createGame();
      const p2 = state.players.find(p => p.id === 'p2');
      p2.cash = 100;
      state.properties[39].ownerId = 'p2'; // Marine Drive (mortgage value 200)

      // p2 incurs debt of ₹250 to p1
      state.debt = { creditorId: 'p1', amount: 250, reason: 'High Rent' };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;

      // Mortgage tile 39 -> cash becomes 100 + 200 = 300
      state = gameReducer(state, { type: 'MORTGAGE', playerId: 'p2', tileId: 39 });
      assert.equal(state.players.find(p => p.id === 'p2').cash, 300);

      // Now p2 resolves debt
      state = gameReducer(state, { type: 'RESOLVE_DEBT', playerId: 'p2' });
      assert.equal(state.debt, null);
      assert.equal(state.step, TURN_STEPS.TURN_END);
      assert.equal(state.players.find(p => p.id === 'p2').cash, 300 - 250);
      assert.equal(state.players.find(p => p.id === 'p1').cash, 1500 + 250);
    });

    it('declaring bankruptcy transfers all assets to creditor and crowns survivor', () => {
      let state = createGame();
      state.properties[6].ownerId = 'p2';
      state.players.find(p => p.id === 'p2').cash = 75;

      state.debt = { creditorId: 'p1', amount: 800, reason: 'Hotel Rent' };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;

      // Declare bankruptcy
      state = gameReducer(state, { type: 'BANKRUPT', playerId: 'p2' });

      const p2 = state.players.find(p => p.id === 'p2');
      const p1 = state.players.find(p => p.id === 'p1');

      assert.equal(p2.bankrupt, true);
      assert.equal(state.properties[6].ownerId, 'p1');
      assert.equal(p1.cash, 1500 + 75);

      // Single survivor -> Game over!
      assert.equal(state.phase, GAME_PHASES.GAME_OVER);
      assert.equal(state.winnerId, 'p1');
    });
  });

});
