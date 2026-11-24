import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRoom, addBotPlayer, rooms, socketMap } from '../rooms.js';
import { unoReducer } from '../engine/uno/reducer.js';
import { UNO_PHASES } from '../engine/uno/constants.js';

test('UNO Integration: Room creation, bot addition, and game start', () => {
  const mockHostSocket = {
    id: 'sock_uno_host',
    join: () => {}
  };

  const createRes = createRoom(mockHostSocket, {
    name: 'Aarav Host',
    color: '#EA3223',
    avatar: '👳',
    gameType: 'uno'
  });

  assert.equal(createRes.success, true);
  const room = rooms.get(createRes.roomCode);
  assert.equal(room.gameState.gameType, 'uno');
  assert.equal(room.gameState.phase, UNO_PHASES.LOBBY);

  const mockIo = {
    to: () => ({ emit: () => {} })
  };

  // Add 2 AI bots
  const bot1 = addBotPlayer(mockHostSocket, { name: 'Priya (AI)', avatar: '👩‍💼' }, mockIo);
  const bot2 = addBotPlayer(mockHostSocket, { name: 'Kabir (AI)', avatar: '🧔' }, mockIo);
  assert.equal(bot1.success, true);
  assert.equal(bot2.success, true);
  assert.equal(room.gameState.players.length, 3);

  // Start UNO game
  let state = unoReducer(room.gameState, { type: 'START_GAME' });
  assert.equal(state.phase, UNO_PHASES.PLAYING);
  assert.equal(state.players[0].cards.length, 7);
  assert.equal(state.players[1].cards.length, 7);
  assert.equal(state.players[2].cards.length, 7);
  assert.ok(state.discardPile.length >= 1);
  assert.ok(state.activeColor);
});
