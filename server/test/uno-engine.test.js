import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnoDeck } from '../engine/uno/deck.js';
import { canPlayUnoCard, calculateUnoHandScore } from '../engine/uno/rules.js';
import { unoReducer, createInitialUnoState } from '../engine/uno/reducer.js';
import { UNO_CARD_TYPES, UNO_PHASES, UNO_DIRECTIONS } from '../engine/uno/constants.js';

test('UNO Deck: Standard 108 cards with correct distribution', () => {
  const deck = createUnoDeck();
  assert.equal(deck.length, 108);

  const colors = ['red', 'blue', 'green', 'yellow'];
  for (const c of colors) {
    const colorCards = deck.filter(card => card.color === c);
    assert.equal(colorCards.length, 25); // 1 zero, 18 numbers (1-9 x2), 2 skips, 2 reverses, 2 draw2s
  }

  const wilds = deck.filter(card => card.type === UNO_CARD_TYPES.WILD);
  assert.equal(wilds.length, 4);

  const wild4s = deck.filter(card => card.type === UNO_CARD_TYPES.WILD4);
  assert.equal(wild4s.length, 4);
});

test('UNO Rules: canPlayUnoCard validation', () => {
  const topCard = { color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 5 };

  // Match color
  assert.equal(canPlayUnoCard({ color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 7 }, topCard, 'red'), true);
  // Match number
  assert.equal(canPlayUnoCard({ color: 'blue', type: UNO_CARD_TYPES.NUMBER, value: 5 }, topCard, 'red'), true);
  // Wild card
  assert.equal(canPlayUnoCard({ color: 'wild', type: UNO_CARD_TYPES.WILD, value: 'wild' }, topCard, 'red'), true);
  assert.equal(canPlayUnoCard({ color: 'wild', type: UNO_CARD_TYPES.WILD4, value: '+4' }, topCard, 'red'), true);
  // No match
  assert.equal(canPlayUnoCard({ color: 'green', type: UNO_CARD_TYPES.NUMBER, value: 9 }, topCard, 'red'), false);

  // Active color chosen after wild
  assert.equal(canPlayUnoCard({ color: 'yellow', type: UNO_CARD_TYPES.NUMBER, value: 3 }, { color: 'wild', type: UNO_CARD_TYPES.WILD, value: 'wild' }, 'yellow'), true);
  assert.equal(canPlayUnoCard({ color: 'blue', type: UNO_CARD_TYPES.NUMBER, value: 3 }, { color: 'wild', type: UNO_CARD_TYPES.WILD, value: 'wild' }, 'yellow'), false);
});

test('UNO Reducer: START_GAME deals 7 cards to each player and sets active card', () => {
  const host = { id: 'p1', name: 'Aarav', color: '#EA3223' };
  let state = createInitialUnoState('UN01', host);
  state.players.push({
    id: 'p2',
    name: 'Priya',
    color: '#0066CC',
    cards: [],
    score: 0,
    calledUno: false
  });
  state.playerOrder.push('p2');

  state = unoReducer(state, { type: 'START_GAME' });

  assert.equal(state.phase, UNO_PHASES.PLAYING);
  assert.equal(state.players[0].cards.length, 7);
  assert.equal(state.players[1].cards.length, 7);
  assert.equal(state.discardPile.length >= 1, true);
  assert.ok(state.activeColor);
  assert.equal(state.deck.length, 108 - 14 - 1);
});

