import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy,
  Dices,
  LogOut,
  HelpCircle,
  Sparkles,
  Bot,
  User,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { sounds } from '../../utils/audio';
import { AudioControls } from '../AudioControls';
import { ConfettiCanvas } from '../ConfettiCanvas';

// Standard 8 Ladders (start < end)
const LADDERS = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91
};

// Standard 8 Snakes (head > tail)
const SNAKES = {
  17: 7,
  54: 34,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  99: 78
};

const DICE_DOTS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

/**
 * Maps tile 1..100 to 10x10 serpentine grid coordinates { col: 0..9, row: 0..9 }
 * Tile 1 = bottom-left (col 0, row 9)
 * Tile 10 = bottom-right (col 9, row 9)
 * Tile 11 = row 8, col 9 (boustrophedon turn)
 * Tile 100 = top-left (col 0, row 0)
 */
export function getTileCoordinates(n) {
  if (n < 1 || n > 100) return { col: 0, row: 9 };
  const rowFromBottom = Math.floor((n - 1) / 10);
  const row = 9 - rowFromBottom;
  const isEvenRow = rowFromBottom % 2 === 0;
  const col = isEvenRow ? (n - 1) % 10 : 9 - ((n - 1) % 10);
  return { col, row };
}

export function SnakesScreen({
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
  const prevLastMoveRef = useRef(null);

  const players = gameState?.players || [];
  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const isMyTurn = Boolean(player && activePlayerId === player.id);
  const isGameOver = gameState?.phase === 'GAME_OVER';
  const winner = players.find(p => p.id === gameState?.winnerId);

  // Turn chime and banner
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

  // Audio cues on special events: ladder climb, snake bite, game over
  useEffect(() => {
    const move = gameState?.lastMove;
    if (move && move !== prevLastMoveRef.current) {
      prevLastMoveRef.current = move;
      if (move.ladder) {
        sounds.playCashChime?.();
      } else if (move.snake) {
        sounds.playErrorSound?.();
      }
    }
  }, [gameState?.lastMove]);

  useEffect(() => {
    if (isGameOver && winner) {
      sounds.playVictoryFanfare?.();
    }
  }, [isGameOver, winner]);

  // Roll dice intent
  const handleRollDice = () => {
    if (!isMyTurn || isRollingAnimation || isGameOver) return;

    sounds.playDiceRoll?.();
    setIsRollingAnimation(true);

    setTimeout(() => {
      setIsRollingAnimation(false);
      sendIntent({ type: 'ROLL_DICE' });
    }, 450);
  };

  // Group pawns by position to cluster overlapping tokens
  const positionPawnMap = new Map();
  players.forEach(p => {
    const pos = p.position || 0;
    if (!positionPawnMap.has(pos)) {
      positionPawnMap.set(pos, []);
    }
    positionPawnMap.get(pos).push(p);
  });

  return (
    <div className="min-h-screen bg-[#0d0d12] text-neutral-100 font-body flex flex-col relative overflow-x-hidden">
      {/* Victory Celebration Confetti */}
      <ConfettiCanvas trigger={isGameOver} />

      {/* Header */}
      <header className="bg-neutral-950/90 border-b border-neutral-800 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center text-lg shadow-md border border-purple-400/50">
            🐍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-neutral-100 text-sm sm:text-base font-display">Snakes & Ladders</span>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                ROOM {gameState?.roomCode}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{connected ? 'LAN Active' : 'Disconnected'}</span>
              <span>•</span>
              <span>Turn: <strong className="text-purple-300">{activePlayer?.name || 'Waiting...'}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Audio Controls */}
          <AudioControls compact={true} />

          {/* Rules / How to Play */}
          <button
            onClick={() => onOpenGuide?.('snakes_and_ladders')}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title="How to Play Snakes & Ladders (or press ?)"
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
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white px-4 py-1.5 text-center text-xs sm:text-sm font-black font-display uppercase tracking-wider animate-bounce-subtle shadow-lg z-30">
          🎲 It's Your Turn! Roll the die to advance! 🎲
        </div>
      )}

      {/* Main Arena */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-2 sm:p-4 gap-4 max-w-7xl mx-auto w-full">

        {/* Board Container */}
        <div className={`flex flex-col items-center justify-center w-full lg:w-auto transition-all duration-500 rounded-3xl p-2 ${
          isMyTurn ? 'board-turn-glow' : ''
        }`}>

          <div className="relative w-full max-w-[560px] aspect-square select-none p-1 sm:p-2">
            <div className="w-full h-full bg-[#18161f] border-4 border-purple-500/80 rounded-2xl shadow-2xl relative overflow-hidden">

              {/* 10x10 Grid Cells */}
              <div className="w-full h-full grid grid-cols-10 grid-rows-10">
                {Array.from({ length: 100 }).map((_, i) => {
                  const tileNum = i + 1;
                  const { col, row } = getTileCoordinates(tileNum);
                  const isEvenTile = (col + row) % 2 === 0;

                  const isLadderStart = LADDERS[tileNum] !== undefined;
                  const isSnakeHead = SNAKES[tileNum] !== undefined;
                  const isVictoryTile = tileNum === 100;

                  return (
                    <div
                      key={`tile-${tileNum}`}
                      style={{
                        gridColumnStart: col + 1,
                        gridRowStart: row + 1
                      }}
                      className={`relative border border-neutral-800/60 p-1 flex flex-col justify-between transition-colors ${
                        isVictoryTile
                          ? 'bg-gradient-to-br from-amber-500/40 to-yellow-600/40 border-amber-400'
                          : isLadderStart
                          ? 'bg-emerald-950/40 border-emerald-500/50'
                          : isSnakeHead
                          ? 'bg-rose-950/40 border-rose-500/50'
                          : isEvenTile
                          ? 'bg-[#201d29]'
                          : 'bg-[#1b1924]'
                      }`}
                    >
                      {/* Tile Number Label */}
                      <span className={`text-[9px] sm:text-[11px] font-mono font-bold leading-none ${
                        isVictoryTile
                          ? 'text-amber-300 font-black'
                          : isLadderStart
                          ? 'text-emerald-400'
                          : isSnakeHead
                          ? 'text-rose-400'
                          : 'text-neutral-400'
                      }`}>
                        {tileNum}
                      </span>

                      {/* Special Tile Indicators */}
                      {isVictoryTile && (
                        <div className="self-center mb-1">
                          <Trophy className="w-4 h-4 text-amber-300 animate-pulse" />
                        </div>
                      )}
                      {isLadderStart && (
                        <span className="text-[10px] sm:text-xs self-end drop-shadow">🪜</span>
                      )}
                      {isSnakeHead && (
                        <span className="text-[10px] sm:text-xs self-end drop-shadow">🐍</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* SVG Overlay for Visual Snakes and Ladders Paths */}
              <svg
                viewBox="0 0 1000 1000"
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              >
                <defs>
                  {/* Ladder Gradient */}
                  <linearGradient id="ladderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Snake Gradient */}
                  <linearGradient id="snakeSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F87171" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#DC2626" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#991B1B" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Filter for glowing paths */}
                  <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.8" />
                  </filter>
                </defs>

                {/* Draw 8 Ladders */}
                {Object.entries(LADDERS).map(([startStr, endNum]) => {
                  const startNum = parseInt(startStr, 10);
                  const c1 = getTileCoordinates(startNum);
                  const c2 = getTileCoordinates(endNum);

                  const x1 = c1.col * 100 + 50;
                  const y1 = c1.row * 100 + 50;
                  const x2 = c2.col * 100 + 50;
                  const y2 = c2.row * 100 + 50;

                  // Perpendicular offset for double rails
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const ox = (-dy / len) * 10;
                  const oy = (dx / len) * 10;

                  const rungsCount = Math.max(3, Math.floor(len / 35));

                  return (
                    <g key={`ladder-${startNum}`} filter="url(#glowEffect)">
                      {/* Left Rail */}
                      <line
                        x1={x1 + ox}
                        y1={y1 + oy}
                        x2={x2 + ox}
                        y2={y2 + oy}
                        stroke="url(#ladderGlow)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      {/* Right Rail */}
                      <line
                        x1={x1 - ox}
                        y1={y1 - oy}
                        x2={x2 - ox}
                        y2={y2 - oy}
                        stroke="url(#ladderGlow)"
                        strokeWidth="5"
                        strokeLinecap="round"
                      />
                      {/* Rungs */}
                      {Array.from({ length: rungsCount }).map((_, rIdx) => {
                        const t = (rIdx + 1) / (rungsCount + 1);
                        const rx = x1 + dx * t;
                        const ry = y1 + dy * t;
                        return (
                          <line
                            key={rIdx}
                            x1={rx + ox}
                            y1={ry + oy}
                            x2={rx - ox}
                            y2={ry - oy}
                            stroke="#A7F3D0"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Draw 8 Snakes */}
                {Object.entries(SNAKES).map(([headStr, tailNum]) => {
                  const headNum = parseInt(headStr, 10);
                  const c1 = getTileCoordinates(headNum);
                  const c2 = getTileCoordinates(tailNum);

                  const x1 = c1.col * 100 + 50;
                  const y1 = c1.row * 100 + 50;
                  const x2 = c2.col * 100 + 50;
                  const y2 = c2.row * 100 + 50;

                  // Wavy curved path between head and tail
                  const midX = (x1 + x2) / 2 + (y1 > y2 ? 60 : -60);
                  const midY = (y1 + y2) / 2 + 30;

                  return (
                    <g key={`snake-${headNum}`} filter="url(#glowEffect)">
                      {/* Snake Body */}
                      <path
                        d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                        stroke="url(#snakeSkin)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Snake Inner Pattern */}
                      <path
                        d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
                        stroke="#FCA5A5"
                        strokeWidth="2.5"
                        strokeDasharray="4 6"
                        strokeLinecap="round"
                        fill="none"
                      />
                      {/* Snake Head */}
                      <circle cx={x1} cy={y1} r="9" fill="#B91C1C" stroke="#FEE2E2" strokeWidth="2" />
                      <circle cx={x1 - 3} cy={y1 - 2} r="2" fill="#FDE047" />
                      <circle cx={x1 + 3} cy={y1 - 2} r="2" fill="#FDE047" />
                      {/* Snake Tail */}
                      <circle cx={x2} cy={y2} r="4" fill="#991B1B" />
                    </g>
                  );
                })}
              </svg>

              {/* Pawns Layer with CSS Transitions */}
              {Array.from(positionPawnMap.entries()).map(([pos, occupants]) => {
                const totalInCell = occupants.length;

                return occupants.map((p, idx) => {
                  const isAtYard = pos === 0;
                  const coords = isAtYard ? { col: idx * 1.5 + 0.5, row: 9.6 } : getTileCoordinates(pos);

                  // Percentage placement
                  let leftPct = ((coords.col + 0.5) / 10) * 100;
                  let topPct = ((coords.row + 0.5) / 10) * 100;

                  // Radial offset when sharing cell
                  let offsetX = 0;
                  let offsetY = 0;
                  if (!isAtYard && totalInCell > 1) {
                    const angle = (idx / totalInCell) * 2 * Math.PI;
                    offsetX = Math.cos(angle) * 7;
                    offsetY = Math.sin(angle) * 7;
                  }

                  const isActive = p.id === activePlayerId;

                  return (
                    <div
                      key={p.id}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                        transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                        backgroundColor: p.color || '#8B5CF6',
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                      }}
                      className={`absolute z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${
                        isActive
                          ? 'ring-4 ring-amber-300 scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse-glow z-30'
                          : 'opacity-90'
                      }`}
                      title={`${p.name} - Tile ${pos}`}
                    >
                      <span className="text-[10px] sm:text-xs font-black text-white drop-shadow">
                        {p.avatar || '♟️'}
                      </span>
                    </div>
                  );
                });
              })}

            </div>
          </div>

        </div>

        {/* Right Station: Controls & Leaderboard */}
        <div className="w-full lg:w-80 flex flex-col gap-3">

          {/* 1. Dice & Action Station */}
          <div className="bg-[#181622] border border-purple-500/40 rounded-2xl p-4 shadow-xl flex flex-col items-center text-center">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-display">
              {isMyTurn ? 'YOUR TURN' : `${activePlayer?.name?.toUpperCase()}'S TURN`}
            </div>

            {/* 3D Visual Die */}
            <div className="my-2 flex flex-col items-center">
              <button
                type="button"
                disabled={!isMyTurn || isRollingAnimation || isGameOver}
                onClick={handleRollDice}
                className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-neutral-200 border-4 border-purple-400 shadow-2xl p-2 grid grid-cols-3 grid-rows-3 place-items-center transition-transform ${
                  isRollingAnimation ? 'dice-tumble-1' : ''
                } ${
                  isMyTurn && !isGameOver
                    ? 'ring-4 ring-purple-400 animate-pulse-glow cursor-pointer hover:scale-105 active:scale-95'
                    : 'opacity-80 cursor-default'
                }`}
                title={isMyTurn ? 'Click to Roll Dice!' : 'Waiting...'}
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
                  <Dices className="w-10 h-10 text-purple-700 col-span-3 row-span-3 animate-pulse" />
                )}
              </button>

              <div className="mt-2 text-xs font-extrabold text-neutral-200">
                {gameState?.hasRolled ? (
                  <span>Rolled a <strong className="text-amber-300 text-sm">{gameState.diceValue}</strong>!</span>
                ) : isMyTurn ? (
                  <span className="text-purple-300 animate-pulse">👉 Click Die to Roll!</span>
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

            {/* Move Announcement Banner */}
            {gameState?.lastMove && (
              <div className="w-full mt-2 pt-2 border-t border-neutral-800">
                {gameState.lastMove.ladder && (
                  <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce-subtle">
                    <TrendingUp className="w-4 h-4" />
                    <span>🪜 SOAR! Climbed ladder to {gameState.lastMove.to}!</span>
                  </div>
                )}
                {gameState.lastMove.snake && (
                  <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 animate-bounce-subtle">
                    <TrendingDown className="w-4 h-4" />
                    <span>🐍 OUCH! Bitten, slithered to {gameState.lastMove.to}!</span>
                  </div>
                )}
                {gameState.lastMove.overshoot && (
                  <div className="bg-amber-500/15 border border-amber-500/30 text-amber-300 p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>⚠️ Overshot 100! Exact roll required to win.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Standings & Positions */}
          <div className="bg-[#181622] border border-neutral-800 rounded-2xl p-3 shadow-lg">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2 font-display flex items-center justify-between">
              <span>Race Standings</span>
              <Trophy className="w-3.5 h-3.5 text-purple-400" />
            </h3>

            <div className="space-y-1.5">
              {[...players]
                .sort((a, b) => (b.position || 0) - (a.position || 0))
                .map((p, rank) => {
                  const isActive = p.id === activePlayerId;
                  const isMe = p.id === player?.id;
                  const pos = p.position || 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl border transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-purple-500/15 border-purple-400 ring-2 ring-purple-400/30'
                          : 'bg-neutral-900/60 border-neutral-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-500 w-4">
                          #{rank + 1}
                        </span>
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm"
                          style={{ backgroundColor: p.color || '#8B5CF6' }}
                        />
                        <span className="text-base">{p.avatar || '👳'}</span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isActive ? 'text-purple-200' : 'text-neutral-200'}`}>
                              {p.name}
                            </span>
                            {isMe && <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1 rounded">YOU</span>}
                            {p.isBot && <Bot className="w-3 h-3 text-neutral-400" />}
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, pos)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-neutral-950/70 px-2 py-1 rounded-lg border border-neutral-800">
                        <span className="text-xs font-black text-amber-400 font-display">
                          {pos}/100
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 3. Event Log Feed */}
          <div className="bg-[#181622] border border-neutral-800 rounded-2xl p-3 shadow-lg flex-1 max-h-44 overflow-y-auto">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5 font-display">
              Chronicle
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

      {/* Victory Celebration Modal */}
      {isGameOver && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1c1826] border-2 border-purple-400 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-scale-up">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-3xl">
              🏆
            </div>
            <h2 className="text-2xl font-black font-display text-purple-300 uppercase tracking-tight">
              Summit Reached!
            </h2>
            <p className="text-sm text-neutral-300 mt-1">
              <strong className="text-white">{winner.name}</strong> reached Tile 100 and conquered the mountain!
            </p>

            <div className="my-5 p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center gap-3">
              <span className="text-3xl">{winner.avatar}</span>
              <div className="text-left">
                <div className="text-sm font-bold text-neutral-100">{winner.name}</div>
                <div className="text-xs text-purple-400">Master of Snakes & Ladders</div>
              </div>
            </div>

            <button
              onClick={leaveRoom}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-black font-display shadow-lg cursor-pointer"
            >
              Return to Arcade Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnakesScreen;
