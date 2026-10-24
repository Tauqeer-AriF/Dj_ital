import initSqlJs, { Database } from 'sql.js';

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export interface ProfileData {
  id: number;
  artist_name: string;
  tagline: string;
  bio_short: string;
  bio_full: string;
  years_active: string;
  heritage_title: string;
  heritage_subtitle: string;
  heritage_description: string;
  kool_fm_legacy: string;
  va_exhibition_title: string;
  va_exhibition_quote: string;
  booking_email: string;
  booking_phone: string;
  management_company: string;
  notable_festivals: string;
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
  color_scheme: string;
  font_family_preset: string;
  custom_accent_color: string;
  body_font_preset: string;
  logo_url: string;
  stream_url: string;
  navbar_subtitle?: string;
  subtitle?: string;
  hero_stream_url?: string;
  main_player_stream_url?: string;
  signature_bpm?: number;
  brand_slogan?: string;
  stage_name?: string;
  origin?: string;
  genres?: string;
  regions_covered?: string;
  key_venues?: string;
  radio_show?: string;
  direct_email?: string;
  whatsapp_number?: string;
  whatsapp_message?: string;
  booking_agency?: string;
  shopify_merch_url?: string;
  merch_badge_text?: string;
  dejavu_stream_url?: string;
  real_name?: string;
  active_since?: string;
  va_recognition_year?: string;
  kool_fm_role?: string;
  is_live_on_air?: number;
  live_show_title?: string;
}

export type SiteMediaData = SiteMediaSlot;

export interface HeritageFullData {
  settings: HeritageSettingsData;
  credentials: HeritageCredentialData[];
  chapters: HeritageChapterData[];
  milestones: HeritageMilestoneData[];
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
  status: string;
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
  album_cover_url: string;
  video_url: string;
}

export interface GalleryData {
  id: number;
  title: string;
  category: string;
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
  updated_at?: string;
}

export interface BookingData {
  id: number;
  client_name: string;
  client_email: string;
  client_phone?: string;
  event_type: string;
  target_date: string;
  venue_city: string;
  venue_location?: string;
  set_length?: string;
  estimated_budget: string;
  message: string;
  status: string;
  created_at: string;
}

export interface StatData {
  id: number;
  label: string;
  value: string;
  suffix: string;
  order_index: number;
}

export interface SiteMediaSlot {
  key: string;
  section: string;
  label: string;
  description: string;
  image_url: string;
  default_url: string;
  updated_at?: string;
}

export interface AudioMixData {
  id: number;
  title: string;
  style: string;
  platform: string;
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
  category: string;
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
  avatar_url?: string;
  rating: number;
  order_index: number;
}

export interface VenueLogoData {
  id: number;
  name: string;
  location?: string;
  logo_text?: string;
  order_index: number;
}

export interface NewsletterSubscriberData {
  id: number;
  email: string;
  created_at: string;
  source: string;
}

export interface MediaLibraryItem {
  id: number;
  title: string;
  file_name?: string;
  file_type: string;
  mime_type?: string;
  url: string;
  source?: string;
  size_text?: string;
  category?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAuthInfo {
  hasCustomPassword: boolean;
  updatedAt: string;
  lastLoginAt: string;
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
  updated_at?: string;
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

// ---------------------------------------------------------------------------
// Default Configurations
// ---------------------------------------------------------------------------

export const DEFAULT_HERITAGE_SETTINGS: HeritageSettingsData = {
  id: 1,
  badge_text: 'CULTURAL ARCHIVE & PROVENANCE',
  subbadge_text: 'ORIGINAL UK JUNGLE HERITAGE',
  heading: 'From Rooftop Transmitters to The V&A East Museum',
  description:
    'Documenting over three decades of pirate radio engineering, dubplate cutting, and sound system culture that shaped modern electronic music.',
  va_image: '/images/va_museum_exhibition_1790112416279.jpg',
  va_image_alt: 'V&A East Museum Exhibition - UK Underground Music Heritage featuring DJ Ital',
  plaque_title: 'V&A EAST CULTURAL RECOGNITION',
  plaque_tag: 'EXHIBITION ARCHIVE',
  plaque_description:
    'Honoured in the Victoria & Albert Museum East permanent music collection celebrating pioneering figures of British sound system culture.',
  residency_label: 'ORIGINAL RESIDENCY',
  residency_title: 'Kool FM 94.5 London',
  residency_badge: '1992 - 1999',
  residency_badge_color: 'amber',
  provenance_tag: 'PIRATE RADIO ARCHIVES',
  provenance_heading: 'Broadcasting the Sound of London Underground',
  lead_paragraph:
    'Before global festivals and streaming algorithms, the jungle sound was forged through illicit aerials mounted across East and North London council estates. DJ Ital broadcast raw acetate dubplates that defined a generation.',
};

export const DEFAULT_DOCUMENTARY_SETTINGS: DocumentarySettingsData = {
  id: 1,
  badge_text: '4-PART ARCHIVAL SERIES',
  subbadge_text: 'ORAL HISTORY & SOUND SYSTEM CULTURE',
  heading: 'The Dubplate Chronicles: 30 Years of Bassline Architecture',
  description:
    'An exclusive four-part documentary deep-dive exploring the birth of UK jungle, Kool FM pirate radio operations, and the cultural movement that gave rise to Vital Fest.',
  youtube_button_text: 'SUBSCRIBE ON YOUTUBE',
  youtube_series_url: 'https://youtube.com/@djital',
  show_youtube_button: 1,
  is_section_visible: 1,
};

// ---------------------------------------------------------------------------
// Internal SQLite Database State & Synchronization
// ---------------------------------------------------------------------------

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;
const dbListeners = new Set<() => void>();
const savingListeners = new Set<(isSaving: boolean, message?: string) => void>();
let serverSaveRejection: string | null = null;

export function subscribeDb(listener: () => void): () => void {
  dbListeners.add(listener);
  return () => dbListeners.delete(listener);
}

function notifyDbChanged() {
  dbListeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in DB listener:', e);
    }
  });
}

