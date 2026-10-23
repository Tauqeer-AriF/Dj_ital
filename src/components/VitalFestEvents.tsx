import React, { useState } from 'react';
import {
  MapPin,
  Ticket,
  Users,
  CalendarDays,
  ArrowUpRight,
  Image as ImageIcon,
  X,
  Star,
  Quote,
  Building2,
} from 'lucide-react';
import { EventData, TestimonialData, VenueLogoData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

interface VitalFestEventsProps {
  events: EventData[];
  testimonials?: TestimonialData[];
  venueLogos?: VenueLogoData[];
}

export const VitalFestEvents: React.FC<VitalFestEventsProps> = ({
  events,
  testimonials = [],
  venueLogos = [],
}) => {
  const [filter, setFilter] = useState<'All' | 'Upcoming' | 'Past'>('All');
  const [enlargedFlyer, setEnlargedFlyer] = useState<{ title: string; image: string } | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filter === 'All') return true;
    return e.status === filter;
  });

  const parseDateParts = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: dateStr.slice(-2), month: 'TBA', year: '' };
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
      const year = d.getFullYear().toString();
      return { day, month, year };
    } catch {
      return { day: '28', month: 'NOV', year: '2026' };
    }
  };

  return (
    <section id="events" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-20 md:space-y-24">
        
        {/* Main Schedule Area */}
        <div>
          {/* Section Header */}
          <ScrollReveal variant="fade-up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
                  <span className="sound-badge">[ VITAL FEST SESSIONS // LIVE DATES ]</span>
                  <span aria-hidden="true" className="opacity-60">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">EAST LONDON SOUND CLASH</span>
                </div>
                <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                  Vital Fest & Live Dates
                </h2>
                <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                  Heavyweight East London jungle sessions, dubplate clashes, and full Vital Fest line-ups with original event flyers.
                </p>
              </div>

              {/* Interactive Segmented Filter Control (Zero Pills) */}
              <div className="sound-filter-group shrink-0 self-start md:self-auto">
                {(['All', 'Upcoming', 'Past'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`sound-filter-tab ${
                      filter === tab
                        ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                        : 'text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <ScrollReveal variant="fade-up">
              <div className="text-center py-20 border border-dashed border-neutral-300 dark:border-white/20 rounded sound-cabinet text-neutral-900 dark:text-white text-sm space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto text-amber-500 dark:text-amber-400 opacity-80" />
                <p className="font-bold text-neutral-900 dark:text-white font-industrial text-base">No events matching this filter currently.</p>
                <p className="text-xs text-neutral-600 dark:text-white/80 font-industrial">New Vital Fest announcements will appear here automatically.</p>
              </div>
            </ScrollReveal>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredEvents.map((evt, idx) => {
                const { day, month, year } = parseDateParts(evt.event_date);
                const isUpcoming = evt.status === 'Upcoming';
                const flyerUrl = normalizeImageUrl(evt.flyer_image || '/images/vital_fest_crowd_1790112387611.jpg');

                return (
                  <ScrollReveal
                    key={evt.id}
                    variant="fade-up"
                    delay={idx * 100}
                  >
                    <div
                      className={`group relative rounded sound-cabinet transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 h-full overflow-hidden ${
                        isUpcoming
                          ? 'border border-amber-500/60 dark:border-amber-400/50 shadow-[0_8px_35px_rgba(245,158,11,0.15)]'
                          : 'border border-neutral-300 dark:border-white/10'
                      }`}
                    >
                      {/* Event Flyer Banner */}
                      <div className="relative aspect-[16/8] sm:aspect-[16/7] overflow-hidden bg-neutral-900 border-b border-neutral-200 dark:border-white/10">
                        <img
                          src={flyerUrl}
                          alt={`${evt.title} Event Flyer`}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95 group-hover:brightness-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                        {/* Click to Enlarge Flyer Trigger */}
                        <button
                          onClick={() => setEnlargedFlyer({ title: evt.title, image: flyerUrl })}
                          className="hardware-btn absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/90 backdrop-blur-md border border-white/30 text-white text-[11px] font-industrial font-bold hover:bg-amber-400 hover:text-neutral-950 transition-colors cursor-pointer shadow-lg"
                          title="View Full-Size Show Flyer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>VIEW FLYER</span>
                        </button>

                        {/* Date badge on top of flyer */}
                        <div className="absolute bottom-3 left-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-amber-400 text-neutral-950 flex flex-col items-center justify-center font-bold shadow-lg">
                            <span className="text-[10px] font-industrial font-black uppercase tracking-wider leading-none">
                              {month}
                            </span>
                            <span className="text-xl font-display font-black leading-tight mt-0.5">
                              {day}
                            </span>
                          </div>
                          <div className="text-white text-xs font-industrial drop-shadow-md">
                            <div className="font-bold flex items-center gap-1.5 text-white">
                              <span>{year}</span>
                              {evt.start_time && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-white">{evt.start_time}</span>
                                </>
                              )}
                            </div>
                            <div className="text-amber-300 font-black">{evt.price_text}</div>
                          </div>
                        </div>
                      </div>

                      {/* Main Card Content */}
                      <div className="p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between text-neutral-900 dark:text-white">
                        <div className="space-y-4">
                          {/* Title & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                              {evt.title}
                            </h3>
                            <span className="shrink-0 sound-tag">
                              {evt.status}
                            </span>
                          </div>

                          {/* Venue & Location */}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 dark:text-white font-medium">
                            <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span className="font-bold text-neutral-900 dark:text-white font-industrial text-sm">{evt.venue}</span>
                            <span aria-hidden="true" className="text-neutral-400 dark:text-white/60">/</span>
                            <span className="truncate text-neutral-600 dark:text-white/90">{evt.location}</span>
                          </div>

                          {/* Lineup Highlights */}
                          <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-1.5">
                            <div className="text-[11px] font-industrial uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-black">
                              <Users className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>CONFIRMED LINEUP & SELECTORS</span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-700 dark:text-white leading-relaxed font-normal">
                              {evt.lineup}
                            </p>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-industrial text-neutral-500 dark:text-white/70 font-bold uppercase tracking-wider">
                            ARCHIVE REF #{evt.id}
                          </span>

                          <a
                            href={evt.ticket_url || 'https://djital.me/vitalfest'}
                            target="_blank"
                            rel="noreferrer"
                            className="hardware-btn group/btn flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-industrial font-black transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <Ticket className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
                            <span>TICKETS & ENTRY</span>
                            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}
        </div>

        {/* Social Proof 1: Promoter & Venue Testimonials */}
        {testimonials.length > 0 && (
          <div className="pt-8 border-t border-neutral-200 dark:border-white/10 space-y-6">
            <ScrollReveal variant="fade-up">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  <Quote className="w-4 h-4" />
                  <span>[ ACCREDITATIONS & TESTIMONIALS ]</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight">
                  Venue & Promoter Endorsements
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-white/90 max-w-xl font-normal">
                  Word from festival organisers, venue managers, and music historians who have booked DJ Ital.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {testimonials.map((t, idx) => (
                <ScrollReveal key={t.id} variant="fade-up" delay={idx * 80}>
                  <div className="p-6 rounded sound-card shadow-xl flex flex-col justify-between h-full space-y-4 text-neutral-900 dark:text-white">
                    <div className="space-y-3">
                      <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                        {[...Array(t.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-white/95 italic leading-relaxed font-normal">
                        "{t.quote}"
                      </p>
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-white/10 font-industrial">
                      <div className="text-xs font-black uppercase text-neutral-950 dark:text-white">
                        {t.author_name}
                      </div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                        {t.role_venue}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        )}

        {/* Social Proof 2: Top Spots & Venues Played */}
        {venueLogos.length > 0 && (
          <div className="pt-8 border-t border-neutral-200 dark:border-white/10 space-y-6">
            <ScrollReveal variant="fade-up">
              <div className="text-center space-y-1">
                <div className="text-xs font-industrial font-black tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  [ TOP CLUBS, FESTIVALS & INSTITUTIONS PLAYED ]
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={100}>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                {venueLogos.map((v) => (
                  <div
                    key={v.id}
                    className="px-4 py-2.5 rounded sound-card flex items-center gap-2 text-xs font-industrial font-bold uppercase tracking-wider text-neutral-900 dark:text-white hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors shadow-sm"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>{v.name}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        )}

      </div>

      {/* Enlarged Flyer Lightbox Modal */}
      {enlargedFlyer && (
        <div
          onClick={() => setEnlargedFlyer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl max-h-[calc(100vh-2rem)] rounded sound-cabinet overflow-hidden border border-neutral-200 dark:border-white/20 bg-white dark:bg-neutral-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white min-w-0">
              <span className="min-w-0 flex-1 text-[10px] sm:text-xs font-industrial font-bold uppercase tracking-wider truncate pr-2 text-neutral-900 dark:text-white">
                {enlargedFlyer.title} — Official Event Flyer
              </span>
              <button
                onClick={() => setEnlargedFlyer(null)}
                className="flex-shrink-0 p-1.5 rounded text-neutral-500 dark:text-white/80 hover:text-neutral-950 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="overflow-auto p-2 bg-neutral-100 dark:bg-neutral-950">
              <img
                src={enlargedFlyer.image}
                alt={enlargedFlyer.title}
                className="w-full h-auto rounded object-contain max-h-[calc(100vh-8rem)]"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
