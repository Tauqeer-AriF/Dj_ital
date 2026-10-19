import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import os from 'os';
import AdmZip from 'adm-zip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ----------------------------------------------------
// Persistent Storage & Railway Volume Management
// ----------------------------------------------------

export interface StorageStatus {
  resolvedDataDir: string;
  isPersistent: boolean;
  mountSource: string;
  isWritable: boolean;
  dbExists: boolean;
  dbSizeBytes: number;
  dbUpdatedAt?: string;
  isSeed?: boolean;
  candidatesChecked: Array<{ path: string; exists: boolean; writable: boolean; note: string }>;
  env: Record<string, string | undefined>;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const SEED_DIR = path.resolve(__dirname, 'seed_data');
const LOCAL_DATA_DIR = DATA_DIR;
const PROTECTED_SEED_DIR = SEED_DIR;

function testDirectoryWritable(dir: string): boolean {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const testFile = path.join(dir, `.test_write_${process.pid}_${Date.now()}`);
    fs.writeFileSync(testFile, 'ok', 'utf-8');
    fs.unlinkSync(testFile);
    return true;
  } catch {
    return false;
  }
}

function safeWriteFileWithSync(filePath: string, data: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = path.join(dir, `.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
  try {
    const fd = fs.openSync(tempPath, 'w');
    fs.writeSync(fd, data, 0, 'utf-8');
    try {
      fs.fsyncSync(fd);
    } catch {}
    fs.closeSync(fd);
    fs.renameSync(tempPath, filePath);
  } catch {
    fs.writeFileSync(filePath, data, 'utf-8');
  }
}

function getLinuxMountPoints(): string[] {
  try {
    if (!fs.existsSync('/proc/mounts')) return [];
    const content = fs.readFileSync('/proc/mounts', 'utf-8');
    const lines = content.split('\n');
    const mounts: string[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const mountPoint = parts[1];
        const fsType = parts[2];
        if (!['proc', 'sysfs', 'devpts', 'cgroup', 'tmpfs', 'mqueue', 'overlay'].includes(fsType)) {
          mounts.push(mountPoint);
        } else if (mountPoint.startsWith('/app') || mountPoint.startsWith('/data') || mountPoint.startsWith('/mnt') || mountPoint.startsWith('/storage')) {
          mounts.push(mountPoint);
        }
      }
    }
    return mounts;
  } catch {
    return [];
  }
}

function findLatestDatabase(): { seedDbPath?: string; seedMetaPath?: string; isCustom?: boolean; updatedAt?: string } {
  const possibleSeeds = [
    process.env.RAILWAY_VOLUME_MOUNT_PATH,
    process.env.DATA_DIR,
    process.env.PERSISTENT_DATA_DIR,
    '/data',
    '/app/data',
    path.resolve(process.cwd(), 'data'),
    LOCAL_DATA_DIR,
    path.join(LOCAL_DATA_DIR, 'backups'),
    PROTECTED_SEED_DIR,
  ].filter(Boolean) as string[];

  const uniqueDirs = Array.from(new Set(possibleSeeds));
  let bestDbPath: string | undefined;
  let bestMetaPath: string | undefined;
  let bestTime = -1;
  let bestIsCustom = false;
  let bestUpdatedAt: string | undefined;

  for (const s of uniqueDirs) {
    const candidateFiles = [
      { db: path.join(s, 'djital_db.sqlite.b64'), meta: path.join(s, 'db_meta.json') },
      { db: path.join(s, 'djital_db_previous_custom_data.b64'), meta: path.join(s, 'db_meta_custom.json') },
    ];

    for (const c of candidateFiles) {
      if (fs.existsSync(c.db)) {
        try {
          const stats = fs.statSync(c.db);
          if (stats.size > 100) {
            let time = stats.mtimeMs;
            let isSeed = true;
            let updatedAt = stats.mtime.toISOString();

            if (fs.existsSync(c.meta)) {
              try {
                const meta = JSON.parse(fs.readFileSync(c.meta, 'utf-8'));
                if (meta.updatedAt) {
                  const parsedTime = new Date(meta.updatedAt).getTime();
                  if (!isNaN(parsedTime)) time = parsedTime;
                  updatedAt = meta.updatedAt;
                }
                isSeed = Boolean(meta.isSeed);
              } catch {}
            }

            // High score for custom databases with user edits (or larger size containing media/docs)
            // Ensures newly deployed code or seed never wipes user edits
            const isCustom = !isSeed || stats.size > 200000 || c.db.includes('previous_custom');
            const score = (isCustom ? 10000000000000 : 0) + (stats.size > 200000 ? 500000000000 : 0) + time;

            if (score > bestTime || !bestDbPath) {
              bestTime = score;
              bestDbPath = c.db;
              bestMetaPath = fs.existsSync(c.meta) ? c.meta : undefined;
              bestIsCustom = isCustom;
              bestUpdatedAt = updatedAt;
            }
          }
        } catch {}
      }
    }
  }

  return { seedDbPath: bestDbPath, seedMetaPath: bestMetaPath, isCustom: bestIsCustom, updatedAt: bestUpdatedAt };
}

function getStorageDetails(): StorageStatus {
  const env: Record<string, string | undefined> = {
    RAILWAY_VOLUME_MOUNT_PATH: process.env.RAILWAY_VOLUME_MOUNT_PATH,
    RAILWAY_VOLUME_NAME: process.env.RAILWAY_VOLUME_NAME,
    DATA_DIR: process.env.DATA_DIR,
    PERSISTENT_DATA_DIR: process.env.PERSISTENT_DATA_DIR,
  };

  for (const [k, v] of Object.entries(process.env)) {
    if (k.includes('VOLUME') && (k.includes('PATH') || k.includes('MOUNT')) && v) {
      env[k] = v;
    }
  }

  const linuxMounts = getLinuxMountPoints();
  const candidates: Array<{ path: string; note: string; isExplicitVolume: boolean; isConfirmedMount: boolean }> = [];

  // 1. Explicit Railway Volume environment variables
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH && process.env.RAILWAY_VOLUME_MOUNT_PATH.trim()) {
    const p = path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH.trim());
    candidates.push({ path: p, note: 'env:RAILWAY_VOLUME_MOUNT_PATH', isExplicitVolume: true, isConfirmedMount: true });
  }

  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith('RAILWAY_VOLUME_') && k.endsWith('_MOUNT_PATH') && v && v.trim()) {
      const p = path.resolve(v.trim());
      if (!candidates.some((c) => c.path === p)) {
        candidates.push({ path: p, note: `env:${k}`, isExplicitVolume: true, isConfirmedMount: true });
      }
    }
  }

  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    const p = path.resolve(process.env.DATA_DIR.trim());
    if (!candidates.some((c) => c.path === p)) {
      candidates.push({ path: p, note: 'env:DATA_DIR', isExplicitVolume: true, isConfirmedMount: true });
    }
  }

  if (process.env.PERSISTENT_DATA_DIR && process.env.PERSISTENT_DATA_DIR.trim()) {
    const p = path.resolve(process.env.PERSISTENT_DATA_DIR.trim());
    if (!candidates.some((c) => c.path === p)) {
      candidates.push({ path: p, note: 'env:PERSISTENT_DATA_DIR', isExplicitVolume: true, isConfirmedMount: true });
    }
  }

  // 2. Linux mount points matching application data paths
  for (const m of linuxMounts) {
    if (!candidates.some((c) => c.path === m)) {
      if (m === '/data' || m === '/app/data' || m.startsWith('/mnt/') || m === '/storage' || m === '/volume') {
        candidates.push({ path: m, note: `linux-mount:${m}`, isExplicitVolume: true, isConfirmedMount: true });
      }
    }
  }

  // 3. Attached volume at /data or /app/data
  const standardPaths = ['/data', '/app/data', LOCAL_DATA_DIR, path.resolve(process.cwd(), 'data')];
  for (const p of standardPaths) {
    if (!candidates.some((c) => c.path === p)) {
      const isConfirmed = linuxMounts.includes(p);
      candidates.push({
        path: p,
        note: isConfirmed ? `mounted-storage:${p}` : `local-dir:${p}`,
        isExplicitVolume: isConfirmed || p === '/data',
        isConfirmedMount: isConfirmed,
      });
    }
  }

  const candidatesChecked: Array<{ path: string; exists: boolean; writable: boolean; note: string }> = [];
  let chosenDir = LOCAL_DATA_DIR;
  let chosenNote = 'local app directory';
  let isPersistent = false;

  for (const cand of candidates) {
    const exists = fs.existsSync(cand.path);
    const writable = testDirectoryWritable(cand.path);
    candidatesChecked.push({
      path: cand.path,
      exists,
      writable,
      note: cand.note,
    });

    if (writable && (!chosenDir || cand.isExplicitVolume || cand.isConfirmedMount)) {
      // Pick first writable explicit volume, or fall back to local data directory
      if (cand.isExplicitVolume || cand.isConfirmedMount || chosenDir === LOCAL_DATA_DIR) {
        chosenDir = cand.path;
        chosenNote = cand.note;
        isPersistent = cand.isExplicitVolume || cand.isConfirmedMount;
        if (cand.isExplicitVolume) break;
      }
    }
  }

  if (!fs.existsSync(chosenDir)) {
    try {
      fs.mkdirSync(chosenDir, { recursive: true });
    } catch {}
  }

  const dbFile = path.join(chosenDir, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(chosenDir, 'db_meta.json');
  const dbExists = fs.existsSync(dbFile);
  let dbSizeBytes = 0;
  let dbUpdatedAt: string | undefined = undefined;
  let isSeed: boolean | undefined = undefined;

  if (dbExists) {
    try {
      dbSizeBytes = fs.statSync(dbFile).size;
    } catch {}
    if (fs.existsSync(dbMetaFile)) {
      try {
        const meta = JSON.parse(fs.readFileSync(dbMetaFile, 'utf-8'));
        dbUpdatedAt = meta.updatedAt;
        isSeed = meta.isSeed;
      } catch {}
    }
  }

  return {
    resolvedDataDir: chosenDir,
    isPersistent,
    mountSource: chosenNote,
    isWritable: testDirectoryWritable(chosenDir),
    dbExists,
    dbSizeBytes,
    dbUpdatedAt,
    isSeed,
    candidatesChecked,
    env,
  };
}

function mirrorDatabaseToAllLocations(databaseBase64: string, meta: any, primaryDataDir?: string): void {
  const mirrorDirs = new Set<string>();
  mirrorDirs.add(LOCAL_DATA_DIR);
  mirrorDirs.add(path.resolve(process.cwd(), 'data'));
  mirrorDirs.add(PROTECTED_SEED_DIR);
  mirrorDirs.add(path.resolve(process.cwd(), 'seed_data'));
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) mirrorDirs.add(path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH));
  if (process.env.DATA_DIR) mirrorDirs.add(path.resolve(process.env.DATA_DIR));
  if (fs.existsSync('/app/data')) mirrorDirs.add('/app/data');
  if (fs.existsSync('/data')) mirrorDirs.add('/data');

  const metaStr = JSON.stringify(meta, null, 2);

  for (const dir of mirrorDirs) {
    if (testDirectoryWritable(dir)) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        safeWriteFileWithSync(path.join(dir, 'djital_db.sqlite.b64'), databaseBase64);
        safeWriteFileWithSync(path.join(dir, 'djital_db.sqlite.b64.bak'), databaseBase64);
        safeWriteFileWithSync(path.join(dir, 'db_meta.json'), metaStr);
        // Synchronize custom backup copy so 1-click restore always has latest user data
        safeWriteFileWithSync(path.join(dir, 'djital_db_previous_custom_data.b64'), databaseBase64);
        safeWriteFileWithSync(path.join(dir, 'db_meta_custom.json'), metaStr);

        const backupDir = path.join(dir, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
        safeWriteFileWithSync(path.join(backupDir, 'djital_db_previous_custom_data.b64'), databaseBase64);
        safeWriteFileWithSync(path.join(backupDir, 'db_meta_custom.json'), metaStr);
      } catch (err: any) {
        console.warn(`[Storage Mirror] Warning writing to ${dir}:`, err.message);
      }
    }
  }
}

function ensureDatabaseSeeded(): void {
  const storage = getStorageDetails();
  const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

  const fileExists = fs.existsSync(dbFile);
  const fileSize = fileExists ? fs.statSync(dbFile).size : 0;

  let currentIsSeed = true;
  if (fileExists && fs.existsSync(dbMetaFile)) {
    try {
      const meta = JSON.parse(fs.readFileSync(dbMetaFile, 'utf-8'));
      currentIsSeed = Boolean(meta.isSeed);
    } catch {}
  }

  // Find latest database from all potential volume/repo locations
  const { seedDbPath, seedMetaPath, isCustom, updatedAt } = findLatestDatabase();

  // If DB file is missing, empty, OR if active file is an un-updated baseline while we have custom user data:
  if (!fileExists || fileSize < 100 || (currentIsSeed && isCustom && seedDbPath && seedDbPath !== dbFile)) {
    if (seedDbPath && fs.existsSync(seedDbPath) && seedDbPath !== dbFile) {
      try {
        const b64 = fs.readFileSync(seedDbPath, 'utf-8');
        let metaObj = {
          updatedAt: updatedAt || new Date().toISOString(),
          updatedBy: isCustom ? 'database-recovery' : 'system-seed',
          isSeed: !isCustom,
        };
        if (seedMetaPath && fs.existsSync(seedMetaPath)) {
          try {
            metaObj = JSON.parse(fs.readFileSync(seedMetaPath, 'utf-8'));
          } catch {}
        }
        safeWriteFileWithSync(dbFile, b64);
        safeWriteFileWithSync(dbMetaFile, JSON.stringify(metaObj, null, 2));

        // Mirror to all data and seed directories so redeployment keeps custom data
        mirrorDatabaseToAllLocations(b64, metaObj);
        console.log(`[Storage] Initialized database at "${storage.resolvedDataDir}" from "${seedDbPath}" (Custom data preserved: ${isCustom ? 'YES' : 'NO'})`);
      } catch (err: any) {
        console.error(`[Storage] Error initializing database at ${storage.resolvedDataDir}:`, err.message);
      }
    }
  } else {
    // Database already exists in storage and is active.
    // Ensure all backup and repository seed directories are synchronized with this active database!
    try {
      const activeB64 = fs.readFileSync(dbFile, 'utf-8');
      let activeMeta = { updatedAt: new Date().toISOString(), isSeed: currentIsSeed };
      if (fs.existsSync(dbMetaFile)) {
        try {
          activeMeta = JSON.parse(fs.readFileSync(dbMetaFile, 'utf-8'));
        } catch {}
      }
      mirrorDatabaseToAllLocations(activeB64, activeMeta, storage.resolvedDataDir);
    } catch {}
  }
}

function syncUploadDirectories(): void {
  try {
    const publicUploadDir = path.resolve(__dirname, 'public', 'uploads');
    const categories = ['videos', 'images', 'audio', 'documents'];
    for (const cat of categories) {
      const catDir = path.join(publicUploadDir, cat);
      if (!fs.existsSync(catDir)) {
        fs.mkdirSync(catDir, { recursive: true });
      }
    }
  } catch (err: any) {
    console.warn('[Storage Sync] Warning during upload synchronization:', err.message);
  }
}

// Run initial seed and upload sync on startup
ensureDatabaseSeeded();
syncUploadDirectories();

// Support large payloads for base64 SQLite snapshots, audio stems & short video clips
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Production Security Headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Explicit SEO routes
app.get('/robots.txt', (_req, res) => {
  const robotsPath = path.resolve(__dirname, 'public', 'robots.txt');
  if (fs.existsSync(robotsPath)) {
    res.type('text/plain').sendFile(robotsPath);
  } else {
    res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml\n');
  }
});

app.get('/sitemap.xml', (_req, res) => {
  const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    res.type('application/xml').sendFile(sitemapPath);
  } else {
    res.status(404).end();
  }
});

// Dedicated streaming endpoint for uploaded media with HTTP 206 Range support
app.get('/uploads/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const safeCategory = ['videos', 'images', 'audio', 'documents'].includes(category) ? category : 'documents';
  const safeFilename = path.basename(filename);

  const foundPath = path.resolve(__dirname, 'public', 'uploads', safeCategory, safeFilename);

  if (!fs.existsSync(foundPath)) {
    // CRITICAL: Return 404 immediately!
    // Never fall through to SPA fallback or Vite, which would send index.html (causing corrupted video errors)
    return res.status(404).json({ error: `Uploaded asset ${safeFilename} not found` });
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.webm': 'video/webm',
    '.ogv': 'video/ogg',
    '.m4v': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.avif': 'image/avif',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.zip': 'application/zip',
  };

  if (mimeMap[ext]) {
    res.setHeader('Content-Type', mimeMap[ext]);
  }

  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  }

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  return res.sendFile(foundPath);
});

// Serve static public folder (images, wasm, etc.)
app.use(express.static(path.resolve(__dirname, 'public')));

// ----------------------------------------------------
// Database Sync API Endpoints
// ----------------------------------------------------

// GET storage status & Railway volume diagnostics
app.get('/api/system/storage-status', (_req, res) => {
  try {
    const details = getStorageDetails();
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res.json(details);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to query storage status' });
  }
});

// GET current database state from server
app.get('/api/db/state', (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

    // Ensure volume has baseline seed if currently empty
    ensureDatabaseSeeded();

    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const dbMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf-8');
      let meta: any = { updatedAt: '1970-01-01T00:00:00.000Z', isSeed: true };
      if (fs.existsSync(dbMetaFile)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(dbMetaFile, 'utf-8'));
          meta = { ...meta, ...parsed };
        } catch {
          // ignore
        }
      }
      return res.json({
        exists: true,
        databaseBase64: data,
        meta,
        storageInfo: {
          dataDir: storage.resolvedDataDir,
          isPersistent: storage.isPersistent,
          mountSource: storage.mountSource,
        },
      });
    }
    return res.json({
      exists: false,
      databaseBase64: null,
      meta: null,
      storageInfo: {
        dataDir: storage.resolvedDataDir,
        isPersistent: storage.isPersistent,
        mountSource: storage.mountSource,
      },
    });
  } catch (error: any) {
    console.error('Error reading server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to read database state' });
  }
});

// Helper to block internal/private/loopback addresses (SSRF mitigation)
function isBlockedOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  // Loopback and internal hostnames
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '169.254.169.254' ||
    host === 'metadata.google.internal' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.lan')
  ) {
    return true;
  }

  // IPv4 regex check for private & loopback ranges
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 127) return true; // 127.0.0.0/8 (loopback)
    if (a === 10) return true; // 10.0.0.0/8 (private)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (private)
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 (private)
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local)
    if (a === 0) return true;
  }

  return false;
}

// Save guard & versioned backup settings
const SAVE_GUARD_MIN_CURRENT_BYTES = 1024 * 1024; // only guard databases larger than 1 MB
const SAVE_GUARD_MIN_RATIO = 0.5; // reject incoming snapshots smaller than 50% of current
const MAX_TIMESTAMPED_BACKUPS = Math.max(1, parseInt(process.env.DB_BACKUP_KEEP || '30', 10) || 30);
const TIMESTAMPED_BACKUP_PATTERN = /^djital_db_.+\.b64$/;

function listTimestampedBackups(backupDir: string): { name: string; sizeBytes: number; modifiedAt: string }[] {
  if (!fs.existsSync(backupDir)) return [];
  const items: { name: string; sizeBytes: number; modifiedAt: string }[] = [];
  for (const name of fs.readdirSync(backupDir)) {
    if (!TIMESTAMPED_BACKUP_PATTERN.test(name)) continue;
    try {
      const stat = fs.statSync(path.join(backupDir, name));
      if (!stat.isFile()) continue;
      items.push({ name, sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() });
    } catch {}
  }
  // ISO timestamps in file names sort chronologically; newest first
  items.sort((a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0));
  return items;
}

// Copy the current primary snapshot to a timestamped backup and prune older ones
function backupCurrentSnapshot(primaryDbFile: string, backupDir: string): void {
  try {
    if (!fs.existsSync(primaryDbFile) || fs.statSync(primaryDbFile).size === 0) return;
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(primaryDbFile, path.join(backupDir, `djital_db_${stamp}.b64`));

    const backups = listTimestampedBackups(backupDir);
    for (const old of backups.slice(MAX_TIMESTAMPED_BACKUPS)) {
      try {
        fs.unlinkSync(path.join(backupDir, old.name));
      } catch {}
    }
  } catch (err) {
    console.warn('[Storage] Failed to create timestamped database backup:', err);
  }
}

// POST save database state to server
app.post('/api/db/save', (req, res) => {
  try {
    const { databaseBase64, timestamp, clientDevice } = req.body;
    if (!databaseBase64 || typeof databaseBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid databaseBase64 payload' });
    }

    // Verify valid SQLite database format prefix ("SQLite format 3" in base64 starts with U1FMaXRlIGZvcm1)
    if (!databaseBase64.startsWith('U1FMaXRlIGZvcm1')) {
      return res.status(400).json({ error: 'Payload does not represent a valid SQLite database binary snapshot' });
    }

    const storage = getStorageDetails();
    if (!fs.existsSync(storage.resolvedDataDir)) {
      fs.mkdirSync(storage.resolvedDataDir, { recursive: true });
    }

    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    const primaryBakFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64.bak');

    // Create a timestamped backup before overwriting
    const backupDir = path.join(storage.resolvedDataDir, 'backups');
    backupCurrentSnapshot(primaryDbFile, backupDir);

    // 1. Physically write new snapshot to active storage directory
    safeWriteFileWithSync(primaryDbFile, databaseBase64);
    try {
      safeWriteFileWithSync(primaryBakFile, databaseBase64);
    } catch {}

    const meta = {
      updatedAt: timestamp || new Date().toISOString(),
      updatedBy: clientDevice || 'web-client',
      sizeBytes: databaseBase64.length,
      isSeed: false,
    };
    safeWriteFileWithSync(primaryMetaFile, JSON.stringify(meta, null, 2));

    // 2. Multi-directory mirror write to ensure data persists across container redeployments and volume types
    mirrorDatabaseToAllLocations(databaseBase64, meta, storage.resolvedDataDir);

    console.log(`[Storage] Saved database snapshot directly to volume (${meta.sizeBytes} bytes, ${storage.mountSource})`);

    return res.json({
      success: true,
      meta,
      storageInfo: {
        dataDir: storage.resolvedDataDir,
        isPersistent: storage.isPersistent,
        mountSource: storage.mountSource,
      },
      message: 'Database saved directly to server persistent disk in realtime.',
    });
  } catch (error: any) {
    console.error('Error writing server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to save database' });
  }
});

// GET list of timestamped database backups (read-only)
app.get('/api/db/backups', (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    const storage = getStorageDetails();
    const backupDir = path.join(storage.resolvedDataDir, 'backups');
    const backups = listTimestampedBackups(backupDir);
    return res.json({
      backupDir,
      maxBackups: MAX_TIMESTAMPED_BACKUPS,
      count: backups.length,
      backups,
    });
  } catch (error: any) {
    console.error('Error listing database backups:', error);
    return res.status(500).json({ error: error.message || 'Failed to list backups' });
  }
});

// GET direct binary SQLite export for easy backup download
app.get('/api/db/export', (_req, res) => {
  try {
    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    if (!fs.existsSync(dbFile)) {
      return res.status(404).send('No database snapshot found on server.');
    }
    const b64 = fs.readFileSync(dbFile, 'utf-8');
    const binary = Buffer.from(b64, 'base64');
    const filename = `djital_db_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;

    res.setHeader('Content-Type', 'application/vnd.sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', binary.length);
    return res.send(binary);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
});

