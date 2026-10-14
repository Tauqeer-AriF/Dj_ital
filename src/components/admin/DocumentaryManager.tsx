import React, { useState, useEffect } from 'react';
import {
  Video,
  Plus,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Play,
  Clock,
  ExternalLink,
  Copy,
  MoveUp,
  MoveDown,
  Eye,
  Sliders,
  AlertCircle,
  Film,
  Sparkles,
  Layers,
  X,
  Youtube,
  Search,
} from 'lucide-react';
import {
  DocumentaryData,
  DocumentarySettingsData,
  DEFAULT_DOCUMENTARY_SETTINGS,
  DEFAULT_DOCUMENTARY_EPISODES,
  getDocumentaries,
  getDocumentarySettings,
  updateDocumentarySettings,
  resetDocumentarySettings,
  createDocumentary,
  updateDocumentary,
  deleteDocumentary,
  resetDocumentaries,
} from '../../db/sqlite';
import { ImageInput } from './ImageInput';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { DocumentarySection, extractYouTubeEmbedUrl } from '../DocumentarySection';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../../utils/imageOptimization';

interface DocumentaryManagerProps {
  onRefresh: () => void;
}

type SubTab = 'episodes' | 'settings' | 'preview';

export const DocumentaryManager: React.FC<DocumentaryManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('episodes');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [episodes, setEpisodes] = useState<DocumentaryData[]>([]);
  const [settings, setSettings] = useState<DocumentarySettingsData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<DocumentarySettingsData>({
    id: 1,
    badge_text: DEFAULT_DOCUMENTARY_SETTINGS.badge_text,
    subbadge_text: DEFAULT_DOCUMENTARY_SETTINGS.subbadge_text,
    heading: DEFAULT_DOCUMENTARY_SETTINGS.heading,
    description: DEFAULT_DOCUMENTARY_SETTINGS.description,
    youtube_button_text: DEFAULT_DOCUMENTARY_SETTINGS.youtube_button_text,
    youtube_series_url: DEFAULT_DOCUMENTARY_SETTINGS.youtube_series_url,
    show_youtube_button: 1,
    is_section_visible: 1,
    updated_at: new Date().toISOString(),
  });

  // Modal states for episode Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<DocumentaryData | null>(null);
  const [deleteEpId, setDeleteEpId] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showResetSettingsModal, setShowResetSettingsModal] = useState(false);

  // Video preview player modal
  const [testVideoUrl, setTestVideoUrl] = useState<{ title: string; url: string } | null>(null);

  // Episode form state
  const [episodeForm, setEpisodeForm] = useState({
    episode_number: 1,
    badge_label: 'EPISODE 01',
    title: '',
    duration: '20 MIN',
    description: '',
    youtube_url: 'https://www.youtube.com/@djital',
    topics: '',
    thumbnail_url: '/images/hackney_pirate_radio_1790113898507.jpg',
    action_button_text: 'WATCH ARCHIVAL TAPE',
    order_index: 1,
  });

  // Load all documentary data from SQLite
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docs, sett] = await Promise.all([
        getDocumentaries(),
        getDocumentarySettings(),
      ]);
      setEpisodes(docs);
      setSettings(sett);
      setSettingsForm(sett);
    } catch (err: any) {
      console.error('Failed to load documentary data:', err);
      showError('Loading Error', err?.message || 'Could not load documentary collection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSaving(true);
      await updateDocumentarySettings(settingsForm);
      setSettings(settingsForm);
      showSuccess('Documentary Settings Saved', 'Header copy, YouTube external links, and visibility updated.');
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update documentary settings:', err);
      showError('Save Error', err?.message || 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Settings to Defaults
  const handleResetSettings = async () => {
    try {
      setIsSaving(true);
      await resetDocumentarySettings();
      const fresh = await getDocumentarySettings();
      setSettings(fresh);
      setSettingsForm(fresh);
      setShowResetSettingsModal(false);
      showSuccess('Settings Reverted', 'Documentary section header has been restored to default.');
      onRefresh();
    } catch (err: any) {
      showError('Reset Error', err?.message || 'Could not reset settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal for new episode
  const handleOpenAddModal = () => {
    setEditingEpisode(null);
    const nextEpNum = episodes.length > 0 ? Math.max(...episodes.map((e) => e.episode_number)) + 1 : 1;
    const formattedNum = nextEpNum < 10 ? `0${nextEpNum}` : `${nextEpNum}`;
    setEpisodeForm({
      episode_number: nextEpNum,
      badge_label: `EPISODE ${formattedNum}`,
      title: '',
      duration: '20 MIN',
      description: '',
      youtube_url: 'https://www.youtube.com/@djital',
      topics: 'Jungle Heritage, Kool FM, Dubplate Cut',
      thumbnail_url: '/images/dj_ital_hero_1790112374509.jpg',
      action_button_text: 'WATCH ARCHIVAL TAPE',
      order_index: episodes.length + 1,
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing episode
  const handleOpenEditModal = (ep: DocumentaryData) => {
    setEditingEpisode(ep);
    setEpisodeForm({
      episode_number: ep.episode_number,
      badge_label: ep.badge_label || `EPISODE ${ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}`,
      title: ep.title,
      duration: ep.duration || '20 MIN',
      description: ep.description || '',
      youtube_url: ep.youtube_url || 'https://www.youtube.com/@djital',
      topics: ep.topics || '',
      thumbnail_url: ep.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg',
      action_button_text: ep.action_button_text || 'WATCH ARCHIVAL TAPE',
      order_index: ep.order_index ?? ep.episode_number,
    });
    setIsModalOpen(true);
  };

  // Save Episode (Add or Edit)
  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!episodeForm.title.trim()) {
      showError('Title Required', 'Please provide a title for this documentary episode.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingEpisode) {
        await updateDocumentary(editingEpisode.id, {
          episode_number: Number(episodeForm.episode_number) || 1,
          badge_label: episodeForm.badge_label.trim(),
          title: episodeForm.title.trim(),
          duration: episodeForm.duration.trim(),
          description: episodeForm.description.trim(),
          youtube_url: episodeForm.youtube_url.trim(),
          topics: episodeForm.topics.trim(),
          thumbnail_url: episodeForm.thumbnail_url.trim(),
          action_button_text: episodeForm.action_button_text.trim() || 'WATCH ARCHIVAL TAPE',
          order_index: Number(episodeForm.order_index) || Number(episodeForm.episode_number) || 1,
        });
        showSuccess('Episode Updated', `Episode ${episodeForm.episode_number}: "${episodeForm.title}" saved.`);
      } else {
        await createDocumentary({
          episode_number: Number(episodeForm.episode_number) || 1,
          badge_label: episodeForm.badge_label.trim() || `EPISODE ${episodeForm.episode_number < 10 ? `0${episodeForm.episode_number}` : episodeForm.episode_number}`,
          title: episodeForm.title.trim(),
          duration: episodeForm.duration.trim(),
          description: episodeForm.description.trim(),
          youtube_url: episodeForm.youtube_url.trim(),
          topics: episodeForm.topics.trim(),
          thumbnail_url: episodeForm.thumbnail_url.trim(),
          action_button_text: episodeForm.action_button_text.trim() || 'WATCH ARCHIVAL TAPE',
          order_index: Number(episodeForm.order_index) || Number(episodeForm.episode_number) || 1,
        });
        showSuccess('Episode Added', `Episode ${episodeForm.episode_number}: "${episodeForm.title}" created.`);
      }

      setIsModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save documentary episode:', err);
      showError('Save Error', err?.message || 'Could not save episode.');
    } finally {
      setIsSaving(false);
    }
  };

  // Duplicate / Clone Episode
  const handleDuplicateEpisode = async (ep: DocumentaryData) => {
    try {
      setIsSaving(true);
      const nextEpNum = Math.max(...episodes.map((e) => e.episode_number), 0) + 1;
      const formattedNum = nextEpNum < 10 ? `0${nextEpNum}` : `${nextEpNum}`;

      await createDocumentary({
        episode_number: nextEpNum,
        badge_label: `EPISODE ${formattedNum}`,
        title: `${ep.title} (Copy)`,
        duration: ep.duration,
        description: ep.description,
        youtube_url: ep.youtube_url,
        topics: ep.topics,
        thumbnail_url: ep.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg',
        action_button_text: ep.action_button_text || 'WATCH ARCHIVAL TAPE',
        order_index: episodes.length + 1,
      });

      showSuccess('Episode Cloned', `Created duplicate as Episode ${nextEpNum}.`);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Clone Error', err?.message || 'Could not duplicate episode.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Episode
  const handleDeleteEpisode = async () => {
    if (!deleteEpId) return;
    try {
      setIsSaving(true);
      await deleteDocumentary(deleteEpId);
      setDeleteEpId(null);
      showSuccess('Episode Deleted', 'Documentary episode removed from database.');
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Delete Error', err?.message || 'Could not delete episode.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to Canonical 4-Part Series
  const handleResetAllEpisodes = async () => {
    try {
      setIsSaving(true);
      await resetDocumentaries();
      setShowResetModal(false);
      showSuccess('Archive Restored', 'The canonical 4-part documentary series has been re-seeded.');
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Reset Error', err?.message || 'Could not restore original episodes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Move Episode Order Up or Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= episodes.length) return;

    const current = episodes[index];
    const target = episodes[targetIndex];

    try {
      setIsSaving(true);
      const currentOrder = current.order_index ?? current.episode_number;
      const targetOrder = target.order_index ?? target.episode_number;

      // Swap orders
      await updateDocumentary(current.id, { order_index: targetOrder });
      await updateDocumentary(target.id, { order_index: currentOrder });

      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Reorder Error', err?.message || 'Could not reorder episode.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter episodes by search
  const filteredEpisodes = episodes.filter((ep) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ep.title.toLowerCase().includes(q) ||
      ep.description.toLowerCase().includes(q) ||
      (ep.topics && ep.topics.toLowerCase().includes(q)) ||
      (ep.badge_label && ep.badge_label.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded sound-cabinet border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
            <Film className="w-4 h-4" />
            <span>Documentary & Archival Video Management</span>
            <span aria-hidden="true">·</span>
            <span>SQLite Backed</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
            "DJ ITAL: THE JOURNEY" SERIES
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl">
            Edit and add episodes, change thumbnail photography, customize the section badge and heading, configure YouTube URLs, and preview the live documentary section in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Episode</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('episodes')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'episodes'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Episodes & Archive Tapes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-900/20 dark:bg-white/20">
            {episodes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'settings'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Section Header & Settings</span>
        </button>

        <button
          onClick={() => setActiveSubTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'preview'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Live Interactive Preview</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: EPISODES & ARCHIVE TAPES */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'episodes' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search episodes by title, topics, synopsis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-amber-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 dark:border-white/10 hover:border-red-400/50 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
                title="Restore default 4 canonical episodes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to 4 Canonical Episodes</span>
              </button>
            </div>
          </div>

          {/* Episode Cards Grid */}
          {filteredEpisodes.length === 0 ? (
            <div className="p-12 text-center sound-card rounded border border-neutral-200 dark:border-white/10 space-y-3">
              <Film className="w-10 h-10 text-neutral-400 mx-auto opacity-50" />
              <h3 className="font-display font-bold text-base text-neutral-900 dark:text-white uppercase">
                {searchQuery ? 'No matching episodes found' : 'No documentary episodes yet'}
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different keyword or clear your filter.'
                  : 'Click "Add New Episode" to create your first video archival release.'}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-400 text-neutral-950 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Episode 01</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEpisodes.map((ep, idx) => {
                const thumb = normalizeImageUrl(ep.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg');
                const badge = ep.badge_label || `EPISODE ${ep.episode_number < 10 ? `0${ep.episode_number}` : ep.episode_number}`;

                return (
                  <div
                    key={ep.id}
                    className="rounded sound-card border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Thumbnail with overlay badges */}
                      <div className="relative aspect-video bg-neutral-950 overflow-hidden group">
                        <img
                          src={thumb}
                          alt={ep.title}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                        {/* Top badge */}
                        <div className="absolute top-3 left-3 px-2 py-0.5 rounded sound-tag text-white font-industrial font-black text-[10px] bg-black/90">
                          {badge}
                        </div>

                        {/* Order badge */}
                        <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-neutral-300 text-[10px] font-mono border border-white/10">
                          Position #{idx + 1}
                        </div>

                        {/* Duration pill */}
                        {ep.duration && (
                          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/90 backdrop-blur-md text-white font-industrial text-[10px] flex items-center gap-1 border border-white/10 font-bold">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{ep.duration}</span>
                          </div>
                        )}

                        {/* Play overlay button */}
                        <button
                          onClick={() => setTestVideoUrl({ title: ep.title, url: ep.youtube_url })}
                          className="hardware-btn absolute inset-0 m-auto w-12 h-12 rounded bg-amber-400 text-neutral-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                          title="Preview YouTube Video Player"
                        >
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </button>
                      </div>

                      {/* Content Info */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="space-y-1">
                          <h3 className="font-display font-black text-base sm:text-lg text-neutral-950 dark:text-white leading-snug">
                            {ep.title}
                          </h3>
                          <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 leading-relaxed">
                            {ep.description}
                          </p>
                        </div>

                        {ep.topics && (
                          <div className="pt-2 border-t border-neutral-100 dark:border-white/5 text-[11px] font-industrial text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Archive:</span> {ep.topics}
                          </div>
                        )}

                        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-1.5 truncate">
                          <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{ep.youtube_url}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="p-3 sm:p-4 bg-neutral-50 dark:bg-white/[0.02] border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      {/* Reorder arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0 || isSaving}
                          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move Up"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === filteredEpisodes.length - 1 || isSaving}
                          className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                          title="Move Down"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Edit, Duplicate, Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setTestVideoUrl({ title: ep.title, url: ep.youtube_url })}
                          className="px-2.5 py-1.5 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Test Video"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-500" />
                          <span>Test</span>
                        </button>

                        <button
                          onClick={() => handleDuplicateEpisode(ep)}
                          className="px-2.5 py-1.5 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Clone as new episode"
                        >
                          <Copy className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(ep)}
                          className="px-2.5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteEpId(ep.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete episode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: SECTION HEADER & SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded sound-cabinet border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
              <div>
                <h3 className="font-display font-bold text-lg text-neutral-950 dark:text-white uppercase">
                  Section Metadata & Header Configuration
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Control how the documentary series header, badges, and external YouTube channel links appear on the homepage.
                </p>
              </div>

              {/* Section Visibility Switch */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Number(settingsForm.is_section_visible) === 1}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      is_section_visible: e.target.checked ? 1 : 0,
                    }))
                  }
                  className="rounded border-neutral-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  Section Visible on Site
                </span>
              </label>
            </div>

            {/* Live Header Preview Pill */}
            <div className="p-4 rounded sound-card border border-amber-400/30 bg-amber-400/5 space-y-2">
              <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">
                Live Header Preview:
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white flex-wrap">
                  <span className="sound-badge">{settingsForm.badge_text}</span>
                  {settingsForm.subbadge_text && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600 dark:text-amber-400 font-bold">{settingsForm.subbadge_text}</span>
                    </>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white uppercase">
                  {settingsForm.heading}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2">
                  {settingsForm.description}
                </p>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Top Sound Badge Tag
                </label>
                <input
                  type="text"
                  value={settingsForm.badge_text}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, badge_text: e.target.value }))}
                  placeholder="[ SOUND SYSTEM DOCUMENTARY // 4-PART SERIES ]"
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-neutral-500">Appears in orange square brackets above title.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Category / Subbadge
                </label>
                <input
                  type="text"
                  value={settingsForm.subbadge_text}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, subbadge_text: e.target.value }))}
                  placeholder="ORAL HISTORY & ARCHIVE FOOTAGE"
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white font-industrial font-bold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-neutral-500">Category text shown after bullet separator.</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Main Section Heading
              </label>
              <input
                type="text"
                value={settingsForm.heading}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, heading: e.target.value }))}
                placeholder='"DJ ITAL: THE JOURNEY"'
                className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-sm font-display font-black text-neutral-950 dark:text-white uppercase focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                Section Overview Description
              </label>
              <textarea
                rows={3}
                value={settingsForm.description}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="An intimate four-part documentary chronicling the Golden Era of UK jungle music..."
                className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-white leading-relaxed focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Official YouTube Series External Button */}
            <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-950 dark:text-white">
                    Official YouTube Series Button
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Displays an external link button in the top right of the documentary section.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Number(settingsForm.show_youtube_button) === 1}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        show_youtube_button: e.target.checked ? 1 : 0,
                      }))
                    }
                    className="rounded border-neutral-300 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Enable Button
                  </span>
                </label>
              </div>

              {Number(settingsForm.show_youtube_button) === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Button Label
                    </label>
                    <input
                      type="text"
                      value={settingsForm.youtube_button_text}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, youtube_button_text: e.target.value }))
                      }
                      placeholder="OFFICIAL YOUTUBE SERIES"
                      className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs font-industrial font-bold uppercase text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      YouTube Channel / Playlist URL
                    </label>
                    <input
                      type="url"
                      value={settingsForm.youtube_series_url}
                      onChange={(e) =>
                        setSettingsForm((prev) => ({ ...prev, youtube_series_url: e.target.value }))
                      }
                      placeholder="https://www.youtube.com/@djital"
                      className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowResetSettingsModal(true)}
                className="px-3.5 py-2 rounded border border-neutral-300 dark:border-white/10 hover:border-red-400/50 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Revert to Defaults
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Section Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: LIVE INTERACTIVE PREVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded sound-cabinet border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                Live Public Site View
              </span>
              <span className="text-[11px] text-neutral-500">
                (Click any card below to test the video modal player exactly as visitors experience it)
              </span>
            </div>
            <button
              onClick={() => setActiveSubTab('episodes')}
              className="px-3 py-1.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Back to Episodes Editor
            </button>
          </div>

          <div className="rounded sound-cabinet border border-neutral-200 dark:border-white/10 overflow-hidden bg-neutral-50 dark:bg-neutral-950 p-2 sm:p-6">
            <DocumentarySection
              episodes={episodes}
              settings={settingsForm}
              isLivePreview={true}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD / EDIT EPISODE MODAL */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-2xl sound-cabinet bg-white dark:bg-neutral-950 rounded border border-neutral-200 dark:border-white/20 shadow-2xl my-8 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-500" />
                <h3 className="font-display font-black text-base uppercase text-neutral-950 dark:text-white">
                  {editingEpisode ? `Edit Episode ${editingEpisode.episode_number}` : 'Add New Documentary Episode'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEpisode} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Episode Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Episode Number *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    required
                    value={episodeForm.episode_number}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const formatted = num < 10 ? `0${num}` : `${num}`;
                      setEpisodeForm((prev) => ({
                        ...prev,
                        episode_number: num,
                        badge_label: `EPISODE ${formatted}`,
                        order_index: num,
                      }));
                    }}
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Badge Label */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Badge Pill Text
                  </label>
                  <input
                    type="text"
                    value={episodeForm.badge_label}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, badge_label: e.target.value }))}
                    placeholder="EPISODE 01"
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs font-industrial font-black text-neutral-900 dark:text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {['EPISODE 01', 'EPISODE 02', 'EPISODE 03', 'EPISODE 04', 'BONUS EPISODE', 'ARCHIVE SPECIAL'].map(
                      (preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setEpisodeForm((prev) => ({ ...prev, badge_label: preset }))}
                          className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-200 dark:bg-white/10 hover:bg-amber-400 hover:text-neutral-950 text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                        >
                          {preset}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Episode Title */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Episode Title *
                </label>
                <input
                  type="text"
                  required
                  value={episodeForm.title}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. ROOFTOPS & AIRWAVES: THE KOOL FM INCEPTION"
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-sm font-display font-black text-neutral-950 dark:text-white uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Duration & Action Button Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Duration Text (e.g. 22 MIN)
                  </label>
                  <input
                    type="text"
                    value={episodeForm.duration}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="22 MIN"
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs font-industrial text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                    Card Action Button Label
                  </label>
                  <input
                    type="text"
                    value={episodeForm.action_button_text}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, action_button_text: e.target.value }))}
                    placeholder="WATCH ARCHIVAL TAPE"
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs font-industrial font-bold uppercase text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* YouTube Video URL or ID */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  YouTube Video Link or Video ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={episodeForm.youtube_url}
                    onChange={(e) => setEpisodeForm((prev) => ({ ...prev, youtube_url: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/... or video ID"
                    className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Supports full YouTube URLs (<code className="font-mono">youtube.com/watch?v=xyz</code>), short links (<code className="font-mono">youtu.be/xyz</code>), or 11-char IDs.
                </p>
              </div>

              {/* Thumbnail Image with ImageInput */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Video Thumbnail Poster (16:9 Aspect Ratio)
                </label>
                <ImageInput
                  value={episodeForm.thumbnail_url}
                  onChange={(newUrl) => setEpisodeForm((prev) => ({ ...prev, thumbnail_url: newUrl }))}
                  defaultUrl="/images/hackney_pirate_radio_1790113898507.jpg"
                  aspectRatio="video"
                  helperText="Choose from Media Library, upload an image from your computer, or paste a URL."
                />
              </div>

              {/* Description / Synopsis */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Episode Synopsis & Archival Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={episodeForm.description}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="How a group of passionate East London music pioneers rigged aerials atop Hackney council towers..."
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white leading-relaxed focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Topics / Archive Tags */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300">
                  Archival Topics & Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={episodeForm.topics}
                  onChange={(e) => setEpisodeForm((prev) => ({ ...prev, topics: e.target.value }))}
                  placeholder="PIRATE RADIO HISTORY, HACKNEY TOWERS, TRANSMITTER TECH"
                  className="w-full px-3 py-2 rounded border border-neutral-300 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 text-xs font-industrial uppercase text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Card Preview Preview inside modal */}
              <div className="pt-2">
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider mb-2">
                  Card Live Preview:
                </div>
                <div className="max-w-sm mx-auto rounded sound-card border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 overflow-hidden shadow-md">
                  <div className="relative aspect-video bg-neutral-900">
                    <img
                      src={normalizeImageUrl(episodeForm.thumbnail_url || '/images/dj_ital_hero_1790112374509.jpg')}
                      alt={episodeForm.title || 'Thumbnail'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded sound-tag text-white font-industrial font-black text-[9px] bg-black/90">
                      {episodeForm.badge_label || `EPISODE 0${episodeForm.episode_number}`}
                    </div>
                    {episodeForm.duration && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/90 text-white font-industrial text-[9px] flex items-center gap-1 border border-white/10">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        <span>{episodeForm.duration}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="font-display font-bold text-xs uppercase text-neutral-950 dark:text-white truncate">
                      {episodeForm.title || 'Untitled Episode'}
                    </h4>
                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {episodeForm.description || 'No description entered yet.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving Episode...' : editingEpisode ? 'Update Episode' : 'Create Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* VIDEO PREVIEW TEST MODAL */}
      {/* ------------------------------------------------------------- */}
      {testVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded sound-cabinet bg-neutral-950 border border-white/20 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 text-white">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="font-display font-black text-sm uppercase tracking-wide truncate max-w-md text-white">
                  Preview: {testVideoUrl.title}
                </span>
              </div>
              <button
                onClick={() => setTestVideoUrl(null)}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                src={extractYouTubeEmbedUrl(testVideoUrl.url)}
                title={testVideoUrl.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteEpId !== null}
        title="Delete Documentary Episode"
        message="Are you sure you want to delete this documentary episode? This will remove it from the SQLite database and website."
        confirmLabel="Delete Episode"
        isDestructive
        onConfirm={handleDeleteEpisode}
        onCancel={() => setDeleteEpId(null)}
      />

      {/* Reset All Episodes Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetModal}
        title="Reset All Documentary Episodes"
        message="Are you sure you want to revert to the canonical 4-part series ('Rooftops & Airwaves', 'The Dubplate Culture', 'Vital Fest Genesis', and 'From Underground Pirate to V&A Museum')? Any customized episodes will be replaced with the default master recordings."
        confirmLabel="Restore 4 Canonical Episodes"
        isDestructive
        onConfirm={handleResetAllEpisodes}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Reset Settings Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetSettingsModal}
        title="Reset Section Header Settings"
        message="Restore section title, badge text, and YouTube channel link to their default master values?"
        confirmLabel="Revert Header Settings"
        isDestructive={false}
        onConfirm={handleResetSettings}
        onCancel={() => setShowResetSettingsModal(false)}
      />
    </div>
  );
};
