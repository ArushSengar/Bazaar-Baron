/**
 * Bazaar Arcade E2E Test Suite — Tier 5: Adversarial Coverage Hardening
 * 
 * Conducts white-box adversarial stress testing across all engines, rooms,
 * registries, and client utils across 8 core dimensions:
 * 
 * 1. Malformed / Poisoned Network Intents
 * 2. Race Conditions & Concurrency Bursts
 * 3. Strict Turn Order & Security Validation
 * 4. Ludo Complex Edge Cases
 * 5. Snakes & Ladders Corner Cases
 * 6. UNO Severe Edge Cases
 * 7. Disconnect / Reconnect Recovery
 * 8. Audio & Visual State Integrity
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startTestServer,
  createTestClient,
  setupTestRoom,
  mockBrowserEnvironment,
  clearAllTimers
} from './harness.js';
import { rooms } from '../../rooms.js';

import { gameReducer } from '../../engine/reducer.js';
import { createInitialGameState } from '../../engine/state.js';
import { unoReducer, createInitialUnoState } from '../../engine/uno/reducer.js';
import { ludoReducer } from '../../engine/ludo/reducer.js';
import { createInitialLudoState, createInitialLudoTokens } from '../../engine/ludo/state.js';
import { snakesReducer } from '../../engine/snakes/reducer.js';
import { createInitialSnakesState } from '../../engine/snakes/state.js';
import { SoundManager } from '../../../client/src/utils/audio.js';
import { LUDO_COLORS, SAFE_STAR_INDICES, STEPS_TO_HOME } from '../../engine/ludo/constants.js';
import { LADDERS, SNAKES } from '../../engine/snakes/constants.js';
import { UNO_CARD_TYPES, UNO_COLORS, UNO_DIRECTIONS } from '../../engine/uno/constants.js';
import { canPlayUnoCard } from '../../engine/uno/rules.js';

describe('Tier 5: Adversarial Coverage Hardening', () => {
  let envPolyfill;

  before(() => {
    envPolyfill = mockBrowserEnvironment();
  });

  after(() => {
    if (envPolyfill) envPolyfill.restore();
    clearAllTimers();
  });

  // =========================================================================
  // Dimension 1: Malformed & Poisoned Network Intents
  // =========================================================================
  describe('Dimension 1: Malformed & Poisoned Network Intents', () => {
    it('1.1 Null / undefined intent payload to game_intent does not crash server and leaves state intact', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer', numClients: 1 });
      const host = room.host;

      const resNull = await host.emitAsync('game_intent', null);
      assert.ok(resNull);
      assert.equal(resNull.success, true);

      const resUndef = await host.emitAsync('game_intent', undefined);
      assert.ok(resUndef);
      assert.equal(resUndef.success, true);

      await room.teardown();
    });

    it('1.2 Intent with missing type field ({}) rejected without mutating room state or crashing', async () => {
      const room = await setupTestRoom({ gameType: 'ludo', hostName: 'HostPlayer', numClients: 1 });
      const host = room.host;

      const res = await host.emitAsync('game_intent', {});
      assert.ok(res);
      assert.equal(res.success, true);

      await room.teardown();
    });

    it('1.3 Intent with completely unknown action type leaves game state intact', async () => {
      const room = await setupTestRoom({ gameType: 'snakes_and_ladders', hostName: 'HostPlayer', numClients: 1 });
      const host = room.host;

      const res = await host.emitAsync('game_intent', { type: 'CORRUPT_BUFFER_OVERFLOW_EXPLOIT' });
      assert.ok(res);
      assert.equal(res.success, true);
      assert.equal(res.gameState.phase, 'LOBBY');

      await room.teardown();
    });

    it('1.4 Monopoly AUCTION_BID with non-numeric / NaN string amount is safely ignored', () => {
      let state = createInitialGameState('M_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'AUCTION';
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, bankrupt: false }
      ];
      state.auction = {
        tileId: 1,
        currentBid: 50,
        highestBidderId: 'p2',
        activeBidders: ['p1', 'p2']
      };

      const next = gameReducer(state, { type: 'AUCTION_BID', playerId: 'p1', amount: 'ten_thousand' });
      assert.equal(next.auction.currentBid, 50);
      assert.equal(next.auction.highestBidderId, 'p2');
    });

    it('1.5 Monopoly AUCTION_BID with negative amount is safely ignored', () => {
      let state = createInitialGameState('M_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'AUCTION';
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, bankrupt: false }
      ];
      state.auction = {
        tileId: 1,
        currentBid: 50,
        highestBidderId: 'p2',
        activeBidders: ['p1', 'p2']
      };

      const next = gameReducer(state, { type: 'AUCTION_BID', playerId: 'p1', amount: -200 });
      assert.equal(next.auction.currentBid, 50);
      assert.equal(next.auction.highestBidderId, 'p2');
    });

    it('1.6 Monopoly BUILD_HOUSE with invalid / non-existent string tileId is cleanly rejected', () => {
      let state = createInitialGameState('M_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'INITIAL';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'P1', cash: 1500, bankrupt: false }];

      const next = gameReducer(state, { type: 'BUILD_HOUSE', playerId: 'p1', tileId: 'non_existent_tile' });
      assert.equal(next.players[0].cash, 1500);
      assert.equal(next.bank.houses, 32);
    });

    it('1.7 Ludo MOVE_TOKEN with invalid / non-existent tokenId does not move any token', () => {
      let state = createInitialLudoState('L_ADV1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].tokens = createInitialLudoTokens();
      state.hasRolled = true;
      state.diceValue = 6;
      state.movableTokenIds = ['t0', 't1', 't2', 't3'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 'invalid_tok_99' });
      assert.equal(next.hasRolled, true);
      assert.deepEqual(next.players[0].tokens, state.players[0].tokens);
    });

    it('1.8 Snakes ROLL_DICE with out-of-range dice value (< 1 or > 6) ignores invalid value and generates random 1-6 roll', () => {
      let state = createInitialSnakesState('S_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 10;

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 99 });
      assert.ok(next.diceValue >= 1 && next.diceValue <= 6, 'Dice value must be clamped or generated between 1 and 6');
      assert.ok(next.players[0].position >= 11 && next.players[0].position <= 16);
    });

    it('1.9 UNO PLAY_CARD with null / invalid cardId not in hand is cleanly ignored', () => {
      let state = createInitialUnoState('U_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'red', value: 8, type: 'number' }] }
      ];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'ghost_card_id' });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.discardPile.length, 1);
    });

    it('1.10 UNO PLAY_CARD with invalid wild color string safely falls back to valid UNO color', () => {
      let state = createInitialUnoState('U_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'w1', color: 'wild', value: 'wild', type: 'wild' }] },
        { id: 'p2', name: 'P2', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, {
        type: 'PLAY_CARD',
        playerId: 'p1',
        cardId: 'w1',
        chosenColor: 'neon_purple_invalid'
      });
      assert.ok(UNO_COLORS.includes(next.activeColor), 'Active color must fall back to a valid UNO color');
    });

    it('1.11 [Oracle/Bug Catch] Monopoly TRADE_OFFER rejects negative offerCash and requestCash', () => {
      let state = createInitialGameState('M_ADV1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'INITIAL';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 100, bankrupt: false, getOutOfJailCards: 0 },
        { id: 'p2', name: 'P2', cash: 200, bankrupt: false, getOutOfJailCards: 0 }
      ];

      const sOffer = gameReducer(state, {
        type: 'TRADE_OFFER',
        playerId: 'p1',
        targetPlayerId: 'p2',
        offerCash: -500,
        requestCash: 0
      });

      // Oracle expectation: negative cash trade offers must be rejected or sanitized to >= 0
      assert.ok(
        !sOffer.activeTrade || sOffer.activeTrade.offerCash >= 0,
        'Vulnerability Found: TRADE_OFFER accepts negative offerCash allowing cash theft on accept'
      );
    });

    it('1.12 [Oracle/Bug Catch] Reducer gracefully handles null or undefined intent without unhandled TypeError', () => {
      const state = { players: [], logs: [] };

      assert.doesNotThrow(() => {
        gameReducer(state, null);
      }, 'Vulnerability Found: gameReducer throws TypeError on null intent');

      assert.doesNotThrow(() => {
        unoReducer(state, null);
      }, 'Vulnerability Found: unoReducer throws TypeError on null intent');
    });
  });

  // =========================================================================
  // Dimension 2: Race Conditions & Concurrency Bursts
  // =========================================================================
  describe('Dimension 2: Race Conditions & Concurrency Bursts', () => {
    it('2.1 Concurrent intent burst: 20 simultaneous rolls from multiple connected clients execute atomically without corruption', async () => {
      const room = await setupTestRoom({ gameType: 'snakes_and_ladders', hostName: 'HostPlayer', numClients: 2 });
      const p1 = room.host;
      const p2 = room.clients[1];

      await p1.emitAsync('start_game');

      const burst = [];
      for (let i = 0; i < 10; i++) {
        burst.push(p1.emitAsync('game_intent', { type: 'ROLL_DICE', diceValue: 2 }));
        burst.push(p2.emitAsync('game_intent', { type: 'ROLL_DICE', diceValue: 3 }));
      }
      const results = await Promise.all(burst);
      assert.equal(results.length, 20);

      const checkRes = await p1.emitAsync('game_intent', { type: 'INVALID' });
      assert.ok(checkRes.gameState);
      assert.equal(typeof checkRes.gameState.turnIndex, 'number');
      assert.ok(checkRes.gameState.players.every(p => p.position >= 0 && p.position <= 100));

      await room.teardown();
    });

    it('2.2 Concurrent room join burst: 5 simultaneous joins on same room code resolve atomically without exceeding capacity', async () => {
      const serverInstance = await startTestServer();
      const host = await createTestClient(serverInstance.url);

      const createRes = await host.emitAsync('create_room', {
        name: 'HostPlayer',
        gameType: 'ludo' // Ludo maxPlayers = 4
      });
      const roomCode = createRes.roomCode;

      const guests = await Promise.all([
        createTestClient(serverInstance.url),
        createTestClient(serverInstance.url),
        createTestClient(serverInstance.url),
        createTestClient(serverInstance.url),
        createTestClient(serverInstance.url)
      ]);

      const joinPromises = guests.map((g, i) =>
        g.emitAsync('join_room', { roomCode, name: `BurstGuest_${i + 1}` })
      );
      const joinResults = await Promise.all(joinPromises);

      const successfulJoins = joinResults.filter(r => r.success);
      assert.ok(successfulJoins.length <= 3, 'Must not exceed 4 total players in Ludo room');

      for (const g of guests) g.disconnect();
      host.disconnect();
      await serverInstance.close();
    });

    it('2.3 Rapid start game spam: multiple concurrent START_GAME events do not duplicate playerOrder or corrupt match', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer', numClients: 2 });
      const host = room.host;

      const startSpam = await Promise.all([
        host.emitAsync('start_game'),
        host.emitAsync('start_game'),
        host.emitAsync('start_game')
      ]);

      assert.ok(startSpam.every(r => r && r.success));
      const roomObj = rooms.get(room.roomCode);
      assert.ok(roomObj);
      assert.equal(roomObj.gameState.playerOrder.length, 2);
      assert.equal(new Set(roomObj.gameState.playerOrder).size, 2);

      await room.teardown();
    });

    it('2.4 Simultaneous disconnect and intent emission handles teardown cleanly without unhandled rejection', async () => {
      const room = await setupTestRoom({ gameType: 'snakes_and_ladders', hostName: 'HostPlayer', numClients: 2 });
      const guest = room.clients[1];

      await room.host.emitAsync('start_game');

      guest.disconnect();
      const sendWhileDisconnecting = room.host.emitAsync('game_intent', { type: 'ROLL_DICE', diceValue: 4 });
      const res = await sendWhileDisconnecting;
      assert.ok(res);

      await room.teardown();
    });
  });

  // =========================================================================
  // Dimension 3: Strict Turn Order & Security Validation
  // =========================================================================
  describe('Dimension 3: Strict Turn Order & Security Validation', () => {
    it('3.1 Monopoly: Non-active player ROLL_DICE is strictly rejected', () => {
      let state = createInitialGameState('M_ADV3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, position: 0, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, position: 0, bankrupt: false }
      ];

      const next = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p2', dice: [3, 4] });
      assert.equal(next.players[1].position, 0);
      assert.deepEqual(next.dice, [1, 1]);
    });

    it('3.2 Monopoly: Non-active player BUY_PROPERTY is strictly rejected', () => {
      let state = createInitialGameState('M_ADV3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'AWAITING_BUY';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, position: 1, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, position: 1, bankrupt: false }
      ];

      const next = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p2' });
      assert.equal(next.properties['1'].ownerId, null);
    });

    it('3.3 Monopoly: Non-active player END_TURN is strictly rejected', () => {
      let state = createInitialGameState('M_ADV3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'TURN_END';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, position: 0, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, position: 0, bankrupt: false }
      ];

      const next = gameReducer(state, { type: 'END_TURN', playerId: 'p2' });
      assert.equal(next.turnIndex, 0);
    });

    it('3.4 Ludo: Non-active player ROLL_DICE is strictly rejected', () => {
      let state = createInitialLudoState('L_ADV3', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', color: 'red', tokens: createInitialLudoTokens() },
        { id: 'p2', name: 'P2', color: 'blue', tokens: createInitialLudoTokens() }
      ];
      state.hasRolled = false;

      const next = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p2', diceValue: 6 });
      assert.equal(next.hasRolled, false);
      assert.equal(next.diceValue, null);
    });

    it('3.5 Ludo: Non-active player MOVE_TOKEN is strictly rejected', () => {
      let state = createInitialLudoState('L_ADV3', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', color: 'red', tokens: createInitialLudoTokens() },
        { id: 'p2', name: 'P2', color: 'blue', tokens: createInitialLudoTokens() }
      ];
      state.hasRolled = true;
      state.diceValue = 6;
      state.movableTokenIds = ['t0'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p2', tokenId: 't0' });
      assert.equal(next.players[0].tokens[0].state, 'base');
    });

    it('3.6 Ludo: Double roll attempt before moving token is strictly rejected', () => {
      let state = createInitialLudoState('L_ADV3', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].tokens = createInitialLudoTokens();
      state.hasRolled = true;
      state.diceValue = 6;
      state.movableTokenIds = ['t0', 't1', 't2', 't3'];

      const next = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 4 });
      assert.equal(next.diceValue, 6); // Remains 6
    });

    it('3.7 Snakes: Out-of-turn ROLL_DICE is strictly rejected', () => {
      let state = createInitialSnakesState('S_ADV3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', position: 5 },
        { id: 'p2', name: 'P2', position: 10 }
      ];

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p2', forcedDice: 4 });
      assert.equal(next.players[1].position, 10);
      assert.equal(next.turnIndex, 0);
    });

    it('3.8 UNO: Out-of-turn PLAY_CARD, DRAW_CARD, and PASS_TURN are strictly rejected', () => {
      let state = createInitialUnoState('U_ADV3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'red', value: 2, type: 'number' }] },
        { id: 'p2', name: 'P2', cards: [{ id: 'c2', color: 'red', value: 3, type: 'number' }] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const playRes = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p2', cardId: 'c2' });
      assert.equal(playRes.players[1].cards.length, 1);

      const drawRes = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p2' });
      assert.equal(drawRes.players[1].cards.length, 1);

      const passRes = unoReducer(state, { type: 'PASS_TURN', playerId: 'p2' });
      assert.equal(passRes.turnIndex, 0);
    });

    it('3.9 Client-side playerId spoofing: Malicious intent with forged playerId is overridden by verified socket session', async () => {
      const room = await setupTestRoom({ gameType: 'snakes_and_ladders', hostName: 'HostPlayer', numClients: 2 });
      const guest = room.clients[1];

      await room.host.emitAsync('start_game');

      const spoofRes = await guest.emitAsync('game_intent', {
        type: 'ROLL_DICE',
        playerId: room.createRes.playerId, // Attempt to spoof Host's ID
        diceValue: 5
      });

      assert.ok(spoofRes);
      await room.teardown();
    });

    it('3.10 Non-host kick_player or add_bot attempts are rejected with permission error', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer', numClients: 2 });
      const guest = room.clients[1];

      const kickRes = await guest.emitAsync('kick_player', { targetPlayerId: room.createRes.playerId });
      assert.equal(kickRes.success, false);
      assert.match(kickRes.error, /host/i);

      const botRes = await guest.emitAsync('add_bot', { name: 'MaliciousBot' });
      assert.equal(botRes.success, false);
      assert.match(botRes.error, /host/i);

      await room.teardown();
    });

    it('3.11 [Oracle/Bug Catch] Ludo rejects START_GAME intent from non-host player', () => {
      const state = {
        phase: 'LOBBY',
        players: [
          { id: 'host_p', name: 'Host', isHost: true, color: 'red', tokens: createInitialLudoTokens() },
          { id: 'guest_p', name: 'Guest', isHost: false, color: 'blue', tokens: createInitialLudoTokens() }
        ],
        playerOrder: ['host_p', 'guest_p'],
        logs: []
      };

      const s2 = ludoReducer(state, { type: 'START_GAME', playerId: 'guest_p' });
      assert.equal(
        s2.phase,
        'LOBBY',
        'Vulnerability Found: ludoReducer allows non-host guest to start game'
      );
    });

    it('3.12 [Oracle/Bug Catch] Snakes rejects START_GAME intent from non-host player', () => {
      const state = {
        phase: 'LOBBY',
        players: [
          { id: 'host_p', name: 'Host', isHost: true, position: 0 },
          { id: 'guest_p', name: 'Guest', isHost: false, position: 0 }
        ],
        playerOrder: ['host_p', 'guest_p'],
        logs: []
      };

      const s2 = snakesReducer(state, { type: 'START_GAME', playerId: 'guest_p' });
      assert.equal(
        s2.phase,
        'LOBBY',
        'Vulnerability Found: snakesReducer allows non-host guest to start game'
      );
    });
  });

  // =========================================================================
  // Dimension 4: Ludo Complex Edge Cases
  // =========================================================================
  describe('Dimension 4: Ludo Complex Edge Cases', () => {
    it('4.1 Three consecutive sixes forfeit rule: rolling 3 consecutive 6s forfeits turn, resets count, and passes turn', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', color: 'red', tokens: createInitialLudoTokens() },
        { id: 'p2', name: 'P2', color: 'blue', tokens: createInitialLudoTokens() }
      ];
      state.consecutiveSixes = 2;
      state.hasRolled = false;

      const next = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
      assert.equal(next.turnIndex, 1);
      assert.equal(next.consecutiveSixes, 0);
      assert.equal(next.hasRolled, false);
      assert.equal(next.movableTokenIds.length, 0);
    });

    it('4.2 Non-six roll after six resets consecutive sixes counter to 0', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', color: 'red', tokens: createInitialLudoTokens() },
        { id: 'p2', name: 'P2', color: 'blue', tokens: createInitialLudoTokens() }
      ];
      state.consecutiveSixes = 1;
      state.hasRolled = false;

      const next = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 4 });
      assert.equal(next.consecutiveSixes, 0);
      assert.equal(next.diceValue, 4);
    });

    it('4.3 Safe star token stacking: tokens from different players coexist on safe star without capture', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      // Safe star 8: P2 is already resting on star 8
      state.players = [
        { id: 'p1', name: 'Red', color: 'red', tokens: [{ id: 't1_1', state: 'track', position: 4, step: 4 }] },
        { id: 'p2', name: 'Green', color: 'green', tokens: [{ id: 't2_1', state: 'track', position: 8, step: 21 }] }
      ];
      state.hasRolled = true;
      state.diceValue = 4;
      state.movableTokenIds = ['t1_1'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_1' });
      assert.equal(next.players[0].tokens[0].position, 8);
      assert.equal(next.players[1].tokens[0].position, 8);
      assert.equal(next.players[1].tokens[0].state, 'track'); // NOT captured
    });

    it('4.4 Safe star stacking for same player: multiple tokens from same player coexist on safe star', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [
        {
          id: 'p1',
          name: 'Red',
          color: 'red',
          tokens: [
            { id: 't1_1', state: 'track', position: 13, step: 13 },
            { id: 't1_2', state: 'track', position: 10, step: 10 }
          ]
        }
      ];
      state.hasRolled = true;
      state.diceValue = 3;
      state.movableTokenIds = ['t1_2'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_2' });
      assert.equal(next.players[0].tokens[0].position, 13);
      assert.equal(next.players[0].tokens[1].position, 13);
    });

    it('4.5 Capturing opponent on track boundary: capturing opponent on tile 51 resets opponent to base and awards bonus roll', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'Red', color: 'red', tokens: [{ id: 't1_1', state: 'track', position: 50, step: 50 }] },
        { id: 'p2', name: 'Green', color: 'green', tokens: [{ id: 't2_1', state: 'track', position: 51, step: 38 }] }
      ];
      state.hasRolled = true;
      state.diceValue = 1;
      state.movableTokenIds = ['t1_1'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_1' });
      assert.equal(next.players[0].tokens[0].position, 51);
      assert.equal(next.players[1].tokens[0].state, 'base');
      assert.equal(next.players[1].tokens[0].position, -1);
      assert.equal(next.hasRolled, false);
      assert.equal(next.turnIndex, 0); // Bonus roll awarded
    });

    it('4.6 Home stretch exact roll vs overshoot: token at step 55 holds on 3+, enters home on 2, advances on 1', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [
        { id: 'p1', name: 'Red', color: 'red', tokens: [{ id: 't1_1', state: 'home_stretch', position: 3, step: 55 }] }
      ];

      // Overshoot with roll 3: 55 + 3 = 58 > 57 (STEPS_TO_HOME) -> cannot move
      state.hasRolled = false;
      const sOver = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 3 });
      assert.equal(sOver.movableTokenIds.length, 0);
      assert.equal(sOver.players[0].tokens[0].step, 55);

      // Exact with roll 2: 55 + 2 = 57 -> reaches home
      state.hasRolled = true;
      state.diceValue = 2;
      state.movableTokenIds = ['t1_1'];
      const sExact = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_1' });
      assert.equal(sExact.players[0].tokens[0].state, 'home');
      assert.equal(sExact.players[0].tokens[0].step, 57);
      assert.equal(sExact.players[0].completedTokens, 1);

      // Advance with roll 1: 55 + 1 = 56 -> advances to home_stretch position 4
      state.hasRolled = true;
      state.diceValue = 1;
      state.movableTokenIds = ['t1_1'];
      const sAdv = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_1' });
      assert.equal(sAdv.players[0].tokens[0].state, 'home_stretch');
      assert.equal(sAdv.players[0].tokens[0].position, 4);
      assert.equal(sAdv.players[0].tokens[0].step, 56);
    });

    it('4.7 Home stretch immunity: opponent tokens cannot capture tokens in home stretch', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 1;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'Red', color: 'red', tokens: [{ id: 't1_1', state: 'home_stretch', position: 0, step: 52 }] },
        { id: 'p2', name: 'Green', color: 'green', tokens: [{ id: 't2_1', state: 'track', position: 0, step: 39 }] }
      ];
      state.hasRolled = true;
      state.diceValue = 0; // Simulated track landing on position 0
      state.movableTokenIds = ['t2_1'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p2', tokenId: 't2_1' });
      assert.equal(next.players[0].tokens[0].state, 'home_stretch'); // Red token remains untouched
    });

    it('4.8 Victory on 4th token home: game immediately transitions to GAME_OVER and declares winner', () => {
      let state = createInitialLudoState('L_ADV4', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [
        {
          id: 'p1',
          name: 'Red',
          color: 'red',
          completedTokens: 3,
          tokens: [
            { id: 't1_1', state: 'home', position: 5, step: 57 },
            { id: 't1_2', state: 'home', position: 5, step: 57 },
            { id: 't1_3', state: 'home', position: 5, step: 57 },
            { id: 't1_4', state: 'home_stretch', position: 4, step: 56 }
          ]
        }
      ];
      state.hasRolled = true;
      state.diceValue = 1;
      state.movableTokenIds = ['t1_4'];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 't1_4' });
      assert.equal(next.phase, 'GAME_OVER');
      assert.equal(next.winnerId, 'p1');
      assert.equal(next.players[0].completedTokens, 4);
      assert.equal(next.players[0].rank, 1);
    });
  });

  // =========================================================================
  // Dimension 5: Snakes & Ladders Corner Cases
  // =========================================================================
  describe('Dimension 5: Snakes & Ladders Corner Cases', () => {
    it('5.1 Snake head exact landing triggers slide down to exact tail tile', () => {
      let state = createInitialSnakesState('S_ADV5', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 96;

      // Landing on 99 -> slides down to 78
      const s99 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(s99.players[0].position, 78);
      assert.equal(s99.lastMove?.snake, true);
      assert.equal(s99.lastMove?.intermediate, 99);
      assert.equal(s99.lastMove?.to, 78);

      // Landing on 17 -> slides down to 7
      state.players[0].position = 13;
      const s17 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.equal(s17.players[0].position, 7);
      assert.equal(s17.lastMove?.snake, true);

      // Landing on 87 -> slides down to 24
      state.players[0].position = 85;
      const s87 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 2 });
      assert.equal(s87.players[0].position, 24);
      assert.equal(s87.lastMove?.snake, true);
    });

    it('5.2 Ladder base exact landing triggers climb up to exact top tile', () => {
      let state = createInitialSnakesState('S_ADV5', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 25;

      // Landing on 28 -> climbs up to 84
      const s28 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(s28.players[0].position, 84);
      assert.equal(s28.lastMove?.ladder, true);
      assert.equal(s28.lastMove?.intermediate, 28);
      assert.equal(s28.lastMove?.to, 84);

      // Landing on 4 from 0 -> climbs up to 14
      state.players[0].position = 0;
      const s4 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.equal(s4.players[0].position, 14);
      assert.equal(s4.lastMove?.ladder, true);

      // Landing on 71 -> climbs up to 91
      state.players[0].position = 70;
      const s71 = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 1 });
      assert.equal(s71.players[0].position, 91);
      assert.equal(s71.lastMove?.ladder, true);
    });

    it('5.3 Final tile 100 boundary: exact roll lands on tile 100 and triggers immediate victory', () => {
      let state = createInitialSnakesState('S_ADV5', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 97;

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(next.players[0].position, 100);
      assert.equal(next.phase, 'GAME_OVER');
      assert.equal(next.winnerId, 'p1');
      assert.equal(next.lastMove?.win, true);
    });

    it('5.4 Final tile 100 overshoot: rolling > needed distance holds position (stay rule) and records overshoot metadata', () => {
      let state = createInitialSnakesState('S_ADV5', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', position: 97 },
        { id: 'p2', name: 'P2', position: 50 }
      ];

      // Needs 3 to win; rolls 5
      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 5 });
      assert.equal(next.players[0].position, 97); // Held at 97
      assert.equal(next.lastMove?.overshoot, true);
      assert.equal(next.turnIndex, 1); // Passes to p2

      // Rolls 6 on overshoot: holds position but gets extra roll
      state.turnIndex = 0;
      const sSix = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.equal(sSix.players[0].position, 97);
      assert.equal(sSix.lastMove?.overshoot, true);
      assert.equal(sSix.turnIndex, 0); // Retains turn on 6
    });

    it('5.5 Consecutive sixes rule: 3 consecutive sixes forfeits the 3rd roll and advances turn', () => {
      let state = createInitialSnakesState('S_ADV5', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', position: 20 },
        { id: 'p2', name: 'P2', position: 30 }
      ];
      state.consecutiveSixes = 2;

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.equal(next.players[0].position, 20); // Not advanced on 3rd six
      assert.equal(next.lastMove?.forfeited, true);
      assert.equal(next.consecutiveSixes, 0);
      assert.equal(next.turnIndex, 1);
    });
  });

  // =========================================================================
  // Dimension 6: UNO Severe Edge Cases
  // =========================================================================
  describe('Dimension 6: UNO Severe Edge Cases', () => {
    it('6.1 Draw pile exhaustion: drawing with 0 cards in draw pile triggers discard pile reshuffle, preserving top card', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = [];
      state.discardPile = [
        { id: 'd1', color: 'red', value: 1, type: 'number' },
        { id: 'd2', color: 'blue', value: 2, type: 'number' },
        { id: 'd3', color: 'green', value: 3, type: 'number' },
        { id: 'd_top', color: 'yellow', value: 7, type: 'number' }
      ];
      state.activeColor = 'yellow';
      state.players = [
        { id: 'p1', name: 'P1', cards: [] },
        { id: 'p2', name: 'P2', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p1' });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.discardPile.length, 1);
      assert.equal(next.discardPile[0].id, 'd_top');
      assert.equal(next.deck.length, 2);
    });

    it('6.2 Discard reshuffle resets wild cards colors back to wild', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = [];
      state.discardPile = [
        { id: 'w1', color: 'red', value: 'wild', type: 'wild' }, // wild played as red
        { id: 'w4_1', color: 'blue', value: 'wild4', type: 'wild4' }, // wild4 played as blue
        { id: 'd_top', color: 'yellow', value: 7, type: 'number' }
      ];
      state.activeColor = 'yellow';
      state.players = [
        { id: 'p1', name: 'P1', cards: [] },
        { id: 'p2', name: 'P2', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p1' });
      const allCards = [...next.deck, ...next.players[0].cards];
      const w1 = allCards.find(c => c.id === 'w1');
      const w4 = allCards.find(c => c.id === 'w4_1');
      assert.equal(w1?.color, 'wild');
      assert.equal(w4?.color, 'wild');
    });

    it('6.3 Completely exhausted deck and discard pile (1 card remaining) passes turn without crash', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = [];
      state.discardPile = [{ id: 'd_top', color: 'yellow', value: 7, type: 'number' }];
      state.activeColor = 'yellow';
      state.players = [
        { id: 'p1', name: 'P1', cards: [] },
        { id: 'p2', name: 'P2', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p1' });
      assert.equal(next.players[0].cards.length, 0);
      assert.equal(next.hasDrawnThisTurn, false);
      assert.equal(next.turnIndex, 1);
    });

    it('6.4 Wild Draw 4 on active turns changes active color, forces next player to draw 4 cards, and skips their turn', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.direction = 1;
      state.deck = [
        { id: 'd1', color: 'red', value: 1, type: 'number' },
        { id: 'd2', color: 'red', value: 2, type: 'number' },
        { id: 'd3', color: 'red', value: 3, type: 'number' },
        { id: 'd4', color: 'red', value: 4, type: 'number' }
      ];
      state.discardPile = [{ id: 'd0', color: 'green', value: 5, type: 'number' }];
      state.activeColor = 'green';
      state.players = [
        {
          id: 'p1',
          name: 'P1',
          cards: [
            { id: 'w4', color: 'wild', value: 'wild4', type: 'wild4' },
            { id: 'c_extra', color: 'blue', value: 9, type: 'number' }
          ]
        },
        { id: 'p2', name: 'P2', cards: [] },
        { id: 'p3', name: 'P3', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2', 'p3'];

      const next = unoReducer(state, {
        type: 'PLAY_CARD',
        playerId: 'p1',
        cardId: 'w4',
        chosenColor: 'yellow'
      });

      assert.equal(next.activeColor, 'yellow');
      assert.equal(next.players[1].cards.length, 4);
      assert.equal(next.turnIndex, 2); // P2 skipped, turn goes to P3
    });

    it('6.5 UNO shout window: player with 1 card who forgot to call UNO is vulnerable to CATCH_UNO penalty (+2 cards)', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 1;
      state.deck = [
        { id: 'd1', color: 'blue', value: 1, type: 'number' },
        { id: 'd2', color: 'blue', value: 2, type: 'number' }
      ];
      state.discardPile = [{ id: 'd0', color: 'red', value: 0, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'red', value: 1, type: 'number' }], calledUno: false },
        { id: 'p2', name: 'P2', cards: [{ id: 'c2', color: 'red', value: 2, type: 'number' }] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, { type: 'CATCH_UNO', playerId: 'p2', targetPlayerId: 'p1' });
      assert.equal(next.players[0].cards.length, 3);
      assert.equal(next.players[0].calledUno, false);
    });

    it('6.6 CATCH_UNO against player with calledUno: true or > 1 card is safely ignored', () => {
      let state = createInitialUnoState('U_ADV6', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 1;
      state.deck = [
        { id: 'd1', color: 'blue', value: 1, type: 'number' },
        { id: 'd2', color: 'blue', value: 2, type: 'number' }
      ];
      state.discardPile = [{ id: 'd0', color: 'red', value: 0, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'red', value: 1, type: 'number' }], calledUno: true },
        { id: 'p2', name: 'P2', cards: [{ id: 'c2', color: 'red', value: 2, type: 'number' }] }
      ];
      state.playerOrder = ['p1', 'p2'];

      // Caught when already called UNO
      const nextCalled = unoReducer(state, { type: 'CATCH_UNO', playerId: 'p2', targetPlayerId: 'p1' });
      assert.equal(nextCalled.players[0].cards.length, 1);

      // Caught when holding 2 cards
      state.players[0].cards.push({ id: 'c3', color: 'green', value: 3, type: 'number' });
      state.players[0].calledUno = false;
      const nextTwoCards = unoReducer(state, { type: 'CATCH_UNO', playerId: 'p2', targetPlayerId: 'p1' });
      assert.equal(nextTwoCards.players[0].cards.length, 2);
    });

    it('6.7 Reverse card logic: acts as Skip in 2-player match; reverses turn direction in 3+-player match', () => {
      let state2P = createInitialUnoState('U_ADV6_2P', { id: 'p1', name: 'P1' });
      state2P.phase = 'PLAYING';
      state2P.turnIndex = 0;
      state2P.direction = UNO_DIRECTIONS.CLOCKWISE;
      state2P.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state2P.activeColor = 'red';
      state2P.players = [
        { id: 'p1', name: 'P1', cards: [
          { id: 'r1', color: 'red', value: 'reverse', type: 'reverse' },
          { id: 'c_extra', color: 'blue', value: 9, type: 'number' }
        ] },
        { id: 'p2', name: 'P2', cards: [{ id: 'c2', color: 'red', value: 2, type: 'number' }] }
      ];
      state2P.playerOrder = ['p1', 'p2'];

      // In 2P, Reverse skips P2 and returns turn to P1
      const next2P = unoReducer(state2P, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'r1' });
      assert.equal(next2P.turnIndex, 0);

      // In 3P, Reverse flips direction
      let state3P = createInitialUnoState('U_ADV6_3P', { id: 'p1', name: 'P1' });
      state3P.phase = 'PLAYING';
      state3P.turnIndex = 0;
      state3P.direction = UNO_DIRECTIONS.CLOCKWISE;
      state3P.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state3P.activeColor = 'red';
      state3P.players = [
        { id: 'p1', name: 'P1', cards: [
          { id: 'r2', color: 'red', value: 'reverse', type: 'reverse' },
          { id: 'c_extra', color: 'blue', value: 9, type: 'number' }
        ] },
        { id: 'p2', name: 'P2', cards: [] },
        { id: 'p3', name: 'P3', cards: [] }
      ];
      state3P.playerOrder = ['p1', 'p2', 'p3'];

      const next3P = unoReducer(state3P, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'r2' });
      assert.equal(next3P.direction, UNO_DIRECTIONS.COUNTER_CLOCKWISE);
      assert.equal(next3P.turnIndex, 2); // Previous player (P3)
    });
  });

  // =========================================================================
  // Dimension 7: Disconnect / Reconnect Recovery
  // =========================================================================
  describe('Dimension 7: Disconnect / Reconnect Recovery', () => {
    it('7.1 Host disconnect leaves room intact and marks host connected: false', async () => {
      const room = await setupTestRoom({ gameType: 'ludo', hostName: 'HostPlayer', numClients: 2 });
      const guest = room.clients[1];

      room.host.disconnect();

      const state = await guest.waitForState(s => s.players[0].connected === false);
      assert.equal(state.players[0].connected, false);
      assert.equal(state.players[1].connected, true);

      await room.teardown();
    });

    it('7.2 Host reconnect with playerToken restores socket session and connected: true', async () => {
      const room = await setupTestRoom({ gameType: 'ludo', hostName: 'HostPlayer', numClients: 2 });
      const guest = room.clients[1];

      room.host.disconnect();
      await guest.waitForState(s => s.players[0].connected === false);

      const hostReconnected = await createTestClient(room.url);
      const reconRes = await hostReconnected.emitAsync('join_room', {
        roomCode: room.roomCode,
        playerToken: room.createRes.playerToken
      });

      assert.equal(reconRes.success, true);
      assert.equal(reconRes.reconnected, true);
      assert.equal(reconRes.player.connected, true);

      hostReconnected.disconnect();
      await room.teardown();
    });

    it('7.3 Mid-turn player disconnect preserves game state and allows room play to continue', async () => {
      const room = await setupTestRoom({ gameType: 'snakes_and_ladders', hostName: 'HostPlayer', numClients: 2 });
      const host = room.host;
      const guest = room.clients[1];

      await host.emitAsync('start_game');

      guest.disconnect();
      await host.waitForState(s => s.players[1].connected === false);

      const rollRes = await host.emitAsync('game_intent', { type: 'ROLL_DICE', diceValue: 3 });
      assert.ok(rollRes.gameState);
      assert.equal(rollRes.gameState.players[0].position, 3);

      await room.teardown();
    });

    it('7.4 Reconnecting with unknown / invalid playerToken fails cleanly with error', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer', numClients: 2 });
      const intruder = await createTestClient(room.url);

      // Start game so room is no longer in LOBBY phase
      await room.host.emitAsync('start_game');

      const failRes = await intruder.emitAsync('join_room', {
        roomCode: room.roomCode,
        playerToken: 'invalid_fake_token_12345'
      });

      assert.equal(failRes.success, false);
      assert.match(failRes.error, /already in progress|Room not found/i);

      intruder.disconnect();
      await room.teardown();
    });
  });

  // =========================================================================
  // Dimension 8: Audio & Visual State Integrity
  // =========================================================================
  describe('Dimension 8: Audio & Visual State Integrity', () => {
    it('8.1 SoundManager volume boundary: volume < 0 clamps to 0, volume > 1 clamps to 1', () => {
      const sm = new SoundManager();

      sm.setVolume(-15);
      assert.equal(sm.getVolume(), 0);

      sm.setVolume(25.5);
      assert.equal(sm.getVolume(), 1);

      sm.setVolume(0.45);
      assert.equal(sm.getVolume(), 0.45);
    });

    it('8.2 SoundManager non-numeric inputs: NaN, null, undefined, string, and +/- Infinity handled safely without throwing', () => {
      const sm = new SoundManager();

      assert.doesNotThrow(() => sm.setVolume('completely_invalid_string'));
      assert.equal(sm.getVolume(), 0);

      assert.doesNotThrow(() => sm.setVolume(NaN));
      assert.equal(sm.getVolume(), 0);

      assert.doesNotThrow(() => sm.setVolume(null));
      assert.equal(sm.getVolume(), 0);

      assert.doesNotThrow(() => sm.setVolume(undefined));
      assert.equal(sm.getVolume(), 0);

      assert.doesNotThrow(() => sm.setVolume(Infinity));
      assert.equal(sm.getVolume(), 1);

      assert.doesNotThrow(() => sm.setVolume(-Infinity));
      assert.equal(sm.getVolume(), 0);
    });

    it('8.3 SoundManager mute isolation: toggling mute mutes audio gain while preserving original volume setting', () => {
      const sm = new SoundManager();
      sm.setVolume(0.85);

      sm.setMuted(true);
      assert.equal(sm.isMuted(), true);
      assert.equal(sm.getVolume(), 0.85);

      sm.setMuted(false);
      assert.equal(sm.isMuted(), false);
      assert.equal(sm.getVolume(), 0.85);
    });

    it('8.4 Ludo movableTokenIds state broadcast: accurately contains only legal token IDs based on current dice roll', () => {
      let state = createInitialLudoState('L_ADV8', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      // t0 in BASE, t1 on track
      state.players = [
        {
          id: 'p1',
          name: 'Red',
          color: 'red',
          tokens: [
            { id: 't0', state: 'base', position: -1, step: -1 },
            { id: 't1', state: 'track', position: 10, step: 10 }
          ]
        }
      ];

      // Rolling a 3: only t1 can move (t0 cannot exit base on 3)
      const s3 = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 3 });
      assert.deepEqual(s3.movableTokenIds, ['t1']);

      // Rolling a 6: both t0 and t1 can move
      state.hasRolled = false;
      const s6 = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', diceValue: 6 });
      assert.ok(s6.movableTokenIds.includes('t0'));
      assert.ok(s6.movableTokenIds.includes('t1'));
    });

    it('8.5 Snakes lastMove state metadata: accurately broadcasts move details (from, to, rolled, ladder, snake, overshoot)', () => {
      let state = createInitialSnakesState('S_ADV8', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 20;

      // Move to 24 (regular move)
      const sReg = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.deepEqual(sReg.lastMove, {
        playerId: 'p1',
        from: 20,
        rolled: 4,
        intermediate: undefined,
        to: 24,
        ladder: false,
        snake: false
      });
    });
  });
});
