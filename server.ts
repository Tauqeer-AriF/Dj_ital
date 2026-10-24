import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import initSqlJs from 'sql.js';
import { createServer as createViteServer } from 'vite';

dotenv.config();

type SqlDatabase = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const configuredUploadLimit = Number(process.env.MAX_MEDIA_UPLOAD_BYTES);
const MAX_MEDIA_UPLOAD_BYTES = Number.isSafeInteger(configuredUploadLimit) && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 1024 * 1024 * 1024;
const isProd = process.env.NODE_ENV === 'production';
const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_PROJECT_ID);

// Use Railway's mounted volume when DATA_DIR is configured, while preserving
// the existing project-local paths for development.
const configuredDataDir = process.env.DATA_DIR;
if (isRailway && !configuredDataDir) {
  throw new Error('DATA_DIR must point to the Railway persistent volume (for example, /data).');
}
const DATA_DIR = path.resolve(configuredDataDir || path.resolve(__dirname, 'data'));
const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR ||
    (configuredDataDir ? path.resolve(DATA_DIR, 'uploads') : path.resolve(__dirname, 'public', 'uploads'))
);
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const SITE_IMAGES_DIR = path.resolve(DATA_DIR, 'site-images');
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, 'public', 'images');
const ANALYTICS_PATH = path.resolve(DATA_DIR, 'site_analytics.json');
const ANALYTICS_RETENTION_DAYS = 365;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(SITE_IMAGES_DIR)) fs.mkdirSync(SITE_IMAGES_DIR, { recursive: true });

async function applyInitialAdminPasswordReset(): Promise<void> {
  const initialPassword = process.env.ADMIN_PASSWORD_RESET_ONCE;
  if (!initialPassword) return;
  if (initialPassword.length < 6) {
    throw new Error('ADMIN_PASSWORD_RESET_ONCE must be at least 6 characters long.');
  }

  const markerPath = path.resolve(DATA_DIR, 'admin_password_reset_once.json');
  const databasePath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
  if (fs.existsSync(markerPath) || !fs.existsSync(databasePath)) return;

  const encodedDatabase = fs.readFileSync(databasePath, 'utf8').trim();
  if (!encodedDatabase) throw new Error('Cannot reset the admin password: database snapshot is empty.');

  const SQL = await initSqlJs({
    locateFile: (file) => path.resolve(__dirname, 'node_modules', 'sql.js', 'dist', file),
  });
  const database = new SQL.Database(Buffer.from(encodedDatabase, 'base64'));

  try {
    const authTable = database.exec(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'admin_auth'"
    );
    if (authTable.length === 0 || authTable[0].values.length === 0) {
      throw new Error('Cannot reset the admin password: admin_auth table is missing.');
    }

    const salt = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(initialPassword + salt, 'utf8').digest('hex');
    const now = new Date().toISOString();
    database.run(
      `INSERT INTO admin_auth (id, password_hash, password_salt, updated_at, last_login_at)
       VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         password_hash = excluded.password_hash,
         password_salt = excluded.password_salt,
         updated_at = excluded.updated_at`,
      [hash, salt, now, now]
    );

    const backupPath = path.resolve(
      BACKUPS_DIR,
      `djital_db.pre-admin-password-reset-${Date.now()}.b64`
    );
    fs.copyFileSync(databasePath, backupPath);

    const updatedSnapshot = Buffer.from(database.export()).toString('base64');
    const temporaryPath = `${databasePath}.tmp`;
    fs.writeFileSync(temporaryPath, updatedSnapshot, 'utf8');
    fs.renameSync(temporaryPath, databasePath);
    fs.writeFileSync(
      markerPath,
      JSON.stringify({ completedAt: now }, null, 2),
      'utf8'
    );
    console.info('[Server] Applied the one-time initial admin password reset.');
  } finally {
    database.close();
  }
}

