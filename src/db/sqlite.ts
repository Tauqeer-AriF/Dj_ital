import initSqlJs, { Database } from 'sql.js';
import { normalizeImageUrl } from '../utils/imageOptimization';

export interface ProfileData {
  id: number;
  stage_name: string;
  real_name: string;
  tagline: string;
  origin: string;
  active_since: string;
  bio_short: string;
  bio_full: string;
  booking_agency: string;
  booking_email: string;
  va_recognition_year: number;
  kool_fm_role: string;
  radio_show: string;
  genres: string;
  regions_covered: string;
  direct_email: string;
  whatsapp_number: string;
  whatsapp_message: string;
  shopify_merch_url: string;
  merch_badge_text: string;
  stream_url: string;
  dejavu_stream_url?: string;
  hero_stream_url?: string;
  main_player_stream_url?: string;
  is_live_on_air: number;
  live_show_title: string;
  key_venues: string;
  festivals: string;
  tech_rider_text: string;
  social_instagram: string;
  social_facebook: string;
  social_youtube: string;
  social_tiktok: string;
  social_mixcloud: string;
  social_soundcloud: string;
  social_spotify: string;
  epk_pdf_url: string;
  epk_logo_png: string;
  epk_logo_svg: string;
  epk_press_photo_landscape: string;
  epk_press_photo_portrait: string;
  bg_style: string;
  bg_speed: string;
  slideshow_enabled: number;
  slideshow_interval: number;
  slideshow_images: string;
  color_scheme?: string;
  font_family_preset?: string;
  custom_accent_color?: string;
  body_font_preset?: string;
  logo_url?: string;
  navbar_subtitle?: string;
  subtitle?: string;
  signature_bpm?: number;
  brand_slogan?: string;
}

export interface MediaLibraryItem {
  id: number;
  title: string;
  file_name?: string;
  file_type: 'image' | 'document' | 'audio' | 'video' | 'other';
  mime_type?: string;
  url: string;
  source: string; // e.g. 'Direct Upload', 'Brand Logo', 'Site Media', 'Events', 'Gallery', 'EPK Document'
  size_text?: string;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface EventData {
  id: number;
  title: string;
  venue: string;
  location: string;
  event_date: string;
  start_time: string;
  lineup: string;
  ticket_url: string;
  status: string; // 'Upcoming' | 'Sold Out' | 'Past'
  price_text: string;
  is_featured: number;
  flyer_image?: string;
}

export interface ReleaseData {
  id: number;
  title: string;
  release_year: number;
  label: string;
  catalog_number: string;
  format: string;
  bpm: number;
  audio_theme: string;
  stream_url: string;
  description: string;
  is_featured: number;
}

export interface GalleryData {
  id: number;
  title: string;
  category: string; // 'Vital Fest' | 'Kool FM Archive' | 'V&A Museum' | 'Live Performance' | 'Studio'
  image_url: string;
  caption: string;
  year: string;
  location: string;
  is_featured: number;
}

export interface DocumentaryData {
  id: number;
  episode_number: number;
  title: string;
  duration: string;
  description: string;
  youtube_url: string;
  topics: string;
  thumbnail_url?: string;
  badge_label?: string;
  action_button_text?: string;
  order_index?: number;
}

export interface DocumentarySettingsData {
  id: number;
  badge_text: string;
  subbadge_text: string;
  heading: string;
  description: string;
  youtube_button_text: string;
  youtube_series_url: string;
  show_youtube_button: number;
  is_section_visible: number;
  updated_at: string;
}

export const DEFAULT_DOCUMENTARY_SETTINGS: Omit<DocumentarySettingsData, 'id' | 'updated_at'> = {
  badge_text: '[ SOUND SYSTEM DOCUMENTARY // 4-PART SERIES ]',
  subbadge_text: 'ORAL HISTORY & ARCHIVE FOOTAGE',
  heading: '"DJ ITAL: THE JOURNEY"',
  description: 'An intimate four-part documentary chronicling the Golden Era of UK jungle music, pirate radio operations, dubplate battles, and East London sound system heritage through first-hand accounts.',
  youtube_button_text: 'OFFICIAL YOUTUBE SERIES',
  youtube_series_url: 'https://www.youtube.com/channel/UC64ZsaP78f0DtLvyiD0KzgA?sub_confirmation=1',
  show_youtube_button: 1,
  is_section_visible: 1,
};

export const DEFAULT_DOCUMENTARY_EPISODES: Omit<DocumentaryData, 'id'>[] = [
  {
    episode_number: 1,
    badge_label: 'EPISODE 01',
    title: 'Rooftops & Airwaves: The Kool FM Inception',
    duration: '22 MIN',
    description: 'How a group of passionate East London music pioneers rigged aerials atop Hackney council towers to broadcast the revolutionary sounds of jungle drum and bass to thousands.',
    youtube_url: 'https://www.youtube.com/@djital',
    topics: 'Pirate Radio History, Hackney Towers, Transmitter Tech',
    thumbnail_url: '/images/hackney_pirate_radio_1790113898507.jpg',
    action_button_text: 'WATCH ARCHIVAL TAPE',
    order_index: 1,
  },
  {
    episode_number: 2,
    badge_label: 'EPISODE 02',
    title: 'The Dubplate Culture & Producing "Decibel"',
    duration: '19 MIN',
    description: 'First-hand breakdown of how "Decibel" was composed on vintage hardware samplers, cut onto fresh acetate, and road-tested at landmark raves.',
    youtube_url: 'https://www.youtube.com/@djital',
    topics: 'Music Production, Dubplate Cutting, Sound Clash',
    thumbnail_url: '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    action_button_text: 'WATCH ARCHIVAL TAPE',
    order_index: 2,
  },
  {
    episode_number: 3,
    badge_label: 'EPISODE 03',
    title: 'Vital Fest: Protecting East London Sound Heritage',
    duration: '26 MIN',
    description: 'The genesis of Vital Fest, uniting original jungle originators with the next generation of ravers in grassroots East London venues.',
    youtube_url: 'https://www.youtube.com/@djital',
    topics: 'Vital Fest, Hackney Social, Community Culture',
    thumbnail_url: '/images/vital_fest_crowd_1790112387611.jpg',
    action_button_text: 'WATCH ARCHIVAL TAPE',
    order_index: 3,
  },
  {
    episode_number: 4,
    badge_label: 'EPISODE 04',
    title: 'From Underground Pirate to The V&A Museum',
    duration: '18 MIN',
    description: 'Reflections on 35 years of dedication to UK jungle, culminating in national cultural recognition at the Victoria and Albert Museum in 2026.',
    youtube_url: 'https://www.youtube.com/@djital',
    topics: 'V&A Museum Exhibition, Legacy, Cultural Preservation',
    thumbnail_url: '/images/va_museum_exhibition_1790112416279.jpg',
    action_button_text: 'WATCH ARCHIVAL TAPE',
    order_index: 4,
  },
];

export interface BookingData {
  id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  target_date: string;
  venue_city: string;
  estimated_budget: string;
  set_length?: string;
  message: string;
  status: string; // 'Pending' | 'Confirmed' | 'Declined'
  created_at: string;
}

export interface StatData {
  id: number;
  label: string;
  value: string;
  suffix: string;
  order_index: number;
}

export interface SiteMediaData {
  key: string;
  section: string;
  label: string;
  description: string;
  image_url: string;
  default_url: string;
  updated_at: string;
}

export interface AudioMixData {
  id: number;
  title: string;
  style: string; // 'Jungle / D&B' | 'Reggae / Dub' | 'Oldskool Tape Archive' | 'UK Bass'
  platform: string; // 'SoundCloud' | 'Mixcloud' | 'YouTube' | 'Direct'
  embed_url: string;
  stream_url: string;
  duration: string;
  description: string;
  is_featured: number;
  order_index: number;
  mediafire_url?: string;
  rinse_fm_url?: string;
  dejavu_fm_url?: string;
}

export interface VideoData {
  id: number;
  title: string;
  category: string; // 'Event Recap' | 'Live Set Clip' | 'Crowd Reaction' | 'Documentary'
  video_url: string;
  thumbnail_url: string;
  duration: string;
  order_index: number;
}

export interface TestimonialData {
  id: number;
  quote: string;
  author_name: string;
  role_venue: string;
  avatar_url: string;
  rating: number;
  order_index: number;
}

export interface VenueLogoData {
  id: number;
  name: string;
  location: string;
  logo_text: string;
  order_index: number;
}

export interface NewsletterSubscriberData {
  id: number;
  email: string;
  created_at: string;
  source: string;
}

export interface HeritageSettingsData {
  id: number;
  badge_text: string;
  subbadge_text: string;
  heading: string;
  description: string;
  va_image: string;
  va_image_alt: string;
  plaque_title: string;
  plaque_tag: string;
  plaque_description: string;
  residency_label: string;
  residency_title: string;
  residency_badge: string;
  residency_badge_color: string;
  provenance_tag: string;
  provenance_heading: string;
  lead_paragraph: string;
  updated_at: string;
}

export interface HeritageCredentialData {
  id: number;
  icon: string;
  title: string;
  description: string;
  color: string;
  order_index: number;
}

export interface HeritageChapterData {
  id: number;
  tab_label: string;
  title: string;
  period: string;
  content: string;
  order_index: number;
}

export interface HeritageMilestoneData {
  id: number;
  year_badge: string;
  title: string;
  description: string;
  color: string;
  order_index: number;
}

export interface HeritageFullData {
  settings: HeritageSettingsData;
  credentials: HeritageCredentialData[];
  chapters: HeritageChapterData[];
  milestones: HeritageMilestoneData[];
}

export const DEFAULT_HERITAGE_SETTINGS: Omit<HeritageSettingsData, 'id' | 'updated_at'> = {
  badge_text: '[ V&A NATIONAL ARCHIVE // 1991—2026 ]',
  subbadge_text: 'EAST LONDON PIRATE RIGS TO NATIONAL MUSEUM',
  heading: 'From Hackney Pirate Towers to the V&A Museum',
  description: "Tracing DJ Ital's 35-year journey from pirate broadcasts across East London rooftops to receiving permanent archival recognition in the Victoria & Albert Museum in 2026.",
  va_image: '/images/va_museum_exhibition_1790112416279.jpg',
  va_image_alt: 'Victoria and Albert Museum exhibition featuring DJ Ital original Kool FM jacket',
  plaque_title: 'V&A EAST: THE MUSIC IS BLACK',
  plaque_tag: '#VAM.2026.E14',
  plaque_description: 'Exhibition loan of DJ Ital\'s authentic 1990s Kool FM flight jacket and rare acetate dubplates featured in "The Music is Black: A British Story" at V&A East in April 2026, documenting UK Black British music history and pirate radio heritage.',
  residency_label: 'Current Broadcast Residency',
  residency_title: 'DejaVu FM · Fortnightly Saturdays',
  residency_badge: 'ON AIR',
  residency_badge_color: 'emerald',
  provenance_tag: 'CURATORIAL PROVENANCE',
  provenance_heading: 'Rooted in Hackney Sound Systems',
  lead_paragraph: 'DJ Ital (born Martin Oscar, 1968, Hackney, London) is a British DJ, producer, and event promoter. A pioneer of the jungle music genre, he joined the legendary pirate radio station Kool FM (94.5) during its explosive early 90s genesis. In 2026, his enduring influence on British music culture was formally recognised by the Victoria and Albert Museum (V&A East).',
};

export const DEFAULT_HERITAGE_CREDENTIALS: Omit<HeritageCredentialData, 'id'>[] = [
  {
    icon: 'radio',
    title: 'Kool FM 94.5 (Est. 1991)',
    description: "Core resident broadcaster on the undisputed pirate powerhouse that established jungle worldwide across London's high-rise transmitters.",
    color: 'amber',
    order_index: 1,
  },
  {
    icon: 'landmark',
    title: 'Knowledge Magazine',
    description: "Featured in the landmark print retrospective (Issue 85) honouring DJ Ital's technical mixing approach and the golden era evolution of pirate radio.",
    color: 'cyan',
    order_index: 2,
  },
  {
    icon: 'award',
    title: 'V&A Curatorial Loan',
    description: 'Official museum accession of original flight jacket artefact and master acetate dubplates memorialised in national heritage collections.',
    color: 'cyan',
    order_index: 3,
  },
  {
    icon: 'sparkles',
    title: 'Resident Advisor',
    description: 'Praised by electronic music media for leading the community sound-system resurgence at Hackney Social, Yard Theatre, and Arch 14.',
    color: 'amber',
    order_index: 4,
  },
];

export const DEFAULT_HERITAGE_CHAPTERS: Omit<HeritageChapterData, 'id'>[] = [
  {
    tab_label: 'Kool FM',
    title: 'Underground Genesis & Rooftop Transmitters',
    period: '1991 — 1994',
    content: 'Emerging from the East London underground scene, Ital joined Kool FM 94.5 during its foundational years. Transmitting weekly live sets from rooftop pirate rigs in Hackney and Bow, he played an integral role in establishing jungle and drum and bass across London.',
    order_index: 1,
  },
  {
    tab_label: '"Decibel"',
    title: 'Production of Jungle Anthem "Decibel"',
    period: '1995',
    content: 'In 1995, Ital produced "Decibel" (widely known as "Decibels"), featured on the Kool FM 5th Anniversary compilation. The track is recognised as a benchmark of mid-90s jungle, marrying intricate time-stretched breakbeats with heavyweight electronic sub-bass.',
    order_index: 2,
  },
  {
    tab_label: 'Media & Docu',
    title: 'Knowledge Magazine Retrospective & Journey Series',
    period: '2006 — 2024',
    content: 'Featured in Knowledge Magazine (Issue 85) by Giles Wood, detailing technical mixing craft and pirate radio evolution. In 2024, he released the documentary series "DJ Ital: The Journey", cataloguing first-hand accounts and rare archival rave footage.',
    order_index: 3,
  },
  {
    tab_label: 'Vital Fest',
    title: 'Preserving Sound System Culture in East London',
    period: '2023 — Present',
    content: 'Founded Vital Fest in Hackney, hosting events across The Hackney Social, The Yard Theatre, and Arch 14. Resident Advisor highlighted the series for keeping grassroots sound system heritage alive with veterans DJ Brockie, Ragga Twins, and Jumpin Jack Frost.',
    order_index: 4,
  },
  {
    tab_label: 'V&A East',
    title: 'V&A East: The Music is Black Exhibition',
    period: 'April 2026',
    content: 'His cultural legacy was formally memorialised by the Victoria and Albert Museum for the exhibition "The Music is Black: A British Story" at V&A East, with his original 1990s flight jacket and acetate dubplates preserved as permanent artefacts of UK Black British music history.',
    order_index: 5,
  },
];

export const DEFAULT_HERITAGE_MILESTONES: Omit<HeritageMilestoneData, 'id'>[] = [
  {
    year_badge: "'91",
    title: 'Joined Kool FM 94.5 Core',
    description: 'Broadcasting weekly sets over London from Hackney and Bow rooftop pirate rigs.',
    color: 'amber',
    order_index: 1,
  },
  {
    year_badge: "'95",
    title: 'Produced Jungle Anthem "Decibel"',
    description: 'Released on Kool FM 5th Anniversary compilation; played out across raves throughout the UK.',
    color: 'amber',
    order_index: 2,
  },
  {
    year_badge: "'23",
    title: 'Founded Vital Fest Series',
    description: 'Launched East London festival series uniting legends Brockie, Ragga Twins, and Jumpin Jack Frost.',
    color: 'amber',
    order_index: 3,
  },
  {
    year_badge: "'26",
    title: 'V&A Museum Archival Recognition',
    description: 'Permanently recognised for cultural contributions to British music history with museum exhibition loans at V&A East.',
    color: 'cyan',
    order_index: 4,
  },
];

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;
let lastServerTimestamp: string = '';
let isSavingToServer: boolean = false;

// Listeners for reactive updates
type DbListener = () => void;
const listeners = new Set<DbListener>();

export function subscribeDb(listener: DbListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in DB listener:', e);
    }
  });
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

