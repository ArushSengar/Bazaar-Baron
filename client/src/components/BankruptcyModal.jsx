import React, { useState, useEffect } from 'react';
import { AlertOctagon, Coins, Check, Flame, EyeOff, Maximize2, Eye, ShieldAlert } from 'lucide-react';

export function BankruptcyModal({ debt, player, gameState, onResolveDebt, onBankrupt }) {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMinimized(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!debt) return null;

  const creditor = debt.creditorId === 'BANK'
    ? { name: 'The Municipal Bank' }
    : gameState?.players?.find(p => p.id === debt.creditorId);

  const canAfford = player.cash >= debt.amount;
  const shortfall = Math.max(0, debt.amount - player.cash);

  // Minimized floating banner so the player can mortgage properties, sell houses, or view the board
  if (minimized) {
    return (
      <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#FCF9F2] border-2 border-red-500 rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3 text-[#1B1B1B] font-body animate-bounce-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-400 text-red-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-black text-red-600 tracking-wider">Treasury Insolvency</div>
            <div className="text-xs font-black truncate">
              Owed: <span className="font-number text-red-600">₹{debt.amount}</span> • Cash: <span className="font-number text-emerald-600">₹{player.cash}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {canAfford ? (
            <button
              onClick={onResolveDebt}
              className="px-3 py-1.5 rounded-xl font-black text-xs bg-[#2E9D5B] hover:bg-[#25834C] text-white shadow-md cursor-pointer active:scale-95 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Pay
            </button>
          ) : (
            <button
              onClick={() => setMinimized(false)}
              className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-800 border border-neutral-300 shadow-xs cursor-pointer flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Raise Cash
            </button>
          )}

          <button
            onClick={() => setMinimized(false)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 cursor-pointer"
            title="Expand Debt Notice (Esc)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) setMinimized(true);
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-body"
    >
      <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-red-500 rounded-2xl shadow-2xl p-5 sm:p-6 text-[#1B1B1B] animate-scale-up space-y-4">
        {/* Minimize Button so player can look at the board and mortgage properties */}
        <button
          onClick={() => setMinimized(true)}
          className="absolute top-3 right-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-full p-1.5 transition-colors cursor-pointer"
          title="Minimize to board & deeds (Esc)"
        >
          <EyeOff className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-400 text-red-600 mx-auto flex items-center justify-center mb-1">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-red-700 tracking-tight font-display">
            Treasury Insolvency Notice
          </h2>
          <p className="text-xs text-[#554637]">
            You owe money and cannot complete your turn until the debt is settled or you declare bankruptcy.
          </p>
        </div>

        {/* Debt Breakdown Card */}
        <div className="bg-[#EFE7D5] border border-[#D5C7B0] rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center text-[#554637]">
            <span className="font-semibold">Creditor:</span>
            <span className="font-bold text-[#1B1B1B]">{creditor?.name || 'Bank'}</span>
          </div>
          <div className="flex justify-between items-center text-[#554637]">
            <span className="font-semibold">Debt Owed:</span>
            <span className="font-number font-black text-red-600 text-sm">₹{debt.amount}</span>
          </div>
          <div className="flex justify-between items-center text-[#554637] pt-1.5 border-t border-[#D5C7B0]">
            <span className="font-semibold">Your Treasury:</span>
            <span className="font-number font-black text-emerald-700">₹{player.cash}</span>
          </div>
          {!canAfford && (
            <div className="flex justify-between items-center text-red-700 pt-1.5 border-t border-[#D5C7B0]">
              <span className="font-bold">Shortfall:</span>
              <span className="font-number font-black">₹{shortfall}</span>
            </div>
          )}
        </div>

        {!canAfford && (
          <div className="text-[11px] text-[#8B5A2B] bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed space-y-1">
            <p>
              💡 <strong>Munimji's Advice:</strong> Minimize this notice (<EyeOff className="inline w-3 h-3" />) to access your properties on the board or side panel. Mortgage properties or sell houses to raise ₹{shortfall}.
            </p>
            <p className="text-neutral-500 italic text-[10px]">
              Tip: Click anywhere outside this box or press Esc to minimize.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {canAfford ? (
            <button
              onClick={onResolveDebt}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl font-bold text-sm bg-[#2E9D5B] hover:bg-[#25834C] text-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Settle Debt (Pay ₹{debt.amount})
            </button>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => setMinimized(true)}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-800 border border-neutral-300 shadow cursor-pointer flex items-center justify-center gap-2"
              >
                <EyeOff className="w-4 h-4" />
                Minimize & Manage Properties (Mortgage/Sell)
              </button>

              <button
                onClick={onBankrupt}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4" />
                Declare Bankruptcy (Forfeit Game)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
