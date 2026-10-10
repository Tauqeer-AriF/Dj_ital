import React, { useState, useEffect } from 'react';
import {
  Save,
  Check,
  FileText,
  Image as ImageIcon,
  Speaker,
  Disc3,
  Download,
  RotateCcw,
  Sparkles,
  FolderArchive,
} from 'lucide-react';
import { ProfileData, updateProfile } from '../../db/sqlite';
import { ImageInput } from './ImageInput';
import { MediaPickerModal } from './MediaPickerModal';

interface EPKManagerProps {
  profile: ProfileData | null;
  onRefresh: () => void;
}

export const EPKManager: React.FC<EPKManagerProps> = ({ profile, onRefresh }) => {
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isPdfPickerOpen, setIsPdfPickerOpen] = useState(false);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onRefresh();
  };

  if (!profile) return null;

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Electronic Press Kit (EPK) Management</span>
          </div>
          <h3 className="text-2xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
            Press Photos, Tech Rider & Logo Assets
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Configure hi-res downloadable photography, technical rider equipment specifications, and brand marks.
          </p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>EPK Specifications Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Hi-Res Press Photos */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <ImageIcon className="w-4 h-4" />
            <span>1. Hi-Res Press Photography (Print & Digital Flyers)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                Landscape Press Photo (16:9 / 16:10)
              </span>
              <ImageInput
                value={formData.epk_press_photo_landscape || ''}
                onChange={(newUrl) =>
                  setFormData((prev) => ({ ...prev, epk_press_photo_landscape: newUrl }))
                }
                defaultUrl="/images/dj_ital_hero_1790112374509.jpg"
                aspectRatio="landscape"
                helperText="Primary horizontal photo used on festival line-up announcement cards."
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-neutral-500 uppercase">
                Portrait / Studio Archive Press Photo
              </span>
              <ImageInput
                value={formData.epk_press_photo_portrait || ''}
                onChange={(newUrl) =>
                  setFormData((prev) => ({ ...prev, epk_press_photo_portrait: newUrl }))
                }
                defaultUrl="/images/kool_fm_vintage_1790112400005.jpg"
                aspectRatio="landscape"
                helperText="Vertical / square archive shot for magazine print and festival booklets."
              />
            </div>
          </div>
        </div>

        {/* Section 2: Technical Rider & Stage Specifications */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            <Speaker className="w-4 h-4" />
            <span>2. Technical Rider & Sound Specifications</span>
          </div>

          <p className="text-xs text-neutral-500">
            Promoters and festival stage managers can download or copy this exact text directly from the EPK modal.
          </p>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Stage Equipment, Turntable Calibration, Monitors & Hospitality Specs
            </label>
            <textarea
              rows={12}
              value={formData.tech_rider_text || ''}
              onChange={(e) => setFormData({ ...formData, tech_rider_text: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl bg-neutral-950 font-mono text-xs text-neutral-200 leading-relaxed border border-neutral-800 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Section 3: Official Logos & Download Links */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            <Disc3 className="w-4 h-4" />
            <span>3. Official Brand Assets & PDF Bio Link</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Downloadable PDF Bio Document Link / URL
                </label>
                <button
                  type="button"
                  onClick={() => setIsPdfPickerOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  <FolderArchive className="w-3 h-3" />
                  <span>Choose from Media Library</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.epk_pdf_url || ''}
                onChange={(e) => setFormData({ ...formData, epk_pdf_url: e.target.value })}
                placeholder="/assets/DJ_ITAL_Official_EPK_2026.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  Official Logo File (PNG / SVG URL)
                </label>
                <button
                  type="button"
                  onClick={() => setIsLogoPickerOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  <FolderArchive className="w-3 h-3" />
                  <span>Choose from Media Library</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.logo_url || formData.epk_logo_png || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    logo_url: e.target.value,
                    epk_logo_png: e.target.value,
                  })
                }
                placeholder="/images/vital_fest_logo.png"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-400/20 active:scale-98 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save EPK Configuration</span>
          </button>
        </div>
      </form>

      {/* PDF Picker Modal */}
      <MediaPickerModal
        isOpen={isPdfPickerOpen}
        onClose={() => setIsPdfPickerOpen(false)}
        onSelect={(selectedUrl) => {
          setFormData((prev) => ({ ...prev, epk_pdf_url: selectedUrl }));
        }}
        title="Select EPK PDF Document from Media Library"
        allowedType="all"
        selectedUrl={formData.epk_pdf_url}
      />

      {/* Logo Picker Modal */}
      <MediaPickerModal
        isOpen={isLogoPickerOpen}
        onClose={() => setIsLogoPickerOpen(false)}
        onSelect={(selectedUrl) => {
          setFormData((prev) => ({
            ...prev,
            logo_url: selectedUrl,
            epk_logo_png: selectedUrl,
          }));
        }}
        title="Select Official Logo from Media Library"
        allowedType="image"
        selectedUrl={formData.logo_url || formData.epk_logo_png}
      />
    </div>
  );
};
