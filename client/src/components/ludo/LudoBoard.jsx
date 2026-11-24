import React from 'react';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { sounds } from '../../utils/audio';

// 52 track perimeter cell coordinates: index (0..51) -> { col: 0..14, row: 0..14 }
export const TRACK_COORDINATES = [
  // Red Track (0..12)
  { col: 1, row: 6 },  // 0: Red Start (⭐)
  { col: 2, row: 6 },  // 1
  { col: 3, row: 6 },  // 2
  { col: 4, row: 6 },  // 3
  { col: 5, row: 6 },  // 4
  { col: 6, row: 5 },  // 5
  { col: 6, row: 4 },  // 6
  { col: 6, row: 3 },  // 7
  { col: 6, row: 2 },  // 8: Safe Star (⭐)
  { col: 6, row: 1 },  // 9
  { col: 6, row: 0 },  // 10
  { col: 7, row: 0 },  // 11
  { col: 8, row: 0 },  // 12
  // Green Track (13..25)
  { col: 8, row: 1 },  // 13: Green Start (⭐)
  { col: 8, row: 2 },  // 14
  { col: 8, row: 3 },  // 15
  { col: 8, row: 4 },  // 16
  { col: 8, row: 5 },  // 17
  { col: 9, row: 6 },  // 18
  { col: 10, row: 6 }, // 19
  { col: 11, row: 6 }, // 20
  { col: 12, row: 6 }, // 21: Safe Star (⭐)
  { col: 13, row: 6 }, // 22
  { col: 14, row: 6 }, // 23
  { col: 14, row: 7 }, // 24
  { col: 14, row: 8 }, // 25
  // Yellow Track (26..38)
  { col: 13, row: 8 }, // 26: Yellow Start (⭐)
  { col: 12, row: 8 }, // 27
  { col: 11, row: 8 }, // 28
  { col: 10, row: 8 }, // 29
  { col: 9, row: 8 },  // 30
  { col: 8, row: 9 },  // 31
  { col: 8, row: 10 }, // 32
  { col: 8, row: 11 }, // 33
  { col: 8, row: 12 }, // 34: Safe Star (⭐)
  { col: 8, row: 13 }, // 35
  { col: 8, row: 14 }, // 36
  { col: 7, row: 14 }, // 37
  { col: 6, row: 14 }, // 38
  // Blue Track (39..51)
  { col: 6, row: 13 }, // 39: Blue Start (⭐)
  { col: 6, row: 12 }, // 40
  { col: 6, row: 11 }, // 41
  { col: 6, row: 10 }, // 42
  { col: 6, row: 9 },  // 43
  { col: 5, row: 8 },  // 44
  { col: 4, row: 8 },  // 45
  { col: 3, row: 8 },  // 46
  { col: 2, row: 8 },  // 47: Safe Star (⭐)
  { col: 1, row: 8 },  // 48
  { col: 0, row: 8 },  // 49
  { col: 0, row: 7 },  // 50
  { col: 0, row: 6 }   // 51
];

export const SAFE_STAR_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

// Base positions inside 6x6 yards for tokens 0..3
export const BASE_COORDINATES = {
  red: [
    { col: 1.8, row: 1.8 },
    { col: 3.8, row: 1.8 },
    { col: 1.8, row: 3.8 },
    { col: 3.8, row: 3.8 }
  ],
  green: [
    { col: 10.8, row: 1.8 },
    { col: 12.8, row: 1.8 },
    { col: 10.8, row: 3.8 },
    { col: 12.8, row: 3.8 }
  ],
  yellow: [
    { col: 10.8, row: 10.8 },
    { col: 12.8, row: 10.8 },
    { col: 10.8, row: 12.8 },
    { col: 12.8, row: 12.8 }
  ],
  blue: [
    { col: 1.8, row: 10.8 },
    { col: 3.8, row: 10.8 },
    { col: 1.8, row: 12.8 },
    { col: 3.8, row: 12.8 }
  ]
};

