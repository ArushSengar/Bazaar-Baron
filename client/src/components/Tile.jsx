import React from 'react';
import {
  GROUP_COLORS,
  GROUP_TEXT_COLORS,
  PLAYER_COLORS,
  PLAYER_PAWNS,
  getTileGridPosition,
  getTileOrientation
} from '../data/constants';
import { PawnIcon } from './PawnIcon';
import {
  Train,
  Ship,
  Plane,
  TramFront,
  Lightbulb,
  Droplets,
  Receipt,
  Gem,
  HelpCircle,
  Coins,
  Coffee,
  ShieldAlert,
  ArrowDownLeft,
  ArrowRight
} from 'lucide-react';

/**
 * Returns the distinctive icon for a special tile.
 */
function getTileSpecialIcon(tileId, tileType) {
  // 4 distinct station icons
  if (tileId === 5) return <Train className="w-5 h-5 text-neutral-800 shrink-0" />;
  if (tileId === 15) return <Ship className="w-5 h-5 text-neutral-800 shrink-0" />;
  if (tileId === 25) return <Plane className="w-5 h-5 text-neutral-800 shrink-0" />;
  if (tileId === 35) return <TramFront className="w-5 h-5 text-neutral-800 shrink-0" />;

  // 2 distinct utilities
  if (tileId === 12) return <Lightbulb className="w-5 h-5 text-amber-700 shrink-0" />;
  if (tileId === 28) return <Droplets className="w-5 h-5 text-blue-700 shrink-0" />;

  // Taxes
  if (tileId === 4) return <Receipt className="w-5 h-5 text-red-700 shrink-0" />;
  if (tileId === 38) return <Gem className="w-5 h-5 text-purple-700 shrink-0" />;

  // Cards
  if (tileType === 'chance') {
    return (
      <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
        ?
      </div>
    );
  }
  if (tileType === 'community') {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-[10px] shadow-sm shrink-0">
        🏺
      </div>
    );
  }

  return null;
}

