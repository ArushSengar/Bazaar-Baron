import { GAME_PHASES, TURN_STEPS, RULES, GROUPS } from './constants.js';
import {
  calculateRent,
  validateBuildHouse,
  validateSellHouse,
  validateMortgage,
  validateUnmortgage
} from './rules.js';
import boardData from '../data/board.json' with { type: 'json' };
import cardsData from '../data/cards.json' with { type: 'json' };

/**
 * Helper to deep clone state.
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Add a log message to state.
 */
function addLog(state, text, type = 'action') {
  state.logs.push({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    time: new Date().toISOString(),
    text,
    type
  });
  if (state.logs.length > 100) {
    state.logs = state.logs.slice(-100);
  }
}

/**
 * Helper to get the active player object.
 */
export function getActivePlayer(state) {
  if (!state.playerOrder || state.playerOrder.length === 0) return null;
  const activeId = state.playerOrder[state.turnIndex];
  return state.players.find(p => p.id === activeId) || null;
}

/**
 * Advance turn to the next non-bankrupt player.
 */
function advanceToNextPlayer(state) {
  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    state.phase = GAME_PHASES.GAME_OVER;
    state.winnerId = activePlayers[0]?.id || null;
    addLog(state, `🎉 Game over! ${activePlayers[0]?.name || 'Winner'} is the Bazaar Baron!`, 'winner');
    return;
  }

  let nextIndex = (state.turnIndex + 1) % state.playerOrder.length;
  while (state.players.find(p => p.id === state.playerOrder[nextIndex])?.bankrupt) {
    nextIndex = (nextIndex + 1) % state.playerOrder.length;
  }

  state.turnIndex = nextIndex;
  state.doublesCount = 0;
  state.lastRollDoubles = false;
  state.step = TURN_STEPS.INITIAL;
  state.drawnCard = null;
  state.debt = null;

  const nextPlayer = getActivePlayer(state);
  addLog(state, `Turn passed to ${nextPlayer.name}.`, 'info');
}

/**
 * Check if landing tile triggers any automatic events (Rent, Tax, Go to Jail, Cards).
 */
function handleLanding(state, player, diceTotal, board = boardData) {
  const tile = board[player.position];
  state.currentTile = player.position;

  if (tile.type === 'go_to_jail') {
    player.position = RULES.JAIL_TILE_INDEX;
    player.inJail = true;
    player.jailTurns = 0;
    state.doublesCount = 0;
    state.lastRollDoubles = false;
    state.step = TURN_STEPS.TURN_END;
    addLog(state, `🚨 ${player.name} was sent directly to Central Jail!`, 'warning');
    return;
  }

  if (tile.type === 'tax') {
    const taxAmount = tile.amount;
    if (player.cash >= taxAmount) {
      player.cash -= taxAmount;
      state.step = TURN_STEPS.TURN_END;
      addLog(state, `💸 ${player.name} paid ₹${taxAmount} for ${tile.name}.`, 'action');
    } else {
      state.debt = {
        creditorId: 'BANK',
        amount: taxAmount,
        reason: tile.name
      };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;
      addLog(state, `⚠️ ${player.name} owes ₹${taxAmount} in tax but only has ₹${player.cash}!`, 'warning');
    }
    return;
  }

  if (['property', 'station', 'utility'].includes(tile.type)) {
    const propState = state.properties[tile.id];
    if (!propState.ownerId) {
      // Unowned property - player can buy or auction
      state.step = TURN_STEPS.AWAITING_BUY;
      addLog(state, `${player.name} landed on unowned ${tile.name} (Price: ₹${tile.cost}).`, 'info');
      return;
    }

    if (propState.ownerId === player.id) {
      // Own property
      state.step = TURN_STEPS.TURN_END;
      addLog(state, `${player.name} landed on their own property ${tile.name}.`, 'info');
      return;
    }

    // Owned by someone else
    const owner = state.players.find(p => p.id === propState.ownerId);
    if (propState.mortgaged) {
      state.step = TURN_STEPS.TURN_END;
      addLog(state, `${player.name} landed on ${tile.name}, but it is mortgaged. No rent owed.`, 'info');
      return;
    }

    const rent = calculateRent(board, state.properties, tile.id, diceTotal);
    if (rent === 0) {
      state.step = TURN_STEPS.TURN_END;
      return;
    }

    if (player.cash >= rent) {
      player.cash -= rent;
      owner.cash += rent;
      state.step = TURN_STEPS.TURN_END;
      addLog(state, `💵 ${player.name} paid ₹${rent} rent to ${owner.name} for ${tile.name}.`, 'action');
    } else {
      // Cannot afford full rent
      state.debt = {
        creditorId: owner.id,
        amount: rent,
        tileId: tile.id
      };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;
      addLog(state, `⚠️ ${player.name} owes ₹${rent} rent to ${owner.name} but only has ₹${player.cash}! Must mortgage, sell buildings or declare bankruptcy.`, 'warning');
    }
    return;
  }

  if (tile.type === 'chance' || tile.type === 'community') {
    executeDrawCard(state, player, tile.type, diceTotal, board);
    return;
  }

  // Go, Jail (just visiting), Free Parking
  state.step = TURN_STEPS.TURN_END;
  if (tile.type === 'free_parking') {
    addLog(state, `☕ ${player.name} is relaxing on Chai Break.`, 'info');
  } else if (tile.type === 'jail') {
    addLog(state, `${player.name} is just visiting Central Jail.`, 'info');
  } else if (tile.type === 'go') {
    addLog(state, `${player.name} landed directly on Start!`, 'action');
  }
}

