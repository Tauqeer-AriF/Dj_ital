import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image as ImageIcon, X, Maximize2, MapPin, ChevronDown, Filter, Check, Play, Film, Video } from 'lucide-react';
import { GalleryData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';
import { isVideoFile } from './DocumentarySection';

interface GallerySectionProps {
  gallery: GalleryData[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [lightboxItem, setLightboxItem] = useState<GalleryData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    const defaultCats = ['All', 'Vital Fest', 'Kool FM Archive', 'V&A Museum', 'Studio', 'Video Clips'];
    const itemCats = Array.from(new Set(gallery.map((i) => i.category).filter(Boolean)));
    return Array.from(new Set([...defaultCats, ...itemCats]));
  }, [gallery]);

  const filteredGallery = gallery.filter((item) => {
    if (selectedCategory === 'All') return true;
    return item.category === selectedCategory;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return gallery.length;
    return gallery.filter((item) => item.category === cat).length;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Handle ESC key to close lightbox and dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxItem(null);
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <section id="gallery" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up" className={`relative ${isDropdownOpen ? 'z-50' : 'z-30'}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                Rave Gallery
              </h2>
              <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                Photographic highlights across 35 years: Vital Fest dancefloors, 1990s pirate radio studios,
                dubplate acetates, and historical museum artefacts.
              </p>
            </div>

            {/* Custom Interactive Dropdown Filter */}
            <div className={`relative ${isDropdownOpen ? 'z-50' : 'z-40'} shrink-0 w-full sm:w-auto`} ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                aria-haspopup="listbox"
                aria-expanded={isDropdownOpen}
                className="w-full sm:w-64 flex items-center justify-between gap-3 px-4 py-3 rounded sound-card text-neutral-900 dark:text-white transition-all duration-200 shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                    }}
                    className="p-1.5 rounded shrink-0"
                  >
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-[10px] font-industrial uppercase text-neutral-600 dark:text-neutral-300 font-bold tracking-wider">
                      Category
                    </span>
                    <span className="text-xs font-display font-black text-neutral-950 dark:text-white tracking-wide truncate uppercase">
                      {selectedCategory}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    style={{
                      color: 'var(--accent-primary)',
                    }}
                    className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-white/10 text-[10px] font-industrial font-bold border border-neutral-300 dark:border-white/15"
                  >
                    {filteredGallery.length}
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
                  className="absolute right-0 sm:right-0 top-full mt-2 w-full sm:w-64 z-[100] p-1.5 rounded sound-cabinet border border-neutral-300 dark:border-white/20 shadow-2xl space-y-1 animate-in fade-in-0 zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-industrial uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-bold border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
                    <span>Select Archive</span>
                    <span>Total {gallery.length}</span>
                  </div>

                  {categories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const count = getCategoryCount(cat);

                    return (
                      <button
                        key={cat}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-industrial font-bold uppercase tracking-wider transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-amber-400 text-neutral-950 shadow-md font-black'
                            : 'text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 hover:text-amber-600 dark:hover:text-amber-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected ? (
                            <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-none bg-neutral-400 dark:bg-white/40 shrink-0" />
                          )}
                          <span className="truncate">{cat}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-industrial font-bold shrink-0 ml-2 ${
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

        {/* Gallery Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, index) => {
            const isSpan2 = index % 5 === 0 && index !== 0;
            const imgUrl = normalizeImageUrl(item.image_url);

            return (
              <ScrollReveal
                key={item.id}
                variant="fade-up"
                delay={(index % 3) * 120}
                className={isSpan2 ? 'sm:col-span-2' : ''}
              >
                <div
                  onClick={() => setLightboxItem(item)}
                  className="group relative rounded sound-card overflow-hidden bg-neutral-950 shadow-md cursor-pointer hover:shadow-2xl hover:border-amber-400/60 dark:hover:border-amber-400/60 transition-all duration-300 hover:-translate-y-1 h-full"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden relative">
                    {isVideoFile(item.image_url) ? (
                      <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                        <video
                          src={item.image_url}
                          muted
                          playsInline
                          loop
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                        />
                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-12 h-12 rounded bg-amber-400 text-neutral-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={imgUrl}
                        alt={item.title}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 filter brightness-95 group-hover:brightness-105"
                        loading="lazy"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity pointer-events-none" />

                    {/* Hover focus frame indicator */}
                    <div className="absolute inset-2 rounded border border-amber-400/0 group-hover:border-amber-400/40 transition-colors pointer-events-none" />

                    {/* Expand icon */}
                    <div className="absolute top-4 right-4 p-2 rounded bg-black/70 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all group-hover:scale-110 shadow-lg border border-white/20">
                      <Maximize2 className="w-4 h-4 text-amber-400" />
                    </div>

                    {/* Metadata Badge */}
                    <div className="absolute top-4 left-4 sound-tag bg-black/80 flex items-center gap-1.5">
                      {isVideoFile(item.image_url) && <Film className="w-3.5 h-3.5 text-amber-400" />}
                      <span>{item.category}</span>
                    </div>

                    {/* Bottom Caption */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-1.5 text-white">
                      <div className="flex items-center gap-2 text-xs font-industrial font-bold uppercase tracking-wider text-amber-400">
                        <span>{item.year}</span>
                        {item.location && (
                          <>
                            <span aria-hidden="true" className="text-white/40">·</span>
                            <span className="flex items-center gap-1 text-white font-medium">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              <span>{item.location}</span>
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-base sm:text-lg leading-snug group-hover:text-amber-300 transition-colors text-white">
                        {item.title}
                      </h3>
                      {item.caption && (
                        <p className="text-xs text-white/90 line-clamp-2 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-normal">
                          {item.caption}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl w-full sound-cabinet rounded border border-neutral-400 dark:border-white/25 overflow-hidden shadow-2xl space-y-4 p-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxItem(null)}
              className="hardware-btn absolute top-4 right-4 p-2 rounded bg-neutral-800 text-white hover:bg-amber-400 hover:text-neutral-950 transition-colors z-10 cursor-pointer"
              aria-label="Close Lightbox"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded overflow-hidden bg-black flex items-center justify-center border border-white/10">
              {isVideoFile(lightboxItem.image_url) ? (
                <video
                  src={lightboxItem.image_url}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <img
                  src={normalizeImageUrl(lightboxItem.image_url)}
                  alt={lightboxItem.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white pt-2 border-t border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-industrial font-bold uppercase tracking-wider text-amber-400">
                  <span>{lightboxItem.category}</span>
                  <span aria-hidden="true" className="text-white/40">·</span>
                  <span>{lightboxItem.year}</span>
                  {lightboxItem.location && (
                    <>
                      <span aria-hidden="true" className="text-white/40">·</span>
                      <span>{lightboxItem.location}</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-display font-black text-white">{lightboxItem.title}</h3>
                {lightboxItem.caption && (
                  <p className="text-xs text-white/90 leading-relaxed max-w-xl font-normal">{lightboxItem.caption}</p>
                )}
              </div>

              <div className="text-[11px] font-industrial text-white/70 shrink-0 self-start sm:self-center font-bold tracking-wider uppercase">
                ARCHIVE REF #GAL-{lightboxItem.id}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
