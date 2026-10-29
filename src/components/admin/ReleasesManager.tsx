import React, { useRef, useState } from 'react';
import { Plus, X, Loader2, Upload, FolderArchive, Video, Music } from 'lucide-react';
import { ReleaseData, createRelease, updateRelease, deleteRelease } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';
import { MediaPickerModal } from './MediaPickerModal';
import { uploadMediaFileToServer } from '../../utils/mediaUpload';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import { ComponentLoadingOverlay } from './ComponentLoadingOverlay';

interface ReleasesManagerProps {
  releases: ReleaseData[];
  onRefresh: () => void;
}

export const ReleasesManager: React.FC<ReleasesManagerProps> = ({ releases, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { isSaving: isGlobalSaving, savingMessage, withSaving } = useSaving();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);
  const [editingRelease, setEditingRelease] = useState<ReleaseData | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    release_year: 2026,
    label: '',
    catalog_number: '',
    format: '12" Vinyl / Digital',
    bpm: 168,
    audio_theme: '',
    stream_url: '',
    description: '',
    is_featured: 0,
    album_cover_url: '',
    video_url: '',
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
      stream_url: '',
      description: '',
      is_featured: 1,
      album_cover_url: '',
      video_url: '',
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
      album_cover_url: rel.album_cover_url || '',
      video_url: rel.video_url || '',
    });
    setIsModalOpen(true);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingVideo(true);
      const result = await uploadMediaFileToServer(file, undefined, undefined, {
        category: 'Videos',
        source: 'Release Video Upload',
      });
      setFormData((current) => ({ ...current, video_url: result.url }));
      showSuccess('Video Uploaded', `${file.name} is ready to attach to this release.`);
    } catch (error) {
      showError('Video Upload Failed', error instanceof Error ? error.message : 'Could not upload the video.');
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAudio(true);
      const result = await uploadMediaFileToServer(file, 'audio', undefined, {
        category: 'Audio',
        source: 'Release Audio Upload',
      });
      setFormData((current) => ({ ...current, stream_url: result.url }));
      showSuccess('Audio Uploaded', `${file.name} is ready to attach to this release.`);
    } catch (error) {
      showError('Audio Upload Failed', error instanceof Error ? error.message : 'Could not upload the audio file.');
    } finally {
      setIsUploadingAudio(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      await withSaving(async () => {
        if (editingRelease) {
          await updateRelease(editingRelease.id, formData);
          showSuccess('Release Updated Successfully', `"${formData.title}" has been saved.`);
        } else {
          await createRelease(formData);
          showSuccess('New Release Catalogued Successfully', `"${formData.title}" was added to the discography.`);
        }
      }, editingRelease ? `Updating release "${formData.title}"...` : `Cataloging release "${formData.title}"...`);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save release:', err);
      showError('Failed to Save Release', err?.message || 'A database error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null && !isDeleting) {
      setIsDeleting(true);
      try {
        await withSaving(async () => {
          await deleteRelease(deleteCandidateId);
          showSuccess('Release Removed', 'The release was deleted from SQLite.');
          setDeleteCandidateId(null);
          onRefresh();
        }, 'Deleting release from catalog...');
      } catch (err: any) {
        console.error('Failed to delete release:', err);
        showError('Failed to Delete Release', err?.message || 'A database error occurred.');
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
        isSaving={isSaving || isDeleting || isGlobalSaving}
        message={savingMessage || 'Saving releases in database...'}
      />
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
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
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
            className="p-5 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-md flex flex-col justify-between space-y-4"
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
              {(rel.album_cover_url || rel.video_url) && (
                <div className="flex items-center gap-3 pt-2">
                  {rel.album_cover_url && (
                    <img
                      src={rel.album_cover_url}
                      alt={`${rel.title} album cover`}
                      className="h-14 w-14 rounded border border-neutral-200 dark:border-white/10 object-cover"
                    />
                  )}
                  {rel.video_url && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                      <Video className="h-3.5 w-3.5" />
                      Video attached
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                ID #{rel.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(rel)}
                  className="px-3 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-medium cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rel.id)}
                  className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer"
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
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded border border-neutral-200 dark:border-white/15 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xl space-y-4">
            <ComponentLoadingOverlay
              isSaving={isSaving}
              message={editingRelease ? 'Saving release changes...' : 'Cataloging new release...'}
            />
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <h4 className="text-lg font-display font-bold">
                {editingRelease ? 'Edit Release' : 'Add New Release'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
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
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Decibel (VIP Remaster)"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Release Year *</label>
                  <input
                    type="number"
                    required
                    value={formData.release_year ?? 2026}
                    onChange={(e) => setFormData({ ...formData, release_year: parseInt(e.target.value) || 2026 })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">BPM Tempo *</label>
                  <input
                    type="number"
                    required
                    value={formData.bpm ?? 168}
                    onChange={(e) => setFormData({ ...formData, bpm: parseInt(e.target.value) || 168 })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Format</label>
                  <input
                    type="text"
                    value={formData.format || ''}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    placeholder='12" Vinyl / Digital'
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Record Label</label>
                  <input
                    type="text"
                    value={formData.label || ''}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="e.g. Kool FM Recordings"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Catalogue Number</label>
                  <input
                    type="text"
                    value={formData.catalog_number || ''}
                    onChange={(e) => setFormData({ ...formData, catalog_number: e.target.value })}
                    placeholder="e.g. KOOL-005"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Audio Theme / Sonic Description</label>
                <input
                  type="text"
                  value={formData.audio_theme || ''}
                  onChange={(e) => setFormData({ ...formData, audio_theme: e.target.value })}
                  placeholder="e.g. Rolling sub-bass with amen break cutups and ragga vocals"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Audio URL <span className="font-normal text-neutral-500">(used by the cover play button)</span>
                </label>
                <input
                  type="text"
                  value={formData.stream_url || ''}
                  onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                  placeholder="https://... or /uploads/audio/..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
                <input
                  ref={audioFileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAudioPickerOpen(true)}
                    className="flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20"
                  >
                    <Music className="h-3.5 w-3.5 text-amber-500" />
                    Choose Audio from Media Library
                  </button>
                  <button
                    type="button"
                    onClick={() => audioFileInputRef.current?.click()}
                    disabled={isUploadingAudio}
                    className="flex items-center gap-1.5 rounded bg-amber-400 px-3 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-300 disabled:cursor-wait disabled:opacity-50"
                  >
                    {isUploadingAudio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {isUploadingAudio ? 'Uploading...' : 'Upload Audio'}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Optional. Accepts full URLs and site-relative Media Library paths such as /uploads/audio/.... The album cover play button uses this field. Video clips are configured separately below.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Historical & Liner Notes</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Details on production, hardware samplers, release context..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Album Cover</label>
                <ImageInput
                  value={formData.album_cover_url || ''}
                  onChange={(url) => setFormData({ ...formData, album_cover_url: url })}
                  aspectRatio="square"
                  helperText="Upload artwork, select it from the Media Library, or paste an image URL."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Video Clip</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoPickerOpen(true)}
                    className="flex items-center gap-1.5 rounded border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-200 dark:border-white/10 dark:bg-white/10 dark:text-neutral-200 dark:hover:bg-white/20"
                  >
                    <FolderArchive className="h-3.5 w-3.5 text-amber-500" />
                    Choose from Library
                  </button>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="flex items-center gap-1.5 rounded bg-amber-400 px-3 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
                  >
                    {isUploadingVideo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {isUploadingVideo ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="Paste a YouTube, Vimeo, or video file URL"
                  className="w-full rounded border border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-amber-500 focus:outline-none dark:border-white/10 dark:bg-neutral-950 dark:text-white"
                />
                <p className="text-[11px] text-neutral-500">Optional. Accepts uploaded video files and YouTube or Vimeo URLs.</p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white text-xs font-medium cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-950" />
                      <span>{editingRelease ? 'Saving Changes...' : 'Creating Release...'}</span>
                    </>
                  ) : (
                    <span>{editingRelease ? 'Save Changes' : 'Create Release'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelect={(url) => {
          setFormData((current) => ({ ...current, stream_url: url }));
          setIsAudioPickerOpen(false);
        }}
        filterType="audio"
        title="Select Release Audio"
        selectedUrl={formData.stream_url}
      />

      <MediaPickerModal
        isOpen={isVideoPickerOpen}
        onClose={() => setIsVideoPickerOpen(false)}
        onSelect={(url) => {
          setFormData((current) => ({ ...current, video_url: url }));
          setIsVideoPickerOpen(false);
        }}
        filterType="video"
        title="Select Release Video"
        selectedUrl={formData.video_url}
      />

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Confirm Release Deletion"
        message="Are you sure you want to permanently delete this dubplate release from the SQLite database?"
        confirmLabel="Delete Release"
        cancelLabel="Keep Release"
        isDestructive
        isLoading={isDeleting}
        loadingLabel="Deleting Release..."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