export function subscribeSaving(listener: (isSaving: boolean, message?: string) => void): () => void {
  savingListeners.add(listener);
  return () => savingListeners.delete(listener);
}

export function notifySavingState(isSaving: boolean, message?: string) {
  savingListeners.forEach((fn) => {
    try {
      fn(isSaving, message);
    } catch (e) {
      console.error('Error in saving listener:', e);
    }
  });
}

// Utilities for binary <-> base64 conversion
export function uint8ArrayToBase64(u8: Uint8Array): string {
  let binary = '';
  const len = u8.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = u8.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function setServerSaveRejection(message: string | null): void {
  serverSaveRejection = message;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(message ? 'djital:save-rejected' : 'djital:save-accepted'));
}

export function getServerSaveRejection(): string | null {
  return serverSaveRejection;
}

async function pushDatabaseSnapshot(customTimestamp?: string): Promise<{ success: boolean; message: string }> {
  if (!dbInstance) return { success: false, message: 'Database is not initialized.' };
  try {
    const data = uint8ArrayToBase64(dbInstance.export());
    const response = await fetch('/api/db/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, timestamp: customTimestamp || new Date().toISOString() }),
    });
    if (!response.ok) {
      return { success: false, message: `Server rejected database save (HTTP ${response.status}).` };
    }
    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('success' in result) ||
      result.success !== true
    ) {
      const message =
        typeof result === 'object' &&
        result !== null &&
        'error' in result &&
        typeof result.error === 'string'
          ? result.error
          : 'Server rejected database save.';
      return { success: false, message };
    }
    return { success: true, message: 'Database saved to server.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Could not connect to the database server.',
    };
  }
}

