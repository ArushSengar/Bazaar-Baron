import React from 'react';
import { Trophy, Crown, Sparkles, RotateCcw } from 'lucide-react';
import { PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import { PawnIcon } from './PawnIcon';

export function WinnerModal({ gameState, player, onLeaveRoom }) {
  if (gameState?.phase !== 'GAME_OVER') return null;

  const winner = gameState.players.find(p => p.id === gameState.winnerId)
    || gameState.players.find(p => !p.bankrupt)
    || gameState.players[0];

  const winnerColor = PLAYER_COLORS[winner?.color] || { hex: '#D62F2F', text: '#ffffff' };
  const winnerShape = PLAYER_PAWNS[winner?.color] || 'hat';
  const isWinner = winner?.id === player?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in font-body">
      <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-amber-500 rounded-3xl shadow-2xl p-6 sm:p-8 text-[#1B1B1B] text-center animate-scale-up space-y-5">
        {/* Crown & Trophy Icon */}
        <div className="relative inline-block">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mx-auto border-2 border-amber-400"
            style={{ backgroundColor: winnerColor.hex }}
          >
            <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-3 -right-2 bg-amber-400 text-neutral-950 p-1.5 rounded-full shadow-lg animate-bounce">
            <Crown className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Announcement */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-[#8B5A2B] uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sole Survivor</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#2A1E14] font-display tracking-tight">
            {winner?.name}
          </h2>
          <p className="text-sm font-semibold text-[#554637] mt-1">
            {isWinner ? '🎉 You conquered the bazaar and won the game!' : 'Has won the game and been crowned the Bazaar Baron!'}
          </p>
        </div>

        {/* Final Standings */}
        <div className="bg-[#EFE7D5] border border-[#D5C7B0] rounded-2xl p-3.5 text-left space-y-1.5">
          <span className="text-[10px] uppercase font-black text-[#7A6B5D] tracking-wider block mb-1.5">
            Final Standings
          </span>

          {gameState.players.map((p, idx) => {
            const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F' };
            const pShape = PLAYER_PAWNS[p.color] || 'hat';
            const isTop = p.id === winner?.id;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                  isTop ? 'bg-amber-100/90 border border-amber-400 font-bold' : 'bg-white/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-number text-neutral-500 text-[10px]">#{idx + 1}</span>
                  <div className="w-3 h-3 flex items-center justify-center">
                    <PawnIcon shape={pShape} color={pColor.hex} size={13} />
                  </div>
                  <span className="text-[#1B1B1B] font-bold">{p.name}</span>
                  {isTop && <span>👑</span>}
                  {p.bankrupt && <span className="text-[9px] text-red-600 font-bold">(Bankrupt)</span>}
                </div>

                <div className="font-number font-black text-[#2A1E14]">
                  {p.bankrupt ? '₹0' : `₹${p.cash}`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Play Again button */}
        <button
          onClick={onLeaveRoom}
          className="w-full min-h-[44px] py-3.5 px-6 rounded-2xl font-black text-sm bg-[#8B5A2B] hover:bg-[#724820] text-white shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Play Again / Return to Lobby
        </button>
      </div>
    </div>
  );
}
