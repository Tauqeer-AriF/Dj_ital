import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

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

// Baseline seed location (guaranteed safe from volume overlay mounts)
const PROTECTED_SEED_DIR = path.resolve(__dirname, 'seed_data');
const LOCAL_DATA_DIR = path.resolve(__dirname, 'data');

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
    // Attempt permission fix if running under non-root container
    try {
      fs.chmodSync(dir, 0o777);
      const testFile = path.join(dir, `.test_write_${process.pid}_${Date.now()}`);
      fs.writeFileSync(testFile, 'ok', 'utf-8');
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
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
    '/app/data',
    path.resolve(process.cwd(), 'data'),
    LOCAL_DATA_DIR,
    '/data',
    PROTECTED_SEED_DIR,
  ].filter(Boolean) as string[];

  const uniqueDirs = Array.from(new Set(possibleSeeds));
  let bestDbPath: string | undefined;
  let bestMetaPath: string | undefined;
  let bestTime = -1;
  let bestIsCustom = false;
  let bestUpdatedAt: string | undefined;

  for (const s of uniqueDirs) {
    const dbFile = path.join(s, 'djital_db.sqlite.b64');
    const metaFile = path.join(s, 'db_meta.json');
    if (fs.existsSync(dbFile)) {
      try {
        const stats = fs.statSync(dbFile);
        if (stats.size > 100) {
          let time = 0;
          let isSeed = true;
          let updatedAt = '';
          if (fs.existsSync(metaFile)) {
            try {
              const meta = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
              time = meta.updatedAt ? new Date(meta.updatedAt).getTime() : 0;
              isSeed = Boolean(meta.isSeed);
              updatedAt = meta.updatedAt;
            } catch {}
          }
          // Weight custom databases with user edits much higher so newly deployed seed never overwrites user edits
          const score = (!isSeed ? 10000000000000 : 0) + time;
          if (score > bestTime || !bestDbPath) {
            bestTime = score;
            bestDbPath = dbFile;
            bestMetaPath = fs.existsSync(metaFile) ? metaFile : undefined;
            bestIsCustom = !isSeed;
            bestUpdatedAt = updatedAt;
          }
        }
      } catch {}
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
      if (m === '/app/data' || m === '/data' || m.startsWith('/mnt/') || m === '/storage' || m === '/volume') {
        candidates.push({ path: m, note: `linux-mount:${m}`, isExplicitVolume: true, isConfirmedMount: true });
      }
    }
  }

  // 3. Application local directory (/app/data or ./data) - Standard Railway mount path
  const appDataPath = path.resolve(process.cwd(), 'data');
  if (!candidates.some((c) => c.path === appDataPath)) {
    const isRailwayVol = Boolean(process.env.RAILWAY_VOLUME_NAME || process.env.RAILWAY_VOLUME_MOUNT_PATH);
    candidates.push({
      path: appDataPath,
      note: isRailwayVol ? 'app directory (Railway volume enabled)' : 'app directory (/app/data)',
      isExplicitVolume: isRailwayVol,
      isConfirmedMount: linuxMounts.includes(appDataPath),
    });
  }

  // 4. Common persistent volume mount locations in Railway / Docker / Linux
  const commonMountPoints = [
    '/data',
    '/mnt/data',
    '/storage',
    '/volume',
    '/var/data',
    LOCAL_DATA_DIR,
  ];

  for (const p of commonMountPoints) {
    if (!candidates.some((c) => c.path === p)) {
      const isKnownVol = p === '/data' || p.startsWith('/mnt/') || p === '/storage' || p === '/volume';
      candidates.push({
        path: p,
        note: isKnownVol ? 'common volume mount path' : 'fallback directory',
        isExplicitVolume: isKnownVol,
        isConfirmedMount: linuxMounts.includes(p),
      });
    }
  }

  const candidatesChecked: Array<{ path: string; exists: boolean; writable: boolean; note: string }> = [];
  let chosenDir: string = LOCAL_DATA_DIR;
  let chosenNote: string = 'fallback:app local directory';
  let isPersistent: boolean = false;

  for (const candidate of candidates) {
    let exists = false;
    let writable = false;
    try {
      exists = fs.existsSync(candidate.path);
      if (!exists && candidate.isExplicitVolume) {
        try {
          fs.mkdirSync(candidate.path, { recursive: true });
          exists = true;
        } catch {}
      }
      if (exists) {
        writable = testDirectoryWritable(candidate.path);
      }
    } catch {
      exists = false;
      writable = false;
    }

    candidatesChecked.push({
      path: candidate.path,
      exists,
      writable,
      note: candidate.note,
    });

    if (writable) {
      if (candidate.isExplicitVolume || candidate.isConfirmedMount) {
        chosenDir = candidate.path;
        chosenNote = candidate.note;
        isPersistent = true;
        break;
      } else if (!chosenDir || chosenDir === LOCAL_DATA_DIR) {
        chosenDir = candidate.path;
        chosenNote = candidate.note;
        isPersistent = Boolean(process.env.RAILWAY_VOLUME_NAME || process.env.RAILWAY_VOLUME_MOUNT_PATH);
      }
    }
  }

  try {
    if (!fs.existsSync(chosenDir)) {
      fs.mkdirSync(chosenDir, { recursive: true });
    }
  } catch {}

  const dbFile = path.join(chosenDir, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(chosenDir, 'db_meta.json');
  const dbExists = fs.existsSync(dbFile);
  let dbSizeBytes = 0;
  let dbUpdatedAt: string | undefined = undefined;
  let isSeed: boolean | undefined = undefined;

  if (dbExists) {
    try {
      const stats = fs.statSync(dbFile);
      dbSizeBytes = stats.size;
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

function ensureDatabaseSeeded(): void {
  const storage = getStorageDetails();
  const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

  const fileExists = fs.existsSync(dbFile);
  const fileSize = fileExists ? fs.statSync(dbFile).size : 0;

  // Check if active DB file is missing, empty, or has no custom user data
  if (!fileExists || fileSize < 100) {
    const { seedDbPath, seedMetaPath, isCustom, updatedAt } = findLatestDatabase();
    if (seedDbPath && fs.existsSync(seedDbPath) && seedDbPath !== dbFile) {
      try {
        fs.copyFileSync(seedDbPath, dbFile);
        if (seedMetaPath && fs.existsSync(seedMetaPath)) {
          fs.copyFileSync(seedMetaPath, dbMetaFile);
        } else {
          fs.writeFileSync(
            dbMetaFile,
            JSON.stringify(
              {
                updatedAt: updatedAt || '1970-01-01T00:00:00.000Z',
                updatedBy: isCustom ? 'volume-recovery' : 'system-seed',
                isSeed: !isCustom,
              },
              null,
              2
            ),
            'utf-8'
          );
        }
        console.log(`[Storage] Initialized persistent volume at "${storage.resolvedDataDir}" with snapshot from "${seedDbPath}" (Custom edits: ${isCustom ? 'YES' : 'NO'}).`);
      } catch (err: any) {
        console.error(`[Storage] Error copying snapshot to ${storage.resolvedDataDir}:`, err.message);
      }
    }
  }
}

// Run initial seed check on startup
ensureDatabaseSeeded();

// Support large JSON payloads for base64 SQLite snapshots & image data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    const primaryDbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');
    const primaryBakFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64.bak');

    // 1. Write to active storage directory
    fs.writeFileSync(primaryDbFile, databaseBase64, 'utf-8');
    try {
      fs.writeFileSync(primaryBakFile, databaseBase64, 'utf-8');
    } catch {}

    const meta = {
      updatedAt: timestamp || new Date().toISOString(),
      updatedBy: clientDevice || 'web-client',
      sizeBytes: databaseBase64.length,
      isSeed: false,
    };
    fs.writeFileSync(primaryMetaFile, JSON.stringify(meta, null, 2), 'utf-8');

    // 2. Multi-directory mirror write:
    // Write redundantly to ALL writable data locations: /app/data, /data, LOCAL_DATA_DIR, and Railway env paths
    const mirrorDirs = new Set<string>();
    mirrorDirs.add(LOCAL_DATA_DIR);
    mirrorDirs.add(path.resolve(process.cwd(), 'data'));
    if (process.env.RAILWAY_VOLUME_MOUNT_PATH) mirrorDirs.add(path.resolve(process.env.RAILWAY_VOLUME_MOUNT_PATH));
    if (process.env.DATA_DIR) mirrorDirs.add(path.resolve(process.env.DATA_DIR));
    if (fs.existsSync('/app/data')) mirrorDirs.add('/app/data');
    if (fs.existsSync('/data')) mirrorDirs.add('/data');

    for (const dir of mirrorDirs) {
      if (dir !== storage.resolvedDataDir && testDirectoryWritable(dir)) {
        try {
          fs.writeFileSync(path.join(dir, 'djital_db.sqlite.b64'), databaseBase64, 'utf-8');
          fs.writeFileSync(path.join(dir, 'db_meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
        } catch {}
      }
    }

    // 3. Keep a rotating local backup
    try {
      const backupDir = path.join(storage.resolvedDataDir, 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      fs.writeFileSync(path.join(backupDir, 'latest_backup.b64'), databaseBase64, 'utf-8');
      fs.writeFileSync(path.join(backupDir, 'latest_meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
    } catch {}

    console.log(`[Storage] Saved database snapshot (${meta.sizeBytes} bytes) to "${primaryDbFile}" (Volume: ${storage.isPersistent ? 'YES' : 'NO'}, Mount: ${storage.mountSource})`);

    return res.json({
      success: true,
      meta,
      storageInfo: {
        dataDir: storage.resolvedDataDir,
        isPersistent: storage.isPersistent,
        mountSource: storage.mountSource,
      },
      message: 'Database saved to server successfully and synchronized for all devices.',
    });
  } catch (error: any) {
    console.error('Error writing server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to save database' });
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

// POST reset server database
app.post('/api/db/reset', (_req, res) => {
  try {
    const storage = getStorageDetails();
    const dbFile = path.join(storage.resolvedDataDir, 'djital_db.sqlite.b64');
    const dbMetaFile = path.join(storage.resolvedDataDir, 'db_meta.json');

    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
    if (fs.existsSync(dbMetaFile)) {
      fs.unlinkSync(dbMetaFile);
    }

    // Re-seed with baseline
    ensureDatabaseSeeded();

    return res.json({ success: true, message: 'Server database reset to default seeds' });
  } catch (error: any) {
    console.error('Error resetting server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset database' });
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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ----------------------------------------------------
// Vite Dev Server / Static Production Server
// ----------------------------------------------------

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Vite middleware for development
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
  } else {
    // Static build serving in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`> DJ Ital Sound System Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
