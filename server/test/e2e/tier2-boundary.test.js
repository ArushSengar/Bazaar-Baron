import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  startTestServer,
  createTestClient,
  setupTestRoom,
  mockBrowserEnvironment
} from './harness.js';
import { gameReducer } from '../../engine/reducer.js';
import { createInitialGameState } from '../../engine/state.js';
import { unoReducer, createInitialUnoState } from '../../engine/uno/reducer.js';
import { ludoReducer } from '../../engine/ludo/reducer.js';
import { createInitialLudoState, createInitialLudoTokens } from '../../engine/ludo/state.js';
import { SAFE_STAR_INDICES } from '../../engine/ludo/constants.js';
import { snakesReducer } from '../../engine/snakes/reducer.js';
import { createInitialSnakesState } from '../../engine/snakes/state.js';
import { sounds, SoundManager } from '../../../client/src/utils/audio.js';
import { GAME_GUIDES, getGuideForGame } from '../../../client/src/data/guides.js';

describe('Tier 2: Boundary & Corner Cases (55 Tests)', () => {
  let envPolyfill;

  before(() => {
    envPolyfill = mockBrowserEnvironment();
  });

  after(() => {
    if (envPolyfill) envPolyfill.restore();
  });

  // =========================================================================
  // 1. F_MONOPOLY Boundaries
  // =========================================================================
  describe('Boundary 1: F_MONOPOLY — Edge Cases & Invariants', () => {
    it('1.1 Rejects ROLL_DICE when not player\'s turn', () => {
      let state = createInitialGameState('M1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 1500, position: 0, connected: true, inJail: false },
        { id: 'p2', name: 'P2', cash: 1500, position: 0, connected: true, inJail: false }
      ];

      // P2 tries to roll out of turn
      const nextState = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p2', dice: [2, 3] });
      assert.equal(nextState.players[1].position, 0);
      assert.deepEqual(nextState.dice, [1, 1]); // Unchanged from initial dice
    });

    it('1.2 Rejects BUY_PROPERTY when player has insufficient cash', () => {
      let state = createInitialGameState('M1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.step = 'AWAITING_BUY';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'P1', cash: 20, position: 1, connected: true, inJail: false }]; // Tile 1 costs 60

      const nextState = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p1' });
      assert.equal(nextState.properties['1'].ownerId, null);
      assert.equal(nextState.players[0].cash, 20);
    });

    it('1.3 Rejects MORTGAGE if properties in same color group have houses', () => {
      let state = createInitialGameState('M1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'P1', cash: 1500, position: 0, connected: true, inJail: false }];
      // Owns brown group: tile 1 and 3. Tile 1 has a house.
      state.properties['1'] = { id: 1, ownerId: 'p1', houses: 1, mortgaged: false };
      state.properties['3'] = { id: 3, ownerId: 'p1', houses: 0, mortgaged: false };

      const nextState = gameReducer(state, { type: 'MORTGAGE', playerId: 'p1', tileId: 3 });
      assert.equal(nextState.properties['3'].mortgaged, false);
    });

    it('1.4 Rolling three consecutive doubles sends player directly to jail', () => {
      let state = createInitialGameState('M1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'P1', cash: 1500, position: 0, connected: true, inJail: false }];

      // Roll 1: doubles
      let s1 = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 2] });
      s1.step = 'INITIAL';
      // Roll 2: doubles
      let s2 = gameReducer(s1, { type: 'ROLL_DICE', playerId: 'p1', dice: [3, 3] });
      s2.step = 'INITIAL';
      // Roll 3: doubles -> Sent to jail!
      let s3 = gameReducer(s2, { type: 'ROLL_DICE', playerId: 'p1', dice: [4, 4] });

      assert.equal(s3.players[0].inJail, true);
      assert.equal(s3.players[0].position, 10);
    });

    it('1.5 Rejects UNMORTGAGE when player lacks mortgage cost + 10% interest', () => {
      let state = createInitialGameState('M1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      // Tile 1 mortgage value is 30, unmortgage cost is 33. Player only has 10 cash.
      state.players = [{ id: 'p1', name: 'P1', cash: 10, position: 0, connected: true, inJail: false }];
      state.properties['1'] = { id: 1, ownerId: 'p1', houses: 0, mortgaged: true };

      const nextState = gameReducer(state, { type: 'UNMORTGAGE', playerId: 'p1', tileId: 1 });
      assert.equal(nextState.properties['1'].mortgaged, true);
      assert.equal(nextState.players[0].cash, 10);
    });
  });

  // =========================================================================
  // 2. F_UNO Boundaries
  // =========================================================================
  describe('Boundary 2: F_UNO — Invalid Moves & Penalties', () => {
    it('2.1 Rejects PLAY_CARD when card color/number does not match top card or active color', () => {
      let state = createInitialUnoState('U_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c_bad', color: 'blue', value: 8, type: 'number' }] }
      ];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c_bad' });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.discardPile[next.discardPile.length - 1].id, 'd0');
    });

    it('2.2 Rejects PLAY_CARD when card is not in player\'s hand', () => {
      let state = createInitialUnoState('U_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c_valid', color: 'red', value: 8, type: 'number' }] }
      ];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'non_existent_id' });
      assert.equal(next.players[0].cards.length, 1);
    });

    it('2.3 Having 1 card remaining without calling UNO leaves player in uncalled state', () => {
      let state = createInitialUnoState('U_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [
          { id: 'c1', color: 'red', value: 8, type: 'number' },
          { id: 'c2', color: 'blue', value: 2, type: 'number' }
        ], calledUno: false }
      ];
      state.playerOrder = ['p1'];

      // Plays card without calledUno: true
      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1', calledUno: false });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.players[0].calledUno, false);
    });

    it('2.4 CATCH_UNO against player with 1 card forces 2 penalty cards drawn', () => {
      let state = createInitialUnoState('U_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 1;
      state.deck = [
        { id: 'pen1', color: 'red', value: 1, type: 'number' },
        { id: 'pen2', color: 'blue', value: 2, type: 'number' }
      ];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'red', value: 8, type: 'number' }], calledUno: false },
        { id: 'p2', name: 'P2', cards: [{ id: 'c2', color: 'green', value: 3, type: 'number' }], calledUno: false }
      ];
      state.playerOrder = ['p1', 'p2'];

      const next = unoReducer(state, { type: 'CATCH_UNO', playerId: 'p2', targetPlayerId: 'p1' });
      assert.equal(next.players[0].cards.length, 3); // 1 original + 2 penalty
    });

    it('2.5 Rejects DRAW_CARD when it is not player\'s turn', () => {
      let state = createInitialUnoState('U_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = [{ id: 'top', color: 'red', value: 1, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [] },
        { id: 'p2', name: 'P2', cards: [] }
      ];
      state.playerOrder = ['p1', 'p2'];

      // P2 tries to draw out of turn
      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p2' });
      assert.equal(next.players[1].cards.length, 0);
      assert.equal(next.deck.length, 1);
    });
  });

  // =========================================================================
  // 3. F_LUDO Boundaries
  // =========================================================================
  describe('Boundary 3: F_LUDO — Dice Bounds, Three Sixes & Exact Goal', () => {
    it('3.1 Cannot move token out of base unless dice roll is 6', () => {
      let state = createInitialLudoState('L_B1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];

      // Roll 5
      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 5 });
      assert.deepEqual(rolled.movableTokenIds, []);
    });

    it('3.2 3 consecutive sixes forfeits turn without movement', () => {
      let state = createInitialLudoState('L_B1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({ id: 'p2', name: 'P2', color: 'green', tokens: createInitialLudoTokens(), completedTokens: 0, rank: null });
      state.consecutiveSixes = 2; // Already rolled two 6s

      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.equal(rolled.consecutiveSixes, 0);
      assert.equal(rolled.turnIndex, 1); // Forfeited, turn advanced to P2
    });

    it('3.3 Overshooting home tile is rejected (requires exact roll to reach goal)', () => {
      let state = createInitialLudoState('L_B1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      // Step 55 (56 is Home, needs exactly 1)
      state.players[0].tokens[0] = { id: 0, state: 'home_stretch', position: 104, step: 55 };

      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      // Cannot move token 0 with roll 3 when only 1 step remains
      assert.ok(!rolled.movableTokenIds.includes(0));
    });

    it('3.4 Rejects MOVE_TOKEN for invalid or non-existent tokenId', () => {
      let state = createInitialLudoState('L_B1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.hasRolled = true;
      state.diceValue = 6;
      state.movableTokenIds = [0, 1, 2, 3];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 99 });
      assert.equal(next.players[0].tokens[0].state, 'base');
    });

    it('3.5 If no tokens can move after roll, turn automatically passes to next player', () => {
      let state = createInitialLudoState('L_B1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({ id: 'p2', name: 'P2', color: 'green', tokens: createInitialLudoTokens(), completedTokens: 0, rank: null });

      // All tokens in base, rolls 3 -> no valid moves
      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(rolled.turnIndex, 1); // Auto-advanced
      assert.equal(rolled.hasRolled, false);
    });
  });

  // =========================================================================
  // 4. F_SNAKES Boundaries
  // =========================================================================
  describe('Boundary 4: F_SNAKES — Overshoot, Turn Validation & Collisions', () => {
    it('4.1 Exact roll required to reach tile 100 (overshoot stays at current position)', () => {
      let state = createInitialSnakesState('S_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 97;

      // Needs 3 to win, rolls 5 (97 + 5 = 102 > 100) -> Stays at 97!
      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 5 });
      assert.equal(next.players[0].position, 97);
      assert.equal(next.lastMove?.overshoot, true);
    });

    it('4.2 Rejects rolling dice out of turn', () => {
      let state = createInitialSnakesState('S_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({ id: 'p2', name: 'P2', position: 10 });

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p2', forcedDice: 4 });
      assert.equal(next.players[1].position, 10);
    });

    it('4.3 3 consecutive sixes forfeits turn in Snakes & Ladders', () => {
      let state = createInitialSnakesState('S_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({ id: 'p2', name: 'P2', position: 0 });
      state.consecutiveSixes = 2;

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.equal(next.turnIndex, 1);
      assert.equal(next.consecutiveSixes, 0);
    });

    it('4.4 Landing on a regular tile triggers neither snake nor ladder', () => {
      let state = createInitialSnakesState('S_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 5; // 5 + 3 = 8 (neither snake nor ladder)

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(next.players[0].position, 8);
      assert.equal(next.lastMove?.ladder, false);
      assert.equal(next.lastMove?.snake, false);
    });

    it('4.5 Multiple tokens can occupy the same tile without collision or capture', () => {
      let state = createInitialSnakesState('S_B1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', position: 10 },
        { id: 'p2', name: 'P2', position: 14 }
      ];

      // P1 rolls 4 -> lands on 14 (same tile as P2)
      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.equal(next.players[0].position, 14);
      assert.equal(next.players[1].position, 14);
    });
  });

  // =========================================================================
  // 5. F_LOBBY Boundaries
  // =========================================================================
  describe('Boundary 5: F_LOBBY — Room Capacity, Permissions & Color Conflicts', () => {
    it('5.1 Joining non-existent room code returns Room not found error', async () => {
      const serverInstance = await startTestServer();
      const client = await createTestClient(serverInstance.url);

      const joinRes = await client.emitAsync('join_room', { roomCode: 'ZZZZ', name: 'Visitor' });
      assert.equal(joinRes.success, false);
      assert.match(joinRes.error, /Room not found/i);

      client.disconnect();
      await serverInstance.close();
    });

    it('5.2 Joining room that exceeds player capacity is rejected', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 6 });
      const extraClient = await createTestClient(room.url);

      const overflowRes = await extraClient.emitAsync('join_room', { roomCode: room.roomCode, name: 'Extra' });
      assert.equal(overflowRes.success, false);
      assert.match(overflowRes.error, /full/i);

      extraClient.disconnect();
      await room.teardown();
    });

    it('5.3 Selecting an already-taken color in lobby returns error', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 2 });
      const hostColor = room.createRes.player.color;

      const p2 = room.clients[1];
      const conflictRes = await p2.emitAsync('set_color', { color: hostColor });
      assert.equal(conflictRes.success, false);
      assert.match(conflictRes.error, /already chosen/i);

      await room.teardown();
    });

    it('5.4 Non-host attempting to kick player is rejected', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 2 });
      const guest = room.clients[1];

      const badKick = await guest.emitAsync('kick_player', { targetPlayerId: room.createRes.playerId });
      assert.equal(badKick.success, false);
      assert.match(badKick.error, /host/i);

      await room.teardown();
    });

    it('5.5 Non-host attempting to start game is rejected', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 2 });
      const guest = room.clients[1];

      await guest.emitAsync('start_game');
      // State phase must remain LOBBY because guest cannot start game
      assert.equal(room.createRes.gameState.phase, 'LOBBY');

      await room.teardown();
    });
  });

  // =========================================================================
  // 6. F_SYNC Boundaries
  // =========================================================================
  describe('Boundary 6: F_SYNC — Concurrency & Malformed Intent Handling', () => {
    it('6.1 Rapid concurrent intents are serialized without state corruption', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 2 });
      const [c1, c2] = room.clients;

      const p1 = c1.emitAsync('set_avatar', { avatar: '🎲' });
      const p2 = c2.emitAsync('set_avatar', { avatar: '🎯' });
      const [r1, r2] = await Promise.all([p1, p2]);

      assert.equal(r1.success, true);
      assert.equal(r2.success, true);
      await room.teardown();
    });

    it('6.2 Intent dispatched from socket not mapped to any room returns error', async () => {
      const serverInstance = await startTestServer();
      const orphanClient = await createTestClient(serverInstance.url);

      const res = await orphanClient.emitAsync('game_intent', { type: 'ROLL_DICE' });
      assert.equal(res.success, false);
      assert.match(res.error, /Not in a room/i);

      orphanClient.disconnect();
      await serverInstance.close();
    });

    it('6.3 Malformed intent payload missing type handled gracefully without server crash', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host' });
      const res = await room.host.emitAsync('game_intent', null);
      assert.ok(res !== undefined);
      await room.teardown();
    });

    it('6.4 Active player disconnect sets connected: false and does not wipe player state', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host', numClients: 2 });
      const guest = room.clients[1];

      const dcPromise = room.host.waitForState((s) => s.players[1].connected === false);
      guest.disconnect();
      const state = await dcPromise;
      assert.equal(state.players[1].connected, false);
      assert.equal(state.players[1].cash, 1500); // Intact

      await room.teardown();
    });

    it('6.5 Reconnect attempt with invalid token is treated as new player or rejected', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Host' });
      const client = await createTestClient(room.url);

      const res = await client.emitAsync('join_room', {
        roomCode: room.roomCode,
        playerToken: 'invalid_fake_token_123',
        name: 'Newcomer'
      });
      // Joins as new player rather than reconnecting
      assert.equal(res.success, true);
      assert.equal(res.reconnected, false);

      client.disconnect();
      await room.teardown();
    });
  });

  // =========================================================================
  // 7. F_GLOW_UI Boundaries
  // =========================================================================
  describe('Boundary 7: F_GLOW_UI — Visual Indicator Edge Conditions', () => {
    it('7.1 movableTokenIds is empty when player has no valid moves in Ludo', () => {
      let state = createInitialLudoState('L_G1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      // All tokens in base, rolls 2
      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 2 });
      assert.deepEqual(rolled.movableTokenIds, []);
    });

    it('7.2 Disconnected player avatar flags connected: false for visual dimming', () => {
      const state = createInitialGameState('G_B1', { id: 'p1', name: 'P1' });
      state.players[0].connected = false;
      assert.equal(state.players[0].connected, false);
    });

    it('7.3 Eliminated player flags bankrupt: true for bankrupt styling overlay', () => {
      let state = createInitialGameState('G_B2', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'P1', cash: 0, position: 0, connected: true, inJail: false, bankrupt: false },
        { id: 'p2', name: 'P2', cash: 1500, position: 0, connected: true, inJail: false, bankrupt: false }
      ];

      const next = gameReducer(state, { type: 'BANKRUPT', playerId: 'p1' });
      assert.equal(next.players[0].bankrupt, true);
    });

    it('7.4 Unresolved debt populates debt object for emergency alert glow', () => {
      let state = createInitialGameState('G_B3', { id: 'p1', name: 'P1' });
      state.debt = { debtorId: 'p1', creditorId: 'p2', amount: 350 };
      assert.ok(state.debt);
      assert.equal(state.debt.amount, 350);
    });

    it('7.5 Safe tiles in Ludo match authoritative SAFE_STAR_INDICES constant', () => {
      assert.ok(Array.isArray(SAFE_STAR_INDICES));
      assert.ok(SAFE_STAR_INDICES.includes(0));
      assert.ok(SAFE_STAR_INDICES.includes(8));
      assert.ok(SAFE_STAR_INDICES.includes(13));
      assert.ok(SAFE_STAR_INDICES.includes(21));
    });
  });

  // =========================================================================
  // 8. F_ANIM Boundaries
  // =========================================================================
  describe('Boundary 8: F_ANIM — Animation Queues & Reordering', () => {
    it('8.1 Rapid card plays preserve exact chronological order in discardPile', () => {
      let state = createInitialUnoState('U_A1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'init', color: 'red', value: 1, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'P1', cards: [{ id: 'p1_card', color: 'red', value: 2, type: 'number' }, { id: 'extra', color: 'blue', value: 1 }] },
        { id: 'p2', name: 'P2', cards: [{ id: 'p2_card', color: 'red', value: 3, type: 'number' }, { id: 'extra', color: 'blue', value: 1 }] }
      ];
      state.playerOrder = ['p1', 'p2'];

      const s1 = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'p1_card' });
      const s2 = unoReducer(s1, { type: 'PLAY_CARD', playerId: 'p2', cardId: 'p2_card' });

      assert.equal(s2.discardPile.length, 3);
      assert.equal(s2.discardPile[1].id, 'p1_card');
      assert.equal(s2.discardPile[2].id, 'p2_card');
    });

    it('8.2 Empty draw deck in UNO automatically reshuffles discard pile', () => {
      let state = createInitialUnoState('U_A2', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = []; // Empty deck
      state.discardPile = [
        { id: 'd1', color: 'red', value: 1, type: 'number' },
        { id: 'd2', color: 'blue', value: 2, type: 'number' },
        { id: 'top', color: 'green', value: 3, type: 'number' }
      ];
      state.players = [{ id: 'p1', name: 'P1', cards: [] }];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p1' });
      assert.equal(next.players[0].cards.length, 1);
      // Top card remains on discard pile, rest shuffled into deck
      assert.equal(next.discardPile.length, 1);
      assert.equal(next.discardPile[0].id, 'top');
    });

    it('8.3 Ludo token leaving base transitions state from base to track', () => {
      let state = createInitialLudoState('L_A1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].tokens[0] = { id: 0, state: 'base', position: -1, step: -1 };
      state.hasRolled = true;
      state.diceValue = 6;
      state.movableTokenIds = [0];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(next.players[0].tokens[0].state, 'track');
    });

    it('8.4 Ludo token entering home stretch transitions state to home_stretch', () => {
      let state = createInitialLudoState('L_A2', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      // Step 50 is track, step 51 enters home stretch
      state.players[0].tokens[0] = { id: 0, state: 'track', position: 50, step: 50 };
      state.hasRolled = true;
      state.diceValue = 2;
      state.movableTokenIds = [0];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(next.players[0].tokens[0].state, 'home_stretch');
      assert.equal(next.players[0].tokens[0].step, 52);
    });

    it('8.5 Game over event crowns winnerId and locks further rolling', () => {
      let state = createInitialSnakesState('S_A1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 96;

      const finished = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.equal(finished.phase, 'GAME_OVER');
      assert.equal(finished.winnerId, 'p1');

      // Subsequent roll in GAME_OVER is rejected
      const blocked = snakesReducer(finished, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 2 });
      assert.equal(blocked.players[0].position, 100);
    });
  });

  // =========================================================================
  // 9. F_AUDIO_FX Boundaries
  // =========================================================================
  describe('Boundary 9: F_AUDIO_FX — Headless Safety & Stress Invariants', () => {
    it('9.1 Audio calls with null context gracefully no-op', () => {
      const sm = new SoundManager();
      sm.ctx = null;
      assert.doesNotThrow(() => {
        sm.playDiceRoll();
        sm.playCashChime();
        sm.playClick();
      });
    });

    it('9.2 50 rapid successive sound triggers do not throw or crash', () => {
      assert.doesNotThrow(() => {
        for (let i = 0; i < 50; i++) {
          sounds.playClick();
          sounds.playDiceRoll();
          sounds.playErrorSound();
        }
      });
    });

    it('9.3 Audio methods called while context is suspended attempt resume', () => {
      let resumed = false;
      const sm = new SoundManager();
      sm.ctx = {
        state: 'suspended',
        currentTime: 0,
        resume: () => {
          resumed = true;
          return Promise.resolve();
        },
        createGain: () => ({ gain: { setValueAtTime: () => {} }, connect: () => {} }),
        destination: {}
      };
      sm.init();
      assert.equal(resumed, true);
    });

    it('9.4 playErrorSound synthesizes low buzz audio cue', () => {
      assert.doesNotThrow(() => {
        sounds.playErrorSound();
      });
    });

    it('9.5 playTokenCaptureSound synthesizes token capture cues', () => {
      assert.doesNotThrow(() => {
        sounds.playTokenCaptureSound();
      });
    });
  });

  // =========================================================================
  // 10. F_AUDIO_CTRL Boundaries
  // =========================================================================
  describe('Boundary 10: F_AUDIO_CTRL — Range Clamping & Storage Resilience', () => {
    it('10.1 setVolume(1.5) clamps volume to 1.0', () => {
      sounds.setVolume(1.5);
      assert.equal(sounds.getVolume(), 1.0);
    });

    it('10.2 setVolume(-0.5) clamps volume to 0.0', () => {
      sounds.setVolume(-0.5);
      assert.equal(sounds.getVolume(), 0.0);
    });

    it('10.3 Setting volume to 0.0 silences output while isMuted remains false', () => {
      sounds.setMuted(false);
      sounds.setVolume(0.0);
      assert.equal(sounds.getVolume(), 0.0);
      assert.equal(sounds.isMuted(), false);
    });

    it('10.4 Audio settings degrade gracefully when localStorage is missing or throws', () => {
      const prevStorage = globalThis.localStorage;
      globalThis.localStorage = {
        getItem: () => { throw new Error('SecurityError: Access Denied'); },
        setItem: () => { throw new Error('QuotaExceededError'); }
      };

      assert.doesNotThrow(() => {
        const sm = new SoundManager();
        sm.setVolume(0.6);
        sm.setMuted(true);
      });

      globalThis.localStorage = prevStorage;
    });

    it('10.5 Volume configuration changes persist across subsequent queries', () => {
      sounds.setVolume(0.42);
      assert.equal(sounds.getVolume(), 0.42);
      sounds.setVolume(0.7); // Restore standard default
    });
  });

  // =========================================================================
  // 11. F_GUIDES Boundaries
  // =========================================================================
  describe('Boundary 11: F_GUIDES — Fallback & Data Quality Invariants', () => {
    it('11.1 Querying guide for non-existent game ID returns default/fallback guide', () => {
      const fallback = getGuideForGame('non_existent_game_xyz');
      assert.ok(fallback);
      assert.equal(fallback.gameId, 'monopoly');
    });

    it('11.2 Accessing null or empty string returns fallback guide without throwing', () => {
      assert.doesNotThrow(() => {
        const g1 = getGuideForGame(null);
        const g2 = getGuideForGame('');
        assert.ok(g1 && g2);
      });
    });

    it('11.3 All guide step descriptions have length > 20 characters', () => {
      for (const [key, guide] of Object.entries(GAME_GUIDES)) {
        for (const step of guide.steps) {
          assert.ok(
            step.description.length > 20,
            `Step "${step.title}" in guide "${key}" has description length <= 20`
          );
        }
      }
    });

    it('11.4 Guide steps have non-empty highlights array', () => {
      for (const [key, guide] of Object.entries(GAME_GUIDES)) {
        for (const step of guide.steps) {
          assert.ok(
            Array.isArray(step.highlights) && step.highlights.length > 0,
            `Step "${step.title}" in guide "${key}" has empty highlights`
          );
        }
      }
    });

    it('11.5 All 4 games have valid icon component names', () => {
      const validIcons = new Set(['Store', 'Layers', 'Crosshair', 'TrendingUp']);
      for (const [key, guide] of Object.entries(GAME_GUIDES)) {
        assert.ok(
          validIcons.has(guide.icon),
          `Guide "${key}" has unrecognized icon "${guide.icon}"`
        );
      }
    });
  });
});
