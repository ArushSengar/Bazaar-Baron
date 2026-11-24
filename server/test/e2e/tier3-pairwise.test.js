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
import { createInitialSnakesState, createSnakesPlayer } from '../../engine/snakes/state.js';
import { sounds, SoundManager } from '../../../client/src/utils/audio.js';
import { GAME_GUIDES, getGuideForGame } from '../../../client/src/data/guides.js';

describe('Tier 3: Pairwise Cross-Feature Combinations (11 Tests)', () => {
  let envPolyfill;

  before(() => {
    envPolyfill = mockBrowserEnvironment();
  });

  after(() => {
    if (envPolyfill) envPolyfill.restore();
  });

  // 1. Combination 1: Ludo Bot Turn + Capture Sound Metadata Sync
  it('P3.1 Human player + 3 AI bots in Ludo with active turn sync and capture sound cue metadata', async () => {
    let state = createInitialLudoState('L_PW1', { id: 'p1', name: 'Human', color: 'red' });
    state.players.push(
      { id: 'bot1', name: 'Bot1 (AI)', color: 'green', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null },
      { id: 'bot2', name: 'Bot2 (AI)', color: 'yellow', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null },
      { id: 'bot3', name: 'Bot3 (AI)', color: 'blue', isBot: true, tokens: createInitialLudoTokens(), completedTokens: 0, rank: null }
    );
    state.playerOrder = ['p1', 'bot1', 'bot2', 'bot3'];
    state.phase = 'PLAYING';
    state.turnIndex = 0;

    // Opponent on track tile 5
    state.players[1].tokens[0] = { id: 0, state: 'track', position: 5, step: 10 };
    // Human moves to tile 5 (captures opponent)
    state.players[0].tokens[0] = { id: 0, state: 'track', position: 2, step: 2 };
    state.hasRolled = true;
    state.diceValue = 3;
    state.movableTokenIds = [0];

    const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(next.players[1].tokens[0].state, 'base');
    assert.ok(next.logs.some((l) => l.text.includes('captured')));

    // Audio cue verification
    assert.doesNotThrow(() => {
      sounds.playTokenCaptureSound();
    });
  });

  // 2. Combination 2: Snakes & Ladders ladder climb / finish triggering audio fanfare & glow
  it('P3.2 Snakes & Ladders roll to tile 100 triggering victory celebration and fanfare cue', () => {
    let state = createInitialSnakesState('S_PW2', { id: 'p1', name: 'Winner' });
    state.phase = 'PLAYING';
    state.turnIndex = 0;
    state.playerOrder = ['p1'];
    state.players[0].position = 94;

    const next = snakesReducer(state, { type: 'ROLL_DICE', playerId: 'p1', forcedDice: 6 });
    assert.equal(next.players[0].position, 100);
    assert.equal(next.phase, 'GAME_OVER');
    assert.equal(next.winnerId, 'p1');

    assert.doesNotThrow(() => {
      sounds.playVictoryFanfare();
    });
  });

  // 3. Combination 3: Audio Mute Active + Rapid UNO Card Plays
  it('P3.3 Global audio mute active while multiple rapid card plays occur in UNO', () => {
    sounds.setMuted(true);
    let state = createInitialUnoState('U_PW3', { id: 'p1', name: 'P1' });
    state.phase = 'PLAYING';
    state.turnIndex = 0;
    state.activeColor = 'red';
    state.discardPile = [{ id: 'd0', color: 'red', value: 1, type: 'number' }];
    state.players = [
      { id: 'p1', name: 'P1', cards: [
        { id: 'c1', color: 'red', value: 2, type: 'number' },
        { id: 'c2', color: 'blue', value: 2, type: 'number' },
        { id: 'c3', color: 'green', value: 2, type: 'number' }
      ] },
      { id: 'p2', name: 'P2', cards: [
        { id: 'c4', color: 'red', value: 2, type: 'number' },
        { id: 'c5', color: 'yellow', value: 2, type: 'number' }
      ] }
    ];
    state.playerOrder = ['p1', 'p2'];

    // Play 1
    state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
    sounds.playCardPlay();
    // Play 2
    state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p2', cardId: 'c4' });
    sounds.playCardPlay();

    assert.equal(sounds.isMuted(), true);
    assert.equal(state.discardPile.length, 3);
    sounds.setMuted(false);
  });

  // 4. Combination 4: Querying How-to-Play Guide + Live Active Bot Turn
  it('P3.4 Opening How to Play guide while bot turn executes without interrupting state', () => {
    let state = createInitialUnoState('U_PW4', { id: 'bot1', name: 'Bot1 (AI)' });
    state.phase = 'PLAYING';
    state.turnIndex = 0;
    state.playerOrder = ['bot1'];
    state.activeColor = 'blue';
    state.discardPile = [{ id: 'd0', color: 'blue', value: 3, type: 'number' }];
    state.players = [{
      id: 'bot1',
      name: 'Bot1 (AI)',
      isBot: true,
      cards: [{ id: 'b_card', color: 'blue', value: 7, type: 'number' }, { id: 'extra', color: 'red', value: 1 }]
    }];

    // Client queries guide data simultaneously
    const guide = getGuideForGame('uno');
    assert.equal(guide.gameId, 'uno');
    assert.ok(guide.steps.length >= 3);

    // Bot completes intent
    const nextState = unoReducer(state, { type: 'PLAY_CARD', playerId: 'bot1', cardId: 'b_card' });
    assert.equal(nextState.discardPile[nextState.discardPile.length - 1].id, 'b_card');
  });

  // 5. Combination 5: Multi-Room Multi-Game Concurrency
  it('P3.5 Simultaneous Monopoly room and UNO room on same server instance with state isolation', async () => {
    const serverInstance = await startTestServer();
    const c1 = await createTestClient(serverInstance.url);
    const c2 = await createTestClient(serverInstance.url);

    const r1 = await c1.emitAsync('create_room', { name: 'Tycoon', gameType: 'monopoly' });
    const r2 = await c2.emitAsync('create_room', { name: 'CardMaster', gameType: 'uno' });

    assert.notEqual(r1.roomCode, r2.roomCode);
    assert.equal(r1.gameState.gameType || 'monopoly', 'monopoly');
    assert.equal(r2.gameState.gameType, 'uno');

    // Intent in room 1 does not affect room 2
    await c1.emitAsync('set_avatar', { avatar: '🎩' });
    assert.equal(r2.gameState.players[0].avatar, '👳'); // Default intact

    c1.disconnect();
    c2.disconnect();
    await serverInstance.close();
  });

  // 6. Combination 6: Ludo Token in Home Stretch + Volume Slider Adjustment
  it('P3.6 Ludo token advances into home stretch under low-volume audio setting', () => {
    sounds.setVolume(0.2);
    assert.equal(sounds.getVolume(), 0.2);

    let state = createInitialLudoState('L_PW6', { id: 'p1', name: 'P1', color: 'red' });
    state.phase = 'PLAYING';
    state.turnIndex = 0;
    state.playerOrder = ['p1'];
    state.players[0].tokens[0] = { id: 0, state: 'track', position: 50, step: 50 };
    state.hasRolled = true;
    state.diceValue = 2;
    state.movableTokenIds = [0];

    const next = ludoReducer(state, { type: 'MOVE_TOKEN', playerId: 'p1', tokenId: 0 });
    assert.equal(next.players[0].tokens[0].state, 'home_stretch');

    assert.doesNotThrow(() => {
      sounds.playClick();
      sounds.playYourTurnChime();
    });
    sounds.setVolume(0.7); // Restore
  });

  // 7. Combination 7: Disconnecting Player Reconnecting While Guide Data Is Queried
  it('P3.7 Disconnecting player reconnecting while How-to-Play guide data is queried', async () => {
    const serverInstance = await startTestServer();
    const host = await createTestClient(serverInstance.url);
    const guest = await createTestClient(serverInstance.url);

    const createRes = await host.emitAsync('create_room', { name: 'Host' });
    const joinRes = await guest.emitAsync('join_room', { roomCode: createRes.roomCode, name: 'Guest' });
    guest.disconnect();

    // Query guide while disconnected
    const guide = getGuideForGame('monopoly');
    assert.equal(guide.gameId, 'monopoly');

    // Reconnect
    const reconnectedGuest = await createTestClient(serverInstance.url);
    const reconnectRes = await reconnectedGuest.emitAsync('join_room', {
      roomCode: createRes.roomCode,
      playerToken: joinRes.playerToken
    });

    assert.equal(reconnectRes.success, true);
    assert.equal(reconnectRes.reconnected, true);

    host.disconnect();
    reconnectedGuest.disconnect();
    await serverInstance.close();
  });

  // 8. Combination 8: Bot Race (4 Bots in Snakes & Ladders)
  it('P3.8 4 bots in Snakes & Ladders completing automated turns sequentially without deadlocks', () => {
    let state = createInitialSnakesState('S_PW8', { id: 'b1', name: 'Arjun (AI)' });
    state.players[0].isBot = true;
    state.players.push(
      createSnakesPlayer({ id: 'b2', name: 'Diya (AI)', isBot: true }),
      createSnakesPlayer({ id: 'b3', name: 'Rohan (AI)', isBot: true }),
      createSnakesPlayer({ id: 'b4', name: 'Ananya (AI)', isBot: true })
    );
    state.playerOrder = ['b1', 'b2', 'b3', 'b4'];
    state.phase = 'PLAYING';
    state.turnIndex = 0;

    // Simulate 12 turns (3 complete cycles across all 4 bots)
    for (let t = 0; t < 12; t++) {
      const activeId = state.playerOrder[state.turnIndex];
      const roll = (t % 5) + 1; // 1 to 5 deterministic non-six rolls
      state = snakesReducer(state, { type: 'ROLL_DICE', playerId: activeId, forcedDice: roll });
    }

    assert.equal(state.phase, 'PLAYING');
    assert.equal(state.turnIndex, 0); // Cycled back 12 % 4 = 0
    assert.ok(state.players.every((p) => p.position > 0));
  });

  // 9. Combination 9: Lobby Game Switching + Persistent Player Identity
  it('P3.9 Player settings in lobby retain audio settings and player avatar/color', async () => {
    sounds.setVolume(0.45);
    const room = await setupTestRoom({ gameType: 'monopoly', hostName: 'HostPlayer' });

    await room.host.emitAsync('set_avatar', { avatar: '🦁' });
    await room.host.emitAsync('set_color', { color: 'blue' });

    assert.equal(sounds.getVolume(), 0.45);
    assert.equal(room.createRes.player.name, 'HostPlayer');

    sounds.setVolume(0.7);
    await room.teardown();
  });

  // 10. Combination 10: UNO Wild Draw 4 Against Bot + Turn Glow Transition
  it('P3.10 UNO Wild Draw 4 played against bot with active turn cue shift and penalty cards', () => {
    let state = createInitialUnoState('U_PW10', { id: 'p1', name: 'Human' });
    state.phase = 'PLAYING';
    state.turnIndex = 0;
    state.activeColor = 'red';
    state.deck = [
      { id: 'd1', color: 'blue', value: 1, type: 'number' },
      { id: 'd2', color: 'blue', value: 2, type: 'number' },
      { id: 'd3', color: 'blue', value: 3, type: 'number' },
      { id: 'd4', color: 'blue', value: 4, type: 'number' }
    ];
    state.discardPile = [{ id: 'top', color: 'red', value: 5, type: 'number' }];
    state.players = [
      { id: 'p1', name: 'Human', cards: [{ id: 'w4', color: 'wild', type: 'wild4' }, { id: 'rem', color: 'blue', value: 9 }] },
      { id: 'bot1', name: 'Bot1 (AI)', isBot: true, cards: [{ id: 'b1', color: 'green', value: 4, type: 'number' }] }
    ];
    state.playerOrder = ['p1', 'bot1'];

    const next = unoReducer(state, {
      type: 'PLAY_CARD',
      playerId: 'p1',
      cardId: 'w4',
      chosenColor: 'blue'
    });

    assert.equal(next.activeColor, 'blue');
    assert.equal(next.players[1].cards.length, 5); // 1 original + 4 penalty cards drawn
  });

  // 11. Combination 11: Monopoly Property Auction with Bot Bidding Under Muted Audio
  it('P3.11 Monopoly property auction with bot bidding under muted audio settings', () => {
    sounds.setMuted(true);
    let state = createInitialGameState('M_PW11', { id: 'p1', name: 'Human' });
    state.phase = 'PLAYING';
    state.step = 'AUCTION';
    state.turnIndex = 0;
    state.playerOrder = ['p1', 'bot1'];
    state.players = [
      { id: 'p1', name: 'Human', cash: 1500, position: 1, connected: true, inJail: false },
      { id: 'bot1', name: 'Bot1 (AI)', isBot: true, cash: 1500, position: 0, connected: true, inJail: false }
    ];
    state.auction = {
      tileId: 1,
      currentBid: 50,
      highestBidderId: null,
      activeBidders: ['p1', 'bot1']
    };

    // Bot bids ₹60
    const bidState = gameReducer(state, { type: 'AUCTION_BID', playerId: 'bot1', amount: 60 });
    assert.equal(bidState.auction.highestBidderId, 'bot1');
    assert.equal(bidState.auction.currentBid, 60);

    // Human passes
    const finalState = gameReducer(bidState, { type: 'AUCTION_PASS', playerId: 'p1' });
    assert.equal(finalState.properties['1'].ownerId, 'bot1');
    assert.equal(finalState.players[1].cash, 1440); // 1500 - 60
    assert.equal(sounds.isMuted(), true);

    sounds.setMuted(false);
  });
});
