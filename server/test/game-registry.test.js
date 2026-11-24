import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGame,
  getAllGames,
  isValidGameType,
  normalizeGameType,
  registerGame,
  GAME_REGISTRY
} from '../games/registry.js';
import { createRoom, joinRoom, addBotPlayer, rooms, socketMap } from '../rooms.js';

describe('Game Registry & Multi-Game Integration', () => {
  test('all 4 core games are registered', () => {
    const all = getAllGames();
    assert.equal(all.length, 4);

    const ids = all.map(g => g.id);
    assert.ok(ids.includes('monopoly'));
    assert.ok(ids.includes('uno'));
    assert.ok(ids.includes('ludo'));
    assert.ok(ids.includes('snakes_and_ladders'));
  });

  test('normalizes gameType strings and aliases correctly', () => {
    assert.equal(normalizeGameType('monopoly'), 'monopoly');
    assert.equal(normalizeGameType('baron'), 'monopoly');
    assert.equal(normalizeGameType('BARON'), 'monopoly');
    assert.equal(normalizeGameType('uno'), 'uno');
    assert.equal(normalizeGameType('UNO'), 'uno');
    assert.equal(normalizeGameType('ludo'), 'ludo');
    assert.equal(normalizeGameType('Ludo'), 'ludo');
    assert.equal(normalizeGameType('snakes'), 'snakes_and_ladders');
    assert.equal(normalizeGameType('snakes_and_ladders'), 'snakes_and_ladders');
    assert.equal(normalizeGameType('snakes-and-ladders'), 'snakes_and_ladders');
    assert.equal(normalizeGameType('SNAKES'), 'snakes_and_ladders');
    assert.equal(normalizeGameType(null), 'monopoly');
    assert.equal(normalizeGameType(undefined), 'monopoly');
  });

  test('validates game types accurately', () => {
    assert.equal(isValidGameType('monopoly'), true);
    assert.equal(isValidGameType('uno'), true);
    assert.equal(isValidGameType('ludo'), true);
    assert.equal(isValidGameType('snakes_and_ladders'), true);
    assert.equal(isValidGameType('snakes'), true);
    assert.equal(isValidGameType('baron'), true);
    assert.equal(isValidGameType('poker'), false);
    assert.equal(isValidGameType('chess'), false);
  });

  test('enforces correct player capacity metadata', () => {
    const monopoly = getGame('monopoly');
    assert.equal(monopoly.minPlayers, 2);
    assert.equal(monopoly.maxPlayers, 6);

    const uno = getGame('uno');
    assert.equal(uno.minPlayers, 2);
    assert.equal(uno.maxPlayers, 10);

    const ludo = getGame('ludo');
    assert.equal(ludo.minPlayers, 2);
    assert.equal(ludo.maxPlayers, 4);

    const snakes = getGame('snakes_and_ladders');
    assert.equal(snakes.minPlayers, 2);
    assert.equal(snakes.maxPlayers, 6);
  });

  test('factories instantiate correct states and player objects', () => {
    // 1. Monopoly
    const mono = getGame('monopoly');
    const monoPlayer = mono.createPlayer({ id: 'p1', name: 'MonopolyHost', isHost: true });
    assert.equal(monoPlayer.name, 'MonopolyHost');
    assert.equal(monoPlayer.cash, 1500);
    assert.equal(monoPlayer.position, 0);
    const monoState = mono.createInitialState('ROOM1', monoPlayer);
    assert.equal(monoState.gameType, 'monopoly');
    assert.equal(typeof mono.reducer, 'function');
    assert.equal(typeof mono.runBotTurn, 'function');

    // 2. UNO
    const uno = getGame('uno');
    const unoPlayer = uno.createPlayer({ id: 'p2', name: 'UnoHost', isHost: true });
    assert.equal(unoPlayer.name, 'UnoHost');
    assert.ok(Array.isArray(unoPlayer.cards));
    assert.equal(unoPlayer.score, 0);
    const unoState = uno.createInitialState('ROOM2', unoPlayer);
    assert.equal(unoState.gameType, 'uno');
    assert.equal(typeof uno.reducer, 'function');
    assert.equal(typeof uno.runBotTurn, 'function');

    // 3. Ludo
    const ludo = getGame('ludo');
    const ludoPlayer = ludo.createPlayer({ id: 'p3', name: 'LudoHost', isHost: true });
    assert.equal(ludoPlayer.name, 'LudoHost');
    assert.equal(ludoPlayer.tokens.length, 4);
    assert.equal(ludoPlayer.completedTokens, 0);
    const ludoState = ludo.createInitialState('ROOM3', ludoPlayer);
    assert.equal(ludoState.gameType, 'ludo');
    assert.equal(typeof ludo.reducer, 'function');
    assert.equal(typeof ludo.runBotTurn, 'function');

    // 4. Snakes & Ladders
    const snakes = getGame('snakes_and_ladders');
    const snakesPlayer = snakes.createPlayer({ id: 'p4', name: 'SnakesHost', isHost: true });
    assert.equal(snakesPlayer.name, 'SnakesHost');
    assert.equal(snakesPlayer.position, 0);
    const snakesState = snakes.createInitialState('ROOM4', snakesPlayer);
    assert.equal(snakesState.gameType, 'snakes_and_ladders');
    assert.equal(typeof snakes.reducer, 'function');
    assert.equal(typeof snakes.runBotTurn, 'function');
  });

  test('rooms.js dynamically creates Ludo room and enforces max 4 players', () => {
    const mockSocket = {
      id: 'sock_host_ludo',
      join: () => {}
    };

    const createResult = createRoom(mockSocket, {
      name: 'LudoMaster',
      gameType: 'ludo'
    });

    assert.equal(createResult.success, true);
    assert.equal(createResult.gameState.gameType, 'ludo');
    assert.equal(createResult.gameState.players.length, 1);

    const roomCode = createResult.roomCode;

    // Join 3 more players (reaching 4)
    for (let i = 2; i <= 4; i++) {
      const joinSock = { id: `sock_join_${i}`, join: () => {} };
      const res = joinRoom(joinSock, {
        roomCode,
        name: `LudoP${i}`
      });
      assert.equal(res.success, true);
    }

    const room = rooms.get(roomCode);
    assert.equal(room.gameState.players.length, 4);

    // 5th player should fail
    const fifthSock = { id: 'sock_join_5', join: () => {} };
    const failRes = joinRoom(fifthSock, {
      roomCode,
      name: 'LudoP5'
    });
    assert.equal(failRes.success, false);
    assert.match(failRes.error, /maximum 4 players/);

    // Adding bot should also fail
    const botRes = addBotPlayer(mockSocket, {}, { to: () => ({ emit: () => {} }) });
    assert.equal(botRes.success, false);
    assert.match(botRes.error, /maximum 4 players/);
  });

  test('rooms.js dynamically creates Snakes & Ladders room with bots up to capacity', () => {
    const mockSocket = {
      id: 'sock_host_snakes',
      join: () => {}
    };

    const createResult = createRoom(mockSocket, {
      name: 'SnakesHost',
      gameType: 'snakes_and_ladders'
    });

    assert.equal(createResult.success, true);
    assert.equal(createResult.gameState.gameType, 'snakes_and_ladders');
    const roomCode = createResult.roomCode;

    // Add 5 bots up to 6 players
    for (let i = 2; i <= 6; i++) {
      const botRes = addBotPlayer(mockSocket, {}, { to: () => ({ emit: () => {} }) });
      assert.equal(botRes.success, true);
      assert.equal(botRes.bot.isBot, true);
      assert.equal(botRes.bot.position, 0);
    }

    const room = rooms.get(roomCode);
    assert.equal(room.gameState.players.length, 6);

    // 7th bot should fail
    const failBot = addBotPlayer(mockSocket, {}, { to: () => ({ emit: () => {} }) });
    assert.equal(failBot.success, false);
    assert.match(failBot.error, /maximum 6 players/);
  });
});