// Home stretch coordinates (step 52..56)
export const HOME_STRETCH_COORDINATES = {
  red: [
    { col: 1, row: 7 },
    { col: 2, row: 7 },
    { col: 3, row: 7 },
    { col: 4, row: 7 },
    { col: 5, row: 7 }
  ],
  green: [
    { col: 7, row: 1 },
    { col: 7, row: 2 },
    { col: 7, row: 3 },
    { col: 7, row: 4 },
    { col: 7, row: 5 }
  ],
  yellow: [
    { col: 13, row: 7 },
    { col: 12, row: 7 },
    { col: 11, row: 7 },
    { col: 10, row: 7 },
    { col: 9, row: 7 }
  ],
  blue: [
    { col: 7, row: 13 },
    { col: 7, row: 12 },
    { col: 7, row: 11 },
    { col: 7, row: 10 },
    { col: 7, row: 9 }
  ]
};

// Home Goal coordinates (step 57)
export const GOAL_COORDINATES = {
  red: { col: 6.3, row: 7 },
  green: { col: 7, row: 6.3 },
  yellow: { col: 7.7, row: 7 },
  blue: { col: 7, row: 7.7 }
};

export const COLOR_CONFIG = {
  red: {
    bg: 'bg-red-500',
    border: 'border-red-600',
    ring: 'ring-red-400',
    gradient: 'from-red-600 to-rose-500',
    light: 'bg-red-500/20',
    text: 'text-red-400',
    hex: '#EF4444'
  },
  green: {
    bg: 'bg-emerald-500',
    border: 'border-emerald-600',
    ring: 'ring-emerald-400',
    gradient: 'from-emerald-600 to-teal-500',
    light: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    hex: '#10B981'
  },
  yellow: {
    bg: 'bg-amber-400',
    border: 'border-amber-500',
    ring: 'ring-amber-300',
    gradient: 'from-amber-500 to-yellow-400',
    light: 'bg-amber-400/20',
    text: 'text-amber-400',
    hex: '#F59E0B'
  },
  blue: {
    bg: 'bg-blue-500',
    border: 'border-blue-600',
    ring: 'ring-blue-400',
    gradient: 'from-blue-600 to-indigo-500',
    light: 'bg-blue-500/20',
    text: 'text-blue-400',
    hex: '#3B82F6'
  }
};

