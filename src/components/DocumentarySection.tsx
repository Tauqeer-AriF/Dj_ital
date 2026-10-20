import React, { useState } from 'react';
import { Play, Film, Youtube, Clock, Tag, ExternalLink, X } from 'lucide-react';
import { DocumentaryData, DocumentarySettingsData } from '../db/sqlite';
import { normalizeImageUrl } from '../utils/imageOptimization';

export function isVideoFile(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

export function extractYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
}

export interface DocumentarySectionProps {
  settings: DocumentarySettingsData;
  episodes: DocumentaryData[];
}

export const DocumentarySection: React.FC<DocumentarySectionProps> = ({ settings, episodes }) => {
  const [activeEpisode, setActiveEpisode] = useState<DocumentaryData | null>(null);

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
      {activeEpisode && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-4xl rounded-2xl bg-neutral-950 border border-white/20 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-base uppercase">
                  {activeEpisode.badge_label || `Episode ${activeEpisode.episode_number}`}: {activeEpisode.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveEpisode(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {isVideoFile(activeEpisode.youtube_url) ? (
                <video
                  src={activeEpisode.youtube_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : extractYouTubeEmbedUrl(activeEpisode.youtube_url) ? (
                <iframe
                  src={extractYouTubeEmbedUrl(activeEpisode.youtube_url)!}
                  title={activeEpisode.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <Film className="w-12 h-12 text-amber-400 mx-auto opacity-60" />
                  <p className="text-sm font-mono text-neutral-400">
                    Direct video playback unavailable. Visit external stream below.
                  </p>
                  <a
                    href={activeEpisode.youtube_url || settings.youtube_series_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-amber-400 text-neutral-950 font-mono text-xs font-bold uppercase"
                  >
                    <span>Open External Video</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
