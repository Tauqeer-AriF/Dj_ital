import React, { useState, useEffect } from 'react';
import { ArrowUp, Radio } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isAscending, setIsAscending] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;

          if (scrollTop > 280) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
            setIsAscending(false);
          }

          if (docHeight > 0) {
            const progress = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
            setScrollProgress(progress);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    setIsAscending(true);
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    setTimeout(() => {
      setIsAscending(false);
    }, 850);
  };

  if (!isVisible) return null;

  // SVG circular progress parameters
  const radius = 21;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className="fixed bottom-6 sm:bottom-8 right-4 sm:right-6 z-30 select-none pointer-events-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Sound System Radar Waves (Hover & Ascend Pulse) */}
      <div className="absolute inset-0 -m-1.5 pointer-events-none flex items-center justify-center">
        {isAscending && (
          <span
            style={{ borderColor: 'var(--accent-primary)' }}
            className="absolute w-14 h-14 rounded-md border-2 animate-ping duration-500 opacity-90 pointer-events-none"
          />
        )}
      </div>

      {/* Main Interactive Button */}
      <button
        onClick={scrollToTop}
        aria-label="Rewind to top of page"
        style={
          isHovered
            ? {
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
                boxShadow: '0 0 25px var(--accent-glow)',
              }
            : undefined
        }
        className={`group hardware-btn relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-md transition-all duration-300 cursor-pointer shadow-2xl ${
          isHovered
            ? 'scale-105 bg-neutral-100 dark:bg-neutral-950'
            : 'scale-100 border-neutral-300 dark:border-white/15 bg-white/95 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200'
        } border backdrop-blur-xl active:scale-95`}
        title={`Rewind to top (${Math.round(scrollProgress)}%)`}
      >
        {/* Animated Turntable Platter Strobe Dashes (Rotating on hover) */}
        <div
          style={{ borderColor: 'var(--accent-focus)' }}
          className={`absolute inset-0 rounded-full border border-dashed pointer-events-none transition-transform duration-1000 ${
            isHovered ? 'rotate-180 scale-95 opacity-100' : 'rotate-0 opacity-20'
          }`}
        />

        {/* SVG Circular Progress Track with Glowing Filter */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-1"
          viewBox="0 0 48 48"
        >
          {/* Base Inactive Circle */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="stroke-neutral-300/80 dark:stroke-white/10 fill-none"
            strokeWidth="2.75"
          />

          {/* Dynamic Active Accent Progress Ring */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="fill-none transition-all duration-150"
            strokeWidth="2.75"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              stroke: 'var(--accent-primary)',
              filter: isHovered ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none',
            }}
          />
        </svg>

        {/* Center Content: Animated Arrow with Launch/Bounce Physics */}
        <div className="relative z-10 flex flex-col items-center justify-center overflow-hidden w-full h-full">
          <div
            className={`transition-all duration-300 transform flex flex-col items-center justify-center ${
              isAscending
                ? '-translate-y-10 opacity-0 scale-50'
                : isHovered
                ? '-translate-y-0.5 scale-105'
                : 'translate-y-0 scale-100'
            }`}
          >
            <ArrowUp
              style={isHovered ? { color: 'var(--accent-primary)' } : undefined}
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-200 ${
                isHovered
                  ? 'stroke-[2.75] animate-bounce'
                  : 'text-neutral-700 dark:text-neutral-200 stroke-2'
              }`}
            />
          </div>

          {/* Ascend Trail Flash */}
          {isAscending && (
            <div
              style={{ color: 'var(--accent-primary)' }}
              className="absolute inset-0 flex items-center justify-center animate-pulse font-industrial text-[10px] font-black tracking-wider uppercase"
            >
              REWIND
            </div>
          )}
        </div>

        {/* Floating Sound-System HUD Tooltip (Reveals on Hover) */}
        <div
          style={{
            borderColor: 'var(--accent-focus)',
            color: 'var(--accent-primary)',
          }}
          className={`absolute -top-9 right-1/2 translate-x-1/2 px-2.5 py-1 rounded bg-white/95 dark:bg-neutral-950/95 text-[10px] font-industrial whitespace-nowrap shadow-xl border border-neutral-300 dark:border-white/20 pointer-events-none transition-all duration-200 flex items-center gap-1.5 uppercase font-bold tracking-wider ${
            isHovered
              ? 'opacity-100 -translate-y-1 scale-100'
              : 'opacity-0 translate-y-1 scale-90 pointer-events-none'
          }`}
        >
          <span
            style={{ backgroundColor: 'var(--accent-primary)' }}
            className="w-1.5 h-1.5 rounded-none animate-ping"
          />
          <span className="font-black">REWIND</span>
          <span className="text-neutral-400 dark:text-neutral-500">|</span>
          <span className="font-industrial text-neutral-950 dark:text-white font-black">
            {Math.round(scrollProgress)}%
          </span>
        </div>
      </button>
    </div>
  );
};
