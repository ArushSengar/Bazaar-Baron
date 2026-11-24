import React, { useState, useEffect } from 'react';
import { AlertOctagon, Check, Flame, EyeOff, Maximize2, Eye } from 'lucide-react';

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

  // Check if player has any properties to mortgage or sell houses from
  const playerProperties = Object.values(gameState?.properties || {}).filter(p => p.ownerId === player.id);
  const hasMortgageable = playerProperties.some(p => !p.mortgaged && (p.houses === 0 || !p.houses));
  const hasHousesToSell = playerProperties.some(p => (p.houses || 0) > 0);
  const canRaiseMoney = hasMortgageable || hasHousesToSell;

  // Minimized floating banner so the player can mortgage properties, sell houses, or view the board
  if (minimized) {
    return (
      <div className="fixed bottom-24 lg:bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#FCF9F2] border-2 border-red-500 rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3 text-[#1B1B1B] font-body animate-bounce-subtle">
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
            <>
              {canRaiseMoney ? (
                <button
                  onClick={() => setMinimized(false)}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-800 border border-neutral-300 shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Raise Cash
                </button>
              ) : (
                <button
                  onClick={onBankrupt}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <Flame className="w-3.5 h-3.5" /> Forfeit
                </button>
              )}
            </>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-body overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#FCF9F2] border-2 border-red-500 rounded-2xl shadow-2xl p-4 sm:p-6 text-[#1B1B1B] animate-scale-up space-y-3 sm:space-y-4 max-h-[92vh] overflow-y-auto my-auto">
        {/* Minimize / Close Button */}
        <button
          onClick={() => setMinimized(true)}
          className="absolute top-3 right-3 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-full p-1.5 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2.5 py-1"
          title="Minimize to board & deeds (Esc)"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Minimize</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-1 pt-1">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-100 border border-red-400 text-red-600 mx-auto flex items-center justify-center mb-1">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-red-700 tracking-tight font-display">
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
              <span className="font-number font-black text-sm">₹{shortfall}</span>
            </div>
          )}
        </div>

        {/* Munimji Advice Banner */}
        {!canAfford && (
          canRaiseMoney ? (
            <div className="text-[11px] text-[#8B5A2B] bg-amber-50 border border-amber-200 rounded-xl p-3 leading-relaxed space-y-1">
              <p>
                💡 <strong>Munimji's Advice:</strong> Minimize this notice (<EyeOff className="inline w-3 h-3" />) to access your properties on the board or side panel. Mortgage properties or sell houses to raise ₹{shortfall}.
              </p>
              <p className="text-neutral-500 italic text-[10px]">
                Tip: Click anywhere outside this box, press Esc, or click "Minimize" above.
              </p>
            </div>
          ) : (
            <div className="text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-xl p-3 leading-relaxed space-y-1">
              <p>
                🚨 <strong>Munimji's Assessment:</strong> You have insufficient cash (₹{player.cash}) and no unmortgaged properties or houses left to sell. You cannot raise ₹{shortfall}.
              </p>
              <p className="font-semibold text-red-700 text-[10.5px]">
                You must declare bankruptcy to settle your liabilities and conclude your match.
              </p>
            </div>
          )
        )}

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {canAfford ? (
            <button
              onClick={onResolveDebt}
              className="w-full min-h-[46px] py-3 px-4 rounded-xl font-bold text-sm bg-[#2E9D5B] hover:bg-[#25834C] text-white shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Settle Debt (Pay ₹{debt.amount})
            </button>
          ) : (
            <div className="space-y-2">
              {canRaiseMoney ? (
                <>
                  <button
                    onClick={() => setMinimized(true)}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl font-bold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-800 border border-neutral-300 shadow cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all"
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
                </>
              ) : (
                <>
                  <button
                    onClick={onBankrupt}
                    className="w-full min-h-[48px] py-3 px-4 rounded-xl font-black text-sm bg-red-600 hover:bg-red-700 text-white shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse"
                  >
                    <Flame className="w-5 h-5" />
                    Declare Bankruptcy (Forfeit Game)
                  </button>

                  <button
                    onClick={() => setMinimized(true)}
                    className="w-full min-h-[38px] py-2 px-3 rounded-xl font-semibold text-xs bg-[#EFE7D5] hover:bg-[#E2D8C0] text-neutral-700 border border-neutral-300 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Tabletop Board (Minimize)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
