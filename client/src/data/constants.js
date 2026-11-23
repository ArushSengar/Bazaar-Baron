export const GROUP_COLORS = {
  brown: '#8B5A2B',
  light_blue: '#7FD0F0', // Sky
  pink: '#E75A9B',
  orange: '#F28C28',
  red: '#D62F2F',
  yellow: '#F2D13A',
  green: '#2E9D5B',
  dark_blue: '#1F3FA8', // Navy
  station: '#334155',
  utility: '#854D0E'
};

export const GROUP_TEXT_COLORS = {
  brown: '#ffffff',
  light_blue: '#1b1b1b',
  pink: '#ffffff',
  orange: '#1b1b1b',
  red: '#ffffff',
  yellow: '#1b1b1b',
  green: '#ffffff',
  dark_blue: '#ffffff',
  station: '#ffffff',
  utility: '#ffffff'
};

export const GROUP_NAMES = {
  brown: 'Delhi Heritage',
  light_blue: 'Bengaluru Hub',
  pink: 'Pune Quarters',
  orange: 'Hyderabad Hills',
  red: 'Kolkata Avenues',
  yellow: 'Chennai Coast',
  green: 'Capital Enclaves',
  dark_blue: 'Mumbai Shores',
  station: 'Transit Terminals',
  utility: 'Civic Utilities'
};

export const MERCHANT_AVATARS = [
  { id: 'priya', name: 'Priya', title: 'Trade Tycoon', emoji: '👩‍💼', gender: 'female' },
  { id: 'rani', name: 'Rani', title: 'Royal Heiress', emoji: '👸', gender: 'female' },
  { id: 'ananya', name: 'Ananya', title: 'Silk Merchant', emoji: '👩', gender: 'female' },
  { id: 'meera', name: 'Meera', title: 'Bazaar Banker', emoji: '🧕', gender: 'female' },
  { id: 'aarav', name: 'Aarav', title: 'Spice Merchant', emoji: '👳', gender: 'male' },
  { id: 'kabir', name: 'Kabir', title: 'Gem Baron', emoji: '🧔', gender: 'male' },
  { id: 'rohan', name: 'Rohan', title: 'Jewel Dealer', emoji: '🧑', gender: 'male' },
  { id: 'vikram', name: 'Vikram', title: 'Port Master', emoji: '🎩', gender: 'male' }
];

export const PLAYER_COLORS = {
  red: { hex: '#D62F2F', text: '#ffffff', name: 'Ruby Red' },
  blue: { hex: '#2563EB', text: '#ffffff', name: 'Sapphire Blue' },
  green: { hex: '#2E9D5B', text: '#ffffff', name: 'Emerald Green' },
  amber: { hex: '#F28C28', text: '#000000', name: 'Amber Gold' },
  purple: { hex: '#9333EA', text: '#ffffff', name: 'Amethyst Purple' },
  teal: { hex: '#0D9488', text: '#ffffff', name: 'Teal Turquoise' }
};

export const PLAYER_PAWNS = {
  red: 'hat',       // Top hat / Crown
  blue: 'car',      // Ambassador car
  sky: 'car',       // Vintage car
  green: 'ship',    // Merchant Ship
  amber: 'dog',     // Royal Hound
  yellow: 'dog',    // Hound
  purple: 'boot',   // Riding Boot
  teal: 'thimble'   // Chai Kulhad / Thimble
};

/**
 * Calculates row and col (1 to 11) for any tile 0-39 on the classic perimeter grid.
 */
export function getTileGridPosition(tileId) {
  // Bottom row: Right to Left
  if (tileId === 0) return { row: 11, col: 11 };
  if (tileId >= 1 && tileId <= 9) return { row: 11, col: 11 - tileId };

  // Bottom-Left corner (Jail)
  if (tileId === 10) return { row: 11, col: 1 };

  // Left column: Bottom to Top
  if (tileId >= 11 && tileId <= 19) return { row: 11 - (tileId - 10), col: 1 };

  // Top-Left corner (Chai Break / Free Parking)
  if (tileId === 20) return { row: 1, col: 1 };

  // Top row: Left to Right
  if (tileId >= 21 && tileId <= 29) return { row: 1, col: 1 + (tileId - 20) };

  // Top-Right corner (Go To Jail)
  if (tileId === 30) return { row: 1, col: 11 };

  // Right column: Top to Bottom
  if (tileId >= 31 && tileId <= 39) return { row: 1 + (tileId - 30), col: 11 };

  return { row: 1, col: 1 };
}

/**
 * Determines which edge is the INNER edge (facing the center of the board)
 * Bottom tiles (1-9): inner edge is top
 * Left tiles (11-19): inner edge is right
 * Top tiles (21-29): inner edge is bottom
 * Right tiles (31-39): inner edge is left
 */
export function getTileOrientation(tileId) {
  if (tileId === 0) return 'corner-bottom-right';
  if (tileId >= 1 && tileId <= 9) return 'bottom';
  if (tileId === 10) return 'corner-bottom-left';
  if (tileId >= 11 && tileId <= 19) return 'left';
  if (tileId === 20) return 'corner-top-left';
  if (tileId >= 21 && tileId <= 29) return 'top';
  if (tileId === 30) return 'corner-top-right';
  if (tileId >= 31 && tileId <= 39) return 'right';
  return 'bottom';
}