export function getServerSaveRejection() {
  return null;
}

/**
 * Directly saves the SQLite database binary snapshot to the server disk in realtime.
 * NO localStorage, NO IndexedDB. The server is the single source of truth.
 */
export async function saveDatabaseToStorage(db: Database, customTimestamp?: string): Promise<boolean> {
  try {
    isSavingToServer = true;
    const data = db.export();
    const b64 = uint8ArrayToBase64(data);
    const timestamp = customTimestamp || new Date().toISOString();

    const res = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        databaseBase64: b64,
        timestamp,
        clientDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-client',
      }),
    });

    if (res.ok) {
      lastServerTimestamp = timestamp;
      return true;
    } else {
      console.error('[Server Save Error]', res.status, await res.text());
      return false;
    }
  } catch (err) {
    console.error('Failed to save SQLite to server:', err);
    return false;
  } finally {
    isSavingToServer = false;
  }
}

export async function forceSaveToServer(): Promise<{ ok: boolean; status: number; error?: string }> {
  if (!dbInstance) return { ok: false, status: 0, error: 'Database not initialized' };
  const ok = await saveDatabaseToStorage(dbInstance);
  return { ok, status: ok ? 200 : 500 };
}

export async function syncDatabaseToServer(b64: string, customTimestamp?: string) {
  if (dbInstance) {
    return await saveDatabaseToStorage(dbInstance, customTimestamp);
  }
  return false;
}

async function loadSqlWasmBinary(): Promise<ArrayBuffer | undefined> {
  const sources = [
    '/sql-wasm.wasm',
    'https://cdn.jsdelivr.net/npm/sql.js@1.15.0/dist/sql-wasm.wasm',
    'https://unpkg.com/sql.js@1.15.0/dist/sql-wasm.wasm',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.15.0/sql-wasm.wasm',
  ];

  for (const src of sources) {
    try {
      const res = await fetch(src);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer && buffer.byteLength > 0) {
          return buffer;
        }
      }
    } catch {}
  }
  return undefined;
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    let SQL: any;
    try {
      const wasmBinary = await loadSqlWasmBinary();
      if (wasmBinary) {
        SQL = await initSqlJs({ wasmBinary });
      } else {
        SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
      }
    } catch (e) {
      SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    }

    // Always fetch directly from server (authoritative single source of truth)
    let serverBase64: string | null = null;
    let serverUpdatedAt: string = '';
    try {
      const res = await fetch('/api/db/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.exists && json.databaseBase64) {
          serverBase64 = json.databaseBase64;
          serverUpdatedAt = json.meta?.updatedAt || '';
        }
      }
    } catch (e) {
      console.warn('Could not query server DB state:', e);
    }

    if (serverBase64) {
      try {
        const u8 = base64ToUint8Array(serverBase64);
        const serverDb: Database = new SQL.Database(u8);
        ensureSchemaMigrations(serverDb);
        dbInstance = serverDb;
        lastServerTimestamp = serverUpdatedAt;
        return serverDb;
      } catch (err) {
        console.error('Failed to parse server SQLite DB:', err);
      }
    }

    // Fresh Database if server had no DB file yet
    const freshDb: Database = new SQL.Database();
    initSchemaAndSeeds(freshDb);
    dbInstance = freshDb;
    await saveDatabaseToStorage(freshDb);
    return freshDb;
  })();

  return initPromise;
}

export async function refreshDatabaseFromServer(): Promise<boolean> {
  if (isSavingToServer) return false;
  try {
    const res = await fetch('/api/db/state', { cache: 'no-store' });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json.exists || !json.databaseBase64) return false;

    const u8 = base64ToUint8Array(json.databaseBase64);
    const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    const newDb = new SQL.Database(u8);
    ensureSchemaMigrations(newDb);
    dbInstance = newDb;
    lastServerTimestamp = json.meta?.updatedAt || '';
    notifyListeners();
    return true;
  } catch (err) {
    return false;
  }
}

const DEFAULT_SITE_MEDIA: Array<[string, string, string, string, string, string]> = [
  [
    'hero_image',
    'Hero Section',
    'Main Hero Turntable Showcase',
    'Primary visual of DJ Ital at the Technics SL-1210 turntables featured above the fold in the hero console.',
    '/images/dj_ital_hero_1790112374509.jpg',
    '/images/dj_ital_hero_1790112374509.jpg',
  ],
  [
    'va_museum_image',
    'Heritage & V&A Museum',
    'V&A Museum Archival Display',
    'Official archival exhibition loan of DJ Ital 1990s flight jacket and flyers recognised by the Victoria and Albert Museum.',
    '/images/va_museum_exhibition_1790112416279.jpg',
    '/images/va_museum_exhibition_1790112416279.jpg',
  ],
  [
    'vital_fest_banner',
    'Vital Fest & Events',
    'Vital Fest Sound System Crowd',
    'High-energy crowd and sound system atmosphere at The Hackney Social during Vital Fest.',
    '/images/vital_fest_crowd_1790112387611.jpg',
    '/images/vital_fest_crowd_1790112387611.jpg',
  ],
  [
    'kool_fm_vintage_image',
    'Pirate Radio Archives',
    'Kool FM 1990s Studio Setup',
    'Original Technics 1200 turntables and acetate dubplates from the Kool FM studio era.',
    '/images/kool_fm_vintage_1790112400005.jpg',
    '/images/kool_fm_vintage_1790112400005.jpg',
  ],
  [
    'vinyl_acetate_image',
    'Dubplates & Studio',
    '10" Acetate Dubplate Cutting Session',
    'Original 10-inch acetate dubplate of "Decibel" spinning on Technics 1210 turntable.',
    '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    '/images/vinyl_dubplate_acetate_1790113879360.jpg',
  ],
  [
    'hackney_rooftop_image',
    'Pirate Radio Heritage',
    'Hackney Rooftop Transmitter Aerial',
    'FM dipole transmission aerial mounted on high-rise Hackney council estate overlooking London at twilight.',
    '/images/hackney_pirate_radio_1790113898507.jpg',
    '/images/hackney_pirate_radio_1790113898507.jpg',
  ],
  [
    'doc_ep1_thumbnail',
    'Documentary Series',
    'Episode 1: Rooftops & Airwaves',
    'Thumbnail poster for Episode 1: Pirate radio inception atop East London council towers.',
    '/images/hackney_pirate_radio_1790113898507.jpg',
    '/images/hackney_pirate_radio_1790113898507.jpg',
  ],
  [
    'doc_ep2_thumbnail',
    'Documentary Series',
    'Episode 2: Dubplate Culture & Decibel',
    'Thumbnail poster for Episode 2: Vintage hardware samplers and cutting acetate dubplates.',
    '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    '/images/vinyl_dubplate_acetate_1790113879360.jpg',
  ],
  [
    'doc_ep3_thumbnail',
    'Documentary Series',
    'Episode 3: Vital Fest Genesis',
    'Thumbnail poster for Episode 3: Protecting East London grassroots sound system heritage.',
    '/images/vital_fest_crowd_1790112387611.jpg',
    '/images/vital_fest_crowd_1790112387611.jpg',
  ],
  [
    'doc_ep4_thumbnail',
    'Documentary Series',
    'Episode 4: V&A Museum Recognition',
    'Thumbnail poster for Episode 4: 35 years culminating in national museum archival honours.',
    '/images/va_museum_exhibition_1790112416279.jpg',
    '/images/va_museum_exhibition_1790112416279.jpg',
  ],
];

function addColumnIfNotExists(db: Database, table: string, column: string, def: string) {
  try {
    const info = db.exec(`PRAGMA table_info(${table})`);
    if (info.length > 0 && info[0].values) {
      const exists = info[0].values.some((row) => row[1] === column);
      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
      }
    }
  } catch (err) {
    console.warn(`Could not add column ${column} to ${table}:`, err);
  }
}