// GET download complete website bundle (.djbundle / .zip) containing database, uploaded media assets, and manifest
app.get(['/api/backup/bundle', '/api/backup/download-bundle'], async (_req, res) => {
  try {
    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const metaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    if (!fs.existsSync(dbFile)) {
      return res.status(404).json({ error: 'Database file not found on server' });
    }

    const b64 = fs.readFileSync(dbFile, 'utf-8');
    const dbBinary = Buffer.from(b64, 'base64');
    const zip = new AdmZip();

    // 1. Add database snapshots (both .b64 and binary .sqlite for universal compatibility)
    zip.addFile('djital_db.sqlite.b64', Buffer.from(b64, 'utf-8'));
    zip.addFile('database.sqlite', dbBinary);

    // 2. Add metadata
    if (fs.existsSync(metaFile)) {
      zip.addFile('db_meta.json', fs.readFileSync(metaFile));
    }

    // 3. Add uploaded media assets from public/uploads/
    const publicUploadDir = path.resolve(__dirname, 'public', 'uploads');
    let uploadFilesCount = 0;
    let uploadTotalBytes = 0;
    if (fs.existsSync(publicUploadDir)) {
      const categories = ['videos', 'images', 'audio', 'documents'];
      for (const cat of categories) {
        const catDir = path.join(publicUploadDir, cat);
        if (fs.existsSync(catDir)) {
          const files = fs.readdirSync(catDir);
          for (const f of files) {
            const filePath = path.join(catDir, f);
            try {
              const stat = fs.statSync(filePath);
              if (stat.isFile()) {
                zip.addLocalFile(filePath, `uploads/${cat}`);
                uploadFilesCount++;
                uploadTotalBytes += stat.size;
              }
            } catch {}
          }
        }
      }
    }

    // 3b. Add site images from public/images/ to guarantee complete standalone website restoration
    const publicImagesDir = path.resolve(__dirname, 'public', 'images');
    let siteImagesCount = 0;
    let siteImagesTotalBytes = 0;
    if (fs.existsSync(publicImagesDir)) {
      const imgFiles = fs.readdirSync(publicImagesDir);
      for (const imgFile of imgFiles) {
        const imgPath = path.join(publicImagesDir, imgFile);
        try {
          const stat = fs.statSync(imgPath);
          if (stat.isFile()) {
            zip.addLocalFile(imgPath, 'images');
            siteImagesCount++;
            siteImagesTotalBytes += stat.size;
          }
        } catch {}
      }
    }

    // 4. Inspect DB to include record counts in manifest
    let tableCounts: Record<string, number> = {};
    try {
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs();
      const db = new SQL.Database(dbBinary);
      const tables = ['events', 'releases', 'gallery', 'documentary', 'media_library', 'bookings', 'audio_mixes', 'videos', 'testimonials'];
      for (const tbl of tables) {
        try {
          const countRes = db.exec(`SELECT count(*) FROM "${tbl}"`);
          if (countRes.length > 0 && countRes[0].values.length > 0) {
            tableCounts[tbl] = Number(countRes[0].values[0][0]);
          }
        } catch {}
      }
    } catch (err: any) {
      console.warn('Could not inspect table counts for manifest:', err.message);
    }

    // 5. Generate backup manifest
    const totalMediaCount = uploadFilesCount + siteImagesCount;
    const totalMediaBytes = uploadTotalBytes + siteImagesTotalBytes;
    const manifest = {
      manifestVersion: '2.0',
      appName: 'DJ Ital Sound System & Vital Fest',
      createdAt: new Date().toISOString(),
      databaseSizeBytes: dbBinary.length,
      databaseBase64SizeBytes: b64.length,
      uploadedFilesCount: uploadFilesCount,
      uploadedFilesTotalBytes: uploadTotalBytes,
      siteImagesCount,
      siteImagesTotalBytes,
      totalMediaCount,
      totalMediaBytes,
      tableCounts,
      checksumSha256: crypto.createHash('sha256').update(dbBinary).digest('hex'),
      description: 'Complete website backup bundle containing full SQLite database, all uploaded media assets, site images, and configuration metadata.',
    };
    zip.addFile('backup_manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

    const zipBuffer = zip.toBuffer();
    const dateStamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `dj-ital-website-backup-${dateStamp}.djbundle`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating website backup bundle:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate backup bundle' });
  }
});

// POST restore complete website bundle (.djbundle, .zip, .sqlite, .b64)
app.post('/api/restore/bundle', async (req, res) => {
  try {
    const { bundleBase64, filename = 'backup' } = req.body;
    if (!bundleBase64 || typeof bundleBase64 !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid backup bundle payload' });
    }

    const buffer = Buffer.from(bundleBase64, 'base64');
    const storage = getStorageDetails();
    if (!fs.existsSync(storage.resolvedDataDir)) {
      fs.mkdirSync(storage.resolvedDataDir, { recursive: true });
    }

    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    const backupDir = path.join(storage.resolvedDataDir, 'backups');

    // Create a safety backup of existing state before restoring
    backupCurrentSnapshot(primaryDbFile, backupDir);

    let restoredDbB64: string | null = null;
    let manifestData: any = null;
    let filesRestoredCount = 0;

    // Check if buffer starts with ZIP magic bytes "PK\x03\x04"
    if (buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();

      // Look for manifest
      const manifestEntry = entries.find((e) => e.entryName === 'backup_manifest.json');
      if (manifestEntry) {
        try {
          manifestData = JSON.parse(manifestEntry.getData().toString('utf-8'));
        } catch {}
      }

      // Look for database file in zip
      const dbB64Entry = entries.find((e) => e.entryName === 'djital_db.sqlite.b64');
      const sqliteEntry = entries.find((e) => e.entryName === 'database.sqlite' || e.entryName.endsWith('.sqlite') || e.entryName.endsWith('.db'));

      if (dbB64Entry) {
        restoredDbB64 = dbB64Entry.getData().toString('utf-8').trim();
      } else if (sqliteEntry) {
        const bin = sqliteEntry.getData();
        restoredDbB64 = bin.toString('base64');
      }

      // Restore uploads and site images
      const publicUploadDir = path.resolve(__dirname, 'public', 'uploads');
      const publicImagesDir = path.resolve(__dirname, 'public', 'images');
      for (const entry of entries) {
        if (!entry.isDirectory && (entry.entryName.startsWith('uploads/') || entry.entryName.startsWith('public/uploads/'))) {
          const relativePath = entry.entryName.replace(/^(public\/)?uploads\//, '');
          const destPath = path.join(publicUploadDir, relativePath);
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.writeFileSync(destPath, entry.getData());
          filesRestoredCount++;
        } else if (!entry.isDirectory && (entry.entryName.startsWith('images/') || entry.entryName.startsWith('public/images/'))) {
          const relativePath = entry.entryName.replace(/^(public\/)?images\//, '');
          const destPath = path.join(publicImagesDir, relativePath);
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          fs.writeFileSync(destPath, entry.getData());
          filesRestoredCount++;
        }
      }
    } else {
      // Not a zip file: check if it's base64 sqlite string or raw sqlite binary
      const text = buffer.toString('utf-8').trim();
      if (text.startsWith('U1FMaXRlIGZvcm1')) {
        restoredDbB64 = text;
      } else if (buffer.toString('utf-8', 0, 15).startsWith('SQLite format 3')) {
        restoredDbB64 = buffer.toString('base64');
      }
    }

    if (!restoredDbB64 || !restoredDbB64.startsWith('U1FMaXRlIGZvcm1')) {
      return res.status(400).json({
        error: 'No valid SQLite database found inside the uploaded backup file. Please provide a valid .djbundle, .zip, or .sqlite file.',
      });
    }

    // Save restored DB
    safeWriteFileWithSync(primaryDbFile, restoredDbB64);
    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-bundle-restore',
      sizeBytes: restoredDbB64.length,
      isSeed: false,
      restoredFrom: filename,
    };
    safeWriteFileWithSync(primaryMetaFile, JSON.stringify(meta, null, 2));

    // Mirror write to ensure persistence across deployments
    mirrorDatabaseToAllLocations(restoredDbB64, meta, storage.resolvedDataDir);

    return res.json({
      success: true,
      message: `Complete website backup restored successfully! Restored SQLite database (${(restoredDbB64.length / 1024 / 1024).toFixed(2)} MB)${filesRestoredCount > 0 ? ` and ${filesRestoredCount} uploaded media files` : ''}.`,
      manifest: manifestData,
      filesRestoredCount,
      databaseSizeBytes: restoredDbB64.length,
      databaseBase64: restoredDbB64,
      meta,
    });
  } catch (err: any) {
    console.error('Error during bundle restore:', err);
    return res.status(500).json({ error: err.message || 'Failed to restore backup bundle' });
  }
});

// GET backup summary with database stats and record counts
app.get('/api/backup/summary', async (_req, res) => {
  try {
    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const metaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    const previousCustomFile = path.join(storage.resolvedDataDir, 'backups', 'djital_db_previous_custom_data.b64');
    const localPreviousCustomFile = path.join(LOCAL_DATA_DIR, 'backups', 'djital_db_previous_custom_data.b64');

    const dbExists = fs.existsSync(dbFile);
    const dbSizeBytes = dbExists ? fs.statSync(dbFile).size : 0;

    let meta: any = null;
    if (fs.existsSync(metaFile)) {
      try {
        meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
      } catch {}
    }

    // Uploads count
    const publicUploadDir = path.resolve(__dirname, 'public', 'uploads');
    let uploadedFilesCount = 0;
    let uploadedFilesTotalBytes = 0;
    if (fs.existsSync(publicUploadDir)) {
      const categories = ['videos', 'images', 'audio', 'documents'];
      for (const cat of categories) {
        const catDir = path.join(publicUploadDir, cat);
        if (fs.existsSync(catDir)) {
          const files = fs.readdirSync(catDir);
          for (const f of files) {
            try {
              const stat = fs.statSync(path.join(catDir, f));
              if (stat.isFile()) {
                uploadedFilesCount++;
                uploadedFilesTotalBytes += stat.size;
              }
            } catch {}
          }
        }
      }
    }

    // Site images count
    const publicImagesDir = path.resolve(__dirname, 'public', 'images');
    let siteImagesCount = 0;
    let siteImagesTotalBytes = 0;
    if (fs.existsSync(publicImagesDir)) {
      const imgFiles = fs.readdirSync(publicImagesDir);
      for (const imgFile of imgFiles) {
        try {
          const stat = fs.statSync(path.join(publicImagesDir, imgFile));
          if (stat.isFile()) {
            siteImagesCount++;
            siteImagesTotalBytes += stat.size;
          }
        } catch {}
      }
    }

    // Inspect database record counts
    let recordCounts: Record<string, number> = {};
    if (dbExists) {
      try {
        const b64 = fs.readFileSync(dbFile, 'utf-8');
        const dbBinary = Buffer.from(b64, 'base64');
        const initSqlJs = (await import('sql.js')).default;
        const SQL = await initSqlJs();
        const db = new SQL.Database(dbBinary);
        const tables = ['events', 'releases', 'gallery', 'documentary', 'media_library', 'bookings', 'audio_mixes', 'videos', 'testimonials'];
        for (const tbl of tables) {
          try {
            const countRes = db.exec(`SELECT count(*) FROM "${tbl}"`);
            if (countRes.length > 0 && countRes[0].values.length > 0) {
              recordCounts[tbl] = Number(countRes[0].values[0][0]);
            }
          } catch {}
        }
      } catch {}
    }

    const hasPreviousCustomData = fs.existsSync(previousCustomFile) || fs.existsSync(localPreviousCustomFile);

    return res.json({
      dbExists,
      dbSizeBytes,
      updatedAt: meta?.updatedAt || (dbExists ? fs.statSync(dbFile).mtime.toISOString() : null),
      isSeed: Boolean(meta?.isSeed),
      uploadedFilesCount,
      uploadedFilesTotalBytes,
      siteImagesCount,
      siteImagesTotalBytes,
      totalMediaCount: uploadedFilesCount + siteImagesCount,
      totalMediaBytes: uploadedFilesTotalBytes + siteImagesTotalBytes,
      recordCounts,
      hasPreviousCustomData,
      isPersistent: storage.isPersistent,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch backup summary' });
  }
});

// GET full project ZIP archive for easy export/download and deployment
app.get(['/api/download-project', '/api/project/export-zip', '/api/download-zip'], (_req, res) => {
  try {
    const projectDir = path.resolve(__dirname);
    const zipPath = path.join(os.tmpdir(), `dj-ital-sound-system-${Date.now()}.zip`);

    const script = `
import os, zipfile
root_dir = r"${projectDir}"
exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', '__pycache__', '.cache'}
zip_path = r"${zipPath}"
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs and not d.startswith('.git')]
        for filename in filenames:
            if filename.endswith('.zip') or filename.endswith('.pyc'):
                continue
            if filename.startswith('.') and filename not in ['.npmrc', '.gitignore', '.env.example']:
                continue
            file_path = os.path.join(dirpath, filename)
            arcname = os.path.relpath(file_path, root_dir)
            zipf.write(file_path, arcname)
`;

    execFileSync('python3', ['-c', script], { timeout: 30000 });

    if (!fs.existsSync(zipPath)) {
      return res.status(500).json({ error: 'Failed to generate project archive' });
    }

    const stat = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="dj-ital-sound-system.zip"');
    res.setHeader('Content-Length', stat.size);

    const fileStream = fs.createReadStream(zipPath);
    fileStream.pipe(res);
    fileStream.on('close', () => {
      try {
        fs.unlinkSync(zipPath);
      } catch {}
    });
  } catch (err: any) {
    console.error('Failed to create project ZIP:', err);
    res.status(500).json({ error: 'Failed to create project ZIP: ' + (err?.message || 'Unknown error') });
  }
});

// POST import database snapshot directly to volume
app.post('/api/db/import', (req, res) => {
  try {
    const { databaseBase64, isBinary } = req.body;
    let b64 = databaseBase64;
    if (!b64 || typeof b64 !== 'string') {
      return res.status(400).json({ error: 'Missing database snapshot in payload' });
    }
    if (!b64.startsWith('U1FMaXRlIGZvcm1')) {
      return res.status(400).json({ error: 'Invalid SQLite file header' });
    }

    const storage = getStorageDetails();
    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

    fs.writeFileSync(primaryDbFile, b64, 'utf-8');
    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-restore-import',
      sizeBytes: b64.length,
      isSeed: false,
    };
    fs.writeFileSync(primaryMetaFile, JSON.stringify(meta, null, 2), 'utf-8');
    mirrorDatabaseToAllLocations(b64, meta, storage.resolvedDataDir);

    return res.json({
      success: true,
      meta,
      storageInfo: {
        dataDir: storage.resolvedDataDir,
        isPersistent: storage.isPersistent,
      },
      message: 'Database imported and restored to volume successfully.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Import failed' });
  }
});

// POST reset server database (with automatic pre-reset backup protection)
app.post('/api/db/reset', (_req, res) => {
  try {
    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const dbMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

    // 1. Always create a backup before any reset
    if (fs.existsSync(dbFile) && fs.statSync(dbFile).size > 100) {
      const backupDir = path.join(storage.resolvedDataDir, 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(dbFile, path.join(backupDir, `djital_db_pre_reset_${stamp}.b64`));
    }

    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    if (fs.existsSync(dbMetaFile)) {
      fs.unlinkSync(dbMetaFile);
    }

    // Re-seed with baseline
    const seedDbFile = path.join(SEED_DIR, 'djital_db.sqlite.b64');
    const seedMetaFile = path.join(SEED_DIR, 'db_meta.json');
    if (fs.existsSync(seedDbFile)) {
      fs.copyFileSync(seedDbFile, dbFile);
      if (fs.existsSync(seedMetaFile)) {
        fs.copyFileSync(seedMetaFile, dbMetaFile);
      } else {
        fs.writeFileSync(
          dbMetaFile,
          JSON.stringify({ updatedAt: new Date().toISOString(), isSeed: true }, null, 2),
          'utf-8'
        );
      }
    }

    let databaseBase64: string | null = null;
    if (fs.existsSync(dbFile)) {
      databaseBase64 = fs.readFileSync(dbFile, 'utf-8').trim();
    }

    return res.json({
      success: true,
      message: 'Server database reset to baseline seeds (Pre-reset backup created)',
      databaseBase64,
    });
  } catch (error: any) {
    console.error('Error resetting server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset database' });
  }
});

// GET available recovery snapshots (active, previous custom user data, factory seed, backups)
app.get('/api/db/snapshots', (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    const storage = getStorageDetails();
    const snapshots: Array<{
      id: string;
      title: string;
      description: string;
      sizeBytes: number;
      updatedAt?: string;
      isCurrent: boolean;
      type: 'active' | 'custom_previous' | 'factory_seed' | 'backup';
    }> = [];

    // 1. Current Active Database
    const currentDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    if (fs.existsSync(currentDbFile)) {
      const stat = fs.statSync(currentDbFile);
      snapshots.push({
        id: 'active',
        title: 'Current Active Database',
        description: `Currently running on server volume (${(stat.size / 1024 / 1024).toFixed(2)} MB).`,
        sizeBytes: stat.size,
        updatedAt: storage.dbUpdatedAt,
        isCurrent: true,
        type: 'active',
      });
    }

    // 2. Previous Custom Master Data Snapshot
    const customSnapshotCandidates = [
      path.join(storage.resolvedDataDir, 'backups', 'djital_db_previous_custom_data.b64'),
      path.join(LOCAL_DATA_DIR, 'backups', 'djital_db_previous_custom_data.b64'),
      path.join(PROTECTED_SEED_DIR, 'djital_db_previous_custom_data.b64'),
    ];
    let customSnapshotPath: string | null = null;
    for (const p of customSnapshotCandidates) {
      if (fs.existsSync(p) && fs.statSync(p).size > 100) {
        customSnapshotPath = p;
        break;
      }
    }
    if (customSnapshotPath) {
      const stat = fs.statSync(customSnapshotPath);
      snapshots.push({
        id: 'previous_custom',
        title: 'Restored Previous User Data',
        description: 'Preserved pre-deployment database with all 8 Events, 4 Documentary Episodes, 11 Media Items & custom profile edits.',
        sizeBytes: stat.size,
        updatedAt: '2026-10-18T16:00:00.000Z',
        isCurrent: false,
        type: 'custom_previous',
      });
    }

    // 3. Factory Baseline Seed
    const factorySeedFile = path.join(PROTECTED_SEED_DIR, 'djital_db.sqlite.b64');
    if (fs.existsSync(factorySeedFile)) {
      const stat = fs.statSync(factorySeedFile);
      snapshots.push({
        id: 'factory_seed',
        title: 'Factory Baseline Seed Data',
        description: 'Standard initial launch template data.',
        sizeBytes: stat.size,
        updatedAt: '1970-01-01T00:00:00.000Z',
        isCurrent: false,
        type: 'factory_seed',
      });
    }

    // 4. Timestamped backups
    const backupDir = path.join(storage.resolvedDataDir, 'backups');
    const backups = listTimestampedBackups(backupDir);
    for (const b of backups.slice(0, 5)) {
      snapshots.push({
        id: `backup:${b.name}`,
        title: `Backup Snapshot (${b.name.replace(/^djital_db_|\.b64$/g, '')})`,
        description: `Automated rolling backup from ${new Date(b.modifiedAt).toLocaleString()}`,
        sizeBytes: b.sizeBytes,
        updatedAt: b.modifiedAt,
        isCurrent: false,
        type: 'backup',
      });
    }

    return res.json({
      storage: {
        resolvedDataDir: storage.resolvedDataDir,
        isPersistent: storage.isPersistent,
        mountSource: storage.mountSource,
      },
      snapshots,
    });
  } catch (error: any) {
    console.error('Error listing snapshots:', error);
    return res.status(500).json({ error: error.message || 'Failed to list snapshots' });
  }
});

// POST restore specific snapshot or previous custom data
app.post('/api/db/restore-snapshot', (req, res) => {
  try {
    const { snapshotId } = req.body;
    if (!snapshotId || typeof snapshotId !== 'string') {
      return res.status(400).json({ error: 'Missing snapshotId parameter' });
    }

    const storage = getStorageDetails();
    let sourceB64Path: string | null = null;
    let isSeed = false;
    let snapshotLabel = '';

    if (snapshotId === 'previous_custom') {
      const candidates = [
        path.join(storage.resolvedDataDir, 'backups', 'djital_db_previous_custom_data.b64'),
        path.join(LOCAL_DATA_DIR, 'backups', 'djital_db_previous_custom_data.b64'),
        path.join(PROTECTED_SEED_DIR, 'djital_db_previous_custom_data.b64'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          sourceB64Path = c;
          break;
        }
      }
      snapshotLabel = 'Restored Previous User Data (8 Events, 4 Documentaries, 11 Media Items)';
      isSeed = false;
    } else if (snapshotId === 'factory_seed') {
      sourceB64Path = path.join(PROTECTED_SEED_DIR, 'djital_db.sqlite.b64');
      snapshotLabel = 'Factory Baseline Seed Data';
      isSeed = true;
    } else if (snapshotId.startsWith('backup:')) {
      const fileName = path.basename(snapshotId.replace(/^backup:/, ''));
      const p = path.join(storage.resolvedDataDir, 'backups', fileName);
      if (fs.existsSync(p)) {
        sourceB64Path = p;
        snapshotLabel = `Backup ${fileName}`;
      }
    }

    if (!sourceB64Path || !fs.existsSync(sourceB64Path)) {
      return res.status(404).json({ error: `Snapshot "${snapshotId}" not found on server` });
    }

    const b64Data = fs.readFileSync(sourceB64Path, 'utf-8').trim();
    if (!b64Data.startsWith('U1FMaXRlIGZvcm1')) {
      return res.status(400).json({ error: 'Snapshot data is not a valid SQLite database' });
    }

    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    const primaryBakFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64.bak');

    // Backup current before overwriting
    const backupDir = path.join(storage.resolvedDataDir, 'backups');
    backupCurrentSnapshot(primaryDbFile, backupDir);

    // Write to primary volume
    safeWriteFileWithSync(primaryDbFile, b64Data);
    try {
      safeWriteFileWithSync(primaryBakFile, b64Data);
    } catch {}

    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy: `admin-restore:${snapshotId}`,
      sizeBytes: b64Data.length,
      isSeed,
    };
    safeWriteFileWithSync(primaryMetaFile, JSON.stringify(meta, null, 2));

    // Mirror to all data and seed directories
    mirrorDatabaseToAllLocations(b64Data, meta, storage.resolvedDataDir);

    console.log(`[Storage] Restored snapshot "${snapshotId}" to volume (${b64Data.length} bytes)`);

    return res.json({
      success: true,
      message: `Successfully restored "${snapshotLabel}" to server persistent storage!`,
      databaseBase64: b64Data,
      meta,
    });
  } catch (error: any) {
    console.error('Error restoring snapshot:', error);
    return res.status(500).json({ error: error.message || 'Failed to restore snapshot' });
  }
});

// ----------------------------------------------------
// Live Audio & Radio Cast Stream Proxy Endpoint
// Solves: Mixed Content (HTTP streams on HTTPS site), CORS blocks,
// ICY metadata corruption, Shoutcast/Icecast quirks,
// and .pls / .m3u radio playlist parsing
// ----------------------------------------------------
app.all('/api/audio-proxy', (req, res) => {
  // Set CORS headers early
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  const targetUrl = (req.query.url as string)?.trim();
  if (!targetUrl) {
    return res.status(400).send('Missing url query parameter');
  }

  let normalizedUrl = targetUrl;
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  function connectToStream(streamUrl: string, redirectCount = 0) {
    if (redirectCount > 5) {
      if (!res.headersSent) {
        return res.status(508).send('Too many redirects attempting to connect to radio stream');
      }
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(streamUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        if (!res.headersSent) return res.status(400).send('Invalid audio protocol');
        return;
      }
    } catch {
      if (!res.headersSent) return res.status(400).send('Invalid target URL');
      return;
    }

    // SSRF Mitigation: Block loopback, private ranges, internal hostnames, and restricted ports
    if (isBlockedOrPrivateHost(parsed.hostname)) {
      if (!res.headersSent) return res.status(403).send('Restricted destination: Private or internal network addresses are blocked.');
      return;
    }

    const portNum = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
    // Disallow connections to non-standard internal system ports
    const blockedPorts = [22, 25, 110, 143, 3000, 3306, 5432, 6379, 9200, 27017];
    if (blockedPorts.includes(portNum)) {
      if (!res.headersSent) return res.status(403).send('Restricted destination port.');
      return;
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const isHttps = parsed.protocol === 'https:';

    const requestOptions: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + (parsed.search || ''),
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        // Crucial: do NOT send Icy-MetaData: 1. Leaving it out or 0 prevents Shoutcast from interleaving metadata into the MP3 audio frames.
        'Icy-MetaData': '0',
        ...(req.headers.range ? { Range: req.headers.range } : {}),
      },
      timeout: 12000,
      insecureHTTPParser: true,
      rejectUnauthorized: false,
    };

    const proxyReq = client.request(requestOptions, (proxyRes) => {
      // Follow HTTP redirects internally so browser stays on safe same-origin HTTPS stream
      if (
        proxyRes.statusCode &&
        proxyRes.statusCode >= 300 &&
        proxyRes.statusCode < 400 &&
        proxyRes.headers.location
      ) {
        let redirectLocation = proxyRes.headers.location;
        if (!redirectLocation.startsWith('http')) {
          redirectLocation = new URL(redirectLocation, streamUrl).toString();
        }
        proxyReq.destroy();
        return connectToStream(redirectLocation, redirectCount + 1);
      }

      const contentType = (proxyRes.headers['content-type'] || '').toLowerCase();
      const isPlaylist =
        streamUrl.endsWith('.pls') ||
        streamUrl.endsWith('.m3u') ||
        streamUrl.includes('.pls?') ||
        streamUrl.includes('.m3u?') ||
        contentType.includes('audio/x-scpls') ||
        contentType.includes('audio/x-mpegurl') ||
        contentType.includes('application/x-mpegurl') ||
        contentType.includes('application/vnd.apple.mpegurl');

      if (isPlaylist) {
        let body = '';
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', (chunk) => {
          body += chunk;
        });
        proxyRes.on('end', () => {
          const plsMatch = body.match(/File\d+=(http[^\r\n]+)/i);
          const m3uMatch = body
            .split(/[\r\n]+/)
            .map((l) => l.trim())
            .find((line) => line.startsWith('http'));
          const resolvedStream = plsMatch ? plsMatch[1].trim() : m3uMatch ? m3uMatch : null;

          if (resolvedStream) {
            return connectToStream(resolvedStream, redirectCount + 1);
          } else {
            if (!res.headersSent) {
              return res.status(502).send('Unable to parse audio stream from playlist');
            }
          }
        });
        return;
      }

      // If Shoutcast returned HTML status page because URL was missing mountpoint /;
      if (contentType.includes('text/html') && !streamUrl.includes(';') && !streamUrl.includes('/stream')) {
        const fallbackWithMount = `${streamUrl.replace(/\/+$/, '')}/;`;
        proxyReq.destroy();
        return connectToStream(fallbackWithMount, redirectCount + 1);
      }

      // Set streaming headers
      const status = proxyRes.statusCode || 200;
      res.status(status);

      // Determine proper audio Content-Type
      const resolvedContentType =
        contentType.startsWith('audio/') || contentType.startsWith('video/')
          ? contentType
          : 'audio/mpeg';

      res.setHeader('Content-Type', resolvedContentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Connection', 'keep-alive');

      if (proxyRes.headers['content-range']) {
        res.setHeader('Content-Range', proxyRes.headers['content-range']);
      }
      if (proxyRes.headers['icy-name']) {
        res.setHeader('icy-name', proxyRes.headers['icy-name']);
      }
      if (proxyRes.headers['icy-br']) {
        res.setHeader('icy-br', proxyRes.headers['icy-br']);
      }

      if (req.method === 'HEAD') {
        proxyReq.destroy();
        return res.end();
      }

      proxyRes.pipe(res);
    });

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).send('Radio stream connection timed out');
      }
    });

    proxyReq.on('error', (err) => {
      console.error('Audio stream proxy error for', streamUrl, ':', err.message);
      // If HTTPS failed on custom port, try HTTP fallback
      if (streamUrl.startsWith('https://') && redirectCount === 0) {
        const httpFallback = streamUrl.replace('https://', 'http://');
        return connectToStream(httpFallback, redirectCount + 1);
      }
      if (!res.headersSent) {
        res.status(502).send(`Error connecting to radio stream: ${err.message}`);
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  }

  connectToStream(normalizedUrl, 0);
});