/**
 * Handle card draws.
 */
function executeDrawCard(state, player, deckType, diceTotal, board = boardData) {
  const isChance = deckType === 'chance';
  const deck = isChance ? state.chanceDeck : state.communityDeck;
  const cardsList = isChance ? cardsData.chance : cardsData.community;

  if (deck.length === 0) {
    // Reshuffle
    const fresh = cardsList.map((_, i) => i);
    deck.push(...fresh);
  }

  const cardIndex = deck.shift();
  const card = cardsList[cardIndex];
  state.drawnCard = { ...card, deckType };

  addLog(state, `🎴 ${player.name} drew a ${isChance ? 'Kismat' : 'Bazaar Fund'} card: "${card.text}"`, 'card');

  if (card.action === 'advance_to') {
    const targetId = card.tileId;
    if (targetId < player.position && targetId !== RULES.JAIL_TILE_INDEX) {
      // Passed Go!
      player.cash += RULES.GO_SALARY;
      addLog(state, `${player.name} passed Start and collected ₹${RULES.GO_SALARY}.`, 'action');
    }
    player.position = targetId;
    handleLanding(state, player, diceTotal, board);
    return;
  }

  if (card.action === 'collect') {
    player.cash += card.amount;
    state.step = TURN_STEPS.TURN_END;
    return;
  }

  if (card.action === 'pay') {
    if (player.cash >= card.amount) {
      player.cash -= card.amount;
      state.step = TURN_STEPS.TURN_END;
    } else {
      state.debt = {
        creditorId: 'BANK',
        amount: card.amount,
        reason: card.text
      };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;
    }
    return;
  }

  if (card.action === 'collect_from_all') {
    const others = state.players.filter(p => p.id !== player.id && !p.bankrupt);
    for (const other of others) {
      const take = Math.min(other.cash, card.amount);
      other.cash -= take;
      player.cash += take;
    }
    state.step = TURN_STEPS.TURN_END;
    return;
  }

  if (card.action === 'jail_free') {
    player.getOutOfJailCards += 1;
    state.step = TURN_STEPS.TURN_END;
    return;
  }

  if (card.action === 'go_to_jail') {
    player.position = RULES.JAIL_TILE_INDEX;
    player.inJail = true;
    player.jailTurns = 0;
    state.doublesCount = 0;
    state.lastRollDoubles = false;
    state.step = TURN_STEPS.TURN_END;
    return;
  }

  if (card.action === 'repairs') {
    let houseCount = 0;
    let hotelCount = 0;
    for (const [id, prop] of Object.entries(state.properties)) {
      if (prop.ownerId === player.id) {
        if (prop.houses === 5) {
          hotelCount += 1;
        } else if (prop.houses > 0) {
          houseCount += prop.houses;
        }
      }
    }
    const repairBill = (houseCount * card.houseCost) + (hotelCount * card.hotelCost);
    if (repairBill === 0) {
      addLog(state, `${player.name} has no buildings, repair bill is ₹0.`, 'info');
      state.step = TURN_STEPS.TURN_END;
    } else if (player.cash >= repairBill) {
      player.cash -= repairBill;
      addLog(state, `${player.name} paid ₹${repairBill} for repairs (${houseCount} houses, ${hotelCount} hotels).`, 'action');
      state.step = TURN_STEPS.TURN_END;
    } else {
      state.debt = {
        creditorId: 'BANK',
        amount: repairBill,
        reason: 'Property Repairs'
      };
      state.step = TURN_STEPS.BANKRUPTCY_CHECK;
    }
    return;
  }

  state.step = TURN_STEPS.TURN_END;
}

