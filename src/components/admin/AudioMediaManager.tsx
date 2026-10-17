import React, { useState, useEffect, useRef } from 'react';
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
  Upload,
  FolderArchive,
  Music,
  Film,
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
  createMediaLibraryItem,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';
import { MediaPickerModal } from './MediaPickerModal';
import { isVideoFile } from '../DocumentarySection';
import { useToast } from '../../context/ToastContext';

export const isAudioFile = (url?: string) => {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.endsWith('.mp3') ||
    clean.endsWith('.wav') ||
    clean.endsWith('.ogg') ||
    clean.endsWith('.m4a') ||
    clean.endsWith('.aac') ||
    clean.includes('/uploads/audio/') ||
    clean.startsWith('data:audio/')
  );
};

interface AudioMediaManagerProps {
  onRefresh: () => void;
}

export const AudioMediaManager: React.FC<AudioMediaManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'mixes' | 'videos'>('mixes');
  const [mixes, setMixes] = useState<AudioMixData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);

  // Modals & Pickers State
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isVideoPickerOpen, setIsVideoPickerOpen] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

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

  // Direct Audio File Upload Handler
  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAudio(true);
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read audio file'));
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl: base64Data,
          category: 'audio',
        }),
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Server failed to store uploaded audio');
      }

      const uploadJson = await uploadRes.json();
      const audioUrl = uploadJson.url;

      setMixFormData((prev) => ({
        ...prev,
        embed_url: audioUrl,
        stream_url: audioUrl,
        platform: 'Direct Audio',
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));

      const sizeKb = Math.round(file.size / 1024);
      const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      await createMediaLibraryItem({
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        file_name: file.name,
        file_type: 'audio',
        mime_type: file.type || 'audio/mpeg',
        url: audioUrl,
        source: 'Audio Manager Upload',
        size_text: sizeText,
        category: 'Audio Broadcasts',
        description: `Uploaded for Live Sets & Radio Archives on ${new Date().toLocaleDateString()}`,
      });

      showSuccess('Audio Uploaded', `"${file.name}" saved and set as audio stream.`);
    } catch (err: any) {
      console.error('Failed to upload audio:', err);
      showError('Upload Failed', err?.message || 'Could not upload audio file.');
    } finally {
      setIsUploadingAudio(false);
      if (audioFileInputRef.current) audioFileInputRef.current.value = '';
    }
  };

  // Direct Video File Upload Handler
  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingVideo(true);
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read video file'));
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch('/api/upload-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          dataUrl: base64Data,
          category: 'videos',
        }),
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Server failed to store uploaded video');
      }

      const uploadJson = await uploadRes.json();
      const videoUrl = uploadJson.url;

      setVideoFormData((prev) => ({
        ...prev,
        video_url: videoUrl,
        title: prev.title || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      }));

      const sizeKb = Math.round(file.size / 1024);
      const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      await createMediaLibraryItem({
        title: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        file_name: file.name,
        file_type: 'video',
        mime_type: file.type || 'video/mp4',
        url: videoUrl,
        source: 'Media Gallery Video Upload',
        size_text: sizeText,
        category: 'Video Clips',
        description: `Uploaded for Video Clips & Recaps on ${new Date().toLocaleDateString()}`,
      });

      showSuccess('Video Uploaded', `"${file.name}" saved and set as video source.`);
    } catch (err: any) {
      console.error('Failed to upload video:', err);
      showError('Upload Failed', err?.message || 'Could not upload video clip.');
    } finally {
      setIsUploadingVideo(false);
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';
    }
  };

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
                  value={mixFormData.title || ''}
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
                    value={mixFormData.style || 'Jungle / D&B'}
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
                    value={mixFormData.platform || 'SoundCloud'}
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

              {/* SoundCloud / Mixcloud / Direct Audio Source */}
              <div className="space-y-2.5 p-3.5 rounded border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-950/50">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 uppercase flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-amber-500" />
                    <span>Audio Media Source (Library, Direct Upload, or Embed) *</span>
                  </label>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsAudioPickerOpen(true)}
                      className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400 hover:text-neutral-950 text-amber-600 dark:text-amber-300 dark:hover:text-neutral-950 text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer border border-amber-400/30"
                      title="Select audio file from Media Library"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Choose from Library</span>
                    </button>

                    <input
                      ref={audioFileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                      id="mix-audio-upload-input"
                    />
                    <label
                      htmlFor="mix-audio-upload-input"
                      className="px-2.5 py-1 rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer border border-neutral-300 dark:border-white/10"
                      title="Upload MP3 or WAV from computer"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isUploadingAudio ? 'animate-bounce text-amber-500' : ''}`} />
                      <span>{isUploadingAudio ? 'Uploading...' : 'Upload Audio File'}</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={mixFormData.embed_url || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMixFormData({
                      ...mixFormData,
                      embed_url: val,
                      platform: isAudioFile(val) ? 'Direct Audio' : mixFormData.platform,
                      stream_url: isAudioFile(val) && !mixFormData.stream_url ? val : mixFormData.stream_url,
                    });
                  }}
                  placeholder="https://soundcloud.com/... or /uploads/audio/..."
                  className="w-full px-3.5 py-2.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-sm font-mono"
                />

                <div className="flex items-center justify-between text-[10px] text-neutral-500 flex-wrap gap-1">
                  <span>Supports SoundCloud/Mixcloud URLs or direct uploaded audio files (MP3, WAV, M4A).</span>
                  {isAudioFile(mixFormData.embed_url) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Direct Audio Attached
                    </span>
                  )}
                </div>

                {isAudioFile(mixFormData.embed_url) && (
                  <div className="pt-1">
                    <audio controls src={mixFormData.embed_url} className="w-full h-9" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={mixFormData.duration || ''}
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
                    value={mixFormData.stream_url || ''}
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
                  value={mixFormData.description || ''}
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
                  value={videoFormData.title || ''}
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
                    value={videoFormData.category || 'Event Recap'}
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
                    value={videoFormData.duration || ''}
                    onChange={(e) => setVideoFormData({ ...videoFormData, duration: e.target.value })}
                    placeholder="e.g. 02:45"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>
              </div>

              {/* YouTube / Video URL Source */}
              <div className="space-y-2.5 p-3.5 rounded border border-neutral-200 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-950/50">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 uppercase flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-amber-500" />
                    <span>Video Media Source (Library, Direct Upload, or YouTube) *</span>
                  </label>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsVideoPickerOpen(true)}
                      className="px-2.5 py-1 rounded bg-amber-400/20 hover:bg-amber-400 hover:text-neutral-950 text-amber-600 dark:text-amber-300 dark:hover:text-neutral-950 text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer border border-amber-400/30"
                      title="Select video clip from Media Library"
                    >
                      <FolderArchive className="w-3.5 h-3.5" />
                      <span>Choose from Library</span>
                    </button>

                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/m4v,.mp4,.mov,.webm,.m4v"
                      onChange={handleVideoFileUpload}
                      className="hidden"
                      id="recap-video-upload-input"
                    />
                    <label
                      htmlFor="recap-video-upload-input"
                      className="px-2.5 py-1 rounded bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 text-xs font-mono font-bold transition-colors flex items-center gap-1 cursor-pointer border border-neutral-300 dark:border-white/10"
                      title="Upload MP4 or MOV from computer"
                    >
                      <Upload className={`w-3.5 h-3.5 ${isUploadingVideo ? 'animate-bounce text-amber-500' : ''}`} />
                      <span>{isUploadingVideo ? 'Uploading...' : 'Upload Video File'}</span>
                    </label>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={videoFormData.video_url || ''}
                  onChange={(e) => setVideoFormData({ ...videoFormData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or /uploads/videos/..."
                  className="w-full px-3.5 py-2.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-sm font-mono"
                />

                <div className="flex items-center justify-between text-[10px] text-neutral-500 flex-wrap gap-1">
                  <span>Supports YouTube URLs or uploaded video clips (MP4, MOV, WebM up to 100MB).</span>
                  {isVideoFile(videoFormData.video_url) && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Direct Video Clip Attached
                    </span>
                  )}
                </div>

                {isVideoFile(videoFormData.video_url) && (
                  <div className="mt-2 rounded overflow-hidden border border-amber-400/30 bg-black aspect-video max-h-44 flex items-center justify-center">
                    <video
                      src={videoFormData.video_url}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
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

      {/* Media Picker Modal for Audio */}
      <MediaPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        allowedType="all"
        title="Select Audio from Media Library"
        onSelect={(selectedUrl) => {
          setMixFormData((prev) => ({
            ...prev,
            embed_url: selectedUrl,
            stream_url: selectedUrl,
            platform: 'Direct Audio',
          }));
          setIsAudioPickerOpen(false);
          showSuccess('Audio Selected', 'Audio track linked to mix record.');
        }}
      />

      {/* Media Picker Modal for Video */}
      <MediaPickerModal
        isOpen={isVideoPickerOpen}
        onClose={() => setIsVideoPickerOpen(false)}
        allowedType="video"
        title="Select Video Clip from Media Library"
        onSelect={(selectedUrl) => {
          setVideoFormData((prev) => ({
            ...prev,
            video_url: selectedUrl,
          }));
          setIsVideoPickerOpen(false);
          showSuccess('Video Selected', 'Video clip linked to video record.');
        }}
      />
    </div>
  );
};
