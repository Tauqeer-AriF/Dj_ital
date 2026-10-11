import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Layers,
  Radio,
  Landmark,
  Calendar,
  Film,
  Disc3,
  ExternalLink,
} from 'lucide-react';
import { SiteMediaData, getSiteMedia, updateSiteMedia, resetSiteMedia, resetAllSiteMedia } from '../../db/sqlite';
import { ImageInput } from './ImageInput';
import { ConfirmModal } from './ConfirmModal';

interface SiteMediaManagerProps {
  onRefresh: () => void;
}

export const SiteMediaManager: React.FC<SiteMediaManagerProps> = ({ onRefresh }) => {
  const [mediaList, setMediaList] = useState<SiteMediaData[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const loadMedia = async () => {
    const list = await getSiteMedia();
    setMediaList(list);
    const map: Record<string, string> = {};
    list.forEach((item) => {
      map[item.key] = item.image_url;
    });
    setLocalValues(map);
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleImageChange = async (key: string, newUrl: string) => {
    setLocalValues((prev) => ({ ...prev, [key]: newUrl }));
    await updateSiteMedia(key, newUrl);
    setSavedKey(key);
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2500);
    onRefresh();
  };

  const handleResetSingle = async (key: string) => {
    await resetSiteMedia(key);
    await loadMedia();
    setSavedKey(key);
    setTimeout(() => setSavedKey((prev) => (prev === key ? null : prev)), 2500);
    onRefresh();
  };

  const handleResetAll = async () => {
    await resetAllSiteMedia();
    await loadMedia();
    setShowResetAllModal(false);
    onRefresh();
  };

  const sections = ['All', 'Hero Section', 'Heritage & V&A Museum', 'Vital Fest & Events', 'Pirate Radio Archives', 'Dubplates & Studio', 'Documentary Series'];

  const filteredMedia = mediaList.filter((item) => {
    if (activeFilter === 'All') return true;
    return item.section === activeFilter;
  });

  const getSectionIcon = (section: string) => {
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
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 uppercase font-bold tracking-wider">
            <Layers className="w-4 h-4" />
            <span>Website Media Control Centre</span>
          </div>
          <h3 className="text-2xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
            Site Images & Visual Assets
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Customise every image on the website in real-time: upload files from your device, choose from archive photography, or paste custom URLs. Changes persist directly into the SQLite database.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowResetAllModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-white/10 hover:border-rose-400 text-neutral-700 dark:text-neutral-300 hover:text-rose-500 text-xs font-mono font-medium transition-colors bg-neutral-100 dark:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Images</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {sections.map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setActiveFilter(sec)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeFilter === sec
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'bg-neutral-200/70 dark:bg-neutral-900/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white border border-neutral-300/60 dark:border-white/5'
            }`}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredMedia.map((item) => {
          const currentValue = localValues[item.key] || item.image_url;
          const isSaved = savedKey === item.key;
          const isHero = item.key === 'hero_image';

          return (
            <div
              key={item.key}
              className={`p-6 rounded-3xl border transition-all ${
                isHero
                  ? 'border-amber-400/60 bg-white dark:bg-neutral-900/90 shadow-md ring-1 ring-amber-400/30'
                  : 'border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-4 border-b border-neutral-100 dark:border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 text-[10px] font-mono font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                      {getSectionIcon(item.section)}
                      <span>{item.section}</span>
                    </span>
                    {isHero && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400 text-neutral-950 font-black tracking-wider uppercase">
                        PRIMARY HERO
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                    {item.label}
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {item.description}
                  </p>
                </div>

                {isSaved && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold animate-pulse shrink-0">
                    <Check className="w-4 h-4" />
                    <span>Saved to SQLite!</span>
                  </div>
                )}
              </div>

              {/* Image Input Control */}
              <ImageInput
                value={currentValue}
                onChange={(newUrl) => handleImageChange(item.key, newUrl)}
                defaultUrl={item.default_url}
                label="Image Source"
                helperText={`Target slot: ${item.key} · Updates live on public site instantly.`}
                aspectRatio={isHero ? 'landscape' : 'video'}
              />
            </div>
          );
        })}
      </div>

      {/* Reset All Confirm Modal */}
      {showResetAllModal && (
        <ConfirmModal
          title="Reset All Site Images to Defaults?"
          description="This will restore all hero, exhibition, festival, and documentary images back to their authentic default London archive photography in the SQLite database."
          confirmLabel="Yes, Reset All Images"
          onConfirm={handleResetAll}
          onCancel={() => setShowResetAllModal(false)}
        />
      )}
    </div>
  );
};
