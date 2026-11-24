/**
 * Web Audio API procedural sound synthesizer.
 * Runs completely offline, requires zero external audio files.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this._noiseBuffer = null;
    this.listeners = new Set();

    // Load persisted preferences
    let savedMuted = false;
    let savedVol = 0.7;
    if (typeof window !== 'undefined') {
      try {
        savedMuted = localStorage.getItem('bb_sound_muted') === 'true';
        const volVal = localStorage.getItem('bb_sound_volume');
        if (volVal !== null) {
          const parsed = parseFloat(volVal);
          if (!Number.isNaN(parsed)) savedVol = Math.max(0, Math.min(1, parsed));
        }
      } catch (_) {}
    }

    this.muted = savedMuted;
    this.volume = savedVol;

    // Auto unlock on first user gesture
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.init();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { once: true, passive: true });
      window.addEventListener('keydown', unlock, { once: true, passive: true });
    }
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  getMasterNode() {
    if (this.muted) return null;
    this.init();
    if (!this.ctx || !this.masterGain) return null;
    return this.masterGain;
  }

  getNoiseBuffer() {
    if (!this.ctx) return null;
    if (!this._noiseBuffer) {
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 1.0); // 1.0s loopable noise
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this._noiseBuffer = buffer;
    }
    return this._noiseBuffer;
  }

  setVolume(volume) {
    const num = Math.max(0, Math.min(1, parseFloat(volume) || 0));
    this.volume = num;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bb_sound_volume', String(num));
      } catch (_) {}
    }
    this.updateGain();
    this.notify();
  }

  getVolume() {
    return this.volume;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bb_sound_muted', String(this.muted));
      } catch (_) {}
    }
    this.updateGain();
    this.notify();
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  updateGain() {
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.volume;
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(target, this.ctx.currentTime);
    }
  }

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }
    return () => {};
  }

  notify() {
    const payload = { volume: this.volume, muted: this.muted };
    this.listeners.forEach((fn) => {
      try {
        fn(payload);
      } catch (e) {
        console.error('SoundManager listener error', e);
      }
    });
  }

  playDiceRoll() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + i * 0.11 + Math.random() * 0.04;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140 + Math.random() * 180, time);
      osc.frequency.exponentialRampToValueAtTime(60, time + 0.06);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + 0.07);
    }
  }

  playCashChime() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.15, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

      osc.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + 0.26);
    });
  }

  playYourTurnChime() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const freqs = [440, 554.37, 659.25]; // A4, C#5, E5
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = now + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

      osc.connect(gain);
      gain.connect(master);

      osc.start(time);
      osc.stop(time + 0.42);
    });
  }

  playBuySound() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now); // G4
    osc.frequency.exponentialRampToValueAtTime(784, now + 0.15); // G5

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playClick() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playButtonClick() {
    this.playClick();
  }

  playButtonHover() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.012);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.016);
  }

  playErrorSound() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.22);
    osc2.frequency.setValueAtTime(138.5, now);
    osc2.frequency.exponentialRampToValueAtTime(84, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.22);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.23);
    osc2.stop(now + 0.23);
  }

  playCardDraw() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.16);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.connect(oscGain);
    oscGain.connect(master);

    noise.start(now);
    noise.stop(now + 0.17);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  playCardPlay() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;

    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1200, now);
    snapOsc.frequency.exponentialRampToValueAtTime(250, now + 0.035);

    snapGain.gain.setValueAtTime(0.18, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    snapOsc.connect(snapGain);
    snapGain.connect(master);

    const thudOsc = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thudOsc.type = 'sine';
    thudOsc.frequency.setValueAtTime(220, now);
    thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.08);

    thudGain.gain.setValueAtTime(0.22, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    thudOsc.connect(thudGain);
    thudGain.connect(master);

    snapOsc.start(now);
    snapOsc.stop(now + 0.045);
    thudOsc.start(now);
    thudOsc.stop(now + 0.09);
  }

  playCardDeal() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const noiseBuffer = this.getNoiseBuffer();
    if (!noiseBuffer) return;

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.04);
    filter.frequency.exponentialRampToValueAtTime(1100, now + 0.09);
    filter.Q.setValueAtTime(2.0, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  playUnoCall() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const notes = [
      { freq: 392.0, gain: 0.18 },
      { freq: 587.33, gain: 0.14 }
    ];

    notes.forEach(({ freq, gain: peakGain }) => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.94, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.04);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + 0.035);
      gain.gain.setValueAtTime(peakGain, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.39);
    });
  }

  playPenaltyCatch() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const pulses = [
      { start: now, f1: 880, f2: 932.33, dur: 0.09 },
      { start: now + 0.11, f1: 1046.5, f2: 1108.73, dur: 0.13 }
    ];

    pulses.forEach(({ start, f1, f2, dur }) => {
      [f1, f2].forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(gain);
        gain.connect(master);

        osc.start(start);
        osc.stop(start + dur + 0.01);
      });
    });
  }

  playVictoryFanfare() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const arpeggio = [
      { freq: 261.63, start: 0.0, dur: 0.13 }, // C4
      { freq: 329.63, start: 0.13, dur: 0.13 }, // E4
      { freq: 392.0, start: 0.26, dur: 0.13 }, // G4
      { freq: 523.25, start: 0.39, dur: 0.22 } // C5
    ];

    arpeggio.forEach(({ freq, start, dur }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + start;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(master);

      osc.start(t);
      osc.stop(t + dur + 0.01);
    });

    const finaleTime = now + 0.58;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, finaleTime);

      gain.gain.setValueAtTime(0.001, finaleTime);
      gain.gain.linearRampToValueAtTime(0.1, finaleTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, finaleTime + 0.75);

      osc.connect(gain);
      gain.connect(master);

      osc.start(finaleTime);
      osc.stop(finaleTime + 0.78);
    });
  }

  playTokenCaptureSound() {
    const master = this.getMasterNode();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(960, now);
    osc1.frequency.exponentialRampToValueAtTime(160, now + 0.14);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.14);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.16);
    osc2.stop(now + 0.16);
  }
}

export const sounds = new SoundManager();
export default sounds;