export function ensureSchemaMigrations(db: Database) {
  // Ensure table extensions and missing columns exist
  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS deleted_media_urls (url TEXT PRIMARY KEY, deleted_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS _system_meta (key TEXT PRIMARY KEY, value TEXT);
    `);

    const releasesTable = db.exec('PRAGMA table_info(releases)');
    if (releasesTable.length > 0) {
      const columns = new Set(releasesTable[0].values.map((column) => String(column[1])));
      if (!columns.has('album_cover_url')) {
        db.run("ALTER TABLE releases ADD COLUMN album_cover_url TEXT NOT NULL DEFAULT ''");
      }
      if (!columns.has('video_url')) {
        db.run("ALTER TABLE releases ADD COLUMN video_url TEXT NOT NULL DEFAULT ''");
      }
    }
  } catch (e) {
    console.error('Could not migrate release media fields:', e);
  }
}

export async function saveDatabaseToServer(customTimestamp?: string): Promise<void> {
  if (!dbInstance) return;
  notifySavingState(true, 'Saving changes to database...');
  try {
    const result = await pushDatabaseSnapshot(customTimestamp);
    if (result.success) {
      setServerSaveRejection(null);
    } else {
      setServerSaveRejection(result.message);
      console.error('Could not persist the database snapshot to the server:', result.message);
      throw new Error(result.message);
    }
  } finally {
    notifySavingState(false);
    notifyDbChanged();
  }
}

export async function forceSaveToServer(): Promise<{ ok: boolean; message?: string }> {
  notifySavingState(true, 'Saving changes to database...');
  try {
    if (!dbInstance) await initDatabase();
    const result = await pushDatabaseSnapshot();
    setServerSaveRejection(result.success ? null : result.message);
    return result.success ? { ok: true } : { ok: false, message: result.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not initialize the local database.';
    setServerSaveRejection(message);
    return { ok: false, message };
  } finally {
    notifySavingState(false);
    notifyDbChanged();
  }
}

export async function forcePushToServer(): Promise<{ success: boolean; message: string }> {
  const result = await forceSaveToServer();
  return {
    success: result.ok,
    message: result.message || 'Database synchronized with the server.',
  };
}

export async function forcePullFromServer(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch('/api/db/load', { cache: 'no-store' });
    if (!response.ok) {
      return { success: false, message: `Could not load server database (HTTP ${response.status}).` };
    }
    const result: unknown = await response.json();
    if (
      typeof result !== 'object' ||
      result === null ||
      !('data' in result) ||
      typeof result.data !== 'string'
    ) {
      return { success: false, message: 'The server did not return a database snapshot.' };
    }
    const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    const db = new SQL.Database(base64ToUint8Array(result.data));
    ensureSchemaMigrations(db);
    dbInstance = db;
    initPromise = Promise.resolve(db);
    setServerSaveRejection(null);
    notifyDbChanged();
    return { success: true, message: 'Pulled latest database from server.' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Could not restore the server database.',
    };
  }
}

export async function downloadDatabaseFile(): Promise<void> {
  const response = await fetch('/api/db/export', { cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || `Database export failed (HTTP ${response.status}).`);
  }
  const blob = await response.blob();
  if (!blob.size) throw new Error('The server returned an empty SQLite database file.');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `djital_database_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function importDatabaseBinary(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  const restoredDb = new SQL.Database(data);
  ensureSchemaMigrations(restoredDb);
  dbInstance = restoredDb;
  initPromise = Promise.resolve(restoredDb);
  const result = await forceSaveToServer();
  if (!result.ok) throw new Error(result.message || 'Could not synchronize restored database.');
}

export async function initDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: () => '/sql-wasm.wasm',
    });

    const response = await fetch('/api/db/load', { cache: 'no-store' });
    let dbData: Uint8Array;
    let isFactorySeed = false;

    if (response.ok) {
      const result: unknown = await response.json();
      if (
        typeof result !== 'object' ||
        result === null ||
        !('success' in result) ||
        result.success !== true ||
        !('data' in result) ||
        typeof result.data !== 'string' ||
        !result.data.trim()
      ) {
        throw new Error('The server returned an invalid database snapshot.');
      }
      dbData = base64ToUint8Array(result.data);
    } else if (response.status === 404) {
      const seedResponse = await fetch('/djital_db.sqlite.b64', { cache: 'no-store' });
      if (!seedResponse.ok) {
        throw new Error(`Could not load the factory database seed (HTTP ${seedResponse.status}).`);
      }
      const seed = await seedResponse.text();
      if (!seed.trim()) throw new Error('The factory database seed is empty.');
      dbData = base64ToUint8Array(seed);
      isFactorySeed = true;
    } else {
      throw new Error(`Could not load the server database (HTTP ${response.status}).`);
    }

    dbInstance = new SQL.Database(dbData);
    ensureSchemaMigrations(dbInstance);
    if (isFactorySeed) await saveDatabaseToServer();
    return dbInstance;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    dbInstance = null;
    throw error;
  }
}

export function getDatabase(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Await initDatabase() first.');
  }
  return dbInstance;
}

export async function exportCompleteDatabase(): Promise<string> {
  const db = await initDatabase();
  const bytes = db.export();
  return uint8ArrayToBase64(bytes);
}

export async function executeQuery(sql: string): Promise<any[]> {
  const db = await initDatabase();
  const results = db.exec(sql);
  // Auto-sync write queries
  if (/\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/i.test(sql)) {
    await saveDatabaseToServer();
  }
  return results;
}

export async function restorePreviousCustomData(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/db/previous', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch snapshot');
    const json = await res.json();
    if (typeof json.data !== 'string' || !json.data) throw new Error('No previous database snapshot found');
    const u8 = base64ToUint8Array(json.data);
    const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
    const restoredDb = new SQL.Database(u8);
    ensureSchemaMigrations(restoredDb);
    dbInstance = restoredDb;
    initPromise = Promise.resolve(restoredDb);
    const saveResult = await forceSaveToServer();
    if (!saveResult.ok) throw new Error(saveResult.message || 'Could not save restored database.');
    notifyDbChanged();
    return { success: true, message: 'Restored and synchronized the previous custom database snapshot.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Restore error' };
  }
}

