import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Play,
  Pause,
  ArrowUpRight,
  Sparkles,
  FileText,
} from 'lucide-react';
import { ProfileData, StatData, EventData } from '../db/sqlite';
import { ActiveTrack } from '../types';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

interface HeroProps {
  profile: ProfileData | null;
  stats: StatData[];
  nextEvent: EventData | null;
  onPlayTrack: () => void;
  isPlaying?: boolean;
  activeTrack?: ActiveTrack | null;
  heroImage?: string;
  onOpenEpk?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  profile,
  stats,
  nextEvent,
  onPlayTrack,
  isPlaying = false,
  activeTrack = null,
  heroImage = '/images/dj_ital_hero_1790112374509.jpg',
  onOpenEpk,
}) => {
  const [stepTick, setStepTick] = useState<number>(0);
  const resolvedHeroImage = normalizeImageUrl(heroImage);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setStepTick((prev) => (prev + 1) % 16);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const genres =
    profile?.genres || 'Jungle · Drum & Bass · Reggae · Dub · UK Bass';
  const regionsCovered =
    profile?.regions_covered || 'UK, Europe & International / Worldwide';
  const tagline =
    profile?.tagline ||
    'London-based International DJ, Jungle Drum & Bass Pioneer, Producer & Founder of Vital Fest';
  const liveStreamUrl = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
  const hasStream = Boolean(liveStreamUrl);
  const isLiveOnAir = Boolean(profile?.is_live_on_air);
  const logoSrc = profile?.logo_url || profile?.epk_logo_png || '/images/vital_fest_logo.png';

  return (
    <section className="relative overflow-hidden pt-16 sm:pt-[72px] pb-12 sm:pb-16 md:pb-20 transition-colors duration-200">
      {/* Ambient sound system glow */}
      <div
        style={{ backgroundColor: 'var(--accent-subtle)' }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[700px] h-[340px] sm:h-[400px] blur-[120px] sm:blur-[160px] rounded-full pointer-events-none transition-colors duration-500"
      />
      <div className="absolute top-1/3 right-4 sm:right-10 w-[240px] sm:w-[450px] h-[240px] sm:h-[350px] bg-cyan-500/10 blur-[100px] sm:blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Live on Air Broadcast Banner */}
        {isLiveOnAir && (
          <ScrollReveal variant="fade-down" className="mb-4 sm:mb-6">
            <div className="p-3.5 rounded sound-cabinet border border-red-500/50 flex items-center justify-between text-xs shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-none bg-red-500 animate-ping shrink-0" />
                <span className="font-industrial font-black text-red-600 dark:text-red-300 uppercase tracking-wider">
                  [ LIVE ON AIR TRANSMISSION ]
                </span>
                <span className="font-display font-black text-neutral-950 dark:text-white truncate">
                  {profile?.live_show_title || 'DJ Ital Live Radio Broadcast'}
                </span>
              </div>
              <button
                type="button"
                onClick={onPlayTrack}
                className="hardware-btn flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 text-white text-[11px] font-industrial font-black shrink-0 hover:bg-red-500 transition-colors shadow-md"
              >
                <span>{isPlaying ? 'STREAMING LIVE' : 'LISTEN LIVE'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </ScrollReveal>
        )}

        {/* ========================================================================= */}
        {/* MOBILE VIEWPORT (< lg)                                                    */}
        {/* ========================================================================= */}
        <div className="block lg:hidden space-y-6">
          
          {/* Editorial Kicker (Hidden on mobile viewport per user request, visible on tablet/sm if needed or hidden entirely on mobile < sm) */}
          <ScrollReveal variant="fade-down" delay={50} className="hidden sm:block">
            <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
              <span className={`w-2 h-2 ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="sound-tag">EAST LONDON SOUND SYSTEM</span>
              <span aria-hidden="true" className="opacity-60">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">1991–2026</span>
              <span aria-hidden="true" className="opacity-60">·</span>
              <span className="text-cyan-600 dark:text-cyan-300 font-bold">V&A RECOGNISED</span>
            </div>
          </ScrollReveal>

          {/* Monumental Headline */}
          <ScrollReveal variant="fade-up" delay={100}>
            <div className="space-y-3">
              <h1 className="text-5xl sm:text-6xl font-display font-black tracking-wider text-neutral-950 dark:text-white uppercase leading-[0.9] select-none">
                {profile?.stage_name || 'DJ ITAL'}
              </h1>
              
              {/* Upfront Tagline */}
              <p className="text-base sm:text-lg font-industrial font-bold text-amber-600 dark:text-amber-400 leading-snug uppercase tracking-wide">
                {tagline}
              </p>

              {/* Upfront Genres & Coverage Badges (Zero Pills) */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-industrial font-bold uppercase">
                <span className="px-2.5 py-1 rounded-none bg-neutral-200/80 dark:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/15 shadow-sm">
                  {genres}
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent-primary)',
                    borderColor: 'var(--accent-focus)',
                  }}
                  className="px-2.5 py-1 rounded-none border shadow-sm transition-colors"
                >
                  {regionsCovered}
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Cinematic Dubplate Showcase Card */}
          <ScrollReveal variant="scale-up" delay={150}>
            <div className={`relative rounded sound-cabinet overflow-hidden shadow-2xl transition-all duration-500 ${isPlaying ? 'ring-2 ring-amber-400/50 shadow-[0_0_40px_rgba(251,191,36,0.3)]' : ''}`}>
              <div className="relative aspect-[16/11] overflow-hidden group">
                <img
                  src={resolvedHeroImage}
                  alt="DJ Ital at the Technics turntables"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className={`w-full h-full object-cover object-center filter brightness-95 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded bg-black/90 backdrop-blur-md border border-white/20 text-[10px] font-industrial text-white font-bold uppercase">
                  <span className={`w-2 h-2 ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                  <span>
                    {isPlaying
                      ? (hasStream ? 'LIVE AUDIO STREAM ACTIVE' : '168 BPM LIVE AUDIO')
                      : (hasStream ? 'LIVE STREAM READY' : 'TECHNICS 1210 MK2')}
                  </span>
                </div>

                {/* Vital Fest Official Interactive Logo / Audio Trigger */}
                <button
                  type="button"
                  onClick={onPlayTrack}
                  aria-label={isPlaying ? 'Pause audio' : 'Play dubplate'}
                  className={`absolute right-4 bottom-4 w-28 h-28 rounded p-2 bg-neutral-950/95 border-2 border-amber-400 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 group hover:scale-105 ${
                    isPlaying ? 'shadow-[0_0_30px_rgba(251,191,36,0.6)] ring-2 ring-amber-400' : ''
                  }`}
                >
                  <img
                    src={logoSrc}
                    alt="Vital Fest Logo"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                    }}
                    className={`w-16 h-16 object-contain filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)] ${
                      isPlaying ? 'scale-105' : 'group-hover:scale-105'
                    } transition-transform`}
                  />
                  <div className="flex items-center gap-1 mt-1 text-[9px] font-industrial font-bold text-amber-400 uppercase tracking-widest">
                    {isPlaying ? (
                      <>
                        <Pause className="w-2.5 h-2.5 fill-current" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{hasStream ? 'STREAM' : 'PLAY VIP'}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Console Tray */}
              <div className="p-4 space-y-2 border-t border-neutral-200 dark:border-white/15 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white">
                <div className="flex items-center justify-between text-xs font-industrial">
                  <span className="text-neutral-600 dark:text-white/90 text-[10px] uppercase font-bold">
                    {hasStream ? 'LIVE STREAM FEED:' : 'CURRENT DUBPLATE:'}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-[10px]">
                    {hasStream ? 'RADIO CAST' : '168 BPM'}
                  </span>
                </div>
                <div className="font-display font-black text-sm truncate text-neutral-900 dark:text-white">
                  {activeTrack ? activeTrack.title : (hasStream ? (profile?.live_show_title ? `${profile.live_show_title} (Live Feed)` : 'DJ Ital Live Stream Transmission') : 'Decibel (Original 1995 Dubplate)')}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Short Skimmable Bio Highlights Grid */}
          <ScrollReveal variant="fade-up" delay={200}>
            <div className="p-5 rounded sound-cabinet text-neutral-900 dark:text-white space-y-3 shadow-xl">
              <div className="text-xs font-industrial font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Artist Credentials & Lineage
              </div>
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                {profile?.bio_short ||
                  'DJ Ital (born 1968, Hackney, London) is a British DJ, producer, and event promoter. A pioneer of the jungle music genre, he is best known for his work with the influential pirate radio station Kool FM and as the founder of Vital Fest. In April 2026, his historical importance to British music was officially recognised by the Victoria and Albert Museum (V&A East: The Music is Black).'}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-industrial">
                <div className="p-2.5 rounded bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/20">
                  <strong className="text-amber-600 dark:text-amber-400 block font-bold">V&A East Museum</strong>
                  <span className="text-neutral-800 dark:text-white font-medium">Archival Honouree</span>
                </div>
                <div className="p-2.5 rounded bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/20">
                  <strong className="text-amber-600 dark:text-amber-400 block font-bold">Radio Residency</strong>
                  <span className="text-neutral-800 dark:text-white font-medium">Dejavu FM & Kool FM</span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Mobile Buttons Hub */}
          <ScrollReveal variant="fade-up" delay={250}>
            <div className="flex flex-col gap-2.5">
              <a
                href="#booking"
                className="hardware-btn w-full py-3.5 rounded bg-amber-400 text-neutral-950 font-industrial font-black text-center text-xs uppercase tracking-wider shadow-lg active:scale-98"
              >
                Direct Promoter Booking
              </a>
              {onOpenEpk && (
                <button
                  type="button"
                  onClick={onOpenEpk}
                  className="hardware-btn w-full py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white font-industrial font-black text-center text-xs uppercase tracking-wider"
                >
                  View EPK Press Kit
                </button>
              )}
            </div>
          </ScrollReveal>
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEWPORT (lg+)                                                    */}
        {/* ========================================================================= */}
        <div className="hidden lg:grid grid-cols-12 gap-8 xl:gap-12 items-center">
          
          {/* Left Column: Towering Typography & Upfront Lineage */}
          <div className="col-span-7 space-y-5 xl:space-y-6">
            
            {/* Sound System Lineage Kicker */}
            <ScrollReveal variant="fade-down" delay={50}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-industrial tracking-widest uppercase text-neutral-800 dark:text-white font-bold">
                <span className="sound-tag">EAST LONDON SOUND SYSTEM</span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="text-amber-500 font-bold">EST. 1991 — 2026</span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="text-cyan-600 dark:text-cyan-300 font-bold">V&A MUSEUM RECOGNISED</span>
              </div>
            </ScrollReveal>

            {/* Monumental Headline */}
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="space-y-3">
                <h1 className="text-7xl xl:text-8xl font-display font-black tracking-wider text-neutral-950 dark:text-white uppercase leading-[0.92] select-none">
                  {profile?.stage_name || 'DJ ITAL'}
                </h1>
                
                {/* Upfront Tagline */}
                <p className="text-xl xl:text-2xl font-industrial font-bold text-amber-600 dark:text-amber-400 leading-snug uppercase tracking-wide max-w-xl">
                  {tagline}
                </p>

                {/* Upfront Genres and Regions Covered (Zero Pills) */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-industrial font-bold uppercase">
                  <span className="px-3 py-1 rounded-sm bg-neutral-200/80 dark:bg-white/10 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/15 shadow-sm">
                    {genres}
                  </span>
                  <span
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      color: 'var(--accent-primary)',
                      borderColor: 'var(--accent-focus)',
                    }}
                    className="px-3 py-1 rounded-sm border shadow-sm transition-colors"
                  >
                    {regionsCovered}
                  </span>
                </div>
              </div>
            </ScrollReveal>

            {/* Short Skimmable Bio Box - Sound Cabinet Style */}
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="p-6 rounded-lg sound-cabinet text-neutral-900 dark:text-white shadow-xl space-y-3 max-w-xl transition-all">
                <div className="text-xs font-industrial font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  BIOGRAPHY & HERITAGE
                </div>
                <p className="text-sm text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                  {profile?.bio_short ||
                    'London-based international jungle and drum and bass record producer, radio host and founder of Vital Fest. Core pioneer of pirate radio station Kool FM 94.5 and producer of the mid-90s anthem "Decibel". In April 2026, officially recognised by the Victoria and Albert Museum (V&A East: The Music is Black).'}
                </p>

                {/* Key venues, festivals, radio slots badge highlights */}
                <div className="pt-3 border-t border-neutral-200 dark:border-white/10 grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="space-y-0.5">
                    <span className="text-amber-600 dark:text-amber-400 uppercase text-[10px] font-bold block">Key Venues & Fest:</span>
                    <span className="text-neutral-900 dark:text-white font-bold text-[11px] truncate block">
                      {profile?.key_venues || 'The Hackney Social, Bar A Bar, Fabric, LVLS Hackney Wick'}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-amber-600 dark:text-amber-400 uppercase text-[10px] font-bold block">Broadcast Slots:</span>
                    <span className="text-neutral-900 dark:text-white font-bold text-[11px] truncate block">
                      {profile?.radio_show || 'The Ital Show on Dejavu FM'}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Action Hub */}
            <ScrollReveal variant="fade-up" delay={200}>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={onPlayTrack}
                  className="hardware-btn group relative flex items-center gap-3.5 px-6 py-4 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial font-black transition-all duration-200 shadow-xl active:scale-98 cursor-pointer overflow-hidden hover:scale-102"
                >
                  <div className={`w-8 h-8 rounded bg-neutral-950 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${isPlaying ? 'animate-subwoofer' : ''}`}>
                    {isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-industrial font-black tracking-wider uppercase opacity-85 flex items-center gap-1.5">
                      <span>
                        {isPlaying
                          ? 'NOW TRANSMITTING'
                          : hasStream
                          ? 'LIVE RADIO FEED'
                          : 'INSTANT AUDITION'}
                      </span>
                    </div>
                    <div className="text-sm font-display font-black tracking-wide truncate max-w-[180px]">
                      {activeTrack
                        ? activeTrack.title
                        : hasStream
                        ? (profile?.live_show_title || 'DJ Ital Live Stream Transmission')
                        : 'Play "Decibel" (1995)'}
                    </div>
                  </div>
                </button>

                <a
                  href="#booking"
                  className="hardware-btn flex items-center gap-2 px-5 py-4 rounded bg-neutral-900 text-white hover:bg-amber-400 hover:text-neutral-950 dark:bg-white dark:text-neutral-950 dark:hover:bg-amber-400 text-xs font-industrial font-black tracking-wider transition-all shadow-md cursor-pointer"
                >
                  <span>BOOK SELECTOR</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                {onOpenEpk && (
                  <button
                    type="button"
                    onClick={onOpenEpk}
                    className="hardware-btn flex items-center gap-2 px-5 py-4 rounded border border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-neutral-950 text-xs font-industrial font-black tracking-wider transition-all cursor-pointer shadow-sm"
                  >
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:text-neutral-950 transition-colors" />
                    <span>EPK DOSSIER</span>
                  </button>
                )}
              </div>
            </ScrollReveal>

            {/* Metrics Strip */}
            <ScrollReveal variant="fade-up" delay={250}>
              <div className="pt-6 border-t border-neutral-200 dark:border-white/15 grid grid-cols-4 gap-6">
                {stats.map((s, idx) => (
                  <div key={s.id} className="space-y-1 relative">
                    {idx > 0 && (
                      <div className="block absolute -left-3 top-2 bottom-2 w-px bg-neutral-300 dark:border-white/15" />
                    )}
                    <div className="text-3xl xl:text-4xl font-display font-black text-neutral-950 dark:text-white tabular-nums tracking-tight">
                      {s.value}
                      <span className="text-amber-600 dark:text-amber-400 text-xl ml-0.5">{s.suffix}</span>
                    </div>
                    <div className="text-[11px] font-industrial text-neutral-600 dark:text-white/90 font-bold uppercase tracking-wider leading-snug">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Tactile Technics 1210 Dubplate Console */}
          <div className="col-span-5 relative">
            <ScrollReveal variant="fade-left" delay={150}>
              <div className="rounded sound-cabinet shadow-2xl p-6 space-y-5 transition-all relative overflow-hidden">
                {/* Console Header Bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200 dark:border-white/15 text-xs font-industrial">
                  <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-black tracking-wider">
                    <span className={`w-2 h-2 ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>[ TECHNICS SL-1210 MK2 ]</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-white text-[11px] font-bold">
                    <span className="text-neutral-500 dark:text-white/80">33⅓ / 45 RPM</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold">168 BPM</span>
                  </div>
                </div>

                {/* Photo + Interactive Spinning Vinyl Deck Stack */}
                <div className="relative rounded overflow-hidden aspect-[4/3] bg-neutral-900 group">
                  <img
                    src={resolvedHeroImage}
                    alt="DJ Ital at the vinyl turntables in Hackney studio"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className={`w-full h-full object-cover object-center filter brightness-95 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'group-hover:scale-105'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Vital Fest Official Interactive Logo / Audio Trigger */}
                  <button
                    type="button"
                    onClick={onPlayTrack}
                    className={`absolute right-5 bottom-5 w-36 h-36 rounded p-3 bg-neutral-950/95 border-2 border-amber-400 shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer group/disc transition-transform hover:scale-105 active:scale-95 ${
                      isPlaying ? 'shadow-[0_0_40px_rgba(251,191,36,0.7)] ring-2 ring-amber-400' : ''
                    }`}
                    title={isPlaying ? 'Click to Pause' : 'Click to Play Vital Audio'}
                    aria-label={isPlaying ? 'Pause audio' : 'Play dubplate'}
                  >
                    <img
                      src={logoSrc}
                      alt="Vital Fest Logo"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                      }}
                      className={`w-20 h-20 object-contain filter drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)] ${
                        isPlaying ? 'scale-105' : 'group-hover/disc:scale-105'
                      } transition-transform`}
                    />

                    <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-none bg-amber-400/20 border border-amber-400/50 text-[10px] font-industrial font-black text-amber-300 uppercase tracking-wider">
                      {isPlaying ? (
                        <>
                          <Pause className="w-3 h-3 fill-current" />
                          <span>PAUSE STREAM</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current ml-0.5" />
                          <span>{hasStream ? 'PLAY STREAM' : 'PLAY VITAL'}</span>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Strobe / Live Indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded bg-black/90 backdrop-blur-md border border-white/20 text-white text-xs font-industrial font-bold uppercase">
                    <span className={`w-2 h-2 ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>
                      {isPlaying
                        ? (hasStream ? 'STREAM ACTIVE' : 'AUDIO LIVE')
                        : (hasStream ? 'STREAM ONLINE' : 'TURNTABLE READY')}
                    </span>
                  </div>
                </div>

                {/* Console Control & Metadata Deck */}
                <div className="space-y-3 font-industrial">
                  <div className="flex items-center justify-between text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-bold">
                        {hasStream ? 'LIVE STREAM TRANSMISSION' : 'SELECTED ACETATE DUBPLATE'}
                      </div>
                      <div className="text-sm font-display font-black text-neutral-950 dark:text-white truncate">
                        {activeTrack
                          ? activeTrack.title
                          : hasStream
                          ? (profile?.live_show_title ? `${profile.live_show_title} (Live Feed)` : 'DJ Ital Live Stream Transmission')
                          : 'Decibel (Original 1995 Dubplate)'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onPlayTrack}
                        className="hardware-btn px-3.5 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-industrial font-black tracking-wider transition-colors cursor-pointer border border-neutral-300 dark:border-white/15"
                      >
                        {isPlaying ? 'PAUSE' : 'DROP NEEDLE'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};
