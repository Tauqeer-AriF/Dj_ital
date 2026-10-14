// Utility functions for audio streaming and radio cast handling

/**
 * Checks if a stream URL is an embeddable platform (SoundCloud, Mixcloud, YouTube)
 */
export function isEmbedStream(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('soundcloud.com') ||
    lower.includes('mixcloud.com') ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be')
  );
}

/**
 * Checks if a stream URL is a radio cast stream (Shoutcast, Icecast, radioca.st, etc.)
 */
export function isRadioCastStream(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('radioca.st') ||
    lower.includes('shoutcast') ||
    lower.includes('icecast') ||
    lower.includes('radiojar') ||
    lower.includes('radionomy') ||
    lower.includes('zeno.fm') ||
    lower.includes('caster.fm') ||
    lower.includes('radio.co') ||
    lower.includes('cast.') ||
    lower.includes('stream.') ||
    lower.includes(':8000') ||
    lower.includes(':8080') ||
    lower.includes(':8443') ||
    lower.includes('/;') ||
    lower.endsWith(';') ||
    lower.endsWith('.pls') ||
    lower.endsWith('.m3u') ||
    lower.includes('.pls?') ||
    lower.includes('.m3u?')
  );
}

/**
 * Normalizes and resolves a radio cast / audio stream URL into a browser-playable URL.
 * Automatically mitigates HTTPS mixed content blocks, Shoutcast/Icecast quirks,
 * CORS restrictions, and playlist formats (.pls / .m3u).
 */
export function getPlayableStreamUrl(rawUrl?: string | null, forceProxy = false): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;

  // Already routed through proxy
  if (url.startsWith('/api/audio-proxy')) {
    return url;
  }

  // If it's an embed platform, return original URL (handled via modal iframe)
  if (isEmbedStream(url)) {
    return url;
  }

  // If user pasted URL without protocol, default to https:// (or http:// if ip/port)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.includes(':') && !url.includes('://') ? `http://${url}` : `https://${url}`;
  }

  // For live radio cast streams, playlists, http streams, or when forceProxy is requested:
  // Route through the backend audio proxy for guaranteed playback without CORS or mixed content blocks.
  return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
}

/**
 * Returns a guaranteed proxy URL for any stream to bypass CORS, mixed content, or server blocks.
 */
export function getProxyStreamUrl(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  let url = rawUrl.trim();
  if (!url) return null;
  if (url.startsWith('/api/audio-proxy')) return url;
  if (isEmbedStream(url)) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.includes(':') && !url.includes('://') ? `http://${url}` : `https://${url}`;
  }
  return `/api/audio-proxy?url=${encodeURIComponent(url)}`;
}
