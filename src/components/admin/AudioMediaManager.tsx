import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Play,
  Video,
  Radio,
  Clock,
  ExternalLink,
  X,
  Check,
} from 'lucide-react';
import {
  AudioMixData,
  VideoData,
  getAudioMixes,
  createAudioMix,
  updateAudioMix,
  deleteAudioMix,
  getVideos,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';
import { useToast } from '../../context/ToastContext';

interface AudioMediaManagerProps {
  onRefresh: () => void;
}

export const AudioMediaManager: React.FC<AudioMediaManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'mixes' | 'videos'>('mixes');
  const [mixes, setMixes] = useState<AudioMixData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);

  // Mix Modal
  const [isMixModalOpen, setIsMixModalOpen] = useState(false);
  const [editingMix, setEditingMix] = useState<AudioMixData | null>(null);
  const [deleteCandidateMixId, setDeleteCandidateMixId] = useState<number | null>(null);
  const [mixFormData, setMixFormData] = useState({
    title: '',
    style: 'Jungle / D&B',
    platform: 'SoundCloud',
    embed_url: '',
    stream_url: '',
    duration: '',
    description: '',
    is_featured: 1,
    order_index: 0,
  });

  // Video Modal
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
  const [deleteCandidateVideoId, setDeleteCandidateVideoId] = useState<number | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    category: 'Event Recap',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    order_index: 0,
  });

  const loadData = async () => {
    const [m, v] = await Promise.all([getAudioMixes(), getVideos()]);
    setMixes(m);
    setVideos(v);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Audio Mixes
  const openCreateMix = () => {
    setEditingMix(null);
    setMixFormData({
      title: '',
      style: 'Jungle / D&B',
      platform: 'SoundCloud',
      embed_url: 'https://soundcloud.com/djital',
      stream_url: 'https://soundcloud.com',
      duration: '60:00',
      description: '',
      is_featured: 1,
      order_index: mixes.length + 1,
    });
    setIsMixModalOpen(true);
  };

  const openEditMix = (mix: AudioMixData) => {
    setEditingMix(mix);
    setMixFormData({
      title: mix.title,
      style: mix.style,
      platform: mix.platform,
      embed_url: mix.embed_url,
      stream_url: mix.stream_url || '',
      duration: mix.duration || '',
      description: mix.description || '',
      is_featured: mix.is_featured,
      order_index: mix.order_index,
    });
    setIsMixModalOpen(true);
  };

  const handleMixSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMix) {
        await updateAudioMix(editingMix.id, mixFormData);
        showSuccess('Audio Mix Updated', `"${mixFormData.title}" saved successfully.`);
      } else {
        await createAudioMix(mixFormData);
        showSuccess('Audio Mix Added', `"${mixFormData.title}" catalogued successfully.`);
      }
      setIsMixModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save mix:', err);
      showError('Failed to Save Mix', err?.message || 'A database error occurred.');
    }
  };

  const confirmDeleteMix = async () => {
    if (deleteCandidateMixId !== null) {
      try {
        await deleteAudioMix(deleteCandidateMixId);
        showSuccess('Mix Removed', 'Audio mix deleted from SQLite.');
        setDeleteCandidateMixId(null);
        await loadData();
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete mix:', err);
        showError('Failed to Delete Mix', err?.message || 'A database error occurred.');
      }
    }
  };

  // Handlers for Videos
  const openCreateVideo = () => {
    setEditingVideo(null);
    setVideoFormData({
      title: '',
      category: 'Event Recap',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail_url: '/images/vital_fest_crowd_1790112387611.jpg',
      duration: '02:30',
      order_index: videos.length + 1,
    });
    setIsVideoModalOpen(true);
  };

  const openEditVideo = (video: VideoData) => {
    setEditingVideo(video);
    setVideoFormData({
      title: video.title,
      category: video.category,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      duration: video.duration || '',
      order_index: video.order_index,
    });
    setIsVideoModalOpen(true);
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, videoFormData);
        showSuccess('Video Updated', `"${videoFormData.title}" saved successfully.`);
      } else {
        await createVideo(videoFormData);
        showSuccess('Video Added', `"${videoFormData.title}" catalogued successfully.`);
      }
      setIsVideoModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save video:', err);
      showError('Failed to Save Video', err?.message || 'A database error occurred.');
    }
  };

  const confirmDeleteVideo = async () => {
    if (deleteCandidateVideoId !== null) {
      try {
        await deleteVideo(deleteCandidateVideoId);
        showSuccess('Video Removed', 'Video record deleted from SQLite.');
        setDeleteCandidateVideoId(null);
        await loadData();
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete video:', err);
        showError('Failed to Delete Video', err?.message || 'A database error occurred.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            Audio Sets, Radio Streams & Video Clips
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Add or edit embedded SoundCloud/Mixcloud sets (grouped by style) and short video recaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'mixes' ? (
            <button
              onClick={openCreateMix}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Audio Set</span>
            </button>
          ) : (
            <button
              onClick={openCreateVideo}
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Video Clip</span>
            </button>
          )}
        </div>
      </div>

      {/* Subtabs switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('mixes')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
            activeSubTab === 'mixes'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>SoundCloud & Mixcloud Mixes ({mixes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('videos')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
            activeSubTab === 'videos'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Video Clips & Event Recaps ({videos.length})</span>
        </button>
      </div>

      {/* Content for Mixes */}
      {activeSubTab === 'mixes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mixes.map((mix) => (
            <div
              key={mix.id}
              className="p-5 rounded border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-800 dark:text-amber-300 font-bold">
                    {mix.style}
                  </span>
                  <span className="text-neutral-500">{mix.platform} · {mix.duration}</span>
                </div>
                <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                  {mix.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {mix.description}
                </p>
                <div className="text-[11px] font-mono text-neutral-400 truncate">
                  {mix.embed_url}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditMix(mix)}
                  className="p-2 rounded text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  title="Edit Mix"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteCandidateMixId(mix.id)}
                  className="p-2 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Mix"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content for Videos */}
      {activeSubTab === 'videos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="rounded border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-neutral-950">
                <img
                  src={vid.thumbnail_url || '/images/vital_fest_crowd_1790112387611.jpg'}
                  alt={vid.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                  {vid.category}
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-neutral-300">
                  {vid.duration}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white line-clamp-1">
                  {vid.title}
                </h4>
                <div className="text-[11px] font-mono text-neutral-400 truncate">
                  {vid.video_url}
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEditVideo(vid)}
                    className="p-1.5 rounded text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteCandidateVideoId(vid.id)}
                    className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Create Mix Modal */}
      {isMixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
              <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                {editingMix ? 'Edit Audio Set' : 'Add New Audio Set'}
              </h4>
              <button
                onClick={() => setIsMixModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMixSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Mix Title
                </label>
                <input
                  type="text"
                  required
                  value={mixFormData.title}
                  onChange={(e) => setMixFormData({ ...mixFormData, title: e.target.value })}
                  placeholder="e.g. Kool FM 94.5 Archive (1994)"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Style Grouping
                  </label>
                  <select
                    value={mixFormData.style}
                    onChange={(e) => setMixFormData({ ...mixFormData, style: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  >
                    <option value="Jungle / D&B">Jungle / D&B</option>
                    <option value="Reggae / Dub">Reggae / Dub</option>
                    <option value="Oldskool Tape Archive">Oldskool Tape Archive</option>
                    <option value="UK Bass">UK Bass</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Platform
                  </label>
                  <select
                    value={mixFormData.platform}
                    onChange={(e) => setMixFormData({ ...mixFormData, platform: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  >
                    <option value="SoundCloud">SoundCloud</option>
                    <option value="Mixcloud">Mixcloud</option>
                    <option value="YouTube">YouTube</option>
                    <option value="Direct Audio">Direct Audio</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  SoundCloud / Mixcloud Embed URL or Track URL
                </label>
                <input
                  type="text"
                  required
                  value={mixFormData.embed_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, embed_url: e.target.value })}
                  placeholder="https://soundcloud.com/..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={mixFormData.duration}
                    onChange={(e) => setMixFormData({ ...mixFormData, duration: e.target.value })}
                    placeholder="e.g. 58:40"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    External Stream URL
                  </label>
                  <input
                    type="text"
                    value={mixFormData.stream_url}
                    onChange={(e) => setMixFormData({ ...mixFormData, stream_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Description / Track Highlights
                </label>
                <textarea
                  rows={2}
                  value={mixFormData.description}
                  onChange={(e) => setMixFormData({ ...mixFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMixModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 text-neutral-950 font-mono text-xs font-bold"
                >
                  Save Mix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Create Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
              <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                {editingVideo ? 'Edit Video Clip' : 'Add New Video Clip'}
              </h4>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Video Title
                </label>
                <input
                  type="text"
                  required
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  placeholder="e.g. Vital Fest 2026 Crowd Reaction"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Category
                  </label>
                  <select
                    value={videoFormData.category}
                    onChange={(e) => setVideoFormData({ ...videoFormData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  >
                    <option value="Event Recap">Event Recap</option>
                    <option value="Live Set Clip">Live Set Clip</option>
                    <option value="Crowd Reaction">Crowd Reaction</option>
                    <option value="Documentary Extra">Documentary Extra</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={videoFormData.duration}
                    onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                    placeholder="e.g. 02:45"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  YouTube / Video URL
                </label>
                <input
                  type="text"
                  required
                  value={videoFormData.video_url}
                  onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Video Thumbnail Image
                </label>
                <ImageInput
                  value={videoFormData.thumbnail_url}
                  onChange={(newUrl) => setVideoFormData({ ...videoFormData, thumbnail_url: newUrl })}
                  defaultUrl="/images/vital_fest_crowd_1790112387611.jpg"
                  aspectRatio="video"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 text-neutral-950 font-mono text-xs font-bold"
                >
                  Save Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={deleteCandidateMixId !== null}
        title="Delete Audio Set"
        message="Are you sure you want to delete this audio set from the database?"
        confirmLabel="Delete Mix"
        onConfirm={confirmDeleteMix}
        onCancel={() => setDeleteCandidateMixId(null)}
      />

      <ConfirmModal
        isOpen={deleteCandidateVideoId !== null}
        title="Delete Video Clip"
        message="Are you sure you want to delete this video clip from the database?"
        confirmLabel="Delete Video"
        onConfirm={confirmDeleteVideo}
        onCancel={() => setDeleteCandidateVideoId(null)}
      />
    </div>
  );
};
