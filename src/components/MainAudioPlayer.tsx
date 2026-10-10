import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Disc3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ProfileData } from '../db/sqlite';
import { ActiveTrack } from '../types';
import { isEmbedStream, getPlayableStreamUrl, getProxyStreamUrl } from '../utils/streamAudio';

interface MainAudioPlayerProps {
  profile: ProfileData | null;
  activeTrack: ActiveTrack | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPlayLiveStream?: () => void;
}

export const MainAudioPlayer: React.FC<MainAudioPlayerProps> = ({
  profile,
  activeTrack,
  isPlaying,
  onTogglePlay,
  onPlayLiveStream,
}) => {
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [retryWithProxy, setRetryWithProxy] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('dj_ital_player_minimized') === 'true';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleMinimize = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsMinimized((prev) => {
      const next = !prev;
      sessionStorage.setItem('dj_ital_player_minimized', String(next));
      return next;
    });
  };

  const liveStreamUrl = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
  const hasStream = Boolean(liveStreamUrl);

  const isCurrentLiveStream =
    !activeTrack ||
    activeTrack.type === 'live_stream' ||
    (activeTrack.type as string) === 'hero_stream' ||
    (activeTrack.type as string) === 'main_stream' ||
    (activeTrack.type as string) === 'dejavu_stream';

  const currentStreamUrl = activeTrack?.streamUrl?.trim() || (isCurrentLiveStream ? liveStreamUrl : null);

  // Handle direct HTML5 audio stream playback when streamUrl is provided
  useEffect(() => {
    if (!audioRef.current) return;

    if (!currentStreamUrl) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
      setIsBuffering(false);
      setStreamError(null);
      setRetryWithProxy(false);
      return;
    }

    // If it's a SoundCloud or Mixcloud embed URL, show embed dialog
    if (isEmbedStream(currentStreamUrl)) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      setActiveEmbedUrl(currentStreamUrl);
      setIsBuffering(false);
      return;
    }

    // Resolve stream URL with mixed content & playlist handling
    const resolvedUrl = getPlayableStreamUrl(currentStreamUrl, retryWithProxy);
    if (!resolvedUrl) return;

    setStreamError(null);

    // Only update src if changed to preserve streaming buffer
    const currentSrc = audioRef.current.src;
    const isDifferentSrc = !currentSrc || (!currentSrc.includes(resolvedUrl) && !resolvedUrl.includes(currentSrc));

    if (isDifferentSrc) {
      setIsBuffering(true);
      audioRef.current.src = resolvedUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      setIsBuffering(true);
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsBuffering(false);
            setStreamError(null);
          })
          .catch((err) => {
            console.warn('Stream playback error:', err.message);
            // If failed on direct URL and haven't tried proxy yet, auto-retry via proxy
            if (!retryWithProxy && !resolvedUrl.startsWith('/api/audio-proxy')) {
              setRetryWithProxy(true);
            } else {
              setIsBuffering(false);
              setStreamError('Radio cast audio feed connecting or offline');
            }
          });
      }
    } else {
      audioRef.current.pause();
      setIsBuffering(false);
    }
  }, [currentStreamUrl, isPlaying, retryWithProxy]);

  // Volume synchronization
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Reset retry flag when stream URL changes
  useEffect(() => {
    setRetryWithProxy(false);
    setStreamError(null);
  }, [currentStreamUrl]);

  const handleAudioError = useCallback(() => {
    if (!currentStreamUrl) return;

    // If direct connection failed, auto-fallback to server proxy
    if (!retryWithProxy) {
      console.log('Stream error on direct connection, falling back to server audio proxy...');
      setRetryWithProxy(true);
    } else {
      setIsBuffering(false);
      setStreamError('Radio cast stream unavailable or offline');
    }
  }, [currentStreamUrl, retryWithProxy]);

  const handleManualRetry = () => {
    setStreamError(null);
    setIsBuffering(true);
    setRetryWithProxy(true);
    if (audioRef.current && currentStreamUrl) {
      audioRef.current.src = getProxyStreamUrl(currentStreamUrl) || currentStreamUrl;
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        setIsBuffering(false);
        setStreamError('Unable to connect to radio stream');
      });
    }
  };

  // If there's no track playing and no stream configured, don't show the player
  if (!activeTrack && !hasStream) {
    return null;
  }

  const handleOpenSoundCloudModal = (url: string) => {
    setActiveEmbedUrl(url);
  };

  return (
    <>
      {/* Embedded Stream Modal (for SoundCloud or Mixcloud streams) */}
      {activeEmbedUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>EXTERNAL AUDIO STREAM DECK</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmbedUrl(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full rounded-2xl overflow-hidden bg-black aspect-[16/6] min-h-[160px] border border-white/10">
              <iframe
                width="100%"
                height="160"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                  activeEmbedUrl
                )}&color=%23f59e0b&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                className="w-full h-full"
                title="Streaming Deck"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveEmbedUrl(null)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs font-bold transition-colors cursor-pointer"
              >
                Close Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for direct and proxied radio streams */}
      <audio
        ref={audioRef}
        preload="auto"
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => {
          setIsBuffering(false);
          setStreamError(null);
        }}
        onCanPlay={() => setIsBuffering(false)}
        onError={handleAudioError}
      />

      {/* Minimized: Just the Play/Pause button */}
      {isMinimized ? (
        <aside
          aria-label="Audio player (minimized)"
          className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 transition-all duration-300 animate-in fade-in zoom-in-95 group"
        >
          <div className="relative p-1.5 rounded-full glass-panel shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.85)] border border-amber-400/40 flex items-center justify-center">
            {/* Ambient amber glow when playing */}
            {isPlaying && (
              <span className="absolute inset-0 rounded-full bg-amber-400/20 blur-md animate-pulse" />
            )}

            {/* Minimal Play / Pause Floating Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
              className={`hover-shimmer w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold relative z-10 ${
                isPlaying ? 'ring-4 ring-amber-400/35' : ''
              }`}
            >
              {/* Subtle spinning vinyl dash ring if playing */}
              {isPlaying && (
                <span className="absolute inset-0 rounded-full border-2 border-neutral-950/30 border-dashed animate-spin-vinyl" />
              )}
              {isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current relative z-10" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 relative z-10" />
              )}
            </button>

            {/* Subtle Expand Button on top corner */}
            <button
              type="button"
              onClick={() => handleToggleMinimize()}
              aria-label="Expand player bar"
              title="Expand player bar"
              className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-neutral-900/95 border border-white/25 text-white hover:text-amber-400 hover:bg-neutral-800 flex items-center justify-center shadow-lg transition-all cursor-pointer opacity-90 group-hover:opacity-100 hover:scale-110 backdrop-blur-md z-20"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      ) : (
        <aside
          aria-label="Audio player"
          className="fixed bottom-4 sm:bottom-6 left-3 right-3 sm:left-6 sm:right-6 max-w-5xl mx-auto z-40 transition-all duration-300"
        >
          <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl glass-dock border border-neutral-200/80 dark:border-amber-400/25 text-neutral-900 dark:text-white relative overflow-hidden transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-amber-400/40 before:to-transparent">
            {/* Ambient subtle warm glow when playing */}
            {isPlaying && (
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />
            )}

            <div className="flex items-center justify-between gap-3 sm:gap-6 relative z-10">
            
            {/* Left Track & Stream Info */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Spinning Dubplate Icon */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-neutral-950 border border-amber-400/40 p-1 flex items-center justify-center shrink-0 relative overflow-hidden transition-all ${
                  isPlaying ? 'shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/30' : ''
                }`}
              >
                <div
                  className={`w-full h-full rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center ${
                    isPlaying ? 'animate-spin-vinyl' : ''
                  }`}
                >
                  <Disc3 className="w-5 h-5 text-amber-400" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    {isPlaying && !isBuffering && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    )}
                    {isBuffering && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-spin" />
                    )}
                    {isCurrentLiveStream
                      ? 'LIVE RADIO STREAM'
                      : activeTrack
                      ? 'PROCEDURAL DUBPLATE'
                      : 'AUDIO TRANSMISSION'}
                  </span>

                  {isBuffering && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-mono font-bold animate-pulse">
                      BUFFERING...
                    </span>
                  )}

                  {retryWithProxy && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold">
                      SECURE PROXY ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-sm sm:text-base font-display font-black truncate text-neutral-950 dark:text-white leading-tight">
                  {activeTrack
                    ? activeTrack.title
                    : profile?.live_show_title
                    ? `${profile.live_show_title} (Live Feed)`
                    : 'DJ Ital Live Radio Stream Transmission'}
                </div>

                {streamError && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-red-500 dark:text-red-400 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{streamError}</span>
                    <button
                      type="button"
                      onClick={handleManualRetry}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 font-bold transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="hover-shimmer w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center shadow-lg shadow-amber-400/30 transition-transform active:scale-95 cursor-pointer font-bold relative overflow-hidden"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>
            </div>

            {/* Right Stream Sources & Quick Switchers */}
            <div className="flex items-center gap-2 shrink-0">
              {liveStreamUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEmbedStream(liveStreamUrl)) {
                      handleOpenSoundCloudModal(liveStreamUrl);
                    } else if (onPlayLiveStream) {
                      onPlayLiveStream();
                    } else {
                      onTogglePlay();
                    }
                  }}
                  className={`hidden sm:flex px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all items-center gap-1.5 cursor-pointer border hover-shimmer ${
                    isCurrentLiveStream && isPlaying
                      ? 'bg-amber-400 text-neutral-950 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-neutral-100/80 dark:bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-neutral-800 dark:text-white border-neutral-300 dark:border-white/15'
                  }`}
                  title={`Live Radio Stream: ${liveStreamUrl}`}
                >
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isCurrentLiveStream && isPlaying ? 'Now Live' : 'Live Stream'}</span>
                </button>
              )}

              {/* Volume Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-xl text-neutral-600 dark:text-white/80 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Minimal Minimize Button */}
              <button
                type="button"
                onClick={() => handleToggleMinimize()}
                className="p-2 rounded-xl text-neutral-600 dark:text-white/80 hover:text-amber-500 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize player bar"
                aria-label="Minimize audio player bar"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Real-time Visualizer Strip when playing */}
          {isPlaying && (
            <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>
                  {isBuffering
                    ? 'STREAM CONNECTING · BUFFERING RADIO FEED'
                    : 'LIVE RADIO TRANSMISSION BUFFERING 100% · STEREO SOUND SYSTEM FEED'}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85, 50, 70].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 0.16}px` }}
                    className="w-1 bg-amber-400 rounded-full animate-subwoofer inline-block"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
      )}
    </>
  );
};
