import { UNO_CARD_TYPES } from './unoConstants.js';

export function canPlayUnoCard(card, topCard, activeColor) {
  if (!card || !topCard) return false;

  if (card.color === 'wild' || card.type === UNO_CARD_TYPES.WILD || card.type === UNO_CARD_TYPES.WILD4) {
    return true;
  }

  const targetColor = activeColor || topCard.color;
  if (card.color === targetColor) {
    return true;
  }

  if (card.type === UNO_CARD_TYPES.NUMBER && topCard.type === UNO_CARD_TYPES.NUMBER && card.value === topCard.value) {
    return true;
  }

  if (card.type !== UNO_CARD_TYPES.NUMBER && card.type === topCard.type) {
    return true;
  }

  return false;
}
