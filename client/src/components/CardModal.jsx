import React, { useEffect } from 'react';
import { HelpCircle, Gift, Sparkles, Check, X } from 'lucide-react';
import { sounds } from '../utils/audio';

export function CardModal({ card, onDismiss }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onDismiss && onDismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  if (!card) return null;

  const isChance = card.deckType === 'chance';

  const handleDismiss = () => {
    sounds.playClick();
    onDismiss();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        className={`relative w-full max-w-sm bg-[#FAF7F0] text-[#1B1B1B] border-2 rounded-2xl shadow-2xl overflow-hidden font-body animate-scale-up select-none ${
          isChance ? 'border-amber-600' : 'border-emerald-600'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/20 hover:bg-black/40 text-neutral-800 hover:text-white transition-colors z-20 cursor-pointer"
          title="Close card"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Card Header */}
        <div
          className={`p-3.5 text-center border-b-2 border-[#1B1B1B] text-white shadow-sm ${
            isChance
              ? 'bg-gradient-to-r from-amber-600 to-amber-700'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase mb-0.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>{isChance ? 'Kismat Deck' : 'Bazaar Welfare Fund'}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          </div>
          <h2 className="text-lg font-black font-display tracking-tight uppercase drop-shadow-xs">
            {isChance ? 'Chance Card Drawn' : 'Community Card Drawn'}
          </h2>
        </div>

        {/* Card Graphic & Message */}
        <div className="p-4 sm:p-5 text-center space-y-3">
          <div
            className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border shadow-md ${
              isChance
                ? 'bg-amber-100 border-amber-400 text-amber-800'
                : 'bg-emerald-100 border-emerald-400 text-emerald-800'
            }`}
          >
            {isChance ? <HelpCircle className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
          </div>

          <div className="bg-[#EFE7D5] border border-neutral-300 rounded-xl p-3 shadow-inner">
            <p className="text-xs sm:text-sm font-semibold text-neutral-900 leading-relaxed italic">
              "{card.text}"
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 text-white ${
              isChance
                ? 'bg-amber-600 hover:bg-amber-500 border border-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-700'
            }`}
          >
            <Check className="w-4 h-4" /> Continue Playing
          </button>
        </div>
      </div>
    </div>
  );
}
