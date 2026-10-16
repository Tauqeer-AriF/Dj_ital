import React, { useState, useEffect, useMemo } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import { generateColorPalette, resolveColorHex } from '../utils/themeEngine';

interface AppLoaderProps {
  statusText?: string;
  logoUrl?: string;
  colorScheme?: string;
  accentColor?: string;
  signatureBpm?: number;
  brandSlogan?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  statusText,
  logoUrl,
  colorScheme,
  accentColor,
  signatureBpm = 164,
  brandSlogan = 'DjItal 164bpm',
}) => {
  const [progress, setProgress] = useState(12);
  const activeLogo = logoUrl || '/images/vital_fest_logo.png';

  // Compute active theme hex and complete color palette
  const activeHex = useMemo(() => {
    return resolveColorHex(colorScheme, accentColor);
  }, [colorScheme, accentColor]);

  const palette = useMemo(() => generateColorPalette(activeHex), [activeHex]);

  const loadingSteps = [
    { threshold: 0, text: 'LOADING VITAL FEST AUDIO ARCHIVES...' },
    { threshold: 28, text: 'INITIALISING SQLITE DUB ARCHIVE...' },
    { threshold: 58, text: 'SYNCING KOOL FM 94.5 BROADCAST MASTERS...' },
    { threshold: 82, text: `ENGAGING ${signatureBpm} BPM JUNGLE AUDIO ENGINE...` },
  ];

  // Smooth active progress progression
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        // Natural ease-out progression
        const increment = Math.max(1, Math.floor((100 - prev) / 6));
        return Math.min(98, prev + increment);
      });
    }, 90);

    return () => clearInterval(interval);
  }, []);

  const currentStepText =
    statusText ||
    [...loadingSteps].reverse().find((step) => progress >= step.threshold)?.text ||
    loadingSteps[0].text;

  return (
    <div
      style={{
        ['--accent-primary' as any]: palette.primary,
        ['--accent-hover' as any]: palette.hover,
        ['--accent-focus' as any]: palette.focus,
        ['--accent-glow' as any]: palette.glow,
        ['--accent-subtle' as any]: palette.subtle,
        ['--accent-text-color' as any]: palette.textColor,
        ['--accent-rgb' as any]: palette.rgb,
      }}
      className="fixed inset-0 z-50 min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4 overflow-hidden"
    >
      {/* Dynamic atmospheric audio glow matching selected color scheme */}
      <div
        style={{ backgroundColor: 'var(--accent-glow)' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] blur-[160px] rounded-full pointer-events-none animate-pulse"
      />
      <div
        style={{ backgroundColor: 'var(--accent-subtle)' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] blur-[130px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full space-y-7">
        
        {/* Vital Fest Logo Centerpiece with Pulsing Halo */}
        <div className="relative group">
          {/* Sonic Pulse Rings expanding outward in selected theme accent */}
          <div
            style={{ animationDuration: '2.4s', borderColor: 'var(--accent-focus)' }}
            className="absolute -inset-4 sm:-inset-6 rounded-full border-2 animate-ping opacity-35"
          />
          <div
            style={{ borderColor: 'var(--accent-subtle)' }}
            className="absolute -inset-8 sm:-inset-10 rounded-full border animate-pulse opacity-50"
          />

          {/* Logo Container */}
          <div
            style={{
              borderColor: 'var(--accent-focus)',
              boxShadow: '0 0 50px var(--accent-glow)',
            }}
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl p-4 bg-gradient-to-b from-neutral-900 to-neutral-950 border-2 flex items-center justify-center"
          >
            <img
              src={activeLogo}
              alt="Vital Fest Logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
              }}
              style={{
                filter: 'drop-shadow(0 4px 16px var(--accent-glow))',
              }}
              className="w-full h-full object-contain animate-pulse"
            />
          </div>

          {/* Vital Fest Founder Badge */}
          <div
            style={{
              borderColor: 'var(--accent-primary)',
              color: 'var(--accent-hover)',
              backgroundColor: 'rgba(15, 15, 18, 0.95)',
            }}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-1 rounded-full border text-[10px] font-mono font-bold shadow-xl backdrop-blur-md whitespace-nowrap"
          >
            <span
              style={{ backgroundColor: 'var(--accent-primary)' }}
              className="w-1.5 h-1.5 rounded-full animate-ping"
            />
            <span className="tracking-wider">VITAL FEST OFFICIAL</span>
          </div>
        </div>

        {/* Hero Title & Identity in Crisp White */}
        <div className="space-y-2 pt-2">
          <div
            style={{ color: 'var(--accent-primary)' }}
            className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-wider"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>KOOL FM 94.5 & DEJAVU FM</span>
            <span aria-hidden="true">·</span>
            <span>1991 — 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white uppercase leading-none">
            DJ ITAL
          </h1>

          <p className="text-xs sm:text-sm font-medium text-white/90 max-w-xs mx-auto">
            Sound System Culture & {signatureBpm} BPM Jungle Sub-Bass Heritage
          </p>
        </div>

        {/* Audio Equalizer Spectrum Bars in Selected Color Scheme */}
        <div className="flex items-end justify-center gap-1.5 h-8 w-full max-w-[200px]">
          {[
            { height: 'h-4', delay: '0ms' },
            { height: 'h-7', delay: '120ms' },
            { height: 'h-5', delay: '240ms' },
            { height: 'h-8', delay: '60ms' },
            { height: 'h-6', delay: '180ms' },
            { height: 'h-7', delay: '90ms' },
            { height: 'h-4', delay: '210ms' },
          ].map((bar, i) => (
            <div
              key={i}
              className={`w-2 rounded-t-sm animate-bounce ${bar.height}`}
              style={{
                animationDuration: '0.6s',
                animationDelay: bar.delay,
                background: 'linear-gradient(to top, var(--accent-primary), var(--accent-hover))',
              }}
            />
          ))}
        </div>

        {/* Active Progress Bar Container with Percentage Counter */}
        <div className="w-64 sm:w-72 space-y-2.5">
          {/* Percentage & Header Row */}
          <div className="flex items-center justify-between text-[11px] font-mono text-white px-0.5">
            <span
              style={{ color: 'var(--accent-primary)' }}
              className="font-bold tracking-wider"
            >
              AUDIO CORE
            </span>
            <span
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--accent-focus)',
                color: 'var(--accent-hover)',
              }}
              className="font-bold tabular-nums px-2 py-0.5 rounded border"
            >
              {Math.round(progress)}%
            </span>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div className="h-2 w-full bg-neutral-900 border border-white/20 rounded-full overflow-hidden relative shadow-inner p-0.5">
            <div
              className="h-full rounded-full transition-all duration-150 ease-out relative"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(to right, var(--accent-hover), var(--accent-primary))',
                boxShadow: '0 0 14px var(--accent-glow)',
              }}
            >
              {/* Shimmer sweep over the active progress */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </div>
          </div>

          {/* Cycling Status Monospace Line */}
          <div className="h-5 flex items-center justify-center">
            <p className="text-[10px] sm:text-[11px] font-mono text-neutral-300 font-semibold tracking-wider uppercase transition-opacity duration-200 truncate">
              {currentStepText}
            </p>
          </div>
        </div>

        {/* Museum Endorsement Tag */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/80 pt-1">
          <Sparkles style={{ color: 'var(--accent-primary)' }} className="w-3 h-3" />
          <span>V&A EAST: THE MUSIC IS BLACK EXHIBITION 2026</span>
        </div>

      </div>
    </div>
  );
};
