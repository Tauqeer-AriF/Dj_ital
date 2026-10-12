import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { GalleryData, createGalleryItem, updateGalleryItem, deleteGalleryItem } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../../utils/imageOptimization';
import { useToast } from '../../context/ToastContext';

interface GalleryManagerProps {
  gallery: GalleryData[];
  onRefresh: () => void;
}

export const GalleryManager: React.FC<GalleryManagerProps> = ({ gallery, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryData | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateGalleryItem(editingItem.id, formData);
        showSuccess('Gallery Item Updated', `"${formData.title || 'Photo'}" was saved successfully.`);
      } else {
        await createGalleryItem(formData);
        showSuccess('New Photo Added', `"${formData.title || 'New image'}" was added to the gallery.`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save gallery item:', err);
      showError('Failed to Save Gallery Item', err?.message || 'A database error occurred.');
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null) {
      try {
        await deleteGalleryItem(deleteCandidateId);
        showSuccess('Item Deleted', 'The photo was removed from the gallery.');
        setDeleteCandidateId(null);
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete gallery item:', err);
        showError('Failed to Delete Item', err?.message || 'A database error occurred.');
      }
    }
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">Visual Gallery Manager</h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Manage photo items, archive artifacts, and festival moments in the public gallery.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Photo Record</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gallery.map((item) => {
          const imgUrl = normalizeImageUrl(item.image_url);
          return (
            <div
              key={item.id}
              className="rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 overflow-hidden flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                <img
                  src={imgUrl}
                  alt={item.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-amber-400">
                  {item.category}
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1">
                <h4 className="text-sm font-display font-bold text-neutral-950 dark:text-white">
                  {item.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {item.caption}
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
          <div className="w-full max-w-2xl rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                  {editingItem ? 'Edit Visual Archive Item' : 'Add New Photo Record'}
                </h3>
                <p className="text-xs text-neutral-500">
                  Update image asset, venue details, and description.
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
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Photo Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vital Fest Sound Clash Crowd"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              {/* Advanced Image Input with Upload, URL and Preset selector */}
              <ImageInput
                value={formData.image_url}
                onChange={(newUrl) => setFormData({ ...formData, image_url: newUrl })}
                defaultUrl="/images/vital_fest_crowd_1790112387611.jpg"
                label="Photo Image File / Source"
                helperText="Upload custom picture from your device or select from archive presets."
                aspectRatio="landscape"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  >
                    <option value="Vital Fest">Vital Fest</option>
                    <option value="Kool FM Archive">Kool FM Archive</option>
                    <option value="V&A Museum">V&A Museum</option>
                    <option value="Studio">Studio</option>
                    <option value="Live Performance">Live Performance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Year</label>
                  <input
                    type="text"
                    value={formData.year}
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
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="The Hackney Social, London"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Caption / Description</label>
                <textarea
                  rows={3}
                  value={formData.caption}
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
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Delete Photo Record"
        message="Are you sure you want to delete this photo from the archive? This will update the local SQLite database."
        confirmLabel="Delete"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
