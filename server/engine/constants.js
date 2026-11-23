export const GAME_PHASES = {
  LOBBY: 'LOBBY',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

export const TURN_STEPS = {
  INITIAL: 'INITIAL',               // Active player needs to roll or pay/use card to exit jail
  ROLLED: 'ROLLED',                 // Dice rolled, landed on tile
  AWAITING_BUY: 'AWAITING_BUY',     // Landed on unowned property/station/utility
  AUCTION: 'AUCTION',               // Auction in progress for a property
  RESOLVING_CARD: 'RESOLVING_CARD', // Landed on chance / community
  BANKRUPTCY_CHECK: 'BANKRUPTCY',   // Negative balance, must raise cash or forfeit
  TURN_END: 'TURN_END'              // May build, mortgage, trade, or end turn
};

export const RULES = {
  STARTING_CASH: 1500,
  GO_SALARY: 200,
  JAIL_FINE: 50,
  JAIL_TILE_INDEX: 10,
  GO_TO_JAIL_TILE_INDEX: 30,
  GO_TILE_INDEX: 0,
  MAX_HOUSES_BANK: 32,
  MAX_HOTELS_BANK: 12,
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  MAX_JAIL_TURNS: 3,
  MORTGAGE_INTEREST_RATE: 0.10
};

export const PLAYER_COLORS = [
  { id: 'red', name: 'Ruby Red', hex: '#ef4444', text: '#ffffff' },
  { id: 'blue', name: 'Sapphire Blue', hex: '#3b82f6', text: '#ffffff' },
  { id: 'green', name: 'Emerald Green', hex: '#10b981', text: '#ffffff' },
  { id: 'amber', name: 'Amber Gold', hex: '#f59e0b', text: '#000000' },
  { id: 'purple', name: 'Amethyst Purple', hex: '#8b5cf6', text: '#ffffff' },
  { id: 'teal', name: 'Teal Turquoise', hex: '#06b6d4', text: '#000000' }
];

export const GROUPS = {
  brown: [1, 3],
  light_blue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  dark_blue: [37, 39],
  station: [5, 15, 25, 35],
  utility: [12, 28]
};