// Middleware for parsing JSON with higher limit for SQLite base64 dumps
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(path.resolve(__dirname, 'public', 'uploads')));
app.use('/images', express.static(SITE_IMAGES_DIR));
app.use('/images', express.static(PUBLIC_IMAGES_DIR));
app.use('/public', express.static(path.resolve(__dirname, 'public')));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// Health check endpoint (for Railway, Cloud Run, uptime monitors)
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/analytics/visit', (req: Request, res: Response) => {
  const sessionId = req.body?.sessionId;
  if (typeof sessionId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(sessionId)) {
    return res.status(400).json({ success: false, error: 'A valid anonymous session ID is required.' });
  }

  try {
    const today = new Date();
    const day = today.toISOString().slice(0, 10);
    const sessionHash = createHash('sha256').update(sessionId, 'utf8').digest('hex');
    const analytics = loadSiteAnalytics();
    pruneSiteAnalytics(analytics, today);

    const dayStats = analytics.days[day] || { visits: 0, sessionHashes: [] };
    if (!dayStats.sessionHashes.includes(sessionHash)) {
      dayStats.sessionHashes.push(sessionHash);
      dayStats.visits += 1;
      analytics.totalVisits += 1;
    }
    analytics.days[day] = dayStats;
    saveSiteAnalytics(analytics);

    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true });
  } catch (error) {
    console.error('Could not record site visit:', error);
    res.status(500).json({ success: false, error: 'Could not record site visit.' });
  }
});

app.get('/api/analytics/visits', (_req: Request, res: Response) => {
  try {
    const today = new Date();
    const analytics = loadSiteAnalytics();
    pruneSiteAnalytics(analytics, today);
    const daily = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(today);
      date.setUTCHours(0, 0, 0, 0);
      date.setUTCDate(date.getUTCDate() - (29 - index));
      const day = date.toISOString().slice(0, 10);
      const dayStats = analytics.days[day];
      return { date: day, visits: dayStats?.visits || 0 };
    });
    const uniqueSessions = new Set(
      daily.flatMap(({ date }) => analytics.days[date]?.sessionHashes || [])
    );

    saveSiteAnalytics(analytics);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      totalVisits: analytics.totalVisits,
      visitsLast30Days: daily.reduce((total, day) => total + day.visits, 0),
      uniqueSessionsLast30Days: uniqueSessions.size,
      daily,
    });
  } catch (error) {
    console.error('Could not load site visit analytics:', error);
    res.status(500).json({ success: false, error: 'Could not load site visit analytics.' });
  }
});

function collectFiles(directory: string, relativeTo = directory): Array<{ path: string; fullPath: string; size: number }> {
  if (!fs.existsSync(directory)) return [];
  const files: Array<{ path: string; fullPath: string; size: number }> = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, relativeTo));
    } else if (entry.isFile()) {
      files.push({
        path: path.relative(relativeTo, fullPath).split(path.sep).join('/'),
        fullPath,
        size: fs.statSync(fullPath).size,
      });
    }
  }
  return files;
}

function collectSiteImages(): Array<{ path: string; fullPath: string; size: number }> {
  const images = new Map<string, { path: string; fullPath: string; size: number }>();
  for (const file of collectFiles(PUBLIC_IMAGES_DIR)) images.set(file.path, file);
  for (const file of collectFiles(SITE_IMAGES_DIR)) images.set(file.path, file);
  return Array.from(images.values());
}

function collectUploadedFiles(): Array<{ path: string; fullPath: string; size: number }> {
  const uploads = new Map<string, { path: string; fullPath: string; size: number }>();
  const publicUploads = path.resolve(__dirname, 'public', 'uploads');
  for (const file of collectFiles(publicUploads)) uploads.set(file.path, file);
  for (const file of collectFiles(UPLOADS_DIR)) uploads.set(file.path, file);
  return Array.from(uploads.values());
}

