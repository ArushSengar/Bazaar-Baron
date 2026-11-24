import React from 'react';
import { Sparkles } from 'lucide-react';

const COLORS = [
  { id: 'red', name: 'Red', hex: '#EA3223', border: 'border-red-400' },
  { id: 'blue', name: 'Blue', hex: '#0066CC', border: 'border-blue-400' },
  { id: 'yellow', name: 'Yellow', hex: '#FFC800', border: 'border-yellow-400' },
  { id: 'green', name: 'Green', hex: '#2DA843', border: 'border-green-400' }
];

export function WildColorModal({ isOpen, onSelectColor, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-body overflow-y-auto">
      <div className="relative w-full max-w-sm bg-[#1e130c] border-2 border-amber-500 rounded-3xl shadow-2xl p-6 text-white text-center space-y-5 animate-scale-up">
        <div>
          <div className="flex items-center justify-center gap-1.5 text-xs font-black tracking-widest text-amber-400 uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Wild Card Played</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-black font-display tracking-tight text-neutral-100">
            Choose Next Color
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Select the color the next player must match:
          </p>
        </div>

        {/* 4-Color Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-1">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectColor(c.id)}
              className="py-4 px-3 rounded-2xl border-2 font-display font-black text-lg text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              style={{ backgroundColor: c.hex, borderColor: '#ffffff' }}
            >
              <span>{c.name.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors pt-2 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
