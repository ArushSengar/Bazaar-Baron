import React from 'react';
import { Trophy, Crown, Sparkles, RotateCcw, Clock } from 'lucide-react';
import { PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import { PawnIcon } from './PawnIcon';

export function WinnerModal({ gameState, player, onLeaveRoom }) {
  if (gameState?.phase !== 'GAME_OVER') return null;

  const isTimeLimit = gameState?.gameEndReason === 'TIME_LIMIT';

  const winner = gameState.players.find(p => p.id === gameState.winnerId)
    || gameState.players.find(p => !p.bankrupt)
    || gameState.players[0];

  const winnerColor = PLAYER_COLORS[winner?.color] || { hex: '#D62F2F', text: '#ffffff' };
  const winnerShape = PLAYER_PAWNS[winner?.color] || 'hat';
  const isWinner = winner?.id === player?.id;

  const standingsList = (gameState.finalStandings && gameState.finalStandings.length > 0)
    ? gameState.finalStandings
    : gameState.players;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in font-body overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-amber-500 rounded-3xl shadow-2xl p-5 sm:p-7 text-[#1B1B1B] text-center animate-scale-up space-y-4">
        {/* Crown & Trophy Icon */}
        <div className="relative inline-block">
          <div
            className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 mx-auto border-2 border-amber-400"
            style={{ backgroundColor: winnerColor.hex }}
          >
            <Trophy className="w-10 h-10 sm:w-11 sm:h-11 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-3 -right-2 bg-amber-400 text-neutral-950 p-1.5 rounded-full shadow-lg animate-bounce">
            <Crown className="w-5 h-5 fill-current" />
          </div>
        </div>

        {/* Announcement */}
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-[#8B5A2B] uppercase mb-1">
            {isTimeLimit ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>30-Minute Match Limit</span>
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sole Survivor</span>
                <Sparkles className="w-3.5 h-3.5" />
              </>
            )}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#2A1E14] font-display tracking-tight">
            {winner?.name}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#554637] mt-1">
            {isTimeLimit ? (
              isWinner
                ? '🎉 You accumulated the highest Total Wealth and won the 30-minute match!'
                : 'Crowned the Bazaar Baron with the highest Total Wealth (Net Worth)!'
            ) : (
              isWinner
                ? '🎉 You conquered the bazaar and won the game!'
                : 'Has won the game and been crowned the Bazaar Baron!'
            )}
          </p>
        </div>

        {/* Final Standings with Wealth Breakdown */}
        <div className="bg-[#EFE7D5] border border-[#D5C7B0] rounded-2xl p-3 text-left space-y-2 max-h-[46vh] overflow-y-auto">
          <div className="flex items-center justify-between text-[10px] uppercase font-black text-[#7A6B5D] tracking-wider mb-1">
            <span>Final Standings</span>
            <span>{isTimeLimit ? 'Ranked by Total Wealth' : 'Ranked by Treasury'}</span>
          </div>

          {standingsList.map((p, idx) => {
            const pId = p.playerId || p.id;
            const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F' };
            const pShape = PLAYER_PAWNS[p.color] || 'hat';
            const isTop = pId === winner?.id || idx === 0;

            return (
              <div
                key={pId}
                className={`p-2.5 rounded-xl text-xs transition-all ${
                  isTop ? 'bg-amber-100/95 border-2 border-amber-400 font-bold shadow-sm' : 'bg-white/85 border border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-number text-neutral-500 text-[10px]">#{idx + 1}</span>
                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                      <PawnIcon shape={pShape} color={pColor.hex} size={14} />
                    </div>
                    <span className="text-[#1B1B1B] font-extrabold">{p.name}</span>
                    {isTop && <span>👑</span>}
                    {p.bankrupt && <span className="text-[9px] text-red-600 font-bold uppercase">(Bankrupt)</span>}
                  </div>

                  <div className="text-right">
                    <div className="font-number font-black text-sm text-[#2A1E14]">
                      {p.totalWealth !== undefined
                        ? `₹${p.totalWealth.toLocaleString('en-IN')}`
                        : p.bankrupt ? '₹0' : `₹${p.cash}`}
                    </div>
                    {p.totalWealth !== undefined && (
                      <span className="text-[8px] uppercase tracking-wider text-amber-700 font-black block">
                        Net Worth
                      </span>
                    )}
                  </div>
                </div>

                {/* Wealth Breakdown Chips */}
                {p.totalWealth !== undefined && !p.bankrupt && (
                  <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-neutral-600 font-medium">
                    <span>💵 Cash: <strong className="text-neutral-900">₹{p.cash}</strong></span>
                    <span>🏘️ Props: <strong className="text-neutral-900">₹{p.propertiesValue}</strong></span>
                    <span>🏨 Havelis: <strong className="text-neutral-900">₹{p.buildingsValue}</strong></span>
                  </div>
                )}
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
