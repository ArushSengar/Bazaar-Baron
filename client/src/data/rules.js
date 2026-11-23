import boardData from './board.json';

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

export function hasColorMonopoly(properties, groupName, playerId) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.every(id => properties[id]?.ownerId === playerId);
}

export function groupHasBuildings(properties, groupName) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.some(id => (properties[id]?.houses || 0) > 0);
}

export function groupHasMortgages(properties, groupName) {
  const groupTiles = GROUPS[groupName];
  if (!groupTiles) return false;
  return groupTiles.some(id => properties[id]?.mortgaged);
}

export function validateBuildHouse(board, properties, bankHouses, bankHotels, player, tileId) {
  const tile = board[tileId];
  if (!tile || tile.type !== 'property') {
    return { valid: false, reason: 'Tile is not an improvable property.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player?.id) {
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

  if (currentHouses === 4) {
    if ((bankHotels ?? 12) <= 0) {
      return { valid: false, reason: 'No hotels left in bank supply.' };
    }
  } else {
    if ((bankHouses ?? 32) <= 0) {
      return { valid: false, reason: 'No houses left in bank supply.' };
    }
  }

  if ((player?.cash ?? 0) < tile.houseCost) {
    return { valid: false, reason: `Insufficient cash. Building costs ₹${tile.houseCost}.` };
  }

  return { valid: true };
}

export function validateSellHouse(board, properties, bankHouses, player, tileId) {
  const tile = board[tileId];
  if (!tile || tile.type !== 'property') {
    return { valid: false, reason: 'Tile is not a property.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player?.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  const currentHouses = prop.houses || 0;
  if (currentHouses <= 0) {
    return { valid: false, reason: 'No houses or hotels to sell on this property.' };
  }

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

  if (currentHouses === 5 && (bankHouses ?? 32) < 4) {
    return {
      valid: false,
      reason: 'Bank does not have enough houses (needs 4) to break down this hotel.'
    };
  }

  return { valid: true };
}

export function validateMortgage(board, properties, player, tileId) {
  const tile = board[tileId];
  if (!tile || !['property', 'station', 'utility'].includes(tile.type)) {
    return { valid: false, reason: 'Tile cannot be mortgaged.' };
  }

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player?.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  if (prop.mortgaged) {
    return { valid: false, reason: 'Property is already mortgaged.' };
  }

  if (tile.type === 'property' && groupHasBuildings(properties, tile.group)) {
    return { valid: false, reason: 'Must sell all houses/hotels in this group before mortgaging.' };
  }

  return { valid: true };
}

export function validateUnmortgage(board, properties, player, tileId) {
  const tile = board[tileId];
  if (!tile) return { valid: false, reason: 'Invalid tile.' };

  const prop = properties[tileId];
  if (!prop || prop.ownerId !== player?.id) {
    return { valid: false, reason: 'You do not own this property.' };
  }

  if (!prop.mortgaged) {
    return { valid: false, reason: 'Property is not mortgaged.' };
  }

  const unmortgageCost = Math.round(tile.mortgageValue * 1.10);
  if ((player?.cash ?? 0) < unmortgageCost) {
    return {
      valid: false,
      reason: `Insufficient cash to unmortgage. Requires ₹${unmortgageCost}.`
    };
  }

  return { valid: true, cost: unmortgageCost };
}
