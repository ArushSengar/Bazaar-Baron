export const GRID_SIZE = 100;

// 8 standard ladders (start < end)
export const LADDERS = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

// 8 standard snakes (head > tail)
export const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const MAX_CONSECUTIVE_SIXES = 3;

export const SNAKES_PHASES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

export const SNAKES_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899'  // Pink
];

export const DEFAULT_SNAKES_BOT_NAMES = [
  'Arjun (AI)',
  'Diya (AI)',
  'Rohan (AI)',
  'Ananya (AI)',
  'Vikram (AI)'
];
