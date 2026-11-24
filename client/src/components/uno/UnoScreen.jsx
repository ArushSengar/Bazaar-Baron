import React, { useState, useEffect } from 'react';
import { UnoCard } from './UnoCard';
import { WildColorModal } from './WildColorModal';
import { UnoRoundWinnerModal, UnoWinnerModal } from './UnoModals';
import { canPlayUnoCard } from '../../data/unoRules';
import { UNO_COLOR_HEX } from '../../data/unoConstants';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  LogOut,
  Flame,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Bot
} from 'lucide-react';
import { sounds } from '../../utils/audio';

export function UnoScreen({
  gameState,
  player,
  isHost,
  leaveRoom,
  connected,
  sendIntent
}) {
  const [selectedWildCard, setSelectedWildCard] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTurnBanner, setShowTurnBanner] = useState(false);

  const activePlayerIndex = gameState?.turnIndex ?? 0;
  const activePlayer = gameState?.players?.[activePlayerIndex];
  const isMyTurn = activePlayer?.id === player?.id;
  const myPlayerState = gameState?.players?.find(p => p.id === player?.id);
  const myHand = myPlayerState?.cards || [];
  const topDiscard = gameState?.discardPile?.[gameState.discardPile.length - 1];
  const activeColor = gameState?.activeColor || topDiscard?.color || 'red';
  const isClockwise = (gameState?.direction ?? 1) === 1;

  // Flash turn notification banner
  useEffect(() => {
    if (isMyTurn) {
      setShowTurnBanner(true);
      sounds.playClick();
      const t = setTimeout(() => setShowTurnBanner(false), 1400);
      return () => clearTimeout(t);
    }
  }, [isMyTurn]);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleCardClick = (card) => {
    if (!isMyTurn) return;

    if (!canPlayUnoCard(card, topDiscard, activeColor)) {
      sounds.playErrorSound();
      return;
    }

    // If Wild card, prompt for color choice
    if (card.color === 'wild' || card.type === 'wild' || card.type === 'wild4') {
      setSelectedWildCard(card);
      return;
    }

    // Normal play
    sounds.playBuySound();
    sendIntent({
      type: 'PLAY_CARD',
      cardId: card.id,
      calledUno: myHand.length === 2 ? myPlayerState?.calledUno : false
    });
  };

  const handleSelectWildColor = (chosenColor) => {
    if (!selectedWildCard) return;

    sounds.playBuySound();
    sendIntent({
      type: 'PLAY_CARD',
      cardId: selectedWildCard.id,
      chosenColor,
      calledUno: myHand.length === 2 ? myPlayerState?.calledUno : false
    });

    setSelectedWildCard(null);
  };

  const handleDrawCard = () => {
    if (!isMyTurn || gameState?.hasDrawnThisTurn) return;
    sounds.playCashChime();
    sendIntent({ type: 'DRAW_CARD' });
  };

  const handlePassTurn = () => {
    if (!isMyTurn || !gameState?.hasDrawnThisTurn) return;
    sounds.playClick();
    sendIntent({ type: 'PASS_TURN' });
  };

  const handleCallUno = () => {
    sounds.playCashChime();
    sendIntent({ type: 'CALL_UNO' });
  };

  const handleCatchUno = (targetPlayerId) => {
    sounds.playErrorSound();
    sendIntent({ type: 'CATCH_UNO', targetPlayerId });
  };

  const handleStartNextRound = () => {
    sendIntent({ type: 'START_NEXT_ROUND' });
  };

  const opponents = (gameState?.players || []).filter(p => p.id !== player?.id);
  const activeColorHex = UNO_COLOR_HEX[activeColor] || '#EA3223';

  return (
    <div className="h-full w-full max-w-[1880px] mx-auto p-1.5 sm:p-3 flex flex-col justify-between select-none relative overflow-hidden font-body text-neutral-100">
      {/* Turn Banner */}
      {showTurnBanner && (
        <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none flex justify-center slide-turn-banner">
          <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-neutral-950 px-8 py-2.5 rounded-full font-display font-black text-lg sm:text-2xl shadow-2xl border-2 border-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 animate-spin" />
            <span>IT'S YOUR TURN, {player?.name?.toUpperCase()}!</span>
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
        </div>
      )}

      {/* 1. Header Bar */}
      <header className="bg-neutral-950/85 border border-neutral-800 rounded-2xl px-3 sm:px-4 py-2 flex items-center justify-between shadow-xl backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-500 via-amber-500 to-blue-500 flex items-center justify-center text-lg shadow-md font-display font-black text-white">
            🃏
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm sm:text-base tracking-wide text-neutral-100">
                Bazaar UNO
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                ROOM {gameState?.roomCode}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{connected ? 'LAN Active' : 'Offline'}</span>
              <span>•</span>
              <span>Target: {gameState?.targetScore} pts</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-neutral-800"
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* 2. Opponents Ring (Top & Sides) */}
      <div className="py-2 px-1 flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto shrink-0 scrollbar-none">
        {opponents.map((opp) => {
          const isActive = opp.id === activePlayer?.id;
          const hasOneCard = opp.cards.length === 1;
          const isVulnerable = hasOneCard && !opp.calledUno;

          return (
            <div
              key={opp.id}
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 min-w-[100px] sm:min-w-[120px] ${
                isActive
                  ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/20 ring-1 ring-amber-400/50'
                  : 'bg-neutral-950/70 border-neutral-800'
              }`}
            >
              <div className="relative">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-xl shadow-inner">
                  {opp.avatar || '🧑'}
                </div>
                {opp.isBot && (
                  <div className="absolute -top-1 -right-1 bg-purple-600 text-white rounded-full p-0.5">
                    <Bot className="w-2.5 h-2.5" />
                  </div>
                )}
                {opp.calledUno && (
                  <div className="absolute -bottom-1 -right-2 bg-gradient-to-r from-amber-500 to-red-500 text-neutral-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-white animate-bounce-subtle">
                    UNO!
                  </div>
                )}
              </div>

              <div className="text-center leading-tight">
                <div className="text-xs font-bold text-neutral-200 truncate max-w-[90px]">
                  {opp.name}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono">
                  {opp.score || 0} pts
                </div>
              </div>

              {/* Opponent Card Stack */}
              <div className="flex items-center gap-1 bg-neutral-900 px-2 py-0.5 rounded-full border border-neutral-800">
                <Layers className="w-3 h-3 text-amber-400" />
                <span className="text-xs font-number font-black text-neutral-100">
                  {opp.cards.length} cards
                </span>
              </div>

              {/* Catch UNO Penalty Trigger */}
              {isVulnerable && (
                <button
                  onClick={() => handleCatchUno(opp.id)}
                  className="px-2 py-0.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase shadow-md active:scale-95 transition-all cursor-pointer animate-pulse flex items-center gap-1"
                  title="Player has 1 card but didn't call UNO! Click to give 2 penalty cards."
                >
                  <ShieldAlert className="w-3 h-3" />
                  <span>Catch!</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Center Table: Draw Pile, Discard Pile & Active Color Ring */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative w-full max-w-lg aspect-[16/9] sm:aspect-[2/1] rounded-3xl bg-[#13281e] border-4 border-[#244b38] shadow-2xl p-4 flex items-center justify-around overflow-hidden">
          {/* Center Table Texture Watermark */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
            <span className="font-display font-black text-6xl sm:text-8xl tracking-widest text-white">
              UNO
            </span>
          </div>

          {/* Turn Direction Arc */}
          <div className="absolute top-2.5 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10 text-[10px] uppercase font-bold text-neutral-300">
            <RotateCcw className={`w-3.5 h-3.5 ${isClockwise ? 'transform scale-x-[-1]' : ''}`} />
            <span>{isClockwise ? 'Clockwise ↻' : 'Counter-Clockwise ↺'}</span>
          </div>

          {/* DRAW PILE */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDrawCard}
              disabled={!isMyTurn || gameState?.hasDrawnThisTurn}
              className={`relative cursor-pointer transition-all ${
                isMyTurn && !gameState?.hasDrawnThisTurn
                  ? 'hover:scale-105 active:scale-95 animate-pulse-glow'
                  : 'opacity-85'
              }`}
              title="Draw 1 card from deck"
            >
              <UnoCard isBack={true} />
              <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                <span className="bg-neutral-950/90 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  {gameState?.deck?.length || 0} left
                </span>
              </div>
            </button>
            <span className="text-[11px] font-bold text-neutral-400 mt-1">
              Draw Pile
            </span>
          </div>

          {/* ACTIVE COLOR & DISCARD PILE */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              {/* Outer Glowing Active Color Halo */}
              <div
                className="absolute -inset-2 rounded-2xl opacity-60 blur-md transition-colors duration-300 pointer-events-none"
                style={{ backgroundColor: activeColorHex }}
              />

              {/* Top Discard Card */}
              {topDiscard ? (
                <UnoCard card={topDiscard} isPlayable={false} />
              ) : (
                <div className="w-20 h-28 rounded-xl border-2 border-dashed border-neutral-600 flex items-center justify-center text-xs text-neutral-500">
                  Empty
                </div>
              )}

              {/* Active Color Badge */}
              <div
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-black uppercase font-display"
                style={{ backgroundColor: activeColorHex }}
                title={`Active Color: ${activeColor.toUpperCase()}`}
              >
                {activeColor[0].toUpperCase()}
              </div>
            </div>

            <span className="text-[11px] font-bold text-neutral-300 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColorHex }} />
              <span>Color: {activeColor.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Turn Status Message */}
        <div className="mt-2 text-center">
          <div className="text-xs sm:text-sm font-bold text-neutral-200">
            {isMyTurn ? (
              <span className="text-amber-400">Your Turn: Play a matching card or draw</span>
            ) : (
              <span>Waiting for {activePlayer?.name || 'player'}...</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Player Hand & Action Hub (Bottom) */}
      <div className="bg-neutral-950/90 border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-200">
              Your Cards ({myHand.length})
            </span>
            {myPlayerState?.calledUno && (
              <span className="bg-gradient-to-r from-amber-500 to-red-500 text-neutral-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-white">
                UNO CALLED 🔥
              </span>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            {isMyTurn && gameState?.hasDrawnThisTurn && (
              <button
                onClick={handlePassTurn}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 cursor-pointer shadow active:scale-95 flex items-center gap-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Pass Turn</span>
              </button>
            )}

            {/* CALL UNO BUTTON */}
            <button
              onClick={handleCallUno}
              disabled={myHand.length > 2}
              className={`px-4 py-1.5 rounded-xl font-display font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-1.5 ${
                myHand.length <= 2
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-red-500 text-neutral-950 cursor-pointer hover:scale-105 active:scale-95 animate-pulse border border-white'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/60'
              }`}
              title="Call UNO when you hold 2 or 1 card!"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>CALL UNO!</span>
            </button>
          </div>
        </div>

        {/* Hand Cards Horizontal Scroll / Fan */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto p-1.5 pt-3 pb-2 scrollbar-thin">
          {myHand.map((card) => {
            const playable = isMyTurn && canPlayUnoCard(card, topDiscard, activeColor);

            return (
              <div key={card.id} className="shrink-0">
                <UnoCard
                  card={card}
                  isPlayable={playable}
                  onClick={() => handleCardClick(card)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Wild Color Selection Modal */}
      <WildColorModal
        isOpen={Boolean(selectedWildCard)}
        onSelectColor={handleSelectWildColor}
        onClose={() => setSelectedWildCard(null)}
      />

      {/* Round Winner Modal */}
      <UnoRoundWinnerModal
        gameState={gameState}
        player={player}
        isHost={isHost}
        onNextRound={handleStartNextRound}
      />

      {/* Game Match Champion Modal */}
      <UnoWinnerModal
        gameState={gameState}
        player={player}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}
