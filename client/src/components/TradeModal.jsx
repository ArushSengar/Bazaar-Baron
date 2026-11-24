import React, { useState, useEffect } from 'react';
import { GROUP_COLORS, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import boardData from '../data/board.json';
import { Handshake, ArrowRightLeft, X, Check, Ban, Coins, Ticket, Building2 } from 'lucide-react';
import { PawnIcon } from './PawnIcon';

export function TradeModal({
  isOpen,
  onClose,
  player,
  gameState,
  onProposeTrade,
  onAcceptTrade,
  onRejectTrade
}) {
  const activeTrade = gameState?.activeTrade;
  const isIncoming = activeTrade && activeTrade.targetPlayerId === player?.id;
  const isOutgoing = activeTrade && activeTrade.senderId === player?.id;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isOpen && onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const otherPlayers = (gameState?.players || []).filter(
    p => p.id !== player?.id && !p.bankrupt
  );

  const [targetId, setTargetId] = useState(() => otherPlayers[0]?.id || '');
  const [offerCash, setOfferCash] = useState(0);
  const [offerProps, setOfferProps] = useState([]);
  const [offerCards, setOfferCards] = useState(0);

  const [requestCash, setRequestCash] = useState(0);
  const [requestProps, setRequestProps] = useState([]);
  const [requestCards, setRequestCards] = useState(0);

  if (!isOpen && !isIncoming && !isOutgoing) return null;

  const targetPlayer = otherPlayers.find(p => p.id === targetId) || otherPlayers[0];

  const getEligibleProperties = (ownerId) => {
    return boardData.filter((tile) => {
      const prop = gameState?.properties?.[tile.id];
      if (prop?.ownerId !== ownerId) return false;
      const groupTiles = boardData.filter(t => t.group === tile.group);
      const hasBuildings = groupTiles.some(t => (gameState?.properties?.[t.id]?.houses || 0) > 0);
      return !hasBuildings;
    });
  };

  const myEligibleProps = getEligibleProperties(player?.id);
  const targetEligibleProps = targetPlayer ? getEligibleProperties(targetPlayer.id) : [];

  const handleToggleOfferProp = (id) => {
    setOfferProps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleRequestProp = (id) => {
    setRequestProps(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmitProposal = (e) => {
    e.preventDefault();
    if (!targetPlayer) return;

    onProposeTrade({
      targetPlayerId: targetPlayer.id,
      offerCash: parseInt(offerCash, 10) || 0,
      offerPropertyIds: offerProps,
      offerJailCards: parseInt(offerCards, 10) || 0,
      requestCash: parseInt(requestCash, 10) || 0,
      requestPropertyIds: requestProps,
      requestJailCards: parseInt(requestCards, 10) || 0
    });

    onClose();
  };

  // Render Incoming Proposal
  if (isIncoming) {
    const sender = gameState.players.find(p => p.id === activeTrade.senderId);
    const offeredTiles = boardData.filter(t => activeTrade.offerPropertyIds?.includes(t.id));
    const requestedTiles = boardData.filter(t => activeTrade.requestPropertyIds?.includes(t.id));
    const senderColor = PLAYER_COLORS[sender?.color] || { hex: '#D62F2F', text: '#fff' };
    const senderShape = PLAYER_PAWNS[sender?.color] || 'hat';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-body overflow-y-auto">
        <div className="relative w-full max-w-lg bg-[#FCF9F2] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl p-5 sm:p-6 text-[#1B1B1B] animate-scale-up space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E0D4C0]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center border border-[#8B5A2B]">
                <PawnIcon shape={senderShape} color={senderColor.hex} size={16} />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#2A1E14]">
                Trade Proposal from {sender?.name}
              </h2>
            </div>
            <button
              onClick={onRejectTrade}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Comparison Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* What You Receive */}
            <div className="bg-[#EFE7D5] border border-[#2E9D5B]/40 rounded-xl p-3 sm:p-3.5 space-y-2">
              <span className="text-[10px] sm:text-[11px] font-black text-[#2E9D5B] uppercase tracking-wider block border-b border-[#D5C7B0] pb-1">
                You Will Receive
              </span>
              {activeTrade.offerCash > 0 && (
                <div className="text-sm font-black text-emerald-700 font-number flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> ₹{activeTrade.offerCash} Cash
                </div>
              )}
              {activeTrade.offerJailCards > 0 && (
                <div className="text-xs text-blue-700 font-bold flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" /> {activeTrade.offerJailCards} Bail Card(s)
                </div>
              )}
              {offeredTiles.length > 0 && (
                <div className="space-y-1 pt-1">
                  {offeredTiles.map(t => (
                    <div key={t.id} className="text-xs text-[#2A1E14] flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[t.group] || '#475569' }} />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTrade.offerCash === 0 && activeTrade.offerJailCards === 0 && offeredTiles.length === 0 && (
                <span className="text-xs text-neutral-500 italic">Nothing offered</span>
              )}
            </div>

            {/* What You Give */}
            <div className="bg-[#EFE7D5] border border-[#F28C28]/40 rounded-xl p-3 sm:p-3.5 space-y-2">
              <span className="text-[10px] sm:text-[11px] font-black text-[#D62F2F] uppercase tracking-wider block border-b border-[#D5C7B0] pb-1">
                You Will Give
              </span>
              {activeTrade.requestCash > 0 && (
                <div className="text-sm font-black text-amber-800 font-number flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> ₹{activeTrade.requestCash} Cash
                </div>
              )}
              {activeTrade.requestJailCards > 0 && (
                <div className="text-xs text-blue-700 font-bold flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" /> {activeTrade.requestJailCards} Bail Card(s)
                </div>
              )}
              {requestedTiles.length > 0 && (
                <div className="space-y-1 pt-1">
                  {requestedTiles.map(t => (
                    <div key={t.id} className="text-xs text-[#2A1E14] flex items-center gap-1.5 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[t.group] || '#475569' }} />
                      <span>{t.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTrade.requestCash === 0 && activeTrade.requestJailCards === 0 && requestedTiles.length === 0 && (
                <span className="text-xs text-neutral-500 italic">Nothing requested</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={onAcceptTrade}
              className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm bg-[#2E9D5B] hover:bg-[#25834C] text-white flex items-center justify-center gap-2 shadow-md active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" /> Accept Trade
            </button>
            <button
              onClick={onRejectTrade}
              className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-sm bg-neutral-200 hover:bg-neutral-300 text-neutral-800 border border-neutral-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Ban className="w-4 h-4" /> Decline
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Outgoing Proposal
  if (isOutgoing) {
    const target = gameState.players.find(p => p.id === activeTrade.targetPlayerId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-body overflow-y-auto">
        <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl p-5 sm:p-6 text-[#1B1B1B] text-center space-y-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-[#8B5A2B] text-[#8B5A2B] mx-auto flex items-center justify-center">
            <ArrowRightLeft className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-[#2A1E14]">Trade Proposal Sent</h2>
          <p className="text-xs text-[#554637]">
            You sent an offer to <strong className="text-[#8B5A2B]">{target?.name}</strong>. Waiting for their response...
          </p>

          <button
            onClick={onRejectTrade}
            className="w-full min-h-[44px] py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
          >
            Cancel Proposal
          </button>
        </div>
      </div>
    );
  }

  // Trade Builder
  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-body overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-[#FCF9F2] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl p-4 sm:p-6 text-[#1B1B1B] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E0D4C0] shrink-0">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#8B5A2B]" />
            <h2 className="text-base sm:text-lg font-black text-[#2A1E14]">Bazaar Trade Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitProposal} className="space-y-3.5 overflow-y-auto flex-1 pt-3 pr-1">
          {/* Target Player Picker */}
          <div>
            <label className="block text-[11px] font-bold text-[#554637] uppercase tracking-wider mb-1">
              Select Trading Partner:
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full min-h-[44px] bg-white border border-[#D5C7B0] rounded-xl px-3 py-2 text-xs font-bold text-[#1B1B1B] focus:outline-none focus:border-[#8B5A2B] cursor-pointer"
            >
              {otherPlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Treasury: ₹{p.cash})
                </option>
              ))}
            </select>
          </div>

          {/* Trade Columns: Offer vs Request */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Offer Box */}
            <div className="bg-[#EFE7D5] border border-[#2E9D5B]/30 rounded-xl p-3 space-y-2.5">
              <span className="text-xs font-black text-[#2E9D5B] uppercase tracking-wider block">
                You Offer
              </span>

              {/* Cash input */}
              <div>
                <label className="text-[10px] text-[#554637] font-semibold block mb-1">
                  Cash (Max ₹{player.cash}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={player.cash}
                  value={offerCash}
                  onChange={(e) => setOfferCash(Math.max(0, Math.min(player.cash, parseInt(e.target.value, 10) || 0)))}
                  className="w-full bg-white border border-[#D5C7B0] rounded-lg px-2.5 py-1.5 text-xs font-number font-bold text-[#1B1B1B] focus:outline-none focus:border-[#2E9D5B]"
                />
              </div>

              {/* Properties selector */}
              <div>
                <label className="text-[10px] text-[#554637] font-semibold block mb-1">
                  Properties ({myEligibleProps.length} eligible):
                </label>
                <div className="max-h-28 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-[#D5C7B0]">
                  {myEligibleProps.length === 0 ? (
                    <span className="text-[10px] text-neutral-400 italic block">No tradable properties</span>
                  ) : (
                    myEligibleProps.map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-[#2A1E14] font-bold hover:text-black cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={offerProps.includes(t.id)}
                          onChange={() => handleToggleOfferProp(t.id)}
                          className="rounded text-[#8B5A2B]"
                        />
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[t.group] || '#475569' }} />
                        <span className="truncate">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Request Box */}
            <div className="bg-[#EFE7D5] border border-[#F28C28]/30 rounded-xl p-3 space-y-2.5">
              <span className="text-xs font-black text-[#D62F2F] uppercase tracking-wider block">
                You Request
              </span>

              {/* Cash input */}
              <div>
                <label className="text-[10px] text-[#554637] font-semibold block mb-1">
                  Cash (Partner has ₹{targetPlayer?.cash || 0}):
                </label>
                <input
                  type="number"
                  min={0}
                  max={targetPlayer?.cash || 0}
                  value={requestCash}
                  onChange={(e) => setRequestCash(Math.max(0, Math.min(targetPlayer?.cash || 0, parseInt(e.target.value, 10) || 0)))}
                  className="w-full bg-white border border-[#D5C7B0] rounded-lg px-2.5 py-1.5 text-xs font-number font-bold text-[#1B1B1B] focus:outline-none focus:border-[#D62F2F]"
                />
              </div>

              {/* Properties selector */}
              <div>
                <label className="text-[10px] text-[#554637] font-semibold block mb-1">
                  Properties ({targetEligibleProps.length} eligible):
                </label>
                <div className="max-h-28 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-[#D5C7B0]">
                  {targetEligibleProps.length === 0 ? (
                    <span className="text-[10px] text-neutral-400 italic block">No tradable properties</span>
                  ) : (
                    targetEligibleProps.map(t => (
                      <label key={t.id} className="flex items-center gap-2 text-xs text-[#2A1E14] font-bold hover:text-black cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={requestProps.includes(t.id)}
                          onChange={() => handleToggleRequestProp(t.id)}
                          className="rounded text-[#8B5A2B]"
                        />
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: GROUP_COLORS[t.group] || '#475569' }} />
                        <span className="truncate">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!targetPlayer}
            className="w-full min-h-[44px] py-3 px-4 rounded-xl font-black text-sm bg-[#8B5A2B] hover:bg-[#724820] text-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Handshake className="w-4 h-4" /> Send Trade Proposal
          </button>
        </form>
      </div>
    </div>
  );
}