test('UNO Reducer: Playing cards and action cards (Skip, Reverse, Draw 2, Wild)', () => {
  let state = {
    roomCode: 'TEST',
    phase: UNO_PHASES.PLAYING,
    direction: UNO_DIRECTIONS.CLOCKWISE,
    turnIndex: 0,
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        cards: [
          { id: 'c1', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 3, scoreValue: 3 },
          { id: 'c_skip', color: 'red', type: UNO_CARD_TYPES.SKIP, value: 'skip', scoreValue: 20 },
          { id: 'c_wild', color: 'wild', type: UNO_CARD_TYPES.WILD, value: 'wild', scoreValue: 50 }
        ],
        calledUno: false
      },
      {
        id: 'p2',
        name: 'Player 2',
        cards: [
          { id: 'c2', color: 'blue', type: UNO_CARD_TYPES.NUMBER, value: 3, scoreValue: 3 }
        ],
        calledUno: false
      },
      {
        id: 'p3',
        name: 'Player 3',
        cards: [
          { id: 'c3', color: 'green', type: UNO_CARD_TYPES.NUMBER, value: 8, scoreValue: 8 }
        ],
        calledUno: false
      }
    ],
    deck: [{ id: 'd1', color: 'yellow', type: UNO_CARD_TYPES.NUMBER, value: 1, scoreValue: 1 }],
    discardPile: [{ id: 'top', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 9, scoreValue: 9 }],
    activeColor: 'red',
    hasDrawnThisTurn: false,
    targetScore: 250,
    winnerId: null,
    logs: []
  };

  // 1. Play regular number card
  state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1' });
  assert.equal(state.turnIndex, 1); // Turn advances to p2
  assert.equal(state.activeColor, 'red');
  assert.equal(state.players[0].cards.length, 2);

  // Set top card to match skip
  state.turnIndex = 0; // force back to p1 for test
  state.discardPile.push({ id: 'top2', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 2 });
  state.activeColor = 'red';

  // 2. Play Skip card
  state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c_skip' });
  assert.equal(state.turnIndex, 2); // p2 was skipped, turn is p3!

  // 3. Play Wild card and choose blue
  state.turnIndex = 0; // force back to p1
  state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c_wild', chosenColor: 'blue' });
  assert.equal(state.activeColor, 'blue');
  // p1 now has 0 cards and wins the round!
  assert.equal(state.phase, UNO_PHASES.ROUND_OVER);
  assert.equal(state.roundWinnerId, 'p1');
  assert.equal(state.players[0].score, 3 + 8); // sum of p2 (3) and p3 (8)
});

test('UNO Reducer: Calling UNO and Catching missed UNO', () => {
  let state = {
    roomCode: 'TEST2',
    phase: UNO_PHASES.PLAYING,
    direction: UNO_DIRECTIONS.CLOCKWISE,
    turnIndex: 0,
    players: [
      {
        id: 'p1',
        name: 'Player 1',
        cards: [
          { id: 'c1', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 4, scoreValue: 4 },
          { id: 'c2', color: 'blue', type: UNO_CARD_TYPES.NUMBER, value: 9, scoreValue: 9 }
        ],
        calledUno: false
      },
      {
        id: 'p2',
        name: 'Player 2',
        cards: [
          { id: 'c3', color: 'green', type: UNO_CARD_TYPES.NUMBER, value: 1, scoreValue: 1 }
        ],
        calledUno: false
      }
    ],
    deck: [
      { id: 'd1', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 1 },
      { id: 'd2', color: 'blue', type: UNO_CARD_TYPES.NUMBER, value: 2 }
    ],
    discardPile: [{ id: 'top', color: 'red', type: UNO_CARD_TYPES.NUMBER, value: 4 }],
    activeColor: 'red',
    hasDrawnThisTurn: false,
    targetScore: 250,
    winnerId: null,
    logs: []
  };

  // p1 plays c1 with 2 cards in hand, leaving 1 card, but DOES NOT call UNO
  state = unoReducer(state, { type: 'PLAY_CARD', playerId: 'p1', cardId: 'c1', calledUno: false });
  assert.equal(state.players[0].cards.length, 1);
  assert.equal(state.players[0].calledUno, false);

  // p2 catches p1!
  state = unoReducer(state, { type: 'CATCH_UNO', playerId: 'p2', targetPlayerId: 'p1' });
  // p1 receives 2 penalty cards
  assert.equal(state.players[0].cards.length, 3);
});