export function ensureSchemaMigrations(db: Database) {
  try {
    // Check if site_media exists
    db.run(`
      CREATE TABLE IF NOT EXISTS site_media (
        key TEXT PRIMARY KEY,
        section TEXT NOT NULL,
        label TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        default_url TEXT NOT NULL,
        updated_at TEXT
      );
    `);

    db.run('CREATE TABLE IF NOT EXISTS _system_meta (key TEXT PRIMARY KEY, value TEXT);');
    const isSeededRes = db.exec("SELECT value FROM _system_meta WHERE key = 'initial_seed'");
    const isSeeded = isSeededRes.length > 0 && isSeededRes[0].values.length > 0 && isSeededRes[0].values[0][0] === 'completed';

    // Ensure all default site media rows exist only on initial setup
    if (!isSeeded) {
      const now = new Date().toISOString();
      for (const m of DEFAULT_SITE_MEDIA) {
        const exists = db.exec(`SELECT key FROM site_media WHERE key = '${m[0]}'`);
        if (exists.length === 0 || exists[0].values.length === 0) {
          db.run(
            `INSERT INTO site_media (key, section, label, description, image_url, default_url, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [m[0], m[1], m[2], m[3], m[4], m[5], now]
          );
        }
      }
    }

    // New tables
    db.run(`
      CREATE TABLE IF NOT EXISTS audio_mixes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        style TEXT NOT NULL,
        platform TEXT NOT NULL,
        embed_url TEXT NOT NULL,
        stream_url TEXT,
        duration TEXT,
        description TEXT,
        is_featured INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration TEXT,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author_name TEXT NOT NULL,
        role_venue TEXT NOT NULL,
        avatar_url TEXT,
        rating INTEGER DEFAULT 5,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS venue_logos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        logo_text TEXT,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        source TEXT DEFAULT 'Website'
      );

      CREATE TABLE IF NOT EXISTS media_library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        file_name TEXT,
        file_type TEXT NOT NULL,
        mime_type TEXT,
        url TEXT NOT NULL,
        source TEXT,
        size_text TEXT,
        category TEXT DEFAULT 'General',
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_media_library_url ON media_library (url);

      -- Prune any duplicate media records preserving the latest entry
      DELETE FROM media_library WHERE id NOT IN (
        SELECT MAX(id) FROM media_library GROUP BY url
      );

      CREATE TABLE IF NOT EXISTS deleted_media_urls (
        url TEXT PRIMARY KEY,
        deleted_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin_auth (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_login_at TEXT
      );

      CREATE TABLE IF NOT EXISTS heritage_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        badge_text TEXT,
        subbadge_text TEXT,
        heading TEXT,
        description TEXT,
        va_image TEXT,
        va_image_alt TEXT,
        plaque_title TEXT,
        plaque_tag TEXT,
        plaque_description TEXT,
        residency_label TEXT,
        residency_title TEXT,
        residency_badge TEXT,
        residency_badge_color TEXT,
        provenance_tag TEXT,
        provenance_heading TEXT,
        lead_paragraph TEXT,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS heritage_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icon TEXT NOT NULL DEFAULT 'radio',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'amber',
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS heritage_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tab_label TEXT NOT NULL,
        title TEXT NOT NULL,
        period TEXT NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS heritage_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_badge TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'amber',
        order_index INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS documentary_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        badge_text TEXT,
        subbadge_text TEXT,
        heading TEXT,
        description TEXT,
        youtube_button_text TEXT,
        youtube_series_url TEXT,
        show_youtube_button INTEGER DEFAULT 1,
        is_section_visible INTEGER DEFAULT 1,
        updated_at TEXT
      );
    `);

    try {
      const authCount = db.exec('SELECT count(*) FROM admin_auth');
      if (authCount.length === 0 || authCount[0].values[0][0] === 0) {
        db.run(
          "INSERT OR REPLACE INTO admin_auth (id, password_hash, password_salt, updated_at) VALUES (1, '1845f709f6247f313f25e4c9442e75fdba3354dfe4dd3d00e59b5e591025af81', 'ital_salt_2026', '2026-10-08T00:00:00.000Z')"
        );
      }
    } catch {
      // ignore
    }

    seedHeritageTablesIfEmpty(db, false);

    // Ensure documentary table columns exist before backfilling
    addColumnIfNotExists(db, 'documentary', 'order_index', 'INTEGER DEFAULT 0');
    addColumnIfNotExists(db, 'documentary', 'thumbnail_url', "TEXT DEFAULT '/images/dj_ital_hero_1790112374509.jpg'");
    addColumnIfNotExists(db, 'documentary', 'badge_label', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'documentary', 'action_button_text', "TEXT DEFAULT 'WATCH ARCHIVAL TAPE'");

    try {
      db.run('UPDATE documentary SET order_index = episode_number WHERE order_index IS NULL OR order_index = 0');
    } catch {}

    try {
      const existingDocs = db.exec('SELECT id, episode_number, thumbnail_url FROM documentary');
      if (existingDocs.length > 0 && existingDocs[0].values) {
        const defaultThumbs: Record<number, string> = {
          1: '/images/hackney_pirate_radio_1790113898507.jpg',
          2: '/images/vinyl_dubplate_acetate_1790113879360.jpg',
          3: '/images/vital_fest_crowd_1790112387611.jpg',
          4: '/images/va_museum_exhibition_1790112416279.jpg',
        };
        for (const row of existingDocs[0].values) {
          const id = row[0];
          const epNum = Number(row[1]);
          const currentThumb = row[2];
          if (!currentThumb) {
            const thumb = defaultThumbs[epNum] || '/images/dj_ital_hero_1790112374509.jpg';
            const badge = `EPISODE 0${epNum}`;
            db.run(
              'UPDATE documentary SET thumbnail_url = ?, badge_label = COALESCE(badge_label, ?), action_button_text = COALESCE(action_button_text, ?), order_index = COALESCE(order_index, ?) WHERE id = ?',
              [thumb, badge, 'WATCH ARCHIVAL TAPE', epNum, id]
            );
          }
        }
      }
    } catch (e) {
      console.warn('Error backfilling documentary details:', e);
    }

    // Profile table column migrations
    addColumnIfNotExists(db, 'profile', 'genres', "TEXT DEFAULT 'Jungle · Drum & Bass · Reggae · Dub · UK Bass'");
    addColumnIfNotExists(db, 'profile', 'regions_covered', "TEXT DEFAULT 'UK, Europe & International / Worldwide'");
    addColumnIfNotExists(db, 'profile', 'direct_email', "TEXT DEFAULT 'djital.booking@gmail.com'");
    addColumnIfNotExists(db, 'profile', 'whatsapp_number', "TEXT DEFAULT '+44 7900 123456'");
    addColumnIfNotExists(db, 'profile', 'whatsapp_message', "TEXT DEFAULT 'Hi DJ Ital, I would like to enquire about booking you for an upcoming event.'");
    addColumnIfNotExists(db, 'profile', 'shopify_merch_url', "TEXT DEFAULT 'https://vitalfest.myshopify.com'");
    addColumnIfNotExists(db, 'profile', 'merch_badge_text', "TEXT DEFAULT 'Official Vital Fest Merch & Vinyl Store'");
    addColumnIfNotExists(db, 'profile', 'dejavu_stream_url', "TEXT DEFAULT 'https://dejavufm.com'");
    addColumnIfNotExists(db, 'profile', 'is_live_on_air', "INTEGER DEFAULT 0");
    addColumnIfNotExists(db, 'profile', 'live_show_title', "TEXT DEFAULT 'The Ital Show - Live on DejaVu FM'");
    addColumnIfNotExists(db, 'profile', 'key_venues', "TEXT DEFAULT 'Fabric London, The Hackney Social, Ministry of Sound, The Yard Theatre, Boomtown Fair'");
    addColumnIfNotExists(db, 'profile', 'festivals', "TEXT DEFAULT 'Vital Fest, Boomtown Fair, Outlook, Glastonbury (Silver Hayes)'");
    addColumnIfNotExists(db, 'profile', 'tech_rider_text', "TEXT DEFAULT '2x Technics SL-1210 MK2 Turntables (or 2x Pioneer CDJ-3000), 1x Pioneer DJM-900NXS2 mixer, 2x High-power stereo booth monitor wedges, 1x Shure SM58 microphone for host MC.'");
    addColumnIfNotExists(db, 'profile', 'social_instagram', "TEXT DEFAULT 'https://instagram.com/djital'");
    addColumnIfNotExists(db, 'profile', 'social_facebook', "TEXT DEFAULT 'https://facebook.com/djital'");
    addColumnIfNotExists(db, 'profile', 'social_youtube', "TEXT DEFAULT 'https://youtube.com/@djital'");
    addColumnIfNotExists(db, 'profile', 'social_tiktok', "TEXT DEFAULT 'https://tiktok.com/@djital'");
    addColumnIfNotExists(db, 'profile', 'social_mixcloud', "TEXT DEFAULT 'https://mixcloud.com/djital'");
    addColumnIfNotExists(db, 'profile', 'social_soundcloud', "TEXT DEFAULT 'https://soundcloud.com/djital'");
    addColumnIfNotExists(db, 'profile', 'social_spotify', "TEXT DEFAULT 'https://open.spotify.com'");
    addColumnIfNotExists(db, 'profile', 'epk_pdf_url', "TEXT DEFAULT '/assets/DJ_ITAL_Official_EPK_2026.pdf'");
    addColumnIfNotExists(db, 'profile', 'epk_logo_png', "TEXT DEFAULT '/images/vital_fest_logo.png'");
    addColumnIfNotExists(db, 'profile', 'epk_logo_svg', "TEXT DEFAULT '/images/vital_fest_logo.png'");
    addColumnIfNotExists(db, 'profile', 'epk_press_photo_landscape', "TEXT DEFAULT '/images/dj_ital_hero_1790112374509.jpg'");
    addColumnIfNotExists(db, 'profile', 'epk_press_photo_portrait', "TEXT DEFAULT '/images/kool_fm_vintage_1790112400005.jpg'");
    addColumnIfNotExists(db, 'profile', 'bg_style', "TEXT DEFAULT 'subtle-motion'");
    addColumnIfNotExists(db, 'profile', 'bg_speed', "TEXT DEFAULT 'medium'");
    addColumnIfNotExists(db, 'profile', 'slideshow_enabled', "INTEGER DEFAULT 1");
    addColumnIfNotExists(db, 'profile', 'slideshow_interval', "INTEGER DEFAULT 6");
    addColumnIfNotExists(db, 'profile', 'slideshow_images', "TEXT DEFAULT '[\"/images/dj_ital_hero_1790112374509.jpg\",\"/images/vital_fest_crowd_1790112387611.jpg\",\"/images/kool_fm_vintage_1790112400005.jpg\",\"/images/va_museum_exhibition_1790112416279.jpg\"]'");
    addColumnIfNotExists(db, 'profile', 'color_scheme', "TEXT DEFAULT 'amber'");
    addColumnIfNotExists(db, 'profile', 'font_family_preset', "TEXT DEFAULT 'syne'");
    addColumnIfNotExists(db, 'profile', 'custom_accent_color', "TEXT DEFAULT '#f59e0b'");
    addColumnIfNotExists(db, 'profile', 'body_font_preset', "TEXT DEFAULT 'jakarta'");
    addColumnIfNotExists(db, 'profile', 'logo_url', "TEXT DEFAULT '/images/vital_fest_logo.png'");
    addColumnIfNotExists(db, 'profile', 'navbar_subtitle', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'profile', 'subtitle', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'profile', 'stream_url', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'profile', 'hero_stream_url', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'profile', 'main_player_stream_url', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'profile', 'signature_bpm', "INTEGER DEFAULT 164");
    addColumnIfNotExists(db, 'profile', 'brand_slogan', "TEXT DEFAULT 'DjItal 164bpm'");

    // Events table column migrations
    addColumnIfNotExists(db, 'events', 'flyer_image', "TEXT DEFAULT '/images/vital_fest_crowd_1790112387611.jpg'");

    // Bookings table column migrations
    addColumnIfNotExists(db, 'bookings', 'client_phone', "TEXT DEFAULT ''");
    addColumnIfNotExists(db, 'bookings', 'set_length', "TEXT DEFAULT '90 min'");
    addColumnIfNotExists(db, 'bookings', 'venue_location', "TEXT DEFAULT ''");

    // Populate default seeds if tables are empty
    seedNewTablesIfEmpty(db, false);
    seedDocumentariesIfEmpty(db, false);
    db.run("INSERT OR REPLACE INTO _system_meta (key, value) VALUES ('initial_seed', 'completed');");

    // Sync all existing app images, logos, documents, and media into media_library
    syncAppMediaToLibrary(db);

    // Ensure custom emails are kept in sync if user modified one of them in dashboard
    try {
      db.run(`
        UPDATE profile
        SET direct_email = booking_email
        WHERE (direct_email = 'djital@mail.com' OR direct_email IS NULL OR direct_email = '')
          AND booking_email IS NOT NULL AND booking_email != '' AND booking_email != 'djital@mail.com';
      `);
      db.run(`
        UPDATE profile
        SET booking_email = direct_email
        WHERE (booking_email = 'djital@mail.com' OR booking_email IS NULL OR booking_email = '')
          AND direct_email IS NOT NULL AND direct_email != '' AND direct_email != 'djital@mail.com';
      `);
    } catch (e) {
      // ignore
    }

    // Migrate any legacy /src/assets/images paths to /images for Safari & static builds
    try {
      db.run(`
        UPDATE site_media
        SET image_url = REPLACE(image_url, '/src/assets/images/', '/images/'),
            default_url = REPLACE(default_url, '/src/assets/images/', '/images/')
        WHERE image_url LIKE '%/src/assets/images/%' OR default_url LIKE '%/src/assets/images/%';
      `);
      db.run(`
        UPDATE gallery
        SET image_url = REPLACE(image_url, '/src/assets/images/', '/images/')
        WHERE image_url LIKE '%/src/assets/images/%';
      `);
      db.run(`
        UPDATE events
        SET flyer_image = '/images/vital_fest_crowd_1790112387611.jpg'
        WHERE flyer_image IS NULL OR flyer_image = '';
      `);

      // UK Grammar & Terminology Harmonization for existing SQLite records
      db.run(`
        UPDATE profile
        SET bio_short = REPLACE(REPLACE(REPLACE(REPLACE(bio_short, 'recognized', 'recognised'), 'Recognized', 'Recognised'), 'memorialized', 'memorialised'), 'artifact', 'artefact'),
            bio_full = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(bio_full, 'recognized', 'recognised'), 'Recognized', 'Recognised'), 'memorialized', 'memorialised'), 'Memorialized', 'Memorialised'), 'artifact', 'artefact'), 'artifacts', 'artefacts'),
            whatsapp_message = REPLACE(whatsapp_message, 'inquire', 'enquire');
      `);
      db.run(`
        UPDATE testimonials
        SET quote = REPLACE(REPLACE(quote, 'organizer', 'organiser'), 'organizers', 'organisers');
      `);
      db.run(`
        UPDATE releases
        SET audio_theme = REPLACE(audio_theme, 'synthesizer', 'synthesiser'),
            description = REPLACE(description, 'synthesizer', 'synthesiser');
      `);
      db.run(`
        UPDATE gallery
        SET caption = REPLACE(caption, 'artifact', 'artefact');
      `);
      db.run(`
        UPDATE site_media
        SET description = REPLACE(description, 'recognized', 'recognised');
      `);
    } catch {
      // Ignore migration errors if tables are empty
    }
  } catch (err) {
    console.error('Migration error in ensureSchemaMigrations:', err);
  }
}

export function seedHeritageTablesIfEmpty(db: Database, force = false) {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS heritage_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        badge_text TEXT,
        subbadge_text TEXT,
        heading TEXT,
        description TEXT,
        va_image TEXT,
        va_image_alt TEXT,
        plaque_title TEXT,
        plaque_tag TEXT,
        plaque_description TEXT,
        residency_label TEXT,
        residency_title TEXT,
        residency_badge TEXT,
        residency_badge_color TEXT,
        provenance_tag TEXT,
        provenance_heading TEXT,
        lead_paragraph TEXT,
        updated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS heritage_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icon TEXT NOT NULL DEFAULT 'radio',
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'amber',
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS heritage_chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tab_label TEXT NOT NULL,
        title TEXT NOT NULL,
        period TEXT NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS heritage_milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year_badge TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT 'amber',
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS documentary_settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        badge_text TEXT,
        subbadge_text TEXT,
        heading TEXT,
        description TEXT,
        youtube_button_text TEXT,
        youtube_series_url TEXT,
        show_youtube_button INTEGER DEFAULT 1,
        is_section_visible INTEGER DEFAULT 1,
        updated_at TEXT
      );
    `);

    if (force) {
      db.run('DELETE FROM heritage_settings;');
      db.run('DELETE FROM heritage_credentials;');
      db.run('DELETE FROM heritage_chapters;');
      db.run('DELETE FROM heritage_milestones;');
      db.run('DELETE FROM documentary_settings;');
    }

    const heritageCount = db.exec('SELECT count(*) FROM heritage_settings');
    if (heritageCount.length === 0 || Number(heritageCount[0].values[0][0]) === 0) {
      db.run(
        `INSERT OR REPLACE INTO heritage_settings (
          id, badge_text, subbadge_text, heading, description,
          va_image, va_image_alt, plaque_title, plaque_tag, plaque_description,
          residency_label, residency_title, residency_badge, residency_badge_color,
          provenance_tag, provenance_heading, lead_paragraph, updated_at
        ) VALUES (
          1, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )`,
        [
          DEFAULT_HERITAGE_SETTINGS.badge_text,
          DEFAULT_HERITAGE_SETTINGS.subbadge_text,
          DEFAULT_HERITAGE_SETTINGS.heading,
          DEFAULT_HERITAGE_SETTINGS.description,
          DEFAULT_HERITAGE_SETTINGS.va_image,
          DEFAULT_HERITAGE_SETTINGS.va_image_alt,
          DEFAULT_HERITAGE_SETTINGS.plaque_title,
          DEFAULT_HERITAGE_SETTINGS.plaque_tag,
          DEFAULT_HERITAGE_SETTINGS.plaque_description,
          DEFAULT_HERITAGE_SETTINGS.residency_label,
          DEFAULT_HERITAGE_SETTINGS.residency_title,
          DEFAULT_HERITAGE_SETTINGS.residency_badge,
          DEFAULT_HERITAGE_SETTINGS.residency_badge_color,
          DEFAULT_HERITAGE_SETTINGS.provenance_tag,
          DEFAULT_HERITAGE_SETTINGS.provenance_heading,
          DEFAULT_HERITAGE_SETTINGS.lead_paragraph,
          new Date().toISOString(),
        ]
      );
    }

    const credsCount = db.exec('SELECT count(*) FROM heritage_credentials');
    if (credsCount.length === 0 || Number(credsCount[0].values[0][0]) === 0) {
      for (const c of DEFAULT_HERITAGE_CREDENTIALS) {
        db.run(
          'INSERT INTO heritage_credentials (icon, title, description, color, order_index) VALUES (?, ?, ?, ?, ?)',
          [c.icon, c.title, c.description, c.color, c.order_index]
        );
      }
    }

    const chapsCount = db.exec('SELECT count(*) FROM heritage_chapters');
    if (chapsCount.length === 0 || Number(chapsCount[0].values[0][0]) === 0) {
      for (const ch of DEFAULT_HERITAGE_CHAPTERS) {
        db.run(
          'INSERT INTO heritage_chapters (tab_label, title, period, content, order_index) VALUES (?, ?, ?, ?, ?)',
          [ch.tab_label, ch.title, ch.period, ch.content, ch.order_index]
        );
      }
    }

    const milesCount = db.exec('SELECT count(*) FROM heritage_milestones');
    if (milesCount.length === 0 || Number(milesCount[0].values[0][0]) === 0) {
      for (const m of DEFAULT_HERITAGE_MILESTONES) {
        db.run(
          'INSERT INTO heritage_milestones (year_badge, title, description, color, order_index) VALUES (?, ?, ?, ?, ?)',
          [m.year_badge, m.title, m.description, m.color, m.order_index]
        );
      }
    }

    const docSettingsCount = db.exec('SELECT count(*) FROM documentary_settings');
    if (docSettingsCount.length === 0 || Number(docSettingsCount[0].values[0][0]) === 0) {
      db.run(
        `INSERT OR REPLACE INTO documentary_settings (
          id, badge_text, subbadge_text, heading, description,
          youtube_button_text, youtube_series_url, show_youtube_button, is_section_visible, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
        [
          DEFAULT_DOCUMENTARY_SETTINGS.badge_text,
          DEFAULT_DOCUMENTARY_SETTINGS.subbadge_text,
          DEFAULT_DOCUMENTARY_SETTINGS.heading,
          DEFAULT_DOCUMENTARY_SETTINGS.description,
          DEFAULT_DOCUMENTARY_SETTINGS.youtube_button_text,
          DEFAULT_DOCUMENTARY_SETTINGS.youtube_series_url,
          new Date().toISOString(),
        ]
      );
    }
  } catch (err) {
    console.warn('Error in seedHeritageTablesIfEmpty:', err);
  }
}

export function seedDocumentariesIfEmpty(db: Database, force = false) {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS documentary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        episode_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        duration TEXT,
        description TEXT,
        youtube_url TEXT,
        topics TEXT,
        thumbnail_url TEXT DEFAULT '/images/dj_ital_hero_1790112374509.jpg',
        badge_label TEXT DEFAULT '',
        action_button_text TEXT DEFAULT 'WATCH ARCHIVAL TAPE',
        order_index INTEGER DEFAULT 0
      );
    `);

    if (force) {
      db.run('DELETE FROM documentary;');
    }

    const check = db.exec('SELECT count(*) FROM documentary');
    if (check.length === 0 || Number(check[0].values[0][0]) === 0) {
      const docs = [
        [
          1,
          'Rooftops & Airwaves: The Kool FM Inception',
          '22 min',
          'How a group of passionate East London music pioneers rigged aerials atop Hackney council towers to broadcast the revolutionary sounds of jungle drum and bass to thousands.',
          'https://www.youtube.com/@djital',
          'Pirate Radio History, Hackney Towers, Transmitter Tech',
          '/images/hackney_pirate_radio_1790113898507.jpg',
          'EPISODE 01',
          'WATCH ARCHIVAL TAPE',
          1,
        ],
        [
          2,
          'The Dubplate Culture & Producing "Decibel"',
          '19 min',
          'First-hand breakdown of how "Decibel" was composed on vintage hardware samplers, cut onto fresh acetate, and road-tested at landmark raves.',
          'https://www.youtube.com/@djital',
          'Music Production, Dubplate Cutting, Sound Clash',
          '/images/vinyl_dubplate_acetate_1790113879360.jpg',
          'EPISODE 02',
          'WATCH ARCHIVAL TAPE',
          2,
        ],
        [
          3,
          'Vital Fest: Protecting East London Sound Heritage',
          '26 min',
          'The genesis of Vital Fest, uniting original jungle originators with the next generation of ravers in grassroots East London venues.',
          'https://www.youtube.com/@djital',
          'Vital Fest, Hackney Social, Community Culture',
          '/images/vital_fest_crowd_1790112387611.jpg',
          'EPISODE 03',
          'WATCH ARCHIVAL TAPE',
          3,
        ],
        [
          4,
          'From Underground Pirate to The V&A Museum',
          '18 min',
          'Reflections on 35 years of dedication to UK jungle, culminating in national cultural recognition at the Victoria and Albert Museum in 2026.',
          'https://www.youtube.com/@djital',
          'V&A Museum Exhibition, Legacy, Cultural Preservation',
          '/images/va_museum_exhibition_1790112416279.jpg',
          'EPISODE 04',
          'WATCH ARCHIVAL TAPE',
          4,
        ],
      ];
      for (const d of docs) {
        db.run(
          `INSERT INTO documentary (episode_number, title, duration, description, youtube_url, topics, thumbnail_url, badge_label, action_button_text, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          d
        );
      }
    }
  } catch (err) {
    console.warn('Error in seedDocumentariesIfEmpty:', err);
  }
}

export function seedNewTablesIfEmpty(db: Database, force = false) {
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS audio_mixes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        style TEXT NOT NULL,
        platform TEXT NOT NULL,
        embed_url TEXT NOT NULL,
        stream_url TEXT,
        duration TEXT,
        description TEXT,
        is_featured INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        video_url TEXT NOT NULL,
        thumbnail_url TEXT,
        duration TEXT,
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote TEXT NOT NULL,
        author_name TEXT NOT NULL,
        role_venue TEXT NOT NULL,
        avatar_url TEXT,
        rating INTEGER DEFAULT 5,
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS venue_logos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        logo_text TEXT,
        order_index INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL,
        source TEXT DEFAULT 'Website'
      );
    `);

    if (force) {
      db.run('DELETE FROM audio_mixes;');
      db.run('DELETE FROM videos;');
      db.run('DELETE FROM testimonials;');
      db.run('DELETE FROM venue_logos;');
      db.run('DELETE FROM newsletter_subscribers;');
    }

    const mixesCheck = db.exec('SELECT COUNT(*) FROM audio_mixes');
    if (mixesCheck.length === 0 || Number(mixesCheck[0].values[0][0]) === 0) {
      const mixes = [
        [
          'Kool FM 94.5 Prime Time Pirate Broadcast (1994)',
          'Oldskool Tape Archive',
          'SoundCloud',
          'https://soundcloud.com/djital/kool-fm-1994-tape-archive',
          'https://soundcloud.com',
          '58:40',
          'Authentic high-rise Hackney rooftop broadcast with MC shouts, tape hiss, and exclusive VIP dubplates.',
          1,
          1,
        ],
        [
          'Vital Fest Sound System Session 2026',
          'Jungle / D&B',
          'Mixcloud',
          'https://www.mixcloud.com/djital/vital-fest-sound-system-session-2026/',
          'https://www.mixcloud.com',
          '74:15',
          'Live recording from The Hackney Social featuring 168 BPM foundation rollers and deep dub pressure.',
          1,
          2,
        ],
        [
          'Roots, Dub & Foundation Selections',
          'Reggae / Dub',
          'SoundCloud',
          'https://soundcloud.com/djital/roots-dub-foundation-session',
          'https://soundcloud.com',
          '62:30',
          'Heavyweight roots reggae, King Tubby steppers, and acoustic acetate roots leading into early jungle.',
          0,
          3,
        ],
        [
          'Decibel & Beyond: 90s Sub-Bass Masters',
          'UK Bass',
          'Mixcloud',
          'https://www.mixcloud.com/djital/decibel-beyond-90s-sub-bass-masters/',
          'https://www.mixcloud.com',
          '68:10',
          'Deep club showcase highlighting low-end sub-frequencies, timestretched breakbeats, and reese basslines.',
          1,
          4,
        ],
      ];
      for (const m of mixes) {
        db.run(
          `INSERT INTO audio_mixes (title, style, platform, embed_url, stream_url, duration, description, is_featured, order_index)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          m
        );
      }
    }

    const videosCheck = db.exec('SELECT COUNT(*) FROM videos');
    if (videosCheck.length === 0 || Number(videosCheck[0].values[0][0]) === 0) {
      const videos = [
        [
          'Vital Fest 2026 Main Stage Sound Clash Recap',
          'Event Recap',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          '/images/vital_fest_crowd_1790112387611.jpg',
          '03:45',
          1,
        ],
        [
          'DJ Ital Cutting 10" Acetate Dubplates in East London',
          'Live Set Clip',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          '/images/vinyl_dubplate_acetate_1790113879360.jpg',
          '02:18',
          2,
        ],
        [
          'Hackney Social Crowd Eruption during "Decibel" Drop',
          'Crowd Reaction',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          '/images/dj_ital_hero_1790112374509.jpg',
          '01:50',
          3,
        ],
      ];
      for (const v of videos) {
        db.run(
          `INSERT INTO videos (title, category, video_url, thumbnail_url, duration, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          v
        );
      }
    }

    const testimonialsCheck = db.exec('SELECT COUNT(*) FROM testimonials');
    if (testimonialsCheck.length === 0 || Number(testimonialsCheck[0].values[0][0]) === 0) {
      const testimonials = [
        [
          'DJ Ital embodies the true roots and soul of UK sound system culture. His sets at The Hackney Social bring a raw energy and authenticity that modern nights rarely touch.',
          'Marcus Vance',
          'Head of Programming, The Hackney Social',
          '/images/dj_ital_hero_1790112374509.jpg',
          5,
          1,
        ],
        [
          'A true pioneer whose vinyl dubplate mastery and Kool FM legacy continue to educate and electrify dancefloors worldwide.',
          'Sarah Jenkins',
          'Boomtown Fair Sub-Bass Stage Curator',
          '',
          5,
          2,
        ],
        [
          'Documenting DJ Ital\'s contribution for our national archive was vital. His impact on Black British music culture and early jungle breakbeat innovation is undeniable.',
          'Dr. Julian Thorne',
          'Guest Curator, Victoria & Albert Museum (V&A)',
          '',
          5,
          3,
        ],
        [
          'When Ital drops "Decibel" on original 10-inch acetate, the bass hits different. Legendary selector.',
          'Uncle Dugs',
          'Rave Heritage Broadcaster',
          '',
          5,
          4,
        ],
      ];
      for (const t of testimonials) {
        db.run(
          `INSERT INTO testimonials (quote, author_name, role_venue, avatar_url, rating, order_index)
           VALUES (?, ?, ?, ?, ?, ?)`,
          t
        );
      }
    }

    const venuesCheck = db.exec('SELECT COUNT(*) FROM venue_logos');
    if (venuesCheck.length === 0 || Number(venuesCheck[0].values[0][0]) === 0) {
      const venues = [
        ['Fabric London', 'Farringdon, London', 'FABRIC', 1],
        ['V&A Museum', 'South Kensington, London', 'V&A', 2],
        ['The Hackney Social', 'Bohemia Place, Hackney', 'HACKNEY SOCIAL', 3],
        ['Boomtown Fair', 'Matterley Estate, Winchester', 'BOOMTOWN', 4],
        ['Ministry of Sound', 'Elephant & Castle, London', 'MINISTRY OF SOUND', 5],
        ['The Yard Theatre', 'Olympic Park, London E9', 'THE YARD', 6],
        ['Kool FM 94.5', 'East London Pirate Radio', 'KOOL FM 94.5', 7],
        ['Dejavu FM', 'London', 'DEJAVU FM', 8],
      ];
      for (const vl of venues) {
        db.run(
          `INSERT INTO venue_logos (name, location, logo_text, order_index)
           VALUES (?, ?, ?, ?)`,
          vl
        );
      }
    }

    const newsletterCheck = db.exec('SELECT COUNT(*) FROM newsletter_subscribers');
    if (newsletterCheck.length === 0 || Number(newsletterCheck[0].values[0][0]) === 0) {
      db.run(
        `INSERT INTO newsletter_subscribers (email, created_at, source)
         VALUES ('archive.selector@vitalfest.co.uk', ?, 'Website Seed')`,
        [new Date().toISOString().replace('T', ' ').substring(0, 19)]
      );
    }
  } catch (err) {
    console.warn('Error seeding new tables:', err);
  }
}

function insertMediaIfNotExists(
  db: Database,
  item: {
    title: string;
    file_name?: string;
    file_type: string;
    mime_type?: string;
    url: string;
    source: string;
    category: string;
  }
) {
  try {
    const normUrl = item.file_type === 'image' ? normalizeImageUrl(item.url) : item.url;
    if (!normUrl) return;

    // Check if the user previously deleted this asset from the media library
    db.run(`CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT)`);
    const isDeleted = db.exec(`SELECT url FROM deleted_media_urls WHERE url = '${normUrl.replace(/'/g, "''")}'`);
    if (isDeleted.length > 0 && isDeleted[0].values.length > 0) {
      return; // Do not resurrect user-deleted media assets
    }

    const exists = db.exec(`SELECT id FROM media_library WHERE url = '${normUrl.replace(/'/g, "''")}'`);
    if (exists.length === 0 || exists[0].values.length === 0) {
      const now = new Date().toISOString();
      db.run(
        `INSERT INTO media_library (title, file_name, file_type, mime_type, url, source, size_text, category, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.title,
          item.file_name || normUrl.split('/').pop() || 'asset',
          item.file_type,
          item.mime_type || (item.file_type === 'document' ? 'application/pdf' : 'image/jpeg'),
          normUrl,
          item.source,
          item.file_type === 'document' ? 'PDF Document' : 'Standard Asset',
          item.category,
          `Synchronized from ${item.source}`,
          now,
          now,
        ]
      );
    }
  } catch (err) {
    console.warn('insertMediaIfNotExists error:', err);
  }
}

export function syncAppMediaToLibrary(db: Database) {
  try {
    // 1. Profile Logo, EPK PDF, and EPK Photos
    const profileRows = db.exec('SELECT logo_url, epk_logo_png, epk_pdf_url, epk_press_photo_landscape, epk_press_photo_portrait FROM profile LIMIT 1');
    if (profileRows.length > 0 && profileRows[0].values.length > 0) {
      const p = profileRows[0].values[0];
      const logo = p[0] || p[1] || '/images/vital_fest_logo.png';
      if (logo) {
        insertMediaIfNotExists(db, {
          title: 'Official Vital Fest Brand Logo',
          file_name: String(logo).split('/').pop() || 'vital_fest_logo.png',
          file_type: 'image',
          mime_type: 'image/png',
          url: String(logo),
          source: 'Brand Logo',
          category: 'Branding',
        });
      }
      if (p[2]) {
        insertMediaIfNotExists(db, {
          title: 'Official DJ Ital EPK Biography (PDF Document)',
          file_name: String(p[2]).split('/').pop() || 'DJ_ITAL_Official_EPK_2026.pdf',
          file_type: 'document',
          mime_type: 'application/pdf',
          url: String(p[2]),
          source: 'Press Kit (EPK)',
          category: 'Documents',
        });
      }
      if (p[3]) {
        insertMediaIfNotExists(db, {
          title: 'EPK Landscape Press Photo',
          file_name: String(p[3]).split('/').pop() || 'press_photo_landscape.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          url: String(p[3]),
          source: 'Press Kit (EPK)',
          category: 'Press Photos',
        });
      }
      if (p[4]) {
        insertMediaIfNotExists(db, {
          title: 'EPK Portrait / Studio Archive Photo',
          file_name: String(p[4]).split('/').pop() || 'press_photo_portrait.jpg',
          file_type: 'image',
          mime_type: 'image/jpeg',
          url: String(p[4]),
          source: 'Press Kit (EPK)',
          category: 'Press Photos',
        });
      }
    }

    // 2. Site Media slots
    const siteMediaRows = db.exec('SELECT key, label, image_url, section FROM site_media');
    if (siteMediaRows.length > 0) {
      for (const row of siteMediaRows[0].values) {
        const key = String(row[0]);
        const label = String(row[1]);
        const url = String(row[2]);
        const section = String(row[3]);
        insertMediaIfNotExists(db, {
          title: label,
          file_name: url.split('/').pop() || key,
          file_type: 'image',
          mime_type: 'image/jpeg',
          url,
          source: `Site Media (${section})`,
          category: 'Site Visuals',
        });
      }
    }

    // 3. Events Flyers
    const eventsRows = db.exec('SELECT title, flyer_image FROM events WHERE flyer_image IS NOT NULL');
    if (eventsRows.length > 0) {
      for (const row of eventsRows[0].values) {
        if (row[1]) {
          insertMediaIfNotExists(db, {
            title: `${row[0]} Event Flyer`,
            file_name: String(row[1]).split('/').pop(),
            file_type: 'image',
            mime_type: 'image/jpeg',
            url: String(row[1]),
            source: 'Vital Fest Events',
            category: 'Event Flyers',
          });
        }
      }
    }

    // 4. Gallery Images
    const galleryRows = db.exec('SELECT title, category, image_url FROM gallery');
    if (galleryRows.length > 0) {
      for (const row of galleryRows[0].values) {
        if (row[2]) {
          insertMediaIfNotExists(db, {
            title: String(row[0]),
            file_name: String(row[2]).split('/').pop(),
            file_type: 'image',
            mime_type: 'image/jpeg',
            url: String(row[2]),
            source: `Gallery (${row[1]})`,
            category: 'Gallery Archives',
          });
        }
      }
    }

    // 5. Default Essential Brand Assets
    insertMediaIfNotExists(db, {
      title: 'Vital Fest Alternative Mobile Lockup',
      file_name: 'vital_fest_mobile_logo.jpg',
      file_type: 'image',
      mime_type: 'image/jpeg',
      url: '/images/vital_fest_mobile_logo.jpg',
      source: 'Brand Assets',
      category: 'Branding',
    });
  } catch (err) {
    console.warn('syncAppMediaToLibrary error:', err);
  }
}

function initSchemaAndSeeds(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY,
      stage_name TEXT NOT NULL,
      real_name TEXT,
      tagline TEXT,
      origin TEXT,
      active_since TEXT,
      bio_short TEXT,
      bio_full TEXT,
      booking_agency TEXT,
      booking_email TEXT,
      va_recognition_year INTEGER,
      kool_fm_role TEXT,
      radio_show TEXT,
      genres TEXT,
      regions_covered TEXT,
      direct_email TEXT,
      whatsapp_number TEXT,
      whatsapp_message TEXT,
      shopify_merch_url TEXT,
      merch_badge_text TEXT,
      dejavu_stream_url TEXT,
      is_live_on_air INTEGER DEFAULT 0,
      live_show_title TEXT,
      key_venues TEXT,
      festivals TEXT,
      tech_rider_text TEXT,
      social_instagram TEXT,
      social_facebook TEXT,
      social_youtube TEXT,
      social_tiktok TEXT,
      social_mixcloud TEXT,
      social_soundcloud TEXT,
      social_spotify TEXT,
      epk_pdf_url TEXT,
      epk_logo_png TEXT,
      epk_logo_svg TEXT,
      epk_press_photo_landscape TEXT,
      epk_press_photo_portrait TEXT,
      bg_style TEXT,
      bg_speed TEXT,
      slideshow_enabled INTEGER DEFAULT 1,
      slideshow_interval INTEGER DEFAULT 6,
      slideshow_images TEXT,
      stream_url TEXT,
      hero_stream_url TEXT,
      main_player_stream_url TEXT,
      navbar_subtitle TEXT,
      subtitle TEXT,
      signature_bpm INTEGER DEFAULT 164,
      brand_slogan TEXT DEFAULT 'DjItal 164bpm'
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      venue TEXT NOT NULL,
      location TEXT NOT NULL,
      event_date TEXT NOT NULL,
      start_time TEXT,
      lineup TEXT,
      ticket_url TEXT,
      status TEXT DEFAULT 'Upcoming',
      price_text TEXT,
      is_featured INTEGER DEFAULT 0,
      flyer_image TEXT DEFAULT '/images/vital_fest_crowd_1790112387611.jpg'
    );

    CREATE TABLE IF NOT EXISTS releases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      release_year INTEGER NOT NULL,
      label TEXT,
      catalog_number TEXT,
      format TEXT,
      bpm INTEGER,
      audio_theme TEXT,
      stream_url TEXT,
      description TEXT,
      is_featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT,
      year TEXT,
      location TEXT,
      is_featured INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS documentary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      duration TEXT,
      description TEXT,
      youtube_url TEXT,
      topics TEXT,
      thumbnail_url TEXT DEFAULT '/images/dj_ital_hero_1790112374509.jpg',
      badge_label TEXT DEFAULT '',
      action_button_text TEXT DEFAULT 'WATCH ARCHIVAL TAPE',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      client_phone TEXT,
      event_type TEXT,
      target_date TEXT,
      venue_city TEXT,
      estimated_budget TEXT,
      set_length TEXT,
      message TEXT,
      status TEXT DEFAULT 'Pending',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      value TEXT NOT NULL,
      suffix TEXT,
      order_index INTEGER
    );

    CREATE TABLE IF NOT EXISTS site_media (
      key TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      image_url TEXT NOT NULL,
      default_url TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audio_mixes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      style TEXT NOT NULL,
      platform TEXT NOT NULL,
      embed_url TEXT NOT NULL,
      stream_url TEXT,
      duration TEXT,
      description TEXT,
      is_featured INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      video_url TEXT NOT NULL,
      thumbnail_url TEXT,
      duration TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote TEXT NOT NULL,
      author_name TEXT NOT NULL,
      role_venue TEXT NOT NULL,
      avatar_url TEXT,
      rating INTEGER DEFAULT 5,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS venue_logos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT,
      logo_text TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL,
      source TEXT DEFAULT 'Website'
    );
  `);

  // Seed Profile
  db.run(
    `INSERT INTO profile (
      id, stage_name, real_name, tagline, origin, active_since, bio_short, bio_full,
      booking_agency, booking_email, va_recognition_year, kool_fm_role, radio_show,
      genres, regions_covered, direct_email, whatsapp_number, whatsapp_message,
      shopify_merch_url, merch_badge_text, dejavu_stream_url, is_live_on_air, live_show_title,
      key_venues, festivals, tech_rider_text,
      social_instagram, social_facebook, social_youtube, social_tiktok, social_mixcloud, social_soundcloud, social_spotify,
      epk_pdf_url, epk_logo_png, epk_logo_svg, epk_press_photo_landscape, epk_press_photo_portrait,
      bg_style, bg_speed, slideshow_enabled, slideshow_interval, slideshow_images
    ) VALUES (
      1, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )`,
    [
      'DJ Ital',
      'Ital (Hackney, born 1968)',
      'British Jungle & Drum and Bass Pioneer | Kool FM 94.5 | Founder of Vital Fest',
      'Hackney, East London, UK',
      '1991',
      'DJ Ital (born 1968, Hackney, London) is a British DJ, producer, and event promoter. A pioneer of the jungle music genre, he is best known for his work with the influential pirate radio station Kool FM and as the founder of Vital Fest. In April 2026, his historical importance to British music was officially recognised by the Victoria and Albert Museum (V&A East: The Music is Black).',
      'DJ Ital (born 1968, Hackney, London) is a British DJ, producer, and event promoter. A pioneer of the jungle music genre, he is best known for his work with the influential pirate radio station Kool FM and as the founder of Vital Fest. In 2026, his historical importance to British music was recognised by the Victoria and Albert Museum.\n\nCareer\nItal began his career in the early 1990s, emerging from the East London underground scene. He became a core member of Kool FM (94.5), a station central to the development of jungle and drum and bass.\n\n"Decibels"\nIn 1995, Ital produced the track "Decibel" (commonly known as "Decibels"), which was featured on the Kool FM - The 5th Anniversary compilation album. The track is cited as a significant example of the mid-90s jungle sound, blending complex breakbeats with heavy electronic-influenced basslines.\n\nMedia and Documentaries\nItal has been featured in several retrospective accounts of the jungle movement. In October 2006, he was interviewed by Giles Wood for Knowledge Magazine (Issue 85), where he discussed his technical approach to mixing and the evolution of the pirate radio scene.\nIn 2024, he produced and released the documentary series DJ Ital: The Journey on YouTube. The series serves as an archival project, documenting the "Golden Era" of jungle through first-hand accounts and rare footage.\n\nVital Fest\nDJ Ital is the founder and promoter of Vital Fest, a club night series and festival based primarily in Hackney, East London. Since its inception in 2023, the event has been hosted at several notable venues, including The Hackney Social (Bohemia Place), The Yard Theatre, and Arch 14. The event is characterized by its focus on the "foundation" sounds of the genre, frequently featuring veteran artists such as DJ Brockie, The Ragga Twins, and Jumpin Jack Frost. Resident Advisor has noted the event\'s role in preserving the community-led sound system culture of East London.\n\nCultural Recognition: V&A East: The Music is Black\nIn April 2026, DJ Ital\'s cultural legacy was memorialised by the Victoria and Albert Museum in the exhibition The Music is Black: A British Story at V&A East. The exhibition features Ital’s original Kool FM bomber jacket, displayed as a primary artefact to represent the pirate radio era\'s influence on British identity and the global electronic music landscape.',
      'IP1 Agency London',
      'djital@mail.com',
      2026,
      'Core Original DJ & Resident Broadcaster (94.5 FM)',
      'The Ital Show on Dejavu FM',
      // new fields:
      'Jungle · Drum & Bass · Reggae · Dub · UK Bass',
      'UK, Europe & International / Worldwide',
      'djital@mail.com',
      '+44 7900 123456',
      'Hi DJ Ital, I would like to enquire about booking you for an event.',
      'https://vitalfest.myshopify.com',
      'Official Vital Fest Merch & Vinyl Store',
      'https://dejavufm.com',
      0,
      'The Ital Show - Live on DejaVu FM',
      'Fabric London, The Hackney Social, Ministry of Sound, The Yard Theatre, Bar A Bar, LVLS Hackney Wick',
      'Vital Fest, Boomtown Fair, Outlook Festival, Glastonbury (Silver Hayes)',
      '2x Technics SL-1210 MK2 Turntables (or 2x Pioneer CDJ-3000), 1x Pioneer DJM-900NXS2 mixer, 2x High-power stereo booth monitor wedges, 1x Shure SM58 microphone for host MC.',
      'https://instagram.com/vital.fest',
      'https://facebook.com/vitalfest',
      'https://youtube.com/@djital2595',
      'https://tiktok.com/@vital.fest',
      'https://mixcloud.com/djital',
      'https://soundcloud.com/djital',
      'https://open.spotify.com',
      '/assets/DJ_ITAL_Official_EPK_2026.pdf',
      '/images/vital_fest_logo.png',
      '/images/vital_fest_logo.png',
      '/images/dj_ital_hero_1790112374509.jpg',
      '/images/kool_fm_vintage_1790112400005.jpg',
      'subtle-motion',
      'medium',
      1,
      6,
      '["/images/dj_ital_hero_1790112374509.jpg","/images/vital_fest_crowd_1790112387611.jpg","/images/kool_fm_vintage_1790112400005.jpg","/images/va_museum_exhibition_1790112416279.jpg"]',
    ]
  );

  // Seed Stats
  const stats = [
    [1, 'Years in Sound System Culture', '35', '+', 1],
    [2, 'Vital Fest Editions Hosted', '18', '', 2],
    [3, 'Original Pirate Radio Shows', '400', '+', 3],
    [4, 'V&A Museum Recognition', '2026', '', 4],
  ];
  for (const s of stats) {
    db.run(`INSERT INTO stats (id, label, value, suffix, order_index) VALUES (?, ?, ?, ?, ?)`, s);
  }

  // Seed Events from djital.me
  const events = [
    [
      'Vital Fest presents: Carnival Special',
      'LVLS Hackney Wick – Right on the Water',
      'Hackney Wick, London E9',
      '2026-08-30',
      '17:00 - 22:00',
      'DJ Ital, Reggae & Jungle DnB Foundation Selectors, Carnival Sound System Crew',
      'https://ra.co/events/vitalfest',
      'Upcoming',
      'FREE (RSVP via Resident Advisor)',
      1,
      '/images/vital_fest_crowd_1790112387611.jpg',
    ],
    [
      'Vital Fest: Ital Birthday Bash',
      'Bar A Bar',
      'Stoke Newington, London N16',
      '2026-09-19',
      '21:00 - 03:00',
      'DJ Ital, Intimate Underground Foundation Jungle Special Guests',
      'https://ra.co/events/vitalfest',
      'Upcoming',
      'Early Bird Live',
      1,
      '/images/dj_ital_hero_1790112374509.jpg',
    ],
    [
      'Vital Fest Second Anniversary Party!',
      'The Hackney Social',
      'Bohemia Place, Hackney, London E8',
      '2026-10-10',
      '18:00 - 02:00',
      'DJ Ital, DJ Brockie (Kool FM), The Ragga Twins, Jumpin Jack Frost, Det, Navigator',
      'https://ra.co/events/vitalfest',
      'Upcoming',
      'Super Early Bird Live',
      1,
      '/images/vital_fest_crowd_1790112387611.jpg',
    ],
    [
      'Vital Fest: Sound System Heritage Clash',
      'The Yard Theatre',
      'Queen Elizabeth Olympic Park, London E9',
      '2026-11-14',
      '21:00 - 04:00',
      'DJ Ital, DJ Ron (London Something / Kool FM), Navigator MC, Ragga Twins',
      'https://ra.co/events/vitalfest',
      'Upcoming',
      '£15.00 Adv',
      0,
      '/images/kool_fm_vintage_1790112400005.jpg',
    ],
  ];
  for (const e of events) {
    db.run(
      `INSERT INTO events (title, venue, location, event_date, start_time, lineup, ticket_url, status, price_text, is_featured, flyer_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      e
    );
  }

  // Seed Releases
  const releases = [
    [
      'Decibel (Original Mix)',
      1995,
      'Kool FM Recordings',
      'KOOL-005',
      '12" Vinyl / Digital Remaster',
      168,
      'Heavyweight 808 sub-bass roller with timestretched amen breaks and classic pirate sound clash vocals.',
      'https://djital.me/music/decibel',
      'Featured on the landmark Kool FM 5th Anniversary compilation album; heralded by Knowledge Magazine as a defining mid-90s jungle masterpiece.',
      1,
    ],
    [
      'Hackney Pressure (Dubplate Cut)',
      1994,
      'White Label / Dubplate',
      'ITAL-DUB-01',
      '10" Acetate Dubplate',
      165,
      'Dark atmospheric strings transitioning into tearing reese basslines and intricate jungle syncopation.',
      'https://djital.me/music/hackney-pressure',
      'Originally cut on ten-inch acetate for Ital\'s prime-time pirate radio slots over Hackney and Tower Hamlets.',
      1,
    ],
    [
      'Vital Anthem (Sound System Mix)',
      2023,
      'Vital Recordings London',
      'VR-001',
      'Digital & Limited 12"',
      172,
      'Modern foundation jungle featuring driving breakbeats, sub-bass pressure, and lyrical ragga vocal chops.',
      'https://djital.me/music/vital-anthem',
      'Official theme anthem for Vital Fest East London festival nights; played out by top selectors across the UK.',
      1,
    ],
    [
      'Pirate Transmission (Live Kool FM 94.5 Archive)',
      1993,
      'Kool London Tape Archive',
      'TAPE-93-ITAL',
      'Cassette Remaster',
      160,
      'Authentic rooftop pirate broadcast with hiss, studio banter, phone-in shouts, and raw unreleased dubs.',
      'https://djital.me/music/pirate-transmission',
      'A time capsule recording captured from the high-rise tower blocks of East London during jungle\'s golden dawn.',
      0,
    ],
  ];
  for (const r of releases) {
    db.run(
      `INSERT INTO releases (title, release_year, label, catalog_number, format, bpm, audio_theme, stream_url, description, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      r
    );
  }

  // Seed Gallery
  const gallery = [
    [
      'DJ Ital at the Turntables',
      'Studio',
      '/images/dj_ital_hero_1790112374509.jpg',
      'DJ Ital deep in the mix during a dubplate cutting session in East London.',
      '2026',
      'London Studio',
      1,
    ],
    [
      'Vital Fest Sound System Crowd',
      'Vital Fest',
      '/images/vital_fest_crowd_1790112387611.jpg',
      'Vibrant atmosphere and bass pressure at The Hackney Social during Vital Fest.',
      '2026',
      'The Hackney Social, London',
      1,
    ],
    [
      'Kool FM 94.5 Studio Archive',
      'Kool FM Archive',
      '/images/kool_fm_vintage_1790112400005.jpg',
      'The original Technics 1200 turntables and dubplate archives from the Kool FM studio era.',
      '1995',
      'Hackney Pirate Radio Studio',
      1,
    ],
    [
      'V&A Museum Recognition Display',
      'V&A Museum',
      '/images/va_museum_exhibition_1790112416279.jpg',
      'DJ Ital original Kool FM flight bomber jacket and mid-90s event flyers showcased at the Victoria and Albert Museum.',
      '2026',
      'V&A Museum, South Kensington',
      1,
    ],
    [
      '10" Acetate Dubplate Cutting Session',
      'Studio',
      '/images/vinyl_dubplate_acetate_1790113879360.jpg',
      'Original 10-inch acetate dubplate of "Decibel" spinning on Technics 1210 turntable with handwritten grease pencil label.',
      '1995',
      'East London Studio',
      1,
    ],
    [
      'Hackney Rooftop Pirate Transmitter Aerial',
      'Kool FM Archive',
      '/images/hackney_pirate_radio_1790113898507.jpg',
      'FM dipole transmission aerial mounted on high-rise Hackney estate overlooking London at twilight.',
      '1993',
      'Hackney Rooftops, London',
      1,
    ],
  ];
  for (const g of gallery) {
    db.run(
      `INSERT INTO gallery (title, category, image_url, caption, year, location, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      g
    );
  }

  // Seed Documentary
  const docs = [
    [
      1,
      'Rooftops & Airwaves: The Kool FM Inception',
      '22 min',
      'How a group of passionate East London music pioneers rigged aerials atop Hackney council towers to broadcast the revolutionary sounds of jungle drum and bass to thousands.',
      'https://www.youtube.com/@djital',
      'Pirate Radio History, Hackney Towers, Transmitter Tech',
    ],
    [
      2,
      'The Dubplate Culture & Producing "Decibel"',
      '19 min',
      'First-hand breakdown of how "Decibel" was composed on vintage hardware samplers, cut onto fresh acetate, and road-tested at landmark raves.',
      'https://www.youtube.com/@djital',
      'Music Production, Dubplate Cutting, Sound Clash',
    ],
    [
      3,
      'Vital Fest: Protecting East London Sound Heritage',
      '26 min',
      'The genesis of Vital Fest, uniting original jungle originators with the next generation of ravers in grassroots East London venues.',
      'https://www.youtube.com/@djital',
      'Vital Fest, Hackney Social, Community Culture',
    ],
    [
      4,
      'From Underground Pirate to The V&A Museum',
      '18 min',
      'Reflections on 35 years of dedication to UK jungle, culminating in national cultural recognition at the Victoria and Albert Museum in 2026.',
      'https://www.youtube.com/@djital',
      'V&A Museum Exhibition, Legacy, Cultural Preservation',
    ],
  ];
  for (const d of docs) {
    db.run(
      `INSERT INTO documentary (episode_number, title, duration, description, youtube_url, topics)
       VALUES (?, ?, ?, ?, ?, ?)`,
      d
    );
  }

  // Seed Initial Bookings
  const initialBookings = [
    [
      'Fabric London Booking Team',
      'events@fabriclondon.com',
      'Club Headline Set',
      '2026-11-14',
      'London, UK',
      '£1,500',
      'Looking to book DJ Ital for Room 2 Jungle Foundation takeover with 90-minute exclusive dubplate set.',
      'Confirmed',
      '2026-09-18 11:20:00',
    ],
    [
      'Boomtown Festival UK',
      'selectors@boomtownfair.co.uk',
      'Festival Stage Showcase',
      '2027-08-12',
      'Winchester, UK',
      '£3,200',
      'Vital Fest stage takeover request for Lion\'s Den / Hidden Woods stage featuring DJ Ital & Ragga Twins.',
      'Pending',
      '2026-09-21 16:45:00',
    ],
  ];
  for (const b of initialBookings) {
    db.run(
      `INSERT INTO bookings (client_name, client_email, event_type, target_date, venue_city, estimated_budget, message, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      b
    );
  }

  // Seed Site Media
  const now = new Date().toISOString();
  for (const m of DEFAULT_SITE_MEDIA) {
    db.run(
      `INSERT INTO site_media (key, section, label, description, image_url, default_url, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m[0], m[1], m[2], m[3], m[4], m[5], now]
    );
  }

  // Guarantee documentaries, heritage, audio/media mixes, testimonials, and media library are seeded
  seedDocumentariesIfEmpty(db, true);
  seedHeritageTablesIfEmpty(db, true);
  seedNewTablesIfEmpty(db, true);
  syncAppMediaToLibrary(db);

  db.run('CREATE TABLE IF NOT EXISTS _system_meta (key TEXT PRIMARY KEY, value TEXT);');
  db.run("INSERT OR REPLACE INTO _system_meta (key, value) VALUES ('initial_seed', 'completed');");
}

// Helper methods for typed data access and mutations
export async function getProfile(): Promise<ProfileData> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM profile WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const row = res[0].values[0];
    const cols = res[0].columns;
    const obj: any = {};
    cols.forEach((c, idx) => {
      obj[c] = row[idx];
    });
    // Single unified radio cast stream URL
    const resolvedStream = (
      obj.stream_url ||
      obj.hero_stream_url ||
      obj.main_player_stream_url ||
      (obj.dejavu_stream_url && obj.dejavu_stream_url !== 'https://dejavufm.com' ? obj.dejavu_stream_url : '') ||
      'https://dejavufm.radioca.st/;'
    ).trim();
    obj.stream_url = resolvedStream;
    obj.hero_stream_url = resolvedStream;
    obj.main_player_stream_url = resolvedStream;
    obj.dejavu_stream_url = resolvedStream;
    obj.signature_bpm = obj.signature_bpm ? Number(obj.signature_bpm) : 164;
    obj.brand_slogan = obj.brand_slogan || 'DjItal 164bpm';
    return obj as ProfileData;
  }
  throw new Error('Profile not found');
}

export async function updateProfile(data: Partial<ProfileData>): Promise<void> {
  const db = await getDatabase();
  const tableInfo = db.exec('PRAGMA table_info(profile)');
  const validCols = new Set(tableInfo[0]?.values.map((row) => row[1]) || []);

  const payload: any = { ...data };
  if (payload.signature_bpm !== undefined) {
    payload.signature_bpm = parseInt(String(payload.signature_bpm), 10) || 164;
  }
  if (payload.brand_slogan !== undefined) {
    payload.brand_slogan = String(payload.brand_slogan).trim() || 'DjItal 164bpm';
  }
  // If stream_url is set, keep backwards compatible columns synchronized
  if (payload.stream_url !== undefined) {
    if (validCols.has('hero_stream_url')) payload.hero_stream_url = payload.stream_url;
    if (validCols.has('main_player_stream_url')) payload.main_player_stream_url = payload.stream_url;
    if (validCols.has('dejavu_stream_url')) payload.dejavu_stream_url = payload.stream_url;
  }

  const keys = Object.keys(payload).filter((k) => k !== 'id' && validCols.has(k));
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => payload[k]);
  values.push(1);
  db.run(`UPDATE profile SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getEvents(): Promise<EventData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM events ORDER BY event_date ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    if (obj.flyer_image) {
      obj.flyer_image = normalizeImageUrl(obj.flyer_image);
    }
    return obj as EventData;
  });
}

export async function createEvent(event: Omit<EventData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO events (title, venue, location, event_date, start_time, lineup, ticket_url, status, price_text, is_featured, flyer_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      event.title,
      event.venue,
      event.location,
      event.event_date,
      event.start_time,
      event.lineup,
      event.ticket_url,
      event.status || 'Upcoming',
      event.price_text,
      event.is_featured ? 1 : 0,
      event.flyer_image || '/images/vital_fest_crowd_1790112387611.jpg',
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateEvent(id: number, event: Partial<EventData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(event).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (event as any)[k]);
  values.push(id);
  db.run(`UPDATE events SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM events WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getReleases(): Promise<ReleaseData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM releases ORDER BY release_year DESC, id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as ReleaseData;
  });
}

export async function createRelease(release: Omit<ReleaseData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO releases (title, release_year, label, catalog_number, format, bpm, audio_theme, stream_url, description, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      release.title,
      release.release_year,
      release.label,
      release.catalog_number,
      release.format,
      release.bpm,
      release.audio_theme,
      release.stream_url,
      release.description,
      release.is_featured ? 1 : 0,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateRelease(id: number, release: Partial<ReleaseData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(release).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (release as any)[k]);
  values.push(id);
  db.run(`UPDATE releases SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteRelease(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM releases WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getGallery(): Promise<GalleryData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM gallery ORDER BY id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    if (obj.image_url) {
      obj.image_url = normalizeImageUrl(obj.image_url);
    }
    return obj as GalleryData;
  });
}

export async function createGalleryItem(item: Omit<GalleryData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO gallery (title, category, image_url, caption, year, location, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      item.title,
      item.category,
      item.image_url,
      item.caption,
      item.year,
      item.location,
      item.is_featured ? 1 : 0,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateGalleryItem(id: number, item: Partial<GalleryData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(item).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (item as any)[k]);
  values.push(id);
  db.run(`UPDATE gallery SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteGalleryItem(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM gallery WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// ---------------------------------------------------------------------------
// Documentary Section & Settings CRUD Methods
// ---------------------------------------------------------------------------

export async function getDocumentarySettings(): Promise<DocumentarySettingsData> {
  try {
    const db = await getDatabase();
    const res = db.exec('SELECT * FROM documentary_settings WHERE id = 1');
    if (res.length > 0 && res[0].values.length > 0) {
      const cols = res[0].columns;
      const obj: any = {};
      cols.forEach((c, i) => (obj[c] = res[0].values[0][i]));
      return obj as DocumentarySettingsData;
    }
  } catch (err) {
    console.warn('Could not read documentary_settings:', err);
  }
  return {
    id: 1,
    ...DEFAULT_DOCUMENTARY_SETTINGS,
    updated_at: new Date().toISOString(),
  };
}

export async function updateDocumentarySettings(data: Partial<DocumentarySettingsData>): Promise<void> {
  const db = await getDatabase();
  const existing = await getDocumentarySettings();
  const updated: DocumentarySettingsData = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  db.run(
    `INSERT OR REPLACE INTO documentary_settings (
      id, badge_text, subbadge_text, heading, description,
      youtube_button_text, youtube_series_url, show_youtube_button, is_section_visible, updated_at
    ) VALUES (
      1, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )`,
    [
      updated.badge_text,
      updated.subbadge_text,
      updated.heading,
      updated.description,
      updated.youtube_button_text,
      updated.youtube_series_url,
      updated.show_youtube_button !== undefined ? Number(updated.show_youtube_button) : 1,
      updated.is_section_visible !== undefined ? Number(updated.is_section_visible) : 1,
      updated.updated_at,
    ]
  );

  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function resetDocumentarySettings(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run(
    `INSERT OR REPLACE INTO documentary_settings (
      id, badge_text, subbadge_text, heading, description,
      youtube_button_text, youtube_series_url, show_youtube_button, is_section_visible, updated_at
    ) VALUES (
      1, ?, ?, ?, ?,
      ?, ?, 1, 1, ?
    )`,
    [
      DEFAULT_DOCUMENTARY_SETTINGS.badge_text,
      DEFAULT_DOCUMENTARY_SETTINGS.subbadge_text,
      DEFAULT_DOCUMENTARY_SETTINGS.heading,
      DEFAULT_DOCUMENTARY_SETTINGS.description,
      DEFAULT_DOCUMENTARY_SETTINGS.youtube_button_text,
      DEFAULT_DOCUMENTARY_SETTINGS.youtube_series_url,
      now,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getDocumentaries(): Promise<DocumentaryData[]> {
  const db = await getDatabase();
  let res;
  try {
    res = db.exec(
      'SELECT * FROM documentary ORDER BY CASE WHEN order_index IS NOT NULL AND order_index > 0 THEN order_index ELSE episode_number END ASC, episode_number ASC, id ASC'
    );
  } catch (err) {
    res = db.exec('SELECT * FROM documentary ORDER BY episode_number ASC, id ASC');
  }
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as DocumentaryData;
  });
}

export async function createDocumentary(doc: Omit<DocumentaryData, 'id'>): Promise<number> {
  const db = await getDatabase();
  const thumb = doc.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg';
  const badge = doc.badge_label || `EPISODE 0${doc.episode_number}`;
  const actionBtn = doc.action_button_text || 'WATCH ARCHIVAL TAPE';
  const orderIdx = doc.order_index ?? doc.episode_number;

  db.run(
    `INSERT INTO documentary (episode_number, title, duration, description, youtube_url, topics, thumbnail_url, badge_label, action_button_text, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      doc.episode_number,
      doc.title,
      doc.duration,
      doc.description,
      doc.youtube_url,
      doc.topics,
      thumb,
      badge,
      actionBtn,
      orderIdx,
    ]
  );

  const res = db.exec('SELECT last_insert_rowid()');
  const newId = res.length > 0 ? (res[0].values[0][0] as number) : 0;

  if (doc.thumbnail_url) {
    trackMediaUpload({
      title: `Doc: ${doc.title}`,
      url: doc.thumbnail_url,
      source: 'Documentary Section',
      category: 'Documentary Poster',
    });
  }

  await saveDatabaseToStorage(db);
  notifyListeners();
  return newId;
}

export async function updateDocumentary(id: number, doc: Partial<DocumentaryData>): Promise<void> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM documentary WHERE id = ?', [id]);
  if (res.length === 0 || res[0].values.length === 0) return;
  const cols = res[0].columns;
  const existing: any = {};
  cols.forEach((c, i) => (existing[c] = res[0].values[0][i]));

  const updated: DocumentaryData = {
    ...existing,
    ...doc,
  };

  db.run(
    `UPDATE documentary
     SET episode_number = ?, title = ?, duration = ?, description = ?, youtube_url = ?, topics = ?,
         thumbnail_url = ?, badge_label = ?, action_button_text = ?, order_index = ?
     WHERE id = ?`,
    [
      updated.episode_number,
      updated.title,
      updated.duration,
      updated.description,
      updated.youtube_url,
      updated.topics,
      updated.thumbnail_url || null,
      updated.badge_label || null,
      updated.action_button_text || 'WATCH ARCHIVAL TAPE',
      updated.order_index ?? updated.episode_number,
      id,
    ]
  );

  if (doc.thumbnail_url && doc.thumbnail_url !== existing.thumbnail_url) {
    trackMediaUpload({
      title: `Doc: ${updated.title}`,
      url: doc.thumbnail_url,
      source: 'Documentary Section',
      category: 'Documentary Poster',
    });
  }

  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteDocumentary(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM documentary WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function resetDocumentaries(): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM documentary');
  for (const ep of DEFAULT_DOCUMENTARY_EPISODES) {
    db.run(
      `INSERT INTO documentary (episode_number, title, duration, description, youtube_url, topics, thumbnail_url, badge_label, action_button_text, order_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ep.episode_number,
        ep.title,
        ep.duration,
        ep.description,
        ep.youtube_url,
        ep.topics,
        ep.thumbnail_url ?? null,
        ep.badge_label ?? null,
        ep.action_button_text ?? 'WATCH ARCHIVAL TAPE',
        ep.order_index ?? ep.episode_number,
      ]
    );
  }
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getBookings(): Promise<BookingData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM bookings ORDER BY id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as BookingData;
  });
}

export async function createBooking(booking: Omit<BookingData, 'id' | 'status' | 'created_at'>): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.run(
    `INSERT INTO bookings (client_name, client_email, client_phone, event_type, target_date, venue_city, estimated_budget, set_length, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
    [
      booking.client_name,
      booking.client_email,
      booking.client_phone || '',
      booking.event_type,
      booking.target_date,
      booking.venue_city,
      booking.estimated_budget,
      booking.set_length || '90 min',
      booking.message,
      now,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateBookingStatus(id: number, status: string): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM bookings WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Audio Mixes Methods
export async function getAudioMixes(): Promise<AudioMixData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM audio_mixes ORDER BY order_index ASC, id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as AudioMixData;
  });
}

export async function createAudioMix(mix: Omit<AudioMixData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO audio_mixes (title, style, platform, embed_url, stream_url, duration, description, is_featured, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      mix.title,
      mix.style,
      mix.platform,
      mix.embed_url,
      mix.stream_url || '',
      mix.duration || '',
      mix.description || '',
      mix.is_featured ? 1 : 0,
      mix.order_index || 0,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateAudioMix(id: number, mix: Partial<AudioMixData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(mix).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (mix as any)[k]);
  values.push(id);
  db.run(`UPDATE audio_mixes SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteAudioMix(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM audio_mixes WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Videos Methods
export async function getVideos(): Promise<VideoData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM videos ORDER BY order_index ASC, id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    if (obj.thumbnail_url) {
      obj.thumbnail_url = normalizeImageUrl(obj.thumbnail_url);
    }
    return obj as VideoData;
  });
}

export async function createVideo(video: Omit<VideoData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO videos (title, category, video_url, thumbnail_url, duration, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      video.title,
      video.category,
      video.video_url,
      video.thumbnail_url || '',
      video.duration || '',
      video.order_index || 0,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateVideo(id: number, video: Partial<VideoData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(video).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (video as any)[k]);
  values.push(id);
  db.run(`UPDATE videos SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteVideo(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM videos WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Testimonials Methods
export async function getTestimonials(): Promise<TestimonialData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM testimonials ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    if (obj.avatar_url) {
      obj.avatar_url = normalizeImageUrl(obj.avatar_url);
    }
    return obj as TestimonialData;
  });
}

export async function createTestimonial(testimonial: Omit<TestimonialData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO testimonials (quote, author_name, role_venue, avatar_url, rating, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      testimonial.quote,
      testimonial.author_name,
      testimonial.role_venue,
      testimonial.avatar_url || '',
      testimonial.rating || 5,
      testimonial.order_index || 0,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateTestimonial(id: number, testimonial: Partial<TestimonialData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(testimonial).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (testimonial as any)[k]);
  values.push(id);
  db.run(`UPDATE testimonials SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteTestimonial(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM testimonials WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Venue Logos Methods
export async function getVenueLogos(): Promise<VenueLogoData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM venue_logos ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as VenueLogoData;
  });
}

export async function createVenueLogo(venue: Omit<VenueLogoData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO venue_logos (name, location, logo_text, order_index)
     VALUES (?, ?, ?, ?)`,
    [venue.name, venue.location || '', venue.logo_text || venue.name, venue.order_index || 0]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateVenueLogo(id: number, venue: Partial<VenueLogoData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(venue).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (venue as any)[k]);
  values.push(id);
  db.run(`UPDATE venue_logos SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteVenueLogo(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM venue_logos WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Newsletter Subscribers Methods
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriberData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM newsletter_subscribers ORDER BY id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as NewsletterSubscriberData;
  });
}

export async function addNewsletterSubscriber(email: string, source = 'Website'): Promise<boolean> {
  const db = await getDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const existing = db.exec(`SELECT id FROM newsletter_subscribers WHERE email = '${cleanEmail.replace(/'/g, "''")}'`);
  if (existing.length > 0 && existing[0].values.length > 0) {
    return true; // Already subscribed
  }
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.run(`INSERT INTO newsletter_subscribers (email, created_at, source) VALUES (?, ?, ?)`, [cleanEmail, now, source]);
  await saveDatabaseToStorage(db);
  notifyListeners();
  return true;
}

export async function deleteNewsletterSubscriber(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function getStats(): Promise<StatData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM stats ORDER BY order_index ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as StatData;
  });
}

export async function createStat(stat: Omit<StatData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    'INSERT INTO stats (label, value, suffix, order_index) VALUES (?, ?, ?, ?)',
    [stat.label, stat.value, stat.suffix || '', stat.order_index ?? 0]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateStat(id: number, stat: Partial<StatData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(stat).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (stat as any)[k]);
  values.push(id);
  db.run(`UPDATE stats SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteStat(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM stats WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Site Media Methods
export async function getSiteMedia(): Promise<SiteMediaData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM site_media ORDER BY section ASC, key ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    if (obj.image_url) {
      obj.image_url = normalizeImageUrl(obj.image_url);
    }
    if (obj.default_url) {
      obj.default_url = normalizeImageUrl(obj.default_url);
    }
    return obj as SiteMediaData;
  });
}

export async function getSiteMediaMap(): Promise<Record<string, string>> {
  const mediaList = await getSiteMedia();
  const map: Record<string, string> = {};
  mediaList.forEach((item) => {
    map[item.key] = item.image_url;
  });
  return map;
}

export async function updateSiteMedia(key: string, imageUrl: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run('UPDATE site_media SET image_url = ?, updated_at = ? WHERE key = ?', [imageUrl, now, key]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function resetSiteMedia(key: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run('UPDATE site_media SET image_url = default_url, updated_at = ? WHERE key = ?', [now, key]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function resetAllSiteMedia(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run('UPDATE site_media SET image_url = default_url, updated_at = ?', [now]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Media Library Unified Management Methods
export async function getMediaLibraryItems(): Promise<MediaLibraryItem[]> {
  try {
    const db = await getDatabase();
    const res = db.exec('SELECT * FROM media_library ORDER BY id DESC');
    if (res.length === 0) return [];
    const cols = res[0].columns;
    return res[0].values.map((row) => {
      const obj: any = {};
      cols.forEach((c, i) => (obj[c] = row[i]));
      if (obj.file_type === 'image') {
        obj.url = normalizeImageUrl(obj.url);
      }
      return obj as MediaLibraryItem;
    });
  } catch (err) {
    console.warn('Could not read media_library:', err);
    return [];
  }
}

export async function createMediaLibraryItem(
  item: Omit<MediaLibraryItem, 'id' | 'created_at' | 'updated_at'>
): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // If this URL was previously deleted, unblock it since user is re-adding it
  if (item.url) {
    db.run(`CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT)`);
    db.run('DELETE FROM deleted_media_urls WHERE url = ?', [item.url]);
  }

  // Deduplication check: if an item with this exact URL already exists in media_library, update metadata and return its ID
  if (item.url && item.url.trim()) {
    try {
      const existing = db.exec('SELECT id FROM media_library WHERE url = ? LIMIT 1', [item.url.trim()]);
      if (existing.length > 0 && existing[0].values.length > 0) {
        const existingId = Number(existing[0].values[0][0]);
        db.run(
          `UPDATE media_library SET 
             title = COALESCE(NULLIF(?, ''), title),
             category = COALESCE(NULLIF(?, ''), category),
             description = COALESCE(NULLIF(?, ''), description),
             updated_at = ?
           WHERE id = ?`,
          [item.title || '', item.category ?? null, item.description ?? null, now, existingId]
        );
        await saveDatabaseToStorage(db);
        notifyListeners();
        return existingId;
      }
    } catch {
      // Continue to insertion if query check fails
    }
  }

  db.run(
    `INSERT INTO media_library (title, file_name, file_type, mime_type, url, source, size_text, category, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.title,
      item.file_name || 'asset',
      item.file_type || 'image',
      item.mime_type || 'application/octet-stream',
      item.url,
      item.source || 'Direct Upload',
      item.size_text || '',
      item.category || 'General',
      item.description || '',
      now,
      now,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateMediaLibraryItem(
  id: number,
  item: Partial<MediaLibraryItem>
): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(item).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const now = new Date().toISOString();
  const setClause = [...keys.map((k) => `${k} = ?`), 'updated_at = ?'].join(', ');
  const values = [...keys.map((k) => (item as any)[k]), now, id];
  db.run(`UPDATE media_library SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteMediaLibraryItem(id: number): Promise<void> {
  const db = await getDatabase();

  // 1. Get the URL of the item to be deleted
  const query = db.exec('SELECT url FROM media_library WHERE id = ?', [id]);
  const url = query.length > 0 && query[0].values.length > 0 ? String(query[0].values[0][0]) : null;

  // 2. Record URL in deleted_media_urls so syncAppMediaToLibrary will never resurrect it
  db.run(`CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT)`);
  if (url) {
    const now = new Date().toISOString();
    db.run('INSERT OR REPLACE INTO deleted_media_urls (url, deleted_at) VALUES (?, ?)', [url, now]);

    // 3. If file was an uploaded asset on server disk, delete physical file
    if (url.startsWith('/uploads/')) {
      try {
        await fetch('/api/delete-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      } catch (err) {
        console.warn('Notice: Server delete-media failed:', err);
      }
    }
  }

  // 4. Remove from media_library table
  db.run('DELETE FROM media_library WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function trackMediaUpload(item: {
  title: string;
  url: string;
  file_name?: string;
  file_type?: string;
  mime_type?: string;
  source?: string;
  category?: string;
  size_text?: string;
  description?: string;
}): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const normUrl = item.url;
    if (!normUrl) return;

    // Unblock URL from deleted_media_urls if it was previously removed
    db.run(`CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT)`);
    db.run('DELETE FROM deleted_media_urls WHERE url = ?', [normUrl]);

    // Check if item already exists by URL
    const check = db.exec(`SELECT id FROM media_library WHERE url = ?`, [normUrl]);
    if (check.length > 0 && check[0].values.length > 0) {
      const existingId = Number(check[0].values[0][0]);
      db.run(
        `UPDATE media_library SET updated_at = ?, source = COALESCE(?, source), title = COALESCE(?, title) WHERE id = ?`,
        [now, item.source ?? null, item.title ?? null, existingId]
      );
    } else {
      let resolvedType = item.file_type || 'image';
      if (!item.file_type) {
        if (normUrl.startsWith('data:application/pdf') || normUrl.toLowerCase().endsWith('.pdf') || normUrl.includes('.pdf')) {
          resolvedType = 'document';
        } else if (normUrl.includes('audio') || normUrl.endsWith('.mp3') || normUrl.endsWith('.wav')) {
          resolvedType = 'audio';
        } else if (normUrl.includes('video') || normUrl.endsWith('.mp4') || normUrl.includes('youtube')) {
          resolvedType = 'video';
        }
      }
      db.run(
        `INSERT INTO media_library (title, file_name, file_type, mime_type, url, source, size_text, category, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.title || 'Uploaded Asset',
          item.file_name || (normUrl.startsWith('data:') ? 'upload' : normUrl.split('/').pop() || 'file'),
          resolvedType,
          item.mime_type || (resolvedType === 'document' ? 'application/pdf' : 'image/jpeg'),
          normUrl,
          item.source || 'Upload',
          item.size_text || (normUrl.startsWith('data:') ? `${Math.max(1, Math.round((normUrl.length * 0.75) / 1024))} KB` : 'Application Asset'),
          item.category || (resolvedType === 'document' ? 'Documents' : 'Images'),
          item.description || `Asset uploaded from ${item.source || 'application'}`,
          now,
          now,
        ]
      );
    }
    await saveDatabaseToStorage(db);
    notifyListeners();
  } catch (err) {
    console.warn('trackMediaUpload failed gracefully:', err);
  }
}

export async function executeRawSql(sqlQuery: string): Promise<{ columns: string[]; rows: any[][] }> {
  const db = await getDatabase();
  const results = db.exec(sqlQuery);
  await saveDatabaseToStorage(db);
  notifyListeners();
  if (results.length === 0) {
    return { columns: ['result'], rows: [['Query executed successfully. 0 rows returned.']] };
  }
  return {
    columns: results[0].columns,
    rows: results[0].values,
  };
}

export async function executeQuery(sqlQuery: string): Promise<{ columns: string[]; values: any[][] }[]> {
  const db = await getDatabase();
  const results = db.exec(sqlQuery);
  await saveDatabaseToStorage(db);
  notifyListeners();
  return results;
}

export async function exportDatabaseBinary(): Promise<Uint8Array> {
  const db = await getDatabase();
  return db.export();
}

export async function importDatabaseBinary(fileBuffer: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });
  dbInstance = new SQL.Database(fileBuffer);
  ensureSchemaMigrations(dbInstance);
  await saveDatabaseToStorage(dbInstance);
  notifyListeners();
}

export async function resetDatabaseToDefault(): Promise<void> {
  let seedBase64: string | null = null;
  try {
    const res = await fetch('/api/db/reset', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.databaseBase64) {
        seedBase64 = data.databaseBase64;
      }
    }
  } catch (e) {
    console.warn('Failed to call /api/db/reset:', e);
  }

  // If server did not return databaseBase64 directly, try to query /api/db/state
  if (!seedBase64) {
    try {
      const res = await fetch('/api/db/state', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.exists && json.databaseBase64) {
          seedBase64 = json.databaseBase64;
        }
      }
    } catch (e) {
      console.warn('Could not query /api/db/state after reset:', e);
    }
  }

  let SQL: any;
  try {
    const wasmBinary = await loadSqlWasmBinary();
    if (wasmBinary) {
      SQL = await initSqlJs({ wasmBinary });
    } else {
      SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    }
  } catch (e) {
    SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  }

  let currentDb: Database;
  if (seedBase64) {
    try {
      const u8 = base64ToUint8Array(seedBase64);
      currentDb = new SQL.Database(u8);
    } catch (err) {
      console.warn('Failed to parse reset base64 seed, reinitializing fresh schema:', err);
      currentDb = new SQL.Database();
      initSchemaAndSeeds(currentDb);
    }
  } else {
    currentDb = new SQL.Database();
    initSchemaAndSeeds(currentDb);
  }

  // Ensure migrations
  ensureSchemaMigrations(currentDb);

  // Clear deleted media tracking so default assets are immediately visible
  try {
    currentDb.run('CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT);');
    currentDb.run('DELETE FROM deleted_media_urls;');
  } catch {}

  // Explicitly force seed heritage, documentaries, and new tables (audio, videos, testimonials, venues)
  seedHeritageTablesIfEmpty(currentDb, true);
  seedDocumentariesIfEmpty(currentDb, true);
  seedNewTablesIfEmpty(currentDb, true);
  syncAppMediaToLibrary(currentDb);

  dbInstance = currentDb;
  await saveDatabaseToStorage(currentDb);
  notifyListeners();
}

export async function forcePushToServer(): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDatabase();
    const data = db.export();
    const b64 = uint8ArrayToBase64(data);
    const now = new Date().toISOString();
    const syncResult = await syncDatabaseToServer(b64, now);
    if (syncResult) {
      return { success: true, message: 'Database saved directly to server in realtime.' };
    }
    return { success: false, message: 'Failed to push database to server. Check server connection.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error pushing database to server' };
  }
}

export async function forcePullFromServer(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/db/state');
    if (!res.ok) {
      return { success: false, message: 'Server returned error status' };
    }
    const json = await res.json();
    if (!json.exists || !json.databaseBase64) {
      return { success: false, message: 'No database found on server' };
    }

    const SQL = await initSqlJs({
      locateFile: () => '/sql-wasm.wasm',
    });
    const u8 = base64ToUint8Array(json.databaseBase64);
    dbInstance = new SQL.Database(u8);
    ensureSchemaMigrations(dbInstance);
    notifyListeners();
    return { success: true, message: 'Latest database state synchronized directly from server.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error syncing database from server' };
  }
}