function createBackupBundle(): Buffer {
  const zip = new AdmZip();
  const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
  const metaPath = path.resolve(DATA_DIR, 'db_meta.json');
  if (!fs.existsSync(dbPath)) throw new Error('Database snapshot not found on disk.');

  const databaseContent = fs.readFileSync(dbPath);
  zip.addFile('data/djital_db.sqlite.b64', databaseContent);
  const files = [{
    path: 'data/djital_db.sqlite.b64',
    size: databaseContent.length,
    sha256: createHash('sha256').update(databaseContent).digest('hex'),
  }];

  if (fs.existsSync(metaPath)) {
    const metaContent = fs.readFileSync(metaPath);
    zip.addFile('data/db_meta.json', metaContent);
    files.push({
      path: 'data/db_meta.json',
      size: metaContent.length,
      sha256: createHash('sha256').update(metaContent).digest('hex'),
    });
  }

  for (const file of collectUploadedFiles()) {
    const archivePath = `uploads/${file.path}`;
    const content = fs.readFileSync(file.fullPath);
    zip.addFile(archivePath, content);
    files.push({
      path: archivePath,
      size: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  }
  for (const file of collectSiteImages()) {
    const archivePath = `site-images/${file.path}`;
    const content = fs.readFileSync(file.fullPath);
    zip.addFile(archivePath, content);
    files.push({
      path: archivePath,
      size: content.length,
      sha256: createHash('sha256').update(content).digest('hex'),
    });
  }

  zip.addFile('manifest.json', Buffer.from(JSON.stringify({
    bundleVersion: '3.0.0',
    createdAt: new Date().toISOString(),
    appName: 'DJ Ital Official Archive & Booking Portal',
    files,
  }, null, 2), 'utf8'));
  return zip.toBuffer();
}

function resolveBundlePath(root: string, relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  if (!normalized || normalized.startsWith('/') || parts.some((part) =>
    !part || part === '.' || part === '..' || /[<>:"|?*\u0000]/.test(part)
  )) {
    throw new Error(`Invalid path in backup bundle: ${relativePath}`);
  }
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(resolvedRoot, ...parts);
  const rootPrefix = `${resolvedRoot}${path.sep}`;
  if (!target.startsWith(rootPrefix)) throw new Error(`Invalid path in backup bundle: ${relativePath}`);
  let currentPath = resolvedRoot;
  for (const part of parts) {
    currentPath = path.join(currentPath, part);
    if (fs.existsSync(currentPath) && fs.lstatSync(currentPath).isSymbolicLink()) {
      throw new Error(`Backup path resolves through a symbolic link: ${relativePath}`);
    }
  }
  return target;
}

async function validateDatabaseSnapshot(encodedSnapshot: string): Promise<string> {
  if (!encodedSnapshot.trim()) throw new Error('Backup does not contain a database snapshot.');
  const databaseBytes = Buffer.from(encodedSnapshot.trim(), 'base64');
  if (databaseBytes.length < 16 || databaseBytes.subarray(0, 16).toString('utf8') !== 'SQLite format 3\u0000') {
    throw new Error('The selected backup does not contain a valid SQLite database.');
  }
  const SQL = await initSqlJs({
    locateFile: (file) => path.resolve(__dirname, 'node_modules', 'sql.js', 'dist', file),
  });
  const database = new SQL.Database(databaseBytes);
  try {
    const tableResult = database.exec(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'profile'"
    );
    if (!tableResult.length || !tableResult[0].values.length) {
      throw new Error('The SQLite file is valid but is not a DJ Ital website database.');
    }
  } finally {
    database.close();
  }
  return databaseBytes.toString('base64');
}

function writeFileAtomically(targetPath: string, contents: Buffer | string): void {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporaryPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, contents);
  fs.renameSync(temporaryPath, targetPath);
}

interface DailyVisitStats {
  visits: number;
  sessionHashes: string[];
}

interface SiteAnalyticsData {
  totalVisits: number;
  days: Record<string, DailyVisitStats>;
}

function loadSiteAnalytics(): SiteAnalyticsData {
  if (!fs.existsSync(ANALYTICS_PATH)) return { totalVisits: 0, days: {} };

  const parsed: unknown = JSON.parse(fs.readFileSync(ANALYTICS_PATH, 'utf8'));
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('totalVisits' in parsed) ||
    typeof parsed.totalVisits !== 'number' ||
    !Number.isSafeInteger(parsed.totalVisits) ||
    parsed.totalVisits < 0 ||
    !('days' in parsed) ||
    typeof parsed.days !== 'object' ||
    parsed.days === null ||
    Array.isArray(parsed.days)
  ) {
    throw new Error('Stored site analytics data has an invalid format.');
  }

  const days: SiteAnalyticsData['days'] = {};
  for (const [date, stats] of Object.entries(parsed.days)) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof stats !== 'object' ||
      stats === null ||
      !('visits' in stats) ||
      typeof stats.visits !== 'number' ||
      !Number.isSafeInteger(stats.visits) ||
      stats.visits < 0 ||
      !('sessionHashes' in stats) ||
      !Array.isArray(stats.sessionHashes) ||
      !stats.sessionHashes.every(
        (hash: unknown): hash is string => typeof hash === 'string' && /^[\da-f]{64}$/i.test(hash)
      )
    ) {
      throw new Error('Stored site analytics data has an invalid daily record.');
    }
    days[date] = { visits: stats.visits, sessionHashes: stats.sessionHashes };
  }
  return { totalVisits: parsed.totalVisits, days };
}

