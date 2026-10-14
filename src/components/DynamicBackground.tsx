import React, { useState, useEffect } from 'react';
import { normalizeImageUrl } from '../utils/imageOptimization';

interface DynamicBackgroundProps {
  style?: string; // 'subtle-motion' | 'particles' | 'ambient-glow' | 'slideshow' | 'minimal'
  speed?: string; // 'slow' | 'medium' | 'fast'
  slideshowEnabled?: boolean;
  slideshowInterval?: number; // seconds
  slideshowImages?: string[];
  signatureBpm?: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  style = 'subtle-motion',
  speed = 'medium',
  slideshowEnabled = false,
  slideshowInterval = 6,
  slideshowImages = [
    '/images/dj_ital_hero_1790112374509.jpg',
    '/images/vital_fest_crowd_1790112387611.jpg',
    '/images/kool_fm_vintage_1790112400005.jpg',
    '/images/va_museum_exhibition_1790112416279.jpg',
  ],
  signatureBpm = 164,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const validImages = (slideshowImages && slideshowImages.length > 0)
    ? slideshowImages.map((img) => normalizeImageUrl(img))
    : [
        '/images/dj_ital_hero_1790112374509.jpg',
        '/images/vital_fest_crowd_1790112387611.jpg',
      ];

  const isSlideshowActive = style === 'slideshow' || slideshowEnabled;

  useEffect(() => {
    if (!isSlideshowActive || validImages.length <= 1) return;
    const intervalMs = Math.max(3, slideshowInterval) * 1000;
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % validImages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isSlideshowActive, slideshowInterval, validImages.length]);

  const speedMultiplier = {
    slow: 1.8,
    medium: 1.0,
    fast: 0.6,
  }[speed] || 1.0;

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
      {/* 1. Hardware Accelerated Moving Gradient Mesh (for subtle-motion and ambient-glow) */}
      {(style === 'subtle-motion' || style === 'ambient-glow') && (
        <>
          {/* Amber Primary Tone Orb (Top Left - drifts across mobile & desktop) */}
          <div
            className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-[340px] sm:w-[600px] h-[340px] sm:h-[600px] rounded-full bg-amber-500/18 sm:bg-amber-500/10 dark:bg-amber-400/15 dark:sm:bg-amber-400/8 blur-[70px] sm:blur-[140px] animate-ambient-1"
            style={{
              animationDuration: `${12 * speedMultiplier}s`,
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          />

          {/* Cyan Sub-bass Tone Orb (Mid Right) */}
          <div
            className="absolute top-1/4 -right-20 sm:top-1/3 sm:-right-40 w-[320px] sm:w-[550px] h-[320px] sm:h-[550px] rounded-full bg-cyan-500/18 sm:bg-cyan-500/10 dark:bg-cyan-400/14 dark:sm:bg-cyan-400/7 blur-[65px] sm:blur-[130px] animate-ambient-2"
            style={{
              animationDuration: `${15 * speedMultiplier}s`,
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          />

          {/* Deep Amber Sub-Frequency Orb (Bottom Center) */}
          <div
            className="absolute -bottom-20 left-10 sm:-bottom-40 sm:left-1/3 w-[360px] sm:w-[650px] h-[360px] sm:h-[650px] rounded-full bg-amber-600/16 sm:bg-amber-600/8 dark:bg-amber-500/12 dark:sm:bg-amber-500/6 blur-[75px] sm:blur-[150px] animate-ambient-1"
            style={{
              animationDuration: `${18 * speedMultiplier}s`,
              WebkitTransform: 'translate3d(0, 0, 0)',
              transform: 'translate3d(0, 0, 0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          />

          {/* Signature BPM Sound-System Subwoofer Breathing Pulse */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[480px] h-[280px] sm:h-[480px] rounded-full bg-amber-500/8 dark:bg-amber-400/6 blur-[60px] sm:blur-[110px] animate-subwoofer"
            style={{
              animationDuration: `${bpmCycleSeconds * speedMultiplier}s`,
              WebkitTransform: 'translate3d(-50%, -50%, 0)',
              transform: 'translate3d(-50%, -50%, 0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden',
              willChange: 'transform',
            }}
          />
        </>
      )}

      {/* 2. Bass Frequency Floating Particles */}
      {style === 'particles' && (
        <div className="absolute inset-0 opacity-60 dark:opacity-75">
          {[...Array(18)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-amber-400/50 dark:bg-amber-400/60 animate-particle-drift shadow-[0_0_8px_rgba(251,191,36,0.4)]"
              style={{
                top: `${(i * 17 + 5) % 95}%`,
                left: `${(i * 21 + 7) % 95}%`,
                width: `${(i % 3) * 3 + 4}px`,
                height: `${(i % 3) * 3 + 4}px`,
                animationDuration: `${(6 + (i % 5) * 2) * speedMultiplier}s`,
                animationDelay: `${(i % 5) * 0.7}s`,
                WebkitTransform: 'translate3d(0, 0, 0)',
                transform: 'translate3d(0, 0, 0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}

      {/* 3. Crossfading Slideshow Background Overlay */}
      {isSlideshowActive && validImages.length > 0 && (
        <div className="absolute inset-0 z-0">
          {validImages.map((img, idx) => (
            <div
              key={img + idx}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                idx === currentSlideIndex
                  ? 'opacity-15 dark:opacity-20 scale-100'
                  : 'opacity-0 scale-105'
              }`}
              style={{
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              <img
                src={img}
                alt="Slideshow Background"
                className="w-full h-full object-cover filter blur-[2px]"
                loading="lazy"
              />
            </div>
          ))}
          {/* Subtle vignette mask */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-50 dark:from-neutral-950 via-transparent to-neutral-50 dark:to-neutral-950" />
        </div>
      )}

      {/* Subtle fine sound system scanline overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 4px)',
        }}
      />
    </div>
  );
};