export async function downloadDatabaseFile(): Promise<void> {
  const binary = await exportDatabaseBinary();
  const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `djital_database_${new Date().toISOString().split('T')[0]}.sqlite`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const resetDatabaseToSeed = resetDatabaseToDefault;

export async function restoreDatabaseSnapshot(snapshotId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/db/restore-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshotId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server HTTP ${res.status}` }));
      return { success: false, message: err.error || 'Failed to restore snapshot on server' };
    }

    const json = await res.json();
    if (!json.databaseBase64) {
      return { success: false, message: 'Server did not return restored database snapshot' };
    }

    let SQL: any;
    try {
      const wasmBinary = await loadSqlWasmBinary();
      if (wasmBinary) {
        SQL = await initSqlJs({ wasmBinary });
      } else {
        SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
      }
    } catch {
      SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    }

    const u8 = base64ToUint8Array(json.databaseBase64);
    const restoredDb = new SQL.Database(u8);
    ensureSchemaMigrations(restoredDb);
    dbInstance = restoredDb;
    lastServerTimestamp = json.meta?.updatedAt || new Date().toISOString();
    notifyListeners();

    return {
      success: true,
      message: json.message || 'Snapshot successfully restored to memory and persistent disk.',
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Error restoring snapshot' };
  }
}

export async function restorePreviousCustomData(): Promise<{ success: boolean; message: string }> {
  return restoreDatabaseSnapshot('previous_custom');
}

// ---------------------------------------------------------------------------
// Production-Ready Admin Authentication & Password Management
// ---------------------------------------------------------------------------

export interface AdminAuthInfo {
  hasCustomPassword: boolean;
  updatedAt: string;
  lastLoginAt?: string;
}

/**
 * Universal WebCrypto SHA-256 hash with salt
 */
export async function hashPasswordSubtle(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${password}:${salt}`);
  const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(buf));
  return hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieves current admin authentication status
 */
