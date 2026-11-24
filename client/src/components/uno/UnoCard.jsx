import React from 'react';
import { UNO_COLOR_HEX } from '../../data/unoConstants';
import { Ban, RotateCcw, Sparkles } from 'lucide-react';

export function UnoCard({
  card,
  isPlayable = false,
  onClick,
  isSmall = false,
  isBack = false,
  className = ''
}) {
  if (isBack) {
    return (
      <div
        className={`relative rounded-xl border-2 border-white/80 shadow-lg bg-[#1B1B1B] flex items-center justify-center select-none overflow-hidden ${
          isSmall ? 'w-10 h-14' : 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36'
        } ${className}`}
      >
        <div className="absolute inset-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-br from-neutral-900 to-neutral-950 flex items-center justify-center">
          <div className="transform -rotate-45 font-display font-black tracking-wider text-amber-400 text-xs sm:text-base drop-shadow-md">
            UNO
          </div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const colorHex = UNO_COLOR_HEX[card.color] || '#1B1B1B';
  const isWild = card.color === 'wild' || card.type === 'wild' || card.type === 'wild4';

  const renderCardContent = (sizeClass = 'text-2xl sm:text-4xl') => {
    if (card.type === 'skip') {
      return <Ban className="w-8 h-8 sm:w-12 sm:h-12 text-white stroke-[2.5]" />;
    }
    if (card.type === 'reverse') {
      return <RotateCcw className="w-8 h-8 sm:w-12 sm:h-12 text-white stroke-[2.5]" />;
    }
    if (card.type === 'draw2') {
      return (
        <span className={`${sizeClass} font-display font-black text-white italic drop-shadow-md`}>
          +2
        </span>
      );
    }
    if (card.type === 'wild4') {
      return (
        <span className={`${sizeClass} font-display font-black text-white italic drop-shadow-md`}>
          +4
        </span>
      );
    }
    if (card.type === 'wild') {
      return (
        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 border-white grid grid-cols-2 overflow-hidden shadow-md">
          <div className="bg-[#EA3223]" />
          <div className="bg-[#0066CC]" />
          <div className="bg-[#FFC800]" />
          <div className="bg-[#2DA843]" />
        </div>
      );
    }
    return (
      <span className={`${sizeClass} font-display font-black text-white italic drop-shadow-md`}>
        {card.value}
      </span>
    );
  };

  const renderCornerIndex = () => {
    if (card.type === 'skip') return <Ban className="w-3 h-3" />;
    if (card.type === 'reverse') return <RotateCcw className="w-3 h-3" />;
    if (card.type === 'wild') return <Sparkles className="w-3 h-3 text-amber-300" />;
    return card.value;
  };

  return (
    <button
      type="button"
      onClick={isPlayable ? onClick : undefined}
      disabled={!isPlayable}
      className={`relative rounded-xl border-2 sm:border-[3px] border-white shadow-xl transition-all duration-200 select-none overflow-hidden flex flex-col justify-between p-1 sm:p-1.5 ${
        isSmall
          ? 'w-11 h-16 text-[10px]'
          : 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36'
      } ${
        isPlayable
          ? 'cursor-pointer hover:-translate-y-3 hover:scale-105 hover:shadow-2xl hover:z-20 ring-2 ring-white/60 active:scale-95'
          : 'opacity-65 cursor-not-allowed saturate-75'
      } ${className}`}
      style={{
        backgroundColor: isWild ? '#111111' : colorHex
      }}
    >
      {/* Inner Ellipse Background Pattern */}
      <div className="absolute inset-1 sm:inset-1.5 rounded-lg border border-white/20 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-4 transform -rotate-25 rounded-[45%] opacity-35"
          style={{
            backgroundColor: isWild ? '#222222' : '#ffffff'
          }}
        />
      </div>

      {/* Top Left Corner Index */}
      <div className="relative z-10 font-display font-black text-white leading-none flex items-center gap-0.5 text-xs sm:text-sm drop-shadow-xs">
        {renderCornerIndex()}
      </div>

      {/* Center Graphic */}
      <div className="relative z-10 flex items-center justify-center my-auto">
        {renderCardContent(isSmall ? 'text-lg' : 'text-3xl sm:text-5xl')}
      </div>

      {/* Bottom Right Inverted Corner Index */}
      <div className="relative z-10 font-display font-black text-white leading-none self-end transform rotate-180 flex items-center gap-0.5 text-xs sm:text-sm drop-shadow-xs">
        {renderCornerIndex()}
      </div>

      {/* Playable Indicator Glow */}
      {isPlayable && (
        <div className="absolute inset-0 rounded-xl border-2 border-amber-300/80 pointer-events-none animate-pulse-subtle" />
      )}
    </button>
  );
}
