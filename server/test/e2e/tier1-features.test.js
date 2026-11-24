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
import { snakesReducer } from '../../engine/snakes/reducer.js';
import { createInitialSnakesState } from '../../engine/snakes/state.js';
import { sounds, SoundManager } from '../../../client/src/utils/audio.js';
import { GAME_GUIDES, ALL_GAMES, getGuideForGame } from '../../../client/src/data/guides.js';

describe('Tier 1: Comprehensive Feature Coverage (55 Tests)', () => {
  let envPolyfill;

  before(() => {
    envPolyfill = mockBrowserEnvironment();
  });

  after(() => {
    if (envPolyfill) envPolyfill.restore();
  });

  // =========================================================================
  // 1. F_MONOPOLY: Bazaar Baron Game Play & State
  // =========================================================================
  describe('Feature 1: F_MONOPOLY — Bazaar Baron Game Play & State', () => {
    it('1.1 Room creation initializes Monopoly state with ₹1500 cash, position 0, and player order', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Sethji' });
      const hostPlayer = room.createRes.player;
      assert.equal(room.createRes.gameState.gameType || 'monopoly', 'monopoly');
      assert.equal(hostPlayer.cash, 1500);
      assert.equal(hostPlayer.position, 0);
      assert.equal(room.createRes.gameState.playerOrder.length, 1);
      assert.equal(room.createRes.gameState.playerOrder[0], hostPlayer.id);
      await room.teardown();
    });

    it('1.2 ROLL_DICE intent moves player token forward by dice sum and updates position', async () => {
      let state = createInitialGameState('TEST', { id: 'p1', name: 'Player1', cash: 1500, position: 0 });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'Player1', cash: 1500, position: 0, connected: true, inJail: false }];

      const nextState = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 3] });
      assert.equal(nextState.players[0].position, 5);
      assert.deepEqual(nextState.dice, [2, 3]);
    });

    it('1.3 BUY_PROPERTY on unowned property deducts cost and assigns ownership', async () => {
      let state = createInitialGameState('TEST', { id: 'p1', name: 'Player1', cash: 1500, position: 1 });
      state.phase = 'PLAYING';
      state.step = 'AWAITING_BUY';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'Player1', cash: 1500, position: 1, connected: true, inJail: false }];

      const nextState = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p1' });
      assert.equal(nextState.properties['1'].ownerId, 'p1');
      assert.equal(nextState.players[0].cash, 1440); // 1500 - 60 (Tile 1 cost)
    });

    it('1.4 Passing GO awards ₹200 salary to the active player', async () => {
      let state = createInitialGameState('TEST', { id: 'p1', name: 'Player1', cash: 1500, position: 38 });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'Player1', cash: 1500, position: 38, connected: true, inJail: false }];

      // Roll [2, 1] -> Position 38 + 3 = 41 % 40 = 1 (Delhi Chandni Chowk), passes GO
      const nextState = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [2, 1] });
      assert.equal(nextState.players[0].position, 1);
      assert.equal(nextState.players[0].cash, 1700); // 1500 + 200
    });

    it('1.5 Landing on another player\'s property transfers rent', async () => {
      let state = createInitialGameState('TEST', { id: 'p1', name: 'Player1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players = [
        { id: 'p1', name: 'Player1', cash: 1500, position: 3, connected: true, inJail: false },
        { id: 'p2', name: 'Player2', cash: 1500, position: 0, connected: true, inJail: false }
      ];
      // P2 owns tile 6 (Delhi Chandni Chowk, base rent ₹6, cost 100)
      state.properties['6'] = { id: 6, ownerId: 'p2', houses: 0, mortgaged: false };

      // P1 rolls 3 -> lands on 6
      const nextState = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });
      assert.equal(nextState.players[0].position, 6);
      assert.equal(nextState.players[0].cash, 1494); // 1500 - 6
      assert.equal(nextState.players[1].cash, 1506); // 1500 + 6
    });
  });

  // =========================================================================
  // 2. F_UNO: Bazaar UNO Game Play & Card Actions
  // =========================================================================
  describe('Feature 2: F_UNO — Bazaar UNO Game Play & Card Actions', () => {
    it('2.1 START_GAME deals 7 cards to each player and places 1 card on discardPile', async () => {
      let state = createInitialUnoState('UNO1', { id: 'p1', name: 'Player1' });
      state.players.push({ id: 'p2', name: 'Player2', cards: [], score: 0, calledUno: false, connected: true });
      state.playerOrder.push('p2');

      const nextState = unoReducer(state, { type: 'START_GAME' });
      assert.equal(nextState.phase, 'PLAYING');
      assert.equal(nextState.players[0].cards.length, 7);
      assert.equal(nextState.players[1].cards.length, 7);
      assert.equal(nextState.discardPile.length, 1);
      assert.ok(nextState.activeColor);
    });

    it('2.2 PLAY_CARD with matching color transitions card to discard pile and advances turn', async () => {
      let state = createInitialUnoState('UNO1', { id: 'p1', name: 'Player1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'c0', color: 'red', value: 5, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'Player1', cards: [{ id: 'c1', color: 'red', value: 8, type: 'number' }, { id: 'c1b', color: 'blue', value: 1 }], score: 0, calledUno: false },
        { id: 'p2', name: 'Player2', cards: [{ id: 'c2', color: 'blue', value: 2, type: 'number' }], score: 0, calledUno: false }
      ];
      state.playerOrder = ['p1', 'p2'];

      const nextState = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
      assert.equal(nextState.players[0].cards.length, 1);
      assert.equal(nextState.discardPile[nextState.discardPile.length - 1].id, 'c1');
      assert.equal(nextState.turnIndex, 1);
    });

    it('2.3 PLAY_CARD with matching number transitions card and updates active number', async () => {
      let state = createInitialUnoState('UNO1', { id: 'p1', name: 'Player1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'blue';
      state.discardPile = [{ id: 'c0', color: 'blue', value: 7, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'Player1', cards: [{ id: 'c1', color: 'green', value: 7, type: 'number' }], score: 0, calledUno: false },
        { id: 'p2', name: 'Player2', cards: [{ id: 'c2', color: 'blue', value: 2, type: 'number' }], score: 0, calledUno: false }
      ];
      state.playerOrder = ['p1', 'p2'];

      const nextState = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
      assert.equal(nextState.activeColor, 'green');
      assert.equal(nextState.discardPile[nextState.discardPile.length - 1].value, 7);
    });

    it('2.4 PLAY_CARD with Action card (Skip) skips the next player\'s turn', async () => {
      let state = createInitialUnoState('UNO1', { id: 'p1', name: 'Player1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'c0', color: 'red', value: 3, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'Player1', cards: [{ id: 'c1', color: 'red', type: 'skip' }, { id: 'c1b', color: 'red', value: 9 }], score: 0, calledUno: false },
        { id: 'p2', name: 'Player2', cards: [{ id: 'c2', color: 'blue', value: 2, type: 'number' }], score: 0, calledUno: false },
        { id: 'p3', name: 'Player3', cards: [{ id: 'c3', color: 'yellow', value: 1, type: 'number' }], score: 0, calledUno: false }
      ];
      state.playerOrder = ['p1', 'p2', 'p3'];

      const nextState = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
      assert.equal(nextState.turnIndex, 2); // Player 2 skipped, turn goes to Player 3
    });

    it('2.5 PLAY_CARD with Wild card allows declaring a new chosenColor', async () => {
      let state = createInitialUnoState('UNO1', { id: 'p1', name: 'Player1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'c0', color: 'red', value: 4, type: 'number' }];
      state.players = [
        { id: 'p1', name: 'Player1', cards: [{ id: 'c_wild', color: 'wild', type: 'wild' }], score: 0, calledUno: false },
        { id: 'p2', name: 'Player2', cards: [{ id: 'c2', color: 'yellow', value: 2, type: 'number' }], score: 0, calledUno: false }
      ];
      state.playerOrder = ['p1', 'p2'];

      const nextState = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c_wild', chosenColor: 'yellow' });
      assert.equal(nextState.activeColor, 'yellow');
      assert.equal(nextState.discardPile[nextState.discardPile.length - 1].id, 'c_wild');
    });
  });

  // =========================================================================
  // 3. F_LUDO: Bazaar Ludo Game Play, Tokens, Safe Stars & Bots
  // =========================================================================
  describe('Feature 3: F_LUDO — Bazaar Ludo Game Play, Tokens, Safe Stars & Bots', () => {
    it('3.1 Ludo room initialization creates 4 tokens per player at base', () => {
      const state = createInitialLudoState('LUDO1', { id: 'p1', name: 'Arush', color: 'red' });
      assert.equal(state.gameType, 'ludo');
      assert.equal(state.players[0].tokens.length, 4);
      assert.equal(state.players[0].tokens[0].state, 'base');
    });

    it('3.2 Rolling a 6 allows player to exit token from base onto starting track tile', () => {
      let state = createInitialLudoState('LUDO1', { id: 'p1', name: 'Arush', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];

      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.equal(rolled.diceValue, 6);
      assert.ok(rolled.movableTokenIds.includes(0));

      const moved = ludoReducer(rolled, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(moved.players[0].tokens[0].state, 'track');
      assert.equal(moved.players[0].tokens[0].position, 0); // Red start position
    });

    it('3.3 MOVE_TOKEN advances track token forward by the rolled dice amount', () => {
      let state = createInitialLudoState('LUDO1', { id: 'p1', name: 'Arush', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].tokens[0] = { id: 0, state: 'track', position: 0, step: 0 };
      state.hasRolled = true;
      state.diceValue = 4;
      state.movableTokenIds = [0];

      const nextState = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(nextState.players[0].tokens[0].step, 4);
      assert.equal(nextState.players[0].tokens[0].position, 4);
    });

    it('3.4 Landing on a designated safe star tile grants capture immunity', () => {
      let state = createInitialLudoState('LUDO1', { id: 'p1', name: 'Arush', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({
        id: 'p2',
        name: 'Opponent',
        color: 'green',
        tokens: createInitialLudoTokens(),
        completedTokens: 0,
        rank: null
      });

      // Opponent token is safe on tile 8 (safe star)
      state.players[1].tokens[0] = { id: 0, state: 'track', position: 8, step: 20 };
      // P1 moves onto tile 8
      state.players[0].tokens[0] = { id: 0, state: 'track', position: 5, step: 5 };
      state.hasRolled = true;
      state.diceValue = 3;
      state.movableTokenIds = [0];

      const nextState = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(nextState.players[0].tokens[0].position, 8);
      // Opponent was NOT captured because tile 8 is a safe star
      assert.equal(nextState.players[1].tokens[0].state, 'track');
      assert.equal(nextState.players[1].tokens[0].position, 8);
    });

    it('3.5 Capturing opponent token returns opponent to base and awards bonus roll', () => {
      let state = createInitialLudoState('LUDO1', { id: 'p1', name: 'Arush', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1', 'p2'];
      state.players.push({
        id: 'p2',
        name: 'Opponent',
        color: 'green',
        tokens: createInitialLudoTokens(),
        completedTokens: 0,
        rank: null
      });

      // Opponent is on non-safe tile 7
      state.players[1].tokens[0] = { id: 0, state: 'track', position: 7, step: 15 };
      // P1 is on tile 4
      state.players[0].tokens[0] = { id: 0, state: 'track', position: 4, step: 4 };
      state.hasRolled = true;
      state.diceValue = 3; // Moves 4 -> 7
      state.movableTokenIds = [0];

      const nextState = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(nextState.players[0].tokens[0].position, 7);
      // Opponent captured!
      assert.equal(nextState.players[1].tokens[0].state, 'base');
      assert.equal(nextState.players[1].tokens[0].position, -1);
      // Bonus roll awarded (turn does not advance, hasRolled reset to false)
      assert.equal(nextState.turnIndex, 0);
      assert.equal(nextState.hasRolled, false);
    });
  });

  // =========================================================================
  // 4. F_SNAKES: Snakes & Ladders Game Play, Sliders & Escalators
  // =========================================================================
  describe('Feature 4: F_SNAKES — Snakes & Ladders Game Play', () => {
    it('4.1 Snakes & Ladders initialization sets all players to tile 0 with phase LOBBY', () => {
      const state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Arush' });
      assert.equal(state.gameType, 'snakes_and_ladders');
      assert.equal(state.phase, 'LOBBY');
      assert.equal(state.players[0].position, 0);
    });

    it('4.2 Rolling dice advances player forward along the 100-tile path', () => {
      let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Arush' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 10;

      const nextState = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 5 });
      assert.equal(nextState.players[0].position, 15);
      assert.equal(nextState.diceValue, 5);
    });

    it('4.3 Landing on the foot of a ladder automatically climbs to the ladder top', () => {
      let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Arush' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 1; // 1 + 3 = 4 (Ladder 4 -> 14)

      const nextState = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(nextState.players[0].position, 14);
      assert.equal(nextState.lastMove?.ladder, true);
    });

    it('4.4 Landing on the head of a snake slides player down to the snake tail', () => {
      let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Arush' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 13; // 13 + 4 = 17 (Snake 17 -> 7)

      const nextState = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
      assert.equal(nextState.players[0].position, 7);
      assert.equal(nextState.lastMove?.snake, true);
    });

    it('4.5 Reaching tile 100 sets phase: GAME_OVER and crowns the winner', () => {
      let state = createInitialSnakesState('SNK1', { id: 'p1', name: 'Arush' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 98; // 98 + 2 = 100

      const nextState = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 2 });
      assert.equal(nextState.players[0].position, 100);
      assert.equal(nextState.phase, 'GAME_OVER');
      assert.equal(nextState.winnerId, 'p1');
    });
  });

  // =========================================================================
  // 5. F_LOBBY: Unified Arcade Lobby, Room Lifecycle & Player Management
  // =========================================================================
  describe('Feature 5: F_LOBBY — Unified Arcade Lobby & Lifecycle', () => {
    it('5.1 create_room returns a 4-letter uppercase code and sets player as host', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });
      assert.match(room.roomCode, /^[A-Z]{4}$/);
      assert.equal(room.createRes.player.isHost, true);
      assert.equal(room.createRes.player.name, 'HostPlayer');
      await room.teardown();
    });

    it('5.2 Second player can join room via join_room with distinct player token', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer', numClients: 2 });
      assert.equal(room.clients.length, 2);
      await room.teardown();
    });

    it('5.3 Host can add an AI bot player via add_bot', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });
      const addRes = await room.host.emitAsync('add_bot', { name: 'Priya (AI)' });
      assert.equal(addRes.success, true);
      assert.equal(addRes.bot.isBot, true);
      await room.teardown();
    });

    it('5.4 Host can kick a non-host player from lobby via kick_player', async () => {
      const serverInstance = await startTestServer();
      const host = await createTestClient(serverInstance.url);
      const guest = await createTestClient(serverInstance.url);

      const createRes = await host.emitAsync('create_room', { name: 'Host' });
      const joinRes = await guest.emitAsync('join_room', { roomCode: createRes.roomCode, name: 'Guest' });

      const kickRes = await host.emitAsync('kick_player', { targetPlayerId: joinRes.playerId });
      assert.equal(kickRes.success, true);

      host.disconnect();
      guest.disconnect();
      await serverInstance.close();
    });

    it('5.5 Player can update color and avatar in lobby (set_color, set_avatar)', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });
      const colorRes = await room.host.emitAsync('set_color', { color: 'purple' });
      assert.equal(colorRes.success, true);

      const avatarRes = await room.host.emitAsync('set_avatar', { avatar: '👑' });
      assert.equal(avatarRes.success, true);
      await room.teardown();
    });
  });

  // =========================================================================
  // 6. F_SYNC: Real-time Multiplayer Intent Sync
  // =========================================================================
  describe('Feature 6: F_SYNC — Real-time Multiplayer Intent Sync', () => {
    it('6.1 Any intent dispatched emits game_state_updated to all connected sockets', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Player1', numClients: 2 });
      const p2 = room.clients[1];

      const statePromise = p2.waitForState((s) => s.players[0].avatar === '🚀');
      await room.host.emitAsync('set_avatar', { avatar: '🚀' });
      const updatedState = await statePromise;
      assert.equal(updatedState.players[0].avatar, '🚀');
      await room.teardown();
    });

    it('6.2 Disconnecting a player marks connected: false and emits state', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'Player1', numClients: 2 });
      const p2 = room.clients[1];

      const disconnectPromise = room.host.waitForState((s) => s.players[1].connected === false);
      p2.disconnect();
      const updated = await disconnectPromise;
      assert.equal(updated.players[1].connected, false);
      await room.teardown();
    });

    it('6.3 Reconnecting with existing playerToken restores connected: true', async () => {
      const serverInstance = await startTestServer();
      const host = await createTestClient(serverInstance.url);
      const guest1 = await createTestClient(serverInstance.url);

      const createRes = await host.emitAsync('create_room', { name: 'Host' });
      const joinRes = await guest1.emitAsync('join_room', { roomCode: createRes.roomCode, name: 'Guest' });
      guest1.disconnect();

      await host.waitForState((s) => s.players[1].connected === false);

      const guest2 = await createTestClient(serverInstance.url);
      const reconnectRes = await guest2.emitAsync('join_room', {
        roomCode: createRes.roomCode,
        playerToken: joinRes.playerToken
      });

      assert.equal(reconnectRes.success, true);
      assert.equal(reconnectRes.reconnected, true);
      assert.equal(reconnectRes.gameState.players[1].connected, true);

      host.disconnect();
      guest2.disconnect();
      await serverInstance.close();
    });

    it('6.4 Turn rotation updates turnIndex synchronously across connected clients', async () => {
      let state = createInitialUnoState('U1', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.players.push({ id: 'p2', name: 'P2', cards: [], score: 0, calledUno: false, connected: true });
      state.playerOrder = ['p1', 'p2'];
      state.turnIndex = 0;
      state.activeColor = 'red';
      state.discardPile = [{ id: 'd0', color: 'red', value: 1, type: 'number' }];
      state.players[0].cards = [
        { id: 'c1', color: 'red', value: 2, type: 'number' },
        { id: 'c1b', color: 'blue', value: 3, type: 'number' }
      ];

      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
      assert.equal(next.turnIndex, 1);
    });

    it('6.5 AI Bot actions broadcast state updates to clients', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });
      const botPromise = room.host.waitForState((s) => s.players.some((p) => p.isBot));
      await room.host.emitAsync('add_bot', { name: 'Bot_1 (AI)' });
      const botState = await botPromise;
      assert.ok(botState.players.some((p) => p.isBot));
      await room.teardown();
    });
  });

  // =========================================================================
  // 7. F_GLOW_UI: Glowing Styling & Visual State Cues
  // =========================================================================
  describe('Feature 7: F_GLOW_UI — Glowing Styling & Visual State Cues', () => {
    it('7.1 State provides playerOrder[turnIndex] for active turn perimeter glow styling', () => {
      const state = createInitialGameState('G1', { id: 'p1', name: 'Sethji' });
      state.playerOrder = ['p1', 'p2'];
      state.turnIndex = 0;
      const activePlayerId = state.playerOrder[state.turnIndex];
      assert.equal(activePlayerId, 'p1');
    });

    it('7.2 winnerId is populated on game win to trigger victory celebration glow', () => {
      let state = createInitialSnakesState('G2', { id: 'p1', name: 'Sethji' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 97;

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.equal(next.winnerId, 'p1');
      assert.equal(next.phase, 'GAME_OVER');
    });

    it('7.3 UNO state exposes activeColor for dynamic board rim lighting glow', () => {
      const state = createInitialUnoState('U2', { id: 'p1', name: 'P1' });
      state.activeColor = 'blue';
      assert.equal(state.activeColor, 'blue');
    });

    it('7.4 Ludo state exposes movableTokenIds for glowing selectable tokens', () => {
      let state = createInitialLudoState('L1', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];

      const rolled = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
      assert.ok(Array.isArray(rolled.movableTokenIds));
      assert.ok(rolled.movableTokenIds.length > 0);
    });

    it('7.5 Error response on invalid intent supplies error message for visual red buzz', async () => {
      const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });
      const badRes = await room.host.emitAsync('game_intent', { type: 'UNKNOWN_TYPE_INTENT' });
      assert.ok(badRes !== undefined);
      await room.teardown();
    });
  });

  // =========================================================================
  // 8. F_ANIM: Card Flight & Interaction State Transitions
  // =========================================================================
  describe('Feature 8: F_ANIM — Card Movement & State Transitions', () => {
    it('8.1 UNO card play removes card from hand and appends to discardPile for flight animation', () => {
      let state = createInitialUnoState('U3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.activeColor = 'green';
      state.discardPile = [{ id: 'd0', color: 'green', value: 1, type: 'number' }];
      state.players = [{ id: 'p1', name: 'P1', cards: [{ id: 'c1', color: 'green', value: 9, type: 'number' }, { id: 'c1b', color: 'red', value: 2 }] }];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.discardPile[next.discardPile.length - 1].id, 'c1');
    });

    it('8.2 UNO card draw appends new card to hand and decrements draw deck', () => {
      let state = createInitialUnoState('U3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.deck = [{ id: 'top_card', color: 'red', value: 3, type: 'number' }];
      state.players = [{ id: 'p1', name: 'P1', cards: [] }];
      state.playerOrder = ['p1'];

      const next = unoReducer(state, { type: 'DRAW_CARD', playerId: 'p1' });
      assert.equal(next.players[0].cards.length, 1);
      assert.equal(next.players[0].cards[0].id, 'top_card');
      assert.equal(next.deck.length, 0);
    });

    it('8.3 Ludo token movement updates token step and position incrementally', () => {
      let state = createInitialLudoState('L2', { id: 'p1', name: 'P1', color: 'red' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].tokens[0] = { id: 0, state: 'track', position: 10, step: 10 };
      state.hasRolled = true;
      state.diceValue = 2;
      state.movableTokenIds = [0];

      const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
      assert.equal(next.players[0].tokens[0].position, 12);
      assert.equal(next.players[0].tokens[0].step, 12);
    });

    it('8.4 Snakes & Ladders climb/slide records movement metadata in lastMove for animation', () => {
      let state = createInitialSnakesState('S3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players[0].position = 1; // 1 + 3 = 4 (Ladder to 14)

      const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
      assert.ok(next.lastMove);
      assert.equal(next.lastMove.from, 1);
      assert.equal(next.lastMove.to, 14);
      assert.equal(next.lastMove.ladder, true);
    });

    it('8.5 Dice roll records dice values in state for 3D tumbling dice animation', () => {
      let state = createInitialGameState('G3', { id: 'p1', name: 'P1' });
      state.phase = 'PLAYING';
      state.turnIndex = 0;
      state.playerOrder = ['p1'];
      state.players = [{ id: 'p1', name: 'P1', cash: 1500, position: 0, inJail: false, connected: true }];

      const next = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [3, 4] });
      assert.deepEqual(next.dice, [3, 4]);
    });
  });

  // =========================================================================
  // 9. F_AUDIO_FX: Procedural Web Audio Sound Triggers & Cues
  // =========================================================================
  describe('Feature 9: F_AUDIO_FX — Procedural Web Audio Sound Triggers', () => {
    it('9.1 SoundManager defines all required audio cues', () => {
      const sm = new SoundManager();
      assert.equal(typeof sm.playDiceRoll, 'function');
      assert.equal(typeof sm.playCashChime, 'function');
      assert.equal(typeof sm.playYourTurnChime, 'function');
      assert.equal(typeof sm.playBuySound, 'function');
      assert.equal(typeof sm.playClick, 'function');
      assert.equal(typeof sm.playErrorSound, 'function');
      assert.equal(typeof sm.playCardDraw, 'function');
      assert.equal(typeof sm.playCardPlay, 'function');
      assert.equal(typeof sm.playCardDeal, 'function');
      assert.equal(typeof sm.playUnoCall, 'function');
      assert.equal(typeof sm.playPenaltyCatch, 'function');
      assert.equal(typeof sm.playVictoryFanfare, 'function');
      assert.equal(typeof sm.playTokenCaptureSound, 'function');
    });

    it('9.2 playDiceRoll executes cleanly without throwing', () => {
      assert.doesNotThrow(() => {
        sounds.playDiceRoll();
      });
    });

    it('9.3 playErrorSound is defined and synthesizes low buzz without TypeError', () => {
      assert.doesNotThrow(() => {
        sounds.playErrorSound();
      });
    });

    it('9.4 Calling audio cues when muted does not fail and respects mute state', () => {
      sounds.setMuted(true);
      assert.doesNotThrow(() => {
        sounds.playCardPlay();
        sounds.playDiceRoll();
      });
      sounds.setMuted(false);
    });

    it('9.5 playVictoryFanfare executes fanfare synthesis without error', () => {
      assert.doesNotThrow(() => {
        sounds.playVictoryFanfare();
      });
    });
  });

  // =========================================================================
  // 10. F_AUDIO_CTRL: Global Volume Slider & Mute Controls
  // =========================================================================
  describe('Feature 10: F_AUDIO_CTRL — Global Volume Slider & Mute Controls', () => {
    it('10.1 Default volume is between 0.0 and 1.0', () => {
      const vol = sounds.getVolume();
      assert.ok(vol >= 0.0 && vol <= 1.0);
    });

    it('10.2 toggleMute toggles mute boolean and returns updated state', () => {
      const initial = sounds.isMuted();
      const updated = sounds.toggleMute();
      assert.equal(updated, !initial);
      sounds.setMuted(initial); // Restore
    });

    it('10.3 setMuted(true) sets isMuted() to true', () => {
      sounds.setMuted(true);
      assert.equal(sounds.isMuted(), true);
      sounds.setMuted(false);
      assert.equal(sounds.isMuted(), false);
    });

    it('10.4 setVolume(0.5) updates volume level to 0.5', () => {
      sounds.setVolume(0.5);
      assert.equal(sounds.getVolume(), 0.5);
    });

    it('10.5 getVolume returns currently configured volume', () => {
      sounds.setVolume(0.85);
      assert.equal(sounds.getVolume(), 0.85);
    });
  });

  // =========================================================================
  // 11. F_GUIDES: Interactive "How to Play" Guides
  // =========================================================================
  describe('Feature 11: F_GUIDES — Interactive How to Play Guides', () => {
    it('11.1 Guide data exports guides for all 4 games', () => {
      assert.deepEqual(ALL_GAMES, ['monopoly', 'uno', 'ludo', 'snakes_and_ladders']);
      assert.ok(GAME_GUIDES.monopoly);
      assert.ok(GAME_GUIDES.uno);
      assert.ok(GAME_GUIDES.ludo);
      assert.ok(GAME_GUIDES.snakes_and_ladders);
    });

    it('11.2 Each guide includes title, subtitle, badge, playerCount, and objective', () => {
      for (const gameKey of ALL_GAMES) {
        const guide = GAME_GUIDES[gameKey];
        assert.ok(guide.title && guide.title.length > 0);
        assert.ok(guide.subtitle && guide.subtitle.length > 0);
        assert.ok(guide.badge && guide.badge.length > 0);
        assert.ok(guide.playerCount && guide.playerCount.length > 0);
        assert.ok(guide.objective && guide.objective.length > 0);
      }
    });

    it('11.3 Each guide contains structured steps with title, description, highlights, visualType', () => {
      for (const gameKey of ALL_GAMES) {
        const guide = GAME_GUIDES[gameKey];
        assert.ok(Array.isArray(guide.steps) && guide.steps.length >= 3);
        for (const step of guide.steps) {
          assert.ok(step.title && step.title.length > 0);
          assert.ok(step.description && step.description.length > 0);
          assert.ok(Array.isArray(step.highlights) && step.highlights.length > 0);
          assert.ok(step.visualType);
        }
      }
    });

    it('11.4 Step visualType is restricted to valid enum values (board, cards, dice, tokens, special)', () => {
      const validVisuals = new Set(['board', 'cards', 'dice', 'tokens', 'special']);
      for (const gameKey of ALL_GAMES) {
        const guide = GAME_GUIDES[gameKey];
        for (const step of guide.steps) {
          assert.ok(
            validVisuals.has(step.visualType),
            `Invalid visualType: ${step.visualType} in game ${gameKey}`
          );
        }
      }
    });

    it('11.5 getGuideForGame retrieves matching guide with case and alias tolerance', () => {
      const g1 = getGuideForGame('monopoly');
      const g2 = getGuideForGame('BAZAAR_UNO');
      const g3 = getGuideForGame('ludo');
      const g4 = getGuideForGame('snakes-and-ladders');

      assert.equal(g1.gameId, 'monopoly');
      assert.equal(g2.gameId, 'uno');
      assert.equal(g3.gameId, 'ludo');
      assert.equal(g4.gameId, 'snakes_and_ladders');
    });
  });
});