export async function getAdminAuthInfo(): Promise<AdminAuthInfo> {
  const db = await getDatabase();
  try {
    const res = db.exec('SELECT password_hash, updated_at, last_login_at FROM admin_auth WHERE id = 1');
    if (res.length > 0 && res[0].values.length > 0) {
      const [hash, updated, lastLogin] = res[0].values[0];
      const isDefault = hash === '1845f709f6247f313f25e4c9442e75fdba3354dfe4dd3d00e59b5e591025af81';
      return {
        hasCustomPassword: !isDefault,
        updatedAt: (updated as string) || new Date().toISOString(),
        lastLoginAt: (lastLogin as string) || undefined,
      };
    }
  } catch (err) {
    console.warn('Error reading admin_auth info:', err);
  }
  return {
    hasCustomPassword: false,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Verifies the admin password securely using cryptographic SHA-256 with stored salt
 */
export async function verifyAdminPassword(password: string): Promise<{ success: boolean; error?: string }> {
  if (!password || password.trim() === '') {
    return { success: false, error: 'Password is required' };
  }

  const db = await getDatabase();
  try {
    let res = db.exec('SELECT password_hash, password_salt FROM admin_auth WHERE id = 1');
    if (res.length === 0 || res[0].values.length === 0) {
      // Seed default if somehow missing
      const defaultSalt = 'ital_salt_2026';
      const defaultHash = '1845f709f6247f313f25e4c9442e75fdba3354dfe4dd3d00e59b5e591025af81';
      db.run(
        'INSERT OR REPLACE INTO admin_auth (id, password_hash, password_salt, updated_at) VALUES (1, ?, ?, ?)',
        [defaultHash, defaultSalt, new Date().toISOString()]
      );
      await saveDatabaseToStorage(db);
      res = db.exec('SELECT password_hash, password_salt FROM admin_auth WHERE id = 1');
    }

    const [storedHash, storedSalt] = res[0].values[0] as [string, string];
    const inputHash = await hashPasswordSubtle(password.trim(), storedSalt);

    if (inputHash === storedHash) {
      const now = new Date().toISOString();
      db.run('UPDATE admin_auth SET last_login_at = ? WHERE id = 1', [now]);
      await saveDatabaseToStorage(db);
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect password. Access denied.' };
    }
  } catch (err: any) {
    console.error('Error during password verification:', err);
    return { success: false, error: err?.message || 'Authentication error' };
  }
}

/**
 * Changes the admin password:
 * Validates current password, checks new password strength, generates new salt,
 * updates SQLite and saves directly to server in realtime.
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const trimmedNew = newPassword?.trim();
  if (!trimmedNew || trimmedNew.length < 6) {
    return { success: false, error: 'New password must be at least 6 characters.' };
  }
  if (trimmedNew.length > 64) {
    return { success: false, error: 'New password cannot exceed 64 characters.' };
  }

  // Verify current password first
  const verification = await verifyAdminPassword(currentPassword);
  if (!verification.success) {
    return { success: false, error: 'Current password does not match.' };
  }

  try {
    // Generate a new random 16-byte hex salt
    const randomBytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(randomBytes);
    const salt = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    const newHash = await hashPasswordSubtle(trimmedNew, salt);
    const now = new Date().toISOString();

    const db = await getDatabase();
    db.run(
      'UPDATE admin_auth SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = 1',
      [newHash, salt, now]
    );

    await saveDatabaseToStorage(db);
    notifyListeners();

    // Trigger async server push so other devices get updated credentials
    forcePushToServer().catch((err) => console.warn('Background sync after password change failed:', err));

    return { success: true, message: 'Admin password updated successfully!' };
  } catch (err: any) {
    console.error('Failed to update admin password:', err);
    return { success: false, error: err?.message || 'Failed to update password' };
  }
}

// ---------------------------------------------------------------------------
// Heritage Section CRUD & Sync Methods
// ---------------------------------------------------------------------------

export async function getHeritageSettings(): Promise<HeritageSettingsData> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM heritage_settings WHERE id = 1');
  if (res.length === 0 || res[0].values.length === 0) {
    return {
      id: 1,
      ...DEFAULT_HERITAGE_SETTINGS,
      updated_at: new Date().toISOString(),
    };
  }
  const cols = res[0].columns;
  const obj: any = {};
  cols.forEach((c, i) => (obj[c] = res[0].values[0][i]));
  return obj as HeritageSettingsData;
}

export async function updateHeritageSettings(data: Partial<HeritageSettingsData>): Promise<void> {
  const db = await getDatabase();
  const existing = await getHeritageSettings();
  const updated: HeritageSettingsData = {
    ...existing,
    ...data,
    updated_at: new Date().toISOString(),
  };

  db.run(
    `INSERT OR REPLACE INTO heritage_settings (
      id, badge_text, subbadge_text, heading, description,
      va_image, va_image_alt, plaque_title, plaque_tag, plaque_description,
      residency_label, residency_title, residency_badge, residency_badge_color,
      provenance_tag, provenance_heading, lead_paragraph, updated_at
    ) VALUES (
      1, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )`,
    [
      updated.badge_text,
      updated.subbadge_text,
      updated.heading,
      updated.description,
      updated.va_image,
      updated.va_image_alt,
      updated.plaque_title,
      updated.plaque_tag,
      updated.plaque_description,
      updated.residency_label,
      updated.residency_title,
      updated.residency_badge,
      updated.residency_badge_color,
      updated.provenance_tag,
      updated.provenance_heading,
      updated.lead_paragraph,
      updated.updated_at,
    ]
  );

  // If va_image was changed, automatically sync site_media and track upload
  if (data.va_image && data.va_image !== existing.va_image) {
    try {
      db.run('UPDATE site_media SET image_url = ?, updated_at = ? WHERE key = ?', [
        data.va_image,
        updated.updated_at,
        'va_museum_image',
      ]);
      trackMediaUpload({
        title: updated.heading || 'V&A Museum Heritage Image',
        url: data.va_image,
        source: 'Heritage & V&A Archive',
        category: 'Exhibition Media',
      });
    } catch {
      // ignore
    }
  }

  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function resetHeritageSettings(): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  db.run(
    `INSERT OR REPLACE INTO heritage_settings (
      id, badge_text, subbadge_text, heading, description,
      va_image, va_image_alt, plaque_title, plaque_tag, plaque_description,
      residency_label, residency_title, residency_badge, residency_badge_color,
      provenance_tag, provenance_heading, lead_paragraph, updated_at
    ) VALUES (
      1, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )`,
    [
      DEFAULT_HERITAGE_SETTINGS.badge_text,
      DEFAULT_HERITAGE_SETTINGS.subbadge_text,
      DEFAULT_HERITAGE_SETTINGS.heading,
      DEFAULT_HERITAGE_SETTINGS.description,
      DEFAULT_HERITAGE_SETTINGS.va_image,
      DEFAULT_HERITAGE_SETTINGS.va_image_alt,
      DEFAULT_HERITAGE_SETTINGS.plaque_title,
      DEFAULT_HERITAGE_SETTINGS.plaque_tag,
      DEFAULT_HERITAGE_SETTINGS.plaque_description,
      DEFAULT_HERITAGE_SETTINGS.residency_label,
      DEFAULT_HERITAGE_SETTINGS.residency_title,
      DEFAULT_HERITAGE_SETTINGS.residency_badge,
      DEFAULT_HERITAGE_SETTINGS.residency_badge_color,
      DEFAULT_HERITAGE_SETTINGS.provenance_tag,
      DEFAULT_HERITAGE_SETTINGS.provenance_heading,
      DEFAULT_HERITAGE_SETTINGS.lead_paragraph,
      now,
    ]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Heritage Credentials
export async function getHeritageCredentials(): Promise<HeritageCredentialData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM heritage_credentials ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as HeritageCredentialData;
  });
}

export async function createHeritageCredential(data: Omit<HeritageCredentialData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    'INSERT INTO heritage_credentials (icon, title, description, color, order_index) VALUES (?, ?, ?, ?, ?)',
    [data.icon || 'radio', data.title, data.description, data.color || 'amber', data.order_index ?? 0]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateHeritageCredential(id: number, data: Partial<HeritageCredentialData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(data).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (data as any)[k]);
  values.push(id);
  db.run(`UPDATE heritage_credentials SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteHeritageCredential(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM heritage_credentials WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Heritage Chapters
export async function getHeritageChapters(): Promise<HeritageChapterData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM heritage_chapters ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as HeritageChapterData;
  });
}

export async function createHeritageChapter(data: Omit<HeritageChapterData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    'INSERT INTO heritage_chapters (tab_label, title, period, content, order_index) VALUES (?, ?, ?, ?, ?)',
    [data.tab_label, data.title, data.period, data.content, data.order_index ?? 0]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateHeritageChapter(id: number, data: Partial<HeritageChapterData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(data).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (data as any)[k]);
  values.push(id);
  db.run(`UPDATE heritage_chapters SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteHeritageChapter(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM heritage_chapters WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Heritage Milestones
export async function getHeritageMilestones(): Promise<HeritageMilestoneData[]> {
  const db = await getDatabase();
  const res = db.exec('SELECT * FROM heritage_milestones ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj as HeritageMilestoneData;
  });
}

export async function createHeritageMilestone(data: Omit<HeritageMilestoneData, 'id'>): Promise<number> {
  const db = await getDatabase();
  db.run(
    'INSERT INTO heritage_milestones (year_badge, title, description, color, order_index) VALUES (?, ?, ?, ?, ?)',
    [data.year_badge, data.title, data.description, data.color || 'amber', data.order_index ?? 0]
  );
  await saveDatabaseToStorage(db);
  notifyListeners();
  const lastId = db.exec('SELECT last_insert_rowid() as id');
  return Number(lastId[0].values[0][0]);
}

export async function updateHeritageMilestone(id: number, data: Partial<HeritageMilestoneData>): Promise<void> {
  const db = await getDatabase();
  const keys = Object.keys(data).filter((k) => k !== 'id');
  if (keys.length === 0) return;
  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (data as any)[k]);
  values.push(id);
  db.run(`UPDATE heritage_milestones SET ${setClause} WHERE id = ?`, values);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

export async function deleteHeritageMilestone(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('DELETE FROM heritage_milestones WHERE id = ?', [id]);
  await saveDatabaseToStorage(db);
  notifyListeners();
}

// Full Heritage Bundle
export async function getHeritageFullData(): Promise<HeritageFullData> {
  const [settings, credentials, chapters, milestones] = await Promise.all([
    getHeritageSettings(),
    getHeritageCredentials(),
    getHeritageChapters(),
    getHeritageMilestones(),
  ]);

  return {
    settings,
    credentials,
    chapters,
    milestones,
  };
}


