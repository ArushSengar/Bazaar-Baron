import { GROUPS, RULES } from './constants.js';

/**
 * Check if a player owns all properties in a given color group.
 */
export function hasColorMonopoly(properties, groupName, playerId) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.every(id => properties[id]?.ownerId === playerId);
}

/**
 * Check if any property in a group has houses or hotels.
 */
export function groupHasBuildings(properties, groupName) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.some(id => (properties[id]?.houses || 0) > 0);
}

/**
 * Check if any property in a group is mortgaged.
 */
export function groupHasMortgages(properties, groupName) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.some(id => properties[id]?.mortgaged);
}

/**
 * Calculate the exact rent owed for landing on a tile.
 * @param {Array} board - Array of 40 tiles
 * @param {Object} properties - Map of tileId -> { ownerId, houses, mortgaged }
 * @param {number} tileId - ID of the tile landed on
 * @param {number} diceTotal - Sum of the two dice rolled (needed for utilities)
 * @returns {number} Rent amount in rupees
 */
export function calculateRent(board, properties, tileId, diceTotal = 0) {
  const tile = board[tileId];
  if (!tile) return 0;

  const propState = properties[tileId];
  if (!propState || !propState.ownerId || propState.mortgaged) {
    return 0; // Unowned or mortgaged properties produce 0 rent
  }

  const ownerId = propState.ownerId;

  if (tile.type === 'property') {
    const houses = propState.houses || 0;
    if (houses > 0) {
      // 1 to 4 houses, 5 is hotel
      return tile.rent[houses] || 0;
    }
    // 0 houses: check if player has monopoly on this group
    const isMonopoly = hasColorMonopoly(properties, tile.group, ownerId);
    const hasMortgageInGroup = groupHasMortgages(properties, tile.group);
    
    // Classic rules: rent is doubled on unimproved sites if all sites of the color group are owned
    // even if one is mortgaged? In standard rules, rent is doubled only if no site in group is mortgaged, or regardless.
    // Let's standardise: doubled if monopoly and this tile is unmortgaged.
    return isMonopoly ? tile.rent[0] * 2 : tile.rent[0];
  }

  if (tile.type === 'station') {
    // Count how many stations owner owns that are NOT mortgaged
    const stations = GROUPS.station;
    const ownedCount = stations.filter(
      id => properties[id]?.ownerId === ownerId && !properties[id]?.mortgaged
    ).length;

    if (ownedCount === 0) return 0;
    return tile.rent[ownedCount - 1] || 25;
  }

  if (tile.type === 'utility') {
    const utilities = GROUPS.utility;
    const ownedCount = utilities.filter(
      id => properties[id]?.ownerId === ownerId && !properties[id]?.mortgaged
    ).length;

    if (ownedCount === 1) {
      return diceTotal * 4;
    } else if (ownedCount >= 2) {
      return diceTotal * 10;
    }
    return 0;
  }

  return 0;
}

/**
 * Validate whether a house/hotel can be built on a property.
 * Rules:
 * 1. Player must own all properties in the group
 * 2. No property in the group may be mortgaged
 * 3. Even building rule: cannot build on tile if it already has more houses than another tile in the group
 * 4. Maximum 5 buildings (4 houses + 1 hotel)
 * 5. Bank must have supply (houses <= 32, hotels <= 12)
 * 6. Player must have enough cash
 */
export function validateBuildHouse(board, properties, bankHouses, bankHotels, player, tileId) {
  const tile = board[tileId];
  if (!tile || tile.type !== 'property') {
    return { valid: false, reason: 'Tile is not an improvable property.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  if (!hasColorMonopoly(properties, tile.group, player.id)) {
    return { valid: false, reason: 'You must own the full color group to build.' };
  }

  if (groupHasMortgages(properties, tile.group)) {
    return { valid: false, reason: 'Cannot build while any property in this group is mortgaged.' };
  }

  const currentHouses = prop.houses || 0;
  if (currentHouses >= 5) {
    return { valid: false, reason: 'Maximum buildings (hotel) already reached on this property.' };
  }

  // Check even building rule
  const groupTiles = GROUPS[tile.group];
  for (const id of groupTiles) {
    const otherHouses = properties[id]?.houses || 0;
    if (currentHouses > otherHouses) {
      return {
        valid: false,
        reason: `Even building rule: you must build on ${board[id].name} first.`
      };
    }
  }

  // Check bank supply
  if (currentHouses === 4) {
    if (bankHotels <= 0) {
      return { valid: false, reason: 'No hotels left in bank supply.' };
    }
  } else {
    if (bankHouses <= 0) {
      return { valid: false, reason: 'No houses left in bank supply.' };
    }
  }

  // Check cash
  if (player.cash < tile.houseCost) {
    return { valid: false, reason: `Insufficient cash. Building costs ₹${tile.houseCost}.` };
  }

  return { valid: true };
}

/**
 * Validate whether a house/hotel can be sold from a property.
 * Rules:
 * 1. Player must own the property
 * 2. Property must have houses > 0
 * 3. Even building rule in reverse: cannot sell if another property in group has more houses
 * 4. If selling a hotel (from 5 to 4), bank must have 4 houses available (unless bank is out, then sell all)
 */
export function validateSellHouse(board, properties, bankHouses, player, tileId) {
  const tile = board[tileId];
  if (!tile || tile.type !== 'property') {
    return { valid: false, reason: 'Tile is not a property.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  const currentHouses = prop.houses || 0;
  if (currentHouses <= 0) {
    return { valid: false, reason: 'No houses or hotels to sell on this property.' };
  }

  // Check even building rule in reverse
  const groupTiles = GROUPS[tile.group];
  for (const id of groupTiles) {
    const otherHouses = properties[id]?.houses || 0;
    if (currentHouses < otherHouses) {
      return {
        valid: false,
        reason: `Even building rule: you must sell from ${board[id].name} first.`
      };
    }
  }

  // If selling hotel (5 -> 4), bank must have 4 houses
  if (currentHouses === 5 && bankHouses < 4) {
    return {
      valid: false,
      reason: 'Bank does not have enough houses (needs 4) to break down this hotel.'
    };
  }

  return { valid: true };
}

/**
 * Validate mortgaging a property.
 * Rules:
 * 1. Player must own it
 * 2. Must not be mortgaged
 * 3. If property, no buildings can exist anywhere in that color group
 */
export function validateMortgage(board, properties, player, tileId) {
  const tile = board[tileId];
  if (!tile || !['property', 'station', 'utility'].includes(tile.type)) {
    return { valid: false, reason: 'Tile cannot be mortgaged.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  if (prop.mortgaged) {
    return { valid: false, reason: 'Property is already mortgaged.' };
  }

  if (tile.type === 'property' && groupHasBuildings(properties, tile.group)) {
    return { valid: false, reason: 'You must sell all houses/hotels in this group before mortgaging.' };
  }

  return { valid: true };
}

/**
 * Validate unmortgaging a property.
 * Cost = mortgageValue * 1.10 (rounded)
 */
export function validateUnmortgage(board, properties, player, tileId) {
  const tile = board[tileId];
  if (!tile) return { valid: false, reason: 'Invalid tile.' };

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  if (!prop.mortgaged) {
    return { valid: false, reason: 'Property is not mortgaged.' };
  }

  const unmortgageCost = Math.round(tile.mortgageValue * (1 + RULES.MORTGAGE_INTEREST_RATE));
  if (player.cash < unmortgageCost) {
    return {
      valid: false,
      reason: `Insufficient cash to unmortgage. Requires ₹${unmortgageCost}.`
    };
  }

  return { valid: true, cost: unmortgageCost };
}
