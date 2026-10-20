import React, { useState, useRef } from 'react';
import {
  Plus,
  X,
  Upload,
  FolderArchive,
  Film,
  Image as ImageIcon,
  Play,
  Check,
  Trash2,
  Edit2,
  Video,
  Loader2,
} from 'lucide-react';
import {
  GalleryData,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { MediaPickerModal } from './MediaPickerModal';
import { FALLBACK_IMAGE, normalizeImageUrl, optimizeImageFile } from '../../utils/imageOptimization';
import { uploadMediaFileToServer } from '../../utils/mediaUpload';
import { isVideoFile } from '../DocumentarySection';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import { ComponentLoadingOverlay } from './ComponentLoadingOverlay';

interface GalleryManagerProps {
  gallery: GalleryData[];
  onRefresh: () => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ gallery, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { isSaving: isGlobalSaving, savingMessage, withSaving } = useSaving();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryData | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  // Video/Media upload & picker states
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: 'Vital Fest',
    image_url: '',
    caption: '',
    year: '2026',
    location: 'London, UK',
    is_featured: 1,
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      category: 'Vital Fest',
      image_url: '/images/vital_fest_crowd_1790112387611.jpg',
      caption: '',
      year: '2026',
      location: 'The Hackney Social, London',
      is_featured: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: GalleryData) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      image_url: normalizeImageUrl(item.image_url),
      caption: item.caption || '',
      year: item.year || '2026',
      location: item.location || '',
      is_featured: item.is_featured,
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingMedia(true);
      const isVideo =
        file.type.startsWith('video/') ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.webm') ||
        file.name.toLowerCase().endsWith('.m4v');

      // Upload media directly to server disk storage
      const uploaded = await uploadMediaFileToServer(file, isVideo ? 'videos' : 'images', undefined, {
        category: isVideo ? 'Video Clips' : 'Gallery Archives',
        source: 'Gallery Manager',
        description: `Uploaded for visual gallery on ${new Date().toLocaleDateString()}`,
      });
      const finalUrl = uploaded.url;

      setFormData((prev) => ({
        ...prev,
        image_url: finalUrl,
        category: isVideo && prev.category === 'Vital Fest' ? 'Video Clips & Visuals' : prev.category,
      }));

      showSuccess(
        isVideo ? 'Video Clip Uploaded to Server' : 'Photo Uploaded to Server',
        `"${file.name}" stored on server filesystem (${uploaded.sizeText}).`
      );
    } catch (err: any) {
      console.error('Failed to upload file for gallery:', err);
      showError('Upload Failed', err?.message || 'Could not upload media file.');
    } finally {
      setIsUploadingMedia(false);
      if (fileUploadRef.current) fileUploadRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await withSaving(async () => {
        if (editingItem) {
          await updateGalleryItem(editingItem.id, formData);
          showSuccess('Gallery Item Updated', `"${formData.title || 'Archive Item'}" was saved successfully.`);
        } else {
          await createGalleryItem(formData);
          showSuccess('New Record Added', `"${formData.title || 'New media'}" was added to the gallery.`);
        }
      }, editingItem ? `Saving changes to "${formData.title || 'gallery item'}"...` : `Adding "${formData.title || 'new item'}" to gallery...`);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save gallery item:', err);
      showError('Failed to Save Gallery Item', err?.message || 'A database error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null && !isDeleting) {
      setIsDeleting(true);
      try {
        await withSaving(async () => {
          await deleteGalleryItem(deleteCandidateId);
          showSuccess('Item Deleted', 'The item was removed from the gallery.');
          setDeleteCandidateId(null);
          onRefresh();
        }, 'Deleting gallery item from database...');
      } catch (err: any) {
        console.error('Failed to delete gallery item:', err);
        showError('Failed to Delete Item', err?.message || 'A database error occurred.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  return (
    <div className="space-y-6 relative">
      <ComponentLoadingOverlay
        isSaving={isSaving || isDeleting || isUploadingMedia || isGlobalSaving}
        message={savingMessage || 'Saving gallery archive to database...'}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            Visual & Video Gallery Manager
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Manage photos, archival videos, rave moments, and festival clips in the public gallery.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo or Video Record</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((item) => {
          const imgUrl = normalizeImageUrl(item.image_url);
          const isItemVideo = isVideoFile(item.image_url);

          return (
            <div
              key={item.id}
              className="rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                {isItemVideo ? (
                  <div className="w-full h-full relative bg-neutral-950 flex items-center justify-center">
                    <video
                      src={item.image_url}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={imgUrl}
                    alt={item.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  {isItemVideo && <Film className="w-3 h-3 text-amber-400" />}
                  <span>{item.category}</span>
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1">
                <h4 className="text-sm font-display font-bold text-neutral-950 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {item.caption || 'No caption provided.'}
                </p>
                <div className="text-[11px] font-mono text-neutral-500">
                  {item.location} · {item.year}
                </div>
              </div>

              <div className="p-3 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">ID #{item.id}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item)}
                    className="px-2.5 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden my-8">
            <ComponentLoadingOverlay
              isSaving={isSaving}
              message={editingItem ? 'Saving changes to gallery asset...' : 'Adding asset to gallery...'}
            />
            <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                  {editingItem ? 'Edit Visual Archive / Video Item' : 'Add New Photo or Video Record'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Upload video clips or photos, select from Media Library, and specify venue details.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Record Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vital Fest Sound Clash Crowd (or 1994 Dubplate Reel)"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              {/* Media Asset Picker & Upload Box (Supports Photos and Videos) */}
              <div className="space-y-2.5 p-3.5 rounded sound-cabinet border border-neutral-300 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-950/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-neutral-800 dark:text-white flex items-center gap-1.5">
                    {isVideoFile(formData.image_url) ? (
                      <Film className="w-4 h-4 text-amber-500" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-amber-500" />
                    )}
                    <span>Media Asset (Photo or Video Clip) *</span>
                  </label>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400 hover:text-neutral-950 text-amber-600 dark:text-amber-300 dark:hover:text-neutral-950 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-amber-400/30"
                      title="Select media from Media Library"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Choose from Media Library</span>
                    </button>

                    <input
                      ref={fileUploadRef}
                      type="file"
                      accept="image/*,video/mp4,video/webm,video/quicktime,video/m4v,.mp4,.mov,.webm,.m4v"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="gallery-file-upload-input"
                    />
                    <label
                      htmlFor="gallery-file-upload-input"
                      className="px-2.5 py-1 rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-neutral-300 dark:border-white/10"
                      title="Upload photo or video from computer"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isUploadingMedia ? 'animate-bounce text-amber-500' : ''}`} />
                      <span>{isUploadingMedia ? 'Uploading...' : 'Upload File (Photo or Video)'}</span>
                    </label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/images/... or /uploads/videos/... or URL"
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-500 flex-wrap gap-1">
                  <span>Supports photos (JPG, PNG, WebP) and video clips (MP4, MOV, WebM up to 100MB).</span>
                  {isVideoFile(formData.image_url) && (
                    <span className="text-amber-500 font-bold flex items-center gap-1">
                      <Film className="w-3 h-3" />
                      Video Clip Detected (Will play in lightbox)
                    </span>
                  )}
                </div>

                {/* Media Preview (Video or Image) */}
                <div className="mt-2 rounded overflow-hidden border border-neutral-200 dark:border-white/10 bg-black aspect-video max-h-48 relative flex items-center justify-center">
                  {isVideoFile(formData.image_url) ? (
                    <video
                      src={formData.image_url}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={normalizeImageUrl(formData.image_url)}
                      alt="Preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Category</label>
                  <select
                    value={formData.category || 'Vital Fest'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  >
                    <option value="Vital Fest">Vital Fest</option>
                    <option value="Kool FM Archive">Kool FM Archive</option>
                    <option value="V&A Museum">V&A Museum</option>
                    <option value="Studio">Studio</option>
                    <option value="Live Performance">Live Performance</option>
                    <option value="Video Clips & Visuals">Video Clips & Visuals</option>
                    <option value="Documentary Shorts">Documentary Shorts</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Year</label>
                  <input
                    type="text"
                    value={formData.year || ''}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2026"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Location</label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="The Hackney Social, London"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Caption / Description</label>
                <textarea
                  rows={3}
                  value={formData.caption || ''}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Context and details about this moment in sound system history..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured === 1}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 rounded border-neutral-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="is_featured" className="text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Feature prominently in top grid bento
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingMedia}
                  className="flex items-center gap-2 px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                      <span>{editingItem ? 'Saving Changes...' : 'Creating Record...'}</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Create Record'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Delete Record"
        message="Are you sure you want to delete this record from the archive? This will update the local SQLite database."
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
        loadingLabel="Deleting Item..."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />

      {/* Media Picker Modal for selecting photos or videos from unified library */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        allowedType="all"
        title="Select Media for Gallery (Photo or Video)"
        onSelect={(selectedUrl, item) => {
          setFormData((prev) => ({
            ...prev,
            image_url: selectedUrl,
            category:
              item?.file_type === 'video' && prev.category === 'Vital Fest'
                ? 'Video Clips & Visuals'
                : prev.category,
          }));
          setIsMediaPickerOpen(false);
          showSuccess('Media Selected', 'Gallery item media asset updated.');
        }}
      />
    </div>
  );
};
