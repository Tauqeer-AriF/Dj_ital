import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import initSqlJs from 'sql.js';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
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

// 7. Media file upload
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { filename, fileData, mimeType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Missing fileData in request' });
    }

    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeName = `${Date.now()}_${(filename || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.resolve(UPLOADS_DIR, safeName);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${safeName}`;

    res.json({
      success: true,
      url: publicUrl,
      filename: safeName,
      sizeBytes: buffer.length,
      mimeType: mimeType || 'application/octet-stream',
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'File upload failed' });
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
