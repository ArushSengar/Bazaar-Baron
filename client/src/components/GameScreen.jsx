import React, { useState, useEffect, useRef } from 'react';
import { Board } from './Board';
import { SidePanel } from './SidePanel';
import { PropertyDeedModal } from './PropertyDeedModal';
import { CardModal } from './CardModal';
import { AuctionModal } from './AuctionModal';
import { TradeModal } from './TradeModal';
import { BankruptcyModal } from './BankruptcyModal';
import { WinnerModal } from './WinnerModal';
import boardData from '../data/board.json';
import {
  validateBuildHouse,
  validateSellHouse,
  validateMortgage,
  validateUnmortgage
} from '../data/rules';
import {
  Crown,
  Wifi,
  LogOut,
  ArrowRight,
  Dices,
  ShoppingCart,
  Gavel,
  Handshake,
  AlertOctagon,
  Volume2,
  VolumeX,
  Sparkles,
  Layers,
  HelpCircle,
  Clock
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { AudioControls } from './AudioControls';

export function GameScreen({
  gameState,
  player,
  isHost,
  leaveRoom,
  connected,
  sendIntent,
  onOpenGuide
}) {
  const [selectedTile, setSelectedTile] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [isTradeOpen, setIsTradeOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.isMuted());
  const [showTurnBanner, setShowTurnBanner] = useState(false);
  const [mobileTab, setMobileTab] = useState('board'); // 'board' | 'panel'

  // 30-Minute Match Timer countdown
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (gameState?.phase !== 'PLAYING') return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.phase]);

  const timerExpiresAt = gameState?.timerExpiresAt || (gameState?.gameStartedAt ? gameState.gameStartedAt + 30 * 60 * 1000 : null);
  const remainingMs = timerExpiresAt ? Math.max(0, timerExpiresAt - now) : null;

  const formatTimer = (ms) => {
    if (ms === null || isNaN(ms)) return '30:00';
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = gameState?.players?.find(p => p.id === activePlayerId);
  const isMyTurn = activePlayer?.id === player?.id;
  const isInJail = Boolean(player?.inJail);
  const prevIsMyTurnRef = useRef(isMyTurn);

  // Big Sliding "YOUR TURN" Banner + Sound + Title Flash
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurnRef.current) {
      setShowTurnBanner(true);
      sounds.playYourTurnChime();
      const bannerTimer = setTimeout(() => setShowTurnBanner(false), 1400);

      // Flash tab title if backgrounded
      if (document.hidden) {
        document.title = '🔔 (YOUR TURN!) - Bazaar Baron';
      }
      return () => clearTimeout(bannerTimer);
    }
    prevIsMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);

  // Reset document title on focus
  useEffect(() => {
    const handleFocus = () => {
      document.title = 'Bazaar Baron — LAN Game';
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Dice roll handler with 800ms 3D tumble animation
  const handleRollDice = () => {
    if (!isMyTurn || gameState?.step !== 'INITIAL' || isRolling) return;
    setIsRolling(true);

    setTimeout(() => {
      sendIntent({ type: 'ROLL_DICE' });
      setIsRolling(false);
    }, 850);
  };

  const handleBuyProperty = () => {
    if (!isMyTurn || gameState?.step !== 'AWAITING_BUY') return;
    sendIntent({ type: 'BUY_PROPERTY' });
  };

  const handleStartAuction = () => {
    if (!isMyTurn || gameState?.step !== 'AWAITING_BUY') return;
    sendIntent({ type: 'DECLINE_BUY' }); // Triggers public auction
  };

  const handleDeclineBuy = () => {
    if (!isMyTurn || gameState?.step !== 'AWAITING_BUY') return;
    sendIntent({ type: 'DECLINE_BUY', skipAuction: true });
  };

  const handleEndTurn = () => {
    if (!isMyTurn || gameState?.step !== 'TURN_END') return;
    sounds.playClick();
    sendIntent({ type: 'END_TURN' });
  };

  const handlePayJailFine = () => {
    sounds.playCashChime();
    sendIntent({ type: 'PAY_JAIL_FINE' });
  };

  const handleUseJailCard = () => {
    sounds.playClick();
    sendIntent({ type: 'USE_JAIL_CARD' });
  };

  const handleBuildHouse = (tileId) => {
    sounds.playBuySound();
    sendIntent({ type: 'BUILD_HOUSE', tileId });
  };

  const handleSellHouse = (tileId) => {
    sounds.playCashChime();
    sendIntent({ type: 'SELL_HOUSE', tileId });
  };

  const handleMortgage = (tileId) => {
    sounds.playCashChime();
    sendIntent({ type: 'MORTGAGE', tileId });
  };

  const handleUnmortgage = (tileId) => {
    sounds.playCashChime();
    sendIntent({ type: 'UNMORTGAGE', tileId });
  };

  const handleDismissCard = () => {
    sendIntent({ type: 'DISMISS_CARD' });
  };

  // Stage 4 Actions
  const handleBid = (amount) => {
    sounds.playClick();
    sendIntent({ type: 'AUCTION_BID', amount });
  };

  const handleAuctionPass = () => {
    sounds.playClick();
    sendIntent({ type: 'AUCTION_PASS' });
  };

  const handleProposeTrade = (tradePayload) => {
    sendIntent({ type: 'PROPOSE_TRADE', ...tradePayload });
    setIsTradeOpen(false);
  };

  const handleAcceptTrade = () => {
    sounds.playCashChime();
    sendIntent({ type: 'ACCEPT_TRADE' });
  };

  const handleRejectTrade = () => {
    sounds.playClick();
    sendIntent({ type: 'REJECT_TRADE' });
  };

  const handleResolveDebt = () => {
    sounds.playCashChime();
    sendIntent({ type: 'RESOLVE_DEBT' });
  };

  const handleBankrupt = () => {
    if (sounds.playErrorSound) sounds.playErrorSound();
    sendIntent({ type: 'DECLARE_BANKRUPTCY' });
    sendIntent({ type: 'BANKRUPT' });
  };

  // Property Deed selection validation
  const currentLandedTile = activePlayer ? boardData[activePlayer.position] : null;
  const isOwnerOfSelected = selectedTile && gameState?.properties?.[selectedTile.id]?.ownerId === player?.id;

  const buildVal = selectedTile && isOwnerOfSelected
    ? validateBuildHouse(boardData, gameState.properties, gameState.bank?.houses, gameState.bank?.hotels, player, selectedTile.id)
    : null;

  const sellVal = selectedTile && isOwnerOfSelected
    ? validateSellHouse(boardData, gameState.properties, gameState.bank?.houses, player, selectedTile.id)
    : null;

  const mortVal = selectedTile && isOwnerOfSelected
    ? validateMortgage(boardData, gameState.properties, player, selectedTile.id)
    : null;

  const unmortVal = selectedTile && isOwnerOfSelected
    ? validateUnmortgage(boardData, gameState.properties, player, selectedTile.id)
    : null;

  const isAuctionStep = gameState?.step === 'AUCTION' && gameState?.auction;
  const hasDebt = Boolean(gameState?.debt && isMyTurn);

  return (
    <div className="h-full w-full max-w-[1880px] mx-auto p-1.5 sm:p-2.5 flex flex-col justify-between gap-1.5 sm:gap-2.5 select-none relative overflow-y-auto lg:overflow-hidden">
      {/* Sliding "YOUR TURN" Banner (1.3s Slide Across) */}
      {showTurnBanner && (
        <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none flex justify-center slide-turn-banner">
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-neutral-950 px-8 py-3 rounded-full font-display font-black text-lg sm:text-2xl shadow-2xl border-2 border-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 animate-spin" />
            <span>IT'S YOUR TURN, {player?.name?.toUpperCase()}!</span>
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-4 shadow-xl backdrop-blur shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-base sm:text-lg">
            🕌
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-neutral-100 text-sm sm:text-base font-display">Bazaar Baron</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                ROOM {gameState?.roomCode}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] text-neutral-400">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>{connected ? 'LAN Active' : 'Disconnected'}</span>
              <span>•</span>
              <span>Turn {gameState?.turnIndex + 1}</span>
            </div>
          </div>
        </div>

        {/* 30-Minute Match Countdown Timer */}
        {remainingMs !== null && (
          <div
            title="30-Minute Match Time Limit: When timer runs out, the player with the highest Total Wealth (Cash + Properties + Buildings) wins!"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-xs sm:text-sm font-number font-black shadow-inner transition-all ${
              remainingMs <= 60000
                ? 'bg-red-950/80 border-red-500/70 text-red-300 animate-pulse shadow-red-500/20'
                : remainingMs <= 300000
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300 shadow-amber-500/10'
                : 'bg-neutral-800/80 border-neutral-700/60 text-neutral-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${remainingMs <= 60000 ? 'text-red-400 animate-spin' : remainingMs <= 300000 ? 'text-amber-400' : 'text-neutral-400'}`} />
            <span>⏱️ {formatTimer(remainingMs)}</span>
            {remainingMs <= 300000 && (
              <span className="hidden md:inline text-[10px] font-bold uppercase tracking-wider text-amber-400">
                {remainingMs <= 60000 ? 'Final Minute!' : 'Wealth Decider'}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Universal Audio Controls */}
          <AudioControls compact={true} />

          {/* Rules / How to Play */}
          <button
            onClick={() => onOpenGuide?.('monopoly')}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="How to Play Bazaar Baron (or press ?)"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rules</span>
          </button>

          {/* Trade Proposal Trigger */}
          <button
            onClick={() => setIsTradeOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            <Handshake className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trade</span>
          </button>

          <button
            onClick={leaveRoom}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-700/80 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage: 11x11 Board on Left, Side Panel on Right */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-3 lg:gap-5 xl:gap-8 pb-20 lg:pb-0 w-full">
        {/* Interactive 11x11 Grid Board */}
        <div className={`w-full flex-1 flex justify-center rounded-3xl p-2 transition-all duration-500 ${isMyTurn ? 'board-turn-glow' : ''}`}>
          <Board
            gameState={gameState}
            player={player}
            isRolling={isRolling}
            onTileSelect={(tile) => setSelectedTile(tile)}
            selectedTile={selectedTile}
          />
        </div>

        {/* Side Panel: Treasury, Players Overview, Docked Action Card, Chronicles */}
        <div className="w-full lg:w-auto shrink-0 flex justify-center">
          <SidePanel
            gameState={gameState}
            player={player}
            isMyTurn={isMyTurn}
            onRoll={handleRollDice}
            onBuy={handleBuyProperty}
            onAuction={handleStartAuction}
            onDecline={handleDeclineBuy}
            onEndTurn={handleEndTurn}
            onSelectProperty={(tile) => setSelectedTile(tile)}
            onPayJailFine={handlePayJailFine}
            onUseJailCard={handleUseJailCard}
            onOpenTrade={() => setIsTradeOpen(true)}
            isRolling={isRolling}
          />
        </div>
      </div>

      {/* Mobile Sticky Quick Bar (44px+ tap targets) */}
      <div className="lg:hidden fixed bottom-2 left-2 right-2 z-40 bg-[#FCF9F2] border-2 border-[#8B5A2B]/60 rounded-2xl p-2.5 shadow-2xl backdrop-blur flex items-center justify-between gap-2 font-body text-[#1B1B1B]">
        <div className="flex items-center gap-2 pl-1">
          <span className="font-number font-black text-sm sm:text-base text-emerald-700">
            ₹{player?.cash}
          </span>
          <span className="text-[10px] text-[#554637] font-semibold">
            {isMyTurn ? '• Your turn' : `• ${activePlayer?.name}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {gameState?.step === 'INITIAL' && (
            <button
              onClick={handleRollDice}
              disabled={!isMyTurn || isRolling}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 ${
                isMyTurn && !isRolling
                  ? 'bg-[#F28C28] text-white animate-pulse cursor-pointer'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>{isInJail ? 'Doubles' : 'Roll Dice'}</span>
            </button>
          )}

          {gameState?.step === 'AWAITING_BUY' && isMyTurn && (
            <>
              <button
                onClick={handleBuyProperty}
                disabled={player?.cash < (currentLandedTile?.cost || 0)}
                className="min-h-[44px] px-4 rounded-xl text-xs font-black bg-[#2E9D5B] text-white shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Buy ₹{currentLandedTile?.cost}</span>
              </button>
              <button
                onClick={handleStartAuction}
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-[#EFE7D5] text-neutral-900 border border-[#D5C7B0] cursor-pointer"
              >
                Auction
              </button>
            </>
          )}

          {gameState?.step === 'TURN_END' && (
            <button
              onClick={handleEndTurn}
              disabled={!isMyTurn}
              className={`min-h-[44px] px-4 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md ${
                isMyTurn
                  ? 'bg-[#1F3FA8] text-white cursor-pointer active:scale-95'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>End Turn</span>
            </button>
          )}
        </div>
      </div>

      {/* Property Deed Slide-Over / Modal (Esc or Click-Outside to cancel) */}
      {selectedTile && (
        <PropertyDeedModal
          tile={selectedTile}
          propState={gameState?.properties?.[selectedTile.id]}
          ownerPlayer={
            gameState?.properties?.[selectedTile.id]?.ownerId
              ? gameState.players.find(p => p.id === gameState.properties[selectedTile.id].ownerId)
              : null
          }
          onClose={() => setSelectedTile(null)}
          onBuy={handleBuyProperty}
          canBuy={isMyTurn && gameState?.step === 'AWAITING_BUY' && selectedTile?.id === currentLandedTile?.id}
          currentCash={player?.cash}
          isOwner={isOwnerOfSelected}
          onBuildHouse={handleBuildHouse}
          onSellHouse={handleSellHouse}
          onMortgage={handleMortgage}
          onUnmortgage={handleUnmortgage}
          buildValidation={buildVal}
          sellValidation={sellVal}
          mortgageValidation={mortVal}
          unmortgageValidation={unmortVal}
        />
      )}

      {/* Card Drawn Modal (Lightweight, instant dismiss) */}
      {gameState?.drawnCard && (
        <CardModal card={gameState.drawnCard} onDismiss={handleDismissCard} />
      )}

      {/* Public Auction Modal */}
      {isAuctionStep && (
        <AuctionModal
          auction={gameState.auction}
          player={player}
          gameState={gameState}
          onBid={handleBid}
          onPass={handleAuctionPass}
        />
      )}

      {/* Trade Modal */}
      <TradeModal
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        player={player}
        gameState={gameState}
        onProposeTrade={handleProposeTrade}
        onAcceptTrade={handleAcceptTrade}
        onRejectTrade={handleRejectTrade}
      />

      {/* Bankruptcy / Debt Modal */}
      {hasDebt && (
        <BankruptcyModal
          debt={gameState.debt}
          player={player}
          gameState={gameState}
          onResolveDebt={handleResolveDebt}
          onBankrupt={handleBankrupt}
        />
      )}

      {/* Winner Screen */}
      <WinnerModal
        gameState={gameState}
        player={player}
        onLeaveRoom={leaveRoom}
      />
    </div>
  );
}
