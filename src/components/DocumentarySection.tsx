import React, { useState } from 'react';
import { Play, ExternalLink, Clock, X, Video } from 'lucide-react';
import { DocumentaryData, DocumentarySettingsData, DEFAULT_DOCUMENTARY_SETTINGS } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

export interface DocumentarySectionProps {
  episodes: DocumentaryData[];
  settings?: DocumentarySettingsData | null;
  thumbnails?: Record<number, string>;
  isLivePreview?: boolean;
}

export function extractYouTubeEmbedUrl(urlOrId: string): string {
  if (!urlOrId || !urlOrId.trim()) {
    return 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0';
  }
  const clean = urlOrId.trim();

  // If already an embed URL
  if (clean.includes('youtube.com/embed/') || clean.includes('youtube-nocookie.com/embed/')) {
    const sep = clean.includes('?') ? '&' : '?';
    return `${clean}${sep}autoplay=1&modestbranding=1&rel=0`;
  }

  // If v= in query param
  if (clean.includes('v=')) {
    const id = clean.split('v=')[1]?.split('&')[0]?.split('#')[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
  }

  // If youtu.be shortlink
  if (clean.includes('youtu.be/')) {
    const id = clean.split('youtu.be/')[1]?.split('?')[0]?.split('#')[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
  }

  // If shorts
  if (clean.includes('youtube.com/shorts/')) {
    const id = clean.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('#')[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
  }

  // If it's a bare 11-char ID like dQw4w9WgXcQ
  if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
    return `https://www.youtube-nocookie.com/embed/${clean}?autoplay=1&modestbranding=1&rel=0`;
  }

  // Fallback to standard video
  return 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&modestbranding=1&rel=0';
}

export const DocumentarySection: React.FC<DocumentarySectionProps> = ({
  episodes,
  settings,
  thumbnails = {},
  isLivePreview = false,
}) => {
  const [selectedEp, setSelectedEp] = useState<DocumentaryData | null>(null);

  // If hidden via dashboard settings and not in live preview mode, hide section
  if (settings && Number(settings.is_section_visible) === 0 && !isLivePreview) {
    return null;
  }

  const defaultThumbnails: Record<number, string> = {
    1: '/images/hackney_pirate_radio_1790113898507.jpg',
    2: '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    3: '/images/vital_fest_crowd_1790112387611.jpg',
    4: '/images/va_museum_exhibition_1790112416279.jpg',
  };

  const badgeText = settings?.badge_text || DEFAULT_DOCUMENTARY_SETTINGS.badge_text;
  const subbadgeText = settings?.subbadge_text || DEFAULT_DOCUMENTARY_SETTINGS.subbadge_text;
  const heading = settings?.heading || DEFAULT_DOCUMENTARY_SETTINGS.heading;
  const description = settings?.description || DEFAULT_DOCUMENTARY_SETTINGS.description;
  const showYouTubeBtn = settings?.show_youtube_button !== undefined ? Boolean(settings.show_youtube_button) : true;
  const youtubeBtnText = settings?.youtube_button_text || DEFAULT_DOCUMENTARY_SETTINGS.youtube_button_text;
  const youtubeUrl = settings?.youtube_series_url || DEFAULT_DOCUMENTARY_SETTINGS.youtube_series_url;

  return (
    <section id="documentary" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white flex-wrap">
                <span className="sound-badge">{badgeText}</span>
                {subbadgeText && (
                  <>
                    <span aria-hidden="true" className="opacity-60">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">{subbadgeText}</span>
                  </>
                )}
              </div>
              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                {heading}
              </h2>
              {description && (
                <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showYouTubeBtn && youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noreferrer"
                className="hardware-btn group flex items-center gap-2 px-5 py-2.5 rounded border border-neutral-300 dark:border-white/20 hover:border-amber-400 text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-300 text-xs font-industrial font-black uppercase tracking-wider transition-all bg-neutral-100 dark:bg-white/10 shadow-sm shrink-0"
              >
                <span>{youtubeBtnText}</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Episodes Grid */}
        {episodes.length === 0 ? (
          <div className="p-12 text-center sound-card rounded border border-dashed border-neutral-300 dark:border-white/20">
            <Video className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-display font-bold text-neutral-950 dark:text-white uppercase mb-1">
              No Documentary Episodes Published
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Add new episodes in the Dashboard under Documentary Series to display them here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {episodes.map((ep, idx) => {
              const rawThumb =
                ep.thumbnail_url ||
                thumbnails[ep.episode_number] ||
                defaultThumbnails[ep.episode_number] ||
                '/images/dj_ital_hero_1790112374509.jpg';
              const thumbUrl = normalizeImageUrl(rawThumb);
              const badgeLabel =
                ep.badge_label ||
                `EPISODE ${ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}`;
              const actionBtnText = ep.action_button_text || 'WATCH ARCHIVAL TAPE';

              return (
                <ScrollReveal
                  key={ep.id || idx}
                  variant="fade-up"
                  delay={idx * 100}
                >
                  <div
                    className="rounded sound-card text-neutral-900 dark:text-white shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:shadow-2xl hover:-translate-y-1 h-full"
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-neutral-900">
                      <img
                        src={thumbUrl}
                        alt={ep.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                      {/* Ep badge */}
                      <div className="absolute top-3 left-3 px-2 py-0.5 rounded sound-tag text-white font-industrial font-black text-[10px] bg-black/90">
                        {badgeLabel}
                      </div>

                      {/* Duration badge */}
                      {ep.duration && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/90 backdrop-blur-md text-white font-industrial text-[10px] flex items-center gap-1 border border-white/10 font-bold">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{ep.duration}</span>
                        </div>
                      )}

                      {/* Play button overlay */}
                      <button
                        onClick={() => setSelectedEp(ep)}
                        className="hardware-btn absolute inset-0 m-auto w-12 h-12 rounded bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer"
                        aria-label={`Watch Episode ${ep.episode_number}: ${ep.title}`}
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <h3 className="font-display font-black text-base sm:text-lg text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                          {ep.title}
                        </h3>
                        <p className="text-xs text-neutral-700 dark:text-white/95 line-clamp-3 leading-relaxed font-normal">
                          {ep.description}
                        </p>
                      </div>

                      {/* Topics Pill */}
                      {ep.topics && (
                        <div className="pt-2 border-t border-neutral-200 dark:border-white/10 text-[10px] font-industrial text-neutral-600 dark:text-white/80 line-clamp-1 uppercase tracking-wide">
                          <strong className="text-amber-600 dark:text-amber-400">Archive:</strong> {ep.topics}
                        </div>
                      )}
                    </div>

                    {/* Watch Link */}
                    <div className="px-5 pb-4 pt-1">
                      <button
                        onClick={() => setSelectedEp(ep)}
                        className="hardware-btn w-full flex items-center justify-center gap-1.5 py-2.5 rounded bg-neutral-100 hover:bg-amber-400 hover:text-neutral-950 text-neutral-900 dark:bg-white/10 dark:hover:bg-amber-400 dark:hover:text-neutral-950 dark:text-white text-xs font-industrial font-black uppercase tracking-wider transition-all cursor-pointer border border-neutral-300 dark:border-white/15"
                      >
                        <Video className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>{actionBtnText}</span>
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

      </div>

      {/* Episode Player Modal */}
      {selectedEp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded sound-cabinet bg-neutral-950 border border-white/20 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded sound-tag text-xs font-black">
                  {selectedEp.badge_label || `EP 0${selectedEp.episode_number}`}
                </span>
                <span className="font-display font-black text-sm uppercase tracking-wide truncate max-w-md text-white">
                  {selectedEp.title}
                </span>
              </div>
              <button
                onClick={() => setSelectedEp(null)}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                src={extractYouTubeEmbedUrl(selectedEp.youtube_url)}
                title={selectedEp.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
