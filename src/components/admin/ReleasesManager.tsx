import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ReleaseData, createRelease, updateRelease, deleteRelease } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';

interface ReleasesManagerProps {
  releases: ReleaseData[];
  onRefresh: () => void;
}

export const ReleasesManager: React.FC<ReleasesManagerProps> = ({ releases, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseData | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    release_year: 2026,
    label: '',
    catalog_number: '',
    format: '12" Vinyl / Digital',
    bpm: 168,
    audio_theme: '',
    stream_url: 'https://djital.me',
    description: '',
    is_featured: 0,
  });

  const openCreateModal = () => {
    setEditingRelease(null);
    setFormData({
      title: '',
      release_year: 2026,
      label: 'Vital Recordings London',
      catalog_number: 'VR-002',
      format: '12" Vinyl / Digital',
      bpm: 168,
      audio_theme: 'Heavyweight sub-bass roller with timestretched jungle breakbeats.',
      stream_url: 'https://djital.me',
      description: '',
      is_featured: 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (rel: ReleaseData) => {
    setEditingRelease(rel);
    setFormData({
      title: rel.title,
      release_year: rel.release_year,
      label: rel.label || '',
      catalog_number: rel.catalog_number || '',
      format: rel.format || '12" Vinyl',
      bpm: rel.bpm || 168,
      audio_theme: rel.audio_theme || '',
      stream_url: rel.stream_url || '',
      description: rel.description || '',
      is_featured: rel.is_featured,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRelease) {
      await updateRelease(editingRelease.id, formData);
    } else {
      await createRelease(formData);
    }
    setIsModalOpen(false);
    onRefresh();
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null) {
      await deleteRelease(deleteCandidateId);
      setDeleteCandidateId(null);
      onRefresh();
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
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">Releases & Music Manager</h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Catalogue tracks, vinyl dubplates, and pirate radio archive master tapes.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Release</span>
        </button>
      </div>

      {/* Releases Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {releases.map((rel) => (
          <div
            key={rel.id}
            className="p-5 rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-md flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">{rel.release_year}</span>
                <span>{rel.bpm} BPM</span>
              </div>
              <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white leading-tight">
                {rel.title}
              </h4>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {rel.label} · {rel.catalog_number} · {rel.format}
              </div>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">
                {rel.description}
              </p>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                ID #{rel.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(rel)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-medium cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rel.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl border border-neutral-200 dark:border-white/15 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <h4 className="text-lg font-display font-bold">
                {editingRelease ? 'Edit Release' : 'Add New Release'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Track / Release Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Decibel (VIP Remaster)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Release Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.release_year}
                    onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) || 2026 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">BPM Tempo *</label>
                  <input
                    type="number"
                    required
                    value={formData.bpm}
                    onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) || 168 })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Format</label>
                  <input
                    type="text"
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    placeholder='12" Vinyl / Digital'
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Record Label</label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Kool FM Recordings"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Catalogue Number</label>
                  <input
                    type="text"
                    value={formData.catalog_number}
                    onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
                    placeholder="e.g. KOOL-005"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Audio Theme / Sonic Description</label>
                <input
                  type="text"
                  value={formData.audio_theme}
                  onChange={(e) => setFormData({ ...formData, audio_theme: e.target.value })}
                  placeholder="e.g. Rolling sub-bass with amen break cutups and ragga vocals"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Historical & Liner Notes</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details on production, hardware samplers, release context..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingRelease ? 'Save Changes' : 'Create Release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Confirm Release Deletion"
        message="Are you sure you want to permanently delete this dubplate release from the SQLite database?"
        confirmLabel="Delete Release"
        cancelLabel="Keep Release"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