// ----------------------------------------------------
// Media Upload & Static Clip Storage API
// ----------------------------------------------------

// Direct upload of short video clips, audio dubs, images, and documents
app.post('/api/upload-media', (req, res) => {
  try {
    const { filename, dataUrl, category = 'documents' } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid dataUrl parameter' });
    }

    const safeCategory = ['videos', 'images', 'audio', 'documents'].includes(category) ? category : 'documents';

    // Robust extraction of base64 payload without fragile regex
    let buffer: Buffer;
    let ext = 'bin';

    const base64Marker = ';base64,';
    const markerIdx = dataUrl.indexOf(base64Marker);

    if (markerIdx !== -1 && dataUrl.startsWith('data:')) {
      const mime = dataUrl.substring(5, markerIdx).toLowerCase();
      const rawBase64 = dataUrl.substring(markerIdx + base64Marker.length);
      buffer = Buffer.from(rawBase64, 'base64');

      if (mime.includes('pdf')) ext = 'pdf';
      else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
      else if (mime.includes('webm')) ext = 'webm';
      else if (mime.includes('mp4') || mime.includes('m4v')) ext = 'mp4';
      else if (mime.includes('ogg') || mime.includes('ogv')) ext = 'ogv';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      else if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      else if (mime.includes('avif')) ext = 'avif';
      else if (mime.includes('mpeg') || mime.includes('mp3')) ext = 'mp3';
      else if (mime.includes('wav')) ext = 'wav';
      else if (mime.includes('aac')) ext = 'aac';
      else if (mime.includes('flac')) ext = 'flac';
      else if (mime.includes('word') || mime.includes('msword') || mime.includes('document')) ext = 'docx';
      else if (mime.includes('plain') || mime.includes('text')) ext = 'txt';
      else if (mime.includes('csv')) ext = 'csv';
      else if (mime.includes('json')) ext = 'json';
      else if (mime.includes('zip')) ext = 'zip';
    } else {
      buffer = Buffer.from(dataUrl, 'base64');
    }

    // Compute content hash to detect and deduplicate identical uploads
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const storage = getStorageDetails();

    // 1. Content Deduplication Check: Look for an existing identical file in public/uploads
    const uploadCategoryDir = path.resolve(__dirname, 'public', 'uploads', safeCategory);
    let existingFileMatch: string | null = null;

    if (fs.existsSync(uploadCategoryDir)) {
      try {
        const files = fs.readdirSync(uploadCategoryDir);
        for (const f of files) {
          if (f.startsWith('.')) continue;
          const fullP = path.join(uploadCategoryDir, f);
          try {
            const stat = fs.statSync(fullP);
            if (stat.size === buffer.length) {
              const existingData = fs.readFileSync(fullP);
              const existingHash = crypto.createHash('sha256').update(existingData).digest('hex');
              if (existingHash === contentHash) {
                existingFileMatch = f;
                break;
              }
            }
          } catch {}
        }
      } catch {}
    }

    if (existingFileMatch) {
      const publicUrl = `/uploads/${safeCategory}/${existingFileMatch}`;
      console.log(`[Upload Deduplication] Reusing existing identical file (${(buffer.length / (1024 * 1024)).toFixed(2)} MB): ${existingFileMatch} -> ${publicUrl}`);
      return res.json({
        success: true,
        url: publicUrl,
        filename: existingFileMatch,
        sizeBytes: buffer.length,
        category: safeCategory,
        deduplicated: true,
      });
    }

    const originalName = (filename || `clip_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const cleanExt = path.extname(originalName).replace('.', '') || ext;
    const shortHash = contentHash.substring(0, 8);
    const finalFilename = `${baseName}_${shortHash}.${cleanExt}`;

    // Target single destination in public/uploads
    if (!fs.existsSync(uploadCategoryDir)) {
      fs.mkdirSync(uploadCategoryDir, { recursive: true });
    }
    const targetFilePath = path.join(uploadCategoryDir, finalFilename);
    const tempPath = path.join(uploadCategoryDir, `.tmp_${Date.now()}_${finalFilename}`);
    const fd = fs.openSync(tempPath, 'w');
    fs.writeSync(fd, buffer);
    try {
      fs.fsyncSync(fd);
    } catch {}
    fs.closeSync(fd);
    fs.renameSync(tempPath, targetFilePath);

    const publicUrl = `/uploads/${safeCategory}/${finalFilename}`;
    console.log(`[Upload] Successfully stored ${finalFilename} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) -> ${publicUrl}`);

    return res.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
      sizeBytes: buffer.length,
      category: safeCategory,
    });
  } catch (error: any) {
    console.error('Error handling media upload:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload media file' });
  }
});

// Delete uploaded media file from disk across all storage targets
app.post('/api/delete-media', (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid url parameter' });
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.startsWith('/uploads/')) {
      return res.json({ success: true, message: 'Non-uploaded asset skipped from disk deletion' });
    }

    const relativeSubPath = cleanUrl.replace(/^\/uploads\//, '');
    const safeSubPath = path.normalize(relativeSubPath).replace(/^(\.\.[\/\\])+/, '');

    const filePath = path.resolve(__dirname, 'public', 'uploads', safeSubPath);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Delete] Deleted media file from ${filePath}`);
      } catch (unlinkErr: any) {
        console.warn(`[Delete] Warning unlinking ${filePath}:`, unlinkErr.message);
      }
    }

    return res.json({ success: true, deleted: safeSubPath });
  } catch (error: any) {
    console.error('Error handling media delete:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete media file' });
  }
});

