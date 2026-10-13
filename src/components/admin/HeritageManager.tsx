import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  Check,
  Landmark,
  Radio,
  Award,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Calendar,
  Disc3,
  Clock,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Sliders,
  AlertCircle,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import {
  HeritageSettingsData,
  HeritageCredentialData,
  HeritageChapterData,
  HeritageMilestoneData,
  HeritageFullData,
  getHeritageFullData,
  updateHeritageSettings,
  resetHeritageSettings,
  createHeritageCredential,
  updateHeritageCredential,
  deleteHeritageCredential,
  createHeritageChapter,
  updateHeritageChapter,
  deleteHeritageChapter,
  createHeritageMilestone,
  updateHeritageMilestone,
  deleteHeritageMilestone,
  DEFAULT_HERITAGE_SETTINGS,
} from '../../db/sqlite';
import { ImageInput } from './ImageInput';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { HeritageVaSection } from '../HeritageVaSection';

interface HeritageManagerProps {
  onRefresh: () => void;
}

type SubTab =
  | 'general'
  | 'plaque'
  | 'residency'
  | 'credentials'
  | 'chapters'
  | 'milestones'
  | 'preview';

const AVAILABLE_ICONS = [
  { id: 'radio', label: 'Radio', icon: <Radio className="w-4 h-4" /> },
  { id: 'landmark', label: 'Museum / Landmark', icon: <Landmark className="w-4 h-4" /> },
  { id: 'award', label: 'Award', icon: <Award className="w-4 h-4" /> },
  { id: 'sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'shield', label: 'Shield', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'book', label: 'Book / History', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'disc', label: 'Vinyl Disc', icon: <Disc3 className="w-4 h-4" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
];

const COLOR_OPTIONS = [
  { id: 'amber', label: 'Gold / Amber', bgClass: 'bg-amber-400 text-neutral-950', textClass: 'text-amber-500' },
  { id: 'cyan', label: 'Cyan / Electric Blue', bgClass: 'bg-cyan-400 text-neutral-950', textClass: 'text-cyan-400' },
  { id: 'emerald', label: 'Emerald Green', bgClass: 'bg-emerald-400 text-neutral-950', textClass: 'text-emerald-400' },
  { id: 'purple', label: 'Neon Purple', bgClass: 'bg-purple-400 text-neutral-950', textClass: 'text-purple-400' },
  { id: 'red', label: 'Crimson Red', bgClass: 'bg-red-500 text-white', textClass: 'text-red-400' },
];

export const HeritageManager: React.FC<HeritageManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState<SubTab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Database Data States
  const [settings, setSettings] = useState<HeritageSettingsData | null>(null);
  const [credentials, setCredentials] = useState<HeritageCredentialData[]>([]);
  const [chapters, setChapters] = useState<HeritageChapterData[]>([]);
  const [milestones, setMilestones] = useState<HeritageMilestoneData[]>([]);

  // Credential Modal State
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [editingCred, setEditingCred] = useState<HeritageCredentialData | null>(null);
  const [deleteCredId, setDeleteCredId] = useState<number | null>(null);
  const [credForm, setCredForm] = useState({
    icon: 'radio',
    title: '',
    description: '',
    color: 'amber',
    order_index: 0,
  });

  // Chapter Modal State
  const [isChapModalOpen, setIsChapModalOpen] = useState(false);
  const [editingChap, setEditingChap] = useState<HeritageChapterData | null>(null);
  const [deleteChapId, setDeleteChapId] = useState<number | null>(null);
  const [chapForm, setChapForm] = useState({
    tab_label: '',
    title: '',
    period: '',
    content: '',
    order_index: 0,
  });

  // Milestone Modal State
  const [isMileModalOpen, setIsMileModalOpen] = useState(false);
  const [editingMile, setEditingMile] = useState<HeritageMilestoneData | null>(null);
  const [deleteMileId, setDeleteMileId] = useState<number | null>(null);
  const [mileForm, setMileForm] = useState({
    year_badge: '',
    title: '',
    description: '',
    color: 'amber',
    order_index: 0,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getHeritageFullData();
      setSettings(data.settings);
      setCredentials(data.credentials);
      setChapters(data.chapters);
      setMilestones(data.milestones);
    } catch (err: any) {
      console.error('Failed to load heritage data:', err);
      showError('Load Error', err?.message || 'Could not load heritage data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSettingsFieldChange = (field: keyof HeritageSettingsData, value: string) => {
    if (!settings) return;
    setSettings((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    try {
      setIsSaving(true);
      await updateHeritageSettings(settings);
      showSuccess('Heritage Updated', 'All general section text and exhibition settings saved successfully.');
      onRefresh();
    } catch (err: any) {
      console.error('Error saving heritage settings:', err);
      showError('Save Failed', err?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    try {
      setIsSaving(true);
      await resetHeritageSettings();
      await loadData();
      showSuccess('Reset Complete', 'Heritage settings have been reset to factory defaults.');
      setShowResetModal(false);
      onRefresh();
    } catch (err: any) {
      showError('Reset Failed', err?.message || 'Could not reset heritage settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // Credential Handlers
  // -------------------------------------------------------------
  const openCreateCred = () => {
    setEditingCred(null);
    setCredForm({
      icon: 'radio',
      title: '',
      description: '',
      color: 'amber',
      order_index: credentials.length + 1,
    });
    setIsCredModalOpen(true);
  };

  const openEditCred = (c: HeritageCredentialData) => {
    setEditingCred(c);
    setCredForm({
      icon: c.icon || 'radio',
      title: c.title,
      description: c.description,
      color: c.color || 'amber',
      order_index: c.order_index,
    });
    setIsCredModalOpen(true);
  };

  const handleCredSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credForm.title.trim() || !credForm.description.trim()) {
      showError('Validation Error', 'Title and description are required.');
      return;
    }

    try {
      if (editingCred) {
        await updateHeritageCredential(editingCred.id, credForm);
        showSuccess('Credential Updated', `"${credForm.title}" saved.`);
      } else {
        await createHeritageCredential(credForm);
        showSuccess('Credential Added', `"${credForm.title}" added to heritage credentials.`);
      }
      setIsCredModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Save Failed', err?.message || 'Could not save credential.');
    }
  };

  const handleDeleteCred = async () => {
    if (!deleteCredId) return;
    try {
      await deleteHeritageCredential(deleteCredId);
      showSuccess('Credential Deleted', 'Credential card removed.');
      setDeleteCredId(null);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete credential.');
    }
  };

  // -------------------------------------------------------------
  // Chapter Handlers
  // -------------------------------------------------------------
  const openCreateChap = () => {
    setEditingChap(null);
    setChapForm({
      tab_label: '',
      title: '',
      period: '',
      content: '',
      order_index: chapters.length + 1,
    });
    setIsChapModalOpen(true);
  };

  const openEditChap = (ch: HeritageChapterData) => {
    setEditingChap(ch);
    setChapForm({
      tab_label: ch.tab_label,
      title: ch.title,
      period: ch.period,
      content: ch.content,
      order_index: ch.order_index,
    });
    setIsChapModalOpen(true);
  };

  const handleChapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapForm.tab_label.trim() || !chapForm.title.trim() || !chapForm.content.trim()) {
      showError('Validation Error', 'Tab label, chapter title, and content are required.');
      return;
    }

    try {
      if (editingChap) {
        await updateHeritageChapter(editingChap.id, chapForm);
        showSuccess('Chapter Updated', `Chapter "${chapForm.tab_label}" saved.`);
      } else {
        await createHeritageChapter(chapForm);
        showSuccess('Chapter Created', `Chapter "${chapForm.tab_label}" created.`);
      }
      setIsChapModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Save Failed', err?.message || 'Could not save chapter.');
    }
  };

  const handleDeleteChap = async () => {
    if (!deleteChapId) return;
    try {
      await deleteHeritageChapter(deleteChapId);
      showSuccess('Chapter Removed', 'Archival chapter deleted.');
      setDeleteChapId(null);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete chapter.');
    }
  };

  // -------------------------------------------------------------
  // Milestone Handlers
  // -------------------------------------------------------------
  const openCreateMile = () => {
    setEditingMile(null);
    setMileForm({
      year_badge: "'90s",
      title: '',
      description: '',
      color: 'amber',
      order_index: milestones.length + 1,
    });
    setIsMileModalOpen(true);
  };

  const openEditMile = (m: HeritageMilestoneData) => {
    setEditingMile(m);
    setMileForm({
      year_badge: m.year_badge,
      title: m.title,
      description: m.description,
      color: m.color || 'amber',
      order_index: m.order_index,
    });
    setIsMileModalOpen(true);
  };

  const handleMileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mileForm.year_badge.trim() || !mileForm.title.trim() || !mileForm.description.trim()) {
      showError('Validation Error', 'Year badge, title, and description are required.');
      return;
    }

    try {
      if (editingMile) {
        await updateHeritageMilestone(editingMile.id, mileForm);
        showSuccess('Milestone Updated', `Milestone "${mileForm.year_badge}" updated.`);
      } else {
        await createHeritageMilestone(mileForm);
        showSuccess('Milestone Created', `Milestone "${mileForm.year_badge}" created.`);
      }
      setIsMileModalOpen(false);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Save Failed', err?.message || 'Could not save milestone.');
    }
  };

  const handleDeleteMile = async () => {
    if (!deleteMileId) return;
    try {
      await deleteHeritageMilestone(deleteMileId);
      showSuccess('Milestone Removed', 'Timeline milestone deleted.');
      setDeleteMileId(null);
      await loadData();
      onRefresh();
    } catch (err: any) {
      showError('Delete Failed', err?.message || 'Could not delete milestone.');
    }
  };

  const renderIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'radio':
        return <Radio className={className} />;
      case 'landmark':
        return <Landmark className={className} />;
      case 'award':
        return <Award className={className} />;
      case 'sparkles':
        return <Sparkles className={className} />;
      case 'shield':
        return <ShieldCheck className={className} />;
      case 'book':
        return <BookOpen className={className} />;
      case 'disc':
        return <Disc3 className={className} />;
      case 'calendar':
        return <Calendar className={className} />;
      default:
        return <Landmark className={className} />;
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-12 text-neutral-500">
        <Sparkles className="w-5 h-5 animate-spin mr-2" />
        <span>Loading Heritage & V&A Archive settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded sound-cabinet bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">
            <Landmark className="w-4 h-4" />
            <span>Complete Heritage & V&A Archive Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white mt-1 uppercase tracking-tight">
            V&A Museum & Kool FM Heritage Editor
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl font-normal leading-relaxed">
            Every single line of copy, exhibition image, archival credential card, curatorial chapter, and timeline milestone is completely editable and synchronised across all devices.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-neutral-200 dark:border-white/10 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>General & Headings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('plaque')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'plaque'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>V&A Plaque & Visual</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'credentials'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Archival Credentials ({credentials.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'chapters'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Archival Chapters ({chapters.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'milestones'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Key Milestones ({milestones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('residency')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'residency'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Broadcast Residency</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-t text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live Section Preview</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: GENERAL & HEADINGS */}
      {/* ============================================================= */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-5">
            <div className="border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Section Header & Eyebrow Badges
              </h3>
              <p className="text-xs text-neutral-500">
                Customise the top badges, main title, and introductory paragraph of the Heritage section.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Primary Sound Badge
                </label>
                <input
                  type="text"
                  value={settings.badge_text || ''}
                  onChange={(e) => handleSettingsFieldChange('badge_text', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="[ V&A NATIONAL ARCHIVE // 1991—2026 ]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Secondary Eyebrow Sub-Badge
                </label>
                <input
                  type="text"
                  value={settings.subbadge_text || ''}
                  onChange={(e) => handleSettingsFieldChange('subbadge_text', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="EAST LONDON PIRATE RIGS TO NATIONAL MUSEUM"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                Main Section Heading
              </label>
              <input
                type="text"
                value={settings.heading || ''}
                onChange={(e) => handleSettingsFieldChange('heading', e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-sm font-bold focus:border-amber-400 focus:outline-none"
                placeholder="From Hackney Pirate Towers to the V&A Museum"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                Section Subtitle / Brief Description
              </label>
              <textarea
                rows={2}
                value={settings.description || ''}
                onChange={(e) => handleSettingsFieldChange('description', e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs focus:border-amber-400 focus:outline-none leading-relaxed"
                placeholder="Tracing DJ Ital's 35-year journey from pirate broadcasts across East London rooftops..."
              />
            </div>
          </div>

          <div className="p-6 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-5">
            <div className="border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Right Column: Curatorial Provenance & Lead Bio
              </h3>
              <p className="text-xs text-neutral-500">
                The overarching narrative card introducing DJ Ital's sound-system roots and history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Provenance Tag
                </label>
                <input
                  type="text"
                  value={settings.provenance_tag || ''}
                  onChange={(e) => handleSettingsFieldChange('provenance_tag', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="CURATORIAL PROVENANCE"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Card Heading
                </label>
                <input
                  type="text"
                  value={settings.provenance_heading || ''}
                  onChange={(e) => handleSettingsFieldChange('provenance_heading', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="Rooted in Hackney Sound Systems"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                Biographical Lead Paragraph
              </label>
              <textarea
                rows={4}
                value={settings.lead_paragraph || ''}
                onChange={(e) => handleSettingsFieldChange('lead_paragraph', e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
                placeholder="DJ Ital (born Martin Oscar, 1968, Hackney, London) is a British DJ, producer, and event promoter..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black uppercase text-xs tracking-wider shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save General Headings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================= */}
      {/* TAB 2: V&A PLAQUE & VISUAL */}
      {/* ============================================================= */}
      {activeTab === 'plaque' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-6">
            <div className="border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                V&A Museum Exhibition Visual & Plaque
              </h3>
              <p className="text-xs text-neutral-500">
                Customise the museum artefact photo, exhibition title, reference accession code, and museum plaque curatorial text.
              </p>
            </div>

            {/* Exhibition Photo Input */}
            <div>
              <ImageInput
                label="Museum Exhibition Showcase Image"
                helperText="Upload an exhibition photo, pick from Media Library, or provide an image URL."
                value={settings.va_image || ''}
                defaultUrl={DEFAULT_HERITAGE_SETTINGS.va_image}
                onChange={(url) => handleSettingsFieldChange('va_image', url)}
                aspectRatio="landscape"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                Image Alt Accessibility Text
              </label>
              <input
                type="text"
                value={settings.va_image_alt || ''}
                onChange={(e) => handleSettingsFieldChange('va_image_alt', e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs focus:border-amber-400 focus:outline-none"
                placeholder="Victoria and Albert Museum exhibition featuring DJ Ital original Kool FM jacket"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Plaque Header / Exhibition Title
                </label>
                <input
                  type="text"
                  value={settings.plaque_title || ''}
                  onChange={(e) => handleSettingsFieldChange('plaque_title', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="V&A EAST: THE MUSIC IS BLACK"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Plaque Museum Reference Code (# Tag)
                </label>
                <input
                  type="text"
                  value={settings.plaque_tag || ''}
                  onChange={(e) => handleSettingsFieldChange('plaque_tag', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="#VAM.2026.E14"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                Plaque Curatorial Description
              </label>
              <textarea
                rows={3}
                value={settings.plaque_description || ''}
                onChange={(e) => handleSettingsFieldChange('plaque_description', e.target.value)}
                className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
                placeholder="Exhibition loan of DJ Ital's authentic 1990s Kool FM flight jacket..."
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black uppercase text-xs tracking-wider shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Plaque Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================= */}
      {/* TAB 3: BROADCAST RESIDENCY */}
      {/* ============================================================= */}
      {activeTab === 'residency' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="p-6 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-5">
            <div className="border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Current Broadcast Residency Callout
              </h3>
              <p className="text-xs text-neutral-500">
                Control the residency callout card beneath the archival credentials.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Card Label
                </label>
                <input
                  type="text"
                  value={settings.residency_label || ''}
                  onChange={(e) => handleSettingsFieldChange('residency_label', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="Current Broadcast Residency"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Residency Schedule / Station Name
                </label>
                <input
                  type="text"
                  value={settings.residency_title || ''}
                  onChange={(e) => handleSettingsFieldChange('residency_title', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="DejaVu FM · Fortnightly Saturdays"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Status Badge Text
                </label>
                <input
                  type="text"
                  value={settings.residency_badge || ''}
                  onChange={(e) => handleSettingsFieldChange('residency_badge', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                  placeholder="ON AIR"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Badge Accent Color
                </label>
                <select
                  value={settings.residency_badge_color || 'emerald'}
                  onChange={(e) => handleSettingsFieldChange('residency_badge_color', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-semibold focus:border-amber-400 focus:outline-none cursor-pointer"
                >
                  {COLOR_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black uppercase text-xs tracking-wider shadow-md cursor-pointer transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Residency Settings'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ============================================================= */}
      {/* TAB 4: ARCHIVAL CREDENTIALS */}
      {/* ============================================================= */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Archival Credentials Cards ({credentials.length})
              </h3>
              <p className="text-xs text-neutral-500">
                These cards highlight Kool FM, Knowledge Magazine, V&A curatorial loan, and Resident Advisor.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateCred}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Credential Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {credentials.map((cred) => {
              const colorInfo = COLOR_OPTIONS.find((c) => c.id === cred.color) || COLOR_OPTIONS[0];
              return (
                <div
                  key={cred.id}
                  className="p-4 sm:p-5 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 space-y-3 relative group hover:border-amber-400/50 transition-colors shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded sound-tag ${colorInfo.textClass}`}>
                        {renderIcon(cred.icon, 'w-4 h-4')}
                      </div>
                      <div>
                        <h4 className="text-sm font-black font-industrial uppercase text-neutral-950 dark:text-white">
                          {cred.title}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-500">
                          Order #{cred.order_index} · {colorInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditCred(cred)}
                        className="p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                        title="Edit Credential"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteCredId(cred.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-red-500 cursor-pointer transition-colors"
                        title="Delete Credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {cred.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: ARCHIVAL CHAPTERS */}
      {/* ============================================================= */}
      {activeTab === 'chapters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Archival Chapters & Narrative Dossier ({chapters.length})
              </h3>
              <p className="text-xs text-neutral-500">
                Interactive tabbed chapters under Curatorial Provenance. Visitors can switch between tabs or expand all.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateChap}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Chapter</span>
            </button>
          </div>

          <div className="space-y-3">
            {chapters.map((chap) => (
              <div
                key={chap.id}
                className="p-4 sm:p-5 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-start justify-between gap-4 group hover:border-amber-400/50 transition-colors shadow-sm"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase font-industrial bg-amber-400 text-neutral-950 shadow-sm">
                      Tab: {chap.tab_label}
                    </span>
                    <span className="text-[10px] sound-tag text-neutral-500 font-mono">
                      {chap.period}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Order #{chap.order_index}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-neutral-950 dark:text-white uppercase font-industrial tracking-wide">
                    {chap.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                    {chap.content}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    type="button"
                    onClick={() => openEditChap(chap)}
                    className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                    title="Edit Chapter"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteChapId(chap.id)}
                    className="p-2 rounded hover:bg-red-500/10 text-red-500 cursor-pointer transition-colors"
                    title="Delete Chapter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 6: TIMELINE MILESTONES */}
      {/* ============================================================= */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                Historical Timeline Milestones ({milestones.length})
              </h3>
              <p className="text-xs text-neutral-500">
                The chronological milestone indicators displaying iconic years ('91, '95, '23, '26, etc.).
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateMile}
              className="flex items-center gap-1.5 px-3 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="space-y-3">
            {milestones.map((m) => {
              const colorInfo = COLOR_OPTIONS.find((c) => c.id === m.color) || COLOR_OPTIONS[0];
              return (
                <div
                  key={m.id}
                  className="p-4 rounded sound-card bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 flex items-center justify-between gap-4 group hover:border-amber-400/50 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded flex items-center justify-center text-sm font-display font-black shrink-0 shadow-md ${colorInfo.bgClass}`}
                    >
                      {m.year_badge}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white">
                          {m.title}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          #{m.order_index}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                        {m.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditMile(m)}
                      className="p-2 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 cursor-pointer transition-colors"
                      title="Edit Milestone"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteMileId(m.id)}
                      className="p-2 rounded hover:bg-red-500/10 text-red-500 cursor-pointer transition-colors"
                      title="Delete Milestone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 7: LIVE SECTION PREVIEW */}
      {/* ============================================================= */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 rounded bg-amber-400/10 border border-amber-400/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0 text-amber-500" />
              <span>
                Live Preview of the Heritage section reflecting all your current database configurations in real time.
              </span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="hover:underline font-bold cursor-pointer"
            >
              Reload Preview
            </button>
          </div>

          <div className="rounded border border-neutral-300 dark:border-white/15 overflow-hidden shadow-2xl bg-neutral-950">
            <HeritageVaSection profile={null} vaImage={settings.va_image} />
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CREDENTIAL (CREATE / EDIT) */}
      {/* ============================================================= */}
      {isCredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded sound-cabinet bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                {editingCred ? 'Edit Archival Credential' : 'Add Archival Credential'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCredModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCredSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Card Icon
                  </label>
                  <select
                    value={credForm.icon}
                    onChange={(e) => setCredForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-semibold focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {AVAILABLE_ICONS.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Color Accent
                  </label>
                  <select
                    value={credForm.color}
                    onChange={(e) => setCredForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-semibold focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={credForm.title}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="Kool FM 94.5 (Est. 1991)"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={credForm.description}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
                  placeholder="Core resident broadcaster on the undisputed pirate powerhouse..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={credForm.order_index}
                  onChange={(e) => setCredForm((prev) => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCredModalOpen(false)}
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {editingCred ? 'Save Credential' : 'Create Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: CHAPTER (CREATE / EDIT) */}
      {/* ============================================================= */}
      {isChapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded sound-cabinet bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                {editingChap ? 'Edit Archival Chapter' : 'Add Archival Chapter'}
              </h3>
              <button
                type="button"
                onClick={() => setIsChapModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChapSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Tab Label (Short)
                  </label>
                  <input
                    type="text"
                    required
                    value={chapForm.tab_label}
                    onChange={(e) => setChapForm((prev) => ({ ...prev, tab_label: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                    placeholder="Kool FM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Historical Period
                  </label>
                  <input
                    type="text"
                    value={chapForm.period}
                    onChange={(e) => setChapForm((prev) => ({ ...prev, period: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                    placeholder="1991 — 1994"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Full Chapter Title
                </label>
                <input
                  type="text"
                  required
                  value={chapForm.title}
                  onChange={(e) => setChapForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="Underground Genesis & Rooftop Transmitters"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Detailed Narrative Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={chapForm.content}
                  onChange={(e) => setChapForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
                  placeholder="Emerging from the East London underground scene, Ital joined Kool FM 94.5..."
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={chapForm.order_index}
                  onChange={(e) => setChapForm((prev) => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChapModalOpen(false)}
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {editingChap ? 'Save Chapter' : 'Create Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL: MILESTONE (CREATE / EDIT) */}
      {/* ============================================================= */}
      {isMileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded sound-cabinet bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold font-industrial uppercase text-neutral-950 dark:text-white">
                {editingMile ? 'Edit Milestone' : 'Add Historical Milestone'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMileModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Year Badge
                  </label>
                  <input
                    type="text"
                    required
                    value={mileForm.year_badge}
                    onChange={(e) => setMileForm((prev) => ({ ...prev, year_badge: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-display font-black focus:border-amber-400 focus:outline-none"
                    placeholder="'91"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                    Color Accent
                  </label>
                  <select
                    value={mileForm.color}
                    onChange={(e) => setMileForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-semibold focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    {COLOR_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  value={mileForm.title}
                  onChange={(e) => setMileForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-bold focus:border-amber-400 focus:outline-none"
                  placeholder="Joined Kool FM 94.5 Core"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Historical Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={mileForm.description}
                  onChange={(e) => setMileForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs leading-relaxed focus:border-amber-400 focus:outline-none"
                  placeholder="Broadcasting weekly sets over London from Hackney and Bow rooftop pirate rigs."
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={mileForm.order_index}
                  onChange={(e) => setMileForm((prev) => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMileModalOpen(false)}
                  className="px-4 py-2 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {editingMile ? 'Save Milestone' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={Boolean(deleteCredId)}
        title="Delete Archival Credential"
        message="Are you sure you want to remove this archival credential card?"
        confirmLabel="Delete Credential"
        isDestructive={true}
        onConfirm={handleDeleteCred}
        onCancel={() => setDeleteCredId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteChapId)}
        title="Delete Archival Chapter"
        message="Are you sure you want to delete this historical chapter?"
        confirmLabel="Delete Chapter"
        isDestructive={true}
        onConfirm={handleDeleteChap}
        onCancel={() => setDeleteChapId(null)}
      />

      <ConfirmModal
        isOpen={Boolean(deleteMileId)}
        title="Delete Timeline Milestone"
        message="Are you sure you want to delete this historical milestone?"
        confirmLabel="Delete Milestone"
        isDestructive={true}
        onConfirm={handleDeleteMile}
        onCancel={() => setDeleteMileId(null)}
      />

      <ConfirmModal
        isOpen={showResetModal}
        title="Reset Heritage to Factory Defaults"
        message="This will restore all default copy, exhibition details, and V&A credentials to their original baseline settings. Any custom changes to the Heritage section will be replaced."
        confirmLabel="Reset to Defaults"
        isDestructive={true}
        onConfirm={handleResetToDefaults}
        onCancel={() => setShowResetModal(false)}
      />
    </div>
  );
};
