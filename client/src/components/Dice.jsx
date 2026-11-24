import React, { useEffect } from 'react';
import { sounds } from '../utils/audio';

/**
 * Standard dice pip layouts (1 to 6).
 */
const PIP_CONFIGS = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8]
};

export function Die({ value = 1, isRolling = false, dieIndex = 1 }) {
  const activePips = new Set(PIP_CONFIGS[value] || [4]);
  const tumbleClass = isRolling ? (dieIndex === 1 ? 'dice-tumble-1' : 'dice-tumble-2') : 'hover:scale-105';

  return (
    <div
      className={`relative w-9 h-9 sm:w-14 sm:h-14 bg-gradient-to-br from-[#FAF7F0] via-[#FFFFFF] to-[#EBE3D0] border-2 border-[#1B1B1B] rounded-lg sm:rounded-xl shadow-lg p-1 sm:p-2 transition-transform duration-200 select-none ${tumbleClass}`}
      style={{
        boxShadow: isRolling
          ? '0 12px 24px -4px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.9)'
          : '0 6px 12px -2px rgba(0, 0, 0, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.9)'
      }}
    >
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-0.5 sm:gap-1 pointer-events-none">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
          <div key={idx} className="flex items-center justify-center">
            {activePips.has(idx) && (
              <span className="w-1.5 h-1.5 sm:w-3 sm:h-3 rounded-full bg-[#1B1B1B] shadow-inner" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiceDisplay({ dice = [1, 1], isRolling = false, lastRollDoubles = false }) {
  const total = (dice[0] || 1) + (dice[1] || 1);

  // Trigger sound when rolling
  useEffect(() => {
    if (isRolling) {
      sounds.playDiceRoll();
    }
  }, [isRolling]);

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2">
      <div className="flex items-center gap-1.5 sm:gap-3 py-0.5 sm:py-1">
        <Die value={dice[0] || 1} isRolling={isRolling} dieIndex={1} />
        <Die value={dice[1] || 1} isRolling={isRolling} dieIndex={2} />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs font-mono font-bold text-neutral-900 bg-[#E8DCB8] border border-[#8B5A2B]/40 px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs leading-tight">
          Total: {total}
        </span>
        {lastRollDoubles && (
          <span className="text-[9px] sm:text-[11px] font-black tracking-wider uppercase bg-amber-500 text-neutral-950 px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse shadow-md border border-amber-600 leading-tight">
            🎲 Doubles!
          </span>
        )}
      </div>
    </div>
  );
}
