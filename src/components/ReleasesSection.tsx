import React from 'react';
import { Play, Pause, Disc3, Radio, Music, ExternalLink } from 'lucide-react';
import { ReleaseData } from '../db/sqlite';
import { ActiveTrack } from '../types';
import { ScrollReveal } from './ScrollReveal';

interface ReleasesSectionProps {
  releases: ReleaseData[];
  activeTrack: ActiveTrack | null;
  isPlaying: boolean;
  onPlayTrack: (release: ReleaseData) => void;
  onTogglePlay: () => void;
  logoUrl?: string;
}

export const ReleasesSection: React.FC<ReleasesSectionProps> = ({
  releases,
  activeTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  logoUrl,
}) => {
  const activeLogo = logoUrl || '/images/vital_fest_logo.png';
  return (
    <section id="releases" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
                <span className="sound-badge">[ DUBPLATE CATALOGUE // 168 BPM ACETATE ]</span>
                <span aria-hidden="true" className="opacity-60">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">HISTORIC PRESSINGS & VIP DUBS</span>
              </div>
              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                Releases & Audio Transmissions
              </h2>
              <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base font-normal leading-relaxed">
                From seminal 1990s pirate radio dubplates to official anniversary pressings. Click play on any release to audition the interactive Web Audio procedural jungle synthesiser.
              </p>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded sound-card text-xs font-industrial text-neutral-900 dark:text-white font-black uppercase tracking-wider shrink-0 shadow-sm self-start md:self-auto">
              <Radio className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-pulse" />
              <span>160 — 172 BPM JUNGLE CLOCK</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Releases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {releases.map((rel, idx) => {
            const isCurrent = activeTrack?.id === rel.id;
            const trackActiveAndPlaying = isCurrent && isPlaying;

            return (
              <ScrollReveal
                key={rel.id}
                variant="fade-up"
                delay={idx * 100}
              >
                <div
                  className={`p-6 sm:p-8 rounded sound-cabinet transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 h-full text-neutral-900 dark:text-white group relative overflow-hidden ${
                    isCurrent
                      ? 'border border-amber-500 dark:border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/50'
                      : 'border border-neutral-300 dark:border-white/10 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      {/* Vinyl Sleeve & Rotating Dubplate Preview */}
                      <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded bg-neutral-950 border border-neutral-300 dark:border-white/15 p-1 flex items-center justify-center shrink-0 shadow-lg overflow-hidden group/disc transition-transform ${trackActiveAndPlaying ? 'scale-105 animate-subwoofer' : 'group-hover/disc:scale-105'}`}>
                        {/* Realistic Vinyl Grooves */}
                        <div
                          className={`w-full h-full rounded-full relative flex items-center justify-center shadow-inner ${
                            trackActiveAndPlaying ? 'animate-spin-vinyl' : ''
                          }`}
                          style={{
                            background: `
                              radial-gradient(circle, #1c1c20 0%, #1c1c20 28%, #141416 29%, #141416 35%, 
                              #25252b 36%, #141416 48%, #2a2a32 49%, #141416 65%, 
                              #202025 66%, #101012 85%, #202025 86%, #0a0a0c 100%)
                            `,
                          }}
                        >
                          {/* Center Vinyl Label with Vital Fest Logo */}
                          <div className="w-8 h-8 rounded-full bg-neutral-900 border border-amber-400/50 flex items-center justify-center p-0.5 text-center shadow-inner">
                            <img
                              src={activeLogo}
                              alt="Vital Fest"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                              }}
                              className="w-5 h-5 object-contain"
                            />
                          </div>
                        </div>

                        {/* Play trigger overlay on vinyl */}
                        <button
                          onClick={() => {
                            if (isCurrent) {
                              onTogglePlay();
                            } else {
                              onPlayTrack(rel);
                            }
                          }}
                          className={`hardware-btn absolute inset-0 m-auto w-10 h-10 rounded flex items-center justify-center shadow-lg transition-all cursor-pointer ${
                            trackActiveAndPlaying
                              ? 'bg-amber-400 text-neutral-950 scale-105 shadow-amber-400/50'
                              : 'bg-black/85 hover:bg-amber-400 text-white hover:text-neutral-950 hover:scale-105'
                          }`}
                          aria-label={trackActiveAndPlaying ? 'Pause dub' : 'Play dub'}
                        >
                          {trackActiveAndPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                      </div>

                      {/* Metadata & Title */}
                      <div className="space-y-1.5 min-w-0 flex-1 font-industrial">
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-800 dark:text-white font-black uppercase tracking-wider">
                          <span className="text-amber-600 dark:text-amber-400 tabular-nums">{rel.release_year}</span>
                          <span aria-hidden="true" className="opacity-60">·</span>
                          <span className="text-neutral-700 dark:text-white">{rel.format}</span>
                          <span aria-hidden="true" className="opacity-60">·</span>
                          <span className="tabular-nums text-amber-600 dark:text-amber-300">{rel.bpm} BPM</span>
                        </div>

                        <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white leading-tight break-words">
                          {rel.title}
                        </h3>

                        <div className="text-xs text-neutral-600 dark:text-white/80 truncate font-bold uppercase tracking-wider">
                          {rel.label} {rel.catalog_number ? `· ${rel.catalog_number}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                      {rel.description}
                    </p>

                    {/* Sound Theme Breakdown */}
                    {rel.audio_theme && (
                      <div className="p-3 rounded sound-card border border-neutral-300 dark:border-white/10 text-xs text-neutral-800 dark:text-white flex items-start gap-2.5 font-medium">
                        <Music className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 ${trackActiveAndPlaying ? 'animate-bounce' : ''}`} />
                        <span className="leading-snug break-words font-industrial font-bold uppercase text-[11px] tracking-wide">{rel.audio_theme}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer status bar */}
                  <div className="mt-5 pt-3.5 border-t border-neutral-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-industrial text-neutral-800 dark:text-white">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <img
                        src={activeLogo}
                        alt="Vital Fest"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                        }}
                        className="w-4 h-4 object-contain shrink-0 filter drop-shadow-[0_1px_4px_rgba(245,158,11,0.5)]"
                      />
                      <span className="font-black uppercase tracking-wider truncate text-[11px] sm:text-xs text-neutral-800 dark:text-white">
                        {trackActiveAndPlaying ? 'Synthesiser Active · 168 BPM' : 'Click to Audition Dub'}
                      </span>
                      {trackActiveAndPlaying && (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-none eq-bar-1" />
                          <span className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-none eq-bar-2" />
                          <span className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-none eq-bar-3" />
                          <span className="w-0.5 bg-amber-500 dark:bg-amber-400 rounded-none eq-bar-4" />
                        </div>
                      )}
                    </div>

                    <a
                      href={rel.stream_url || 'https://djital.me'}
                      target="_blank"
                      rel="noreferrer"
                      className="group/link hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1 font-black uppercase tracking-wider shrink-0 text-[11px] sm:text-xs text-neutral-700 dark:text-white/90"
                    >
                      <span>Archive Catalogue</span>
                      <ExternalLink className="w-3 h-3 text-amber-500 dark:text-amber-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

      </div>
    </section>
  );
};
