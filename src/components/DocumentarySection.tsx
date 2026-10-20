import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, Film, Youtube, Clock, Tag, ExternalLink, X } from 'lucide-react';
import { DocumentaryData, DocumentarySettingsData } from '../db/sqlite';
import { normalizeImageUrl } from '../utils/imageOptimization';

export function isVideoFile(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return /\.(mp4|webm|ogg|mov|m4v)$/i.test(new URL(url, 'http://localhost').pathname);
  } catch {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  }
}

export function extractYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId: string | null = null;

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (parsed.pathname === '/watch') videoId = parsed.searchParams.get('v');
      else if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0])) videoId = pathParts[1] || null;
    } else if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const videoId = parsed.pathname.split('/').filter(Boolean).find((part) => /^\d+$/.test(part));
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : null;
    }

    return videoId && /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1`
      : null;
  } catch {
    return null;
  }
}

export interface DocumentarySectionProps {
  settings: DocumentarySettingsData;
  episodes: DocumentaryData[];
  isLivePreview?: boolean;
}

export const DocumentarySection: React.FC<DocumentarySectionProps> = ({ settings, episodes }) => {
  const [activeEpisode, setActiveEpisode] = useState<DocumentaryData | null>(null);

  useEffect(() => {
    if (!activeEpisode) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveEpisode(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [activeEpisode]);

  if (!settings.is_section_visible) return null;

  return (
    <section id="documentary" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-neutral-950 text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>{settings.badge_text || 'ARCHIVAL DOCUMENTARY'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white uppercase">
            {settings.heading}
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            {settings.description}
          </p>

          {settings.show_youtube_button === 1 && settings.youtube_series_url && (
            <div className="pt-2">
              <a
                href={settings.youtube_series_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-red-950/40 hover:scale-105"
              >
                <Youtube className="w-4 h-4" />
                <span>{settings.youtube_button_text || 'WATCH FULL SERIES ON YOUTUBE'}</span>
              </a>
            </div>
          )}
        </div>

        {/* Episodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {episodes.map((ep) => {
            const thumb = normalizeImageUrl(ep.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg');
            const badge = ep.badge_label || `EPISODE ${ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}`;

            return (
              <div
                key={ep.id}
                className="group rounded-xl border border-white/10 bg-neutral-900/80 hover:border-amber-500/50 backdrop-blur-md overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video overflow-hidden bg-neutral-950">
                    <img
                      src={thumb}
                      alt={ep.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/dj_ital_hero_1790112374509.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-400 text-neutral-950 shadow-md">
                      {badge}
                    </div>

                    {ep.duration && (
                      <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black/80 text-neutral-300 flex items-center gap-1 border border-white/10">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{ep.duration}</span>
                      </div>
                    )}

                    <button
                      onClick={() => setActiveEpisode(ep)}
                      className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 shadow-2xl cursor-pointer"
                      title="Play Tape"
                    >
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-display font-bold text-lg text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                      {ep.description}
                    </p>

                    {ep.topics && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {ep.topics.split(',').slice(0, 3).map((topic, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-neutral-400 flex items-center gap-1"
                          >
                            <Tag className="w-2.5 h-2.5 text-amber-400" />
                            <span>{topic.trim()}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => setActiveEpisode(ep)}
                    className="w-full py-2.5 px-4 rounded border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400 hover:text-neutral-950 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{ep.action_button_text || 'WATCH ARCHIVAL TAPE'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Modal Player */}
      {activeEpisode && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${activeEpisode.badge_label || `Episode ${activeEpisode.episode_number}`}: ${activeEpisode.title}`}
          onClick={() => setActiveEpisode(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/90 p-3 pt-16 backdrop-blur-xl animate-in fade-in duration-200 sm:p-6"
        >
          <button
            type="button"
            onClick={() => setActiveEpisode(null)}
            aria-label="Close documentary player"
            className="fixed right-3 top-3 z-[122] flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-neutral-900 text-white shadow-xl transition-colors hover:bg-neutral-700 sm:right-6 sm:top-6"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative my-auto w-full max-w-4xl overflow-hidden rounded-xl border border-white/20 bg-neutral-950 shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-14 items-center gap-2 border-b border-white/10 px-4 py-3 pr-14 text-white sm:px-6">
              <Film className="h-5 w-5 shrink-0 text-amber-400" />
              <h3 className="min-w-0 break-words font-display text-sm font-bold uppercase sm:text-base">
                {activeEpisode.badge_label || `Episode ${activeEpisode.episode_number}`}: {activeEpisode.title}
              </h3>
            </div>

            <div className="flex aspect-video max-h-[calc(100dvh-8rem)] items-center justify-center bg-black">
              {isVideoFile(activeEpisode.youtube_url) ? (
                <video
                  src={activeEpisode.youtube_url}
                  controls
                  autoPlay
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : extractYouTubeEmbedUrl(activeEpisode.youtube_url) ? (
                <iframe
                  src={extractYouTubeEmbedUrl(activeEpisode.youtube_url)!}
                  title={activeEpisode.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="space-y-4 p-8 text-center">
                  <Film className="mx-auto h-12 w-12 text-amber-400 opacity-60" />
                  <p className="text-sm font-mono text-neutral-400">
                    This video source cannot be embedded. Open it in a new tab instead.
                  </p>
                  <a
                    href={activeEpisode.youtube_url || settings.youtube_series_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded bg-amber-400 px-5 py-2.5 font-mono text-xs font-bold uppercase text-neutral-950"
                  >
                    <span>Open External Video</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