async function openSeedDatabase(): Promise<Database> {
  const response = await fetch('/djital_db.sqlite.b64', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load factory seed database (HTTP ${response.status}).`);
  const text = await response.text();
  if (!text.trim()) throw new Error('Factory seed database is empty.');
  const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
  return new SQL.Database(base64ToUint8Array(text));
}

async function restoreTablesFromSeed(tableNames: string[]): Promise<void> {
  const db = await initDatabase();
  const seedDb = await openSeedDatabase();
  try {
    db.run('BEGIN TRANSACTION');
    for (const tableName of tableNames) {
      const seedResult = seedDb.exec(`SELECT * FROM ${tableName}`);
      const targetInfo = db.exec(`PRAGMA table_info(${tableName})`);
      if (seedResult.length === 0 || targetInfo.length === 0) {
        throw new Error(`Could not find the ${tableName} table in the seed or current database.`);
      }

      const seedColumns = seedResult[0].columns;
      const targetColumns = new Set(targetInfo[0].values.map((column) => String(column[1])));
      const columns = seedColumns.filter((column) => targetColumns.has(column));
      if (!columns.length) throw new Error(`No compatible columns found for ${tableName}.`);

      const insertSql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
      db.run(`DELETE FROM ${tableName}`);
      for (const row of seedResult[0].values) {
        const values = columns.map((column) => row[seedColumns.indexOf(column)]);
        db.run(insertSql, values);
      }
    }
    db.run('COMMIT');
  } catch (error) {
    try {
      db.run('ROLLBACK');
    } catch {
      // Preserve the original error if the transaction has already closed.
    }
    throw error;
  } finally {
    seedDb.close();
  }
  await saveDatabaseToServer();
}

export async function resetDatabaseToSeed(): Promise<void> {
  const seedDb = await openSeedDatabase();
  dbInstance = seedDb;
  initPromise = Promise.resolve(seedDb);
  ensureSchemaMigrations(seedDb);
  await saveDatabaseToServer();
  notifyDbChanged();
}

// ---------------------------------------------------------------------------
// CRUD Helpers
// ---------------------------------------------------------------------------

// PROFILE
export async function getProfile(): Promise<ProfileData> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM profile WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const vals = res[0].values[0];
    const obj: any = {};
    cols.forEach((c, idx) => {
      obj[c] = vals[idx];
    });
    return obj as ProfileData;
  }
  throw new Error('Profile record not found in database');
}

export async function updateProfile(data: Partial<ProfileData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;

  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));

  db.run(`UPDATE profile SET ${setClauses} WHERE id = 1`, values);
  await saveDatabaseToServer();
}

export async function resetProfile(): Promise<void> {
  await restoreTablesFromSeed(['profile']);
}

// EVENTS
export async function getEvents(): Promise<EventData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM events ORDER BY event_date ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as EventData;
  });
}

export async function createEvent(data: Partial<EventData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO events (title, venue, location, event_date, start_time, lineup, ticket_url, status, price_text, is_featured, flyer_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Untitled Event',
      data.venue || 'TBA',
      data.location || 'London, UK',
      data.event_date || new Date().toISOString().split('T')[0],
      data.start_time || '22:00',
      data.lineup || '',
      data.ticket_url || '',
      data.status || 'Upcoming',
      data.price_text || '£15.00',
      data.is_featured ? 1 : 0,
      data.flyer_image || '/images/vital_fest_crowd_1790112387611.jpg',
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateEvent(id: number, data: Partial<EventData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE events SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteEvent(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM events WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// RELEASES
export async function getReleases(): Promise<ReleaseData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM releases ORDER BY release_year DESC, id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as ReleaseData;
  });
}

export async function createRelease(data: Partial<ReleaseData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO releases (title, release_year, label, catalog_number, format, bpm, audio_theme, stream_url, description, is_featured, album_cover_url, video_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Untitled Dubplate',
      data.release_year || new Date().getFullYear(),
      data.label || 'Vital Records',
      data.catalog_number || 'VR-001',
      data.format || '12" Vinyl / Digital',
      data.bpm || 164,
      data.audio_theme || 'Sub-bass pressure',
      data.stream_url || '',
      data.description || '',
      data.is_featured ? 1 : 0,
      data.album_cover_url || '',
      data.video_url || '',
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateRelease(id: number, data: Partial<ReleaseData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE releases SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteRelease(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM releases WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// GALLERY
export async function getGallery(): Promise<GalleryData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM gallery ORDER BY id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as GalleryData;
  });
}

export async function createGalleryItem(data: Partial<GalleryData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO gallery (title, category, image_url, caption, year, location, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Archive Photo',
      data.category || 'Live Sets',
      data.image_url || '/images/dj_ital_hero_1790112374509.jpg',
      data.caption || '',
      data.year || `${new Date().getFullYear()}`,
      data.location || 'London, UK',
      data.is_featured ? 1 : 0,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateGalleryItem(id: number, data: Partial<GalleryData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE gallery SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteGalleryItem(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM gallery WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// DOCUMENTARY
export async function getDocumentaries(): Promise<DocumentaryData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM documentary ORDER BY episode_number ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as DocumentaryData;
  });
}

export async function createDocumentary(data: Partial<DocumentaryData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO documentary (episode_number, title, duration, description, youtube_url, topics, thumbnail_url, badge_label, action_button_text, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.episode_number || 1,
      data.title || 'Episode',
      data.duration || '24:00',
      data.description || '',
      data.youtube_url || '',
      data.topics || '',
      data.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg',
      data.badge_label || `EPISODE ${data.episode_number || 1}`,
      data.action_button_text || 'WATCH ARCHIVAL TAPE',
      data.order_index || data.episode_number || 1,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateDocumentary(id: number, data: Partial<DocumentaryData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE documentary SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteDocumentary(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM documentary WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function resetDocumentaries(): Promise<void> {
  await restoreTablesFromSeed(['documentary']);
}

export async function getDocumentarySettings(): Promise<DocumentarySettingsData> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM documentary_settings WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const vals = res[0].values[0];
    const obj: any = {};
    cols.forEach((c, idx) => (obj[c] = vals[idx]));
    return obj as DocumentarySettingsData;
  }
  return DEFAULT_DOCUMENTARY_SETTINGS;
}

export async function updateDocumentarySettings(data: Partial<DocumentarySettingsData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE documentary_settings SET ${setClauses} WHERE id = 1`, values);
  await saveDatabaseToServer();
}

