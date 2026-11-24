import { UNO_CARD_TYPES, UNO_PHASES, UNO_DIRECTIONS, UNO_COLORS } from './constants.js';
import { createUnoDeck, shuffleDeck } from './deck.js';
import { canPlayUnoCard, calculateUnoHandScore } from './rules.js';

/**
 * Creates the initial state for a new UNO game room.
 */
export function createInitialUnoState(roomCode, hostPlayer) {
  return {
    roomCode,
    gameType: 'uno',
    phase: UNO_PHASES.LOBBY,
    direction: UNO_DIRECTIONS.CLOCKWISE,
    turnIndex: 0,
    players: [
      {
        id: hostPlayer.id,
        token: hostPlayer.token,
        name: hostPlayer.name,
        color: hostPlayer.color || '#EA3223',
        avatar: hostPlayer.avatar || '👨‍💼',
        cards: [],
        score: 0,
        calledUno: false,
        isHost: true,
        isBot: false,
        connected: true
      }
    ],
    playerOrder: [hostPlayer.id],
    deck: [],
    discardPile: [],
    activeColor: null,
    hasDrawnThisTurn: false,
    lastDrawnCardId: null,
    targetScore: 250, // Standard friendly match score
    winnerId: null,
    roundWinnerId: null,
    logs: [
      {
        id: `log_${Date.now()}`,
        time: new Date().toISOString(),
        text: `Room created by ${hostPlayer.name}. Welcome to Bazaar UNO!`,
        type: 'info'
      }
    ]
  };
}

/**
 * Add a log message to state.
 */
function addLog(state, text, type = 'info') {
  state.logs.push({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    time: new Date().toISOString(),
    text,
    type
  });
  if (state.logs.length > 50) {
    state.logs.shift();
  }
}

/**
 * Ensures draw pile has enough cards. If depleted, reshuffles discard pile (keeping top card).
 */
function ensureDeckSupply(state, requiredCount = 1) {
  if (state.deck.length >= requiredCount) return;

  if (state.discardPile.length <= 1) return;

  const topCard = state.discardPile[state.discardPile.length - 1];
  const cardsToRecycle = state.discardPile.slice(0, -1).map(c => {
    // Reset any wild color assignments
    if (c.type === UNO_CARD_TYPES.WILD || c.type === UNO_CARD_TYPES.WILD4) {
      return { ...c, color: 'wild' };
    }
    return c;
  });

  const recycledShuffled = shuffleDeck(cardsToRecycle);
  state.deck = [...recycledShuffled, ...state.deck];
  state.discardPile = [topCard];
  addLog(state, 'Discard pile was reshuffled back into the draw deck.', 'info');
}

/**
 * Draws N cards from deck for a specific player.
 */
function drawCardsForPlayer(state, player, count = 1) {
  ensureDeckSupply(state, count);
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (state.deck.length > 0) {
      const card = state.deck.pop();
      player.cards.push(card);
      drawn.push(card);
    }
  }
  return drawn;
}

/**
 * Computes next turn index taking direction (clockwise/counter-clockwise) and step into account.
 */
function getNextTurnIndex(currentIndex, playerCount, direction, steps = 1) {
  const delta = (direction * steps) % playerCount;
  return (currentIndex + delta + playerCount) % playerCount;
}

/**
 * Pure state reducer for UNO.
 */
