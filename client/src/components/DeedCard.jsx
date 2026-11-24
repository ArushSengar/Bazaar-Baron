import React from 'react';
import { GROUP_COLORS, GROUP_NAMES, GROUP_TEXT_COLORS, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import { PawnIcon } from './PawnIcon';
import { Train, Ship, Plane, TramFront, Lightbulb, Droplets, Home, Hotel, ShieldCheck, Sparkles, Building2 } from 'lucide-react';

/**
 * High-Fidelity 3D Tabletop Title Deed Card component.
 * Features realistic 3D perspective, cardboard edge bevels, gold-foil inner lining,
 * 3D miniature haveli (house) and hotel blocks, and authentic physical board game tactile styling.
 */
export function DeedCard({ tile, propState, ownerPlayer, isCompact = false }) {
  if (!tile) return null;

  const groupColor = GROUP_COLORS[tile.group] || '#475569';
  const headerTextColor = GROUP_TEXT_COLORS[tile.group] || '#ffffff';
  const ownerColorObj = ownerPlayer ? (PLAYER_COLORS[ownerPlayer.color] || { hex: '#D62F2F', name: 'Owner' }) : null;
  const ownerPawnShape = ownerPlayer ? (PLAYER_PAWNS[ownerPlayer.color] || 'hat') : null;
  const isMortgaged = Boolean(propState?.mortgaged);
  const currentHouses = propState?.houses || 0;

  // Station specific distinctive icons
  const getStationIcon = (id) => {
    if (id === 5) return <Train className="w-6 h-6 text-neutral-800 drop-shadow-sm" />;
    if (id === 15) return <Ship className="w-6 h-6 text-neutral-800 drop-shadow-sm" />;
    if (id === 25) return <Plane className="w-6 h-6 text-neutral-800 drop-shadow-sm" />;
    return <TramFront className="w-6 h-6 text-neutral-800 drop-shadow-sm" />;
  };

  return (
    <div
      className={`relative bg-[#FFFDF9] text-[#1B1B1B] border-2 border-[#2A1E14] rounded-2xl select-none font-body transition-all duration-300 transform-gpu ${
        isCompact ? 'w-64 text-xs' : 'w-full max-w-sm text-sm'
      }`}
      style={{
        boxShadow: '0 20px 45px -8px rgba(0,0,0,0.55), 0 8px 18px -4px rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -2px 0 rgba(0,0,0,0.12)',
        transform: 'perspective(1000px) rotateX(1deg)',
      }}
    >
      {/* 3D Gold Foil Inner Rim */}
      <div className="absolute inset-1 rounded-xl border border-amber-600/30 pointer-events-none z-10" />

      {/* Tilted 3D Rubber Wax Mortgaged Stamp */}
      {isMortgaged && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none overflow-hidden">
          <div
            className="px-4 py-2 border-4 border-red-700 bg-red-900/85 text-red-100 font-display font-black text-sm sm:text-base uppercase tracking-widest rounded-xl shadow-2xl backdrop-blur-xs transform -rotate-12 border-dashed flex flex-col items-center justify-center"
            style={{
              boxShadow: '0 8px 24px rgba(185, 28, 28, 0.6), inset 0 1px 2px rgba(255,255,255,0.4)',
              textShadow: '0 2px 4px rgba(0,0,0,0.7)'
            }}
          >
            <span>⚠️ MORTGAGED ⚠️</span>
            <span className="text-[10px] tracking-normal opacity-90 font-mono mt-0.5">गिरवी रखी संपत्ति</span>
          </div>
        </div>
      )}

      {/* Top 3D Glossy Header Banner */}
      <div
        className="p-3 sm:p-3.5 text-center border-b-2 border-[#2A1E14] relative rounded-t-xl overflow-hidden shadow-sm"
        style={{
          backgroundColor: groupColor,
          color: headerTextColor,
          background: `linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.2) 100%), ${groupColor}`
        }}
      >
        {/* Subtle 3D Top Highlight Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/40" />

        <div className="flex items-center justify-center gap-1.5 opacity-90 mb-0.5">
          <span className="text-[9px] sm:text-[10px] font-black tracking-widest uppercase">
            {tile.type === 'station'
              ? '🚆 INDIAN RAILWAYS'
              : tile.type === 'utility'
              ? '⚡ PUBLIC UTILITY'
              : `TITLE DEED • ${GROUP_NAMES[tile.group]?.toUpperCase() || 'PROPERTY'}`}
          </span>
        </div>

        <h3 className="font-display font-black text-base sm:text-lg tracking-tight uppercase leading-tight drop-shadow-md">
          {tile.name}
        </h3>
      </div>

      {/* Deed Body */}
      <div className={`p-3.5 sm:p-4 space-y-3 ${isCompact ? 'p-2.5 space-y-2' : ''}`}>
        {/* 3D Debossed List Price & Owner Card */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F0E8D5]/80 border border-[#D8CBB0] shadow-inner">
          <div>
            <span className="text-[9px] sm:text-[10px] uppercase font-black text-neutral-500 tracking-wider block">
              Purchase Price
            </span>
            <span className="font-number font-black text-sm sm:text-base text-neutral-950 flex items-center gap-0.5">
              ₹{tile.cost || 'N/A'}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[9px] sm:text-[10px] uppercase font-black text-neutral-500 tracking-wider block">
              Title Owner
            </span>
            {ownerPlayer ? (
              <span
                className="font-extrabold text-xs sm:text-sm flex items-center justify-end gap-1.5"
                style={{ color: ownerColorObj?.hex || '#1B1B1B' }}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  <PawnIcon shape={ownerPawnShape} color={ownerColorObj?.hex} size={14} />
                </div>
                <span>{ownerPlayer.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                <Sparkles className="w-3 h-3" /> Available
              </span>
            )}
          </div>
        </div>

        {/* Standard Property Rent Schedule */}
        {tile.type === 'property' && tile.rent && (
          <div className="space-y-1 font-mono text-[11px] sm:text-xs bg-[#FAF5E8]/70 p-2 sm:p-2.5 rounded-xl border border-[#DECDB3]">
            {/* Rent Alone */}
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                currentHouses === 0 && ownerPlayer
                  ? 'bg-amber-300/80 font-black text-neutral-950 border border-amber-400 shadow-xs'
                  : 'text-neutral-700 hover:bg-black/5'
              }`}
            >
              <span className="font-sans font-semibold">Rent alone:</span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 0 && ownerPlayer && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-amber-900 bg-amber-400/90 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-extrabold text-neutral-950">₹{tile.rent[0]}</span>
              </div>
            </div>

            {/* With Full Group (Double Rent) */}
            <div className="flex items-center justify-between py-1 px-1.5 rounded text-neutral-600 hover:bg-black/5 text-[10px] sm:text-[11px]">
              <span className="font-sans font-semibold">Full Color Group:</span>
              <span className="font-number font-bold text-amber-900">₹{tile.rent[0] * 2}</span>
            </div>

            {/* 1 House */}
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                currentHouses === 1
                  ? 'bg-emerald-200/90 font-black text-emerald-950 border border-emerald-400 shadow-xs'
                  : 'text-neutral-700 hover:bg-black/5'
              }`}
            >
              <span className="font-sans flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-800 shadow-xs flex items-center justify-center text-[9px] text-white">
                  🏠
                </span>
                <span>With 1 Haveli:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 1 && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-emerald-900 bg-emerald-300 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-extrabold text-neutral-950">₹{tile.rent[1]}</span>
              </div>
            </div>

            {/* 2 Houses */}
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                currentHouses === 2
                  ? 'bg-emerald-200/90 font-black text-emerald-950 border border-emerald-400 shadow-xs'
                  : 'text-neutral-700 hover:bg-black/5'
              }`}
            >
              <span className="font-sans flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-800 shadow-xs flex items-center justify-center text-[9px] text-white">
                  🏠
                </span>
                <span>With 2 Haveliyan:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 2 && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-emerald-900 bg-emerald-300 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-extrabold text-neutral-950">₹{tile.rent[2]}</span>
              </div>
            </div>

            {/* 3 Houses */}
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                currentHouses === 3
                  ? 'bg-emerald-200/90 font-black text-emerald-950 border border-emerald-400 shadow-xs'
                  : 'text-neutral-700 hover:bg-black/5'
              }`}
            >
              <span className="font-sans flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-800 shadow-xs flex items-center justify-center text-[9px] text-white">
                  🏠
                </span>
                <span>With 3 Haveliyan:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 3 && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-emerald-900 bg-emerald-300 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-extrabold text-neutral-950">₹{tile.rent[3]}</span>
              </div>
            </div>

            {/* 4 Houses */}
            <div
              className={`flex items-center justify-between py-1 px-1.5 rounded transition-all ${
                currentHouses === 4
                  ? 'bg-emerald-200/90 font-black text-emerald-950 border border-emerald-400 shadow-xs'
                  : 'text-neutral-700 hover:bg-black/5'
              }`}
            >
              <span className="font-sans flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-800 shadow-xs flex items-center justify-center text-[9px] text-white">
                  🏠
                </span>
                <span>With 4 Haveliyan:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 4 && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-emerald-900 bg-emerald-300 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-extrabold text-neutral-950">₹{tile.rent[4]}</span>
              </div>
            </div>

            {/* Hotel / Grand Haveli */}
            <div
              className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-all ${
                currentHouses === 5
                  ? 'bg-red-200/95 font-black text-red-950 border-2 border-red-500 shadow-sm'
                  : 'bg-red-50/70 text-red-950 border border-red-200'
              }`}
            >
              <span className="font-sans font-bold flex items-center gap-1.5 text-red-900">
                <span className="w-4 h-4 rounded bg-red-600 border border-red-800 shadow-xs flex items-center justify-center text-[10px] text-white font-black">
                  🏰
                </span>
                <span>GRAND HOTEL:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {currentHouses === 5 && (
                  <span className="text-[8px] font-sans font-black uppercase tracking-wider text-red-100 bg-red-700 px-1 py-0.2 rounded">
                    Active
                  </span>
                )}
                <span className="font-number font-black text-sm text-red-900">₹{tile.rent[5]}</span>
              </div>
            </div>
          </div>
        )}

        {/* Station Rent Schedule */}
        {tile.type === 'station' && (
          <div className="space-y-1.5 font-mono text-[11px] sm:text-xs bg-[#FAF5E8]/70 p-2.5 rounded-xl border border-[#DECDB3]">
            <div className="flex items-center justify-center my-1 p-2 bg-neutral-100 rounded-lg border border-neutral-300">
              {getStationIcon(tile.id)}
            </div>
            <div className="flex justify-between py-0.5 border-b border-neutral-200">
              <span className="font-sans text-neutral-700">If 1 Station owned:</span>
              <span className="font-number font-bold text-neutral-950">₹25</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-neutral-200">
              <span className="font-sans text-neutral-700">If 2 Stations owned:</span>
              <span className="font-number font-bold text-neutral-950">₹50</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-neutral-200">
              <span className="font-sans text-neutral-700">If 3 Stations owned:</span>
              <span className="font-number font-bold text-neutral-950">₹100</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="font-sans font-bold text-neutral-900">If 4 Stations owned:</span>
              <span className="font-number font-black text-neutral-950">₹200</span>
            </div>
          </div>
        )}

        {/* Utility Rent Schedule */}
        {tile.type === 'utility' && (
          <div className="space-y-2 text-[11px] sm:text-xs bg-[#FAF5E8]/70 p-3 rounded-xl border border-[#DECDB3]">
            <div className="flex justify-center my-1 p-2 bg-neutral-100 rounded-lg border border-neutral-300">
              {tile.id === 12 ? (
                <Lightbulb className="w-8 h-8 text-amber-600 drop-shadow" />
              ) : (
                <Droplets className="w-8 h-8 text-blue-600 drop-shadow" />
              )}
            </div>
            <p className="text-neutral-700 text-center leading-relaxed font-sans">
              If one Utility is owned, rent is <strong className="text-neutral-950 font-number font-black">4×</strong> amount shown on dice.
            </p>
            <p className="text-neutral-700 text-center leading-relaxed font-sans">
              If both Utilities are owned, rent is <strong className="text-neutral-950 font-number font-black">10×</strong> amount shown on dice.
            </p>
          </div>
        )}

        {/* 3D Tactile Specs Footer Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#D8CBB0] text-[10px] text-center font-sans">
          <div className="p-1.5 rounded-lg bg-[#EFE7D5]/80 border border-[#D5C7B0]">
            <span className="text-[8px] uppercase font-bold text-neutral-500 block">Mortgage</span>
            <span className="font-number font-extrabold text-neutral-900">₹{tile.mortgageValue || Math.floor((tile.cost || 0) / 2)}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-[#EFE7D5]/80 border border-[#D5C7B0]">
            <span className="text-[8px] uppercase font-bold text-neutral-500 block">Haveli Cost</span>
            <span className="font-number font-extrabold text-neutral-900">₹{tile.houseCost || '—'}</span>
          </div>

          <div className="p-1.5 rounded-lg bg-[#EFE7D5]/80 border border-[#D5C7B0]">
            <span className="text-[8px] uppercase font-bold text-neutral-500 block">Hotel Cost</span>
            <span className="font-number font-extrabold text-neutral-900">₹{tile.houseCost || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DeedCard;
