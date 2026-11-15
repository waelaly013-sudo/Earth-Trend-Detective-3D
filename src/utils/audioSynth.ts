/**
 * Procedural Web Audio Synthesizer
 * 100% zero-dependency audio generator for NASA telemetry effects
 */

// What this does: A tiny built-in sound maker that creates all click sounds, chimes, and weather noises right inside the browser (no MP3 files needed).
// On the website: Gives gentle audio feedback when you press buttons, pop the space alien, switch to future predictions, or run weather simulators.
// Used as: The global sound-effects player (`soundFx`) shared by every button and simulator.
class TelemetryAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // What this does: Turns on the browser's Web Audio engine safely on the first click so sounds are allowed to play.
  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // What this does: Plays a quick upward sci-fi beep.
  // On the website: Sounds like a space telemetry scanner blip when hovering or tapping hotspots.
  // Used as: Subtle scanner feedback sound.
  playBlip(freq: number = 880) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio context may be restricted before interaction
    }
  }

  // What this does: Plays a playful pop + sparkle twinkle sound.
  // On the website: Plays when you click the floating space alien and it bursts into stardust to show a climate tip.
  // Used as: The alien pop sound effect.
  playAlienPop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Satisfying cute cosmic explosion pop + sparkle twinkle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);

      // Stardust sparkle frequencies
      [1200, 1600, 2100].forEach((freq, idx) => {
        if (!this.ctx) return;
        const sOsc = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        sOsc.type = 'triangle';
        sOsc.frequency.setValueAtTime(freq, now + 0.05 + idx * 0.04);
        sGain.gain.setValueAtTime(0.03, now + 0.05 + idx * 0.04);
        sGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18 + idx * 0.04);
        sOsc.connect(sGain);
        sGain.connect(this.ctx.destination);
        sOsc.start(now + 0.05 + idx * 0.04);
        sOsc.stop(now + 0.2 + idx * 0.04);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Plays 4 rising musical notes when the little alien comes back onto the screen.
  // On the website: Tells the user the space alien helper has returned or the Alien Tour started.
  // Used as: The alien respawn / tour launch sound.
  playAlienRespawn() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 660, 880, 1100].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0.025, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.2);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a very short, soft click sound.
  // On the website: Heard whenever you tap buttons, sliders, tabs, or menu items.
  // Used as: The standard UI button click sound across the whole app.
  playTick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.025, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch {
      // Ignore audio error
    }
  }

  // What this does: Plays a futuristic synth chord when entering AI Prediction years (after Nov 2026).
  // On the website: Marks the moment you cross from real history into AI climate forecasts.
  // Used as: The AI Prediction mode sound cue.
  playPredictionAlert() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554, 659, 880].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + i * 0.04);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, now + i * 0.04);

        gain.gain.setValueAtTime(0.03, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.18);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a pleasant 4-note rising bell chime.
  // On the website: Plays when moving between tour stops, switching languages, or opening important guides.
  // Used as: The friendly chime sound for tours and major actions.
  playTourChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.06);

        gain.gain.setValueAtTime(0.03, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Shortcut alias for `playTourChime` so buttons can just call `playChime()`.
  playChime() {
    this.playTourChime();
  }

  // What this does: Plays a two-tone alert bell.
  // On the website: Signals that a Critical Climate Anomaly popup just appeared on screen.
  // Used as: The climate danger alert sound.
  playAnomalyAlert() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // High-tech NASA telemetry dual alert chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      gain1.gain.setValueAtTime(0.04, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.5, now + 0.09); // C6
      gain2.gain.setValueAtTime(0.035, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.32);
    } catch {
      // Audio context might be restricted before interaction
    }
  }

  // What this does: Plays a 3-second rising-and-falling warp engine sound.
  // On the website: Plays during space/warp transitions on the globe or rocket launch animations.
  // Used as: Space travel warp sound effect.
  playWarpSpeed() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Accelerating sweep
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.Q.value = 3.5;

      // Frequency rise then fall over 3 seconds
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 1.4);
      osc.frequency.exponentialRampToValueAtTime(140, now + 3.0);

      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 1.4);
      filter.frequency.exponentialRampToValueAtTime(350, now + 3.0);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 3.0);
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a quick rocket launch whoosh and landing pop.
  // On the website: Plays when the 3D rocket launches around the globe or during the Alien Guided Tour.
  // Used as: Rocket liftoff sound effect.
  playRocketWhoosh() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Rocket whoosh oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);

      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);

      // Cute touchdown pop tone
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(640, now + 0.28);
      popOsc.frequency.exponentialRampToValueAtTime(960, now + 0.38);

      popGain.gain.setValueAtTime(0.0001, now + 0.28);
      popGain.gain.linearRampToValueAtTime(0.035, now + 0.32);
      popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      popOsc.connect(popGain);
      popGain.connect(this.ctx.destination);

      popOsc.start(now + 0.28);
      popOsc.stop(now + 0.42);
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a fiery falling meteor swoosh sound.
  // On the website: Plays when a meteor streaks across space in the 3D globe scene.
  // Used as: Meteor flight audio effect.
  playMeteorSwoop() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Fiery plasma re-entry swoop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1600, now + 0.25);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.65);

      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.28);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.65);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a deep impact thud and sizzle.
  // On the website: Plays when a simulated meteor lands on Earth in the 3D scene.
  // Used as: Meteor impact sound effect.
  playMeteorImpact() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Deep resonant impact thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(120, now);
      thudOsc.frequency.exponentialRampToValueAtTime(35, now + 0.35);

      thudGain.gain.setValueAtTime(0.07, now);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thudOsc.start(now);
      thudOsc.stop(now + 0.4);

      // Sizzle / thermal shock wave
      const sizzleOsc = this.ctx.createOscillator();
      const sizzleGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      sizzleOsc.type = 'triangle';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.value = 4.0;

      sizzleGain.gain.setValueAtTime(0.03, now);
      sizzleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      sizzleOsc.connect(filter);
      filter.connect(sizzleGain);
      sizzleGain.connect(this.ctx.destination);

      sizzleOsc.start(now);
      sizzleOsc.stop(now + 0.3);
    } catch {
      // Ignore
    }
  }

  // What this does: Creates a soft blowing wind sound whose volume depends on the wind speed.
  // On the website: Plays inside the Visual Farm / Polar / Ocean simulators when wind is blowing.
  // Used as: Wind weather sound effect in visual simulators.
  playWindBreeze(windMps: number = 5) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      const intensity = Math.min(1.0, Math.max(0.1, windMps / 30));
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60 + intensity * 80, now);
      osc.frequency.linearRampToValueAtTime(80 + intensity * 120, now + 0.4);
      osc.frequency.linearRampToValueAtTime(50 + intensity * 60, now + 0.9);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200 + intensity * 400, now);
      filter.frequency.linearRampToValueAtTime(300 + intensity * 600, now + 0.45);
      filter.frequency.linearRampToValueAtTime(150 + intensity * 250, now + 0.9);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.025 * intensity, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    } catch {
      // Ignore
    }
  }

  // What this does: Makes quick crackling sounds like burning embers.
  // On the website: Plays in Visual Farm when extreme heat & dry air trigger a wildfire.
  // Used as: Wildfire sound effect.
  playFireCrackle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 3 fast micro-crackles
      for (let i = 0; i < 4; i++) {
        const offset = i * 0.07 + Math.random() * 0.03;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(900 + Math.random() * 1200, now + offset);
        gain.gain.setValueAtTime(0.02, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.035);
      }
    } catch {
      // Ignore
    }
  }

  // What this does: Makes soft pitter-patter raindrop sounds.
  // On the website: Plays in the Visual Simulator when rain/storm conditions happen.
  // Used as: Rain weather sound effect.
  playRainDrops() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const offset = i * 0.05 + Math.random() * 0.02;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400 + Math.random() * 600, now + offset);
        gain.gain.setValueAtTime(0.015, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.025);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.025);
      }
    } catch {
      // Ignore
    }
  }

  // What this does: Plays high sparkling crystal tones.
  // On the website: Plays when the simulated farm or polar scene freezes into frost or ice.
  // Used as: Frost/ice sound effect.
  playFrostChime() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [1200, 1600, 2400].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.015, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a short happy bird chirp.
  // On the website: Plays when the simulated farm is healthy and thriving.
  // Used as: Healthy nature sound effect.
  playBirdChirp() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3200, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.16);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // Ignore
    }
  }

  // What this does: Plays quick "tch-tch-tch" water spray pulses.
  // On the website: Plays when turning on farm irrigation sprinklers in Visual Farm.
  // Used as: Water sprinkler sound effect.
  playWaterSprinkler() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Pulse 1: "Tch-tch-tch"
      [0, 0.08, 0.16, 0.24].forEach((t) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now + t);
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, now + t);
        gain.gain.setValueAtTime(0.03, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.04);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.04);
      });
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a low crack followed by an ocean splash.
  // On the website: Plays in Visual Polar when glaciers melt and chunks of ice break into the sea.
  // Used as: Ice-breaking sound effect.
  playIceCalving() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Deep glacial crack
      const crackOsc = this.ctx.createOscillator();
      const crackGain = this.ctx.createGain();
      crackOsc.type = 'sawtooth';
      crackOsc.frequency.setValueAtTime(280, now);
      crackOsc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
      crackGain.gain.setValueAtTime(0.04, now);
      crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      crackOsc.connect(crackGain);
      crackGain.connect(this.ctx.destination);
      crackOsc.start(now);
      crackOsc.stop(now + 0.4);

      // Low ocean rumble & splash
      const splashOsc = this.ctx.createOscillator();
      const splashGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      splashOsc.type = 'triangle';
      splashOsc.frequency.setValueAtTime(90, now + 0.15);
      splashOsc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now + 0.15);
      splashGain.gain.setValueAtTime(0.001, now + 0.15);
      splashGain.gain.linearRampToValueAtTime(0.035, now + 0.25);
      splashGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      splashOsc.connect(filter);
      filter.connect(splashGain);
      splashGain.connect(this.ctx.destination);
      splashOsc.start(now + 0.15);
      splashOsc.stop(now + 0.8);
    } catch {
      // Ignore
    }
  }

  // What this does: Plays a howling icy wind sound.
  // On the website: Plays in Visual Polar during snowstorms and high polar winds.
  // Used as: Polar blizzard sound effect.
  playBlizzardHowl() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.6);
      osc.frequency.linearRampToValueAtTime(110, now + 1.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260, now);
      filter.Q.value = 3.0;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // Ignore
    }
  }
}

// Single shared sound player used across the whole app
export const soundFx = new TelemetryAudio();