export function LudoBoard({
  gameState,
  playerId,
  isMyTurn,
  onTokenClick
}) {
  const players = gameState?.players || [];
  const movableTokenIds = isMyTurn ? (gameState?.movableTokenIds || []) : [];
  const myPlayer = players.find(p => p.id === playerId);

  // Group tokens by coordinate to cluster shared cells
  const cellTokensMap = new Map();

  players.forEach(p => {
    (p.tokens || []).forEach(t => {
      let coords = null;
      if (t.state === 'base') {
        const baseCoords = BASE_COORDINATES[p.color];
        coords = baseCoords ? baseCoords[t.id] : null;
      } else if (t.state === 'track') {
        coords = TRACK_COORDINATES[t.position];
      } else if (t.state === 'home_stretch') {
        const stretchIndex = t.step - 52;
        const stretchList = HOME_STRETCH_COORDINATES[p.color];
        coords = stretchList ? stretchList[stretchIndex] : null;
      } else if (t.state === 'home') {
        coords = GOAL_COORDINATES[p.color];
      }

      if (coords) {
        const key = `${coords.col.toFixed(1)}_${coords.row.toFixed(1)}`;
        if (!cellTokensMap.has(key)) {
          cellTokensMap.set(key, []);
        }
        const isMovable = isMyTurn && p.id === playerId && movableTokenIds.includes(t.id);
        cellTokensMap.get(key).push({
          player: p,
          token: t,
          coords,
          isMovable
        });
      }
    });
  });

  return (
    <div className="relative w-full max-w-[min(94vw,90vh)] lg:max-w-[min(88vh,calc(100vw-360px))] xl:max-w-[min(90vh,calc(100vw-380px))] aspect-square select-none p-1 sm:p-2">
      {/* 15x15 Ludo Board Grid */}
      <div className="w-full h-full grid grid-cols-15 grid-rows-15 bg-[#171311] border-4 border-amber-600/80 rounded-2xl shadow-2xl overflow-hidden relative">

        {/* 1. Red Base (Top-Left: cols 0..5, rows 0..5) */}
        <div className="col-start-1 col-end-7 row-start-1 row-end-7 bg-red-600/90 border-r-2 border-b-2 border-neutral-900 p-2 sm:p-4 flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-[#1b1411] rounded-xl border-2 border-red-400/60 p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 place-items-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-red-950/80 border-2 border-red-500/40 shadow-inner flex items-center justify-center" />
            ))}
          </div>
          <span className="absolute bottom-1 font-display text-[9px] sm:text-xs font-bold text-red-200 tracking-wider">RED YARD</span>
        </div>

        {/* 2. Green Base (Top-Right: cols 9..14, rows 0..5) */}
        <div className="col-start-10 col-end-16 row-start-1 row-end-7 bg-emerald-600/90 border-l-2 border-b-2 border-neutral-900 p-2 sm:p-4 flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-[#1b1411] rounded-xl border-2 border-emerald-400/60 p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 place-items-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-emerald-950/80 border-2 border-emerald-500/40 shadow-inner flex items-center justify-center" />
            ))}
          </div>
          <span className="absolute bottom-1 font-display text-[9px] sm:text-xs font-bold text-emerald-200 tracking-wider">GREEN YARD</span>
        </div>

        {/* 3. Blue Base (Bottom-Left: cols 0..5, rows 9..14) */}
        <div className="col-start-1 col-end-7 row-start-10 row-end-16 bg-blue-600/90 border-r-2 border-t-2 border-neutral-900 p-2 sm:p-4 flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-[#1b1411] rounded-xl border-2 border-blue-400/60 p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 place-items-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-blue-950/80 border-2 border-blue-500/40 shadow-inner flex items-center justify-center" />
            ))}
          </div>
          <span className="absolute top-1 font-display text-[9px] sm:text-xs font-bold text-blue-200 tracking-wider">BLUE YARD</span>
        </div>

        {/* 4. Yellow Base (Bottom-Right: cols 9..14, rows 9..14) */}
        <div className="col-start-10 col-end-16 row-start-10 row-end-16 bg-amber-500/90 border-l-2 border-t-2 border-neutral-900 p-2 sm:p-4 flex flex-col items-center justify-center relative">
          <div className="w-full h-full bg-[#1b1411] rounded-xl border-2 border-amber-400/60 p-2 sm:p-3 grid grid-cols-2 grid-rows-2 gap-2 place-items-center">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-amber-950/80 border-2 border-amber-500/40 shadow-inner flex items-center justify-center" />
            ))}
          </div>
          <span className="absolute top-1 font-display text-[9px] sm:text-xs font-bold text-amber-200 tracking-wider">YELLOW YARD</span>
        </div>

        {/* 5. Center Victory Triangle (cols 6..8, rows 6..8) */}
        <div className="col-start-7 col-end-10 row-start-7 row-end-10 bg-[#120d0a] border-2 border-neutral-900 relative flex items-center justify-center overflow-hidden">
          {/* Triangular colored slices pointing to center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Red Left Triangle */}
              <polygon points="0,0 50,50 0,100" fill="#EF4444" opacity="0.85" />
              {/* Green Top Triangle */}
              <polygon points="0,0 50,50 100,0" fill="#10B981" opacity="0.85" />
              {/* Yellow Right Triangle */}
              <polygon points="100,0 50,50 100,100" fill="#F59E0B" opacity="0.85" />
              {/* Blue Bottom Triangle */}
              <polygon points="0,100 50,50 100,100" fill="#3B82F6" opacity="0.85" />
            </svg>
          </div>
          <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1b1411] border-2 border-amber-400 flex items-center justify-center shadow-lg">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-pulse" />
          </div>
        </div>

        {/* 6. 52 Track Cells */}
        {TRACK_COORDINATES.map((coord, index) => {
          const isStar = SAFE_STAR_INDICES.includes(index);
          const isRedStart = index === 0;
          const isGreenStart = index === 13;
          const isYellowStart = index === 26;
          const isBlueStart = index === 39;

          let cellBg = 'bg-[#211a16]';
          let borderAccent = 'border-neutral-800';

          if (isRedStart) {
            cellBg = 'bg-red-500/80';
          } else if (isGreenStart) {
            cellBg = 'bg-emerald-500/80';
          } else if (isYellowStart) {
            cellBg = 'bg-amber-400/80';
          } else if (isBlueStart) {
            cellBg = 'bg-blue-500/80';
          }

          return (
            <div
              key={`track-${index}`}
              style={{
                gridColumnStart: coord.col + 1,
                gridRowStart: coord.row + 1
              }}
              className={`relative border border-neutral-800/80 ${cellBg} flex items-center justify-center`}
            >
              {isStar && (
                <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-amber-300 fill-amber-300 drop-shadow" />
              )}
            </div>
          );
        })}

        {/* 7. Home Stretch Paths (Red, Green, Yellow, Blue) */}
        {HOME_STRETCH_COORDINATES.red.map((coord, i) => (
          <div
            key={`red-stretch-${i}`}
            style={{ gridColumnStart: coord.col + 1, gridRowStart: coord.row + 1 }}
            className="border border-neutral-800/80 bg-red-600/70 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-300/60" />
          </div>
        ))}

        {HOME_STRETCH_COORDINATES.green.map((coord, i) => (
          <div
            key={`green-stretch-${i}`}
            style={{ gridColumnStart: coord.col + 1, gridRowStart: coord.row + 1 }}
            className="border border-neutral-800/80 bg-emerald-600/70 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-300/60" />
          </div>
        ))}

        {HOME_STRETCH_COORDINATES.yellow.map((coord, i) => (
          <div
            key={`yellow-stretch-${i}`}
            style={{ gridColumnStart: coord.col + 1, gridRowStart: coord.row + 1 }}
            className="border border-neutral-800/80 bg-amber-500/70 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-300/60" />
          </div>
        ))}

        {HOME_STRETCH_COORDINATES.blue.map((coord, i) => (
          <div
            key={`blue-stretch-${i}`}
            style={{ gridColumnStart: coord.col + 1, gridRowStart: coord.row + 1 }}
            className="border border-neutral-800/80 bg-blue-600/70 flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-300/60" />
          </div>
        ))}

        {/* 8. Render All Tokens Dynamically with Smooth Animated Clustering */}
        {Array.from(cellTokensMap.entries()).map(([cellKey, tokensList]) => {
          const totalInCell = tokensList.length;

          return tokensList.map(({ player, token, coords, isMovable }, idx) => {
            const colorCfg = COLOR_CONFIG[player.color] || COLOR_CONFIG.red;

            // Compute radial offset for clustered tokens sharing a single tile
            let offsetX = 0;
            let offsetY = 0;
            if (totalInCell > 1 && token.state !== 'base') {
              const angle = (idx / totalInCell) * 2 * Math.PI;
              const radius = 6; // px
              offsetX = Math.cos(angle) * radius;
              offsetY = Math.sin(angle) * radius;
            }

            // Percentage positioning across 15x15 grid
            const leftPct = ((coords.col + 0.5) / 15) * 100;
            const topPct = ((coords.row + 0.5) / 15) * 100;

            return (
              <button
                key={`tok-${player.id}-${token.id}`}
                type="button"
                disabled={!isMovable}
                onClick={() => {
                  if (isMovable) {
                    sounds.playClick();
                    onTokenClick(token.id);
                  }
                }}
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`
                }}
                className={`absolute z-20 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all duration-300 ${
                  colorCfg.bg
                } ${
                  isMovable
                    ? 'ring-4 ring-amber-300 animate-bounce-subtle cursor-pointer scale-110 drop-shadow-[0_0_12px_rgba(245,158,11,0.9)] hover:scale-125 z-30'
                    : 'cursor-default opacity-95'
                }`}
                title={`${player.name}'s Token #${token.id + 1} (${token.state})${isMovable ? ' - Click to Move!' : ''}`}
              >
                {/* Inner pawn styling */}
                <span className="text-[10px] sm:text-xs font-black text-white drop-shadow">
                  {token.id + 1}
                </span>

                {isMovable && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-300 rounded-full animate-ping" />
                )}
              </button>
            );
          });
        })}

      </div>
    </div>
  );
}

export default LudoBoard;
