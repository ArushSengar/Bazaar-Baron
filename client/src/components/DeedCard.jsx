import React from 'react';
import { GROUP_COLORS, GROUP_NAMES, GROUP_TEXT_COLORS, PLAYER_COLORS } from '../data/constants';
import { Train, Ship, Plane, TramFront, Lightbulb, Droplets, Home, Hotel, ShieldCheck } from 'lucide-react';

/**
 * Tabletop Title Deed Card component.
 * Displays authentic deed details: name, price, full rent table, house cost, mortgage value, and owner.
 */
export function DeedCard({ tile, propState, ownerPlayer, isCompact = false }) {
  if (!tile) return null;

  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const headerTextColor = GROUP_TEXT_COLORS[tile.group] || '#ffffff';
  const ownerColorObj = ownerPlayer ? PLAYER_COLORS[ownerPlayer.color] : null;
  const isMortgaged = Boolean(propState?.mortgaged);
  const currentHouses = propState?.houses || 0;

  // Station specific icon
  const getStationIcon = (id) => {
    if (id === 5) return <Train className="w-6 h-6 text-neutral-800" />;
    if (id === 15) return <Ship className="w-6 h-6 text-neutral-800" />;
    if (id === 25) return <Plane className="w-6 h-6 text-neutral-800" />;
    return <TramFront className="w-6 h-6 text-neutral-800" />;
  };

  return (
    <div
      className={`bg-[#FCF9F2] text-[#1B1B1B] border-2 border-[#1B1B1B] rounded-xl shadow-2xl overflow-hidden font-body select-none transition-all ${
        isCompact ? 'w-64 text-xs' : 'w-full max-w-sm text-sm'
      }`}
      style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.35)' }}
    >
      {/* Top Color Header Banner */}
      <div
        className="p-3 text-center border-b-2 border-[#1B1B1B] relative"
        style={{ backgroundColor: groupColor, color: headerTextColor }}
      >
        <span className="text-[10px] font-extrabold tracking-widest uppercase block opacity-90">
          {tile.type === 'station' ? 'RAILWAY STATION' : tile.type === 'utility' ? 'UTILITY SERVICE' : 'TITLE DEED'}
        </span>
        <h3 className="font-display font-black text-base sm:text-lg tracking-tight uppercase leading-tight drop-shadow-xs">
          {tile.name}
        </h3>
        {isMortgaged && (
          <span className="absolute top-2 right-2 bg-red-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
            MORTGAGED
          </span>
        )}
      </div>

      {/* Deed Body */}
      <div className={`p-3 space-y-2.5 ${isCompact ? 'p-2.5 space-y-2' : 'p-4 space-y-3'}`}>
        {/* List Price & Owner */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-300">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">List Price</span>
            <span className="font-number font-black text-sm sm:text-base text-neutral-900">
              ₹{tile.cost || 'N/A'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">Owner</span>
            {ownerPlayer ? (
              <span
                className="font-bold text-xs sm:text-sm flex items-center justify-end gap-1"
                style={{ color: ownerColorObj?.hex || '#1B1B1B' }}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: ownerColorObj?.hex }}
                />
                {ownerPlayer.name}
              </span>
            ) : (
              <span className="text-emerald-700 font-bold text-xs sm:text-sm">Unowned</span>
            )}
          </div>
        </div>

        {/* Standard Property Rent Schedule */}
        {tile.type === 'property' && tile.rent && (
          <div className="space-y-1 font-mono text-[11px] sm:text-xs">
            <div className={`flex justify-between py-0.5 ${currentHouses === 0 && ownerPlayer ? 'font-bold bg-amber-200/60 px-1 rounded' : ''}`}>
              <span className="font-sans font-semibold text-neutral-700">Rent alone:</span>
              <span className="font-number font-bold">₹{tile.rent[0]}</span>
            </div>
            <div className={`flex justify-between py-0.5 ${currentHouses === 1 ? 'font-bold bg-emerald-100 px-1 rounded' : ''}`}>
              <span className="font-sans text-neutral-600 flex items-center gap-1">
                <Home className="w-3 h-3 text-emerald-700" /> With 1 House:
              </span>
              <span className="font-number font-bold">₹{tile.rent[1]}</span>
            </div>
            <div className={`flex justify-between py-0.5 ${currentHouses === 2 ? 'font-bold bg-emerald-100 px-1 rounded' : ''}`}>
              <span className="font-sans text-neutral-600 flex items-center gap-1">
                <Home className="w-3 h-3 text-emerald-700" /> With 2 Houses:
              </span>
              <span className="font-number font-bold">₹{tile.rent[2]}</span>
            </div>
            <div className={`flex justify-between py-0.5 ${currentHouses === 3 ? 'font-bold bg-emerald-100 px-1 rounded' : ''}`}>
              <span className="font-sans text-neutral-600 flex items-center gap-1">
                <Home className="w-3 h-3 text-emerald-700" /> With 3 Houses:
              </span>
              <span className="font-number font-bold">₹{tile.rent[3]}</span>
            </div>
            <div className={`flex justify-between py-0.5 ${currentHouses === 4 ? 'font-bold bg-emerald-100 px-1 rounded' : ''}`}>
              <span className="font-sans text-neutral-600 flex items-center gap-1">
                <Home className="w-3 h-3 text-emerald-700" /> With 4 Houses:
              </span>
              <span className="font-number font-bold">₹{tile.rent[4]}</span>
            </div>
            <div className={`flex justify-between py-0.5 ${currentHouses === 5 ? 'font-bold bg-red-100 text-red-900 px-1 rounded' : ''}`}>
              <span className="font-sans text-neutral-600 flex items-center gap-1">
                <Hotel className="w-3 h-3 text-red-700" /> With HOTEL:
              </span>
              <span className="font-number font-bold text-red-900">₹{tile.rent[5]}</span>
            </div>

            <div className="pt-2 border-t border-neutral-300 text-[10px] space-y-0.5 text-neutral-600 font-sans">
              <div className="flex justify-between">
                <span>Mortgage Value:</span>
                <span className="font-number font-bold text-neutral-800">₹{tile.mortgageValue}</span>
              </div>
              <div className="flex justify-between">
                <span>Houses cost:</span>
                <span className="font-number font-bold text-neutral-800">₹{tile.houseCost} each</span>
              </div>
              <div className="flex justify-between">
                <span>Hotels cost:</span>
                <span className="font-number font-bold text-neutral-800">₹{tile.houseCost} plus 4 houses</span>
              </div>
            </div>
          </div>
        )}

        {/* Station Rent Schedule */}
        {tile.type === 'station' && (
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs">
            <div className="flex justify-center my-1">{getStationIcon(tile.id)}</div>
            <div className="flex justify-between py-0.5">
              <span className="font-sans text-neutral-600">Rent (1 Station):</span>
              <span className="font-number font-bold">₹25</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-sans text-neutral-600">If 2 Stations owned:</span>
              <span className="font-number font-bold">₹50</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-sans text-neutral-600">If 3 Stations owned:</span>
              <span className="font-number font-bold">₹100</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-sans text-neutral-600">If 4 Stations owned:</span>
              <span className="font-number font-bold">₹200</span>
            </div>
            <div className="pt-1.5 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-600 font-sans">
              <span>Mortgage Value:</span>
              <span className="font-number font-bold text-neutral-800">₹{tile.mortgageValue || 100}</span>
            </div>
          </div>
        )}

        {/* Utility Rent Schedule */}
        {tile.type === 'utility' && (
          <div className="space-y-2 text-[11px] sm:text-xs">
            <div className="flex justify-center my-1">
              {tile.id === 12 ? (
                <Lightbulb className="w-7 h-7 text-amber-700" />
              ) : (
                <Droplets className="w-7 h-7 text-blue-700" />
              )}
            </div>
            <p className="text-neutral-700 text-center leading-relaxed">
              If one Utility is owned, rent is <strong className="text-neutral-900 font-number">4x</strong> amount shown on dice.
            </p>
            <p className="text-neutral-700 text-center leading-relaxed">
              If both Utilities are owned, rent is <strong className="text-neutral-900 font-number">10x</strong> amount shown on dice.
            </p>
            <div className="pt-1.5 border-t border-neutral-300 flex justify-between text-[10px] text-neutral-600 font-sans">
              <span>Mortgage Value:</span>
              <span className="font-number font-bold text-neutral-800">₹{tile.mortgageValue || 75}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