export function unoReducer(currentState, intent) {
  const state = structuredClone(currentState);

  switch (intent.type) {
    case 'START_GAME':
    case 'START_NEXT_ROUND': {
      if (state.players.length < 2) {
        addLog(state, 'Need at least 2 players to start UNO.', 'warning');
        return state;
      }

      state.phase = UNO_PHASES.PLAYING;
      state.direction = UNO_DIRECTIONS.CLOCKWISE;
      state.turnIndex = 0;
      state.hasDrawnThisTurn = false;
      state.lastDrawnCardId = null;
      state.winnerId = null;
      state.roundWinnerId = null;

      // Create and shuffle 108 card deck
      let fullDeck = createUnoDeck();

      // Reset players' hands and UNO flags
      for (const p of state.players) {
        p.cards = [];
        p.calledUno = false;
      }

      // Deal 7 cards each
      for (let i = 0; i < 7; i++) {
        for (const p of state.players) {
          if (fullDeck.length > 0) {
            p.cards.push(fullDeck.pop());
          }
        }
      }

      // Find a non-action number card to cleanly start the discard pile
      let topCardIndex = fullDeck.length - 1;
      while (
        topCardIndex >= 0 &&
        fullDeck[topCardIndex].type !== UNO_CARD_TYPES.NUMBER
      ) {
        topCardIndex--;
      }

      let startingCard;
      if (topCardIndex >= 0) {
        startingCard = fullDeck.splice(topCardIndex, 1)[0];
      } else {
        startingCard = fullDeck.pop();
      }

      state.deck = fullDeck;
      state.discardPile = [startingCard];
      state.activeColor = startingCard.color === 'wild' ? UNO_COLORS[0] : startingCard.color;

      addLog(state, `Game started! First card is ${startingCard.color?.toUpperCase()} ${startingCard.value}.`, 'info');

      return state;
    }

    case 'PLAY_CARD': {
      if (state.phase !== UNO_PHASES.PLAYING) return state;

      const player = state.players[state.turnIndex];
      if (!player || player.id !== intent.playerId) return state;

      const cardIndex = player.cards.findIndex(c => c.id === intent.cardId);
      if (cardIndex === -1) return state;

      const card = player.cards[cardIndex];
      const topCard = state.discardPile[state.discardPile.length - 1];

      // Validate legality
      if (!canPlayUnoCard(card, topCard, state.activeColor)) {
        addLog(state, `Invalid move: ${card.color} ${card.value} cannot be played on ${state.activeColor} ${topCard.value}.`, 'warning');
        return state;
      }

      // Check chosen color for wild cards
      let chosenColor = intent.chosenColor;
      if (card.color === 'wild' || card.type === UNO_CARD_TYPES.WILD || card.type === UNO_CARD_TYPES.WILD4) {
        if (!UNO_COLORS.includes(chosenColor)) {
          chosenColor = UNO_COLORS[Math.floor(Math.random() * UNO_COLORS.length)];
        }
      }

      // Remove card from player hand
      player.cards.splice(cardIndex, 1);
      state.discardPile.push(card);
      state.hasDrawnThisTurn = false;
      state.lastDrawnCardId = null;

      // Update active color
      if (card.color === 'wild' || card.type === UNO_CARD_TYPES.WILD || card.type === UNO_CARD_TYPES.WILD4) {
        state.activeColor = chosenColor;
        addLog(state, `🎨 ${player.name} played ${card.value} and chose ${chosenColor.toUpperCase()}!`, 'action');
      } else {
        state.activeColor = card.color;
        addLog(state, `${player.name} played ${card.color.toUpperCase()} ${card.value}.`, 'play');
      }

      // Check for Uno Call
      if (intent.calledUno && player.cards.length === 1) {
        player.calledUno = true;
        addLog(state, `🔥 ${player.name} called UNO!`, 'uno');
      } else if (player.cards.length === 1) {
        player.calledUno = false;
      }

      // Check Win Condition (Hand Empty)
      if (player.cards.length === 0) {
        let roundPoints = 0;
        for (const other of state.players) {
          if (other.id !== player.id) {
            roundPoints += calculateUnoHandScore(other.cards);
          }
        }

        player.score = (player.score || 0) + roundPoints;
        state.roundWinnerId = player.id;

        addLog(state, `🏆 ${player.name} emptied their hand and won the round! (+${roundPoints} points)`, 'winner');

        if (player.score >= state.targetScore || state.targetScore <= 0) {
          state.phase = UNO_PHASES.GAME_OVER;
          state.winnerId = player.id;
          addLog(state, `👑 ${player.name} reached ${player.score} points and won the game!`, 'winner');
        } else {
          state.phase = UNO_PHASES.ROUND_OVER;
        }

        return state;
      }

      // Resolve Special Card Actions
      let stepAdvance = 1;
      const nextPlayerIndex = getNextTurnIndex(state.turnIndex, state.players.length, state.direction, 1);
      const nextPlayer = state.players[nextPlayerIndex];

      if (card.type === UNO_CARD_TYPES.SKIP) {
        stepAdvance = 2;
        addLog(state, `🚫 ${nextPlayer.name}'s turn was skipped!`, 'warning');
      } else if (card.type === UNO_CARD_TYPES.REVERSE) {
        if (state.players.length === 2) {
          stepAdvance = 2; // In 2-player UNO, Reverse acts as a Skip
          addLog(state, `🔄 Reverse acts as a skip against ${nextPlayer.name}!`, 'info');
        } else {
          state.direction = state.direction === UNO_DIRECTIONS.CLOCKWISE
            ? UNO_DIRECTIONS.COUNTER_CLOCKWISE
            : UNO_DIRECTIONS.CLOCKWISE;
          stepAdvance = 1;
          addLog(state, `🔄 Turn direction reversed!`, 'info');
        }
      } else if (card.type === UNO_CARD_TYPES.DRAW2) {
        drawCardsForPlayer(state, nextPlayer, 2);
        stepAdvance = 2;
        addLog(state, `⚡ ${nextPlayer.name} drew 2 cards and was skipped!`, 'warning');
      } else if (card.type === UNO_CARD_TYPES.WILD4) {
        drawCardsForPlayer(state, nextPlayer, 4);
        stepAdvance = 2;
        addLog(state, `💥 ${nextPlayer.name} drew 4 cards and was skipped!`, 'warning');
      }

      state.turnIndex = getNextTurnIndex(state.turnIndex, state.players.length, state.direction, stepAdvance);
      return state;
    }

    case 'DRAW_CARD': {
      if (state.phase !== UNO_PHASES.PLAYING) return state;

      const player = state.players[state.turnIndex];
      if (!player || player.id !== intent.playerId) return state;
      if (state.hasDrawnThisTurn) return state;

      const drawn = drawCardsForPlayer(state, player, 1);
      state.hasDrawnThisTurn = true;

      if (drawn.length > 0) {
        state.lastDrawnCardId = drawn[0].id;
        const topCard = state.discardPile[state.discardPile.length - 1];
        const canPlay = canPlayUnoCard(drawn[0], topCard, state.activeColor);
        addLog(state, `${player.name} drew a card.`, 'info');

        // If card cannot be played, automatically pass turn
        if (!canPlay) {
          state.hasDrawnThisTurn = false;
          state.lastDrawnCardId = null;
          state.turnIndex = getNextTurnIndex(state.turnIndex, state.players.length, state.direction, 1);
        }
      } else {
        // Deck completely exhausted
        state.hasDrawnThisTurn = false;
        state.turnIndex = getNextTurnIndex(state.turnIndex, state.players.length, state.direction, 1);
      }

      return state;
    }

    case 'PASS_TURN': {
      if (state.phase !== UNO_PHASES.PLAYING) return state;

      const player = state.players[state.turnIndex];
      if (!player || player.id !== intent.playerId) return state;
      if (!state.hasDrawnThisTurn) return state;

      addLog(state, `${player.name} passed their turn.`, 'info');
      state.hasDrawnThisTurn = false;
      state.lastDrawnCardId = null;
      state.turnIndex = getNextTurnIndex(state.turnIndex, state.players.length, state.direction, 1);
      return state;
    }

    case 'CALL_UNO': {
      const player = state.players.find(p => p.id === intent.playerId);
      if (!player) return state;

      if (player.cards.length <= 2) {
        player.calledUno = true;
        addLog(state, `🔥 ${player.name} shouted UNO!`, 'uno');
      }
      return state;
    }

    case 'CATCH_UNO': {
      // Another player calls out a vulnerable player with 1 card who failed to call UNO
      const catcher = state.players.find(p => p.id === intent.playerId);
      const target = state.players.find(p => p.id === intent.targetPlayerId);

      if (!target || target.cards.length !== 1 || target.calledUno) {
        return state;
      }

      drawCardsForPlayer(state, target, 2);
      target.calledUno = false;
      addLog(state, `🚨 ${catcher?.name || 'Someone'} caught ${target.name} without calling UNO! +2 cards penalty!`, 'warning');
      return state;
    }

    default:
      return state;
  }
}
