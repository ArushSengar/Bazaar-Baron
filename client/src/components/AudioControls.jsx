import React, { useState, useEffect } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { sounds } from '../utils/audio';

/**
 * Universal global audio control component.
 * Supports mute toggling and master volume adjustment (0.0 to 1.0).
 */
export function AudioControls({
  compact = false,
  className = ''
}) {
  const [volume, setVolumeState] = useState(() => sounds.getVolume());
  const [isMuted, setIsMutedState] = useState(() => sounds.isMuted());

  // Subscribe to SoundManager state updates across instances
  useEffect(() => {
    const unsubscribe = sounds.subscribe(({ volume: newVol, muted: newMuted }) => {
      setVolumeState(newVol);
      setIsMutedState(newMuted);
    });
    return unsubscribe;
  }, []);

  const handleToggleMute = () => {
    const newMuted = sounds.toggleMute();
    setIsMutedState(newMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    sounds.setVolume(val);
    setVolumeState(val);
    if (isMuted && val > 0) {
      sounds.setMuted(false);
      setIsMutedState(false);
    }
  };

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 shadow-sm backdrop-blur-sm select-none ${className}`}
      role="region"
      aria-label="Audio controls"
    >
      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
        title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {isMuted || volume === 0 ? (
          <VolumeX className="w-4 h-4 text-neutral-400" />
        ) : volume <= 0.5 ? (
          <Volume1 className="w-4 h-4 text-amber-400/80" />
        ) : (
          <Volume2 className="w-4 h-4 text-amber-400" />
        )}
      </button>

      {/* Volume Slider */}
      {!compact && (
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={effectiveVolume}
            onChange={handleVolumeChange}
            className="w-14 sm:w-20 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:accent-amber-300 transition-all focus:outline-none"
            aria-label="Volume level"
            title={`Volume: ${Math.round(effectiveVolume * 100)}%`}
          />
          <span className="text-[10px] font-mono text-neutral-400 w-7 text-right select-none hidden sm:inline-block">
            {Math.round(effectiveVolume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default AudioControls;