/**
 * Pure Game Reducer function: (state, intent) -> nextState
 */
export function gameReducer(rawState, intent, board = boardData) {
  if (!rawState || !intent) return rawState;
  const state = clone(rawState);

  switch (intent.type) {
    case 'START_GAME': {
      if (state.phase !== GAME_PHASES.LOBBY) {
        return state;
      }
      const host = state.players.find(p => p.isHost);
      if (intent.playerId && host && intent.playerId !== host.id) {
        return state; // Only host can start game
      }
      if (state.players.length < RULES.MIN_PLAYERS || state.players.length > RULES.MAX_PLAYERS) {
        return state;
      }

      state.phase = GAME_PHASES.PLAYING;
      state.step = TURN_STEPS.INITIAL;
      state.turnIndex = 0;
      state.playerOrder = state.players.map(p => p.id);

      addLog(state, `🎲 The bazaar is open! Starting player: ${state.players[0].name}.`, 'action');
      return state;
    }

    case 'DISMISS_CARD': {
      state.drawnCard = null;
      return state;
    }

    case 'ROLL_DICE': {
      if (state.phase !== GAME_PHASES.PLAYING) return state;
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId) return state;
      if (state.step !== TURN_STEPS.INITIAL) return state;

      // Allow deterministic dice injection for tests or generate random dice
      const dice = intent.dice || [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1
      ];
      const isDoubles = dice[0] === dice[1];
      const diceTotal = dice[0] + dice[1];
      state.dice = dice;
      state.lastRollDoubles = isDoubles;

      addLog(state, `🎲 ${player.name} rolled [${dice[0]}, ${dice[1]}] = ${diceTotal}${isDoubles ? ' (DOUBLES!)' : ''}.`, 'action');

      if (player.inJail) {
        if (isDoubles) {
          player.inJail = false;
          player.jailTurns = 0;
          state.doublesCount = 0;
          addLog(state, `🔓 ${player.name} rolled doubles and got out of Jail for free!`, 'action');
          // Move
          player.position = (player.position + diceTotal) % 40;
          handleLanding(state, player, diceTotal, board);
          return state;
        } else {
          player.jailTurns += 1;
          if (player.jailTurns >= RULES.MAX_JAIL_TURNS) {
            // Must pay ₹50 fine after 3 failed turns
            if (player.cash >= RULES.JAIL_FINE) {
              player.cash -= RULES.JAIL_FINE;
              player.inJail = false;
              player.jailTurns = 0;
              addLog(state, `⚖️ ${player.name} served 3 turns, paid ₹${RULES.JAIL_FINE} fine and is released!`, 'action');
              player.position = (player.position + diceTotal) % 40;
              handleLanding(state, player, diceTotal, board);
              return state;
            } else {
              // In debt to bank for fine
              state.debt = {
                creditorId: 'BANK',
                amount: RULES.JAIL_FINE,
                reason: 'Mandatory Jail Release Fine'
              };
              state.step = TURN_STEPS.BANKRUPTCY_CHECK;
              return state;
            }
          } else {
            addLog(state, `🔒 ${player.name} failed to roll doubles (Turn ${player.jailTurns}/${RULES.MAX_JAIL_TURNS} in jail).`, 'info');
            state.step = TURN_STEPS.TURN_END;
            return state;
          }
        }
      }

      // Not in jail
      if (isDoubles) {
        state.doublesCount += 1;
        if (state.doublesCount === 3) {
          // Three doubles in a row sends to jail!
          player.position = RULES.JAIL_TILE_INDEX;
          player.inJail = true;
          player.jailTurns = 0;
          state.doublesCount = 0;
          state.lastRollDoubles = false;
          state.step = TURN_STEPS.TURN_END;
          addLog(state, `🚨 ${player.name} rolled three doubles in a row! Sent directly to Central Jail!`, 'warning');
          return state;
        }
      } else {
        state.doublesCount = 0;
      }

      const oldPos = player.position;
      const newPos = (oldPos + diceTotal) % 40;
      player.position = newPos;

      // Check passing Start / Go
      if (newPos < oldPos) {
        player.cash += RULES.GO_SALARY;
        addLog(state, `💰 ${player.name} passed Start and collected ₹${RULES.GO_SALARY}.`, 'action');
      }

      handleLanding(state, player, diceTotal, board);
      return state;
    }

    case 'BUY_PROPERTY': {
      if (state.phase !== GAME_PHASES.PLAYING) return state;
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId) return state;
      if (state.step !== TURN_STEPS.AWAITING_BUY) return state;

      const tile = board[player.position];
      if (!tile || !['property', 'station', 'utility'].includes(tile.type)) return state;

      const propState = state.properties[tile.id];
      if (propState.ownerId) return state; // Already owned

      if (player.cash < tile.cost) {
        return state; // Insufficient cash
      }

      player.cash -= tile.cost;
      propState.ownerId = player.id;
      state.step = TURN_STEPS.TURN_END;

      addLog(state, `🏛️ ${player.name} bought ${tile.name} for ₹${tile.cost}.`, 'action');
      return state;
    }

    case 'DECLINE_BUY': {
      if (state.phase !== GAME_PHASES.PLAYING) return state;
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId) return state;
      if (state.step !== TURN_STEPS.AWAITING_BUY) return state;

      const tile = board[player.position];

      if (intent.skipAuction) {
        state.step = TURN_STEPS.TURN_END;
        addLog(state, `${player.name} declined to buy ${tile.name}.`, 'info');
        return state;
      }

      const activeBidders = state.players.filter(p => !p.bankrupt).map(p => p.id);
      state.auction = {
        tileId: tile.id,
        currentBid: 0,
        highestBidderId: null,
        activeBidders,
        turnIndex: 0
      };
      state.step = TURN_STEPS.AUCTION;
      addLog(state, `📢 ${player.name} declined to buy ${tile.name}. Auction started!`, 'auction');
      return state;
    }

    case 'AUCTION_BID': {
      if (state.phase !== GAME_PHASES.PLAYING || state.step !== TURN_STEPS.AUCTION || !state.auction) {
        return state;
      }
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player || player.bankrupt) return state;
      if (!state.auction.activeBidders.includes(player.id)) return state;

      const bidAmount = parseInt(intent.amount, 10);
      if (isNaN(bidAmount) || bidAmount <= state.auction.currentBid || player.cash < bidAmount) {
        return state;
      }

      state.auction.currentBid = bidAmount;
      state.auction.highestBidderId = player.id;
      addLog(state, `📢 ${player.name} bid ₹${bidAmount} for ${board[state.auction.tileId].name}.`, 'auction');

      // If only 1 bidder remains in activeBidders, they win immediately
      if (state.auction.activeBidders.length === 1) {
        player.cash -= bidAmount;
        state.properties[state.auction.tileId].ownerId = player.id;
        addLog(state, `🏆 ${player.name} won the auction for ${board[state.auction.tileId].name} for ₹${bidAmount}!`, 'winner');
        state.auction = null;
        state.step = TURN_STEPS.TURN_END;
      }
      return state;
    }

    case 'AUCTION_PASS': {
      if (state.phase !== GAME_PHASES.PLAYING || state.step !== TURN_STEPS.AUCTION || !state.auction) {
        return state;
      }
      const bidderId = intent.playerId;
      state.auction.activeBidders = state.auction.activeBidders.filter(id => id !== bidderId);
      const passer = state.players.find(p => p.id === bidderId);
      if (passer) {
        addLog(state, `${passer.name} passed in auction.`, 'info');
      }

      // Check if auction is finished
      const remaining = state.auction.activeBidders;
      const highestId = state.auction.highestBidderId;

      if ((remaining.length === 1 && highestId && remaining[0] === highestId) || remaining.length === 0) {
        // Auction concluded
        if (highestId && state.auction.currentBid > 0) {
          const winner = state.players.find(p => p.id === highestId);
          winner.cash -= state.auction.currentBid;
          state.properties[state.auction.tileId].ownerId = winner.id;
          addLog(state, `🏆 ${winner.name} won the auction for ${board[state.auction.tileId].name} for ₹${state.auction.currentBid}!`, 'winner');
        } else {
          addLog(state, `Auction ended with no bids for ${board[state.auction.tileId].name}. Property remains unowned.`, 'info');
        }
        state.auction = null;
        state.step = TURN_STEPS.TURN_END;
      }
      return state;
    }

    case 'BUILD_HOUSE': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player) return state;

      const validation = validateBuildHouse(
        board,
        state.properties,
        state.bank.houses,
        state.bank.hotels,
        player,
        intent.tileId
      );
      if (!validation.valid) {
        return state;
      }

      const tile = board[intent.tileId];
      const prop = state.properties[intent.tileId];
      player.cash -= tile.houseCost;

      if (prop.houses === 4) {
        // Upgrade 4 houses to 1 hotel
        prop.houses = 5;
        state.bank.houses += 4;
        state.bank.hotels -= 1;
        addLog(state, `🏨 ${player.name} built a Hotel on ${tile.name} for ₹${tile.houseCost}.`, 'action');
      } else {
        prop.houses += 1;
        state.bank.houses -= 1;
        addLog(state, `🏠 ${player.name} built a house on ${tile.name} (Now: ${prop.houses} houses) for ₹${tile.houseCost}.`, 'action');
      }
      return state;
    }

    case 'SELL_HOUSE': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player) return state;

      const validation = validateSellHouse(
        board,
        state.properties,
        state.bank.houses,
        player,
        intent.tileId
      );
      if (!validation.valid) return state;

      const tile = board[intent.tileId];
      const prop = state.properties[intent.tileId];
      const refund = Math.floor(tile.houseCost / 2);
      player.cash += refund;

      if (prop.houses === 5) {
        // Downgrade hotel to 4 houses
        prop.houses = 4;
        state.bank.hotels += 1;
        state.bank.houses -= 4;
        addLog(state, `🏚️ ${player.name} sold a Hotel on ${tile.name} for ₹${refund}.`, 'action');
      } else {
        prop.houses -= 1;
        state.bank.houses += 1;
        addLog(state, `🏚️ ${player.name} sold a house on ${tile.name} for ₹${refund}.`, 'action');
      }
      return state;
    }

    case 'MORTGAGE': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player) return state;

      const validation = validateMortgage(board, state.properties, player, intent.tileId);
      if (!validation.valid) return state;

      const tile = board[intent.tileId];
      const prop = state.properties[intent.tileId];

      prop.mortgaged = true;
      player.cash += tile.mortgageValue;

      addLog(state, `🏦 ${player.name} mortgaged ${tile.name} and collected ₹${tile.mortgageValue}.`, 'action');
      return state;
    }

    case 'UNMORTGAGE': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player) return state;

      const validation = validateUnmortgage(board, state.properties, player, intent.tileId);
      if (!validation.valid) return state;

      const tile = board[intent.tileId];
      const prop = state.properties[intent.tileId];

      player.cash -= validation.cost;
      prop.mortgaged = false;

      addLog(state, `🔓 ${player.name} unmortgaged ${tile.name} for ₹${validation.cost}.`, 'action');
      return state;
    }

    case 'PAY_JAIL_FINE': {
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId || !player.inJail || state.step !== TURN_STEPS.INITIAL) {
        return state;
      }
      if (player.cash < RULES.JAIL_FINE) return state;

      player.cash -= RULES.JAIL_FINE;
      player.inJail = false;
      player.jailTurns = 0;
      addLog(state, `⚖️ ${player.name} paid ₹${RULES.JAIL_FINE} fine and was released from Central Jail.`, 'action');
      return state;
    }

    case 'USE_JAIL_CARD': {
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId || !player.inJail || state.step !== TURN_STEPS.INITIAL) {
        return state;
      }
      if (player.getOutOfJailCards <= 0) return state;

      player.getOutOfJailCards -= 1;
      player.inJail = false;
      player.jailTurns = 0;
      addLog(state, `🎟️ ${player.name} used a Get Out of Jail Free card and was released!`, 'action');
      return state;
    }

    case 'RESOLVE_DEBT': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player || !state.debt || state.step !== TURN_STEPS.BANKRUPTCY_CHECK) return state;

      if (player.cash < state.debt.amount) {
        return state; // Still insufficient cash
      }

      player.cash -= state.debt.amount;
      if (state.debt.creditorId !== 'BANK') {
        const creditor = state.players.find(p => p.id === state.debt.creditorId);
        if (creditor) creditor.cash += state.debt.amount;
      }

      addLog(state, `✅ ${player.name} settled debt of ₹${state.debt.amount}.`, 'action');
      state.debt = null;
      state.step = TURN_STEPS.TURN_END;
      return state;
    }

    case 'BANKRUPT': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player || player.bankrupt) return state;

      player.bankrupt = true;
      const creditorId = state.debt?.creditorId || intent.creditorId || 'BANK';

      addLog(state, `💥 ${player.name} declared BANKRUPTCY!`, 'warning');

      if (creditorId === 'BANK') {
        // Surrender all properties to bank unmortgaged, houses refunded to bank
        for (const [id, prop] of Object.entries(state.properties)) {
          if (prop.ownerId === player.id) {
            if (prop.houses === 5) {
              state.bank.hotels += 1;
            } else if (prop.houses > 0) {
              state.bank.houses += prop.houses;
            }
            prop.ownerId = null;
            prop.houses = 0;
            prop.mortgaged = false;
          }
        }
      } else {
        // Transfer all properties and remaining cash to creditor
        const creditor = state.players.find(p => p.id === creditorId);
        if (creditor) {
          creditor.cash += Math.max(0, player.cash);
          creditor.getOutOfJailCards += player.getOutOfJailCards;

          for (const [id, prop] of Object.entries(state.properties)) {
            if (prop.ownerId === player.id) {
              prop.ownerId = creditor.id;
              // Mortgaged status remains
            }
          }
          addLog(state, `📜 All assets of ${player.name} were transferred to ${creditor.name}.`, 'info');
        }
      }

      player.cash = 0;
      player.getOutOfJailCards = 0;
      state.debt = null;

      // Check if game over
      const activePlayers = state.players.filter(p => !p.bankrupt);
      if (activePlayers.length <= 1) {
        state.phase = GAME_PHASES.GAME_OVER;
        state.winnerId = activePlayers[0]?.id || null;
        addLog(state, `🏆 ${activePlayers[0]?.name || 'Winner'} is the sole survivor and won the game!`, 'winner');
        return state;
      }

      // If active player bankrupts on their turn, pass turn
      const currentActive = getActivePlayer(state);
      if (currentActive && currentActive.id === player.id) {
        advanceToNextPlayer(state);
      }

      return state;
    }

    case 'END_TURN': {
      if (state.phase !== GAME_PHASES.PLAYING) return state;
      const player = getActivePlayer(state);
      if (!player || player.id !== intent.playerId) return state;
      if (state.step !== TURN_STEPS.TURN_END) return state;

      // If doubles were rolled and player is not in jail, player rolls again!
      if (state.lastRollDoubles && !player.inJail && state.doublesCount > 0 && state.doublesCount < 3) {
        state.step = TURN_STEPS.INITIAL;
        state.drawnCard = null;
        addLog(state, `🎲 ${player.name} rolled doubles and gets to roll again!`, 'action');
        return state;
      }

      advanceToNextPlayer(state);
      return state;
    }

    case 'TRADE_OFFER': {
      // Validate trade
      const sender = state.players.find(p => p.id === intent.playerId);
      const target = state.players.find(p => p.id === intent.targetPlayerId);
      if (!sender || !target || sender.bankrupt || target.bankrupt) return state;

      state.activeTrade = {
        id: `trade-${Date.now()}`,
        senderId: sender.id,
        targetPlayerId: target.id,
        offerCash: Math.max(0, parseInt(intent.offerCash, 10) || 0),
        offerPropertyIds: intent.offerPropertyIds || [],
        offerJailCards: intent.offerJailCards || 0,
        requestCash: Math.max(0, parseInt(intent.requestCash, 10) || 0),
        requestPropertyIds: intent.requestPropertyIds || [],
        requestJailCards: intent.requestJailCards || 0
      };
      addLog(state, `🤝 ${sender.name} proposed a trade to ${target.name}.`, 'trade');
      return state;
    }

    case 'TRADE_ACCEPT': {
      if (!state.activeTrade) return state;
      const trade = state.activeTrade;
      if (trade.targetPlayerId !== intent.playerId) return state;

      const sender = state.players.find(p => p.id === trade.senderId);
      const target = state.players.find(p => p.id === trade.targetPlayerId);
      if (!sender || !target) return state;

      // Validate assets
      if (sender.cash < trade.offerCash || target.cash < trade.requestCash) return state;
      if (sender.getOutOfJailCards < trade.offerJailCards || target.getOutOfJailCards < trade.requestJailCards) return state;

      // Check properties ownership and no buildings on their groups
      for (const id of trade.offerPropertyIds) {
        if (state.properties[id]?.ownerId !== sender.id) return state;
      }
      for (const id of trade.requestPropertyIds) {
        if (state.properties[id]?.ownerId !== target.id) return state;
      }

      // Execute trade
      sender.cash += trade.requestCash - trade.offerCash;
      target.cash += trade.offerCash - trade.requestCash;

      sender.getOutOfJailCards += trade.requestJailCards - trade.offerJailCards;
      target.getOutOfJailCards += trade.offerJailCards - trade.requestJailCards;

      for (const id of trade.offerPropertyIds) {
        state.properties[id].ownerId = target.id;
      }
      for (const id of trade.requestPropertyIds) {
        state.properties[id].ownerId = sender.id;
      }

      addLog(state, `🤝 Trade completed between ${sender.name} and ${target.name}!`, 'trade');
      state.activeTrade = null;
      return state;
    }

    case 'TRADE_REJECT': {
      if (!state.activeTrade) return state;
      if (intent.playerId === state.activeTrade.targetPlayerId || intent.playerId === state.activeTrade.senderId) {
        addLog(state, `❌ Trade offer was declined or cancelled.`, 'info');
        state.activeTrade = null;
      }
      return state;
    }

    default:
      return state;
  }
}
