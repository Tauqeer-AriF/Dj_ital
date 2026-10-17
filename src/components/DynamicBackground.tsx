import React, { useState, useEffect, useMemo } from 'react';
import { normalizeImageUrl } from '../utils/imageOptimization';

export interface DynamicBackgroundProps {
  style?: string; // 'subtle-motion' | 'particles' | 'ambient-glow' | 'slideshow' | 'minimal' | 'soundwave' | 'dub-sonar' | 'hybrid'
  speed?: string; // 'slow' | 'medium' | 'fast'
  slideshowEnabled?: boolean;
  slideshowInterval?: number; // seconds
  slideshowImages?: string[] | string;
  signatureBpm?: number;
}

export const ARCHIVAL_SLIDESHOW_PRESETS = [
  '/images/dj_ital_hero_1790112374509.jpg',
  '/images/vital_fest_crowd_1790112387611.jpg',
  '/images/kool_fm_vintage_1790112400005.jpg',
  '/images/va_museum_exhibition_1790112416279.jpg',
  '/images/hackney_pirate_radio_1790113898507.jpg',
  '/images/vinyl_dubplate_acetate_1790113879360.jpg',
];

export function sanitizeSlideshowImages(raw?: string[] | string | null): string[] {
  if (!raw) return ARCHIVAL_SLIDESHOW_PRESETS;
  
  let candidates: string[] = [];
  if (Array.isArray(raw)) {
    candidates = raw.map((s) => String(s).trim());
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          candidates = parsed.map((s) => String(s).trim());
        }
      } catch {
        candidates = trimmed.split(',');
      }
    } else {
      candidates = trimmed.split(',');
    }
  }

  const cleaned = candidates
    .map((img) => img.replace(/^[\["'\s]+|["'\]\s]+$/g, '').trim())
    .filter((img) => Boolean(img) && (img.startsWith('/') || img.startsWith('http') || img.startsWith('data:image')));

  return cleaned.length > 0 ? cleaned : ARCHIVAL_SLIDESHOW_PRESETS;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  style = 'subtle-motion',
  speed = 'medium',
  slideshowEnabled = false,
  slideshowInterval = 6,
  slideshowImages,
  signatureBpm = 164,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Normalize style identifier and aliases
  const normalizedStyle = useMemo(() => {
    const s = (style || 'subtle-motion').toLowerCase().trim();
    if (s === 'glow' || s === 'ambient-glow' || s === 'warm-glow') return 'ambient-glow';
    if (s === 'particles' || s === 'particle' || s === 'bass-particles') return 'particles';
    if (s === 'slideshow' || s === 'photos' || s === 'slide') return 'slideshow';
    if (s === 'minimal' || s === 'static' || s === 'none' || s === 'off') return 'minimal';
    if (s === 'soundwave' || s === 'waves' || s === 'equalizer') return 'soundwave';
    if (s === 'dub-sonar' || s === 'sonar' || s === 'bass-rings' || s === 'radar') return 'dub-sonar';
    if (s === 'hybrid' || s === 'all' || s === 'full') return 'hybrid';
    return 'subtle-motion';
  }, [style]);

  // Clean slideshow images list
  const validImages = useMemo(() => {
    const rawList = sanitizeSlideshowImages(slideshowImages);
    return rawList.map((img) => normalizeImageUrl(img));
  }, [slideshowImages]);

  // Slideshow is active when style is 'slideshow', or enabled alongside non-minimal styles
  const isPrimarySlideshow = normalizedStyle === 'slideshow';
  const isSecondarySlideshow = Boolean(slideshowEnabled) && normalizedStyle !== 'minimal' && !isPrimarySlideshow;
  const isSlideshowRunning = isPrimarySlideshow || isSecondarySlideshow;

  useEffect(() => {
    if (!isSlideshowRunning || validImages.length <= 1) return;
    const intervalMs = Math.max(3, Number(slideshowInterval) || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % validImages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isSlideshowRunning, slideshowInterval, validImages.length]);

  const speedMultiplier = useMemo(() => {
    switch (speed) {
      case 'slow':
        return 1.8;
      case 'fast':
        return 0.55;
      case 'medium':
      default:
        return 1.0;
    }
  }, [speed]);

  const bpmCycleSeconds = Number((240 / (signatureBpm || 164)).toFixed(2));

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{
        WebkitTransform: 'translate3d(0, 0, 0)',
        transform: 'translate3d(0, 0, 0)',
      }}
      aria-hidden="true"
    >
      {/* ============================================================== */}
      {/* STYLE 1: PHOTO SLIDESHOW (Primary or Secondary Underlay)       */}
      {/* ============================================================== */}
      {isSlideshowRunning && validImages.length > 0 && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {validImages.map((img, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <div
                key={img + idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive
                    ? isPrimarySlideshow
                      ? 'opacity-25 dark:opacity-30'
                      : 'opacity-10 dark:opacity-15'
                    : 'opacity-0'
                }`}
                style={{
                  WebkitBackfaceVisibility: 'hidden',
                  backfaceVisibility: 'hidden',
                }}
              >
                <img
                  src={img}
                  alt={`Archival Slide ${idx + 1}`}
                  className={`w-full h-full object-cover filter blur-[1px] brightness-90 contrast-110 ${
                    isActive ? 'animate-ken-burns' : ''
                  }`}
                  loading="lazy"
                />
              </div>
            );
          })}
          {/* Subtle sound-stage vignette to keep foreground typography razor sharp */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 via-neutral-50/40 dark:via-neutral-950/40 to-neutral-50/70 dark:to-neutral-950/70" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-neutral-50/80 dark:to-neutral-950/90" />
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 2: SUBTLE AMBIENT GRADIENT MOTION                       */}
      {/* ============================================================== */}
      {(normalizedStyle === 'subtle-motion' || normalizedStyle === 'hybrid') && (
        <div className="absolute inset-0 z-0">
          {/* Lead Amber Luminous Mesh Orb */}
          <div
            className="absolute -top-24 -left-20 sm:-top-40 sm:-left-40 w-[360px] sm:w-[650px] h-[360px] sm:h-[650px] rounded-full bg-amber-500/22 sm:bg-amber-500/12 dark:bg-amber-400/18 dark:sm:bg-amber-400/10 blur-[75px] sm:blur-[140px] animate-ambient-1"
            style={{
              animationDuration: `${14 * speedMultiplier}s`,
              willChange: 'transform',
            }}
          />

          {/* Electric Cyan Sub-Bass Orb (Mid Right Horizon) */}
          <div
            className="absolute top-1/4 -right-24 sm:top-1/3 sm:-right-40 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] rounded-full bg-cyan-500/20 sm:bg-cyan-500/12 dark:bg-cyan-400/16 dark:sm:bg-cyan-400/8 blur-[70px] sm:blur-[135px] animate-ambient-2"
            style={{
              animationDuration: `${17 * speedMultiplier}s`,
              willChange: 'transform',
            }}
          />

          {/* Deep Dub Harmonic Violet-Amber Orb (Bottom Left) */}
          <div
            className="absolute -bottom-20 left-10 sm:-bottom-40 sm:left-1/4 w-[380px] sm:w-[700px] h-[380px] sm:h-[700px] rounded-full bg-amber-600/18 sm:bg-amber-600/9 dark:bg-amber-500/14 dark:sm:bg-amber-500/8 blur-[80px] sm:blur-[150px] animate-ambient-1"
            style={{
              animationDuration: `${20 * speedMultiplier}s`,
              willChange: 'transform',
            }}
          />

          {/* Flowing Soundwave Horizon Ribbon */}
          <div
            className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[340px] opacity-25 dark:opacity-20 pointer-events-none overflow-hidden animate-ribbon-warp"
            style={{ animationDuration: `${16 * speedMultiplier}s` }}
          >
            <div
              className="w-[200%] h-full bg-gradient-to-r from-amber-500/0 via-amber-400/20 to-cyan-400/0 animate-wave-flow"
              style={{
                animationDuration: `${22 * speedMultiplier}s`,
                filter: 'blur(45px)',
              }}
            />
          </div>

          {/* Subtle Vinyl Dust Micro-Particles (6 subtle ambient flecks) */}
          <div className="absolute inset-0 opacity-40 dark:opacity-60">
            {[...Array(6)].map((_, i) => (
              <span
                key={`subtle-p-${i}`}
                className="absolute rounded-full bg-amber-400/60 animate-particle-drift shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                style={{
                  top: `${(i * 16 + 12) % 90}%`,
                  left: `${(i * 23 + 15) % 90}%`,
                  width: `${(i % 2) * 2 + 3}px`,
                  height: `${(i % 2) * 2 + 3}px`,
                  animationDuration: `${(8 + (i % 3) * 3) * speedMultiplier}s`,
                  animationDelay: `${i * 1.1}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 3: WARM SOUND SYSTEM GLOW & SUBWOOFER PULSE              */}
      {/* ============================================================== */}
      {(normalizedStyle === 'ambient-glow' || normalizedStyle === 'hybrid') && (
        <div className="absolute inset-0 z-0">
          {/* Centered Massive Sound System Tube-Amp Warm Glow */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[850px] h-[420px] sm:h-[850px] rounded-full bg-gradient-to-b from-amber-500/24 via-amber-600/14 to-transparent dark:from-amber-400/18 dark:via-amber-500/8 blur-[90px] sm:blur-[160px] animate-ambient-1"
            style={{
              animationDuration: `${16 * speedMultiplier}s`,
              WebkitTransform: 'translate3d(-50%, -50%, 0)',
              transform: 'translate3d(-50%, -50%, 0)',
            }}
          />

          {/* Signature 164 BPM Subwoofer Heartbeat Pulse */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[580px] h-[300px] sm:h-[580px] rounded-full bg-amber-500/16 dark:bg-amber-400/12 blur-[65px] sm:blur-[120px] animate-subwoofer"
            style={{
              animationDuration: `${bpmCycleSeconds * speedMultiplier}s`,
              WebkitTransform: 'translate3d(-50%, -50%, 0)',
              transform: 'translate3d(-50%, -50%, 0)',
            }}
          />

          {/* Deep Golden Bass Perimeter Vignette */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-amber-950/5 dark:via-amber-950/15 to-transparent pointer-events-none" />
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 4: FLOATING BASS PARTICLES                               */}
      {/* ============================================================== */}
      {(normalizedStyle === 'particles' || normalizedStyle === 'hybrid') && (
        <div className="absolute inset-0 opacity-70 dark:opacity-85 z-0">
          {[...Array(28)].map((_, i) => {
            const size = (i % 4) * 2 + 3; // 3px, 5px, 7px, 9px
            const isCyanAccent = i % 7 === 0;
            return (
              <span
                key={`bass-p-${i}`}
                className={`absolute rounded-full animate-particle-drift ${
                  isCyanAccent
                    ? 'bg-cyan-400/70 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                    : 'bg-amber-400/65 shadow-[0_0_10px_rgba(251,191,36,0.65)]'
                }`}
                style={{
                  top: `${(i * 13 + 7) % 94}%`,
                  left: `${(i * 19 + 5) % 96}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  animationDuration: `${(5.5 + (i % 6) * 1.8) * speedMultiplier}s`,
                  animationDelay: `${(i % 7) * 0.6}s`,
                  willChange: 'transform, opacity',
                }}
              />
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 5: DYNAMIC EQUALIZER & SOUNDWAVE RIBBONS                 */}
      {/* ============================================================== */}
      {(normalizedStyle === 'soundwave' || normalizedStyle === 'hybrid') && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Top Soundwave Frequency Ribbon */}
          <div
            className="absolute top-[22%] left-0 right-0 h-44 opacity-20 dark:opacity-25 animate-ribbon-warp"
            style={{ animationDuration: `${12 * speedMultiplier}s` }}
          >
            <div
              className="w-[240%] h-full bg-gradient-to-r from-amber-500/0 via-amber-400/40 via-cyan-400/30 to-amber-500/0 animate-wave-flow"
              style={{
                animationDuration: `${18 * speedMultiplier}s`,
                filter: 'blur(35px)',
              }}
            />
          </div>

          {/* Lower Bass Sub-Frequency Wave Ribbon */}
          <div
            className="absolute bottom-[20%] left-0 right-0 h-56 opacity-25 dark:opacity-30 animate-ribbon-warp"
            style={{
              animationDuration: `${15 * speedMultiplier}s`,
              animationDirection: 'reverse',
            }}
          >
            <div
              className="w-[240%] h-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/35 via-amber-400/40 to-cyan-500/0 animate-wave-flow"
              style={{
                animationDuration: `${24 * speedMultiplier}s`,
                filter: 'blur(45px)',
              }}
            />
          </div>

          {/* Acoustic Frequency Mesh Lines */}
          <div className="absolute inset-0 bg-studio-grid opacity-30 dark:opacity-40" />
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 6: CONCENTRIC BASS SONAR / TURNTABLE RADAR RINGS         */}
      {/* ============================================================== */}
      {normalizedStyle === 'dub-sonar' && (
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          {/* Central Speaker Driver Core */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full bg-amber-500/25 dark:bg-amber-400/18 blur-[45px] animate-subwoofer"
            style={{
              animationDuration: `${bpmCycleSeconds * speedMultiplier}s`,
            }}
          />

          {/* 4 Staggered Expanding Acoustic Rings */}
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={`sonar-ring-${idx}`}
              className="absolute top-1/2 left-1/2 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] rounded-full border-2 border-amber-400/40 dark:border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.3)] animate-sonar-ring"
              style={{
                animationDuration: `${4.5 * speedMultiplier}s`,
                animationDelay: `${idx * 1.12}s`,
              }}
            />
          ))}

          {/* Faint Turntable Vinyl Grooves Backdrop */}
          <div className="absolute inset-0 bg-vinyl-grooves opacity-35 dark:opacity-50" />
        </div>
      )}

      {/* ============================================================== */}
      {/* STYLE 7: MINIMAL STATIC STUDIO GRID & ACOUSTIC MATRIX          */}
      {/* ============================================================== */}
      {normalizedStyle === 'minimal' && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Sound Studio Engineering Grid Matrix */}
          <div className="absolute inset-0 bg-studio-grid opacity-75 dark:opacity-85" />
          {/* Acoustic Dot Matrix Texture */}
          <div className="absolute inset-0 bg-acoustic-dots opacity-40 dark:opacity-35" />
          {/* Faint Vignette Perimeter */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50/80 dark:from-neutral-950/80 via-transparent to-neutral-50/80 dark:to-neutral-950/80" />
        </div>
      )}
    </div>
  );
};
