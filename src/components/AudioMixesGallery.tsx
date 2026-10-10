import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  ExternalLink,
  Clock,
  Video,
  X,
  Filter,
  ChevronDown,
  Check,
} from 'lucide-react';
import { AudioMixData, VideoData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

interface AudioMixesGalleryProps {
  mixes: AudioMixData[];
  videos: VideoData[];
}

export const AudioMixesGallery: React.FC<AudioMixesGalleryProps> = ({ mixes, videos }) => {
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeEmbedUrl, setActiveEmbedUrl] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const styles = ['All', 'Jungle / D&B', 'Reggae / Dub', 'Oldskool Tape Archive', 'UK Bass'];

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getStyleCount = (style: string) => {
    if (style === 'All') return mixes.length;
    return mixes.filter((m) => m.style === style).length;
  };

  const filteredMixes = mixes.filter((m) => {
    if (selectedStyle === 'All') return true;
    return m.style === selectedStyle;
  });

  return (
    <section id="audio-media" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20 md:space-y-24">
        
        {/* Section 1: Audio Mixes & Pirate Radio Archives */}
        <div className="relative z-30">
          {/* Header */}
          <ScrollReveal variant="fade-up" className={`relative ${isDropdownOpen ? 'z-50' : 'z-30'}`}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-800 dark:text-white font-bold">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">04 / AUDIO ARCHIVE</span>
                  <span aria-hidden="true" className="opacity-60">·</span>
                  <span className="text-neutral-700 dark:text-white">SOUNDCLOUD & MIXCLOUD STREAMS</span>
                </div>
                <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                  Live Sets & Radio Archives
                </h2>
                <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                  Authentic 90s pirate radio broadcasts, Kool FM reel-to-reel tapes, and recent Vital Fest sound system clashing sessions grouped by musical style.
                </p>
              </div>

              {/* Interactive Style Filter Dropdown */}
              <div className={`relative ${isDropdownOpen ? 'z-50' : 'z-40'} shrink-0 w-full sm:w-auto`} ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  className="w-full sm:w-64 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900/90 dark:hover:bg-neutral-800/90 border border-neutral-300 dark:border-white/20 text-neutral-900 dark:text-white transition-all duration-200 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-primary)',
                      }}
                      className="p-1.5 rounded-lg shrink-0"
                    >
                      <Filter className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-[10px] font-mono uppercase text-neutral-600 dark:text-neutral-300 font-semibold tracking-wider">
                        Musical Style
                      </span>
                      <span className="text-xs font-display font-bold text-neutral-950 dark:text-white tracking-wide truncate">
                        {selectedStyle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      style={{
                        color: 'var(--accent-primary)',
                      }}
                      className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 text-[10px] font-mono font-bold border border-neutral-300 dark:border-white/15"
                    >
                      {filteredMixes.length}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-600 dark:text-white/80 transition-transform duration-200 ${
                        isDropdownOpen ? 'rotate-180 text-amber-500 dark:text-amber-400' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Dropdown Menu Popover */}
                {isDropdownOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 sm:right-0 top-full mt-2 w-full sm:w-64 z-[100] p-1.5 rounded-2xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/25 shadow-2xl space-y-1 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                      <span>Filter by Genre</span>
                      <span>Total {mixes.length}</span>
                    </div>

                    {styles.map((style) => {
                      const isSelected = selectedStyle === style;
                      const count = getStyleCount(style);

                      return (
                        <button
                          key={style}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedStyle(style);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-amber-400 text-neutral-950 shadow-md font-extrabold'
                              : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-white/40 shrink-0" />
                            )}
                            <span className="truncate">{style}</span>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold shrink-0 ml-2 ${
                              isSelected
                                ? 'bg-neutral-950/20 text-neutral-950 font-black'
                                : 'bg-neutral-200 dark:bg-white/10 text-neutral-700 dark:text-white/80'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Active Audio Embed Player Modal / Top Bar */}
          {activeEmbedUrl && (
            <div className="mb-8 p-5 rounded-3xl border border-amber-500/60 dark:border-amber-400/50 glass-panel-amber text-neutral-900 dark:text-white shadow-2xl relative z-10 animate-in slide-in-from-top-4 duration-300 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">STREAMING DECK ACTIVE</span>
                </div>
                <button
                  onClick={() => setActiveEmbedUrl(null)}
                  className="p-1 rounded-lg text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full rounded-2xl overflow-hidden bg-neutral-900 aspect-[16/5] min-h-[140px] flex items-center justify-center border border-neutral-200 dark:border-white/10">
                <iframe
                  width="100%"
                  height="120"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
                    activeEmbedUrl
                  )}&color=%23f59e0b&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}
                  className="w-full h-full"
                  title="Audio Player"
                />
              </div>
            </div>
          )}

          {/* Mixes Grid */}
          {filteredMixes.length === 0 ? (
            <div className="py-12 px-6 rounded-3xl border border-dashed border-neutral-300 dark:border-white/20 text-center space-y-3 bg-neutral-50/70 dark:bg-neutral-900/40">
              <Radio className="w-8 h-8 mx-auto text-amber-500 dark:text-amber-400 opacity-80" />
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                No recorded sets found in the "{selectedStyle}" category
              </p>
              <button
                type="button"
                onClick={() => setSelectedStyle('All')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-mono text-xs font-bold hover:bg-amber-300 transition-colors cursor-pointer shadow-md mt-1"
              >
                <span>Reset to All Styles ({mixes.length})</span>
              </button>
            </div>
          ) : (
            <div className={`grid ${filteredMixes.length === 1 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' : 'grid-cols-1 md:grid-cols-2'} gap-6 sm:gap-7 relative z-10`}>
              {filteredMixes.map((mix, idx) => (
                <ScrollReveal key={mix.id} variant="fade-up" delay={idx * 80}>
                  <div className="p-6 sm:p-7 rounded-3xl glass-card hover-glass-sheen shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 h-full text-neutral-900 dark:text-white relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-amber-400/40 before:to-transparent">
                    <div className="space-y-4">
                      {/* Top Row: Platform & Style Tag */}
                      <div className="flex items-center justify-between gap-3 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30 dark:border-amber-400/40">
                            {mix.style}
                          </span>
                          <span className="text-neutral-600 dark:text-white/80 font-bold">{mix.platform}</span>
                        </div>
                        {mix.duration && (
                          <div className="flex items-center gap-1 text-neutral-700 dark:text-white text-[11px] font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            <span>{mix.duration}</span>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-2">
                        <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                          {mix.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                          {mix.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                      <button
                        onClick={() => setActiveEmbedUrl(mix.embed_url)}
                        className="hover-shimmer flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all shadow-md cursor-pointer hover:scale-102"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Stream Mix</span>
                      </button>

                      <a
                        href={mix.stream_url || mix.embed_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-mono text-neutral-700 dark:text-white/90 hover:text-amber-600 dark:hover:text-amber-300 font-bold transition-colors"
                      >
                        <span>Open on {mix.platform}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Action Video Clips & Event Recaps */}
        <div className="pt-12 border-t border-neutral-200 dark:border-white/10">
          <ScrollReveal variant="fade-up">
            <div className="space-y-3 mb-8 sm:mb-10">
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-800 dark:text-white font-bold">
                <span className="text-amber-600 dark:text-amber-400 font-bold">05 / RECAP FOOTAGE</span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="text-neutral-700 dark:text-white">EVENT RECAPS & CROWD ACTION</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight">
                Sound System Video Clips & Recaps
              </h3>
              <p className="text-neutral-600 dark:text-white/90 text-sm max-w-xl font-normal leading-relaxed">
                High-definition live action footage: dubplate cutting sessions, sound system crowd reactions, and festival highlights from Vital Fest and legendary club appearances.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((vid, idx) => {
              const thumb = normalizeImageUrl(vid.thumbnail_url || '/images/vital_fest_crowd_1790112387611.jpg');

              return (
                <ScrollReveal key={vid.id} variant="fade-up" delay={idx * 100}>
                  <div
                    onClick={() => setActiveVideo(vid)}
                    className="rounded-2xl glass-card hover-glass-sheen overflow-hidden group cursor-pointer shadow-xl hover:-translate-y-1 transition-all duration-300 text-neutral-900 dark:text-white"
                  >
                    {/* Thumbnail with Play Trigger */}
                    <div className="relative aspect-video bg-neutral-900 overflow-hidden">
                      <img
                        src={thumb}
                        alt={vid.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 pointer-events-none" />

                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded bg-black/85 backdrop-blur-md text-[10px] font-mono text-white font-bold border border-white/20">
                        {vid.category}
                      </div>

                      {vid.duration && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md text-[10px] font-mono text-white font-bold flex items-center gap-1 border border-white/10">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{vid.duration}</span>
                        </div>
                      )}

                      <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-115 transition-transform">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h4 className="font-display font-bold text-base text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                        {vid.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-white/80 font-mono font-medium">
                        <span>Click to Watch Clip</span>
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>

      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-3xl bg-neutral-950 border border-white/20 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <span className="font-display font-bold text-sm truncate max-w-md text-white">
                  {activeVideo.title}
                </span>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${
                  activeVideo.video_url.includes('v=')
                    ? activeVideo.video_url.split('v=')[1]?.split('&')[0]
                    : 'dQw4w9WgXcQ'
                }?autoplay=1&modestbranding=1&rel=0`}
                title={activeVideo.title}
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
