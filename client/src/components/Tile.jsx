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
        <div className="w-full h-full flex flex-col justify-between overflow-hidden">
          <div className="flex justify-end p-0.5 sm:p-1 flex-1 min-h-0">
            <div className="w-3/4 h-full max-h-[90%] sm:max-h-none sm:h-14 lg:h-16 bg-[#e67e22]/20 border-b-2 border-l-2 border-[#1B1B1B] p-0.5 sm:p-1 flex flex-col items-center justify-center rounded-bl-lg bg-orange-100">
              <span
                className="font-black font-display text-orange-950 uppercase tracking-tight sm:tracking-wider leading-none whitespace-nowrap"
                style={{ fontSize: 'clamp(6.5px, 1.5cqi, 12px)' }}
              >
                IN JAIL
              </span>
              <div className="flex items-center gap-0.5 text-[8px] sm:text-xs text-orange-900 mt-0.5 leading-none">
                <span>⛓️</span>
                <span
                  className="font-bold font-mono leading-none"
                  style={{ fontSize: 'clamp(5.5px, 1.15cqi, 9px)' }}
                >
                  CELL
                </span>
              </div>
            </div>
          </div>
          <div
            className="px-0.5 pb-0.5 sm:p-1 flex items-center justify-center sm:justify-between gap-1 font-display font-extrabold text-neutral-800 uppercase tracking-tight sm:tracking-wider leading-none shrink-0 w-full whitespace-nowrap"
            style={{ fontSize: 'clamp(5.5px, 1.15cqi, 11px)' }}
          >
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
        <div
          className="font-bold tracking-tight sm:tracking-wider text-neutral-600 uppercase leading-none max-w-full whitespace-nowrap"
          style={{ fontSize: 'clamp(5px, 1.0cqi, 10px)' }}
        >
          Rest & Refresh
        </div>
        <div className="flex flex-col items-center my-auto max-w-full">
          <Coffee className="w-3 h-3 sm:w-5 sm:h-5 text-amber-800 mb-0.5 shrink-0" />
          <div
            className="font-black font-display text-amber-950 tracking-tight leading-none whitespace-nowrap max-w-full"
            style={{ fontSize: 'clamp(7.5px, 1.9cqi, 16px)' }}
          >
            CHAI BREAK
          </div>
        </div>
        <div
          className="font-mono text-neutral-600 leading-none max-w-full whitespace-nowrap"
          style={{ fontSize: 'clamp(5px, 0.95cqi, 9px)' }}
        >
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
        <div
          className="font-bold tracking-tight sm:tracking-wider text-red-700 uppercase leading-none max-w-full whitespace-nowrap"
          style={{ fontSize: 'clamp(5px, 1.0cqi, 10px)' }}
        >
          Challan / Arrest
        </div>
        <div className="flex flex-col items-center my-auto max-w-full">
          <ShieldAlert className="w-3 h-3 sm:w-5 sm:h-5 text-red-600 mb-0.5 animate-pulse shrink-0" />
          <div
            className="font-black font-display text-red-900 tracking-tight leading-none whitespace-nowrap max-w-full"
            style={{ fontSize: 'clamp(7.5px, 1.9cqi, 16px)' }}
          >
            GO TO JAIL
          </div>
        </div>
        <div className="flex items-center text-red-700 text-xs font-bold shrink-0">
          <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 stroke-[3]" />
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
              className="w-full h-4 sm:h-5 border-b border-[#1B1B1B] flex items-center justify-center gap-0.5 sm:gap-1 px-1 shadow-inner shrink-0 overflow-hidden"
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
              className="w-full h-4 sm:h-5 border-t border-[#1B1B1B] flex items-center justify-center gap-0.5 sm:gap-1 px-1 shadow-inner shrink-0 overflow-hidden"
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
          {/* Rotated 90deg inner container with constrained width and offset away from color band to prevent collision */}
          <div className="flex-1 min-w-0 flex items-center justify-center p-0.5 pr-1.5 sm:pr-0.5">
            <div className="rotate-90 -translate-x-1.5 sm:translate-x-0 w-[85%] max-w-[64px] sm:max-w-[76px] flex flex-col items-center justify-center text-center shrink-0">
              {getTileSpecialIcon(tile.id, tile.type)}
              <span
                className="font-display font-semibold text-[#1B1B1B] leading-tight mt-0.5 max-w-[64px] sm:max-w-[76px] break-words line-clamp-2"
                style={{ fontSize: 'clamp(9.5px, 1.35cqi, 13.5px)' }}
              >
                {tile.name}
              </span>
              {tile.cost && (
                <span className="font-number font-bold text-[#1B1B1B] text-[10px] sm:text-[12px] lg:text-[14px] mt-0.5 shrink-0">
                  ₹{tile.cost}
                </span>
              )}
            </div>
          </div>

          {isProperty ? (
            <div
              className="w-3.5 sm:w-4 lg:w-5 h-full border-l border-[#1B1B1B] flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 shadow-inner shrink-0 overflow-hidden"
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
              className="w-3.5 sm:w-4 lg:w-5 h-full border-r border-[#1B1B1B] flex flex-col items-center justify-center gap-0.5 sm:gap-1 py-1 shadow-inner shrink-0 overflow-hidden"
              style={{ backgroundColor: groupColor }}
            >
              <HouseIcons houses={houses} vertical />
            </div>
          ) : (
            <div className="w-1 shrink-0" />
          )}

          {/* Rotated -90deg inner container with constrained width and offset away from color band to prevent collision */}
          <div className="flex-1 min-w-0 flex items-center justify-center p-0.5 pl-1.5 sm:pl-0.5">
            <div className="-rotate-90 translate-x-1.5 sm:translate-x-0 w-[85%] max-w-[64px] sm:max-w-[76px] flex flex-col items-center justify-center text-center shrink-0">
              {getTileSpecialIcon(tile.id, tile.type)}
              <span
                className="font-display font-semibold text-[#1B1B1B] leading-tight mt-0.5 max-w-[64px] sm:max-w-[76px] break-words line-clamp-2"
                style={{ fontSize: 'clamp(9.5px, 1.35cqi, 13.5px)' }}
              >
                {tile.name}
              </span>
              {tile.cost && (
                <span className="font-number font-bold text-[#1B1B1B] text-[10px] sm:text-[12px] lg:text-[14px] mt-0.5 shrink-0">
                  ₹{tile.cost}
                </span>
              )}
              {tile.amount && (
                <span className="font-number font-bold text-red-700 text-[10px] sm:text-[12px] lg:text-[14px] mt-0.5 shrink-0">
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
 * Volumetric 3D Miniature Haveli (Houses 1-4).
 * Features authentic Rajasthani isometric architectural geometry:
 * Pitched roof with illuminated ridge slope (#4ade80), shaded side slope (#15803d),
 * south facade (#166534), and ground contact drop shadow.
 */
export function Haveli3D({
  className = "w-2 h-2 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5 2xl:w-3.5 2xl:h-3.5 shrink-0 max-w-full max-h-full"
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}
      title="Haveli (House)"
      data-testid="haveli-3d"
    >
      {/* South Facade (Front wall) */}
      <polygon points="1,7 8,10 8,15 1,12" fill="#166534" stroke="#0f4a24" strokeWidth="0.4" />
      {/* East/Side Facade */}
      <polygon points="8,10 15,7 15,12 8,15" fill="#15803d" stroke="#0f4a24" strokeWidth="0.4" />
      {/* Decorative Arched Jharokha Doorway */}
      <polygon points="3.5,9.5 5.5,10.3 5.5,13 3.5,12.2" fill="#052e16" />
      <path d="M3.5,9.5 Q4.5,9 5.5,10.3" stroke="#4ade80" strokeWidth="0.3" fill="none" />
      {/* Shaded Side Slope of Pitched Roof */}
      <polygon points="8,2 15,7 8,10" fill="#15803d" stroke="#0f4a24" strokeWidth="0.4" />
      {/* Illuminated Ridge Slope of Pitched Roof */}
      <polygon points="8,2 1,7 8,10" fill="#4ade80" stroke="#22c55e" strokeWidth="0.4" />
      {/* Roof Ridge Peak Highlight */}
      <line x1="8" y1="2" x2="8" y2="10" stroke="#86efac" strokeWidth="0.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

/**
 * 3D Grand Haveli Palace Hotel (House 5).
 * Replaces flat emojis with an authentic miniature 3D Rajasthani palace block:
 * Double-tiered facade, ornamental golden dome / chhatri cupola (#f59e0b),
 * deep royal crimson walls (#b91c1c), gold lintel trim, and ground contact drop shadow.
 */
export function HotelGrand3D({
  className = "w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4.5 lg:h-4.5 shrink-0 max-w-full max-h-full"
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.5))' }}
      title="Grand Haveli Palace (Hotel)"
      data-testid="hotel-grand-3d"
    >
      {/* Lower Tier - South Facade (Deep Royal Crimson) */}
      <polygon points="2,11 10,14 10,19 2,16" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.4" />
      {/* Lower Tier - East Facade */}
      <polygon points="10,14 18,11 18,16 10,19" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.4" />
      {/* Gold Lintel Trim / Intermediate Cornice */}
      <polygon points="2,11 10,8 18,11 10,14" fill="#f59e0b" stroke="#d97706" strokeWidth="0.4" />
      {/* Lower Tier Arched Gateway */}
      <polygon points="5,13.5 7.5,14.5 7.5,17.5 5,16.5" fill="#450a0a" />
      <path d="M5,13.5 Q6.25,12.8 7.5,14.5" stroke="#fbbf24" strokeWidth="0.3" fill="none" />

      {/* Upper Tier - South Facade (Double-Tiered Palace Block) */}
      <polygon points="5,8 10,10 10,13 5,11" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="0.4" />
      {/* Upper Tier - East Facade */}
      <polygon points="10,10 15,8 15,11 10,13" fill="#991b1b" stroke="#7f1d1d" strokeWidth="0.4" />
      {/* Upper Tier Gold Trim */}
      <polygon points="5,8 10,6 15,8 10,10" fill="#fbbf24" stroke="#d97706" strokeWidth="0.3" />

      {/* Ornamental Golden Dome / Chhatri Cupola (#f59e0b) */}
      <path
        d="M6.5,6 Q10,1.5 13.5,6 Z"
        fill="#f59e0b"
        stroke="#d97706"
        strokeWidth="0.4"
      />
      {/* Dome Specular Highlight */}
      <path
        d="M7.5,5.5 Q10,2.5 11,3"
        stroke="#fef08a"
        strokeWidth="0.4"
        fill="none"
      />
      {/* Golden Kalasa / Finial Needle */}
      <line x1="10" y1="1" x2="10" y2="2.5" stroke="#fbbf24" strokeWidth="0.6" strokeLinecap="round" />
      <circle cx="10" cy="1" r="0.6" fill="#fef08a" />
    </svg>
  );
}

/**
 * 3D Brass/Gold Token Pedestal for elevating player pawn tokens.
 * Features cylindrical metallic base with radial gradient (#f59e0b to #78350f),
 * specular rim highlight (inset 0 1px 1px rgba(255,255,255,0.8)), soft drop shadow,
 * and translateZ(6px) elevation.
 */
export function TokenPedestal3D({ children, title }) {
  return (
    <div
      className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full token-pedestal-3d"
      style={{
        background: 'radial-gradient(circle at 35% 35%, #f59e0b 0%, #b45309 65%, #78350f 100%)',
        boxShadow: '0 3px 6px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.8), inset 0 -1.5px 2px rgba(0,0,0,0.6)',
        transform: 'translateZ(6px)',
        transformStyle: 'preserve-3d'
      }}
      title={title}
      data-testid="token-pedestal-3d"
    >
      <div className="transform-gpu -translate-y-0.5 filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
        {children}
      </div>
    </div>
  );
}

/**
 * Renders small 3D green havelis (1-4) or a 3D Grand Haveli Palace Hotel (5) on the color band.
 */
export function HouseIcons({ houses = 0, vertical = false }) {
  if (houses <= 0) return null;

  if (houses === 5) {
    return <HotelGrand3D />;
  }

  // Wrap havelis into a 2x2 grid for 3-4 havelis on horizontal color bands to prevent clipping
  const isGrid = !vertical && houses >= 3;

  return (
    <div
      className={
        isGrid
          ? 'grid grid-cols-2 gap-0.5 2xl:flex 2xl:flex-row 2xl:gap-0.5 items-center justify-center max-w-full max-h-full'
          : `flex items-center justify-center gap-0.5 ${vertical ? 'flex-col' : 'flex-row'} max-w-full max-h-full`
      }
    >
      {Array.from({ length: houses }).map((_, i) => (
        <Haveli3D key={i} />
      ))}
    </div>
  );
}

/**
 * Spreads multiple tokens on 3D brass/gold pedestals elevated above the board.
 */
export function TokenOverlay({ players = [] }) {
  if (!players || players.length === 0) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none p-0.5 z-30"
      style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
    >
      <div
        className="flex flex-wrap items-center justify-center gap-1 max-w-[90%] bg-neutral-900/65 rounded-xl p-1 shadow-lg border border-amber-600/40 backdrop-blur-[2px]"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {players.map((p) => {
          const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F', text: '#ffffff' };
          const pShape = PLAYER_PAWNS[p.color] || 'hat';
          return (
            <TokenPedestal3D
              key={p.id}
              title={`${p.name} (${pShape})`}
            >
              <PawnIcon shape={pShape} color={pColor.hex} size={14} />
            </TokenPedestal3D>
          );
        })}
      </div>
    </div>
  );
}