function saveSiteAnalytics(analytics: SiteAnalyticsData): void {
  writeFileAtomically(ANALYTICS_PATH, JSON.stringify(analytics));
}

function pruneSiteAnalytics(analytics: SiteAnalyticsData, today: Date): void {
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - ANALYTICS_RETENTION_DAYS + 1);
  const oldestDay = cutoff.toISOString().slice(0, 10);
  for (const day of Object.keys(analytics.days)) {
    if (day < oldestDay) delete analytics.days[day];
  }
}

function isUploadReferenced(database: SqlDatabase, url: string): boolean {
  const tables = database.exec(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
  );
  for (const [rawTableName] of tables[0]?.values || []) {
    const tableName = String(rawTableName);
    if (tableName === 'deleted_media_urls') continue;
    const escapedTableName = tableName.replace(/"/g, '""');
    const columns = database.exec(`PRAGMA table_info("${escapedTableName}")`);
    for (const column of columns[0]?.values || []) {
      const columnName = String(column[1]);
      const escapedColumnName = columnName.replace(/"/g, '""');
      const matches = database.exec(
        `SELECT 1 FROM "${escapedTableName}" WHERE instr(CAST("${escapedColumnName}" AS TEXT), ?) > 0 LIMIT 1`,
        [url]
      );
      if (matches.length > 0 && matches[0].values.length > 0) return true;
    }
  }
  return false;
}

function saveSafetyBundle(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safetyPath = path.resolve(BACKUPS_DIR, `djital_pre-restore_${timestamp}.djbundle`);
  fs.writeFileSync(safetyPath, createBackupBundle());
  return safetyPath;
}

// 1. Get database backup summary
app.get('/api/backup/summary', async (_req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    const metaPath = path.resolve(DATA_DIR, 'db_meta.json');
    const customBackupPath = path.resolve(BACKUPS_DIR, 'djital_db_previous_custom_data.b64');

    const dbExists = fs.existsSync(dbPath);
    let dbSizeBytes = 0;
    let updatedAt: string | null = null;
    let isSeed = false;

    if (dbExists) {
      const stats = fs.statSync(dbPath);
      dbSizeBytes = stats.size;
    }

    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        updatedAt = meta.updatedAt || null;
        isSeed = Boolean(meta.isSeed);
      } catch (e) {
        console.warn('Failed to parse db_meta.json:', e);
      }
    }

    const uploads = collectUploadedFiles();
    const siteImages = collectSiteImages();
    const uploadedFilesTotalBytes = uploads.reduce((total, file) => total + file.size, 0);
    const siteImagesTotalBytes = siteImages.reduce((total, file) => total + file.size, 0);
    const recordCounts: Record<string, number> = {};
    if (dbExists) {
      const SQL = await initSqlJs({
        locateFile: (file) => path.resolve(__dirname, 'node_modules', 'sql.js', 'dist', file),
      });
      const database = new SQL.Database(Buffer.from(fs.readFileSync(dbPath, 'utf8').trim(), 'base64'));
      try {
        const tables = database.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'");
        for (const [tableName] of tables[0]?.values || []) {
          const name = String(tableName);
          const escapedName = name.replace(/"/g, '""');
          const count = database.exec(`SELECT COUNT(*) FROM "${escapedName}"`);
          recordCounts[name] = Number(count[0]?.values[0]?.[0] || 0);
        }
      } finally {
        database.close();
      }
    }

    const hasPreviousCustomData = fs.existsSync(customBackupPath);
    if (!updatedAt && dbExists) updatedAt = fs.statSync(dbPath).mtime.toISOString();

    res.json({
      dbExists,
      dbSizeBytes,
      updatedAt,
      isSeed,
      uploadedFilesCount: uploads.length,
      uploadedFilesTotalBytes,
      siteImagesCount: siteImages.length,
      siteImagesTotalBytes,
      totalMediaCount: uploads.length + siteImages.length,
      totalMediaBytes: uploadedFilesTotalBytes + siteImagesTotalBytes,
      recordCounts,
      hasPreviousCustomData,
      isPersistent: true,
    });
  } catch (err: unknown) {
    console.error('Error generating backup summary:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to read backup summary' });
  }
});

