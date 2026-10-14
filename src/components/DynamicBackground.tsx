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

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Subtle Moving Gradient Mesh (for subtle-motion and ambient-glow) */}
      {(style === 'subtle-motion' || style === 'ambient-glow') && (
        <>
          <div
            className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/10 blur-[140px] dark:bg-amber-400/8 animate-float"
            style={{ animationDuration: `${12 * speedMultiplier}s` }}
          />
          <div
            className="absolute top-1/3 -right-40 w-[550px] h-[550px] rounded-full bg-cyan-500/10 blur-[130px] dark:bg-cyan-400/7 animate-float-delayed"
            style={{ animationDuration: `${15 * speedMultiplier}s` }}
          />
          <div
            className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] rounded-full bg-amber-600/8 blur-[160px] dark:bg-amber-500/6 animate-float"
            style={{ animationDuration: `${18 * speedMultiplier}s` }}
          />
        </>
      )}

      {/* 2. Bass Frequency Floating Particles */}
      {style === 'particles' && (
        <div className="absolute inset-0 opacity-40 dark:opacity-60">
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-amber-400/30 dark:bg-amber-400/40 animate-float"
              style={{
                top: `${(i * 19) % 100}%`,
                left: `${(i * 23) % 100}%`,
                width: `${(i % 4) * 3 + 4}px`,
                height: `${(i % 4) * 3 + 4}px`,
                animationDuration: `${(8 + (i % 6) * 2) * speedMultiplier}s`,
                animationDelay: `${(i % 4) * 0.8}s`,
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
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlideIndex ? 'opacity-10 dark:opacity-15' : 'opacity-0'
              }`}
            >
              <img
                src={img}
                alt="Slideshow Background"
                className="w-full h-full object-cover filter blur-[2px] scale-105"
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