// List uploaded media items
app.get('/api/uploaded-media-list', (_req, res) => {
  try {
    const categories = ['videos', 'images', 'audio', 'documents'];
    const result: Record<string, Array<{ name: string; url: string; size: number; mtime: string }>> = {
      videos: [],
      images: [],
      audio: [],
      documents: [],
    };

    categories.forEach((cat) => {
      const dir = path.resolve(__dirname, 'public', 'uploads', cat);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          if (file.startsWith('.')) return;
          try {
            const stats = fs.statSync(path.join(dir, file));
            result[cat].push({
              name: file,
              url: `/uploads/${cat}/${file}`,
              size: stats.size,
              mtime: stats.mtime.toISOString(),
            });
          } catch {
            // ignore
          }
        });
      }
    });

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to list uploaded media' });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Full codebase export archive (.zip)
app.get('/api/export-codebase', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public', 'djital_project_full_source.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="djital-sound-system-source.zip"');
    return res.sendFile(zipPath);
  }
  return res.status(404).json({ error: 'Codebase archive not found' });
});

// ----------------------------------------------------
// Vite Dev Server / Static Production Server
// ----------------------------------------------------

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RAILWAY_ENVIRONMENT) ||
    Boolean(process.env.RAILWAY_PROJECT_ID) ||
    Boolean(process.env.RAILWAY_STATIC_URL);

  const distPath = path.resolve(__dirname, 'dist');
  const distIndexPath = path.join(distPath, 'index.html');

  if (isProduction && fs.existsSync(distIndexPath)) {
    console.log('[Server] Running in PRODUCTION mode, serving static build from /dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexPath);
    });
  } else {
    // Vite middleware for development or fallback
    console.log('[Server] Initializing Vite middleware for dynamic development serving');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: Number(PORT),
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`> DJ Ital Sound System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown handling for Railway container redeployments
function handleGracefulShutdown(signal: string) {
  console.log(`[Storage] Received ${signal}. Flushing active database and uploads to Railway volume...`);
  try {
    const storage = getStorageDetails();
    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    if (fs.existsSync(primaryDbFile)) {
      const fd = fs.openSync(primaryDbFile, 'r+');
      try {
        fs.fsyncSync(fd);
      } catch {}
      fs.closeSync(fd);
    }
    console.log('[Storage] Graceful shutdown complete. Data flushed to disk.');
  } catch (err: any) {
    console.warn('[Storage] Shutdown flush warning:', err.message);
  }
  process.exit(0);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
