import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Check,
  FolderArchive,
  Image as ImageIcon,
  FileText,
  Upload,
  Sparkles,
  Filter,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { MediaLibraryItem, getMediaLibraryItems, createMediaLibraryItem } from '../../db/sqlite';
import { normalizeImageUrl, optimizeImageFile } from '../../utils/imageOptimization';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaLibraryItem) => void;
  title?: string;
  allowedType?: 'image' | 'document' | 'audio' | 'video' | 'all';
  selectedUrl?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Image from Media Library',
  allowedType = 'image',
  selectedUrl,
}) => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');

  // Quick upload within modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const allItems = await getMediaLibraryItems();
      setItems(allItems);
    } catch (err) {
      console.error('Failed to load media items for picker:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Type filtering
      if (allowedType !== 'all') {
        if (allowedType === 'image' && item.file_type !== 'image') return false;
        if (allowedType === 'document' && item.file_type !== 'document') return false;
        if (allowedType === 'audio' && item.file_type !== 'audio') return false;
        if (allowedType === 'video' && item.file_type !== 'video') return false;
      }

      // Category filtering
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Search query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesName = (item.file_name || '').toLowerCase().includes(q);
        const matchesSource = (item.source || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesName && !matchesSource && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [items, allowedType, selectedCategory, searchQuery]);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (allowedType === 'all' || i.file_type === allowedType) {
        if (i.category) set.add(i.category);
      }
    });
    return Array.from(set).sort();
  }, [items, allowedType]);

  // Handle direct file upload from inside picker modal
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const isImage = file.type.startsWith('image/');
      let fileUrl = '';
      if (isImage) {
        fileUrl = await optimizeImageFile(file, 1600, 0.9);
      } else {
        fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      }

      const sizeKb = Math.round(file.size / 1024);
      const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
      const titleClean = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      const newId = await createMediaLibraryItem({
        title: titleClean,
        file_name: file.name,
        file_type: isImage ? 'image' : 'document',
        mime_type: file.type || 'image/jpeg',
        url: fileUrl,
        source: 'Quick Picker Upload',
        size_text: sizeText,
        category: isImage ? 'Uploaded Images' : 'Documents',
        description: `Direct upload into picker modal on ${new Date().toLocaleDateString()}`,
      });

      // Automatically select the freshly uploaded asset
      onSelect(fileUrl, {
        id: newId,
        title: titleClean,
        file_name: file.name,
        file_type: isImage ? 'image' : 'document',
        mime_type: file.type || 'image/jpeg',
        url: fileUrl,
        source: 'Quick Picker Upload',
        size_text: sizeText,
        category: isImage ? 'Uploaded Images' : 'Documents',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to process uploaded file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in-0 duration-150">
      <div className="relative w-full max-w-4xl bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-500 shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-display font-black text-neutral-950 dark:text-white truncate">
                {title}
              </h3>
              <p className="text-[11px] font-mono text-neutral-500 truncate">
                {filteredItems.length} available asset{filteredItems.length === 1 ? '' : 's'} in library
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tab: Browse vs Quick Upload */}
            <div className="flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                Browse Library
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close picker modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Browse Media Library */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search and Category Bar */}
            <div className="p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              {/* Search input */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-400 text-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  All ({items.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-neutral-950 shadow-sm'
                        : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset Grid */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {isLoading ? (
                <div className="py-20 text-center text-xs font-mono text-neutral-500">
                  Loading media library...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <ImageIcon className="w-10 h-10 text-neutral-400 mx-auto opacity-60" />
                  <div className="text-sm font-bold text-neutral-900 dark:text-white">
                    No matching assets found
                  </div>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Try adjusting your search query or upload a new file using the "Upload New" tab.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs font-mono cursor-pointer"
                  >
                    Upload File Now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                  {filteredItems.map((item) => {
                    const isImage = item.file_type === 'image';
                    const isSelected = selectedUrl && (item.url === selectedUrl || normalizeImageUrl(item.url) === normalizeImageUrl(selectedUrl));

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelect(item.url, item);
                          onClose();
                        }}
                        className={`group relative rounded-2xl border text-left p-2 flex flex-col justify-between transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400/10 ring-2 ring-amber-400 shadow-md'
                            : 'border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-950 hover:border-amber-400/60 dark:hover:border-amber-400/60 hover:shadow-sm'
                        }`}
                      >
                        {/* Thumbnail Viewport */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-neutral-950 flex items-center justify-center border border-neutral-200 dark:border-white/10">
                          {isImage ? (
                            <img
                              src={normalizeImageUrl(item.url)}
                              alt={item.title}
                              className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center p-3 text-center space-y-1">
                              <FileText className="w-8 h-8 text-cyan-400" />
                              <span className="text-[9px] font-mono uppercase text-cyan-300 font-bold">
                                {item.file_type}
                              </span>
                            </div>
                          )}

                          {/* Selected Badge */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}

                          {/* Source Tag */}
                          <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[8px] font-mono text-amber-300 border border-white/10 max-w-[90%] truncate">
                            {item.source}
                          </span>
                        </div>

                        {/* Title and metadata */}
                        <div className="pt-2 px-1 space-y-0.5">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                            <span className="truncate">{item.category || item.file_type}</span>
                            <span className="shrink-0">{item.size_text || ''}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Quick Upload New */}
        {activeTab === 'upload' && (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept={
                allowedType === 'image'
                  ? 'image/*'
                  : allowedType === 'document'
                  ? 'application/pdf,text/plain'
                  : 'image/*,application/pdf,audio/*'
              }
              onChange={handleQuickUpload}
              className="hidden"
              id="quick-picker-file-input"
            />

            <label
              htmlFor="quick-picker-file-input"
              className="w-full max-w-lg flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-300 dark:border-white/20 hover:border-amber-400 dark:hover:border-amber-400 rounded-3xl cursor-pointer bg-neutral-50 dark:bg-neutral-950/60 hover:bg-amber-400/5 transition-all text-center group"
            >
              <Upload
                className={`w-12 h-12 text-neutral-400 group-hover:text-amber-400 transition-colors mb-3 ${
                  isUploading ? 'animate-bounce' : ''
                }`}
              />
              <span className="text-base font-bold text-neutral-900 dark:text-white">
                {isUploading ? 'Encoding & uploading to library...' : 'Select File from Device'}
              </span>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-xs">
                Upload will automatically save into the persistent Media Library and immediately select it.
              </p>
            </label>

            {uploadError && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/80 flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500 text-[11px] hidden sm:inline">
            Click any asset card to immediately select it.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