export async function resetDocumentarySettings(): Promise<void> {
  await updateDocumentarySettings(DEFAULT_DOCUMENTARY_SETTINGS);
}

// BOOKINGS
export async function getBookings(): Promise<BookingData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM bookings ORDER BY created_at DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as BookingData;
  });
}

export async function createBooking(data: Partial<BookingData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO bookings (client_name, client_email, client_phone, event_type, target_date, venue_city, venue_location, set_length, estimated_budget, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.client_name || 'Promoter',
      data.client_email || 'promoter@example.com',
      data.client_phone || '',
      data.event_type || 'Club Night',
      data.target_date || new Date().toISOString().split('T')[0],
      data.venue_city || 'London',
      data.venue_location || '',
      data.set_length || '90 min',
      data.estimated_budget || '',
      data.message || '',
      data.status || 'Pending',
      data.created_at || new Date().toISOString(),
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateBookingStatus(id: number, status: string): Promise<void> {
  const db = await initDatabase();
  db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
  await saveDatabaseToServer();
}

export async function deleteBooking(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM bookings WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// STATS
export async function getStats(): Promise<StatData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM stats ORDER BY order_index ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as StatData;
  });
}

export async function updateStat(id: number, value: string, label?: string): Promise<void> {
  const db = await initDatabase();
  if (label) {
    db.run('UPDATE stats SET value = ?, label = ? WHERE id = ?', [value, label, id]);
  } else {
    db.run('UPDATE stats SET value = ? WHERE id = ?', [value, id]);
  }
  await saveDatabaseToServer();
}

// SITE MEDIA
export async function getSiteMedia(): Promise<SiteMediaSlot[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM site_media ORDER BY section ASC, key ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as SiteMediaSlot;
  });
}

export async function updateSiteMedia(key: string, url: string): Promise<void> {
  const db = await initDatabase();
  db.run('UPDATE site_media SET image_url = ?, updated_at = ? WHERE key = ?', [url, new Date().toISOString(), key]);
  await saveDatabaseToServer();
}

export async function resetSiteMedia(key: string): Promise<void> {
  const db = await initDatabase();
  db.run('UPDATE site_media SET image_url = default_url, updated_at = ? WHERE key = ?', [new Date().toISOString(), key]);
  await saveDatabaseToServer();
}

export async function resetAllSiteMedia(): Promise<void> {
  const db = await initDatabase();
  db.run('UPDATE site_media SET image_url = default_url, updated_at = ?', [new Date().toISOString()]);
  await saveDatabaseToServer();
}

// AUDIO MIXES & VIDEOS
export async function getAudioMixes(): Promise<AudioMixData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM audio_mixes ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as AudioMixData;
  });
}

export async function createAudioMix(data: Partial<AudioMixData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO audio_mixes (title, style, platform, embed_url, stream_url, duration, description, is_featured, order_index)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Live Jungle Set',
      data.style || 'Jungle / D&B',
      data.platform || 'Mixcloud',
      data.embed_url || '',
      data.stream_url || '',
      data.duration || '60:00',
      data.description || '',
      data.is_featured ? 1 : 0,
      data.order_index || 0,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateAudioMix(id: number, data: Partial<AudioMixData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE audio_mixes SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteAudioMix(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM audio_mixes WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function getVideos(): Promise<VideoData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM videos ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as VideoData;
  });
}