// 2. Export database snapshot (binary download)
app.get('/api/db/export', (_req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found on disk' });
    }

    const b64 = fs.readFileSync(dbPath, 'utf8').trim();
    const binary = Buffer.from(b64, 'base64');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', `attachment; filename="djital_database_${timestamp}.sqlite"`);
    res.send(binary);
  } catch (err: any) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message || 'Failed to export SQLite binary' });
  }
});

// 3. Export backup bundle (.djbundle zip file)
app.get('/api/backup/bundle', (_req: Request, res: Response) => {
  try {
    const zipBuffer = createBackupBundle();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="djital_backup_${timestamp}.djbundle"`);
    res.send(zipBuffer);
  } catch (err: unknown) {
    console.error('Bundle error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to generate backup bundle' });
  }
});

// 4. Restore backup bundle
app.post(
  '/api/restore/bundle',
  express.raw({ type: 'application/octet-stream', limit: '1gb' }),
  async (req: Request, res: Response) => {
    try {
      const filename = String(req.query.filename || req.body?.filename || 'backup.djbundle');
      let archiveBuffer: Buffer;
      if (Buffer.isBuffer(req.body)) {
        archiveBuffer = req.body;
      } else if (typeof req.body?.bundleBase64 === 'string') {
        archiveBuffer = Buffer.from(req.body.bundleBase64, 'base64');
      } else {
        return res.status(400).json({ error: 'No backup file was provided.' });
      }

      let databaseBase64: string;
      let restoreEntries: Array<{ targetPath: string; content: Buffer }> = [];
      if (/\.(djbundle|zip)$/i.test(filename)) {
        const zip = new AdmZip(archiveBuffer);
        const zipEntries = zip.getEntries();
        const filesByPath = new Map(zipEntries.filter((entry) => !entry.isDirectory).map((entry) => [entry.entryName, entry]));
        const manifestEntry = filesByPath.get('manifest.json');
        if (manifestEntry) {
          let manifest: { files?: Array<{ path?: string; sha256?: string }> };
          try {
            manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
          } catch {
            return res.status(400).json({ error: 'Backup manifest is invalid JSON.' });
          }
          for (const file of manifest.files || []) {
            if (!file.path || !file.sha256) continue;
            const entry = filesByPath.get(file.path);
            if (!entry) return res.status(400).json({ error: `Backup is missing ${file.path}.` });
            const actualHash = createHash('sha256').update(entry.getData()).digest('hex');
            if (actualHash !== file.sha256) return res.status(400).json({ error: `Backup integrity check failed for ${file.path}.` });
          }
        }

        const databaseEntry = filesByPath.get('data/djital_db.sqlite.b64') ||
          zipEntries.find((entry) => !entry.isDirectory && /(?:^|\/)djital_db\.sqlite\.b64$/i.test(entry.entryName)) ||
          zipEntries.find((entry) => !entry.isDirectory && /\.(sqlite|db)$/i.test(entry.entryName));
        if (!databaseEntry) return res.status(400).json({ error: 'Backup archive does not contain the website database.' });
        const databaseData = databaseEntry.getData();
        const encodedDatabase = /\.(sqlite|db)$/i.test(databaseEntry.entryName)
          ? databaseData.toString('base64')
          : databaseData.toString('utf8');
        databaseBase64 = await validateDatabaseSnapshot(encodedDatabase);
        for (const entry of zipEntries) {
          if (entry.isDirectory) continue;
          const uploadPrefix = 'uploads/';
          const imagePrefix = 'site-images/';
          if (entry.entryName.startsWith(uploadPrefix)) {
            const relativePath = entry.entryName.slice(uploadPrefix.length);
            restoreEntries.push({ targetPath: resolveBundlePath(UPLOADS_DIR, relativePath), content: entry.getData() });
          } else if (entry.entryName.startsWith(imagePrefix)) {
            const relativePath = entry.entryName.slice(imagePrefix.length);
            restoreEntries.push({ targetPath: resolveBundlePath(SITE_IMAGES_DIR, relativePath), content: entry.getData() });
          }
        }
      } else if (/\.(sqlite|db)$/i.test(filename)) {
        databaseBase64 = await validateDatabaseSnapshot(archiveBuffer.toString('base64'));
      } else if (/\.b64$/i.test(filename) || /\.txt$/i.test(filename)) {
        databaseBase64 = await validateDatabaseSnapshot(archiveBuffer.toString('utf8'));
      } else {
        return res.status(400).json({ error: 'Unsupported backup type. Choose a .djbundle, .zip, .sqlite, or .b64 file.' });
      }

      const safetyPath = saveSafetyBundle();
      for (const file of restoreEntries) writeFileAtomically(file.targetPath, file.content);
      writeFileAtomically(path.resolve(DATA_DIR, 'djital_db.sqlite.b64'), databaseBase64);
      const meta = {
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin-bundle-restore',
        sizeBytes: Buffer.byteLength(databaseBase64, 'utf8'),
        isSeed: false,
        restoredFrom: path.basename(filename),
      };
      writeFileAtomically(path.resolve(DATA_DIR, 'db_meta.json'), JSON.stringify(meta, null, 2));

      res.json({
        success: true,
        message: `Website database and ${restoreEntries.length} media/image files restored. A safety backup was saved before restore.`,
        safetyBackup: path.basename(safetyPath),
      });
    } catch (err: unknown) {
      console.error('Restore bundle error:', err);
      res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to restore backup bundle.' });
    }
  }
);

// 5. Load SQLite database
app.get('/api/db/load', async (_req: Request, res: Response) => {
  try {
    await applyInitialAdminPasswordReset();
    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8').trim();
      res.json({ success: true, data });
    } else {
      res.status(404).json({ success: false, error: 'Database not initialized' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Load the separately stored custom snapshot used by the admin recovery actions.
app.get('/api/db/previous', (_req: Request, res: Response) => {
  try {
    const backupPath = path.resolve(BACKUPS_DIR, 'djital_db_previous_custom_data.b64');
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ success: false, error: 'Previous custom database snapshot not found' });
    }

    const data = fs.readFileSync(backupPath, 'utf8').trim();
    if (!data) {
      return res.status(404).json({ success: false, error: 'Previous custom database snapshot is empty' });
    }
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to read previous database snapshot' });
  }
});

// 6. Save SQLite database
app.post('/api/db/save', async (req: Request, res: Response) => {
  try {
    const { data, timestamp } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    const temporaryDbPath = `${dbPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporaryDbPath, data, 'utf8');
    fs.renameSync(temporaryDbPath, dbPath);

    const meta = {
      updatedAt: timestamp || new Date().toISOString(),
      updatedBy: 'client-sync',
      sizeBytes: data.length,
      isSeed: false,
    };
    const metaPath = path.resolve(DATA_DIR, 'db_meta.json');
    const temporaryMetaPath = `${metaPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporaryMetaPath, JSON.stringify(meta, null, 2), 'utf8');
    fs.renameSync(temporaryMetaPath, metaPath);
    await applyInitialAdminPasswordReset();

    res.json({ success: true, timestamp: meta.updatedAt });
  } catch (err: any) {
    console.error('Save DB error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/uploads/delete-unreferenced', async (req: Request, res: Response) => {
  const urls = req.body?.urls;
  if (!Array.isArray(urls) || urls.some((url: unknown) => typeof url !== 'string')) {
    return res.status(400).json({ success: false, error: 'A list of upload URLs is required.' });
  }
  if (urls.length > 1000) {
    return res.status(400).json({ success: false, error: 'Cannot clean up more than 1000 uploads at once.' });
  }

  const databasePath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
  if (!fs.existsSync(databasePath)) {
    return res.status(503).json({ success: false, error: 'The saved database is unavailable; upload files were not deleted.' });
  }

  let database: SqlDatabase | null = null;
  try {
    const SQL = await initSqlJs({
      locateFile: (file) => path.resolve(__dirname, 'node_modules', 'sql.js', 'dist', file),
    });
    database = new SQL.Database(Buffer.from(fs.readFileSync(databasePath, 'utf8').trim(), 'base64'));

    let deleted = 0;
    let missing = 0;
    let retainedReferenced = 0;
    let skipped = 0;
    for (const url of new Set(urls as string[])) {
      const match = /^\/uploads\/(\d{13}_[a-f0-9]{16}_[a-zA-Z0-9._-]+)$/.exec(url);
      if (!match) {
        skipped += 1;
        continue;
      }

      const cleanupAuthorization = database.exec(
        'SELECT 1 FROM deleted_media_urls WHERE url = ? LIMIT 1',
        [url]
      );
      if (cleanupAuthorization.length === 0 || cleanupAuthorization[0].values.length === 0) {
        skipped += 1;
        continue;
      }

      if (isUploadReferenced(database, url)) {
        retainedReferenced += 1;
        continue;
      }

      const targetPath = path.resolve(UPLOADS_DIR, match[1]);
      if (path.dirname(targetPath) !== path.resolve(UPLOADS_DIR)) {
        skipped += 1;
        continue;
      }
      if (!fs.existsSync(targetPath)) {
        missing += 1;
        continue;
      }
      if (!fs.statSync(targetPath).isFile()) {
        skipped += 1;
        continue;
      }
      fs.unlinkSync(targetPath);
      deleted += 1;
    }

    return res.json({ success: true, deleted, missing, retainedReferenced, skipped });
  } catch (err: unknown) {
    console.error('Failed to clean up unreferenced media uploads:', err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to clean up uploaded files.',
    });
  } finally {
    database?.close();
  }
});

// 7. Media file upload
app.post('/api/upload', async (req: Request, res: Response) => {
  let temporaryPath: string | null = null;
  try {
    const contentType = req.get('content-type')?.split(';')[0].trim().toLowerCase();
    let filename = 'upload';
    let mimeType = 'application/octet-stream';
    let byteCount = 0;
    const fileId = `${Date.now()}_${randomBytes(8).toString('hex')}`;

    if (contentType === 'application/json') {
      const body = req.body as { filename?: unknown; fileData?: unknown; mimeType?: unknown };
      if (typeof body?.fileData !== 'string' || !body.fileData) {
        return res.status(400).json({ success: false, error: 'Missing fileData in request.' });
      }
      filename = typeof body.filename === 'string' ? body.filename : filename;
      mimeType = typeof body.mimeType === 'string' ? body.mimeType : mimeType;
      const cleanBase64 = body.fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(cleanBase64, 'base64');
      byteCount = buffer.length;
      if (byteCount > MAX_MEDIA_UPLOAD_BYTES) {
        return res.status(413).json({ success: false, error: 'File exceeds the configured upload limit.' });
      }
      if (byteCount === 0) {
        return res.status(400).json({ success: false, error: 'The uploaded file is empty.' });
      }
      const safeName = `${fileId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180) || 'upload'}`;
      const filePath = path.resolve(UPLOADS_DIR, safeName);
      temporaryPath = `${filePath}.tmp`;
      fs.writeFileSync(temporaryPath, buffer, { flag: 'wx' });
      fs.renameSync(temporaryPath, filePath);
      temporaryPath = null;
      return res.json({
        success: true,
        url: `/uploads/${safeName}`,
        filename: safeName,
        sizeBytes: byteCount,
        mimeType,
      });
    }

    if (contentType !== 'application/octet-stream') {
      return res.status(415).json({ success: false, error: 'Upload must use application/octet-stream.' });
    }
    const encodedFilename = req.get('x-upload-filename');
    if (encodedFilename) filename = decodeURIComponent(encodedFilename);
    const encodedMimeType = req.get('x-upload-mime-type');
    if (encodedMimeType) mimeType = decodeURIComponent(encodedMimeType);
    if (filename.length > 255 || filename.includes('\0')) {
      return res.status(400).json({ success: false, error: 'Invalid uploaded filename.' });
    }
    if (!/^[\w.+-]+\/[\w.+-]+$/.test(mimeType)) mimeType = 'application/octet-stream';
    const contentLength = Number(req.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_UPLOAD_BYTES) {
      req.resume();
      return res.status(413).json({
        success: false,
        error: `File exceeds the ${Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024))} MB upload limit.`,
      });
    }
    const safeName = `${fileId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180) || 'upload'}`;
    const filePath = path.resolve(UPLOADS_DIR, safeName);
    temporaryPath = `${filePath}.tmp`;
    const sizeLimiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        byteCount += chunk.length;
        if (byteCount > MAX_MEDIA_UPLOAD_BYTES) {
          const error = new Error('UPLOAD_FILE_TOO_LARGE') as NodeJS.ErrnoException;
          error.code = 'LIMIT_FILE_SIZE';
          callback(error);
          return;
        }
        callback(null, chunk);
      },
    });
    await pipeline(req, sizeLimiter, createWriteStream(temporaryPath, { flags: 'wx' }));

    if (byteCount === 0) {
      fs.unlinkSync(temporaryPath);
      temporaryPath = null;
      return res.status(400).json({ success: false, error: 'The uploaded file is empty.' });
    }
    fs.renameSync(temporaryPath, filePath);
    temporaryPath = null;
    res.json({
      success: true,
      url: `/uploads/${safeName}`,
      filename: safeName,
      sizeBytes: byteCount,
      mimeType,
    });
  } catch (err: unknown) {
    if (temporaryPath && fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `File exceeds the ${Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024))} MB upload limit.`,
      });
    }
    console.error('Upload error:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'File upload failed.',
    });
  }
});

// 8. Audio Stream Proxy (bypasses CORS restrictions)
app.get('/api/audio-proxy', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url query parameter' });
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Remote returned ${response.status}` });
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const arrayBuffer = await response.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Audio proxy error:', err);
    res.status(500).json({ error: err.message || 'Proxy request failed' });
  }
});

