// Helper to calculate contrast, hover, and focus shades from any Hex color

export interface ColorPalette {
  primary: string;
  hover: string;
  focus: string;
  glow: string;
  subtle: string;
  textColor: string;
  rgb: string;
}

// Convert Hex to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleaned, 16);
  if (isNaN(num)) {
    return { r: 245, g: 158, b: 11 }; // Fallback to Amber
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Compute luminance (0 to 1) to determine high-contrast text color
export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Lighten or darken color for snappy hover states
export function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const adjust = (val: number) => {
    const res = Math.round(val + (255 - val) * (percent / 100));
    return Math.min(255, Math.max(0, res));
  };
  const darken = (val: number) => {
    const res = Math.round(val * (1 + percent / 100));
    return Math.min(255, Math.max(0, res));
  };

  const newR = percent > 0 ? adjust(r) : darken(r);
  const newG = percent > 0 ? adjust(g) : darken(g);
  const newB = percent > 0 ? adjust(b) : darken(b);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

export function generateColorPalette(hexColor: string): ColorPalette {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = getLuminance(r, g, b);
  
  // Contrast text color
  const textColor = luminance > 0.45 ? '#09090b' : '#ffffff';

  // Hover shade: lighten for dark colors, slightly darken for very light colors
  const hover = luminance > 0.75 ? adjustBrightness(hexColor, -15) : adjustBrightness(hexColor, 20);
  const focus = `rgba(${r}, ${g}, ${b}, 0.55)`;
  const glow = `rgba(${r}, ${g}, ${b}, 0.38)`;
  const subtle = `rgba(${r}, ${g}, ${b}, 0.16)`;

  return {
    primary: hexColor,
    hover,
    focus,
    glow,
    subtle,
    textColor,
    rgb: `${r}, ${g}, ${b}`,
  };
}

export const PRESET_COLOR_MAP: Record<string, string> = {
  amber: '#f59e0b',
  emerald: '#10b981',
  cyan: '#06b6d4',
  crimson: '#ef4444',
  violet: '#8b5cf6',
  'acid-lime': '#84cc16',
  monochrome: '#ffffff',
  custom: '#f59e0b',
};

export function resolveColorHex(scheme?: string, customHex?: string): string {
  if (!scheme) {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('dj_ital_theme_color');
      if (savedColor) return savedColor;
      const savedScheme = localStorage.getItem('dj_ital_color_scheme');
      if (savedScheme && PRESET_COLOR_MAP[savedScheme]) return PRESET_COLOR_MAP[savedScheme];
    }
    return '#f59e0b';
  }
  if (scheme === 'custom') {
    return customHex || '#f59e0b';
  }
  return PRESET_COLOR_MAP[scheme] || customHex || '#f59e0b';
}

export function applyThemeToDOM(
  colorHex: string,
  fontPreset: string = 'syne',
  bodyFontPreset: string = 'jakarta',
  colorSchemeName?: string
) {
  if (typeof document === 'undefined') return;

  const palette = generateColorPalette(colorHex);
  const root = document.documentElement;

  // Apply CSS Variables directly on root
  root.style.setProperty('--accent-primary', palette.primary);
  root.style.setProperty('--accent-hover', palette.hover);
  root.style.setProperty('--accent-focus', palette.focus);
  root.style.setProperty('--accent-glow', palette.glow);
  root.style.setProperty('--accent-subtle', palette.subtle);
  root.style.setProperty('--accent-text-color', palette.textColor);
  root.style.setProperty('--accent-rgb', palette.rgb);

  // Apply font presets
  root.setAttribute('data-font-preset', fontPreset);
  root.setAttribute('data-body-font-preset', bodyFontPreset);
  if (colorSchemeName) {
    root.setAttribute('data-color-scheme', colorSchemeName);
  }

  // Cache to localStorage for instant boot styling (including AppLoader)
  try {
    localStorage.setItem('dj_ital_theme_color', colorHex);
    localStorage.setItem('dj_ital_font_preset', fontPreset);
    localStorage.setItem('dj_ital_body_font_preset', bodyFontPreset);
    if (colorSchemeName) {
      localStorage.setItem('dj_ital_color_scheme', colorSchemeName);
    }
  } catch {}
}

export function initSavedTheme() {
  if (typeof window === 'undefined') return;
  try {
    const savedScheme = localStorage.getItem('dj_ital_color_scheme') || undefined;
    const savedColor = localStorage.getItem('dj_ital_theme_color') || (savedScheme && PRESET_COLOR_MAP[savedScheme]) || '#f59e0b';
    const savedFont = localStorage.getItem('dj_ital_font_preset') || 'syne';
    const savedBodyFont = localStorage.getItem('dj_ital_body_font_preset') || 'jakarta';
    applyThemeToDOM(savedColor, savedFont, savedBodyFont, savedScheme);
  } catch {}
}
