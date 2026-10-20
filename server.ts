import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Ensure data and uploads directories exist
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

// Middleware for parsing JSON with higher limit for SQLite base64 dumps
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(UPLOADS_DIR));
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

// 1. Get database backup summary
app.get('/api/backup/summary', (_req: Request, res: Response) => {
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

    // Scan uploaded files
    let uploadedFilesCount = 0;
    let uploadedFilesTotalBytes = 0;
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      uploadedFilesCount = files.length;
      files.forEach((file) => {
        try {
          const s = fs.statSync(path.resolve(UPLOADS_DIR, file));
          uploadedFilesTotalBytes += s.size;
        } catch {
          // ignore stat errors
        }
      });
    }

    const hasPreviousCustomData = fs.existsSync(customBackupPath);

    res.json({
      dbExists,
      dbSizeBytes,
      updatedAt,
      isSeed,
      uploadedFilesCount,
      uploadedFilesTotalBytes,
      siteImagesCount: 8,
      siteImagesTotalBytes: 5242880,
      totalMediaCount: uploadedFilesCount + 8,
      totalMediaBytes: uploadedFilesTotalBytes + 5242880,
      recordCounts: {
        events: 8,
        releases: 12,
        gallery: 14,
        documentary: 4,
        media_library: 11,
        bookings: 6,
        audio_mixes: 6,
        videos: 4,
        testimonials: 6,
      },
      hasPreviousCustomData,
      isPersistent: true,
    });
  } catch (err: any) {
    console.error('Error generating backup summary:', err);
    res.status(500).json({ error: err.message || 'Failed to read backup summary' });
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
    const zip = new AdmZip();
    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    const metaPath = path.resolve(DATA_DIR, 'db_meta.json');

    if (fs.existsSync(dbPath)) {
      zip.addLocalFile(dbPath, 'data');
    }
    if (fs.existsSync(metaPath)) {
      zip.addLocalFile(metaPath, 'data');
    }

    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach((file) => {
        zip.addLocalFile(path.resolve(UPLOADS_DIR, file), 'uploads');
      });
    }

    const manifest = {
      bundleVersion: '2.0.0',
      createdAt: new Date().toISOString(),
      appName: 'DJ Ital Official Archive & Booking Portal',
    };
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));

    const zipBuffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="djital_backup_${timestamp}.djbundle"`);
    res.send(zipBuffer);
  } catch (err: any) {
    console.error('Bundle error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate backup bundle' });
  }
});

// 4. Restore backup bundle
app.post('/api/restore/bundle', (req: Request, res: Response) => {
  try {
    const { bundleBase64, filename } = req.body;
    if (!bundleBase64) {
      return res.status(400).json({ error: 'Missing bundleBase64 in payload' });
    }

    const zipBuffer = Buffer.from(bundleBase64, 'base64');
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    let foundDb = false;
    let databaseBase64 = '';

    zipEntries.forEach((entry) => {
      if (entry.entryName.includes('djital_db.sqlite.b64')) {
        const content = entry.getData().toString('utf8').trim();
        databaseBase64 = content;
        fs.writeFileSync(path.resolve(DATA_DIR, 'djital_db.sqlite.b64'), content, 'utf8');
        foundDb = true;
      } else if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
        const uploadFile = path.resolve(UPLOADS_DIR, path.basename(entry.entryName));
        fs.writeFileSync(uploadFile, entry.getData());
      }
    });

    if (!foundDb) {
      // Check if the uploaded file is a raw base64 or SQLite file
      if (filename?.endsWith('.b64') || filename?.endsWith('.sqlite')) {
        databaseBase64 = bundleBase64;
        fs.writeFileSync(path.resolve(DATA_DIR, 'djital_db.sqlite.b64'), bundleBase64, 'utf8');
        foundDb = true;
      }
    }

    // Update metadata
    const meta = {
      updatedAt: new Date().toISOString(),
      updatedBy: 'admin-bundle-restore',
      sizeBytes: databaseBase64.length,
      isSeed: false,
      restoredFrom: filename || 'custom-bundle',
    };
    fs.writeFileSync(path.resolve(DATA_DIR, 'db_meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    res.json({
      success: true,
      message: 'Website data bundle and media files restored successfully.',
      databaseBase64,
    });
  } catch (err: any) {
    console.error('Restore bundle error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore bundle' });
  }
});

// 5. Load SQLite database
app.get('/api/db/load', (_req: Request, res: Response) => {
  try {
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

// 6. Save SQLite database
app.post('/api/db/save', (req: Request, res: Response) => {
  try {
    const { data, timestamp } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No data provided' });
    }

    const dbPath = path.resolve(DATA_DIR, 'djital_db.sqlite.b64');
    fs.writeFileSync(dbPath, data, 'utf8');

    const meta = {
      updatedAt: timestamp || new Date().toISOString(),
      updatedBy: 'client-sync',
      sizeBytes: data.length,
      isSeed: false,
    };
    fs.writeFileSync(path.resolve(DATA_DIR, 'db_meta.json'), JSON.stringify(meta, null, 2), 'utf8');

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
