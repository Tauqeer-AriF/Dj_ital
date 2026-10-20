export interface UploadResult {
  url: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
}

export async function uploadMediaFileToServer(
  file: File,
  _onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
    const err = await response.json().catch(() => ({ error: `Upload failed (HTTP ${response.status})` }));
    throw new Error(err.error || 'Server error during upload');
  }

  const data = await response.json();
  return {
    url: data.url,
    filename: data.filename || file.name,
    sizeBytes: data.sizeBytes || file.size,
    mimeType: data.mimeType || file.type,
  };
}