export function Tile({
  tile,
  propState,
  playersOnTile = [],
  ownerPlayer,
  isLandedOn,
  onSelect,
  onHover,
  onLeave
}) {
  const { row, col } = getTileGridPosition(tile.id);
  const orientation = getTileOrientation(tile.id);
  const isCorner = [0, 10, 20, 30].includes(tile.id);
  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const ownerColor = ownerPlayer ? (PLAYER_COLORS[ownerPlayer.color]?.hex || '#1b1b1b') : null;
  const houses = propState?.houses || 0;
  const isMortgaged = Boolean(propState?.mortgaged);

  // Common interaction handlers
  const handleClick = () => onSelect && onSelect(tile);
  const handleMouseEnter = () => onHover && onHover(tile);
  const handleMouseLeave = () => onLeave && onLeave(tile);

  // Corner Tile: Start / Go (0)
  if (tile.id === 0) {
    return (
      <div
        data-tile-id={tile.id}
        data-tile-name={tile.name}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ gridRow: row, gridColumn: col }}
        className={`relative bg-[#F3EBD8] border border-[#1B1B1B] p-1 sm:p-1.5 flex flex-col justify-between items-center text-center cursor-pointer select-none overflow-hidden ${
          isLandedOn ? 'ring-4 ring-amber-500 z-20' : ''
        }`}
      >
        <div className="text-[9px] sm:text-[10px] lg:text-[11px] font-bold tracking-wider text-neutral-600 uppercase leading-tight">
          Collect ₹200 Salary
        </div>
        <div className="flex flex-col items-center my-auto">
          <div className="text-xl sm:text-2xl lg:text-3xl font-black font-display text-emerald-700 tracking-tight leading-none">
            START
          </div>
          <div className="flex items-center text-emerald-800 text-xs font-bold mt-0.5">
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3] animate-pulse" />
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] font-mono font-bold text-neutral-700">
          Pass ➔
        </div>
        <TokenOverlay players={playersOnTile} />
      </div>
    );
  }

  // Corner Tile: Central Jail (10)
  if (tile.id === 10) {
    return (
      <div
        data-tile-id={tile.id}
        data-tile-name={tile.name}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ gridRow: row, gridColumn: col }}
        className={`relative bg-[#F3EBD8] border border-[#1B1B1B] cursor-pointer select-none overflow-hidden ${
          isLandedOn ? 'ring-4 ring-amber-500 z-20' : ''
        }`}
      >
        {/* Real Monopoly L-Shape Layout */}
        <div className="w-full h-full flex flex-col justify-between">
          <div className="flex justify-end p-0.5 sm:p-1">
            <div className="w-3/4 h-12 sm:h-14 lg:h-16 bg-[#e67e22]/20 border-b-2 border-l-2 border-[#1B1B1B] p-0.5 sm:p-1 flex flex-col items-center justify-center rounded-bl-lg bg-orange-100">
              <span className="text-[9px] sm:text-[10px] lg:text-xs font-black font-display text-orange-950 uppercase tracking-wider">
                IN JAIL
              </span>
              <div className="flex items-center gap-0.5 text-xs text-orange-900 mt-0.5">
                <span>⛓️</span>
                <span className="text-[8px] sm:text-[9px] font-bold font-mono">CELL</span>
              </div>
            </div>
          </div>
          <div className="p-0.5 sm:p-1 flex items-center justify-between text-[9px] sm:text-[10px] lg:text-[11px] font-extrabold text-neutral-800 uppercase tracking-wider">
            <span>JUST</span>
            <span>VISITING</span>
          </div>
        </div>
        <TokenOverlay players={playersOnTile} />
      </div>
    );
  }

  // Corner Tile: Chai Break / Free Parking (20)
  if (tile.id === 20) {
    return (
      <div
        data-tile-id={tile.id}
        data-tile-name={tile.name}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ gridRow: row, gridColumn: col }}
        className={`relative bg-[#F3EBD8] border border-[#1B1B1B] p-1 sm:p-1.5 flex flex-col justify-between items-center text-center cursor-pointer select-none overflow-hidden ${
          isLandedOn ? 'ring-4 ring-amber-500 z-20' : ''
        }`}
      >
        <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold tracking-wider text-neutral-600 uppercase leading-tight">
          Rest & Refresh
        </div>
        <div className="flex flex-col items-center my-auto">
          <Coffee className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800 mb-0.5" />
          <div className="text-xs sm:text-sm lg:text-base font-black font-display text-amber-950 tracking-tight leading-none whitespace-nowrap">
            CHAI BREAK
          </div>
        </div>
        <div className="text-[8px] sm:text-[9px] font-mono text-neutral-600">
          Free Parking
        </div>
        <TokenOverlay players={playersOnTile} />
      </div>
    );
  }

  // Corner Tile: Go To Jail (30)
  if (tile.id === 30) {
    return (
      <div
        data-tile-id={tile.id}
        data-tile-name={tile.name}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ gridRow: row, gridColumn: col }}
        className={`relative bg-[#F3EBD8] border border-[#1B1B1B] p-1 sm:p-1.5 flex flex-col justify-between items-center text-center cursor-pointer select-none overflow-hidden ${
          isLandedOn ? 'ring-4 ring-amber-500 z-20' : ''
        }`}
      >
        <div className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold tracking-wider text-red-700 uppercase leading-tight">
          Challan / Arrest
        </div>
        <div className="flex flex-col items-center my-auto">
          <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mb-0.5 animate-pulse" />
          <div className="text-xs sm:text-sm lg:text-base font-black font-display text-red-900 tracking-tight leading-none whitespace-nowrap">
            GO TO JAIL
          </div>
        </div>
        <div className="flex items-center text-red-700 text-xs font-bold">
          <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
        </div>
        <TokenOverlay players={playersOnTile} />
      </div>
    );
  }

  // Edge Tiles (Bottom, Top, Left, Right)
  const isBottom = orientation === 'bottom';
  const isTop = orientation === 'top';
  const isLeft = orientation === 'left';
  const isRight = orientation === 'right';
  const isProperty = tile.type === 'property';

  return (
    <div
      data-tile-id={tile.id}
      data-tile-name={tile.name}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        gridRow: row,
        gridColumn: col,
        outline: ownerPlayer ? `3px solid ${ownerColor}` : undefined,
        outlineOffset: ownerPlayer ? '-3px' : undefined
      }}
      className={`relative bg-[#F3EBD8] border border-[#1B1B1B] flex select-none cursor-pointer overflow-hidden transition-all duration-150 ${
        isBottom ? 'flex-col justify-between' : ''
      } ${isTop ? 'flex-col justify-between' : ''} ${
        isLeft ? 'flex-row justify-between' : ''
      } ${isRight ? 'flex-row justify-between' : ''} ${
        isLandedOn ? 'ring-4 ring-amber-500 ring-offset-1 z-30 shadow-xl' : 'hover:bg-[#EFE5CE]'
      }`}
    >
      {/* Mortgaged Background Overlay */}
      {isMortgaged && (
        <div className="absolute inset-0 mortgaged-pattern z-20 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] sm:text-xs font-black font-display bg-red-800 text-white px-1.5 py-0.5 rounded shadow rotate-[-25deg] tracking-wider uppercase border border-red-950">
            MORTGAGED
          </span>
        </div>
      )}

      {/* Owner Badge on Tile */}
      {ownerPlayer && (
        <div
          className="absolute top-1 right-1 z-30 w-4 h-4 rounded-full flex items-center justify-center font-black text-[9px] shadow border border-[#1B1B1B]"
          style={{
            backgroundColor: ownerColor,
            color: PLAYER_COLORS[ownerPlayer.color]?.text || '#ffffff'
          }}
          title={`Owned by ${ownerPlayer.name}`}
        >
          {ownerPlayer.name.substring(0, 1).toUpperCase()}
        </div>
      )}

      {/* BOTTOM ROW (Tiles 1-9): Colour band on TOP edge (inner edge facing center) */}
      {isBottom && (
        <>
          {isProperty ? (
            <div
              className="w-full h-4 sm:h-5 border-b border-[#1B1B1B] flex items-center justify-center gap-1 px-1 shadow-inner shrink-0"
              style={{ backgroundColor: groupColor }}
            >
              <HouseIcons houses={houses} />
            </div>
          ) : (
            <div className="h-1 shrink-0" />
          )}

          {/* Upright Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-0.5 text-center py-0.5 overflow-hidden w-full">
            {getTileSpecialIcon(tile.id, tile.type)}
            <span
              className="font-display font-semibold text-[#1B1B1B] leading-[1.1] mt-0.5 w-full max-w-[94%] break-words line-clamp-2"
              style={{ fontSize: 'clamp(11px, 1.4cqi, 14px)' }}
            >
              {tile.name}
            </span>
            {tile.cost && (
              <span className="font-number font-bold text-[#1B1B1B] text-[12px] sm:text-[13px] lg:text-[14px] mt-0.5 shrink-0">
                ₹{tile.cost}
              </span>
            )}
            {tile.amount && (
              <span className="font-number font-bold text-red-700 text-[12px] sm:text-[13px] lg:text-[14px] mt-0.5 shrink-0">
                ₹{tile.amount}
              </span>
            )}
          </div>
        </>
      )}

      {/* TOP ROW (Tiles 21-29): Colour band on BOTTOM edge (inner edge facing center) */}
      {isTop && (
        <>
          {/* Content (Rotated 180deg facing center) */}
          <div className="flex-1 flex flex-col items-center justify-center px-0.5 text-center py-0.5 rotate-180 overflow-hidden w-full">
            {getTileSpecialIcon(tile.id, tile.type)}
            <span
              className="font-display font-semibold text-[#1B1B1B] leading-[1.1] mt-0.5 w-full max-w-[94%] break-words line-clamp-2"
              style={{ fontSize: 'clamp(11px, 1.4cqi, 14px)' }}
            >
              {tile.name}
            </span>
            {tile.cost && (
              <span className="font-number font-bold text-[#1B1B1B] text-[12px] sm:text-[13px] lg:text-[14px] mt-0.5 shrink-0">
                ₹{tile.cost}
              </span>
            )}
          </div>

          {isProperty ? (
            <div
              className="w-full h-4 sm:h-5 border-t border-[#1B1B1B] flex items-center justify-center gap-1 px-1 shadow-inner shrink-0"
              style={{ backgroundColor: groupColor }}
            >
              <HouseIcons houses={houses} />
            </div>
          ) : (
            <div className="h-1 shrink-0" />
          )}
        </>
      )}

      {/* LEFT COLUMN (Tiles 11-19): Colour band on RIGHT edge (inner edge facing center) */}
      {isLeft && (
        <>
          {/* Rotated 90deg inner container with constrained width to prevent clipping */}
          <div className="flex-1 flex items-center justify-center p-0.5">
            <div className="rotate-90 w-[90%] max-w-[76px] flex flex-col items-center justify-center text-center shrink-0">
              {getTileSpecialIcon(tile.id, tile.type)}
              <span
                className="font-display font-semibold text-[#1B1B1B] leading-tight mt-0.5 max-w-[76px] break-words line-clamp-2"
                style={{ fontSize: 'clamp(11px, 1.35cqi, 13.5px)' }}
              >
                {tile.name}
              </span>
              {tile.cost && (
                <span className="font-number font-bold text-[#1B1B1B] text-[12px] lg:text-[14px] mt-0.5 shrink-0">
                  ₹{tile.cost}
                </span>
              )}
            </div>
          </div>

          {isProperty ? (
            <div
              className="w-3.5 sm:w-4 lg:w-5 h-full border-l border-[#1B1B1B] flex flex-col items-center justify-center gap-1 py-1 shadow-inner shrink-0"
              style={{ backgroundColor: groupColor }}
            >
              <HouseIcons houses={houses} vertical />
            </div>
          ) : (
            <div className="w-1 shrink-0" />
          )}
        </>
      )}

      {/* RIGHT COLUMN (Tiles 31-39): Colour band on LEFT edge (inner edge facing center) */}
      {isRight && (
        <>
          {isProperty ? (
            <div
              className="w-3.5 sm:w-4 lg:w-5 h-full border-r border-[#1B1B1B] flex flex-col items-center justify-center gap-1 py-1 shadow-inner shrink-0"
              style={{ backgroundColor: groupColor }}
            >
              <HouseIcons houses={houses} vertical />
            </div>
          ) : (
            <div className="w-1 shrink-0" />
          )}

          {/* Rotated -90deg inner container with constrained width to prevent clipping */}
          <div className="flex-1 flex items-center justify-center p-0.5">
            <div className="-rotate-90 w-[90%] max-w-[76px] flex flex-col items-center justify-center text-center shrink-0">
              {getTileSpecialIcon(tile.id, tile.type)}
              <span
                className="font-display font-semibold text-[#1B1B1B] leading-tight mt-0.5 max-w-[76px] break-words line-clamp-2"
                style={{ fontSize: 'clamp(11px, 1.35cqi, 13.5px)' }}
              >
                {tile.name}
              </span>
              {tile.cost && (
                <span className="font-number font-bold text-[#1B1B1B] text-[12px] lg:text-[14px] mt-0.5 shrink-0">
                  ₹{tile.cost}
                </span>
              )}
              {tile.amount && (
                <span className="font-number font-bold text-red-700 text-[12px] lg:text-[14px] mt-0.5 shrink-0">
                  ₹{tile.amount}
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tokens Overlay on this tile */}
      <TokenOverlay players={playersOnTile} />
    </div>
  );
}

/**
 * Renders small 3D green havelis (1-4) or a 3D red grand hotel (5) on the color band.
 */
function HouseIcons({ houses = 0, vertical = false }) {
  if (houses <= 0) return null;

  if (houses === 5) {
    return (
      <div
        className="w-3.5 h-3.5 rounded-[2px] bg-gradient-to-b from-red-500 to-red-800 border border-neutral-900 shadow-md flex items-center justify-center text-[8px] text-white font-black ring-1 ring-red-400/60"
        title="Grand Hotel (Haveli)"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)' }}
      >
        🏰
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-0.5 ${vertical ? 'flex-col' : 'flex-row'}`}>
      {Array.from({ length: houses }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-2.5 rounded-[1px] bg-gradient-to-b from-emerald-500 to-emerald-800 border border-neutral-900 shadow-sm ring-1 ring-emerald-400/50"
          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.4)' }}
          title={`Haveli ${i + 1}`}
        />
      ))}
    </div>
  );
}

/**
 * Spreads multiple tokens in a clean grid so no pawn is hidden.
 */
function TokenOverlay({ players = [] }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 z-30">
      <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[85%] bg-white/85 rounded-lg p-0.5 shadow-md border border-black/30 backdrop-blur-[1px]">
        {players.map((p) => {
          const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F', text: '#ffffff' };
          const pShape = PLAYER_PAWNS[p.color] || 'hat';
          return (
            <div
              key={p.id}
              className="p-0.5 rounded-md flex items-center justify-center"
              title={`${p.name} (${pShape})`}
            >
              <PawnIcon shape={pShape} color={pColor.hex} size={13} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
