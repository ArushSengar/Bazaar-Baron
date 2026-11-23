import React, { useState, useEffect, useRef } from 'react';
import { GROUP_COLORS, GROUP_NAMES, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import boardData from '../data/board.json';
import { PawnIcon } from './PawnIcon';
import { BuyActionCard } from './BuyActionCard';
import { MunimjiAdvisor } from './MunimjiAdvisor';
import {
  Coins,
  Dices,
  ShoppingCart,
  ArrowRight,
  Building2,
  Users,
  ScrollText,
  Crown,
  Ticket,
  ShieldAlert,
  Home,
  Hotel,
  Banknote,
  Sparkles,
  Handshake,
  ChevronRight,
  MapPin,
  Map,
  Bot
} from 'lucide-react';
import { sounds } from '../utils/audio';

export function SidePanel({
  gameState,
  player,
  isMyTurn,
  onRoll,
  onBuy,
  onAuction,
  onDecline,
  onEndTurn,
  onSelectProperty,
  onPayJailFine,
  onUseJailCard,
  onOpenTrade,
  isRolling = false
}) {
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'properties' | 'logs'
  const [cashDelta, setCashDelta] = useState(null); // { amount, isPositive }
  const prevCashRef = useRef(player?.cash);

  const activePlayerId = gameState?.playerOrder?.[gameState?.turnIndex];
  const activePlayer = gameState?.players?.find(p => p.id === activePlayerId);
  const isInJail = Boolean(activePlayer?.inJail);
  const currentLandedTile = activePlayer ? boardData[activePlayer.position] : null;

  // Track cash change animations
  useEffect(() => {
    if (player?.cash !== undefined && prevCashRef.current !== undefined) {
      const diff = player.cash - prevCashRef.current;
      if (diff !== 0) {
        setCashDelta({ amount: Math.abs(diff), isPositive: diff > 0 });
        if (diff > 0) sounds.playCashChime();
        const t = setTimeout(() => setCashDelta(null), 1800);
        prevCashRef.current = player.cash;
        return () => clearTimeout(t);
      }
    }
    prevCashRef.current = player?.cash;
  }, [player?.cash]);

  // Group properties owned by current player
  const myProperties = boardData.filter((tile) => {
    return gameState?.properties?.[tile.id]?.ownerId === player?.id;
  });

  const myGroupedProps = myProperties.reduce((acc, tile) => {
    const grp = tile.group || 'other';
    if (!acc[grp]) acc[grp] = [];
    acc[grp].push(tile);
    return acc;
  }, {});

  const groupTotalCounts = {
    brown: 2,
    light_blue: 3,
    pink: 3,
    orange: 3,
    red: 3,
    yellow: 3,
    green: 3,
    dark_blue: 2,
    station: 4,
    utility: 2
  };

  const allMapGroups = [
    'brown',
    'light_blue',
    'pink',
    'orange',
    'red',
    'yellow',
    'green',
    'dark_blue',
    'station',
    'utility'
  ];

  // Plain English Status Label
  const getPlainStatus = () => {
    if (player?.bankrupt) return 'Bankrupt - Spectating';
    if (isMyTurn) {
      if (isInJail && gameState?.step === 'INITIAL') return 'In Detention: Choose escape option';
      if (gameState?.step === 'INITIAL') return 'Your turn: Roll the dice!';
      if (gameState?.step === 'AWAITING_BUY') return `Buy ${currentLandedTile?.name || 'Property'}?`;
      if (gameState?.step === 'TURN_END') return 'Turn complete: Press End Turn';
      return 'Your turn';
    }
    return `Waiting for ${activePlayer?.name || 'merchant'}...`;
  };

  return (
    <div className="w-full lg:w-[440px] xl:w-[490px] 2xl:w-[530px] flex flex-col gap-3 bg-neutral-900/95 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 shadow-2xl backdrop-blur text-neutral-100 select-none overflow-hidden max-h-[calc(100vh-80px)] font-body">
      {/* 1. All Players Table Overview (Poker Style Table Seatings) */}
      <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-xs uppercase font-bold text-neutral-400 tracking-wider px-1">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-amber-400" /> Merchants At Table</span>
          <span>{gameState?.players?.length || 0} Players</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(gameState?.players || []).map((p) => {
            const isSelf = p.id === player?.id;
            const isActive = p.id === activePlayerId;
            const pColor = PLAYER_COLORS[p.color] || { hex: '#D62F2F', text: '#ffffff' };
            const pShape = PLAYER_PAWNS[p.color] || 'hat';
            const propsCount = Object.values(gameState?.properties || {}).filter(pr => pr.ownerId === p.id).length;

            return (
              <div
                key={p.id}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                  p.bankrupt
                    ? 'bg-neutral-950/40 border-neutral-900 opacity-40 grayscale'
                    : isActive
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/50'
                    : isSelf
                    ? 'bg-neutral-900 border-neutral-700'
                    : 'bg-neutral-950 border-neutral-800/80'
                }`}
              >
                {/* Avatar Display */}
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border"
                    style={{ backgroundColor: `${pColor.hex}22`, borderColor: pColor.hex }}
                  >
                    {p.avatar || '🧑'}
                  </div>
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center p-0.5 shadow border border-black/40"
                    style={{ backgroundColor: pColor.hex }}
                  >
                    <PawnIcon shape={pShape} color="#ffffff" size={9} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-bold text-xs sm:text-sm text-neutral-100 truncate">
                      {p.name}
                    </span>
                    {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    {p.isBot && <Bot className="w-3 h-3 text-purple-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs">
                    <span className="font-number font-black text-emerald-400 text-sm">
                      ₹{p.cash}
                    </span>
                    <span className="text-neutral-400 font-mono font-semibold text-[11px]">
                      {propsCount} properties
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. My Treasury Card with Animated Cash Counter */}
      <div className="relative bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 shadow-lg flex items-center justify-between overflow-hidden shrink-0">
        <div>
          <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">
            My Treasury
          </span>
          <div className="flex items-baseline gap-2.5 mt-0.5">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-number tracking-tight">
              ₹{player?.cash ?? 1500}
            </span>
            {cashDelta && (
              <span
                className={`text-sm font-black font-number animate-bounce ${
                  cashDelta.isPositive ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {cashDelta.isPositive ? `+₹${cashDelta.amount}` : `-₹${cashDelta.amount}`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTrade}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/40 flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm active:scale-95"
          >
            <Handshake className="w-4 h-4" />
            <span>Propose Trade</span>
          </button>
        </div>
      </div>

      {/* 3. Munimji AI Advisor */}
      <div className="shrink-0">
        <MunimjiAdvisor gameState={gameState} player={player} isMyTurn={isMyTurn} />
      </div>

      {/* 4. Single Contextual Next Action Console (Dead Simple Turn Flow) */}
      <div className={`p-3 sm:p-4 rounded-2xl border transition-all shrink-0 ${
        isMyTurn
          ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/40'
          : 'bg-neutral-950/70 border-neutral-800'
      }`}>
        {/* Status Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />
            <span className="text-xs sm:text-sm font-bold text-neutral-100">
              {getPlainStatus()}
            </span>
          </div>
          {isMyTurn && (
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              Your Turn
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {/* JAIL DETENTION CONTROLS */}
          {isInJail && isMyTurn && gameState?.step === 'INITIAL' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onRoll}
                  disabled={isRolling}
                  className="min-h-[46px] py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                >
                  <Dices className="w-4 h-4" />
                  <span>Roll Doubles</span>
                </button>

                <button
                  onClick={onPayJailFine}
                  disabled={player.cash < 50}
                  className={`min-h-[46px] py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all ${
                    player.cash >= 50
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-emerald-300 border border-emerald-500/40 cursor-pointer shadow active:scale-95'
                      : 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Pay ₹50 Fine</span>
                </button>
              </div>

              {(player.getOutOfJailCards || 0) > 0 && (
                <button
                  onClick={onUseJailCard}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Use Bail Card ({player.getOutOfJailCards} left)</span>
                </button>
              )}
            </div>
          )}

          {/* NORMAL INITIAL STEP: ROLL DICE */}
          {!isInJail && gameState?.step === 'INITIAL' && (
            <button
              onClick={onRoll}
              disabled={!isMyTurn || isRolling}
              className={`w-full min-h-[48px] py-3 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all font-display ${
                isMyTurn && !isRolling
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-neutral-950 shadow-xl shadow-amber-500/30 active:scale-95 cursor-pointer animate-pulse-glow'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              }`}
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'ROLLING DICE...' : isMyTurn ? 'ROLL DICE' : `WAITING FOR ${activePlayer?.name?.toUpperCase() || 'PLAYER'}`}</span>
            </button>
          )}

          {/* DOCKED BUY ACTION CARD */}
          {gameState?.step === 'AWAITING_BUY' && currentLandedTile && (
            <BuyActionCard
              tile={currentLandedTile}
              player={player}
              isMyTurn={isMyTurn}
              onBuy={onBuy}
              onAuction={onAuction}
              onDecline={onDecline}
            />
          )}

          {/* TURN END STEP */}
          {gameState?.step === 'TURN_END' && (
            <button
              onClick={onEndTurn}
              disabled={!isMyTurn}
              className={`w-full min-h-[48px] py-3 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all font-display ${
                isMyTurn
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-xl shadow-blue-500/30 active:scale-95 cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
              <span>{isMyTurn ? 'END TURN' : `Waiting for ${activePlayer?.name || 'player'} to finish...`}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Rich Secondary Tabs: Bazaar Map / My Deeds / History */}
      <div className="flex bg-neutral-950 border border-neutral-800 p-1 rounded-xl gap-1 text-xs sm:text-sm font-bold shrink-0">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'map'
              ? 'bg-neutral-800 text-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Bazaar Map</span>
        </button>

        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'properties'
              ? 'bg-neutral-800 text-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>My Deeds ({myProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'logs'
              ? 'bg-neutral-800 text-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Chronicles</span>
        </button>
      </div>

      {/* 6. Dynamic Scrollable Tab Content */}
      <div className="flex-1 min-h-[220px] max-h-[380px] overflow-y-auto space-y-2 pr-1 text-xs">
        {/* TAB 1: BAZAAR MAP (TERRITORY EMPIRE OVERVIEW) */}
        {activeTab === 'map' && (
          <div className="space-y-2">
            {allMapGroups.map(grpKey => {
              const groupTiles = boardData.filter(t => t.group === grpKey);
              const groupColor = GROUP_COLORS[grpKey] || '#475569';
              const groupName = GROUP_NAMES[grpKey] || grpKey;
              const total = groupTiles.length;
              const ownedCount = groupTiles.filter(t => Boolean(gameState?.properties?.[t.id]?.ownerId)).length;

              return (
                <div key={grpKey} className="bg-neutral-950 border border-neutral-800/90 rounded-xl p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-md shadow-sm shrink-0" style={{ backgroundColor: groupColor }} />
                      <span className="font-bold text-neutral-200">{groupName}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-neutral-400">
                      {ownedCount}/{total} Owned
                    </span>
                  </div>

                  {/* Properties in this territory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {groupTiles.map(t => {
                      const prop = gameState?.properties?.[t.id];
                      const owner = prop?.ownerId
                        ? gameState?.players?.find(p => p.id === prop.ownerId)
                        : null;
                      const ownerColor = owner ? PLAYER_COLORS[owner.color] : null;
                      const houses = prop?.houses || 0;
                      const isMort = Boolean(prop?.mortgaged);

                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectProperty(t)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between ${
                            owner
                              ? 'bg-neutral-900 border-neutral-700/80'
                              : 'bg-neutral-950/60 border-neutral-900 border-dashed hover:border-neutral-700'
                          }`}
                        >
                          <div className="min-w-0 pr-1">
                            <div className="font-bold text-neutral-200 text-xs truncate">{t.name}</div>
                            {owner ? (
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                                <span className="text-xs">{owner.avatar || '🧑'}</span>
                                <span className="font-semibold truncate" style={{ color: ownerColor?.hex || '#f59e0b' }}>
                                  {owner.name}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[10px] text-emerald-400 font-number font-bold mt-0.5">
                                ₹{t.cost} • For Sale
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 flex items-center gap-1">
                            {isMort && (
                              <span className="text-[9px] bg-red-950 text-red-400 border border-red-500/40 px-1 py-0.5 rounded font-bold">
                                Mort
                              </span>
                            )}
                            {houses === 5 ? (
                              <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5 bg-red-500/20 px-1 py-0.5 rounded">
                                <Hotel className="w-3 h-3" /> Hotel
                              </span>
                            ) : houses > 0 ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/20 px-1 py-0.5 rounded">
                                <Home className="w-3 h-3" /> {houses}H
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: MY DEEDS */}
        {activeTab === 'properties' && (
          <div className="space-y-2">
            {myProperties.length === 0 ? (
              <div className="text-center py-10 bg-neutral-950/60 rounded-xl border border-neutral-900 p-4">
                <Building2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-400 text-xs font-semibold">
                  You do not own any properties yet.
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Roll the dice and land on unowned tiles to start building your bazaar empire!
                </p>
              </div>
            ) : (
              Object.entries(myGroupedProps).map(([group, props]) => {
                const totalInGroup = groupTotalCounts[group] || 3;
                const isMonopoly = props.length >= totalInGroup;
                const groupColor = GROUP_COLORS[group] || '#475569';

                return (
                  <div key={group} className="bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-neutral-800">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: groupColor }} />
                        <span className="font-bold text-neutral-200 uppercase text-xs">
                          {GROUP_NAMES[group] || group}
                        </span>
                      </div>
                      <span className={`font-mono text-xs font-bold ${isMonopoly ? 'text-amber-400' : 'text-neutral-400'}`}>
                        {props.length}/{totalInGroup} {isMonopoly && '★ Monopoly Formed!'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {props.map(p => {
                        const propState = gameState?.properties?.[p.id];
                        const houses = propState?.houses || 0;
                        const isMort = Boolean(propState?.mortgaged);

                        return (
                          <div
                            key={p.id}
                            onClick={() => onSelectProperty(p)}
                            className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span className="font-bold text-xs text-neutral-200 truncate">{p.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isMort && <span className="text-[10px] text-red-400 font-bold bg-red-950/80 px-1 rounded">Mortgaged</span>}
                              {houses === 5 ? (
                                <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5 bg-red-500/20 px-1.5 py-0.5 rounded"><Hotel className="w-3 h-3" /> Hotel</span>
                              ) : houses > 0 ? (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-500/20 px-1.5 py-0.5 rounded"><Home className="w-3 h-3" /> {houses} Houses</span>
                              ) : null}
                              <ChevronRight className="w-4 h-4 text-neutral-500" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: LIVE CHRONICLES / HISTORY */}
        {activeTab === 'logs' && (
          <div className="space-y-1.5">
            {(!gameState?.logs || gameState.logs.length === 0) ? (
              <div className="text-center py-8 text-neutral-500 text-xs italic">
                No events recorded yet.
              </div>
            ) : (
              [...(gameState.logs || [])].reverse().map((log) => {
                const isWinner = log.type === 'winner';
                const isAction = log.type === 'action';
                const isWarn = log.type === 'warning';

                return (
                  <div
                    key={log.id}
                    className={`p-2 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                      isWinner
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 font-bold'
                        : isAction
                        ? 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
                        : isWarn
                        ? 'bg-red-950/40 border-red-500/30 text-red-300'
                        : 'bg-neutral-950/60 border-neutral-900 text-neutral-400'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-neutral-500 shrink-0 mt-0.5">
                      {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="flex-1">{log.text}</span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
