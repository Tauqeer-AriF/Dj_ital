export type AccentColorKey = 'amber' | 'emerald' | 'cyan' | 'fuchsia' | 'rose' | 'violet' | 'lime' | 'sky';

export interface ThemeColorDef {
  key: AccentColorKey;
  label: string;
  hex: string;
  cssVar: string;
  tailwindClass: string;
}

export const themeColors: Record<AccentColorKey, ThemeColorDef> = {
  amber: {
    key: 'amber',
    label: 'Jungle Gold / Amber',
    hex: '#f59e0b',
    cssVar: '38, 92%, 50%',
    tailwindClass: 'text-amber-500',
  },
  emerald: {
    key: 'emerald',
    label: 'Rave Emerald / Green',
    hex: '#10b981',
    cssVar: '160, 84%, 39%',
    tailwindClass: 'text-emerald-500',
  },
  cyan: {
    key: 'cyan',
    label: 'Laser Cyan / Blue',
    hex: '#06b6d4',
    cssVar: '189, 94%, 43%',
    tailwindClass: 'text-cyan-500',
  },
  fuchsia: {
    key: 'fuchsia',
    label: 'Neon Fuchsia',
    hex: '#d946ef',
    cssVar: '292, 84%, 61%',
    tailwindClass: 'text-fuchsia-500',
  },
  rose: {
    key: 'rose',
    label: 'Soundclash Red / Rose',
    hex: '#f43f5e',
    cssVar: '350, 89%, 60%',
    tailwindClass: 'text-rose-500',
  },
  violet: {
    key: 'violet',
    label: 'Sub-bass Violet',
    hex: '#8b5cf6',
    cssVar: '258, 90%, 66%',
    tailwindClass: 'text-violet-500',
  },
  lime: {
    key: 'lime',
    label: 'Dub Acid Lime',
    hex: '#84cc16',
    cssVar: '84, 81%, 44%',
    tailwindClass: 'text-lime-500',
  },
  sky: {
    key: 'sky',
    label: 'Pirate Radio Sky',
    hex: '#0ea5e9',
    cssVar: '199, 89%, 48%',
    tailwindClass: 'text-sky-500',
  },
};

export function applyThemeColor(colorKey: AccentColorKey | string, customHex?: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const resolvedKey = (colorKey in themeColors ? colorKey : 'amber') as AccentColorKey;
  const def = themeColors[resolvedKey];
  const targetHex = customHex || def.hex;

  root.style.setProperty('--accent-color', targetHex);
  root.style.setProperty('--accent-glow', `${targetHex}33`);
  root.setAttribute('data-accent-theme', resolvedKey);
}
