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
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem('dj_ital_player_minimized') !== 'false';
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

  const isLiveOnAir = Boolean(profile?.is_live_on_air);
  const liveStreamUrl = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
  const hasStream = Boolean(liveStreamUrl) && isLiveOnAir;

  const isCurrentLiveStream =
    !activeTrack ||
    activeTrack.type === 'live_stream' ||
    (activeTrack.type as string) === 'hero_stream' ||
    (activeTrack.type as string) === 'main_stream' ||
    (activeTrack.type as string) === 'dejavu_stream';

  // CRITICAL: When OFF AIR, strictly prevent supplying any live stream URL to the audio player!
  const currentStreamUrl = isLiveOnAir
    ? (activeTrack?.streamUrl?.trim() || (isCurrentLiveStream ? liveStreamUrl : null))
    : (activeTrack?.type !== 'live_stream' && activeTrack?.streamUrl ? activeTrack.streamUrl.trim() : null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/65 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl sound-cabinet rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs font-industrial uppercase tracking-wider">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>EXTERNAL AUDIO STREAM DECK</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveEmbedUrl(null)}
                className="hardware-btn p-1.5 rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="w-full rounded overflow-hidden bg-black aspect-[16/6] min-h-[160px] border border-neutral-200 dark:border-white/10">
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
                className="hardware-btn px-4 py-2 rounded bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-industrial text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
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

      {/* Minimized: Sound System Audio Console Badge */}
      {isMinimized ? (
        <aside
          aria-label="Sound System Audio Console (Minimized)"
          className="fixed top-20 sm:top-24 right-3 sm:right-6 z-40 transition-all duration-300 animate-in fade-in slide-in-from-right-4 group"
        >
          <div className="p-2 sm:p-2.5 rounded-lg sound-cabinet border border-amber-500/40 text-neutral-900 dark:text-white shadow-2xl flex items-center gap-3 relative overflow-hidden backdrop-blur-2xl">
            {/* Ambient amber glow when transmitting */}
            {isPlaying && (
              <span className="absolute inset-0 bg-amber-400/10 pointer-events-none animate-pulse" />
            )}

            {/* Live Frequency / Status Indicator */}
            <div className="flex items-center gap-2 pl-1.5">
              <div className="flex items-center gap-0.5 h-3.5">
                <span className={`w-1 bg-amber-400 rounded-none ${isPlaying ? 'vu-bar-1' : 'h-1'}`} />
                <span className={`w-1 bg-amber-400 rounded-none ${isPlaying ? 'vu-bar-2' : 'h-2'}`} />
                <span className={`w-1 bg-amber-500 rounded-none ${isPlaying ? 'vu-bar-3' : 'h-1.5'}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-industrial font-black tracking-wider text-amber-600 dark:text-amber-400 uppercase leading-none">
                  {isPlaying ? 'TRANSMITTING' : 'DUB STATION'}
                </span>
                <span className="text-[8px] font-industrial text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                  94.5 MHz LONDON
                </span>
              </div>
            </div>

            {/* Tactile Hardware Play/Pause Button */}
            <button
              type="button"
              onClick={isCurrentLiveStream && !isLiveOnAir ? undefined : onTogglePlay}
              disabled={isCurrentLiveStream && !isLiveOnAir}
              aria-label={isPlaying ? 'Pause transmission' : (isCurrentLiveStream && !isLiveOnAir ? 'Station off air' : 'Play transmission')}
              title={isCurrentLiveStream && !isLiveOnAir ? 'Station currently off air' : (isPlaying ? 'Pause transmission' : 'Play transmission')}
              className={`hardware-btn w-9 h-9 sm:w-10 sm:h-10 rounded flex items-center justify-center shadow-lg transition-all ${
                isCurrentLiveStream && !isLiveOnAir
                  ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-75'
                  : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 cursor-pointer'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Expand Console Trigger */}
            <button
              type="button"
              onClick={() => handleToggleMinimize()}
              aria-label="Expand sound console"
              title="Expand sound console"
              className="hardware-btn p-1.5 rounded border border-neutral-300 dark:border-white/20 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </aside>
      ) : (
        <aside
          aria-label="Sound System Master Dub Station"
          className="fixed top-20 sm:top-24 right-3 sm:right-6 z-40 max-w-sm sm:max-w-md w-[calc(100vw-1.5rem)] sm:w-88 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
        >
          <div className="p-4 sm:p-5 rounded-lg sound-cabinet border border-neutral-300 dark:border-amber-500/30 text-neutral-900 dark:text-white shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            {/* Corner Industrial Rivets */}
            <span className="absolute top-1.5 left-2 text-[9px] font-mono text-neutral-400 dark:text-neutral-600 select-none">＋</span>
            <span className="absolute top-1.5 right-2 text-[9px] font-mono text-neutral-400 dark:text-neutral-600 select-none">＋</span>
            <span className="absolute bottom-1 left-2 text-[9px] font-mono text-neutral-400 dark:text-neutral-600 select-none">＋</span>
            <span className="absolute bottom-1 right-2 text-[9px] font-mono text-neutral-400 dark:text-neutral-600 select-none">＋</span>

            {/* Console Masthead Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="sound-tag">
                  DUB STATION MK-IV
                </span>
                <span className="text-[10px] font-industrial text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-bold">
                  EAST LONDON
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Real-time VU meter strips */}
                <div className="flex items-center gap-0.5 h-3 px-1.5 py-0.5 rounded bg-neutral-950/20 dark:bg-black/60 border border-neutral-200 dark:border-white/10">
                  <span className={`w-0.5 bg-emerald-500 ${isPlaying ? 'vu-bar-1' : 'h-1'}`} />
                  <span className={`w-0.5 bg-emerald-400 ${isPlaying ? 'vu-bar-2' : 'h-1.5'}`} />
                  <span className={`w-0.5 bg-amber-400 ${isPlaying ? 'vu-bar-3' : 'h-2'}`} />
                  <span className={`w-0.5 bg-amber-500 ${isPlaying ? 'vu-bar-4' : 'h-1'}`} />
                  <span className={`w-0.5 bg-red-500 ${isPlaying ? 'vu-bar-5' : 'h-0.5'}`} />
                </div>

                {/* Minimize Button */}
                <button
                  type="button"
                  onClick={() => handleToggleMinimize()}
                  aria-label="Minimize sound console"
                  title="Minimize sound console"
                  className="hardware-btn p-1 rounded border border-neutral-300 dark:border-white/15 text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-6 relative z-10">
            
            {/* Left Track & Stream Info */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              {/* Spinning Dubplate Icon */}
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded bg-neutral-950 border border-amber-400/40 p-1 flex items-center justify-center shrink-0 relative overflow-hidden transition-all ${
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
                  <span className="text-[10px] font-industrial font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    {isPlaying && !isBuffering && (
                      <span className="w-1.5 h-1.5 rounded-none bg-emerald-400 animate-ping" />
                    )}
                    {isBuffering && (
                      <span className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-spin" />
                    )}
                    {isCurrentLiveStream
                      ? isLiveOnAir
                        ? 'LIVE RADIO STREAM'
                        : 'OFF AIR // STATION SILENT'
                      : activeTrack
                      ? 'PROCEDURAL DUBPLATE'
                      : 'AUDIO TRANSMISSION'}
                  </span>

                  {isBuffering && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-industrial font-bold uppercase animate-pulse">
                      BUFFERING...
                    </span>
                  )}

                  {retryWithProxy && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-industrial font-bold uppercase">
                      SECURE PROXY ACTIVE
                    </span>
                  )}
                </div>

                <div className="text-sm sm:text-base font-display font-black truncate text-neutral-950 dark:text-white leading-tight">
                  {isCurrentLiveStream && !isLiveOnAir
                    ? 'Station Currently Off Air — No Live Stream'
                    : activeTrack
                    ? activeTrack.title
                    : profile?.live_show_title
                    ? `${profile.live_show_title} (Live Feed)`
                    : 'DJ Ital Live Radio Stream Transmission'}
                </div>

                {streamError && (
                  <div className="flex items-center gap-2 text-[11px] font-industrial text-red-500 dark:text-red-400 pt-0.5 uppercase tracking-wider font-bold">
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

            {/* Middle & Right Playback Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={isCurrentLiveStream && !isLiveOnAir ? undefined : onTogglePlay}
                disabled={isBuffering || (isCurrentLiveStream && !isLiveOnAir)}
                aria-label={isPlaying ? 'Pause transmission' : (isCurrentLiveStream && !isLiveOnAir ? 'Station off air' : 'Start transmission')}
                className={`hardware-btn px-4 py-2 rounded flex items-center justify-center gap-1.5 shadow-md text-xs font-industrial font-black ${
                  isCurrentLiveStream && !isLiveOnAir
                    ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-not-allowed opacity-80'
                    : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 active:scale-95 cursor-pointer'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>MUTE AIR</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>{isCurrentLiveStream && !isLiveOnAir ? 'OFF AIR' : 'ENGAGE DUB'}</span>
                  </>
                )}
              </button>

              {/* Volume Button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="hardware-btn p-2 rounded border border-neutral-300 dark:border-white/15 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
              </button>
            </div>
          </div>

          {/* Real-time Visualizer Strip when playing */}
          {isPlaying && (
            <div className="mt-2.5 pt-2 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-[11px] font-industrial uppercase tracking-wider">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-none bg-emerald-400 animate-ping shrink-0" />
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
                    className="w-1 bg-amber-400 rounded-none animate-subwoofer inline-block"
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
