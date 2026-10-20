import React, { useState, useEffect } from 'react';
import { X, Search, Check, Folder, Image as ImageIcon, Film, Radio, FileText } from 'lucide-react';
import { getMediaLibrary, MediaLibraryItem } from '../../db/sqlite';
import { normalizeImageUrl } from '../../utils/imageOptimization';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, item?: MediaLibraryItem) => void;
  filterType?: 'image' | 'video' | 'audio' | 'document' | 'all';
  allowedType?: string;
  title?: string;
  selectedUrl?: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  filterType = 'all',
  allowedType,
  title,
  selectedUrl,
}) => {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(allowedType || filterType);

  useEffect(() => {
    if (isOpen) {
      getMediaLibrary().then((data) => setItems(data || []));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = items.filter((item) => {
    if (selectedType !== 'all' && item.file_type !== selectedType) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      item.url.toLowerCase().includes(q)
    );
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
              {title || 'Select Asset from Media Library'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50 dark:bg-neutral-950/50">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search assets by title, category, or url..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-1">
            {(['all', 'image', 'video', 'audio'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded text-xs font-mono uppercase font-bold cursor-pointer transition-colors ${
                  selectedType === t
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-neutral-500 text-xs font-mono">
              No matching assets found in Media Library.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item.url, item);
                  onClose();
                }}
                className="group relative rounded border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 p-2 hover:border-amber-500 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="aspect-square rounded bg-neutral-950 overflow-hidden flex items-center justify-center relative mb-2">
                  {item.file_type === 'image' ? (
                    <img
                      src={normalizeImageUrl(item.url)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/dj_ital_hero_1790112374509.jpg';
                      }}
                    />
                  ) : item.file_type === 'video' ? (
                    <Film className="w-8 h-8 text-amber-400" />
                  ) : item.file_type === 'audio' ? (
                    <Radio className="w-8 h-8 text-cyan-400" />
                  ) : (
                    <FileText className="w-8 h-8 text-emerald-400" />
                  )}
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-black/70 text-white">
                    {item.file_type}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                    {item.category || 'General'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
