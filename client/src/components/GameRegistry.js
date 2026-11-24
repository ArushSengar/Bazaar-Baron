import { GameScreen } from './GameScreen';
import { UnoScreen } from './uno/UnoScreen';
import { LudoScreen } from './ludo/LudoScreen';
import { SnakesScreen } from './snakes/SnakesScreen';

export const GAME_REGISTRY = {
  monopoly: {
    id: 'monopoly',
    title: 'Bazaar Baron',
    shortTitle: 'Baron',
    icon: '🕌',
    badge: 'LAN Monopoly',
    minPlayers: 2,
    maxPlayers: 6,
    defaultBotNames: ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)', 'Meera (AI)', 'Vikram (AI)'],
    component: GameScreen,
    guideId: 'monopoly',
    description: 'Classic Indian real estate trading, property monopolies, havelis, and public auctions.',
    accentColor: '#F59E0B'
  },
  uno: {
    id: 'uno',
    title: 'Bazaar UNO',
    shortTitle: 'UNO',
    icon: '🃏',
    badge: 'Card Mayhem',
    minPlayers: 2,
    maxPlayers: 10,
    defaultBotNames: ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)', 'Meera (AI)', 'Vikram (AI)', 'Ananya (AI)', 'Rohan (AI)'],
    component: UnoScreen,
    guideId: 'uno',
    description: 'Fast-paced color & number card matching with Skip, Reverse, Draw Two, Wilds, and UNO calls.',
    accentColor: '#EF4444'
  },
  ludo: {
    id: 'ludo',
    title: 'Bazaar Ludo',
    shortTitle: 'Ludo',
    icon: '🎲',
    badge: '4-Player Tabletop',
    minPlayers: 2,
    maxPlayers: 4,
    defaultBotNames: ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)'],
    component: LudoScreen,
    guideId: 'ludo',
    description: 'Royal cross & circle strategy race with safe star sanctuaries, captures, and 6-roll bonuses.',
    accentColor: '#10B981'
  },
  snakes_and_ladders: {
    id: 'snakes_and_ladders',
    title: 'Snakes & Ladders',
    shortTitle: 'Snakes',
    icon: '🐍',
    badge: 'Roll & Race',
    minPlayers: 2,
    maxPlayers: 6,
    defaultBotNames: ['Arjun (AI)', 'Diya (AI)', 'Rohan (AI)', 'Ananya (AI)', 'Vikram (AI)'],
    component: SnakesScreen,
    guideId: 'snakes_and_ladders',
    description: '100-tile race to the summit, soaring skyward on emerald ladders and dodging venomous snakes.',
    accentColor: '#8B5CF6'
  }
};

/**
 * Normalizes gameType string, handling aliases.
 */
export function normalizeGameType(gameType) {
  if (!gameType || typeof gameType !== 'string') return 'monopoly';
  const lower = gameType.trim().toLowerCase();
  if (lower === 'snakes' || lower === 'snakes_and_ladders' || lower === 'snakes-and-ladders' || lower === 'snakesladders') {
    return 'snakes_and_ladders';
  }
  if (lower === 'baron' || lower === 'monopoly') {
    return 'monopoly';
  }
  return lower;
}

/**
 * Get game configuration by type or alias.
 */
export function getGameConfig(gameType) {
  const normalized = normalizeGameType(gameType);
  return GAME_REGISTRY[normalized] || GAME_REGISTRY.monopoly;
}

/**
 * Get screen component for a given game type.
 */
export function getGameScreen(gameType) {
  return getGameConfig(gameType).component;
}

/**
 * Get array of all registered game configurations.
 */
export function getAllGames() {
  return Object.values(GAME_REGISTRY);
}

/**
 * Check if a game type or alias is valid.
 */
export function isValidGameType(gameType) {
  const normalized = normalizeGameType(gameType);
  return Boolean(GAME_REGISTRY[normalized]);
}
