import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Folder, X, ExternalLink, Loader2 } from 'lucide-react';
import { uploadMediaFileToServer } from '../../utils/mediaUpload';
import { normalizeImageUrl } from '../../utils/imageOptimization';
import { useToast } from '../../context/ToastContext';

export interface ImageInputProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  helpText?: string;
  helperText?: string;
  aspectRatio?: string;
  onOpenMediaPicker?: () => void;
  showPreview?: boolean;
}

export const ImageInput: React.FC<ImageInputProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://... or /images/...',
  helpText,
  helperText,
  aspectRatio,
  onOpenMediaPicker,
  showPreview = true,
}) => {
  const resolvedHelpText = helperText || helpText;
  const { showSuccess, showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadMediaFileToServer(file);
      onChange(res.url);
      showSuccess('Uploaded Successfully', `${file.name} uploaded.`);
    } catch (err: any) {
      showError('Upload Failed', err?.message || 'Failed to upload media.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 text-xs">
      {label && <label className="block font-mono font-semibold text-neutral-700 dark:text-neutral-300">{label}</label>}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-xs"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Media Picker Button */}
        {onOpenMediaPicker && (
          <button
            type="button"
            onClick={onOpenMediaPicker}
            className="px-2.5 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Browse Media Library"
          >
            <Folder className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Library</span>
          </button>
        )}

        {/* Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-2.5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
          title="Upload Local File"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {resolvedHelpText && <p className="text-[11px] text-neutral-500 leading-tight">{resolvedHelpText}</p>}

      {/* Thumbnail Preview */}
      {showPreview && value && (
        <div className="flex items-center gap-3 p-2 rounded bg-neutral-50 dark:bg-neutral-950/40 border border-neutral-200 dark:border-white/5 mt-1.5">
          <div className="w-12 h-12 rounded overflow-hidden bg-neutral-900 border border-neutral-300 dark:border-white/10 shrink-0 flex items-center justify-center">
            {value.match(/\.(mp4|webm|mov)$/i) ? (
              <span className="text-[9px] font-mono font-bold text-amber-400">VIDEO</span>
            ) : (
              <img
                src={normalizeImageUrl(value)}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/dj_ital_hero_1790112374509.jpg';
                }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Preview Active</div>
            <div className="text-xs truncate font-mono text-neutral-800 dark:text-neutral-200">{value}</div>
          </div>
        </div>
      )}
    </div>
  );
};
