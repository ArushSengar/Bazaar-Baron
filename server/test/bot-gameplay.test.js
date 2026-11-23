import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRoom, addBotPlayer, rooms, socketMap } from '../rooms.js';
import { gameReducer } from '../engine/reducer.js';
import { createInitialGameState } from '../engine/state.js';
import { GAME_PHASES, TURN_STEPS } from '../engine/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const boardData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/board.json'), 'utf8'));

test('AI Bot Integration: Host can add bots with diverse avatars in lobby', () => {
  const mockHostSocket = {
    id: 'sock_host_1',
    join: () => {}
  };

  const createRes = createRoom(mockHostSocket, { name: 'Aarav Host', color: 'red', avatar: '👳' });
  assert.equal(createRes.success, true);
  const roomCode = createRes.roomCode;
  const room = rooms.get(roomCode);

  assert.equal(room.gameState.players.length, 1);
  assert.equal(room.gameState.players[0].isHost, true);

  // Mock IO emitter
  const mockIo = {
    to: () => ({ emit: () => {} })
  };

  // Add 1st Bot (Female: Priya)
  const botRes1 = addBotPlayer(mockHostSocket, { name: 'Priya (AI)', avatar: '👩‍💼' }, mockIo);
  assert.equal(botRes1.success, true);
  assert.equal(botRes1.bot.name, 'Priya (AI)');
  assert.equal(botRes1.bot.isBot, true);
  assert.equal(botRes1.bot.avatar, '👩‍💼');

  // Add 2nd Bot (Female: Rani)
  const botRes2 = addBotPlayer(mockHostSocket, { name: 'Rani (AI)', avatar: '👸' }, mockIo);
  assert.equal(botRes2.success, true);
  assert.equal(botRes2.bot.name, 'Rani (AI)');
  assert.equal(botRes2.bot.isBot, true);
  assert.equal(botRes2.bot.avatar, '👸');

  // Add 3rd Bot (Male: Kabir)
  const botRes3 = addBotPlayer(mockHostSocket, { name: 'Kabir (AI)', avatar: '👳' }, mockIo);
  assert.equal(botRes3.success, true);

  assert.equal(room.gameState.players.length, 4);
  assert.equal(room.gameState.playerOrder.length, 4);

  // Cannot add more than 6 players total
  addBotPlayer(mockHostSocket, { name: 'Bot 5' }, mockIo);
  addBotPlayer(mockHostSocket, { name: 'Bot 6' }, mockIo);
  assert.equal(room.gameState.players.length, 6);

  const overflowRes = addBotPlayer(mockHostSocket, { name: 'Bot 7' }, mockIo);
  assert.equal(overflowRes.success, false);
  assert.match(overflowRes.error, /full/i);
});

test('AI Bot Turn Execution: Pure reducer handles bot actions identically to human actions', () => {
  const mockHostSocket = {
    id: 'sock_host_2',
    join: () => {}
  };

  const createRes = createRoom(mockHostSocket, { name: 'Vikram', color: 'blue' });
  const room = rooms.get(createRes.roomCode);

  const mockIo = {
    to: () => ({ emit: () => {} })
  };

  const botRes = addBotPlayer(mockHostSocket, { name: 'Priya (AI)', color: 'pink' }, mockIo);
  assert.equal(botRes.success, true);

  // Start Game
  let state = gameReducer(room.gameState, { type: 'START_GAME', playerId: room.gameState.players[0].id });
  assert.equal(state.phase, GAME_PHASES.PLAYING);

  // Locate the bot player
  const bot = state.players.find(p => p.isBot);
  assert.ok(bot);

  // Verify pure reducer action: Roll dice for bot when active
  state.turnIndex = state.playerOrder.indexOf(bot.id);
  state.step = TURN_STEPS.INITIAL;

  state = gameReducer(state, { type: 'ROLL_DICE', playerId: bot.id });
  assert.ok(state.dice);
  assert.ok(state.dice.length === 2);
  assert.ok(state.step !== TURN_STEPS.INITIAL);

  // If landed on an unowned property, bot can buy
  const currentBot = state.players.find(p => p.id === bot.id);
  const landedTile = boardData[currentBot.position];
  if (state.step === TURN_STEPS.AWAITING_BUY) {
    const prevCash = currentBot.cash;
    state = gameReducer(state, { type: 'BUY_PROPERTY', playerId: bot.id });
    const updatedBot = state.players.find(p => p.id === bot.id);
    assert.equal(updatedBot.cash, prevCash - landedTile.cost);
    assert.equal(state.properties[landedTile.id].ownerId, bot.id);
    assert.equal(state.step, TURN_STEPS.TURN_END);
  }

  // End bot turn
  if (state.step === TURN_STEPS.TURN_END) {
    const prevTurn = state.turnIndex;
    state = gameReducer(state, { type: 'END_TURN', playerId: bot.id });
    assert.equal(state.turnIndex, (prevTurn + 1) % state.playerOrder.length);
  }
});

test('AI Bot Auction & Jail Behavior: Bot bids proportionally and pays jail fines', () => {
  let state = createInitialGameState('BOTS', { id: 'p1', name: 'Human', color: 'red' });
  state.phase = GAME_PHASES.PLAYING;
  state.step = TURN_STEPS.AUCTION;
  state.playerOrder = ['p1', 'bot1'];
  state.players.push({
    id: 'bot1',
    name: 'Priya (AI)',
    color: 'pink',
    cash: 1200,
    position: 10,
    inJail: true,
    jailTurns: 0,
    bankrupt: false,
    isBot: true
  });
  state.auction = {
    tileId: 1, // Chandni Chowk, cost 60
    currentBid: 30,
    highestBidderId: 'p1',
    activeBidders: ['p1', 'bot1']
  };

  // Bot bids 40 on a 60-cost property
  state = gameReducer(state, { type: 'AUCTION_BID', amount: 40, playerId: 'bot1' });
  assert.equal(state.auction.currentBid, 40);
  assert.equal(state.auction.highestBidderId, 'bot1');

  // Human passes, leaving bot as winner
  state = gameReducer(state, { type: 'AUCTION_PASS', playerId: 'p1' });
  // Auction resolves, bot gets property for 40
  assert.equal(state.properties[1].ownerId, 'bot1');
  const bot = state.players.find(p => p.id === 'bot1');
  assert.equal(bot.cash, 1160);

  // Test Jail Bailout
  state.step = TURN_STEPS.INITIAL;
  state.turnIndex = 1; // bot's turn
  assert.equal(bot.inJail, true);

  state = gameReducer(state, { type: 'PAY_JAIL_FINE', playerId: 'bot1' });
  const freedBot = state.players.find(p => p.id === 'bot1');
  assert.equal(freedBot.inJail, false);
  assert.equal(freedBot.cash, 1110);
});
