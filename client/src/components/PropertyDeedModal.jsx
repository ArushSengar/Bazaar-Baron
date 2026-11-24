import React, { useEffect } from 'react';
import { X, Building2, Banknote, Undo2, ShoppingCart, Sparkles } from 'lucide-react';
import { DeedCard } from './DeedCard';

/**
 * 3D Tabletop Property Deed Modal.
 * Shows the authentic 3D Title Deed card along with physical action buttons
 * for buying, mortgaging, and building haveliyan/hotels.
 */
export function PropertyDeedModal({
  tile,
  propState,
  ownerPlayer,
  onClose,
  onBuy,
  canBuy,
  currentCash,
  isOwner,
  onBuildHouse,
  onSellHouse,
  onMortgage,
  onUnmortgage,
  buildValidation,
  sellValidation,
  mortgageValidation,
  unmortgageValidation
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose && onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!tile) return null;

  const currentHouses = propState?.houses || 0;
  const isMortgaged = Boolean(propState?.mortgaged);
  const unmortgageCost = Math.round((tile.mortgageValue || 0) * 1.10);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      style={{ perspective: '1200px' }}
    >
      <div className="relative w-full max-w-sm max-h-[94vh] flex flex-col items-center animate-scale-up space-y-3">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-2 sm:-right-4 p-2 rounded-full bg-neutral-900/90 hover:bg-neutral-800 text-amber-300 border border-neutral-700 shadow-xl transition-all z-40 cursor-pointer active:scale-90"
          title="Close deed (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 3D Physical Deed Card */}
        <div className="w-full overflow-y-auto max-h-[72vh] pr-0.5 custom-scrollbar">
          <DeedCard
            tile={tile}
            propState={propState}
            ownerPlayer={ownerPlayer}
            isCompact={false}
          />
        </div>

        {/* Interactive Action Control Panel */}
        <div className="w-full bg-neutral-900/95 border-2 border-neutral-800 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-sm space-y-2.5">
          {/* Quick Buy Button (if landed on and unowned) */}
          {canBuy && onBuy && (
            <button
              onClick={() => onBuy(tile.id)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 hover:from-emerald-400 hover:to-emerald-500 text-neutral-950 font-display font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 active:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 border border-emerald-300"
            >
              <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              <span>BUY TITLE DEED (₹{tile.cost})</span>
            </button>
          )}

          {/* Owner Property Management (Build / Sell / Mortgage) */}
          {isOwner && (
            <div className="space-y-2">
              {tile.type === 'property' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBuildHouse(tile.id)}
                    disabled={!buildValidation?.valid}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black font-display tracking-wide flex items-center justify-center gap-1.5 transition-all border ${
                      buildValidation?.valid
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-emerald-400/50 shadow-md cursor-pointer active:scale-95'
                        : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                    }`}
                    title={buildValidation?.reason || 'Build haveli/hotel'}
                  >
                    <Building2 className="w-4 h-4 text-emerald-300" />
                    <span>BUILD (₹{tile.houseCost})</span>
                  </button>

                  <button
                    onClick={() => onSellHouse(tile.id)}
                    disabled={!sellValidation?.valid}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black font-display tracking-wide flex items-center justify-center gap-1.5 transition-all border ${
                      sellValidation?.valid
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 border-amber-500/40 shadow-md cursor-pointer active:scale-95'
                        : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                    }`}
                    title={sellValidation?.reason || 'Sell haveli/hotel'}
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span>SELL (+₹{Math.floor(tile.houseCost / 2)})</span>
                  </button>
                </div>
              )}

              {/* Build Validation Guidance */}
              {tile.type === 'property' && !buildValidation?.valid && currentHouses < 5 && (
                <p className="text-[10px] text-amber-400/90 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/20 leading-tight">
                  💡 {buildValidation?.reason}
                </p>
              )}

              {/* Mortgage / Unmortgage Button */}
              <div>
                {isMortgaged ? (
                  <button
                    onClick={() => onUnmortgage(tile.id)}
                    disabled={!unmortgageValidation?.valid}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black font-display tracking-wide flex items-center justify-center gap-1.5 transition-all border ${
                      unmortgageValidation?.valid
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 border-amber-300 shadow-md cursor-pointer active:scale-95'
                        : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>UNMORTGAGE (Pay ₹{unmortgageCost})</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onMortgage(tile.id)}
                    disabled={!mortgageValidation?.valid}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black font-display tracking-wide flex items-center justify-center gap-1.5 transition-all border ${
                      mortgageValidation?.valid
                        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-red-400 shadow-md cursor-pointer active:scale-95'
                        : 'bg-neutral-800/80 text-neutral-500 border-neutral-700/60 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>MORTGAGE (+₹{tile.mortgageValue || Math.floor(tile.cost / 2)})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Done / Close Button */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
export default PropertyDeedModal;
