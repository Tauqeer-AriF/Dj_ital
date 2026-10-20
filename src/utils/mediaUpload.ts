import { createMediaLibraryItem } from '../db/sqlite';

export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  sizeText: string;
}

export interface MediaLibraryUploadOptions {
  registerInLibrary?: boolean;
  title?: string;
  category?: string;
  source?: string;
  description?: string;
}

export const MAX_MEDIA_UPLOAD_BYTES = 1024 * 1024 * 1024;
const MAX_LEGACY_UPLOAD_BYTES = 70 * 1024 * 1024;

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
    [
      'csv', 'doc', 'docm', 'docx', 'dot', 'dotx', 'epub', 'log', 'md', 'odf',
      'odp', 'ods', 'odt', 'pages', 'pdf', 'ppt', 'pptm', 'pptx', 'rtf', 'tex',
      'tsv', 'txt', 'xls', 'xlsb', 'xlsm', 'xlsx', 'xlt', 'xml', 'yaml', 'yml',
    ].includes(extension) ||
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

function sendUploadRequest(
  body: File | string,
  headers: Record<string, string>,
  progress?: (percent: number) => void
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', '/api/upload');
    request.responseType = 'json';
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value));
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) progress?.(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        const responseBody = request.response as { error?: unknown } | null;
        reject(new Error(
          typeof responseBody?.error === 'string'
            ? responseBody.error
            : `Upload failed (HTTP ${request.status})`
        ));
        return;
      }
      resolve(request.response);
    };
    request.onerror = () => reject(new Error('Could not connect to the media upload server.'));
    request.onabort = () => reject(new Error('Media upload was cancelled.'));
    request.send(body);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Could not read the selected file for upload.'));
    };
    reader.onerror = () => reject(new Error('Could not read the selected file for upload.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadMediaFileToServer(
  file: File,
  categoryOrOnProgress?: string | ((percent: number) => void),
  onProgress?: (percent: number) => void,
  libraryOptions: MediaLibraryUploadOptions = {}
): Promise<UploadResult> {
  const category = typeof categoryOrOnProgress === 'string' ? categoryOrOnProgress : undefined;
  const progress = typeof categoryOrOnProgress === 'function' ? categoryOrOnProgress : onProgress;
  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    throw new Error('Files must be 1 GB or smaller.');
  }
  if (file.size === 0) {
    throw new Error('The selected file is empty.');
  }
  progress?.(0);
  let body: unknown;
  try {
    body = await sendUploadRequest(file, {
      'Content-Type': 'application/octet-stream',
      'X-Upload-Filename': encodeURIComponent(file.name),
      'X-Upload-Mime-Type': encodeURIComponent(file.type || 'application/octet-stream'),
      ...(category ? { 'X-Upload-Category': encodeURIComponent(category) } : {}),
    }, progress);
  } catch (error) {
    if (!(error instanceof Error) || !/missing fileData in request/i.test(error.message)) throw error;
    if (file.size > MAX_LEGACY_UPLOAD_BYTES) {
      throw new Error(
        'The server is using an outdated upload handler. Refresh the dashboard or redeploy the latest server before uploading files larger than 70 MB.'
      );
    }
    progress?.(0);
    const fileData = await readFileAsDataUrl(file);
    body = await sendUploadRequest(JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileData,
    }), { 'Content-Type': 'application/json' }, progress);
  }
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
  const result: UploadResult = {
    url: body.url,
    filename,
    fileName: filename,
    sizeBytes,
    mimeType,
    fileType: getFileType(file, category),
    sizeText: formatFileSize(sizeBytes),
  };

  if (libraryOptions.registerInLibrary !== false) {
    const defaultCategories: Record<UploadResult['fileType'], string> = {
      image: 'Images',
      video: 'Videos',
      audio: 'Audio',
      document: 'Documents',
      other: 'Uploads',
    };
    await createMediaLibraryItem({
      title: libraryOptions.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      file_name: result.fileName,
      file_type: result.fileType,
      mime_type: result.mimeType,
      url: result.url,
      source: libraryOptions.source || 'Dashboard Upload',
      size_text: result.sizeText,
      category: libraryOptions.category || defaultCategories[result.fileType],
      description: libraryOptions.description || `Uploaded from dashboard on ${new Date().toLocaleDateString()}`,
    });
  }

  return result;
}
