import React from 'react';
import { Trophy, Crown, Sparkles, ArrowRight, RotateCcw } from 'lucide-react';

export function UnoRoundWinnerModal({ gameState, player, isHost, onNextRound }) {
  if (gameState?.phase !== 'ROUND_OVER') return null;

  const roundWinner = gameState.players.find(p => p.id === gameState.roundWinnerId);
  const isMe = roundWinner?.id === player?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-body">
      <div className="relative w-full max-w-md bg-[#1e130c] border-2 border-amber-500 rounded-3xl shadow-2xl p-6 text-white text-center space-y-5 animate-scale-up">
        <div className="relative inline-block">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-3xl sm:text-4xl shadow-xl">
            {roundWinner?.avatar || '🎉'}
          </div>
          <div className="absolute -top-2 -right-2 bg-amber-400 text-neutral-950 p-1.5 rounded-full shadow-lg">
            <Trophy className="w-4 h-4 fill-current" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-amber-400 uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Round Concluded</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-neutral-100">
            {roundWinner?.name} Won the Round!
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {isMe ? 'You emptied your hand first and scored points!' : `${roundWinner?.name} emptied their hand and claimed the round's bounty.`}
          </p>
        </div>

        {/* Current Match Scores Table */}
        <div className="bg-neutral-950/80 border border-neutral-800 rounded-2xl p-3.5 text-left space-y-2">
          <div className="flex items-center justify-between text-[11px] font-black uppercase text-neutral-400 tracking-wider pb-1 border-b border-neutral-800">
            <span>Player</span>
            <span>Total Points (Target: {gameState.targetScore})</span>
          </div>

          {[...gameState.players]
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((p, idx) => {
              const isLead = idx === 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold ${
                    p.id === roundWinner?.id
                      ? 'bg-amber-500/15 border border-amber-400/50 text-amber-300'
                      : 'bg-neutral-900/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-500 text-[10px]">#{idx + 1}</span>
                    <span>{p.avatar || '🧑'}</span>
                    <span>{p.name}</span>
                    {isLead && <span>👑</span>}
                  </div>
                  <span className="font-number font-black text-sm text-emerald-400">
                    {p.score || 0} pts
                  </span>
                </div>
              );
            })}
        </div>

        {isHost ? (
          <button
            onClick={onNextRound}
            className="w-full min-h-[46px] py-3 rounded-2xl font-black font-display text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 hover:from-amber-400 hover:to-amber-300 shadow-xl shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Start Next Round</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="text-xs text-neutral-400 italic">
            Waiting for host to begin the next round...
          </div>
        )}
      </div>
    </div>
  );
}

export function UnoWinnerModal({ gameState, player, onLeaveRoom }) {
  if (gameState?.phase !== 'GAME_OVER') return null;

  const winner = gameState.players.find(p => p.id === gameState.winnerId) || gameState.players[0];
  const isMe = winner?.id === player?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-body">
      <div className="relative w-full max-w-md bg-[#1e130c] border-2 border-amber-500 rounded-3xl shadow-2xl p-6 sm:p-8 text-white text-center space-y-5 animate-scale-up">
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-4xl sm:text-5xl shadow-2xl shadow-amber-500/30">
            {winner?.avatar || '👑'}
          </div>
          <div className="absolute -top-3 -right-2 bg-amber-400 text-neutral-950 p-1.5 rounded-full shadow-lg animate-bounce">
            <Crown className="w-6 h-6 fill-current" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-amber-400 uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>UNO Champion</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-neutral-100">
            {winner?.name}
          </h2>
          <p className="text-sm text-neutral-300 font-semibold mt-1">
            {isMe ? '🎉 Congratulations! You dominated the table and won the match!' : 'Has emerged victorious as the Bazaar UNO Champion!'}
          </p>
        </div>

        <button
          onClick={onLeaveRoom}
          className="w-full min-h-[46px] py-3 rounded-2xl font-black font-display text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Back to Lobby</span>
        </button>
      </div>
    </div>
  );
}
