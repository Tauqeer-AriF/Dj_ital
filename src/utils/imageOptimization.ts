/**
 * Image processing and preset utilities for DJ Ital website media manager.
 * Fully compatible with Safari (macOS & iOS), Chrome, Edge, Firefox.
 */

export interface ImagePreset {
  id: string;
  name: string;
  category: string;
  url: string;
  description: string;
}

export const FALLBACK_IMAGE = '/images/dj_ital_hero_1790112374509.jpg';

export const ARCHIVE_IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'hero_turntables',
    name: 'DJ Ital at Turntables (Studio Mix)',
    category: 'Artist & Decks',
    url: '/images/dj_ital_hero_1790112374509.jpg',
    description: 'Pioneering jungle selector DJ Ital cutting fresh dubplates on Technics SL-1210 turntables.',
  },
  {
    id: 'va_exhibition',
    name: 'V&A Museum Exhibition Showcase',
    category: 'Heritage & Museum',
    url: '/images/va_museum_exhibition_1790112416279.jpg',
    description: 'Archival display at Victoria and Albert Museum featuring DJ Ital original 1990s flight bomber jacket and flyers.',
  },
  {
    id: 'vital_fest_crowd',
    name: 'Vital Fest Sound System Crowd',
    category: 'Vital Fest & Raves',
    url: '/images/vital_fest_crowd_1790112387611.jpg',
    description: 'High-energy sound system dancefloor at The Hackney Social with sub-bass pressure and unity.',
  },
  {
    id: 'kool_fm_vintage',
    name: 'Kool FM 94.5 Vintage Turntable Archive',
    category: 'Pirate Radio',
    url: '/images/kool_fm_vintage_1790112400005.jpg',
    description: 'Authentic mid-90s pirate radio studio setup with Technics 1200 turntables and acetate crates.',
  },
  {
    id: 'dubplate_acetate',
    name: '10" Acetate Dubplate Cutting Session',
    category: 'Dubplates & Studio',
    url: '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    description: 'Original 10-inch acetate dubplate of "Decibel" with hand-written grease pencil track titles.',
  },
  {
    id: 'hackney_rooftop',
    name: 'Hackney Rooftop Pirate Transmitter Aerial',
    category: 'Pirate Radio',
    url: '/images/hackney_pirate_radio_1790113898507.jpg',
    description: 'FM dipole aerial mounted on council tower block overlooking East London skyline at twilight.',
  },
];

/**
 * Normalizes an image URL so it resolves correctly in all environments (including Safari and production builds).
 * Translates any legacy /src/assets/images/... paths to /images/....
 */
export function normalizeImageUrl(url?: string | null, fallback = FALLBACK_IMAGE): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  let trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/images/')) {
    trimmed = trimmed.replace('/src/assets/images/', '/images/');
  } else if (trimmed.startsWith('src/assets/images/')) {
    trimmed = trimmed.replace('src/assets/images/', '/images/');
  }
  // If external http:// on an https page, upgrade to https:// to avoid iOS Safari mixed-content blocking
  if (trimmed.startsWith('http://') && !trimmed.includes('localhost') && !trimmed.includes('127.0.0.1')) {
    trimmed = trimmed.replace('http://', 'https://');
  }
  return trimmed;
}

/**
 * Optimizes and converts a user-uploaded File into a lightweight, Safari-compatible Base64 Data URL.
 * Automatically downscales large camera photos to a max dimension of 1440px and compresses using JPEG/PNG.
 */
export async function optimizeImageFile(file: File, maxDimension = 1440, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawResult = e.target?.result as string;
      if (!rawResult) {
        reject(new Error('Empty image file read result'));
        return;
      }

      // If vector SVG, return raw data URI directly to preserve vector sharpness & transparency
      if (file.type === 'image/svg+xml') {
        resolve(rawResult);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult);
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Use JPEG compression (100% universal across Safari, iOS, Chrome, Firefox)
          // For PNGs with transparency or small icons, use PNG
          if (file.type === 'image/png' && width <= 800 && height <= 800) {
            try {
              const pngData = canvas.toDataURL('image/png');
              if (pngData && pngData.length > 50) {
                resolve(pngData);
                return;
              }
            } catch {
              // fallback to JPEG
            }
          }

          const jpegData = canvas.toDataURL('image/jpeg', quality);
          if (jpegData && jpegData.length > 50) {
            resolve(jpegData);
            return;
          }

          resolve(rawResult);
        } catch (err) {
          console.warn('Canvas optimization fallback to raw reader data URL for Safari:', err);
          resolve(rawResult);
        }
      };

      img.onerror = () => {
        // Fallback directly to the FileReader result (e.g. for HEIC/unusual WebKit formats)
        resolve(rawResult);
      };

      img.src = rawResult;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

