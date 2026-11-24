import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Dices,
  LogOut,
  HelpCircle,
  Sparkles,
  Swords,
  Crown,
  Bot,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { AudioControls } from '../AudioControls';
import { ConfettiCanvas } from '../ConfettiCanvas';
import { LudoBoard } from './LudoBoard';

const COLOR_MAP = {
  red: { name: 'Ruby Red', hex: '#EF4444', badge: 'bg-red-500/20 text-red-400 border-red-500/40' },
  green: { name: 'Emerald Green', hex: '#10B981', badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' },
  yellow: { name: 'Topaz Yellow', hex: '#F59E0B', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40' },
  blue: { name: 'Sapphire Blue', hex: '#3B82F6', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/40' }
};

const DICE_DOTS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

export function LudoScreen({
  gameState,
  player,
  isHost,
  leaveRoom,
  connected,
  sendIntent,
  onOpenGuide
}) {
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const prevTurnPlayerRef = useRef(null);
  const prevLogsLengthRef = useRef(0);

  const players = gameState?.players || [];
  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const isMyTurn = Boolean(player && activePlayerId === player.id);
  const isGameOver = gameState?.phase === 'GAME_OVER';
  const winner = players.find(p => p.id === gameState?.winnerId);

  // Turn announcement chime and banner
  useEffect(() => {
    if (activePlayerId && activePlayerId !== prevTurnPlayerRef.current) {
      prevTurnPlayerRef.current = activePlayerId;
      if (player && activePlayerId === player.id) {
        sounds.playYourTurnChime?.();
        setShowTurnBanner(true);
        const timer = setTimeout(() => setShowTurnBanner(false), 2400);
        return () => clearTimeout(timer);
      }
    }
  }, [activePlayerId, player]);

  // Audio cue on captures or victory
  useEffect(() => {
    if (isGameOver && winner) {
      sounds.playVictoryFanfare?.();
    }
  }, [isGameOver, winner]);

  useEffect(() => {
    const logs = gameState?.logs || [];
    if (logs.length > prevLogsLengthRef.current) {
      const latest = logs[logs.length - 1];
      if (latest?.text?.includes('captured') || latest?.text?.includes('⚔️')) {
        sounds.playTokenCaptureSound?.();
      }
      prevLogsLengthRef.current = logs.length;
    }
  }, [gameState?.logs]);

  // Handle dice roll
  const handleRollDice = () => {
    if (!isMyTurn || gameState?.hasRolled || isRollingAnimation) return;

    sounds.playDiceRoll?.();
    setIsRollingAnimation(true);

    setTimeout(() => {
      setIsRollingAnimation(false);
      sendIntent({ type: 'ROLL_DICE' });
    }, 450);
  };

  // Handle token move
  const handleMoveToken = (tokenId) => {
    if (!isMyTurn || !gameState?.hasRolled) return;
    sendIntent({ type: 'MOVE_TOKEN', tokenId });
  };

  const myMovableTokenIds = isMyTurn ? (gameState?.movableTokenIds || []) : [];

  return (
    <div className="h-full w-full bg-[#0e0a08] text-neutral-100 font-body flex flex-col relative overflow-x-hidden overflow-y-auto">
      {/* Victory Confetti */}
      <ConfettiCanvas trigger={isGameOver} />

      {/* Header Bar */}
      <header className="bg-neutral-950/90 border-b border-neutral-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-lg shadow-md border border-emerald-400/50">
            🎲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-neutral-100 text-sm sm:text-base font-display">Bazaar Ludo</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                ROOM {gameState?.roomCode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{connected ? 'LAN Active' : 'Disconnected'}</span>
              <span>•</span>
              <span>Turn: <strong className="text-emerald-300">{activePlayer?.name || 'Waiting...'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Audio Controls */}
          <AudioControls compact={true} />

          {/* Rules / How to Play */}
          <button
            onClick={() => onOpenGuide?.('ludo')}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="How to Play Ludo (or press ?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Leave Button */}
          <button
            onClick={leaveRoom}
            className="px-2.5 py-1.5 rounded-xl border border-neutral-700/80 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Active Turn Notification Banner */}
      {showTurnBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 text-neutral-950 px-4 py-1.5 text-center text-xs sm:text-sm font-black font-display uppercase tracking-wider animate-bounce-subtle shadow-lg z-30">
          ⭐ It's Your Turn! Roll the dice! ⭐
        </div>
      )}

      {/* Main Arena Layout */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-2 sm:p-4 gap-4 max-w-[1440px] mx-auto w-full">

        {/* Left / Center: Interactive Ludo Board */}
        <div className={`flex flex-col items-center justify-center w-full lg:flex-1 min-w-0 transition-all duration-500 rounded-3xl p-2 ${
          isMyTurn ? 'board-turn-glow' : ''
        }`}>
          <LudoBoard
            gameState={gameState}
            playerId={player?.id}
            isMyTurn={isMyTurn}
            onTokenClick={handleMoveToken}
          />

          {/* Mobile Turn Indicator */}
          <div className="mt-2 text-center lg:hidden">
            <span className="text-xs text-neutral-400">
              Active: <strong className="text-amber-300">{activePlayer?.name}</strong> ({COLOR_MAP[activePlayer?.color]?.name})
            </span>
          </div>
        </div>

        {/* Right: Controls & Players Panel */}
        <div className="w-full lg:w-80 flex flex-col gap-3">

          {/* 1. Dice & Action Station */}
          <div className="bg-[#18120e] border border-amber-600/40 rounded-2xl p-4 shadow-xl flex flex-col items-center text-center">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-display">
              {isMyTurn ? 'YOUR ACTION' : `${activePlayer?.name?.toUpperCase()}'S TURN`}
            </div>

            {/* 3D Visual Die Display */}
            <div className="my-2 flex flex-col items-center">
              <button
                type="button"
                disabled={!isMyTurn || gameState?.hasRolled || isRollingAnimation}
                onClick={handleRollDice}
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-neutral-200 border-4 border-amber-400 shadow-2xl p-2 grid grid-cols-3 grid-rows-3 place-items-center transition-transform ${
                  isRollingAnimation ? 'dice-tumble-1' : ''
                } ${
                  isMyTurn && !gameState?.hasRolled
                    ? 'ring-4 ring-amber-400 animate-pulse-glow cursor-pointer hover:scale-105 active:scale-95'
                    : 'opacity-90 cursor-default'
                }`}
                title={isMyTurn && !gameState?.hasRolled ? 'Click to Roll Dice!' : 'Waiting...'}
              >
                {gameState?.diceValue ? (
                  Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full transition-opacity ${
                        DICE_DOTS[gameState.diceValue]?.includes(i) ? 'bg-neutral-900 shadow-sm opacity-100' : 'opacity-0'
                      }`}
                    />
                  ))
                ) : (
                  <Dices className="w-10 h-10 text-amber-700 col-span-3 row-span-3 animate-pulse" />
                )}
              </button>

              <div className="mt-2 text-xs font-extrabold text-neutral-300">
                {gameState?.hasRolled ? (
                  <span>Rolled a <strong className="text-amber-300 text-sm">{gameState.diceValue}</strong>!</span>
                ) : isMyTurn ? (
                  <span className="text-emerald-400 animate-pulse">👉 Click Die to Roll!</span>
                ) : (
                  <span className="text-neutral-500">Waiting for roll...</span>
                )}
              </div>

              {/* Consecutive 6s Tracker */}
              {gameState?.consecutiveSixes > 0 && (
                <div className="mt-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  🔥 {gameState.consecutiveSixes}/3 Consecutive Sixes!
                </div>
              )}
            </div>

            {/* Quick Token Move Buttons */}
            {isMyTurn && gameState?.hasRolled && myMovableTokenIds.length > 0 && (
              <div className="w-full mt-3 pt-3 border-t border-neutral-800">
                <div className="text-[11px] text-emerald-400 font-bold mb-2">
                  Select a token to move:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {myMovableTokenIds.map(tid => {
                    const token = player?.tokens?.find(t => t.id === tid);
                    return (
                      <button
                        key={tid}
                        onClick={() => handleMoveToken(tid)}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs font-display flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Token #{tid + 1}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isMyTurn && gameState?.hasRolled && myMovableTokenIds.length === 0 && (
              <div className="mt-2 text-[11px] text-neutral-400 italic">
                No valid moves available. Passing turn...
              </div>
            )}
          </div>

          {/* 2. Players Standing & Progress */}
          <div className="bg-[#18120e] border border-neutral-800 rounded-2xl p-3 shadow-lg">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-display flex items-center justify-between">
              <span>Merchants ({players.length}/4)</span>
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
            </h3>

            <div className="space-y-1.5">
              {players.map((p) => {
                const isActive = p.id === activePlayerId;
                const isMe = p.id === player?.id;
                const colorInfo = COLOR_MAP[p.color] || COLOR_MAP.red;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30'
                        : 'bg-neutral-900/60 border-neutral-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border border-white/60 shadow-sm"
                        style={{ backgroundColor: colorInfo.hex }}
                      />
                      <span className="text-base">{p.avatar || '👳'}</span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isActive ? 'text-amber-200' : 'text-neutral-200'}`}>
                            {p.name}
                          </span>
                          {isMe && <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 rounded">YOU</span>}
                          {p.isBot && <Bot className="w-3 h-3 text-neutral-400" />}
                        </div>
                        <span className="text-[10px] text-neutral-400">{colorInfo.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-950/70 px-2 py-1 rounded-lg border border-neutral-800">
                      <span className="text-xs font-black text-amber-400 font-display">
                        {p.completedTokens || 0}/4
                      </span>
                      <span className="text-[10px]">🏆</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Event Log Feed */}
          <div className="bg-[#18120e] border border-neutral-800 rounded-2xl p-3 shadow-lg flex-1 max-h-48 overflow-y-auto">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display">
              Bazaar Chronicle
            </h4>
            <div className="space-y-1 text-[11px] text-neutral-300">
              {(gameState?.logs || []).slice(-6).map((log, i) => (
                <div key={log.id || i} className="leading-tight py-0.5 border-b border-neutral-900 last:border-none">
                  {log.text}
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      {/* Victory Modal */}
      {isGameOver && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#1c140f] border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-scale-up">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl">
              🏆
            </div>
            <h2 className="text-2xl font-black font-display text-amber-300 uppercase tracking-tight">
              Bazaar Victory!
            </h2>
            <p className="text-sm text-neutral-300 mt-1">
              <strong className="text-white">{winner.name}</strong> has guided all 4 royal tokens home!
            </p>

            <div className="my-5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center gap-3">
              <span className="text-3xl">{winner.avatar}</span>
              <div className="text-left">
                <div className="text-sm font-bold text-neutral-100">{winner.name}</div>
                <div className="text-xs text-amber-400">Champion of Bazaar Ludo</div>
              </div>
            </div>

            <button
              onClick={leaveRoom}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black font-display shadow-lg cursor-pointer"
            >
              Return to Arcade Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LudoScreen;
