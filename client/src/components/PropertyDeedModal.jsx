import React, { useEffect } from 'react';
import { GROUP_COLORS, GROUP_NAMES, GROUP_TEXT_COLORS, PLAYER_COLORS } from '../data/constants';
import { X, Building2, Hotel, ShieldCheck, Home, Banknote, Undo2, Train, Ship, Plane, TramFront, Lightbulb, Droplets } from 'lucide-react';

export function PropertyDeedModal({
  tile,
  propState,
  ownerPlayer,
  onClose,
  onBuy,
  canBuy,
  currentCash,
  // Stage 3 actions
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

  const isBuyable = ['property', 'station', 'utility'].includes(tile.type);
  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const headerTextColor = GROUP_TEXT_COLORS[tile.group] || '#ffffff';
  const ownerColorObj = ownerPlayer ? PLAYER_COLORS[ownerPlayer.color] : null;
  const currentHouses = propState?.houses || 0;
  const isMortgaged = Boolean(propState?.mortgaged);
  const unmortgageCost = Math.round((tile.mortgageValue || 0) * 1.10);

  const getStationIcon = (id) => {
    if (id === 5) return <Train className="w-6 h-6 text-neutral-800" />;
    if (id === 15) return <Ship className="w-6 h-6 text-neutral-800" />;
    if (id === 25) return <Plane className="w-6 h-6 text-neutral-800" />;
    return <TramFront className="w-6 h-6 text-neutral-800" />;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose && onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fade-in"
    >
      <div className="relative w-full max-w-sm bg-[#FCF9F2] text-[#1B1B1B] border-2 border-[#1B1B1B] rounded-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[92vh] flex flex-col font-body">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors z-20 cursor-pointer shadow-sm"
          title="Close deed (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Color Banner */}
        <div
          className="p-4 text-center border-b-2 border-[#1B1B1B] relative shrink-0 shadow-sm"
          style={{ backgroundColor: groupColor, color: headerTextColor }}
        >
          <span className="text-[10px] uppercase font-bold tracking-widest block opacity-90">
            {tile.type === 'station' ? 'RAILWAY STATION' : tile.type === 'utility' ? 'UTILITY SERVICE' : (GROUP_NAMES[tile.group] || tile.type)}
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight uppercase leading-tight drop-shadow-xs">
            {tile.name}
          </h2>
          {isMortgaged && (
            <span className="inline-block mt-1 bg-red-700 text-white font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-wider shadow">
              MORTGAGED
            </span>
          )}
        </div>

        {/* Deed Body */}
        <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Price & Ownership Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#EFE7D5] border border-neutral-300">
            <div>
              <span className="text-[10px] text-neutral-600 uppercase font-bold block">List Price</span>
              <span className="text-base font-black text-neutral-900 font-number">₹{tile.cost || 'N/A'}</span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-neutral-600 uppercase font-bold block">Owner</span>
              {ownerPlayer ? (
                <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: ownerColorObj?.hex || '#1B1B1B' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ownerColorObj?.hex }} />
                  {ownerPlayer.name} {isOwner && '(You)'}
                </div>
              ) : (
                <span className="text-emerald-700 font-bold text-sm">Unowned</span>
              )}
            </div>
          </div>

          {/* Current Buildings Status */}
          {tile.type === 'property' && isOwner && (
            <div className="p-2.5 rounded-xl bg-[#EFE7D5]/70 border border-neutral-300 flex items-center justify-between">
              <span className="text-neutral-700 font-semibold">Current Buildings:</span>
              <span className="font-bold text-neutral-900">
                {currentHouses === 5 ? (
                  <span className="text-red-700 flex items-center gap-1 font-display"><Hotel className="w-4 h-4" /> 1 Hotel</span>
                ) : currentHouses > 0 ? (
                  <span className="text-emerald-800 flex items-center gap-1 font-display"><Home className="w-4 h-4" /> {currentHouses} {currentHouses === 1 ? 'House' : 'Houses'}</span>
                ) : (
                  'None'
                )}
              </span>
            </div>
          )}

          {/* Rent Schedule for standard property */}
          {tile.type === 'property' && tile.rent && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF5E8] border border-neutral-300 font-mono text-[11px]">
              <div className={`flex justify-between py-1 border-b border-neutral-300/80 ${currentHouses === 0 ? 'bg-amber-100 font-bold px-1 rounded' : ''}`}>
                <span className="text-neutral-700 font-sans">Rent alone:</span>
                <span className="font-number font-bold text-neutral-900">₹{tile.rent[0]}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-300/80">
                <span className="text-neutral-700 font-sans">With Colour Group (Double):</span>
                <span className="font-number font-bold text-amber-800">₹{tile.rent[0] * 2}</span>
              </div>
              <div className={`flex justify-between py-1 border-b border-neutral-300/80 ${currentHouses === 1 ? 'bg-emerald-100 font-bold px-1 rounded' : ''}`}>
                <span className="text-neutral-700 font-sans flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-700" /> With 1 House:
                </span>
                <span className="font-number font-bold text-neutral-900">₹{tile.rent[1]}</span>
              </div>
              <div className={`flex justify-between py-1 border-b border-neutral-300/80 ${currentHouses === 2 ? 'bg-emerald-100 font-bold px-1 rounded' : ''}`}>
                <span className="text-neutral-700 font-sans flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-700" /> With 2 Houses:
                </span>
                <span className="font-number font-bold text-neutral-900">₹{tile.rent[2]}</span>
              </div>
              <div className={`flex justify-between py-1 border-b border-neutral-300/80 ${currentHouses === 3 ? 'bg-emerald-100 font-bold px-1 rounded' : ''}`}>
                <span className="text-neutral-700 font-sans flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-700" /> With 3 Houses:
                </span>
                <span className="font-number font-bold text-neutral-900">₹{tile.rent[3]}</span>
              </div>
              <div className={`flex justify-between py-1 border-b border-neutral-300/80 ${currentHouses === 4 ? 'bg-emerald-100 font-bold px-1 rounded' : ''}`}>
                <span className="text-neutral-700 font-sans flex items-center gap-1">
                  <Home className="w-3.5 h-3.5 text-emerald-700" /> With 4 Houses:
                </span>
                <span className="font-number font-bold text-neutral-900">₹{tile.rent[4]}</span>
              </div>
              <div className={`flex justify-between py-1 pt-1.5 ${currentHouses === 5 ? 'bg-red-100 font-bold px-1 rounded text-red-900' : ''}`}>
                <span className="text-neutral-700 font-sans flex items-center gap-1">
                  <Hotel className="w-3.5 h-3.5 text-red-700" /> With HOTEL:
                </span>
                <span className="font-number font-bold text-red-900">₹{tile.rent[5]}</span>
              </div>
            </div>
          )}

          {/* Station Rent Table */}
          {tile.type === 'station' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF5E8] border border-neutral-300 font-mono text-[11px]">
              <div className="flex justify-center my-1">{getStationIcon(tile.id)}</div>
              <div className="flex justify-between py-1 border-b border-neutral-300/80">
                <span className="text-neutral-700 font-sans">Rent (1 Station):</span>
                <span className="font-number font-bold text-neutral-900">₹25</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-300/80">
                <span className="text-neutral-700 font-sans">Rent (2 Stations):</span>
                <span className="font-number font-bold text-neutral-900">₹50</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-300/80">
                <span className="text-neutral-700 font-sans">Rent (3 Stations):</span>
                <span className="font-number font-bold text-neutral-900">₹100</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-700 font-sans">Rent (4 Stations):</span>
                <span className="font-number font-bold text-neutral-900">₹200</span>
              </div>
            </div>
          )}

          {/* Utility Rent Description */}
          {tile.type === 'utility' && (
            <div className="space-y-2 p-3 rounded-xl bg-[#FAF5E8] border border-neutral-300 text-xs">
              <div className="flex justify-center my-1">
                {tile.id === 12 ? <Lightbulb className="w-7 h-7 text-amber-700" /> : <Droplets className="w-7 h-7 text-blue-700" />}
              </div>
              <p className="text-neutral-800 text-center">
                If 1 Utility is owned, rent is <strong className="text-neutral-950 font-number">4×</strong> the dice roll.
              </p>
              <p className="text-neutral-800 text-center">
                If both Utilities are owned, rent is <strong className="text-neutral-950 font-number">10×</strong> the dice roll.
              </p>
            </div>
          )}

          {/* House Cost & Mortgage Summary */}
          {isBuyable && (
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-neutral-600">
              {tile.houseCost && (
                <div className="p-2 rounded-lg bg-[#EFE7D5] border border-neutral-300">
                  <span>House Cost: </span>
                  <span className="font-bold text-neutral-900 font-number">₹{tile.houseCost}</span>
                </div>
              )}
              {tile.mortgageValue && (
                <div className="p-2 rounded-lg bg-[#EFE7D5] border border-neutral-300">
                  <span>Mortgage Value: </span>
                  <span className="font-bold text-neutral-900 font-number">₹{tile.mortgageValue}</span>
                </div>
              )}
            </div>
          )}

          {/* Stage 3 Owner Controls (Build, Sell, Mortgage, Unmortgage) */}
          {isOwner && (
            <div className="pt-2 border-t border-neutral-300 space-y-2">
              <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
                Manage Property
              </span>

              {/* Building controls for property */}
              {tile.type === 'property' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onBuildHouse(tile.id)}
                    disabled={!buildValidation?.valid}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      buildValidation?.valid
                        ? 'bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer active:scale-95 shadow'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed border border-neutral-400'
                    }`}
                    title={buildValidation?.reason || 'Build house/hotel'}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Build (₹{tile.houseCost})
                  </button>

                  <button
                    onClick={() => onSellHouse(tile.id)}
                    disabled={!sellValidation?.valid}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      sellValidation?.valid
                        ? 'bg-neutral-800 hover:bg-neutral-700 text-amber-300 cursor-pointer active:scale-95'
                        : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                    }`}
                    title={sellValidation?.reason || 'Sell house/hotel'}
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    Sell (+₹{Math.floor(tile.houseCost / 2)})
                  </button>
                </div>
              )}

              {/* Validation warning if build disabled */}
              {tile.type === 'property' && !buildValidation?.valid && currentHouses < 5 && (
                <p className="text-[10px] text-amber-800 leading-tight">
                  ℹ️ {buildValidation?.reason}
                </p>
              )}

              {/* Mortgage / Unmortgage */}
              <div className="pt-1">
                {isMortgaged ? (
                  <button
                    onClick={() => onUnmortgage(tile.id)}
                    disabled={!unmortgageValidation?.valid}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      unmortgageValidation?.valid
                        ? 'bg-amber-600 hover:bg-amber-500 text-neutral-950 cursor-pointer shadow active:scale-95'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Unmortgage (Pay ₹{unmortgageCost})
                  </button>
                ) : (
                  <button
                    onClick={() => onMortgage(tile.id)}
                    disabled={!mortgageValidation?.valid}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      mortgageValidation?.valid
                        ? 'bg-red-700 hover:bg-red-600 text-white cursor-pointer shadow active:scale-95'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    Mortgage (+₹{tile.mortgageValue})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
