export interface AudioTrack {
  id: number | string;
  title: string;
  artist?: string;
  url: string;
  duration?: string;
  bpm?: number;
  format?: string;
  coverUrl?: string;
}

export interface AudioEngineState {
  isPlaying: boolean;
  currentTrack: AudioTrack | null;
  currentTime: number;
  duration: number;
  volume: number;
}

type AudioListener = (state: AudioEngineState) => void;
export type DubClockTrack = 'decibel' | 'vital' | 'hackney' | 'transmission';

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();
  private synthContext: AudioContext | null = null;
  private synthFilter: BiquadFilterNode | null = null;
  private synthGain: GainNode | null = null;
  private dubClockTimer: number | null = null;
  private dubClockStep = 0;
  private dubClockBpm = 164;
  private dubClockTrack: DubClockTrack = 'decibel';
  private dubClockTick: ((step: number) => void) | null = null;
  private filterCutoff = 18000;
  public state: AudioEngineState = {
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.volume = this.state.volume;

      this.audio.addEventListener('play', () => {
        this.state.isPlaying = true;
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.state.isPlaying = false;
        this.notify();
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          this.state.currentTime = this.audio.currentTime;
          this.state.duration = this.audio.duration || 0;
          this.notify();
        }
      });

      this.audio.addEventListener('ended', () => {
        this.state.isPlaying = false;
        this.notify();
      });
    }
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.state });
      } catch (e) {
        console.error('AudioEngine notify error:', e);
      }
    });
  }

  public async playTrack(track: AudioTrack): Promise<void> {
    if (!this.audio) return;
    try {
      if (this.state.currentTrack?.id !== track.id || this.audio.src !== track.url) {
        this.state.currentTrack = track;
        this.audio.src = track.url;
      }
      await this.audio.play();
    } catch (err: any) {
      console.warn('Track playback error, attempting proxy:', err);
      if (!track.url.startsWith('/api/audio-proxy') && track.url.startsWith('http')) {
        this.audio.src = `/api/audio-proxy?url=${encodeURIComponent(track.url)}`;
        await this.audio.play();
      }
    }
  }

  public stopAudio(): void {
    if (this.audio) {
      this.audio.pause();
      this.state.isPlaying = false;
      this.notify();
    }
  }

  public seek(seconds: number): void {
    if (this.audio) {
      this.audio.currentTime = seconds;
    }
  }

  public setVolume(val: number): void {
    const volume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = volume;
      this.state.volume = this.audio.volume;
      this.notify();
    }
    if (this.synthGain) this.synthGain.gain.setTargetAtTime(volume, this.synthContext?.currentTime || 0, 0.02);
  }

  private ensureSynthGraph(): AudioContext | null {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return null;
    if (!this.synthContext) {
      this.synthContext = new window.AudioContext();
      this.synthFilter = this.synthContext.createBiquadFilter();
      this.synthFilter.type = 'lowpass';
      this.synthFilter.frequency.value = this.filterCutoff;
      this.synthGain = this.synthContext.createGain();
      this.synthGain.gain.value = this.state.volume;
      this.synthFilter.connect(this.synthGain);
      this.synthGain.connect(this.synthContext.destination);
    }
    return this.synthContext;
  }

  public setBpm(bpm: number): void {
    this.dubClockBpm = Math.max(1, Math.min(300, bpm));
    if (this.dubClockTimer !== null) this.play(this.dubClockBpm, this.dubClockTrack);
  }

  public setFilterCutoff(frequency: number): void {
    this.filterCutoff = Math.max(40, Math.min(20000, frequency));
    if (this.synthFilter && this.synthContext) {
      this.synthFilter.frequency.setTargetAtTime(this.filterCutoff, this.synthContext.currentTime, 0.02);
    }
  }

  public setOnTick(listener: ((step: number) => void) | null): void {
    this.dubClockTick = listener;
  }

  public play(bpm = this.dubClockBpm, track: DubClockTrack = this.dubClockTrack): void {
    const context = this.ensureSynthGraph();
    if (!context) return;
    this.dubClockBpm = Math.max(1, Math.min(300, bpm));
    this.dubClockTrack = track;
    void context.resume();
    if (this.dubClockTimer !== null) window.clearInterval(this.dubClockTimer);
    this.dubClockStep = 0;
    const intervalMs = 60000 / this.dubClockBpm / 4;
    const tick = () => {
      const step = this.dubClockStep;
      this.playDubClockStep(step);
      this.dubClockTick?.(step);
      this.dubClockStep = (step + 1) % 16;
    };
    tick();
    this.dubClockTimer = window.setInterval(tick, intervalMs);
  }

  private playDubClockStep(step: number): void {
    const context = this.synthContext;
    const output = this.synthFilter;
    if (!context || !output) return;
    const now = context.currentTime;
    const playTone = (frequency: number, duration: number, wave: OscillatorType, gainValue: number, endFrequency?: number) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = wave;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (endFrequency !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), now + duration);
      }
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain);
      gain.connect(output);
      oscillator.start(now);
      oscillator.stop(now + duration);
    };

    if (step % 4 === 0) {
      const kickFrequency = this.dubClockTrack === 'hackney' ? 105 : 82;
      playTone(kickFrequency, 0.16, 'sine', 0.8, 38);
    }
    if (step === 4 || step === 12) {
      const snareFrequency = this.dubClockTrack === 'transmission' ? 240 : 180;
      playTone(snareFrequency, 0.08, 'triangle', 0.28);
    }
    if (step % 2 === 0 || (this.dubClockTrack === 'vital' && step === 15)) {
      playTone(this.dubClockTrack === 'decibel' ? 7600 : 6200, 0.025, 'square', 0.08);
    }
    if (this.dubClockTrack === 'vital' && (step === 7 || step === 15)) {
      playTone(55, 0.24, 'sine', 0.45, 32);
    }
  }

  public triggerSubDrop(): void {
    const context = this.ensureSynthGraph();
    const output = this.synthFilter;
    if (!context || !output) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(95, now);
    oscillator.frequency.exponentialRampToValueAtTime(28, now + 1.1);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(now);
    oscillator.stop(now + 1.1);
  }

  public stop(): void {
    if (this.dubClockTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.dubClockTimer);
      this.dubClockTimer = null;
    }
    this.stopAudio();
  }
}

export const audioEngine = new AudioEngine();
export const audioState = audioEngine.state;
export const playTrack = (track: AudioTrack) => audioEngine.playTrack(track);
export const stopAudio = () => audioEngine.stopAudio();
