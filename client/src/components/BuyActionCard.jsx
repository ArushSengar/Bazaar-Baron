import React from 'react';
import { GROUP_COLORS, GROUP_NAMES, GROUP_TEXT_COLORS } from '../data/constants';
import { ShoppingCart, Gavel, X, Sparkles, Building2 } from 'lucide-react';
import { sounds } from '../utils/audio';

/**
 * Non-intrusive, docked Property Purchase Card (Poker / Monopoly GO style).
 * Replaces the full-screen blocking modal so players can see the board, inspect other tiles,
 * and make quick decisions with zero screen freeze.
 */
export function BuyActionCard({
  tile,
  player,
  onBuy,
  onAuction,
  onDecline,
  isMyTurn,
  onInspectDeed
}) {
  if (!tile) return null;

  const canAfford = player.cash >= tile.cost;
  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const headerTextColor = GROUP_TEXT_COLORS[tile.group] || '#ffffff';

  const handleBuyClick = () => {
    sounds.playBuySound();
    onBuy();
  };

  return (
    <div className="w-full bg-[#FAF7F0] border-2 border-[#1B1B1B] rounded-2xl shadow-2xl overflow-hidden text-[#1B1B1B] font-body select-none transition-all animate-scale-up">
      {/* Top Property Header Strip */}
      <div
        className="px-3.5 py-2 flex items-center justify-between border-b-2 border-[#1B1B1B]"
        style={{ backgroundColor: groupColor, color: headerTextColor }}
      >
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          <span className="font-display font-black text-sm uppercase tracking-wide">
            {tile.name}
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
          {GROUP_NAMES[tile.group] || tile.type}
        </span>
      </div>

      {/* Body: Price & Decision */}
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between bg-[#EFE7D5] border border-neutral-300 rounded-xl p-2.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Property Price</span>
            <span className="font-number font-black text-base text-neutral-900">₹{tile.cost}</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Your Cash</span>
            <span className={`font-number font-bold text-sm ${canAfford ? 'text-emerald-700' : 'text-red-700'}`}>
              ₹{player.cash}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {isMyTurn ? (
          <div className="space-y-2">
            <button
              onClick={handleBuyClick}
              disabled={!canAfford}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                canAfford
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 border border-emerald-700'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-400'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{canAfford ? `Buy Property (₹${tile.cost})` : `Insufficient Cash (Need ₹${tile.cost})`}</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAuction}
                className="py-2 px-2.5 rounded-xl font-bold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-800 border border-neutral-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                title="Decline purchase and start open auction for all players"
              >
                <Gavel className="w-3.5 h-3.5 text-amber-800" />
                <span>Send to Auction</span>
              </button>

              <button
                onClick={onDecline}
                className="py-2 px-2.5 rounded-xl font-semibold text-xs text-neutral-600 hover:text-neutral-900 hover:bg-[#EFE7D5] border border-neutral-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Decline without auction"
              >
                <X className="w-3.5 h-3.5" />
                <span>Pass</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-1 text-xs text-neutral-500 italic">
            Waiting for merchant to decide...
          </div>
        )}
      </div>
    </div>
  );
}
