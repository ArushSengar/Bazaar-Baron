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
import { getGuideForGame } from '../../../client/src/data/guides.js';

describe('Tier 4: Comprehensive Application Scenarios (6 Full Playflows)', () => {
  let envPolyfill;

  before(() => {
    envPolyfill = mockBrowserEnvironment();
  });

  after(() => {
    if (envPolyfill) envPolyfill.restore();
  });

  // =========================================================================
  // Scenario 1: Complete Bazaar Baron Match
  // =========================================================================
  it('Scenario 1: Complete Bazaar Baron match from start to bankruptcy and victory declaration', async () => {
    let state = createInitialGameState('SCN1', { id: 'p1', name: 'Sethji' });
    state.players.push({
      id: 'p2',
      token: 'tok_p2',
      name: 'Raja',
      color: 'blue',
      avatar: '👳',
      cash: 1500,
      position: 0,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
      connected: true,
      isHost: false
    });
    state.playerOrder = ['p1', 'p2'];
    state.phase = 'LOBBY';

    // 1. Host starts game
    state = gameReducer(state, { type: 'START_GAME', playerId: 'p1' });
    assert.equal(state.phase, 'PLAYING');
    assert.equal(state.turnIndex, 0);

    // 2. Sethji rolls [1, 2] = 3 -> lands on tile 3 (Delhi Daryaganj, cost 60)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });
    assert.equal(state.players[0].position, 3);
    assert.equal(state.step, 'AWAITING_BUY');

    // 3. Sethji buys property
    state = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p1' });
    assert.equal(state.properties['3'].ownerId, 'p1');
    assert.equal(state.players[0].cash, 1440);
    assert.equal(state.step, 'TURN_END');

    // 4. Sethji ends turn -> turnIndex rotates to Raja (1)
    state = gameReducer(state, { type: 'END_TURN', playerId: 'p1' });
    assert.equal(state.turnIndex, 1);
    assert.equal(state.step, 'INITIAL');

    // 5. Raja rolls [2, 4] = 6 -> lands on tile 6 (Delhi Chandni Chowk, cost 100)
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p2', dice: [2, 4] });
    assert.equal(state.players[1].position, 6);
    state = gameReducer(state, { type: 'BUY_PROPERTY', playerId: 'p2' });
    assert.equal(state.properties['6'].ownerId, 'p2');
    state = gameReducer(state, { type: 'END_TURN', playerId: 'p2' });
    assert.equal(state.turnIndex, 0);

    // 6. Sethji rolls [1, 2] = 3 (from 3 to 6) -> lands on Raja's property and pays base rent ₹6
    state = gameReducer(state, { type: 'ROLL_DICE', playerId: 'p1', dice: [1, 2] });
    assert.equal(state.players[0].position, 6);
    assert.equal(state.players[0].cash, 1434); // 1440 - 6
    assert.equal(state.players[1].cash, 1406); // 1500 - 100 + 6

    // 7. Resolving game to victory: Sethji declares bankruptcy -> Raja wins!
    state = gameReducer(state, { type: 'BANKRUPT', playerId: 'p1' });
    assert.equal(state.players[0].bankrupt, true);
    assert.equal(state.phase, 'GAME_OVER');
    assert.equal(state.winnerId, 'p2');

    sounds.playVictoryFanfare();
  });

  // =========================================================================
  // Scenario 2: Complete Bazaar UNO Match
  // =========================================================================
  it('Scenario 2: Complete Bazaar UNO 3-player match with action cards, UNO shout, and victory fanfare', async () => {
    let state = createInitialUnoState('SCN2', { id: 'p1', name: 'Human' });
    state.players.push(
      { id: 'b1', name: 'Bot1 (AI)', isBot: true, cards: [], score: 0, calledUno: false, connected: true },
      { id: 'b2', name: 'Bot2 (AI)', isBot: true, cards: [], score: 0, calledUno: false, connected: true }
    );
    state.playerOrder = ['p1', 'b1', 'b2'];

    // 1. Start match
    state = unoReducer(state, { type: 'START_GAME' });
    assert.equal(state.phase, 'PLAYING');
    assert.equal(state.players[0].cards.length, 7);

    // 2. Setup deterministic end-game scenario
    state.turnIndex = 0;
    state.activeColor = 'red';
    state.discardPile = [{ id: 'd0', color: 'red', value: 5, type: 'number' }];
    state.players[0].cards = [
      { id: 'skip_card', color: 'red', type: 'skip' },
      { id: 'wild_card', color: 'wild', type: 'wild' },
      { id: 'final_card', color: 'yellow', value: 9, type: 'number' }
    ];
    state.players[1].cards = [{ id: 'b1_c', color: 'blue', value: 1, type: 'number' }];
    state.players[2].cards = [{ id: 'b2_c', color: 'green', value: 2, type: 'number' }];

    // 3. Human plays Skip card -> Skips Bot 1, advances to Bot 2 (turnIndex: 2)
    state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'skip_card' });
    assert.equal(state.turnIndex, 2);
    sounds.playCardPlay();

    // 4. Bot 2 cannot match red 5, draws card
    state.deck = [{ id: 'b2_draw', color: 'green', value: 8, type: 'number' }];
    state = unoReducer(state, { type: 'DRAW_CARD', playerId: 'b2' });
    assert.equal(state.turnIndex, 0); // Advances back to Human

    // 5. Human plays Wild card, chooses yellow, shouts UNO (has 1 card remaining)
    state = unoReducer(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'wild_card',
      chosenColor: 'yellow',
      calledUno: true
    });
    assert.equal(state.activeColor, 'yellow');
    assert.equal(state.players[0].cards.length, 1);
    assert.equal(state.players[0].calledUno, true);
    sounds.playUnoCall();

    // 6. Bot 1 draws card on their turn
    state.deck = [{ id: 'b1_draw', color: 'blue', value: 6, type: 'number' }];
    state = unoReducer(state, { type: 'DRAW_CARD', playerId: 'b1' });
    // Bot 2 draws card on their turn
    state.deck = [{ id: 'b2_draw2', color: 'blue', value: 7, type: 'number' }];
    state = unoReducer(state, { type: 'DRAW_CARD', playerId: 'b2' });

    // 7. Human plays final yellow 9 card -> Empties hand, wins round/match!
    assert.equal(state.turnIndex, 0);
    state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'final_card' });
    assert.equal(state.players[0].cards.length, 0);
    assert.ok(state.phase === 'ROUND_OVER' || state.phase === 'GAME_OVER');

    sounds.playVictoryFanfare();
  });

  // =========================================================================
  // Scenario 3: Complete Bazaar Ludo 4-Player Match
  // =========================================================================
  it('Scenario 3: Complete Bazaar Ludo match with yard exit, track race, capture, and home arrival', async () => {
    let state = createInitialLudoState('SCN3', { id: 'p1', name: 'Arush', color: 'red' });
    state.players.push(
      { id: 'b1', name: 'Bot1', color: 'green', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null },
      { id: 'b2', name: 'Bot2', color: 'yellow', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null },
      { id: 'b3', name: 'Bot3', color: 'blue', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null }
    );
    state.playerOrder = ['p1', 'b1', 'b2', 'b3'];
    state.phase = 'PLAYING';
    state.turnIndex = 0;

    // 1. Arush rolls 6, exits yard
    state = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
    state = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(state.players[0].tokens[0].state, 'track');
    assert.equal(state.players[0].tokens[0].position, 0);

    // 2. Bonus roll on 6: rolls 4, advances on track
    state = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
    state = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(state.players[0].tokens[0].position, 4);

    // 3. Captures Bot 1 token on track tile 7
    state.players[1].tokens[0] = { id: 0, state: 'track', position: 7, step: 20 };
    state.turnIndex = 0;
    state.hasRolled = false;
    state = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
    state = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(state.players[0].tokens[0].position, 7);
    assert.equal(state.players[1].tokens[0].state, 'base');
    sounds.playTokenCaptureSound();

    // 4. Token reaches home stretch at step 56 (needs exact 1 to reach Home 57)
    state.players[0].tokens[0] = { id: 0, state: 'home_stretch', position: 4, step: 56 };
    state.turnIndex = 0;
    state.hasRolled = false;

    // 5. Rolls exact 1 to reach Home
    state = ludoReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 1 });
    state = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(state.players[0].tokens[0].state, 'home');
    assert.equal(state.players[0].completedTokens, 1);

    sounds.playVictoryFanfare();
  });

  // =========================================================================
  // Scenario 4: Complete Snakes & Ladders Match
  // =========================================================================
  it('Scenario 4: Complete Snakes & Ladders match navigating ladders, snakes, and exact tile 100 win', async () => {
    let state = createInitialSnakesState('SCN4', { id: 'p1', name: 'Arush' });
    state.players.push({ id: 'p2', name: 'Rohan', color: '#3B82F6', avatar: '🎲', position: 0, isHost: false, isBot: false, connected: true });
    state.playerOrder = ['p1', 'p2'];
    state.phase = 'PLAYING';
    state.turnIndex = 0;

    // 1. P1 rolls 4 -> Lands on ladder at 4, climbs to 14
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
    assert.equal(state.players[0].position, 14);
    assert.equal(state.lastMove.ladder, true);
    assert.equal(state.turnIndex, 1);

    // 2. P2 rolls 3 -> Position 3
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p2', forcedDice: 3 });
    assert.equal(state.players[1].position, 3);
    assert.equal(state.turnIndex, 0);

    // 3. P1 advances and lands on snake head 17 -> slides to 7
    state.players[0].position = 14;
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 3 });
    assert.equal(state.players[0].position, 7);
    assert.equal(state.lastMove.snake, true);

    // 4. Endgame: P1 reaches 98, needs exact roll of 2
    state.players[0].position = 98;
    state.turnIndex = 0;

    // First attempt: overshoots with 4 (98 + 4 = 102 > 100) -> stays at 98
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 4 });
    assert.equal(state.players[0].position, 98);
    assert.equal(state.lastMove.overshoot, true);

    // P2 takes turn
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p2', forcedDice: 1 });

    // P1 rolls exact 2 -> lands on 100, wins game!
    state = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 2 });
    assert.equal(state.players[0].position, 100);
    assert.equal(state.phase, 'GAME_OVER');
    assert.equal(state.winnerId, 'p1');

    sounds.playVictoryFanfare();
  });

  // =========================================================================
  // Scenario 5: Multi-Game Arcade Tournament
  // =========================================================================
  it('Scenario 5: Multi-Game Arcade Tournament spanning rules guides, room creation, and sequential gameplay', async () => {
    // 1. Inspect Ludo Guide before playing
    const ludoGuide = getGuideForGame('ludo');
    assert.equal(ludoGuide.title, 'Bazaar Ludo');
    assert.ok(ludoGuide.steps.length >= 4);

    // 2. Play Ludo Match
    const ludoRoom = await setupTestRoom({ gameType: 'ludo', hostName: 'Gamer' });
    assert.equal(ludoRoom.createRes.gameState.gameType, 'ludo');
    await ludoRoom.teardown();

    // 3. Inspect UNO Guide before switching games
    const unoGuide = getGuideForGame('uno');
    assert.equal(unoGuide.title, 'Bazaar UNO');
    assert.ok(unoGuide.steps.length >= 4);

    // 4. Host starts UNO tournament room with bots
    const unoRoom = await setupTestRoom({ gameType: 'uno', hostName: 'Gamer', botCount: 2 });
    assert.equal(unoRoom.createRes.gameState.gameType, 'uno');

    // Start UNO game
    const playingPromise = unoRoom.host.waitForState((s) => s.phase === 'PLAYING');
    const startRes = await unoRoom.host.emitAsync('start_game');
    assert.equal(startRes.success, true);
    const updatedState = await playingPromise;
    assert.equal(updatedState.phase, 'PLAYING');

    await unoRoom.teardown();
  });

  // =========================================================================
  // Scenario 6: High-Stress Network Resilience & Concurrency Session
  // =========================================================================
  it('Scenario 6: High-Stress Network Session with 3 parallel rooms, concurrent packets, and disconnect/reconnect', async () => {
    const serverInstance = await startTestServer();

    // Create 3 parallel clients in 3 different rooms
    const c1 = await createTestClient(serverInstance.url);
    const c2 = await createTestClient(serverInstance.url);
    const c3 = await createTestClient(serverInstance.url);

    const r1 = await c1.emitAsync('create_room', { name: 'Player1', gameType: 'monopoly' });
    const r2 = await c2.emitAsync('create_room', { name: 'Player2', gameType: 'uno' });
    const r3 = await c3.emitAsync('create_room', { name: 'Player3', gameType: 'snakes_and_ladders' });

    // Blast concurrent intent updates
    const updates = await Promise.all([
      c1.emitAsync('set_avatar', { avatar: '🦅' }),
      c2.emitAsync('set_avatar', { avatar: '🐯' }),
      c3.emitAsync('set_avatar', { avatar: '🦊' }),
      c1.emitAsync('set_color', { color: 'amber' }),
      c2.emitAsync('set_color', { color: 'blue' }),
      c3.emitAsync('set_color', { color: 'green' })
    ]);

    assert.ok(updates.every((u) => u.success === true));

    // Simulate sudden client 1 disconnect
    c1.disconnect();

    // Reconnect client 1 with valid token
    const reconnectClient = await createTestClient(serverInstance.url);
    const reconRes = await reconnectClient.emitAsync('join_room', {
      roomCode: r1.roomCode,
      playerToken: r1.playerToken
    });

    assert.equal(reconRes.success, true);
    assert.equal(reconRes.reconnected, true);
    assert.equal(reconRes.gameState.players[0].avatar, '🦅');

    // Clean teardown
    reconnectClient.disconnect();
    c2.disconnect();
    c3.disconnect();
    await serverInstance.close();
  });
});
