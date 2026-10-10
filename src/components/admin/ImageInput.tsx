import React, { useState, useRef, useEffect } from 'react';
import { Upload, Link2, Grid, RotateCcw, Check, Image as ImageIcon, AlertCircle, FolderArchive, Sparkles } from 'lucide-react';
import { ARCHIVE_IMAGE_PRESETS, FALLBACK_IMAGE, normalizeImageUrl, optimizeImageFile } from '../../utils/imageOptimization';
import { trackMediaUpload, getMediaLibraryItems, MediaLibraryItem } from '../../db/sqlite';
import { MediaPickerModal } from './MediaPickerModal';

interface ImageInputProps {
  value: string;
  onChange: (newUrl: string) => void;
  defaultUrl?: string;
  label?: string;
  helperText?: string;
  aspectRatio?: 'landscape' | 'square' | 'video';
}

export const ImageInput: React.FC<ImageInputProps> = ({
  value,
  onChange,
  defaultUrl,
  label,
  helperText,
  aspectRatio = 'landscape',
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'library' | 'presets' | 'url'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [recentMediaItems, setRecentMediaItems] = useState<MediaLibraryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizedValue = normalizeImageUrl(value);
  const normalizedDefault = defaultUrl ? normalizeImageUrl(defaultUrl) : undefined;

  // Load recent media library images for instant 1-click select
  const loadRecentMedia = async () => {
    try {
      const items = await getMediaLibraryItems();
      setRecentMediaItems(items.filter((i) => i.file_type === 'image').slice(0, 8));
    } catch (err) {
      // fallback silently
    }
  };

  useEffect(() => {
    loadRecentMedia();
  }, [activeMode]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setUploadError(null);
      setImgError(false);
      const optimizedBase64 = await optimizeImageFile(file, 1440, 0.88);
      onChange(optimizedBase64);
      // Automatically register in unified media library
      trackMediaUpload({
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        file_name: file.name,
        file_type: 'image',
        mime_type: file.type || 'image/jpeg',
        url: optimizedBase64,
        source: label || 'Component Upload',
        category: 'Uploaded Images',
      });
      loadRecentMedia();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to process image file');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePresetSelect = (presetUrl: string) => {
    setImgError(false);
    onChange(normalizeImageUrl(presetUrl));
  };

  const handleResetDefault = () => {
    if (normalizedDefault) {
      setImgError(false);
      onChange(normalizedDefault);
    }
  };

  const aspectClasses = {
    landscape: 'aspect-[16/10]',
    square: 'aspect-square',
    video: 'aspect-[16/9]',
  }[aspectRatio];

  const isBase64 = normalizedValue.startsWith('data:image/');
  const isDefault = Boolean(normalizedDefault && normalizedValue === normalizedDefault);

  return (
    <div className="space-y-3">
      {/* Label and Quick Header Actions */}
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {label}
          </label>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {/* Quick 1-Click Media Library Trigger */}
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1.5 text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-semibold"
            title="Browse all application media & documents"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Media Library</span>
          </button>

          {normalizedDefault && !isDefault && (
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-amber-500 dark:text-neutral-400 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Image Control Container */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/80">
        
        {/* Left: Interactive Image Preview */}
        <div className="sm:col-span-5 relative">
          <div className={`relative w-full ${aspectClasses} rounded-xl overflow-hidden bg-neutral-950 border border-neutral-300 dark:border-white/10 shadow-inner flex items-center justify-center group`}>
            {normalizedValue && !imgError ? (
              <img
                src={normalizedValue}
                alt="Selected preview"
                onError={() => {
                  setImgError(true);
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="text-center p-4 text-neutral-500 space-y-1">
                <ImageIcon className="w-8 h-8 mx-auto opacity-40" />
                <span className="text-[10px] font-mono block">Image Preview</span>
              </div>
            )}

            {/* Overlay Status Badge */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono text-white border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{isBase64 ? 'Uploaded File' : isDefault ? 'Default Asset' : 'Media Asset'}</span>
            </div>
          </div>
        </div>

        {/* Right: Mode Switcher & Inputs */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
          
          {/* Tabs: Upload | Media Library | Presets | URL */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-neutral-200/80 dark:bg-neutral-950/80 rounded-xl border border-neutral-300 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('upload')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-mono font-medium transition-all ${
                activeMode === 'upload'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('library');
                setIsPickerOpen(true);
              }}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-mono font-medium transition-all ${
                activeMode === 'library'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
              title="Select from Media Library"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span className="truncate">Library</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('presets')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-mono font-medium transition-all ${
                activeMode === 'presets'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Presets</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('url')}
              className={`flex items-center justify-center gap-1 py-1.5 rounded-lg font-mono font-medium transition-all ${
                activeMode === 'url'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-sm font-bold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">URL</span>
            </button>
          </div>

          {/* Mode 1: Device File Upload */}
          {activeMode === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id={`file-upload-${label ? label.replace(/\s+/g, '-').toLowerCase() : 'input'}`}
              />
              <label
                htmlFor={`file-upload-${label ? label.replace(/\s+/g, '-').toLowerCase() : 'input'}`}
                className="w-full flex flex-col items-center justify-center py-4 px-3 border-2 border-dashed border-neutral-300 dark:border-white/20 hover:border-amber-400 rounded-xl bg-white/60 dark:bg-black/30 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-5 h-5 text-neutral-500 group-hover:text-amber-500 transition-colors" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mt-1">
                  {isProcessing ? 'Optimizing image for Safari & Web...' : 'Choose image from computer / phone'}
                </span>
                <span className="text-[10px] font-mono text-neutral-500">
                  PNG, JPG, WEBP, SVG · Saved to Media Library & SQLite
                </span>
              </label>

              {uploadError && (
                <div className="flex items-center gap-1 text-xs text-rose-500">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Media Library Quick Picker */}
          {activeMode === 'library' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-400/10 hover:bg-amber-400/20 transition-all cursor-pointer group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <FolderArchive className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-neutral-950 dark:text-white group-hover:text-amber-500 transition-colors">
                      Browse Media Library
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 truncate">
                      Search and pick from all application images & assets
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold shrink-0 shadow-sm">
                  Open Picker
                </span>
              </button>

              {/* Quick Recent Assets Bar */}
              {recentMediaItems.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>Recent Library Assets:</span>
                    <button
                      type="button"
                      onClick={() => setIsPickerOpen(true)}
                      className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      View all ({recentMediaItems.length}+)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                    {recentMediaItems.map((item) => {
                      const itemUrl = normalizeImageUrl(item.url);
                      const isItemSel = normalizedValue === itemUrl;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setImgError(false);
                            onChange(itemUrl);
                          }}
                          title={item.title}
                          className={`relative rounded-lg overflow-hidden aspect-[4/3] border transition-all cursor-pointer group bg-neutral-950 ${
                            isItemSel
                              ? 'border-amber-400 ring-2 ring-amber-400'
                              : 'border-neutral-300 dark:border-white/10 hover:border-amber-400/50'
                          }`}
                        >
                          <img
                            src={itemUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isItemSel && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 3: Archive Presets Library */}
          {activeMode === 'presets' && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Select from Curated London Archive:
              </div>
              <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {ARCHIVE_IMAGE_PRESETS.map((preset) => {
                  const pUrl = normalizeImageUrl(preset.url);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(pUrl)}
                      className={`relative rounded-lg overflow-hidden aspect-[4/3] border transition-all cursor-pointer group ${
                        normalizedValue === pUrl
                          ? 'border-amber-400 ring-2 ring-amber-400/50'
                          : 'border-neutral-300 dark:border-white/10 hover:border-amber-400/50'
                      }`}
                      title={preset.name}
                    >
                      <img
                        src={pUrl}
                        alt={preset.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/30 transition-colors flex items-end p-1">
                        <span className="text-[8px] font-mono text-white leading-tight truncate">
                          {preset.name}
                        </span>
                      </div>
                      {normalizedValue === pUrl && (
                        <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 4: Custom Web URL */}
          {activeMode === 'url' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Direct Web URL (HTTPS or local path):
              </label>
              <input
                type="text"
                value={normalizedValue.startsWith('data:') ? '' : normalizedValue}
                onChange={(e) => {
                  setImgError(false);
                  onChange(e.target.value);
                }}
                placeholder="https://images.unsplash.com/... or /images/vital_fest_logo.png"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono text-neutral-900 dark:text-white focus:border-amber-400 focus:outline-none"
              />
              <p className="text-[10px] font-mono text-neutral-500">
                Paste any direct image link or server path.
              </p>
            </div>
          )}

          {helperText && (
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {helperText}
            </p>
          )}

        </div>

      </div>

      {/* Unified Media Picker Modal */}
      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(selectedUrl) => {
          setImgError(false);
          onChange(selectedUrl);
        }}
        selectedUrl={normalizedValue}
        title={label ? `Select from Media Library: ${label}` : 'Select Image from Media Library'}
        allowedType="image"
      />
    </div>
  );
};
