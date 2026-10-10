import React from 'react';

interface MarqueeRibbonProps {
  textItems?: string[];
  reverse?: boolean;
}

export const MarqueeRibbon: React.FC<MarqueeRibbonProps> = ({
  textItems = [
    'FOUNDATION JUNGLE',
    'KOOL FM 94.5 ORIGINAL',
    'VITAL FEST FOUNDER',
    'V&A MUSEUM RECOGNIZED 2026',
    '160 - 172 BPM SUB-BASS',
    'EAST LONDON SOUND SYSTEM CULTURE',
    'DECIBEL DUBPLATE ARCHIVES',
    'DEJAVU FM RESIDENCY',
  ],
  reverse = false,
}) => {
  return (
    <div className="relative w-full overflow-hidden border-y border-neutral-200 dark:border-white/10 bg-neutral-100/60 dark:bg-neutral-900/40 py-3 select-none backdrop-blur-md">
      <div
        className={`flex w-max items-center gap-8 ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        }`}
      >
        {/* Render twice for continuous loop */}
        {[...textItems, ...textItems, ...textItems, ...textItems].map((item, index) => (
          <div key={index} className="flex items-center gap-8 text-xs font-mono tracking-widest uppercase">
            <span className="text-neutral-700 dark:text-neutral-300 font-semibold">{item}</span>
            <span aria-hidden="true" className="text-amber-500 dark:text-amber-400">
              ✦
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
