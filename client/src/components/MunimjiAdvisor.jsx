import React from 'react';
import boardData from '../data/board.json';
import { GROUP_NAMES } from '../data/constants';
import { Sparkles, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * Friendly Indian Merchant AI Guide ("Munimji").
 * Gives cheerful, intelligent, context-aware tips to help players make smart moves without feeling complicated.
 */
export function MunimjiAdvisor({ gameState, player, isMyTurn }) {
  if (!gameState || !player) return null;

  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = gameState?.players?.find(p => p.id === activePlayerId);
  const landedTile = activePlayer ? boardData[activePlayer.position] : null;

  // Compute smart advice based on current state
  const getAdvice = () => {
    if (player.bankrupt) {
      return {
        text: "Don't worry dost, fortunes turn quickly in the bazaar! Watch the others battle it out.",
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        tone: 'neutral'
      };
    }

    if (isMyTurn) {
      if (player.inJail && gameState.step === 'INITIAL') {
        if ((player.getOutOfJailCards || 0) > 0) {
          return {
            text: "Munimji's Advice: You have a Get Out of Jail card! Use it for an instant free release.",
            icon: <Lightbulb className="w-4 h-4 text-blue-400" />,
            tone: 'tip'
          };
        }
        return {
          text: "In detention! Roll for a lucky double, or pay the ₹50 bail fine to keep moving and earning.",
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          tone: 'tip'
        };
      }

      if (gameState.step === 'INITIAL') {
        return {
          text: "Shubh shuruwaat! It's your turn. Roll the dice and let's grow the business!",
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          tone: 'action'
        };
      }

      if (gameState.step === 'AWAITING_BUY' && landedTile) {
        // Check player properties in this group
        const myPropsInGroup = Object.entries(gameState.properties || {})
          .filter(([id, p]) => p.ownerId === player.id && boardData[id]?.group === landedTile.group).length;

        const canAfford = player.cash >= (landedTile.cost || 0);

        if (!canAfford) {
          return {
            text: `Treasury low! You need ₹${landedTile.cost} but have ₹${player.cash}. Pass to auction or mortgage an asset!`,
            icon: <AlertTriangle className="w-4 h-4 text-red-400" />,
            tone: 'warn'
          };
        }

        if (myPropsInGroup > 0) {
          return {
            text: `Jackpot chance! You already own properties in ${GROUP_NAMES[landedTile.group] || 'this set'}. Buying this creates huge monopoly power!`,
            icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
            tone: 'hot'
          };
        }

        return {
          text: `Prime real estate! ${landedTile.name} is available for ₹${landedTile.cost}. Buy it to start collecting rent from competitors!`,
          icon: <Lightbulb className="w-4 h-4 text-emerald-400" />,
          tone: 'tip'
        };
      }

      if (gameState.step === 'TURN_END') {
        return {
          text: "Turn well played! Click 'End Turn' to pass the dice to the next merchant.",
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          tone: 'action'
        };
      }
    }

    // Opponent turn advice
    if (activePlayer) {
      if (gameState.step === 'AWAITING_BUY' && landedTile) {
        return {
          text: `${activePlayer.name} landed on ${landedTile.name}. If they pass, it goes to public auction where you can bid!`,
          icon: <Lightbulb className="w-4 h-4 text-blue-400" />,
          tone: 'neutral'
        };
      }
      return {
        text: `Watch carefully! ${activePlayer.name} is rolling the dice. Keep an eye out for trade opportunities.`,
        icon: <Sparkles className="w-4 h-4 text-neutral-400" />,
        tone: 'neutral'
      };
    }

    return {
      text: "Welcome to Bazaar Baron! Trade wisely, build steadily, and rule the marketplace.",
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      tone: 'neutral'
    };
  };

  const advice = getAdvice();

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-950/40 via-neutral-900/80 to-amber-950/40 border border-amber-500/30 shadow-md backdrop-blur text-xs select-none animate-fade-in">
      {/* Munimji Avatar / Badge */}
      <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
        <span className="text-sm">👳🏾‍♂️</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-amber-400/90 leading-tight">
          <span>Munimji AI</span>
          <span>•</span>
          <span className="text-neutral-400">Advisor</span>
        </div>
        <p className="text-[11px] sm:text-xs text-neutral-200 truncate font-medium">
          {advice.text}
        </p>
      </div>
    </div>
  );
}
