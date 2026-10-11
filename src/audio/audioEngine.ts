// Web Audio API authentic Jungle & Drum and Bass procedural synthesiser engine
class JungleAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private currentStep = 0;
  private bpm = 168;
  private volumeNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private currentVolume = 0.75;
  private currentFilterCutoff = 18000; // Hz
  private onTickCallback: ((step: number, total: number) => void) | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Lowpass filter (DJ cutoff filter)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setValueAtTime(this.currentFilterCutoff, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.5, this.ctx.currentTime); // resonant peak

      this.volumeNode = this.ctx.createGain();
      this.volumeNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);

      this.filterNode.connect(this.volumeNode);
      this.volumeNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    if (this.volumeNode && this.ctx) {
      this.volumeNode.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public setFilterCutoff(hz: number) {
    this.currentFilterCutoff = Math.max(200, Math.min(20000, hz));
    if (this.filterNode && this.ctx) {
      this.filterNode.frequency.setTargetAtTime(this.currentFilterCutoff, this.ctx.currentTime, 0.05);
    }
  }

  public getFilterCutoff(): number {
    return this.currentFilterCutoff;
  }

  public setOnTick(cb: ((step: number, total: number) => void) | null) {
    this.onTickCallback = cb;
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(140, Math.min(185, newBpm));
  }

  public getBpm(): number {
    return this.bpm;
  }

  public play(bpm = 168, trackType: 'decibel' | 'vital' | 'hackney' | 'transmission' = 'decibel') {
    this.initContext();
    if (!this.ctx || !this.volumeNode || !this.filterNode) return;
    this.stop();
    this.bpm = bpm;
    this.isPlaying = true;
    this.currentStep = 0;

    const schedulePattern = () => {
      if (!this.isPlaying || !this.ctx || !this.filterNode) return;

      const stepInterval = (60 / this.bpm) / 4; // 16th notes
      const totalSteps = 32;
      const time = this.ctx.currentTime;
      const step = this.currentStep % totalSteps;

      // Authentic Jungle Kick, Amen Snare, and Sub-Bass 808
      this.triggerDrumMachine(step, time, trackType);

      if (this.onTickCallback) {
        this.onTickCallback(step, totalSteps);
      }

      this.currentStep++;
      this.timerId = window.setTimeout(schedulePattern, stepInterval * 1000);
    };

    schedulePattern();
  }

  private triggerDrumMachine(step: number, time: number, trackType: string) {
    if (!this.ctx || !this.filterNode) return;

    // Jungle Kick pattern (classic syncopated 2-step / amen feel)
    if (step === 0 || step === 10 || step === 18 || step === 24) {
      this.playKick(time);
    }

    // Amen Snare & Ghost snares (chopped breakbeat rhythm)
    if (step === 4 || step === 12 || step === 20 || step === 28) {
      this.playSnare(time, 0.7); // primary crack
    } else if (step === 7 || step === 15 || step === 27 || step === 30) {
      this.playSnare(time, 0.28); // ghost snare
    }

    // Fast Jungle Hi-Hats / Shakers on every 16th note with velocity swing
    if (step % 2 === 0) {
      this.playHiHat(time, step % 4 === 2 ? 0.35 : 0.2);
    }

    // Sub-Bass 808 Glide (Jungle bassline notes)
    if (step === 0 || step === 6 || step === 16 || step === 22) {
      let freq = 43.65; // F0 deep sub
      if (trackType === 'vital') {
        freq = step < 16 ? 48.99 : 41.2; // G0 / E0
      } else if (trackType === 'hackney') {
        freq = step < 16 ? 38.89 : 43.65; // Eb0 / F0
      }
      this.playSubBass(time, freq, 0.35);
    }
  }

  private playKick(time: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.08);

    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + 0.22);
  }

  private playSnare(time: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;

    // Noise buffer for snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    whiteNoise.start(time);
    whiteNoise.stop(time + 0.12);

    // Tonal body of the snare
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(220, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(90, time + 0.08);
    bodyGain.gain.setValueAtTime(volume * 0.5, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.filterNode);

    bodyOsc.start(time);
    bodyOsc.stop(time + 0.08);
  }

  private playHiHat(time: number, volume: number) {
    if (!this.ctx || !this.filterNode) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode);

    noise.start(time);
    noise.stop(time + 0.04);
  }

  private playSubBass(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.filterNode) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.95, time + duration);

    gain.gain.setValueAtTime(0.75, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(gain);
    gain.connect(this.filterNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  // --- SOUND SYSTEM FX UNIT: DUB SIREN, AIR HORN, REWIND, LASER, SUB DROP ---

  /** Classic Reggae & Jungle Dub Siren with LFO Pitch Mod and Tape Delay */
  public triggerDubSiren() {
    this.initContext();
    if (!this.ctx || !this.volumeNode) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const sirenGain = this.ctx.createGain();

    // Tape Delay line
    const delay = this.ctx.createDelay();
    delay.delayTime.setValueAtTime(0.24, now);
    const feedback = this.ctx.createGain();
    feedback.gain.setValueAtTime(0.55, now);

    osc.type = 'square';
    osc.frequency.setValueAtTime(640, now);

    // LFO Modulation (2.8 Hz sweep)
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(3.2, now);
    lfoGain.gain.setValueAtTime(180, now);

    lfo.connect(osc.frequency);
    lfo.connect(lfoGain);

    sirenGain.gain.setValueAtTime(0.4, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    osc.connect(sirenGain);
    sirenGain.connect(this.volumeNode);

    // Feed to delay
    sirenGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(this.volumeNode);

    lfo.start(now);
    osc.start(now);

    osc.stop(now + 1.8);
    lfo.stop(now + 1.8);
  }

  /** Iconic UK Dancehall & Jungle Air Horn Triple Blast */
  public triggerAirHorn() {
    this.initContext();
    if (!this.ctx || !this.volumeNode) return;

    const now = this.ctx.currentTime;
    const blasts = [0, 0.16, 0.32, 0.52]; // syncopated blasts

    blasts.forEach((offset, idx) => {
      const t = now + offset;
      const duration = idx === 3 ? 0.45 : 0.12;

      // Primary Horn dual tone (A4 + C#5)
      const osc1 = this.ctx!.createOscillator();
      const osc2 = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(466.16, t); // Bb4
      osc2.frequency.setValueAtTime(587.33, t); // D5

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.volumeNode!);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration);
      osc2.stop(t + duration);
    });
  }

  /** Iconic Vinyl Wheel-up / Rewind Backspin Scratch */
  public triggerRewind() {
    this.initContext();
    if (!this.ctx || !this.volumeNode) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High pitch spinning backwards down to halt
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.65);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    // Friction noise layer
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.volumeNode);
    noiseSource.connect(noiseGain);
    noiseGain.connect(this.volumeNode);

    osc.start(now);
    noiseSource.start(now);
    osc.stop(now + 0.65);
    noiseSource.stop(now + 0.65);
  }

  /** Sci-Fi Dub Laser Zap */
  public triggerLaser() {
    this.initContext();
    if (!this.ctx || !this.volumeNode) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3200, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.28);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.volumeNode);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  /** Heavy Sub-Bass 808 Drop */
  public triggerSubDrop() {
    this.initContext();
    if (!this.ctx || !this.volumeNode) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 1.2);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.volumeNode);

    osc.start(now);
    osc.stop(now + 1.2);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioEngine = new JungleAudioEngine();
