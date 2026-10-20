import React, { useEffect, useMemo, useRef, useState } from 'react';

export const ARCHIVAL_SLIDESHOW_PRESETS = [
  '/images/dj_ital_hero_1790112374509.jpg',
  '/images/hackney_pirate_radio_1790113898507.jpg',
  '/images/kool_fm_vintage_1790112400005.jpg',
  '/images/va_museum_exhibition_1790112416279.jpg',
  '/images/vinyl_dubplate_acetate_1790113879360.jpg',
  '/images/vital_fest_crowd_1790112387611.jpg',
];

export function sanitizeSlideshowImages(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((image): image is string => typeof image === 'string' && image.trim().length > 0);
    }
  } catch {
    // Treat a single legacy URL as a one-image slideshow.
  }
  return [value.trim()];
}

export interface DynamicBackgroundProps {
  style?: string;
  speed?: string;
  accentColor?: string;
  slideshowEnabled?: boolean;
  slideshowInterval?: number;
  slideshowImages?: string | null;
}

export const ParticleCanvas: React.FC<{ speedMultiplier?: number; color?: string }> = ({
  speedMultiplier = 1,
  color = '#f59e0b',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const particleCount = Math.min(60, Math.floor(width / 30));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.4 * speedMultiplier,
      vy: (Math.random() - 0.5) * 0.4 * speedMultiplier,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reducedMotion) animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [speedMultiplier, color]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-40" />;
};

export const RetroGrid: React.FC<{ color?: string }> = ({ color = 'rgba(245, 158, 11, 0.05)' }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    />
  );
};

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
  style = 'subtle-motion',
  speed = 'medium',
  accentColor = '#f59e0b',
  slideshowEnabled = false,
  slideshowInterval = 6,
  slideshowImages,
}) => {
  const speedVal = speed === 'slow' ? 0.5 : speed === 'fast' ? 1.8 : 1;
  const images = useMemo(() => sanitizeSlideshowImages(slideshowImages), [slideshowImages]);
  const hasSlideshow = (style === 'slideshow' || slideshowEnabled) && images.length > 0;
  const interval = Math.min(30, Math.max(3, Number(slideshowInterval) || 6));
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const showGlow = ['subtle-motion', 'ambient-glow', 'hybrid', 'slideshow'].includes(style);
  const showParticles = ['subtle-motion', 'particles', 'hybrid', 'slideshow'].includes(style);
  const showGrid = ['static', 'minimal', 'subtle-motion', 'hybrid', 'slideshow'].includes(style);
  const showWaveRibbons = ['subtle-motion', 'hybrid'].includes(style);
  const motionDuration = speed === 'slow' ? '24s' : speed === 'fast' ? '7s' : '14s';

  useEffect(() => {
    setActiveImageIndex(0);
    if (!hasSlideshow || images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(
      () => setActiveImageIndex((index) => (index + 1) % images.length),
      interval * 1000
    );
    return () => window.clearInterval(timer);
  }, [hasSlideshow, images, interval]);

  return (
    <div className="dynamic-background fixed inset-0 pointer-events-none overflow-hidden z-0 bg-neutral-50 dark:bg-neutral-950">
      {hasSlideshow && (
        <div className="absolute inset-0 overflow-hidden">
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                activeImageIndex === index ? 'opacity-20 dark:opacity-25' : 'opacity-0'
              }`}
              style={{ backgroundImage: `url("${image.replace(/["\\]/g, '')}")` }}
            />
          ))}
          <div className="absolute inset-0 bg-white/65 dark:bg-neutral-950/65" />
        </div>
      )}

      {showGlow && (
        <>
          <div
            className="dynamic-background-glow absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20"
            style={{ backgroundColor: accentColor, animationDuration: motionDuration }}
          />
          <div
            className="dynamic-background-glow dynamic-background-glow-delayed absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full blur-[160px] opacity-15"
            style={{ backgroundColor: accentColor, animationDuration: motionDuration }}
          />
        </>
      )}

      {showGrid && <RetroGrid color="rgba(255, 255, 255, 0.025)" />}

      {(style === 'soundwave' || style === 'hybrid') && (
        <div className={`dynamic-soundwave absolute inset-x-0 top-1/2 flex h-48 -translate-y-1/2 items-center justify-center gap-1 ${style === 'hybrid' ? 'opacity-10' : 'opacity-30'}`}>
          {Array.from({ length: 48 }, (_, index) => (
            <span
              key={index}
              className="dynamic-soundwave-bar w-1 rounded-full"
              style={{
                height: `${18 + ((index * 37) % 82)}%`,
                backgroundColor: accentColor,
                animationDelay: `${(index % 9) * -0.16}s`,
                animationDuration: motionDuration,
              }}
            />
          ))}
        </div>
      )}

      {showWaveRibbons && (
        <svg
          aria-hidden="true"
          className="dynamic-wave-ribbons absolute inset-0 h-full w-full opacity-[0.12]"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
        >
          {[0, 1, 2].map((wave) => (
            <path
              key={wave}
              d={`M-80 ${360 + wave * 75} C 240 ${180 + wave * 55}, 440 ${540 + wave * 45}, 760 ${360 + wave * 70} S 1240 ${180 + wave * 60}, 1520 ${360 + wave * 70}`}
              fill="none"
              stroke={accentColor}
              strokeWidth="2"
              style={{ animationDelay: `${wave * -2}s`, animationDuration: motionDuration }}
            />
          ))}
        </svg>
      )}

      {(style === 'dub-sonar' || style === 'hybrid') && (
        <div className={`dynamic-sonar absolute left-1/2 top-1/2 aspect-square w-[min(85vw,85vh)] -translate-x-1/2 -translate-y-1/2 ${style === 'hybrid' ? 'opacity-25' : ''}`}>
          {[0, 1, 2, 3].map((ring) => (
            <span
              key={ring}
              className="dynamic-sonar-ring absolute inset-0 rounded-full border"
              style={{
                borderColor: `${accentColor}45`,
                animationDelay: `${ring * -1.5}s`,
                animationDuration: motionDuration,
              }}
            />
          ))}
          <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>
      )}

      {showParticles && <ParticleCanvas speedMultiplier={speedVal} color={accentColor} />}
    </div>
  );
};
