import React, { useState, useEffect, useRef } from 'react';
import { Tile } from './Tile';
import { DiceDisplay } from './Dice';
import { DeedCard } from './DeedCard';
import boardData from '../data/board.json';
import { Sparkles, HelpCircle, Gift, ScrollText, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

export function Board({
  gameState,
  player,
  isRolling = false,
  onTileSelect,
  selectedTile
}) {
  const [hoveredTile, setHoveredTile] = useState(null);
  const [activeFlippedCard, setActiveFlippedCard] = useState(null);
  const [animatedPositions, setAnimatedPositions] = useState({});
  const [floatingSalary, setFloatingSalary] = useState(null);
  const prevPositionsRef = useRef({});

  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = gameState?.players?.find(p => p.id === activePlayerId);
  const landedTileId = activePlayer ? activePlayer.position : null;

  // Step-by-step token movement animation (~120ms per step)
  useEffect(() => {
    if (!gameState?.players) return;

    gameState.players.forEach(p => {
      const prev = prevPositionsRef.current[p.id];
      const target = p.position;

      if (prev === undefined) {
        prevPositionsRef.current[p.id] = target;
        setAnimatedPositions(cur => ({ ...cur, [p.id]: target }));
      } else if (prev !== target) {
        // Run step-by-step hops
        let currentPos = prev;
        const totalSteps = (target - prev + 40) % 40;
        let stepCount = 0;

        const interval = setInterval(() => {
          stepCount++;
          currentPos = (currentPos + 1) % 40;

          if (currentPos === 0) {
            // Passed Go!
            sounds.playCashChime();
            setFloatingSalary({ id: Date.now(), text: '+₹200 Salary!' });
            setTimeout(() => setFloatingSalary(null), 1800);
          } else {
            sounds.playClick();
          }

          setAnimatedPositions(cur => ({ ...cur, [p.id]: currentPos }));

          if (stepCount >= totalSteps || currentPos === target) {
            clearInterval(interval);
            prevPositionsRef.current[p.id] = target;
            setAnimatedPositions(cur => ({ ...cur, [p.id]: target }));
          }
        }, 120);
      }
    });
  }, [gameState?.players]);

  // Handle card flip preview when a card is drawn
  useEffect(() => {
    if (gameState?.drawnCard) {
      setActiveFlippedCard(gameState.drawnCard);
      sounds.playCashChime();
      const timer = setTimeout(() => {
        // Keep active or fade out after 4s
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setActiveFlippedCard(null);
    }
  }, [gameState?.drawnCard]);

  // Last 4 log entries for center live feed
  const logs = gameState?.logs || [];
  const recentLogs = logs.slice(-4).reverse();

  // Find owner of hovered tile
  const hoveredPropState = hoveredTile ? gameState?.properties?.[hoveredTile.id] : null;
  const hoveredOwner = hoveredPropState?.ownerId
    ? gameState?.players?.find(p => p.id === hoveredPropState.ownerId)
    : null;

  return (
    <div className="relative w-full max-w-[98vw] lg:max-w-[min(90vh,60vw)] xl:max-w-[min(92vh,62vw)] 2xl:max-w-[min(94vh,64vw)] aspect-square mx-auto p-1 sm:p-2 tabletop-board rounded-2xl border-2 border-[#1B1B1B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] select-none">
      {/* 11x11 Grid Board with 1.6x Corners and Quad-fold Creases */}
      <div
        className="w-full h-full relative rounded-xl border border-[#1B1B1B] bg-[#1B1B1B] overflow-hidden [container-type:inline-size]"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr repeat(9, 1fr) 1.6fr',
          gridTemplateRows: '1.6fr repeat(9, 1fr) 1.6fr',
          gap: '1px'
        }}
      >
        {/* Quad-Fold Physical Crease Lines */}
        <div className="board-crease-h z-20 pointer-events-none" />
        <div className="board-crease-v z-20 pointer-events-none" />

        {/* Floating Salary Notification over Tile 0 (Start) */}
        {floatingSalary && (
          <div className="absolute bottom-4 right-4 z-50 float-up-salary pointer-events-none">
            <div className="bg-emerald-600 text-white font-display font-black text-xs sm:text-sm px-3 py-1.5 rounded-full shadow-2xl border-2 border-emerald-300 flex items-center gap-1.5">
              <span>💰</span>
              <span>{floatingSalary.text}</span>
            </div>
          </div>
        )}

        {/* 40 Perimeter Tiles */}
        {boardData.map((tile) => {
          const propState = gameState?.properties?.[tile.id];
          const ownerPlayer = propState?.ownerId
            ? gameState?.players?.find(p => p.id === propState.ownerId)
            : null;

          // Render players using animated positions
          const playersOnTile = (gameState?.players || []).filter(
            p => !p.bankrupt && (animatedPositions[p.id] ?? p.position) === tile.id
          );

          const isLandedOn = landedTileId === tile.id;

          return (
            <Tile
              key={tile.id}
              tile={tile}
              propState={propState}
              playersOnTile={playersOnTile}
              ownerPlayer={ownerPlayer}
              isLandedOn={isLandedOn}
              onSelect={onTileSelect}
              onHover={(t) => setHoveredTile(t)}
              onLeave={() => setHoveredTile(null)}
            />
          );
        })}

        {/* Center Board Stage (Rows 2 to 10, Cols 2 to 10) */}
        <div
          style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
          className="relative bg-[#F3EBD8] flex flex-col items-center justify-between p-3 sm:p-5 overflow-hidden select-none"
        >
          {/* Subtle Vintage Parchment & Lattice Texture */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#8B5A2B_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />
          <div className="absolute inset-2 border border-[#8B5A2B]/20 rounded-xl pointer-events-none" />

          {/* Top Center: Logo, Tagline & Vintage Filigree */}
          <div className="text-center z-10 pt-0.5 sm:pt-1">
            <div className="flex items-center justify-center gap-2 text-[#8B5A2B] mb-0.5">
              <span className="w-6 h-[1px] bg-[#8B5A2B]/40" />
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] sm:text-[11px] font-bold font-mono tracking-widest uppercase">
                THE INDIAN TRADING GAME
              </span>
              <Sparkles className="w-3 h-3" />
              <span className="w-6 h-[1px] bg-[#8B5A2B]/40" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display text-[#1B1B1B] tracking-tight drop-shadow-sm uppercase">
              BAZAAR BARON
            </h1>
          </div>

          {/* Center Stage: Card Decks, Dice Tray & Flipped Card Overlay */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 my-auto z-10 w-full max-w-lg">
            {/* KISMAT (Chance) Stack */}
            <div className="relative group cursor-pointer">
              <div className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 border-2 border-amber-400 p-2 text-white shadow-xl flex flex-col items-center justify-between transform transition hover:-translate-y-1">
                {/* 3D Stack Layering Effects */}
                <div className="absolute -top-1 -right-1 w-full h-full rounded-xl bg-amber-800 -z-10 border border-amber-950/40" />
                <div className="absolute -top-2 -right-2 w-full h-full rounded-xl bg-amber-900 -z-20 border border-amber-950/40" />

                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-200">
                  KISMAT
                </div>
                <div className="w-8 h-8 rounded-full bg-amber-500/30 border border-amber-300 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-amber-100" />
                </div>
                <div className="text-[8px] font-mono font-semibold text-amber-200/90">
                  CHANCE
                </div>
              </div>

              {/* Flipped Card Preview if Kismat card drawn */}
              {activeFlippedCard && activeFlippedCard.deckType === 'chance' && (
                <div className="absolute -top-8 -left-16 sm:-left-24 w-60 sm:w-72 bg-[#FAF7F0] text-neutral-900 border-2 border-amber-700 rounded-xl p-3 shadow-2xl z-40 animate-scale-up">
                  <div className="text-[10px] font-black uppercase text-amber-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Kismat Card</span>
                    <button onClick={() => setActiveFlippedCard(null)} className="p-0.5 hover:bg-neutral-200 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold italic text-neutral-800">
                    "{activeFlippedCard.text}"
                  </p>
                </div>
              )}
            </div>

            {/* 3D Dice Tray Area */}
            <div className="flex flex-col items-center p-2.5 sm:p-4 rounded-2xl bg-[#E8DCB8] border-2 border-[#8B5A2B]/40 shadow-inner">
              <DiceDisplay
                dice={gameState?.dice || [1, 1]}
                isRolling={isRolling}
                lastRollDoubles={gameState?.lastRollDoubles}
              />

              {activePlayer && (
                <div className="text-center mt-2 pt-1.5 border-t border-[#8B5A2B]/20">
                  <div className="text-[10px] text-neutral-600 uppercase font-bold tracking-wider">Active Turn</div>
                  <div className="text-xs sm:text-sm font-black font-display text-neutral-900 flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-base">{activePlayer.avatar || '👳'}</span>
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    <span>{activePlayer.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* BAZAAR FUND (Community) Stack */}
            <div className="relative group cursor-pointer">
              <div className="w-16 sm:w-20 h-24 sm:h-28 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-2 border-emerald-400 p-2 text-white shadow-xl flex flex-col items-center justify-between transform transition hover:-translate-y-1">
                {/* 3D Stack Layering Effects */}
                <div className="absolute -top-1 -right-1 w-full h-full rounded-xl bg-emerald-800 -z-10 border border-emerald-950/40" />
                <div className="absolute -top-2 -right-2 w-full h-full rounded-xl bg-emerald-900 -z-20 border border-emerald-950/40" />

                <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-200">
                  BAZAAR FUND
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 border border-emerald-300 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-emerald-100" />
                </div>
                <div className="text-[8px] font-mono font-semibold text-emerald-200/90">
                  COMMUNITY
                </div>
              </div>

              {/* Flipped Card Preview if Bazaar Fund card drawn */}
              {activeFlippedCard && activeFlippedCard.deckType === 'community' && (
                <div className="absolute -top-8 -right-16 sm:-right-24 w-60 sm:w-72 bg-[#FAF7F0] text-neutral-900 border-2 border-emerald-700 rounded-xl p-3 shadow-2xl z-40 animate-scale-up">
                  <div className="text-[10px] font-black uppercase text-emerald-800 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Bazaar Fund Card</span>
                    <button onClick={() => setActiveFlippedCard(null)} className="p-0.5 hover:bg-neutral-200 rounded">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold italic text-neutral-800">
                    "{activeFlippedCard.text}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Center: Live Feed of Last 4 Events (fading older lines) */}
          <div className="w-full max-w-lg z-10 pb-0.5">
            <div className="bg-[#EFE5CE] border border-[#8B5A2B]/30 rounded-xl p-2 sm:p-2.5 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-[#8B5A2B] uppercase tracking-wider px-1">
                <span className="flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5" /> Live Chronicles</span>
                <span className="text-[10px] font-mono text-neutral-600">Latest drama</span>
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                {recentLogs.length === 0 && (
                  <div className="text-neutral-500 italic px-1 text-xs">Game commenced. Awaiting first turn.</div>
                )}
                {recentLogs.map((log, idx) => {
                  const opacityClass =
                    idx === 0
                      ? 'opacity-100 font-bold text-neutral-900 bg-amber-100/90 border border-amber-300/50'
                      : idx === 1
                      ? 'opacity-85 font-medium text-neutral-800'
                      : idx === 2
                      ? 'opacity-65 text-neutral-700'
                      : 'opacity-40 text-neutral-600';

                  return (
                    <div
                      key={log.id || idx}
                      className={`px-2 py-1 rounded-lg text-left truncate transition-opacity flex items-center gap-1.5 ${opacityClass}`}
                      title={log.text}
                    >
                      <span className="truncate">{log.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop Hover Deed Card Floating Preview */}
          {hoveredTile && ['property', 'station', 'utility'].includes(hoveredTile.type) && (
            <div className="hidden lg:block absolute bottom-3 right-3 z-50 pointer-events-none animate-fade-in">
              <DeedCard
                tile={hoveredTile}
                propState={hoveredPropState}
                ownerPlayer={hoveredOwner}
                isCompact={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
