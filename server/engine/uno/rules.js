import { UNO_CARD_TYPES } from './constants.js';

/**
 * Determines whether a card can be legally played on top of the discard pile.
 */
export function canPlayUnoCard(card, topCard, activeColor) {
  if (!card || !topCard) return false;

  // Wild cards can always be played
  if (card.color === 'wild' || card.type === UNO_CARD_TYPES.WILD || card.type === UNO_CARD_TYPES.WILD4) {
    return true;
  }

  // Current active color matches (e.g. after a Wild or regular play)
  const targetColor = activeColor || topCard.color;
  if (card.color === targetColor) {
    return true;
  }

  // Numbers match
  if (card.type === UNO_CARD_TYPES.NUMBER && topCard.type === UNO_CARD_TYPES.NUMBER && card.value === topCard.value) {
    return true;
  }

  // Action symbols match (e.g. Skip on Skip, Reverse on Reverse, Draw 2 on Draw 2)
  if (card.type !== UNO_CARD_TYPES.NUMBER && card.type === topCard.type) {
    return true;
  }

  return false;
}

/**
 * Sum score values of all cards in a player's hand.
 */
export function calculateUnoHandScore(hand) {
  return hand.reduce((total, card) => total + (card.scoreValue || 0), 0);
}
