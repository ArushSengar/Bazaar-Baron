export const LUDO_COLORS = ['red', 'green', 'yellow', 'blue'];

export const LUDO_COLOR_HEX = {
  red: '#EF4444',
  green: '#10B981',
  yellow: '#F59E0B',
  blue: '#3B82F6'
};

export const TRACK_LENGTH = 52;
export const HOME_STRETCH_LENGTH = 5;
export const STEPS_TO_HOME = 57; // 0..51 perimeter, 52..56 home stretch, 57 home goal

export const START_POSITIONS = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39
};

// 8 safe star indices on the 52-tile perimeter track
export const SAFE_STAR_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export const LUDO_PHASES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

export const TOKEN_STATES = {
  BASE: 'base',
  TRACK: 'track',
  HOME_STRETCH: 'home_stretch',
  HOME: 'home'
};

export const MAX_CONSECUTIVE_SIXES = 3;

export const DEFAULT_LUDO_BOT_NAMES = [
  'Priya (AI)',
  'Rani (AI)',
  'Kabir (AI)',
  'Aarav (AI)'
];