export async function createVideo(data: Partial<VideoData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO videos (title, category, video_url, thumbnail_url, duration, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Festival Video',
      data.category || 'Live Set',
      data.video_url || '',
      data.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg',
      data.duration || '12:00',
      data.order_index || 0,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateVideo(id: number, data: Partial<VideoData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE videos SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteVideo(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM videos WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// TESTIMONIALS & VENUES
export async function getTestimonials(): Promise<TestimonialData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM testimonials ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as TestimonialData;
  });
}

export async function createTestimonial(data: Partial<TestimonialData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO testimonials (quote, author_name, role_venue, avatar_url, rating, order_index)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.quote || 'Outstanding performance.',
      data.author_name || 'Promoter',
      data.role_venue || 'Club Resident',
      data.avatar_url || '',
      data.rating || 5,
      data.order_index || 0,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateTestimonial(id: number, data: Partial<TestimonialData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE testimonials SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteTestimonial(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM testimonials WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function getVenueLogos(): Promise<VenueLogoData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM venue_logos ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as VenueLogoData;
  });
}

export async function createVenueLogo(data: Partial<VenueLogoData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO venue_logos (name, location, logo_text, order_index)
     VALUES (?, ?, ?, ?)`,
    [data.name || 'Venue', data.location || 'London', data.logo_text || '', data.order_index || 0]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateVenueLogo(id: number, data: Partial<VenueLogoData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE venue_logos SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteVenueLogo(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM venue_logos WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// NEWSLETTER
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriberData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as NewsletterSubscriberData;
  });
}

export async function createNewsletterSubscriber(email: string, source = 'Website'): Promise<number> {
  const db = await initDatabase();
  db.run('INSERT OR IGNORE INTO newsletter_subscribers (email, created_at, source) VALUES (?, ?, ?)', [
    email.trim().toLowerCase(),
    new Date().toISOString(),
    source,
  ]);
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export const addNewsletterSubscriber = createNewsletterSubscriber;

export async function deleteNewsletterSubscriber(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM newsletter_subscribers WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

// MEDIA LIBRARY
export async function getMediaLibrary(): Promise<MediaLibraryItem[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM media_library ORDER BY id DESC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as MediaLibraryItem;
  });
}

export async function createMediaLibraryItem(data: Partial<MediaLibraryItem>): Promise<number> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO media_library (title, file_name, file_type, mime_type, url, source, size_text, category, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || 'Untitled Asset',
      data.file_name || 'asset',
      data.file_type || 'image',
      data.mime_type || 'image/jpeg',
      data.url || '/images/dj_ital_hero_1790112374509.jpg',
      data.source || 'Upload',
      data.size_text || '1.2 MB',
      data.category || 'General',
      data.description || '',
      now,
      now,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function createMediaLibraryItems(items: Partial<MediaLibraryItem>[]): Promise<number[]> {
  if (items.length === 0) return [];
  const db = await initDatabase();
  const now = new Date().toISOString();
  const ids: number[] = [];

  db.run('BEGIN TRANSACTION');
  try {
    for (const data of items) {
      db.run(
        `INSERT INTO media_library (title, file_name, file_type, mime_type, url, source, size_text, category, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.title || 'Untitled Asset',
          data.file_name || 'asset',
          data.file_type || 'image',
          data.mime_type || 'image/jpeg',
          data.url || '/images/dj_ital_hero_1790112374509.jpg',
          data.source || 'Upload',
          data.size_text || '1.2 MB',
          data.category || 'General',
          data.description || '',
          now,
          now,
        ]
      );
      const idRes = db.exec('SELECT last_insert_rowid() as id');
      ids.push(idRes[0].values[0][0] as number);
    }
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }

  await saveDatabaseToServer();
  return ids;
}