// ---------------------------------------------------------------------------
// SEO Engine: Dynamic Robots.txt and Sitemap.xml
// ---------------------------------------------------------------------------
app.get('/robots.txt', (req: Request, res: Response) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`);
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : req.protocol || 'https';
  const host = req.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  const today = new Date().toISOString().split('T')[0];

  const sections = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '#releases', priority: '0.9', changefreq: 'weekly' },
    { path: '#mixes', priority: '0.8', changefreq: 'weekly' },
    { path: '#events', priority: '0.8', changefreq: 'daily' },
    { path: '#heritage', priority: '0.7', changefreq: 'monthly' },
    { path: '#documentary', priority: '0.7', changefreq: 'monthly' },
    { path: '#gallery', priority: '0.6', changefreq: 'weekly' },
    { path: '#epk', priority: '0.6', changefreq: 'monthly' },
    { path: '#booking', priority: '0.8', changefreq: 'monthly' },
  ];

  const urlsXml = sections
    .map(
      (sec) => `  <url>
    <loc>${baseUrl}/${sec.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${sec.changefreq}</changefreq>
    <priority>${sec.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(sitemapXml);
});

// ---------------------------------------------------------------------------
// Server Initialization with Vite Middleware (Dev) or Static (Prod)
// ---------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] DJ Ital Production App running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
