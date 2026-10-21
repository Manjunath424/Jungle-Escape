/**
 * JUNGLE ESCAPE - Procedural Web Audio Engine
 * Generates all SFX and dynamic ambient jungle soundtrack procedurally.
 * Completely self-contained, offline-compatible, and zero external audio asset dependencies.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.sfxVolume = 0.85;
    this.musicVolume = 0.45;

    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.isPlayingMusic = false;
    this.musicLoopTimer = null;
    this.initialized = false;

    this.lastFootstepTime = 0;
  }

  init() {
    if (this.initialized) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported in this browser.');
        return;
      }

      this.ctx = new AudioContextClass();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      // Music Gain
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Failed to initialize AudioContext:', e);
    }
  }

  unlock() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
  }

  setSfxVolume(val) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  setMusicVolume(val) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Helper to generate white noise buffer
  createNoiseBuffer(duration = 0.5) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // SFX: Footstep
  playFootstep() {
    if (!this.ctx || this.isMuted) return;
    const now = performance.now();
    if (now - this.lastFootstepTime < 180) return; // Debounce footsteps
    this.lastFootstepTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  // SFX: Jump
  playJump() {
    if (!this.ctx || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.22);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch (e) {}
  }

  // SFX: Slide
  playSlide() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.4);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.35);
      filter.Q.value = 2.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start(t);
      noise.stop(t + 0.42);
    } catch (e) {}
  }

  // SFX: Coin Collection (Harmonic double chime)
  playCoin() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      [1318.51, 2093.0].forEach((freq, i) => { // E6, C7
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.04);

        gain.gain.setValueAtTime(0, t);
        gain.gain.setValueAtTime(0.25, t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t + i * 0.04);
        osc.stop(t + i * 0.04 + 0.23);
      });
    } catch (e) {}
  }

  // SFX: Power-up Collect (Heroic fanfare)
  playPowerup() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.28);
      });
    } catch (e) {}
  }

  // SFX: Shield Absorbs Crash
  playShieldBreak() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // High glass pop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.35);
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);

      // Low energy burst
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.3);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.32);
    } catch (e) {}
  }

  // SFX: Fatal Collision Hit
  playHit() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Deep punch impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.36);

      // Noise impact crunch
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.25);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.28);
    } catch (e) {}
  }

  // SFX: Game Over
  playGameOver() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [330, 293.66, 261.63, 196.0]; // E4, D4, C4, G3
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = t + idx * 0.18;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.35, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {}
  }

  // SFX: UI Button Click
  playClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.06);
    } catch (e) {}
  }

  // Procedural Jungle Soundtrack Loop
  // Generates ancient tribal log drums, shaker percussion, and mystical pentatonic flute phrases
  startMusic() {
    if (this.isPlayingMusic || !this.ctx) return;
    this.isPlayingMusic = true;

    let step = 0;
    const tempo = 135; // BPM
    const stepDuration = (60 / tempo) / 4; // 16th notes
    let nextNoteTime = this.ctx.currentTime + 0.1;

    const fluteNotes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // D Dorian / pentatonic

    const schedulePattern = () => {
      if (!this.isPlayingMusic) return;

      while (nextNoteTime < this.ctx.currentTime + 0.25) {
        const beatInMeasure = step % 16;

        // 1. Tribal Kick / Log Drum on beats 0, 6, 8, 12
        if (beatInMeasure === 0 || beatInMeasure === 6 || beatInMeasure === 8 || beatInMeasure === 12) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = nextNoteTime;
          const isHeavy = (beatInMeasure === 0 || beatInMeasure === 8);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(isHeavy ? 110 : 140, t);
          osc.frequency.exponentialRampToValueAtTime(32, t + 0.16);

          gain.gain.setValueAtTime(isHeavy ? 0.45 : 0.28, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);

          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + 0.18);
        }

        // 2. Jungle Shaker / Insect rhythm on every even 16th note
        if (beatInMeasure % 2 === 0) {
          const t = nextNoteTime;
          const noise = this.ctx.createBufferSource();
          noise.buffer = this.createNoiseBuffer(0.04);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.value = 5500;

          const gain = this.ctx.createGain();
          const vol = (beatInMeasure % 4 === 2) ? 0.14 : 0.07;
          gain.gain.setValueAtTime(vol, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(this.musicGain);
          noise.start(t);
          noise.stop(t + 0.04);
        }

        // 3. Mystical Flute / Kalimba Melody every 2 or 4 bars
        if (step % 4 === 0 && Math.random() > 0.4) {
          const noteIndex = Math.floor(Math.random() * fluteNotes.length);
          const freq = fluteNotes[noteIndex];
          const t = nextNoteTime;

          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(t);
          osc.stop(t + 0.5);
        }

        nextNoteTime += stepDuration;
        step = (step + 1) % 64;
      }

      this.musicLoopTimer = setTimeout(schedulePattern, 50);
    };

    schedulePattern();
  }

  stopMusic() {
    this.isPlayingMusic = false;
    if (this.musicLoopTimer) {
      clearTimeout(this.musicLoopTimer);
      this.musicLoopTimer = null;
    }
  }
}

// Global singleton instance
window.soundEngine = new SoundEngine();
