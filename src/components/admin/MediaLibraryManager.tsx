import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FolderArchive,
  FileText,
  Image as ImageIcon,
  Music,
  Film,
  Upload,
  Download,
  Copy,
  Check,
  Trash2,
  Edit3,
  Eye,
  Search,
  Filter,
  RotateCcw,
  Plus,
  Play,
  X,
  Layers,
  AlertCircle,
  File,
  ExternalLink,
  Sparkles,
  Grid,
  List,
  Disc3,
  Landmark,
  Calendar,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import {
  MediaLibraryItem,
  getMediaLibraryItems,
  createMediaLibraryItem,
  createMediaLibraryItems,
  updateMediaLibraryItem,
  deleteMediaLibraryItem,
  updateMediaLibraryItemsCategory,
  deleteMediaLibraryItems,
  SiteMediaData,
  getSiteMedia,
  updateSiteMedia,
  resetSiteMedia,
  resetAllSiteMedia,
  subscribeDb,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import { ComponentLoadingOverlay } from './ComponentLoadingOverlay';
import { ImageInput } from './ImageInput';
import { normalizeImageUrl, optimizeImageFile } from '../../utils/imageOptimization';
import { MAX_MEDIA_UPLOAD_BYTES, uploadMediaFileToServer } from '../../utils/mediaUpload';
import { extractYouTubeEmbedUrl } from '../DocumentarySection';
import { copyTextToClipboard } from '../../utils/clipboard';

interface MediaLibraryManagerProps {
  onRefresh: () => void;
}

export const MediaLibraryManager: React.FC<MediaLibraryManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { isSaving, savingMessage, withSaving } = useSaving();
  // Main view mode: 'library' or 'sections'
  const [activeView, setActiveView] = useState<'library' | 'sections'>('library');

  // Media Library state
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  // Direct Upload Form state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('General');
  const [customUrl, setCustomUrl] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [bulkCategory, setBulkCategory] = useState('General');

  // Modals state
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [editingItem, setEditingItem] = useState<MediaLibraryItem | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isBulkActionRunning, setIsBulkActionRunning] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Site Media Slots state
  const [siteMediaList, setSiteMediaList] = useState<SiteMediaData[]>([]);
  const [siteMediaFilter, setSiteMediaFilter] = useState('All');
  const [savedSlotKey, setSavedSlotKey] = useState<string | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);

  // Load items
  const loadLibrary = async () => {
    try {
      const media = await getMediaLibraryItems();
      setItems(media);
      const currentIds = new Set(media.map((item) => item.id));
      setSelectedItemIds((selected) => new Set(Array.from(selected).filter((id) => currentIds.has(id))));
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSiteMedia = async () => {
    try {
      const slots = await getSiteMedia();
      setSiteMediaList(slots);
    } catch (err) {
      console.error('Failed to load site media slots:', err);
    }
  };

  useEffect(() => {
    loadLibrary();
    loadSiteMedia();
    const unsubscribe = subscribeDb(() => {
      loadLibrary();
      loadSiteMedia();
    });
    return () => unsubscribe();
  }, []);

  // Copy URL to clipboard
  const handleCopyUrl = async (item: MediaLibraryItem) => {
    try {
      await copyTextToClipboard(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((prev) => (prev === item.id ? null : prev)), 2000);
      showSuccess('URL Copied', 'Media URL copied to the clipboard.');
    } catch (err: any) {
      showError('Copy Failed', err?.message || 'Could not copy the media URL.');
    }
  };

  // Direct File Upload handler (handles Images, PDFs, Docs, Audio)
  const handleFileUpload = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (selectedFiles.length === 0) return;
    const oversized = selectedFiles.filter((file) => file.size > MAX_MEDIA_UPLOAD_BYTES);
    const empty = selectedFiles.filter((file) => file.size === 0);
    if (oversized.length || empty.length) {
      const messages = [
        oversized.length ? `${oversized.length} file(s) exceed the ${Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024))} MB limit` : '',
        empty.length ? `${empty.length} file(s) are empty` : '',
      ].filter(Boolean);
      showError(
        'Some Files Cannot Be Uploaded',
        `${messages.join('; ')}.${selectedFiles.length > oversized.length + empty.length ? ' Other selected files will still upload.' : ''}`
      );
    }
    const filesToUpload = selectedFiles.filter(
      (file) => file.size > 0 && file.size <= MAX_MEDIA_UPLOAD_BYTES
    );
    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setUploadSuccess(null);
    setBatchProgress({ current: 0, total: filesToUpload.length });
    const uploadedItems: Partial<MediaLibraryItem>[] = [];
    const failures: string[] = [];

    for (const [index, file] of filesToUpload.entries()) {
      setBatchProgress({ current: index + 1, total: filesToUpload.length });
      try {
        const uploaded = await uploadMediaFileToServer(file, customCategory, setUploadProgress, {
          registerInLibrary: false,
        });
        const title = (filesToUpload.length === 1 ? customTitle.trim() : '') ||
          file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const category = customCategory || (
          uploaded.fileType === 'document' ? 'Documents' :
          uploaded.fileType === 'image' ? 'Images' :
          uploaded.fileType === 'audio' ? 'Audio' :
          uploaded.fileType === 'video' ? 'Videos' : 'Uploads'
        );
        uploadedItems.push({
          title,
          file_name: uploaded.fileName,
          file_type: uploaded.fileType,
          mime_type: uploaded.mimeType,
          url: uploaded.url,
          source: 'Server Disk Upload',
          size_text: uploaded.sizeText,
          category,
          description: (filesToUpload.length === 1 ? customDescription.trim() : '') ||
            `Saved to server disk on ${new Date().toLocaleDateString()}`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        failures.push(`${file.name}: ${message}`);
      }
    }

    try {
      let uploadedCount = 0;
      if (uploadedItems.length > 0) {
        try {
          await withSaving(
            async () => {
              await createMediaLibraryItems(uploadedItems);
            },
            `Registering ${uploadedItems.length} uploaded file(s) in the media library...`
          );
          uploadedCount = uploadedItems.length;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Could not save uploaded files to the media library.';
          failures.push(`${uploadedItems.length} uploaded file(s) could not be registered: ${message}`);
        }
      }
      if (uploadedCount > 0) {
        const message = `Uploaded ${uploadedCount} of ${filesToUpload.length} file(s) to server storage.`;
        setUploadSuccess(message);
        showSuccess('Media Upload Complete', message);
        setCustomTitle('');
        setCustomDescription('');
        await loadLibrary();
        onRefresh();
      }
      if (failures.length > 0) {
        const details = failures.slice(0, 3).join('\n');
        const message = `${failures.length} file(s) failed. ${details}`;
        setUploadError(message);
        showError('Some Uploads Failed', message);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setBatchProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleItemSelection = (id: number) => {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkCategoryUpdate = async () => {
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) return;
    setIsBulkActionRunning(true);
    try {
      await withSaving(async () => {
        await updateMediaLibraryItemsCategory(ids, bulkCategory);
        setSelectedItemIds(new Set());
        await loadLibrary();
        onRefresh();
      }, `Updating category for ${ids.length} media item(s)...`);
      showSuccess('Bulk Category Updated', `Updated ${ids.length} media item(s) to "${bulkCategory}".`);
    } catch (err) {
      showError('Bulk Update Failed', err instanceof Error ? err.message : 'Could not update media categories.');
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedItemIds);
    if (ids.length === 0) return;
    setIsBulkActionRunning(true);
    try {
      const cleanup = await withSaving(async () => {
        const result = await deleteMediaLibraryItems(ids);
        setSelectedItemIds(new Set());
        setIsBulkDeleteConfirmOpen(false);
        await loadLibrary();
        onRefresh();
        return result;
      }, `Deleting ${ids.length} media item(s)...`);
      showSuccess(
        'Media Items Deleted',
        `Removed ${ids.length} item(s) from the library and ${cleanup.deleted} uploaded file(s) from disk.` +
          (cleanup.retainedReferenced ? ` Kept ${cleanup.retainedReferenced} file(s) still referenced by site content.` : '')
      );
      if (cleanup.error) showError('Upload Cleanup Incomplete', cleanup.error);
    } catch (err) {
      showError('Bulk Delete Failed', err instanceof Error ? err.message : 'Could not delete selected media items.');
      await loadLibrary();
    } finally {
      setIsBulkActionRunning(false);
    }
  };

  const handleBulkCopyUrls = async () => {
    const selected = items.filter((item) => selectedItemIds.has(item.id));
    try {
      await copyTextToClipboard(selected.map((item) => item.url).join('\n'));
      showSuccess('Media Links Copied', `Copied ${selected.length} media link(s) to the clipboard.`);
    } catch (err) {
      showError('Copy Failed', err instanceof Error ? err.message : 'Could not copy selected media links.');
    }
  };

  // Add via URL / Link
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const url = customUrl.trim();
      const fileName = url.split('/').pop()?.split('?')[0] || 'external-asset';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      let fileType: 'image' | 'document' | 'audio' | 'video' | 'other' = 'other';
      let mimeType = 'application/octet-stream';

      if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(fileName)) {
        fileType = 'image';
        mimeType = extension === 'svg' ? 'image/svg+xml' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;
      } else if (/\.(mp3|wav|ogg|m4a|aac|flac|opus)$/i.test(fileName) || /soundcloud|mixcloud/i.test(url)) {
        fileType = 'audio';
        mimeType = 'audio/mpeg';
      } else if (/\.(mp4|mov|webm|m4v|ogv|avi|mkv)$/i.test(fileName) || /youtube|youtu\.be|vimeo/i.test(url)) {
        fileType = 'video';
        mimeType = 'video/mp4';
      } else if (/\.(csv|doc|docm|docx|dot|dotx|epub|log|md|odf|odp|ods|odt|pages|pdf|ppt|pptm|pptx|rtf|tex|tsv|txt|xls|xlsb|xlsm|xlsx|xlt|xml|yaml|yml)$/i.test(fileName)) {
        fileType = 'document';
        mimeType = extension === 'pdf' ? 'application/pdf' : 'application/octet-stream';
      }

      const title = customTitle.trim() || fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

      await createMediaLibraryItem({
        title,
        file_name: fileName,
        file_type: fileType,
        mime_type: mimeType,
        url,
        source: 'External Link',
        size_text: 'Remote Asset',
        category: customCategory || 'General',
        description: customDescription.trim() || 'Linked via Media Tab',
      });

      setUploadSuccess(`Added asset "${title}"!`);
      showSuccess('Media Asset Linked', `"${title}" was added to your Media Library.`);
      setCustomTitle('');
      setCustomUrl('');
      setCustomDescription('');
      await loadLibrary();
      onRefresh();
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to add media link');
      showError('Failed to Add Media Link', err?.message || 'Could not save asset.');
    } finally {
      setIsUploading(false);
    }
  };

  // Edit item
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await withSaving(async () => {
        await updateMediaLibraryItem(editingItem.id, {
          title: editingItem.title,
          category: editingItem.category,
          description: editingItem.description,
        });

        showSuccess('Media Item Updated', `"${editingItem.title}" saved.`);
        setEditingItem(null);
        await loadLibrary();
        onRefresh();
      }, 'Saving media metadata to database...');
    } catch (err: any) {
      console.error('Failed to update media item:', err);
      showError('Failed to Save Media Item', err?.message || 'A database error occurred.');
    }
  };

  // Delete item
  const handleConfirmDelete = async () => {
    if (deleteCandidateId === null) return;
    const targetId = deleteCandidateId;
    try {
      setDeleteCandidateId(null);
      const cleanup = await withSaving(async () => {
        // Optimistically remove from state for immediate UI feedback
        setItems((prev) => prev.filter((i) => i.id !== targetId));
        const result = await deleteMediaLibraryItem(targetId);
        await loadLibrary();
        onRefresh();
        return result;
      }, 'Deleting media asset from database...');
      showSuccess(
        'Media Item Deleted',
        `Asset removed from the library${cleanup.deleted ? ' and uploaded file removed from disk' : ''}.` +
          (cleanup.retainedReferenced ? ' The file was kept because site content still references it.' : '')
      );
      if (cleanup.error) showError('Upload Cleanup Incomplete', cleanup.error);
    } catch (err: any) {
      console.error('Failed to delete media item:', err);
      showError('Failed to Delete Media', err?.message || 'A database error occurred.');
      await loadLibrary();
    }
  };

  // Site Media Slots handlers
  const handleSlotChange = async (key: string, newUrl: string) => {
    try {
      await withSaving(async () => {
        await updateSiteMedia(key, newUrl);
        setSavedSlotKey(key);
        setTimeout(() => setSavedSlotKey(null), 2500);
        showSuccess('Site Media Slot Updated', `Saved new media for "${key}".`);
        await loadSiteMedia();
        await loadLibrary();
        onRefresh();
      }, 'Saving site media slot to database...');
    } catch (err: any) {
      console.error('Failed to update slot:', err);
      showError('Failed to Update Slot', err?.message || 'A database error occurred.');
    }
  };

  const handleResetSlot = async (key: string) => {
    try {
      await withSaving(async () => {
        await resetSiteMedia(key);
        setSavedSlotKey(key);
        setTimeout(() => setSavedSlotKey(null), 2500);
        showSuccess('Site Media Slot Reset', `Slot "${key}" was reset to default.`);
        await loadSiteMedia();
        await loadLibrary();
        onRefresh();
      }, 'Resetting media slot in database...');
    } catch (err: any) {
      console.error('Failed to reset slot:', err);
      showError('Failed to Reset Slot', err?.message || 'A database error occurred.');
    }
  };

  const handleResetAllSlots = async () => {
    try {
      await withSaving(async () => {
        await resetAllSiteMedia();
        setShowResetAllModal(false);
        showSuccess('All Media Slots Reset', 'All website slots restored to defaults.');
        await loadSiteMedia();
        await loadLibrary();
        onRefresh();
      }, 'Resetting all media slots in database...');
    } catch (err: any) {
      console.error('Failed to reset all slots:', err);
      showError('Failed to Reset Slots', err?.message || 'A database error occurred.');
    }
  };

  // Filter & Search computation
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Type filter
        if (selectedType !== 'all' && item.file_type !== selectedType) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = item.title.toLowerCase().includes(q);
          const matchesFile = (item.file_name || '').toLowerCase().includes(q);
          const matchesCategory = (item.category || '').toLowerCase().includes(q);
          const matchesSource = (item.source || '').toLowerCase().includes(q);
          if (!matchesTitle && !matchesFile && !matchesCategory && !matchesSource) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.id - a.id;
        if (sortBy === 'oldest') return a.id - b.id;
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [items, selectedType, selectedCategory, searchQuery, sortBy]);

  const visibleItemIds = filteredItems.map((item) => item.id);
  const allVisibleSelected = visibleItemIds.length > 0 && visibleItemIds.every((id) => selectedItemIds.has(id));
  const toggleVisibleSelection = () => {
    setSelectedItemIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleItemIds.forEach((id) => next.delete(id));
      else visibleItemIds.forEach((id) => next.add(id));
      return next;
    });
  };

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const images = items.filter((i) => i.file_type === 'image').length;
    const documents = items.filter((i) => i.file_type === 'document').length;
    const audio = items.filter((i) => i.file_type === 'audio').length;
    const video = items.filter((i) => i.file_type === 'video').length;
    const other = items.filter((i) => i.file_type === 'other').length;
    return { total, images, documents, audio, video, other };
  }, [items]);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Helper icons for file types
  const getFileTypeIcon = (type: string, mime?: string) => {
    if (type === 'image') return <ImageIcon className="w-4 h-4 text-amber-500" />;
    if (type === 'document' || mime === 'application/pdf') return <FileText className="w-4 h-4 text-cyan-400" />;
    if (type === 'audio') return <Music className="w-4 h-4 text-emerald-400" />;
    if (type === 'video') return <Film className="w-4 h-4 text-rose-400" />;
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  const getSlotSectionIcon = (section: string) => {
    switch (section) {
      case 'Hero Section':
        return <Disc3 className="w-4 h-4 text-amber-500" />;
      case 'Heritage & V&A Museum':
        return <Landmark className="w-4 h-4 text-cyan-400" />;
      case 'Vital Fest & Events':
        return <Calendar className="w-4 h-4 text-emerald-400" />;
      case 'Documentary Series':
        return <Film className="w-4 h-4 text-rose-400" />;
      default:
        return <Radio className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl pb-12 relative">
      <ComponentLoadingOverlay
        isSaving={isSaving || isUploading}
        message={savingMessage || 'Saving media changes to database...'}
      />
      {/* Top Header Card */}
      <div className="p-6 sm:p-8 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">
              <FolderArchive className="w-4 h-4" />
              <span>Universal Media & Document Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
              Media & Documents Library
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Every image, logo, flyer, and press document uploaded anywhere in the application automatically registers here.
              Upload, inspect, download, copy links, or map media to website sections.
            </p>
          </div>

          {/* Sub-view switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveView('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                activeView === 'library'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <FolderArchive className="w-4 h-4" />
              <span>All Media & Docs ({stats.total})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('sections')}
              className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold font-mono transition-all cursor-pointer ${
                activeView === 'sections'
                  ? 'bg-amber-400 text-neutral-950 shadow-md'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Site Image Slots ({siteMediaList.length})</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-neutral-200 dark:border-white/10 text-xs font-mono">
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/10 space-y-0.5">
            <div className="text-[10px] uppercase text-neutral-500 font-bold">Total Assets</div>
            <div className="text-xl font-display font-black text-neutral-950 dark:text-white">{stats.total}</div>
          </div>
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/10 space-y-0.5">
            <div className="text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">Images & Logos</div>
            <div className="text-xl font-display font-black text-amber-500">{stats.images}</div>
          </div>
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/10 space-y-0.5">
            <div className="text-[10px] uppercase text-cyan-600 dark:text-cyan-400 font-bold">Documents & PDFs</div>
            <div className="text-xl font-display font-black text-cyan-400">{stats.documents}</div>
          </div>
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/10 space-y-0.5">
            <div className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">Audio & Video</div>
            <div className="text-xl font-display font-black text-emerald-400">{stats.audio + stats.video}</div>
          </div>
          <div className="p-3 rounded bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/10 space-y-0.5">
            <div className="text-[10px] uppercase text-neutral-500 font-bold">Other Files</div>
            <div className="text-xl font-display font-black text-neutral-500">{stats.other}</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: UNIFIED MEDIA & DOCUMENTS LIBRARY                                 */}
      {/* ========================================================================= */}
      {activeView === 'library' && (
        <div className="space-y-8">
          {/* Direct Upload & Document Dropzone Card */}
          <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                <Upload className="w-4 h-4" />
                <span>Upload New Media or Document</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    uploadMode === 'file'
                      ? 'bg-amber-400 text-neutral-950'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                    uploadMode === 'url'
                      ? 'bg-amber-400 text-neutral-950'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  Link URL
                </button>
              </div>
            </div>

            {uploadSuccess && (
              <div className="flex items-center justify-between p-3.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{uploadSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadSuccess(null)}
                  className="text-emerald-700 dark:text-emerald-300 hover:opacity-75 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center justify-between p-3.5 rounded bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{uploadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="text-red-700 dark:text-red-300 hover:opacity-75 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Inputs & Dropzone */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Title / Asset Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. DJ Ital Official Press Release 2026"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-700 dark:text-neutral-300">
                    Category Tag
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 text-xs"
                  >
                    <option value="General">General</option>
                    <option value="Documents">Documents & Press Kits</option>
                    <option value="Branding">Branding & Logos</option>
                    <option value="Event Flyers">Event Flyers</option>
                    <option value="Gallery Archives">Gallery Archives</option>
                    <option value="Press Photos">Press Photos</option>
                    <option value="Video Clips">Video Clips & Documentaries</option>
                    <option value="Audio Broadcasts">Audio Broadcasts</option>
                  </select>
                </div>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) => {
                      if (e.target.files?.length) void handleFileUpload(e.target.files);
                    }}
                    className="hidden"
                    id="media-center-file-input"
                  />
                  <label
                    htmlFor="media-center-file-input"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsFileDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsFileDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsFileDragging(false);
                      if (e.dataTransfer.files.length) void handleFileUpload(e.dataTransfer.files);
                    }}
                    className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded cursor-pointer bg-neutral-50/50 dark:bg-neutral-950/40 transition-all text-center group ${
                      isFileDragging
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-neutral-300 dark:border-white/20 hover:border-amber-400 dark:hover:border-amber-400 hover:bg-amber-400/5'
                    }`}
                  >
                    <Upload
                      className={`w-9 h-9 text-neutral-400 group-hover:text-amber-400 transition-colors mb-2.5 ${
                        isUploading ? 'animate-bounce' : ''
                      }`}
                    />
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">
                      {isUploading
                        ? `Uploading file ${batchProgress?.current || 1} of ${batchProgress?.total || 1}...`
                        : 'Click to Browse or Drag Multiple Files Here'}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                      Upload any file type up to {Math.round(MAX_MEDIA_UPLOAD_BYTES / (1024 * 1024))} MB, including images, audio, video, PDFs, Office files, spreadsheets, presentations, and archives. Files are streamed directly to persistent server storage.
                    </span>
                    {isUploading && (
                      <div className="mt-3 w-full max-w-md space-y-1.5">
                        <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-[width] duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{uploadProgress}% uploaded</span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <form onSubmit={handleAddUrl} className="flex gap-2">
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="Enter file URL (e.g. /assets/DJ_ITAL_Official_EPK_2026.pdf or https://example.com/mix.mp3)"
                    className="flex-1 px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isUploading || !customUrl.trim()}
                    className="px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Add URL
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Filter, Search & View Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10 shadow-sm text-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, filename, source, or category..."
                className="w-full pl-9 pr-8 py-2 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-400 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filters Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'image', label: `Images (${stats.images})` },
                { id: 'document', label: `Docs (${stats.documents})` },
                { id: 'audio', label: `Audio (${stats.audio})` },
                { id: 'video', label: `Videos (${stats.video})` },
                { id: 'other', label: `Other files (${stats.other})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedType(pill.id)}
                  className={`px-3 py-1.5 rounded font-mono text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedType === pill.id
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* View options */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-[11px] font-mono cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-[11px] font-mono cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
              </select>

              <div className="flex items-center border border-neutral-200 dark:border-white/10 rounded p-0.5 bg-neutral-100 dark:bg-neutral-950">
                <button
                  type="button"
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1 rounded cursor-pointer ${
                    displayMode === 'grid' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-500'
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('list')}
                  className={`p-1 rounded cursor-pointer ${
                    displayMode === 'list' ? 'bg-amber-400 text-neutral-950' : 'text-neutral-500'
                  }`}
                  title="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {filteredItems.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleVisibleSelection}
                  aria-label="Select all visible media items"
                  className="h-4 w-4 accent-amber-400"
                />
                Select visible ({filteredItems.length})
                {selectedItemIds.size > 0 && <span className="text-amber-600 dark:text-amber-400">· {selectedItemIds.size} selected</span>}
              </label>
              {selectedItemIds.size > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    aria-label="Bulk category"
                    placeholder="Category"
                    className="w-36 rounded border border-neutral-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 dark:border-white/15 dark:bg-neutral-950 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleBulkCategoryUpdate}
                    disabled={isBulkActionRunning || isSaving}
                    className="rounded bg-neutral-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white/10 dark:hover:bg-white/20"
                  >
                    Apply Category
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkCopyUrls}
                    disabled={isBulkActionRunning}
                    className="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-white/15 dark:text-neutral-200 dark:hover:bg-white/10"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Links
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteConfirmOpen(true)}
                    disabled={isBulkActionRunning || isSaving}
                    className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds(new Set())}
                    disabled={isBulkActionRunning}
                    className="rounded px-2 py-1.5 text-xs text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Results Summary & Media Grid / List */}
          {isLoading ? (
            <div className="py-20 text-center text-xs font-mono text-neutral-500">
              Loading media repository...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center rounded border border-dashed border-neutral-300 dark:border-white/10 p-8 space-y-3">
              <FolderArchive className="w-10 h-10 text-neutral-400 mx-auto" />
              <div className="text-sm font-bold text-neutral-900 dark:text-white">
                No media or documents match your criteria
              </div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try resetting your search query or uploading a new media asset using the dropzone above.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedCategory('all');
                }}
                className="px-4 py-2 rounded bg-amber-400 text-neutral-950 text-xs font-bold font-mono cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : displayMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const isImage = item.file_type === 'image';
                const isDocument = item.file_type === 'document';
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`group rounded border bg-white dark:bg-neutral-900/60 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                      selectedItemIds.has(item.id)
                        ? 'border-amber-400 ring-2 ring-amber-400/30'
                        : 'border-neutral-200 dark:border-white/10 hover:border-amber-400/60 dark:hover:border-amber-400/60'
                    }`}
                  >
                    {/* Media Preview Box */}
                    <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden flex items-center justify-center border-b border-neutral-200 dark:border-white/10 group/thumb">
                      <label className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-white/30 bg-black/70 text-white shadow backdrop-blur-sm">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          aria-label={`Select ${item.title}`}
                          className="h-4 w-4 accent-amber-400"
                        />
                      </label>
                      {isImage ? (
                        <img
                          src={normalizeImageUrl(item.url)}
                          alt={item.title}
                          className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover/thumb:scale-105"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                          }}
                        />
                      ) : isDocument ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="w-12 h-12 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold">
                            PDF DOCUMENT
                          </span>
                        </div>
                      ) : item.file_type === 'audio' ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="w-12 h-12 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Music className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                            AUDIO TRACK / DUB
                          </span>
                        </div>
                      ) : item.file_type === 'video' ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                          {!(item.url.includes('youtube.com') || item.url.includes('youtu.be') || item.url.includes('vimeo.com')) ? (
                            <video
                              src={item.url}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover opacity-80 group-hover/thumb:opacity-100 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-rose-500/80">
                              <Film className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/80 border border-white/30 flex items-center justify-center text-amber-400 group-hover/thumb:scale-110 transition-transform shadow-lg">
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono font-bold text-rose-400 border border-rose-500/30">
                            {item.url.includes('youtube') || item.url.includes('youtu.be') ? 'YOUTUBE' : 'VIDEO CLIP'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                          <div className="w-12 h-12 rounded bg-neutral-500/15 border border-neutral-500/30 flex items-center justify-center text-neutral-400">
                            <File className="w-6 h-6" />
                          </div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-300 font-bold">
                            MEDIA FILE
                          </span>
                        </div>
                      )}

                      {/* Source badge overlay */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[9px] font-mono font-bold text-amber-300 border border-white/10 max-w-[85%] truncate">
                        {item.source}
                      </span>

                      {/* Quick Hover Action Bar */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-2 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-950 transition-colors cursor-pointer"
                          title="Preview full size"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a
                          href={item.url}
                          download={item.file_name || 'media-asset'}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded bg-white/20 hover:bg-white text-white hover:text-neutral-950 transition-colors cursor-pointer"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>

                    {/* Metadata Card Info */}
                    <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                          <span className="flex items-center gap-1 font-semibold">
                            {getFileTypeIcon(item.file_type, item.mime_type)}
                            <span className="uppercase">{item.category || item.file_type}</span>
                          </span>
                          <span>{item.size_text || ''}</span>
                        </div>
                        <h4
                          className="text-xs font-bold text-neutral-950 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors"
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                        {item.file_name && (
                          <div className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate" title={item.file_name}>
                            {item.file_name}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-200 dark:border-white/10 hover:border-amber-400 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 hover:text-amber-500 transition-all cursor-pointer"
                          title="Copy file URL or data link"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCandidateId(item.id)}
                            className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table / List View */
            <div className="rounded border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-white/10 text-[11px] font-mono font-bold text-neutral-500 uppercase">
                    <tr>
                      <th className="p-3.5">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleVisibleSelection}
                          aria-label="Select all visible media items"
                          className="h-4 w-4 accent-amber-400"
                        />
                      </th>
                      <th className="p-3.5">Asset</th>
                      <th className="p-3.5">Type & Category</th>
                      <th className="p-3.5">Source</th>
                      <th className="p-3.5">Size</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className={`${selectedItemIds.has(item.id) ? 'bg-amber-400/10' : ''} hover:bg-neutral-50/50 dark:hover:bg-white/5 transition-colors`}>
                        <td className="p-3.5">
                          <input
                            type="checkbox"
                            checked={selectedItemIds.has(item.id)}
                            onChange={() => toggleItemSelection(item.id)}
                            aria-label={`Select ${item.title}`}
                            className="h-4 w-4 accent-amber-400"
                          />
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-neutral-950 border border-neutral-800 shrink-0 flex items-center justify-center overflow-hidden">
                              {item.file_type === 'image' ? (
                                <img
                                  src={normalizeImageUrl(item.url)}
                                  alt={item.title}
                                  className="w-full h-full object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                                  }}
                                />
                              ) : (
                                getFileTypeIcon(item.file_type, item.mime_type)
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-neutral-950 dark:text-white truncate max-w-xs">
                                {item.title}
                              </div>
                              <div className="text-[10px] font-mono text-neutral-500 truncate max-w-xs">
                                {item.file_name || item.url}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 font-bold">
                            {item.category || item.file_type}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                          {item.source}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-neutral-500">
                          {item.size_text || '—'}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyUrl(item)}
                              className="px-2 py-1 rounded border border-neutral-200 dark:border-white/10 hover:border-amber-400 text-[10px] font-mono transition-colors cursor-pointer"
                              title="Copy link"
                            >
                              {copiedId === item.id ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewItem(item)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 cursor-pointer"
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={item.url}
                              download={item.file_name || 'asset'}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 cursor-pointer"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCandidateId(item.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: SITE SECTION IMAGE SLOTS (Slot assignment)                        */}
      {/* ========================================================================= */}
      {activeView === 'sections' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {['All', 'Hero Section', 'Heritage & V&A Museum', 'Vital Fest & Events', 'Pirate Radio Archives', 'Dubplates & Studio', 'Documentary Series'].map(
                (sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSiteMediaFilter(sec)}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      siteMediaFilter === sec
                        ? 'bg-amber-400 text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                    }`}
                  >
                    {sec}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowResetAllModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-semibold cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Slots</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {siteMediaList
              .filter((m) => siteMediaFilter === 'All' || m.section === siteMediaFilter)
              .map((item) => {
                const isSaved = savedSlotKey === item.key;
                return (
                  <div
                    key={item.key}
                    className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                          {getSlotSectionIcon(item.section)}
                          <span>{item.section}</span>
                        </div>
                        <h4 className="text-base font-display font-bold text-neutral-950 dark:text-white">
                          {item.label}
                        </h4>
                      </div>

                      {isSaved && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold animate-pulse">
                          <Check className="w-3 h-3" />
                          <span>Saved!</span>
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    <ImageInput
                      value={item.image_url}
                      onChange={(newUrl) => handleSlotChange(item.key, newUrl)}
                      defaultUrl={item.default_url}
                      aspectRatio="landscape"
                    />

                    <div className="pt-2 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs">
                      <span className="font-mono text-[10px] text-neutral-400">
                        Slot Key: <code className="text-amber-500">{item.key}</code>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetSlot(item.key)}
                        className="flex items-center gap-1 text-[11px] font-mono text-neutral-500 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset to default</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PREVIEW / LIGHTBOX MODAL                                         */}
      {/* ========================================================================= */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-0">
          <div className="relative max-w-4xl w-full bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileTypeIcon(previewItem.file_type, previewItem.mime_type)}
                <div>
                  <h3 className="font-display font-bold text-sm sm:text-base text-neutral-950 dark:text-white truncate">
                    {previewItem.title}
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Source: {previewItem.source} · {previewItem.size_text || 'Standard'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-2 rounded text-neutral-500 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-neutral-950">
              {previewItem.file_type === 'image' ? (
                <img
                  src={normalizeImageUrl(previewItem.url)}
                  alt={previewItem.title}
                  className="max-h-[60vh] w-auto object-contain rounded shadow-2xl filter drop-shadow-lg"
                />
              ) : previewItem.file_type === 'video' ? (
                <div className="w-full max-w-3xl aspect-video rounded overflow-hidden bg-black flex items-center justify-center border border-white/10 shadow-2xl relative">
                  {(previewItem.url.includes('youtube.com') || previewItem.url.includes('youtu.be') || previewItem.url.includes('vimeo.com')) ? (
                    <iframe
                      src={extractYouTubeEmbedUrl(previewItem.url) || undefined}
                      title={previewItem.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      key={previewItem.url}
                      src={previewItem.url}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : previewItem.file_type === 'document' ? (
                <div className="p-4 sm:p-6 text-center space-y-4 w-full max-w-2xl">
                  {previewItem.url.toLowerCase().endsWith('.pdf') || previewItem.mime_type === 'application/pdf' ? (
                    <div className="w-full h-80 sm:h-96 rounded border border-neutral-200 dark:border-white/10 overflow-hidden bg-neutral-900">
                      <iframe
                        src={previewItem.url}
                        title={previewItem.title}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
                      <FileText className="w-10 h-10" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-base font-bold text-neutral-950 dark:text-white">{previewItem.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{previewItem.file_name || 'Document File'}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-mono">
                      Stored on server disk ({previewItem.size_text || 'Server file'})
                    </span>
                  </div>
                  <div className="flex items-center justify-center flex-wrap gap-2.5 pt-2">
                    <a
                      href={previewItem.url}
                      download={previewItem.file_name || 'document'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs font-mono cursor-pointer transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Document</span>
                    </a>
                    <a
                      href={previewItem.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white font-bold text-xs font-mono cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open in Tab</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(previewItem)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white font-bold text-xs font-mono cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                    <Music className="w-10 h-10" />
                  </div>
                  <div className="text-white font-bold">{previewItem.title}</div>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500 text-neutral-950 font-bold text-xs font-mono cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Media Stream</span>
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500 truncate max-w-sm">
                URL: <code className="text-amber-500">{previewItem.url.substring(0, 50)}...</code>
              </span>
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 text-neutral-950 font-bold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === previewItem.id ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT METADATA MODAL                                              */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in-0">
          <form
            onSubmit={handleSaveEdit}
            className="relative max-w-lg w-full bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-white/15 p-6 space-y-5 shadow-2xl"
          >
            <ComponentLoadingOverlay isSaving={isSaving} message="Updating media metadata..." />
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                  Edit Asset Information
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-neutral-500 hover:text-neutral-950 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Title</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Category Tag</label>
                <input
                  type="text"
                  value={editingItem.category || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Event Flyers, Documents, Branding"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-700 dark:text-neutral-300">Description</label>
                <textarea
                  rows={3}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Notes about where this asset is used..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/10 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded bg-amber-400 text-neutral-950 font-bold text-xs font-mono cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Delete Media Asset?"
        message="Are you sure you want to remove this asset from the Media Library? This action cannot be undone."
        confirmLabel="Yes, Delete Asset"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleteConfirmOpen}
        title="Delete Selected Media Items?"
        message={`This will remove ${selectedItemIds.size} selected item(s) from the Media Library. This action cannot be undone.`}
        confirmLabel={`Delete ${selectedItemIds.size} Items`}
        isDestructive={true}
        isLoading={isBulkActionRunning}
        onConfirm={handleBulkDelete}
        onCancel={() => !isBulkActionRunning && setIsBulkDeleteConfirmOpen(false)}
      />

      {/* MODAL 4: RESET ALL SLOTS CONFIRMATION */}
      <ConfirmModal
        isOpen={showResetAllModal}
        title="Reset All Section Slots?"
        message="This will reset all website image slots (Hero, V&A Museum, Vital Fest crowd, etc.) back to their original default photos."
        confirmLabel="Reset All Slots"
        isDestructive={true}
        onConfirm={handleResetAllSlots}
        onCancel={() => setShowResetAllModal(false)}
      />
    </div>
  );
};
