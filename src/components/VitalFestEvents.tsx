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
      const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
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
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-neutral-800 dark:text-white font-bold">
                  <span className="text-amber-600 dark:text-amber-400 font-bold">02 / SOUND SYSTEM SCHEDULE</span>
                  <span aria-hidden="true" className="opacity-60">·</span>
                  <span className="text-neutral-700 dark:text-white">LIVE RAVES & DATES</span>
                </div>
                <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                  Vital Fest & Live Dates
                </h2>
                <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                  High-octane East London jungle dancefloors, authentic dubplate clashes, and full Vital Fest curated lineups with official event flyers.
                </p>
              </div>

              {/* Interactive Filter Control */}
              <div className="flex items-center gap-1 p-1 bg-neutral-200/80 dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 rounded-xl shrink-0 shadow-md self-start md:self-auto">
                {(['All', 'Upcoming', 'Past'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                      filter === tab
                        ? 'bg-amber-400 text-neutral-950 shadow-md scale-102'
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
              <div className="text-center py-20 border-2 border-dashed border-neutral-300 dark:border-white/20 rounded-3xl bg-white/70 dark:bg-neutral-900/60 text-neutral-900 dark:text-white text-sm space-y-2">
                <CalendarDays className="w-8 h-8 mx-auto text-amber-500 dark:text-amber-400 opacity-80" />
                <p className="font-bold text-neutral-900 dark:text-white">No events matching this filter currently.</p>
                <p className="text-xs text-neutral-600 dark:text-white/80">New Vital Fest announcements will appear here automatically.</p>
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
                      className={`group hover-glass-sheen relative rounded-3xl transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1.5 h-full overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-amber-400/40 before:to-transparent ${
                        isUpcoming
                          ? 'border border-amber-400/60 dark:border-amber-400/40 glass-panel-amber hover:border-amber-400 shadow-[0_8px_35px_rgba(245,158,11,0.12)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.7)]'
                          : 'border border-neutral-200 dark:border-white/10 glass-panel hover:border-neutral-300 dark:hover:border-white/20'
                      }`}
                    >
                      {/* Ambient Glow Sweep on Hover */}
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

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
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/30 text-white text-[11px] font-mono font-bold hover:bg-amber-400 hover:text-neutral-950 transition-colors cursor-pointer shadow-lg"
                          title="View Full-Size Show Flyer"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Flyer</span>
                        </button>

                        {/* Date badge on top of flyer */}
                        <div className="absolute bottom-3 left-4 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-amber-400 text-neutral-950 flex flex-col items-center justify-center font-bold shadow-lg">
                            <span className="text-[10px] font-mono uppercase tracking-wider leading-none">
                              {month}
                            </span>
                            <span className="text-xl font-display font-black leading-tight mt-0.5">
                              {day}
                            </span>
                          </div>
                          <div className="text-white text-xs font-mono drop-shadow-md">
                            <div className="font-bold flex items-center gap-1.5 text-white">
                              <span>{year}</span>
                              {evt.start_time && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-white">{evt.start_time}</span>
                                </>
                              )}
                            </div>
                            <div className="text-amber-300 font-bold">{evt.price_text}</div>
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
                            <span className="shrink-0 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-300 dark:bg-white/10 dark:text-white dark:border-white/20">
                              {evt.status}
                            </span>
                          </div>

                          {/* Venue & Location */}
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-700 dark:text-white font-medium">
                            <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                            <span className="font-bold text-neutral-900 dark:text-white">{evt.venue}</span>
                            <span aria-hidden="true" className="text-neutral-400 dark:text-white/60">/</span>
                            <span className="truncate text-neutral-600 dark:text-white/90">{evt.location}</span>
                          </div>

                          {/* Lineup Highlights */}
                          <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-1.5">
                            <div className="text-[11px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 font-bold">
                              <Users className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              <span>Confirmed Lineup & Hosts</span>
                            </div>
                            <p className="text-xs sm:text-sm text-neutral-700 dark:text-white leading-relaxed font-normal">
                              {evt.lineup}
                            </p>
                          </div>
                        </div>

                        {/* Footer Action */}
                        <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-neutral-500 dark:text-white/70 font-bold">
                            ARCHIVE REF #{evt.id}
                          </span>

                          <a
                            href={evt.ticket_url || 'https://djital.me/vitalfest'}
                            target="_blank"
                            rel="noreferrer"
                            className="group/btn hover-shimmer flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-all shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer hover:scale-102"
                          >
                            <Ticket className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
                            <span>Tickets & Entry</span>
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
                <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-600 dark:text-amber-400 font-bold">
                  <Quote className="w-4 h-4" />
                  <span>SOCIAL PROOF & ACCREDITATIONS</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight">
                  Venue & Promoter Testimonials
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-white/90 max-w-xl font-normal">
                  Word from festival organizers, venue managers, and music historians who have booked DJ Ital.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {testimonials.map((t, idx) => (
                <ScrollReveal key={t.id} variant="fade-up" delay={idx * 80}>
                  <div className="p-6 rounded-2xl glass-card hover-glass-sheen shadow-xl flex flex-col justify-between h-full space-y-4 text-neutral-900 dark:text-white">
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

                    <div className="pt-3 border-t border-neutral-200 dark:border-white/10">
                      <div className="text-xs font-display font-bold text-neutral-950 dark:text-white">
                        {t.author_name}
                      </div>
                      <div className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
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
                <div className="text-xs font-mono font-bold tracking-widest uppercase text-amber-600 dark:text-amber-400">
                  TOP SPOTS, FESTIVALS & INSTITUTIONS PLAYED
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" delay={100}>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {venueLogos.map((v) => (
                  <div
                    key={v.id}
                    className="px-5 py-3 rounded-2xl glass-card hover-shimmer flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-neutral-900 dark:text-white hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors shadow-sm"
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
            className="relative max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20 bg-neutral-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 text-white">
              <span className="text-xs font-mono font-bold truncate pr-4 text-white">
                {enlargedFlyer.title} — Official Event Flyer
              </span>
              <button
                onClick={() => setEnlargedFlyer(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-2">
              <img
                src={enlargedFlyer.image}
                alt={enlargedFlyer.title}
                className="w-full h-auto rounded-2xl object-contain max-h-[78vh]"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