export async function updateMediaLibraryItem(id: number, data: Partial<MediaLibraryItem>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE media_library SET ${setClauses}, updated_at = ? WHERE id = ?`, [
    ...values,
    new Date().toISOString(),
    id,
  ]);
  await saveDatabaseToServer();
}

export interface MediaFileCleanupResult {
  deleted: number;
  missing: number;
  retainedReferenced: number;
  skipped: number;
  error?: string;
}

async function cleanupUnreferencedMediaFiles(urls: string[]): Promise<MediaFileCleanupResult> {
  const result: MediaFileCleanupResult = {
    deleted: 0,
    missing: 0,
    retainedReferenced: 0,
    skipped: 0,
  };
  const uniqueUrls = Array.from(new Set(urls.filter((url) => url.startsWith('/uploads/'))));
  if (uniqueUrls.length === 0) return result;

  try {
    const response = await fetch('/api/uploads/delete-unreferenced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: uniqueUrls }),
    });
    const body: unknown = await response.json();
    if (!response.ok || typeof body !== 'object' || body === null || !('success' in body) || body.success !== true) {
      const message =
        typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
          ? body.error
          : `Server rejected upload cleanup (HTTP ${response.status}).`;
      return { ...result, error: message };
    }

    return {
      deleted: 'deleted' in body && typeof body.deleted === 'number' ? body.deleted : 0,
      missing: 'missing' in body && typeof body.missing === 'number' ? body.missing : 0,
      retainedReferenced:
        'retainedReferenced' in body && typeof body.retainedReferenced === 'number'
          ? body.retainedReferenced
          : 0,
      skipped: 'skipped' in body && typeof body.skipped === 'number' ? body.skipped : 0,
    };
  } catch (error) {
    return {
      ...result,
      error: error instanceof Error ? error.message : 'Could not contact the server to remove uploaded files.',
    };
  }
}

function queueMediaFilesForCleanup(db: Database, urls: string[]): void {
  const eligibleUrls = Array.from(new Set(urls.filter((url) =>
    /^\/uploads\/\d{13}_[a-f0-9]{16}_[a-zA-Z0-9._-]+$/.test(url)
  )));
  const deletedAt = new Date().toISOString();
  for (const url of eligibleUrls) {
    db.run(
      'INSERT OR REPLACE INTO deleted_media_urls (url, deleted_at) VALUES (?, ?)',
      [url, deletedAt]
    );
  }
}

export async function deleteMediaLibraryItem(id: number): Promise<MediaFileCleanupResult> {
  const db = await initDatabase();
  const urlResult = db.exec('SELECT url FROM media_library WHERE id = ?', [id]);
  const urls = urlResult[0]?.values.map(([url]) => String(url)) || [];
  db.run('BEGIN TRANSACTION');
  try {
    queueMediaFilesForCleanup(db, urls);
    db.run('DELETE FROM media_library WHERE id = ?', [id]);
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  await saveDatabaseToServer();
  return cleanupUnreferencedMediaFiles(urls);
}

export async function updateMediaLibraryItemsCategory(ids: number[], category: string): Promise<void> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  if (uniqueIds.length === 0) return;
  const db = await initDatabase();
  db.run('BEGIN TRANSACTION');
  try {
    const now = new Date().toISOString();
    for (let offset = 0; offset < uniqueIds.length; offset += 500) {
      const chunk = uniqueIds.slice(offset, offset + 500);
      const placeholders = chunk.map(() => '?').join(', ');
      db.run(
        `UPDATE media_library SET category = ?, updated_at = ? WHERE id IN (${placeholders})`,
        [category.trim() || 'General', now, ...chunk]
      );
    }
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  await saveDatabaseToServer();
}

export async function deleteMediaLibraryItems(ids: number[]): Promise<MediaFileCleanupResult> {
  const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0)));
  if (uniqueIds.length === 0) {
    return { deleted: 0, missing: 0, retainedReferenced: 0, skipped: 0 };
  }
  const db = await initDatabase();
  const urls: string[] = [];
  for (let offset = 0; offset < uniqueIds.length; offset += 500) {
    const chunk = uniqueIds.slice(offset, offset + 500);
    const placeholders = chunk.map(() => '?').join(', ');
    const urlResult = db.exec(`SELECT url FROM media_library WHERE id IN (${placeholders})`, chunk);
    urls.push(...(urlResult[0]?.values.map(([url]) => String(url)) || []));
  }
  db.run('BEGIN TRANSACTION');
  try {
    queueMediaFilesForCleanup(db, urls);
    for (let offset = 0; offset < uniqueIds.length; offset += 500) {
      const chunk = uniqueIds.slice(offset, offset + 500);
      const placeholders = chunk.map(() => '?').join(', ');
      db.run(`DELETE FROM media_library WHERE id IN (${placeholders})`, chunk);
    }
    db.run('COMMIT');
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
  await saveDatabaseToServer();
  return cleanupUnreferencedMediaFiles(urls);
}

// SECURITY & AUTH
export const DEFAULT_ADMIN_PASSWORD = 'ital1991';

async function sha256(str: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getAdminAuthInfo(): Promise<AdminAuthInfo> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM admin_auth WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const row = res[0].values[0];
    return {
      hasCustomPassword: true,
      updatedAt: (row[3] as string) || '',
      lastLoginAt: (row[4] as string) || '',
    };
  }
  return {
    hasCustomPassword: false,
    updatedAt: '',
    lastLoginAt: '',
  };
}

export async function changeAdminPassword(oldPass: string, newPass: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const db = await initDatabase();
  if (!(await verifyAdminPassword(oldPass))) {
    return { success: false, error: 'Current password is incorrect.' };
  }
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const hash = await sha256(newPass + salt);
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO admin_auth (id, password_hash, password_salt, updated_at, last_login_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET password_hash = excluded.password_hash, password_salt = excluded.password_salt, updated_at = excluded.updated_at`,
    [hash, salt, now, now]
  );
  await saveDatabaseToServer();
  return { success: true, message: 'Password successfully changed and encrypted in database.' };
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const db = await initDatabase();
  const res = db.exec('SELECT password_hash, password_salt FROM admin_auth WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const [storedHash, salt] = res[0].values[0] as [string, string];
    const computed = await sha256(password + salt);
    return computed === storedHash;
  }
  return password === DEFAULT_ADMIN_PASSWORD;
}

