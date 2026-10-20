export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  sizeText: string;
}

function getFileType(file: File, category?: string): UploadResult['fileType'] {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const normalizedCategory = category?.toLowerCase();
  if (mimeType.startsWith('image/') || normalizedCategory === 'images') return 'image';
  if (mimeType.startsWith('video/') || normalizedCategory === 'videos') return 'video';
  if (mimeType.startsWith('audio/') || normalizedCategory === 'audio') return 'audio';
  if (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    ['pdf', 'doc', 'docx', 'odt', 'rtf', 'txt'].includes(extension) ||
    normalizedCategory === 'documents'
  ) {
    return 'document';
  }
  return 'other';
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = sizeBytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export async function uploadMediaFileToServer(
  file: File,
  categoryOrOnProgress?: string | ((percent: number) => void),
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const category = typeof categoryOrOnProgress === 'string' ? categoryOrOnProgress : undefined;
  const progress = typeof categoryOrOnProgress === 'function' ? categoryOrOnProgress : onProgress;
  progress?.(0);
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected file.'));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  progress?.(50);
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      fileData: base64Data,
      mimeType: file.type || 'application/octet-stream',
    }),
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const errorMessage =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof body.error === 'string'
        ? body.error
        : `Upload failed (HTTP ${response.status})`;
    throw new Error(errorMessage);
  }

  const body: unknown = await response.json();
  if (
    typeof body !== 'object' ||
    body === null ||
    !('url' in body) ||
    typeof body.url !== 'string'
  ) {
    throw new Error('Server returned an invalid upload response.');
  }

  const filename = 'filename' in body && typeof body.filename === 'string' ? body.filename : file.name;
  const sizeBytes = 'sizeBytes' in body && typeof body.sizeBytes === 'number' ? body.sizeBytes : file.size;
  const mimeType = 'mimeType' in body && typeof body.mimeType === 'string' ? body.mimeType : file.type;
  progress?.(100);
  return {
    url: body.url,
    filename,
    fileName: filename,
    sizeBytes,
    mimeType,
    fileType: getFileType(file, category),
    sizeText: formatFileSize(sizeBytes),
  };
}
