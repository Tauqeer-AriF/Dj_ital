import { optimizeImageFile } from './imageOptimization';

export type SupportedMediaType = 'image' | 'document' | 'audio' | 'video' | 'other';

export interface UploadResult {
  url: string;
  fileName: string;
  fileType: SupportedMediaType;
  mimeType: string;
  sizeText: string;
  sizeBytes: number;
  category: string;
  deduplicated?: boolean;
}

export function detectFileType(fileName: string, mimeType: string = ''): SupportedMediaType {
  const lowerName = fileName.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (
    lowerMime.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg|avif|ico)$/i.test(lowerName)
  ) {
    return 'image';
  }

  if (
    lowerMime.startsWith('video/') ||
    /\.(mp4|mov|webm|m4v|ogv|mkv)$/i.test(lowerName)
  ) {
    return 'video';
  }

  if (
    lowerMime.startsWith('audio/') ||
    /\.(mp3|wav|ogg|aac|flac|m4a|aiff)$/i.test(lowerName)
  ) {
    return 'audio';
  }

  if (
    lowerMime === 'application/pdf' ||
    lowerMime.includes('document') ||
    lowerMime.includes('text') ||
    lowerMime.includes('word') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('spreadsheet') ||
    lowerMime.includes('presentation') ||
    /\.(pdf|doc|docx|txt|rtf|csv|xls|xlsx|ppt|pptx|json|zip)$/i.test(lowerName)
  ) {
    return 'document';
  }

  return 'other';
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const sizeKb = Math.round(bytes / 1024);
  if (sizeKb >= 1024) {
    return `${(sizeKb / 1024).toFixed(1)} MB`;
  }
  return `${sizeKb} KB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a media file or document directly to the server disk storage
 * (/uploads/documents, /uploads/images, /uploads/audio, /uploads/videos).
 * Guarantees files are saved on the server filesystem instead of localStorage.
 */
export async function uploadMediaFileToServer(
  file: File,
  preferredCategory?: string
): Promise<UploadResult> {
  const fileType = detectFileType(file.name, file.type);

  // Target directory category on the server
  let serverCategory = 'documents';
  if (preferredCategory) {
    const lower = preferredCategory.toLowerCase();
    if (lower.includes('image')) serverCategory = 'images';
    else if (lower.includes('video')) serverCategory = 'videos';
    else if (lower.includes('audio')) serverCategory = 'audio';
    else if (lower.includes('doc')) serverCategory = 'documents';
  } else {
    if (fileType === 'image') serverCategory = 'images';
    else if (fileType === 'video') serverCategory = 'videos';
    else if (fileType === 'audio') serverCategory = 'audio';
    else serverCategory = 'documents';
  }

  // Optimize images for web before uploading (preserves original aspect ratio up to 1920px)
  let dataUrl = '';
  if (fileType === 'image' && !file.name.toLowerCase().endsWith('.gif') && !file.name.toLowerCase().endsWith('.svg')) {
    try {
      dataUrl = await optimizeImageFile(file, 1920, 0.9);
    } catch {
      dataUrl = await readFileAsDataUrl(file);
    }
  } else {
    dataUrl = await readFileAsDataUrl(file);
  }

  // Transmit payload to server upload endpoint
  const res = await fetch('/api/upload-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      dataUrl,
      category: serverCategory,
    }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Server failed to save ${file.name} to disk (HTTP ${res.status})`);
  }

  const json = await res.json();
  const bytes = json.sizeBytes || file.size;

  return {
    url: json.url,
    fileName: json.filename || file.name,
    fileType,
    mimeType: file.type || 'application/octet-stream',
    sizeText: formatFileSize(bytes),
    sizeBytes: bytes,
    category: serverCategory,
    deduplicated: Boolean(json.deduplicated),
  };
}
