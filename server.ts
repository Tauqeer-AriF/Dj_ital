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

// Persistent data volume detection (e.g. Railway volume mounted at /data or custom DATA_DIR)
const SEED_DIR = path.resolve(__dirname, 'data');
function resolveDataDirectory(): string {
  if (process.env.DATA_DIR && process.env.DATA_DIR.trim()) {
    return path.resolve(process.env.DATA_DIR.trim());
  }
  // Check common Docker / Railway persistent volume mount path
  if (fs.existsSync('/data')) {
    try {
      fs.accessSync('/data', fs.constants.W_OK);
      return '/data';
    } catch {
      // Not writable, fall through
    }
  }
  return SEED_DIR;
}

const DATA_DIR = resolveDataDirectory();
const DB_FILE = path.join(DATA_DIR, 'djital_db.sqlite.b64');
const DB_META_FILE = path.join(DATA_DIR, 'db_meta.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Auto-seed empty persistent volume on first startup if external volume is attached
if (DATA_DIR !== SEED_DIR && !fs.existsSync(DB_FILE)) {
  const seedDbFile = path.join(SEED_DIR, 'djital_db.sqlite.b64');
  const seedMetaFile = path.join(SEED_DIR, 'db_meta.json');
  if (fs.existsSync(seedDbFile)) {
    try {
      fs.copyFileSync(seedDbFile, DB_FILE);
      if (fs.existsSync(seedMetaFile)) {
        fs.copyFileSync(seedMetaFile, DB_META_FILE);
      }
      console.log(`[Database] Seeded empty volume at ${DATA_DIR} with baseline snapshot.`);
    } catch (err) {
      console.warn(`[Database] Could not seed volume directory:`, err);
    }
  }
}

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

// GET current database state from server
app.get('/api/db/state', (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      let meta = { updatedAt: new Date().toISOString() };
      if (fs.existsSync(DB_META_FILE)) {
        try {
          meta = JSON.parse(fs.readFileSync(DB_META_FILE, 'utf-8'));
        } catch {
          // ignore
        }
      }
      return res.json({
        exists: true,
        databaseBase64: data,
        meta,
      });
    }
    return res.json({
      exists: false,
      databaseBase64: null,
      meta: null,
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

    // Save to disk
    fs.writeFileSync(DB_FILE, databaseBase64, 'utf-8');
    
    const meta = {
      updatedAt: timestamp || new Date().toISOString(),
      updatedBy: clientDevice || 'web-client',
      sizeBytes: databaseBase64.length,
      isSeed: false,
    };
    fs.writeFileSync(DB_META_FILE, JSON.stringify(meta, null, 2), 'utf-8');

    return res.json({
      success: true,
      meta,
      message: 'Database saved to server successfully and synchronized for all devices.',
    });
  } catch (error: any) {
    console.error('Error writing server database:', error);
    return res.status(500).json({ error: error.message || 'Failed to save database' });
  }
});

// POST reset server database
app.post('/api/db/reset', (_req, res) => {
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    if (fs.existsSync(DB_META_FILE)) {
      fs.unlinkSync(DB_META_FILE);
    }
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