// HERITAGE
export async function getHeritageSettings(): Promise<HeritageSettingsData> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM heritage_settings WHERE id = 1');
  if (res.length > 0 && res[0].values.length > 0) {
    const cols = res[0].columns;
    const vals = res[0].values[0];
    const obj: any = {};
    cols.forEach((c, idx) => (obj[c] = vals[idx]));
    return obj as HeritageSettingsData;
  }
  return DEFAULT_HERITAGE_SETTINGS;
}

export async function updateHeritageSettings(data: Partial<HeritageSettingsData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE heritage_settings SET ${setClauses} WHERE id = 1`, values);
  await saveDatabaseToServer();
}

export async function resetHeritageSettings(): Promise<void> {
  await updateHeritageSettings(DEFAULT_HERITAGE_SETTINGS);
}

export async function getHeritageCredentials(): Promise<HeritageCredentialData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM heritage_credentials ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as HeritageCredentialData;
  });
}

export async function createHeritageCredential(data: Partial<HeritageCredentialData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO heritage_credentials (icon, title, description, color, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [data.icon || 'radio', data.title || 'Credential', data.description || '', data.color || 'amber', data.order_index || 0]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateHeritageCredential(id: number, data: Partial<HeritageCredentialData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE heritage_credentials SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteHeritageCredential(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM heritage_credentials WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function getHeritageChapters(): Promise<HeritageChapterData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM heritage_chapters ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as HeritageChapterData;
  });
}

export async function createHeritageChapter(data: Partial<HeritageChapterData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO heritage_chapters (tab_label, title, period, content, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [
      data.tab_label || 'Chapter',
      data.title || 'Chapter Title',
      data.period || '1992 - Present',
      data.content || '',
      data.order_index || 0,
    ]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateHeritageChapter(id: number, data: Partial<HeritageChapterData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE heritage_chapters SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteHeritageChapter(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM heritage_chapters WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function getHeritageMilestones(): Promise<HeritageMilestoneData[]> {
  const db = await initDatabase();
  const res = db.exec('SELECT * FROM heritage_milestones ORDER BY order_index ASC, id ASC');
  if (res.length === 0) return [];
  const cols = res[0].columns;
  return res[0].values.map((v) => {
    const obj: any = {};
    cols.forEach((c, i) => (obj[c] = v[i]));
    return obj as HeritageMilestoneData;
  });
}

export async function createHeritageMilestone(data: Partial<HeritageMilestoneData>): Promise<number> {
  const db = await initDatabase();
  db.run(
    `INSERT INTO heritage_milestones (year_badge, title, description, color, order_index)
     VALUES (?, ?, ?, ?, ?)`,
    [data.year_badge || '1994', data.title || 'Milestone', data.description || '', data.color || 'amber', data.order_index || 0]
  );
  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0] as number;
  await saveDatabaseToServer();
  return id;
}

export async function updateHeritageMilestone(id: number, data: Partial<HeritageMilestoneData>): Promise<void> {
  const db = await initDatabase();
  const entries = Object.entries(data).filter(([k]) => k !== 'id');
  if (entries.length === 0) return;
  const setClauses = entries.map(([k]) => `${k} = ?`).join(', ');
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  db.run(`UPDATE heritage_milestones SET ${setClauses} WHERE id = ?`, [...values, id]);
  await saveDatabaseToServer();
}

export async function deleteHeritageMilestone(id: number): Promise<void> {
  const db = await initDatabase();
  db.run('DELETE FROM heritage_milestones WHERE id = ?', [id]);
  await saveDatabaseToServer();
}

export async function resetHeritageAll(): Promise<void> {
  await restoreTablesFromSeed([
    'heritage_settings',
    'heritage_credentials',
    'heritage_chapters',
    'heritage_milestones',
  ]);
}

export async function getHeritageFullData(): Promise<HeritageFullData> {
  const [settings, credentials, chapters, milestones] = await Promise.all([
    getHeritageSettings(),
    getHeritageCredentials(),
    getHeritageChapters(),
    getHeritageMilestones(),
  ]);
  return { settings, credentials, chapters, milestones };
}

export const getMediaLibraryItems = getMediaLibrary;

export async function trackMediaUpload(item: Partial<MediaLibraryItem>): Promise<number> {
  return await createMediaLibraryItem(item);
}
