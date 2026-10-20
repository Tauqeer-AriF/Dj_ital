export interface RadioStreamMetadata {
  station: string;
  bitrate: string;
  status: 'playing' | 'paused' | 'loading' | 'error';
  currentTrack?: string;
}

export function isEmbedStream(url: string): boolean {
  return /(?:soundcloud\.com|mixcloud\.com)/i.test(url);
}

export function getProxyStreamUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url, window.location.href);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return null;
    return `/api/audio-proxy?url=${encodeURIComponent(parsedUrl.href)}`;
  } catch {
    return null;
  }
}

export function getPlayableStreamUrl(url: string, useProxy = false): string | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  const proxyUrl = getProxyStreamUrl(trimmedUrl);
  if (useProxy) return proxyUrl || trimmedUrl;

  try {
    const parsedUrl = new URL(trimmedUrl, window.location.href);
    if (window.location.protocol === 'https:' && parsedUrl.protocol === 'http:') {
      return proxyUrl || parsedUrl.href;
    }
    return parsedUrl.href;
  } catch {
    return trimmedUrl;
  }
}

type StreamListener = (state: { isPlaying: boolean; status: string; url: string; error?: string }) => void;

class StreamAudioService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<StreamListener> = new Set();
  private currentUrl = '';
  private isStreamPlaying = false;
  private currentStatus: 'playing' | 'paused' | 'loading' | 'error' = 'paused';

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'none';

      this.audio.addEventListener('playing', () => {
        this.isStreamPlaying = true;
        this.currentStatus = 'playing';
        this.notify();
      });

      this.audio.addEventListener('pause', () => {
        this.isStreamPlaying = false;
        this.currentStatus = 'paused';
        this.notify();
      });

      this.audio.addEventListener('waiting', () => {
        this.currentStatus = 'loading';
        this.notify();
      });

      this.audio.addEventListener('error', (e) => {
        this.isStreamPlaying = false;
        this.currentStatus = 'error';
        this.notify('Stream connection error');
      });
    }
  }

  public subscribe(listener: StreamListener): () => void {
    this.listeners.add(listener);
    listener({
      isPlaying: this.isStreamPlaying,
      status: this.currentStatus,
      url: this.currentUrl,
    });
    return () => this.listeners.delete(listener);
  }

  private notify(error?: string) {
    this.listeners.forEach((listener) => {
      try {
        listener({
          isPlaying: this.isStreamPlaying,
          status: this.currentStatus,
          url: this.currentUrl,
          error,
        });
      } catch (e) {
        console.error('Error in stream listener:', e);
      }
    });
  }

  public async play(url: string): Promise<void> {
    if (!this.audio) return;
    try {
      if (this.currentUrl !== url) {
        this.currentUrl = url;
        this.audio.src = url;
      }
      this.currentStatus = 'loading';
      this.notify();
      await this.audio.play();
    } catch (err: any) {
      console.warn('Direct stream play failed, trying audio-proxy:', err);
      // Fallback via proxy
      if (!url.startsWith('/api/audio-proxy')) {
        const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
        this.audio.src = proxyUrl;
        await this.audio.play();
      } else {
        this.currentStatus = 'error';
        this.notify(err.message || 'Stream play failed');
        throw err;
      }
    }
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.isStreamPlaying = false;
      this.currentStatus = 'paused';
      this.notify();
    }
  }

  public get isPlaying(): boolean {
    return this.isStreamPlaying;
  }

  public get status(): 'playing' | 'paused' | 'loading' | 'error' {
    return this.currentStatus;
  }
}

export const streamPlayer = new StreamAudioService();
