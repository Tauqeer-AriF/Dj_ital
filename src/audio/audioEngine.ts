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

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioListener> = new Set();
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
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, val));
      this.state.volume = this.audio.volume;
      this.notify();
    }
  }
}

export const audioEngine = new AudioEngine();
export const audioState = audioEngine.state;
export const playTrack = (track: AudioTrack) => audioEngine.playTrack(track);
export const stopAudio = () => audioEngine.stopAudio();
