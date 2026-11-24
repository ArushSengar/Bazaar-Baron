import React, { useState, useEffect } from 'react';
import { GROUP_COLORS, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import boardData from '../data/board.json';
import { Gavel, TrendingUp, Ban, Users, Eye, EyeOff } from 'lucide-react';
import { PawnIcon } from './PawnIcon';

export function AuctionModal({ auction, player, gameState, onBid, onPass }) {
  const [minimized, setMinimized] = useState(false);
  const [customBid, setCustomBid] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMinimized(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!auction) return null;

  const tile = boardData[auction.tileId];
  if (!tile) return null;

  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const highestBidder = auction.highestBidderId
    ? gameState?.players?.find(p => p.id === auction.highestBidderId)
    : null;

  const isHighestBidder = highestBidder?.id === player?.id;
  const isStillInAuction = (auction.activeBidders || []).includes(player?.id);
  const currentBid = auction.currentBid || 0;

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(customBid, 10);
    if (!isNaN(amount) && amount > currentBid && player.cash >= amount) {
      onBid(amount);
      setCustomBid('');
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-16 right-4 z-50 animate-bounce-subtle">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 bg-[#FCF9F2] text-[#1B1B1B] border-2 border-[#8B5A2B] px-4 py-2.5 rounded-2xl shadow-2xl cursor-pointer hover:bg-amber-50"
        >
          <Gavel className="w-5 h-5 text-[#8B5A2B] animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold text-[#7A6B5D]">Auction in Progress</div>
            <div className="text-xs font-black">{tile.name} • Bid: ₹{currentBid}</div>
          </div>
          <Eye className="w-4 h-4 text-[#8B5A2B] ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setMinimized(true);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl overflow-hidden text-[#1B1B1B] animate-scale-up font-body">
        {/* Minimize Button so player can look at the board */}
        <button
          onClick={() => setMinimized(true)}
          className="absolute top-2.5 right-2.5 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors cursor-pointer"
          title="Minimize to see board"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Property Header Banner */}
        <div
          className="p-3.5 sm:p-4 text-center border-b border-black/15 shadow-sm relative"
          style={{ backgroundColor: groupColor }}
        >
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-widest text-white/90 uppercase mb-0.5">
            <Gavel className="w-3.5 h-3.5" />
            <span>Public Bazaar Auction</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow font-display">
            {tile.name}
          </h2>
          <span className="text-[11px] text-white/90 font-mono font-bold">
            Catalog Value: ₹{tile.cost}
          </span>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Current Highest Bid Card */}
          <div className="bg-[#EFE7D5] border border-[#D5C7B0] rounded-xl p-3 sm:p-4 text-center shadow-inner">
            <span className="text-[10px] uppercase font-bold text-[#7A6B5D] tracking-wider block mb-0.5">
              Current Top Bid
            </span>
            <div className="text-3xl sm:text-4xl font-black text-[#8B5A2B] font-number tracking-tight">
              ₹{currentBid}
            </div>
            {highestBidder ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#2A1E14] mt-1 font-bold">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: PLAYER_COLORS[highestBidder.color]?.hex || '#ef4444' }}
                />
                <span>Leading: {highestBidder.name} {isHighestBidder && '(You)'}</span>
              </div>
            ) : (
              <span className="text-xs text-[#7A6B5D] italic mt-1 block">
                No bids placed yet. Minimum opening bid: ₹10
              </span>
            )}
          </div>

          {/* Active Bidders Ring */}
          <div className="bg-[#FAF6EE] border border-[#E0D4C0] rounded-xl p-2.5 sm:p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#554637] mb-2">
              <Users className="w-3.5 h-3.5 text-[#8B5A2B]" />
              <span>Bidders In Ring</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(gameState?.players || []).filter(p => !p.bankrupt).map((p) => {
                const isIn = (auction.activeBidders || []).includes(p.id);
                const isLeader = auction.highestBidderId === p.id;
                const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F', text: '#fff' };
                const pShape = PLAYER_PAWNS[p.color] || 'hat';

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      isLeader
                        ? 'bg-amber-100 border-[#8B5A2B] text-[#8B5A2B] shadow-sm'
                        : isIn
                        ? 'bg-[#EFE7D5] border-[#D5C7B0] text-[#2A1E14]'
                        : 'bg-neutral-200/50 border-neutral-300 text-neutral-400 line-through'
                    }`}
                  >
                    <div className="w-3 h-3 flex items-center justify-center">
                      <PawnIcon shape={pShape} color={pColor.hex} size={12} />
                    </div>
                    <span>{p.name}</span>
                    {isLeader && <span className="text-[10px]">👑</span>}
                    {!isIn && <span className="text-[10px] text-neutral-400 font-normal">(Folded)</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Player Bidding Actions */}
          {isStillInAuction ? (
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-bold text-[#554637] flex items-center justify-between">
                <span>Your Bid:</span>
                <span className="font-number text-emerald-700 font-black">Your Treasury: ₹{player.cash}</span>
              </div>

              {/* Quick Increment Bids */}
              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((inc) => {
                  const targetBid = currentBid === 0 ? inc : currentBid + inc;
                  const canAfford = player.cash >= targetBid;

                  return (
                    <button
                      key={inc}
                      onClick={() => onBid(targetBid)}
                      disabled={!canAfford}
                      className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${
                        canAfford
                          ? 'bg-[#F28C28] hover:bg-[#E07D1C] text-white shadow-md active:scale-95 cursor-pointer font-number'
                          : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      ₹{targetBid}
                    </button>
                  );
                })}
              </div>

              {/* Custom Bid Input */}
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="number"
                  min={currentBid + 1}
                  max={player.cash}
                  placeholder={`Custom > ₹${currentBid}`}
                  value={customBid}
                  onChange={(e) => setCustomBid(e.target.value)}
                  className="flex-1 bg-white border border-[#D5C7B0] rounded-xl px-3 py-2 text-xs font-number font-bold text-[#1B1B1B] placeholder-neutral-400 focus:outline-none focus:border-[#8B5A2B]"
                />
                <button
                  type="submit"
                  disabled={!customBid || parseInt(customBid, 10) <= currentBid || player.cash < parseInt(customBid, 10)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2E9D5B] hover:bg-[#25834C] text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Bid
                </button>
              </form>

              {/* Fold / Pass */}
              <button
                onClick={onPass}
                className="w-full min-h-[44px] py-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Ban className="w-3.5 h-3.5" />
                Fold / Pass (Drop Out)
              </button>
            </div>
          ) : (
            <div className="text-center py-3 bg-[#EFE7D5]/70 rounded-xl border border-[#D5C7B0] text-xs text-[#7A6B5D] font-medium italic">
              You folded. Waiting for other merchants to finalize the auction...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
