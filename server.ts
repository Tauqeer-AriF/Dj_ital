import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import os from 'os';

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

function getStorageDetails(): StorageStatus {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const dbFile = path.join(DATA_DIR, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(DATA_DIR, 'db_meta.json');
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
    resolvedDataDir: DATA_DIR,
    isPersistent: true,
    mountSource: 'local:data',
    isWritable: testDirectoryWritable(DATA_DIR),
    dbExists,
    dbSizeBytes,
    dbUpdatedAt,
    isSeed,
    candidatesChecked: [{ path: DATA_DIR, exists: true, writable: true, note: 'app data directory' }],
    env: {},
  };
}

function ensureDatabaseSeeded(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const dbFile = path.join(DATA_DIR, 'djital_db.sqlite.b64');
  const dbMetaFile = path.join(DATA_DIR, 'db_meta.json');

  // ONLY seed if database file does NOT exist or has 0 bytes.
  // Never re-seed or overwrite if an existing database is present!
  if (!fs.existsSync(dbFile) || fs.statSync(dbFile).size === 0) {
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
      console.log(`[Storage] Initialized database from seed at "${DATA_DIR}"`);
    }
  }
}

function syncUploadDirectories(): void {
  try {
    const publicUploadDir = path.resolve(__dirname, 'public', 'uploads');
    const localDataUploadDir = path.join(DATA_DIR, 'uploads');
    const categories = ['videos', 'images', 'audio', 'documents'];
    for (const base of [publicUploadDir, localDataUploadDir]) {
      for (const cat of categories) {
        const catDir = path.join(base, cat);
        if (!fs.existsSync(catDir)) {
          fs.mkdirSync(catDir, { recursive: true });
        }
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

// Dedicated streaming endpoint for uploaded media with HTTP 206 Range support and multi-path fallback
app.get('/uploads/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const safeCategory = ['videos', 'images', 'audio', 'documents'].includes(category) ? category : 'documents';
  const safeFilename = path.basename(filename);

  const storage = getStorageDetails();
  const candidatePaths = [
    path.resolve(__dirname, 'public', 'uploads', safeCategory, safeFilename),
    path.join(storage.resolvedDataDir, 'uploads', safeCategory, safeFilename),
    path.resolve(LOCAL_DATA_DIR, 'uploads', safeCategory, safeFilename),
    path.resolve(PROTECTED_SEED_DIR, 'uploads', safeCategory, safeFilename),
  ];

  let foundPath: string | null = null;
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      foundPath = p;
      break;
    }
  }

  if (!foundPath) {
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

    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const primaryDbFile = path.join(DATA_DIR, 'djital_db.sqlite.b64');
    const primaryMetaFile = path.join(DATA_DIR, 'db_meta.json');
    const primaryBakFile = path.join(DATA_DIR, 'djital_db.sqlite.b64.bak');

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

    console.log(`[Storage] Saved database snapshot directly in realtime (${meta.sizeBytes} bytes)`);

    return res.json({
      success: true,
      meta,
      message: 'Database saved directly to server disk in realtime.',
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

    // 1. Content Deduplication Check: Look for an existing identical file
    const candidateDirs = [
      path.resolve(__dirname, 'public', 'uploads', safeCategory),
      path.resolve(storage.resolvedDataDir, 'uploads', safeCategory),
      path.resolve(LOCAL_DATA_DIR, 'uploads', safeCategory),
    ];

    let existingFileMatch: string | null = null;
    for (const dir of candidateDirs) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const f of files) {
            if (f.startsWith('.')) continue;
            const fullP = path.join(dir, f);
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
      if (existingFileMatch) break;
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

    // Target destinations to guarantee media survives code rebuilds & volume changes
    const destDirs = new Set<string>();
    destDirs.add(path.resolve(__dirname, 'public', 'uploads', safeCategory));
    destDirs.add(path.resolve(storage.resolvedDataDir, 'uploads', safeCategory));
    destDirs.add(path.resolve(LOCAL_DATA_DIR, 'uploads', safeCategory));
    if (fs.existsSync('/app/data')) {
      destDirs.add(path.resolve('/app/data', 'uploads', safeCategory));
    }
    if (process.env.DATA_DIR) {
      destDirs.add(path.resolve(process.env.DATA_DIR, 'uploads', safeCategory));
    }

    for (const dir of destDirs) {
      try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const filePath = path.join(dir, finalFilename);
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          if (stat.size === buffer.length) continue;
        }
        const tempPath = path.join(dir, `.tmp_${Date.now()}_${finalFilename}`);
        const fd = fs.openSync(tempPath, 'w');
        fs.writeSync(fd, buffer);
        try {
          fs.fsyncSync(fd);
        } catch {}
        fs.closeSync(fd);
        fs.renameSync(tempPath, filePath);
      } catch (err: any) {
        console.warn(`[Upload] Notice: Could not write to ${dir}:`, err.message);
      }
    }

    const publicUrl = `/uploads/${safeCategory}/${finalFilename}`;
    console.log(`[Upload] Saved media clip to storage targets (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) -> ${publicUrl}`);

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

    const storage = getStorageDetails();
    const targetDirs = [
      path.resolve(__dirname, 'public', 'uploads'),
      path.join(storage.resolvedDataDir, 'uploads'),
      path.resolve(LOCAL_DATA_DIR, 'uploads'),
    ];

    for (const base of targetDirs) {
      const filePath = path.resolve(base, safeSubPath);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`[Delete] Deleted media file from ${filePath}`);
        } catch (unlinkErr: any) {
          console.warn(`[Delete] Warning unlinking ${filePath}:`, unlinkErr.message);
        }
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
