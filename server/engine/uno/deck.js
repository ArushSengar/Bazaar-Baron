import { UNO_COLORS, UNO_CARD_TYPES } from './constants.js';

/**
 * Generates the official 108-card UNO deck:
 * - 19 Red cards: 0 (x1), 1-9 (x2)
 * - 19 Blue cards: 0 (x1), 1-9 (x2)
 * - 19 Green cards: 0 (x1), 1-9 (x2)
 * - 19 Yellow cards: 0 (x1), 1-9 (x2)
 * - 8 Skip cards (2 each color)
 * - 8 Reverse cards (2 each color)
 * - 8 Draw Two (+2) cards (2 each color)
 * - 4 Wild cards
 * - 4 Wild Draw Four (+4) cards
 */
export function createUnoDeck() {
  const deck = [];
  let idCounter = 1;

  for (const color of UNO_COLORS) {
    // Number 0 (1 per color)
    deck.push({
      id: `card_${idCounter++}`,
      color,
      type: UNO_CARD_TYPES.NUMBER,
      value: 0,
      scoreValue: 0
    });

    // Numbers 1 through 9 (2 per color)
    for (let num = 1; num <= 9; num++) {
      for (let i = 0; i < 2; i++) {
        deck.push({
          id: `card_${idCounter++}`,
          color,
          type: UNO_CARD_TYPES.NUMBER,
          value: num,
          scoreValue: num
        });
      }
    }

    // Action cards: Skip, Reverse, Draw Two (2 each per color)
    for (let i = 0; i < 2; i++) {
      deck.push({
        id: `card_${idCounter++}`,
        color,
        type: UNO_CARD_TYPES.SKIP,
        value: 'skip',
        scoreValue: 20
      });
      deck.push({
        id: `card_${idCounter++}`,
        color,
        type: UNO_CARD_TYPES.REVERSE,
        value: 'reverse',
        scoreValue: 20
      });
      deck.push({
        id: `card_${idCounter++}`,
        color,
        type: UNO_CARD_TYPES.DRAW2,
        value: '+2',
        scoreValue: 20
      });
    }
  }

  // 4 Wild cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${idCounter++}`,
      color: 'wild',
      type: UNO_CARD_TYPES.WILD,
      value: 'wild',
      scoreValue: 50
    });
  }

  // 4 Wild Draw Four cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `card_${idCounter++}`,
      color: 'wild',
      type: UNO_CARD_TYPES.WILD4,
      value: '+4',
      scoreValue: 50
    });
  }

  return shuffleDeck(deck);
}

/**
 * Fisher-Yates array shuffle.
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
