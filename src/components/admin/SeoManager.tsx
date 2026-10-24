import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Share2,
  FileCode,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Eye,
  Info,
} from 'lucide-react';
import {
  SeoSettingsData,
  getSeoSettings,
  updateSeoSettings,
  resetSeoSettings,
  getProfile,
  ProfileData,
} from '../../db/sqlite';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import { ImageInput } from './ImageInput';
import { ComponentLoadingOverlay } from './ComponentLoadingOverlay';

export interface SeoManagerProps {
  onRefresh?: () => void;
}

export const SeoManager: React.FC<SeoManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { isSaving, savingMessage, withSaving } = useSaving();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewPlatform, setPreviewPlatform] = useState<'google' | 'social'>('google');

  const [formData, setFormData] = useState<SeoSettingsData>({
    id: 1,
    site_title: 'DJ Ital Official | Jungle & D&B Pioneer & Vital Fest',
    meta_description:
      'Official archive and booking portal for UK jungle pioneer DJ Ital (Kool FM 94.5, Vital Fest, and V&A East exhibition honouree). Explore live dubplates, audio sets, event dates, and festival bookings.',
    meta_keywords:
      'DJ Ital, UK Jungle, Drum and Bass, D&B, Kool FM 94.5, Vital Fest, Dubplate, Sound System Culture, Dubplate Mastery, London DJ booking, 164 BPM, V&A Museum Music',
    canonical_url: '',
    og_image_url: '/images/dj_ital_hero_1790112374509.jpg',
    og_type: 'website',
    twitter_handle: '@djital',
    robots_index: 'index, follow',
    author_name: 'DJ Ital',
    structured_data_enabled: 1,
    google_site_verification: '',
    bing_site_verification: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [seoData, profileData] = await Promise.all([
        getSeoSettings(),
        getProfile().catch(() => null),
      ]);
      setFormData(seoData);
      setProfile(profileData);
    } catch (err: any) {
      showError('Failed to load SEO settings', err?.message || 'Database error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field: keyof SeoSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      await withSaving(async () => {
        await updateSeoSettings(formData);
        onRefresh?.();
      }, 'Saving SEO and meta tag settings...');
      showSuccess('SEO Settings Saved', 'Search engine and social sharing configuration updated successfully.');
    } catch (err: any) {
      showError('Failed to save SEO settings', err?.message || 'Database error');
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all SEO settings to factory defaults?')) return;
    try {
      await withSaving(async () => {
        await resetSeoSettings();
        await loadData();
        onRefresh?.();
      }, 'Restoring factory SEO settings...');
      showSuccess('Defaults Restored', 'SEO settings reset to sound system defaults.');
    } catch (err: any) {
      showError('Reset failed', err?.message || 'Database error');
    }
  };

  const handleAutoFillDomain = () => {
    if (typeof window !== 'undefined') {
      handleChange('canonical_url', window.location.origin);
      showSuccess('Domain Filled', `Set canonical URL to ${window.location.origin}`);
    }
  };

  // Keywords parsed as pills
  const keywordList = useMemo(() => {
    return formData.meta_keywords
      ? formData.meta_keywords
          .split(',')
          .map((k) => k.trim())
          .filter(Boolean)
      : [];
  }, [formData.meta_keywords]);

  // Length calculations & recommendations
  const titleLength = formData.site_title.length;
  const descLength = formData.meta_description.length;

  const isTitleOptimal = titleLength >= 40 && titleLength <= 65;
  const isDescOptimal = descLength >= 110 && descLength <= 165;

  // SEO Health calculation
  const seoChecklist = useMemo(() => {
    const checks = [
      {
        label: 'Title Tag Length',
        passed: isTitleOptimal,
        hint: `${titleLength} chars (Recommended: 40-65 chars)`,
      },
      {
        label: 'Meta Description Length',
        passed: isDescOptimal,
        hint: `${descLength} chars (Recommended: 120-160 chars)`,
      },
      {
        label: 'Keywords Configured',
        passed: keywordList.length >= 3,
        hint: `${keywordList.length} keywords defined`,
      },
      {
        label: 'Open Graph Image',
        passed: Boolean(formData.og_image_url?.trim()),
        hint: formData.og_image_url ? 'Social preview image set' : 'Missing preview image',
      },
      {
        label: 'Search Engine Indexing',
        passed: formData.robots_index.includes('index'),
        hint: formData.robots_index,
      },
      {
        label: 'Schema.org Structured Data',
        passed: formData.structured_data_enabled === 1,
        hint: formData.structured_data_enabled ? 'Active (MusicGroup + Person)' : 'Disabled',
      },
    ];
    const score = Math.round((checks.filter((c) => c.passed).length / checks.length) * 100);
    return { checks, score };
  }, [isTitleOptimal, isDescOptimal, titleLength, descLength, keywordList, formData]);

  // Generated JSON-LD Preview string
  const jsonLdPreview = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://djital.co.uk';
    const canonical = formData.canonical_url?.trim() || origin;
    const ogImg = formData.og_image_url?.startsWith('http')
      ? formData.og_image_url
      : `${origin}${formData.og_image_url || '/images/dj_ital_hero_1790112374509.jpg'}`;

    return JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${canonical}#website`,
            url: canonical,
            name: `${formData.author_name || 'DJ Ital'} Official Sound System Archive`,
            description: formData.meta_description,
          },
          {
            '@type': ['MusicGroup', 'Person'],
            '@id': `${canonical}#artist`,
            name: formData.author_name || 'DJ Ital',
            alternateName: profile?.stage_name || 'DjItal 164bpm',
            url: canonical,
            description: formData.meta_description,
            image: ogImg,
            genre: ['Jungle', 'Drum and Bass', 'Sound System', 'Dubplate'],
          },
        ],
      },
      null,
      2
    );
  }, [formData, profile]);

  const handleCopyJsonLd = () => {
    navigator.clipboard.writeText(jsonLdPreview);
    setCopiedJsonLd(true);
    showSuccess('Copied to Clipboard', 'Schema.org JSON-LD structured data copied.');
    setTimeout(() => setCopiedJsonLd(false), 2500);
  };

  const displayUrl = formData.canonical_url
    ? formData.canonical_url.replace(/^https?:\/\//, '')
    : typeof window !== 'undefined'
    ? window.location.host
    : 'djital.co.uk';

  return (
    <div className="space-y-6 relative">
      <ComponentLoadingOverlay
        isSaving={isLoading || isSaving}
        message={isLoading ? 'Loading SEO configuration...' : savingMessage || 'Saving SEO configuration...'}
      />

      {/* Header Banner */}
      <div className="sound-card rounded-xl p-6 bg-gradient-to-r from-neutral-900 via-neutral-900 to-amber-950/30 border border-neutral-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-wider">
              SEO &amp; Search Engine Optimization
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Configure Google search results, social media preview cards (OpenGraph / Twitter), sitemaps, crawlers, and Schema.org rich snippets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded text-xs font-mono font-bold border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="hover-shimmer px-5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save SEO Settings'}</span>
          </button>
        </div>
      </div>

      {/* SEO Health Score & Quick Crawl Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Readiness Meter */}
        <div className="sound-card rounded-xl p-5 border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">SEO Readiness Score</span>
            <span
              className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                seoChecklist.score >= 80
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
              }`}
            >
              {seoChecklist.score}% OPTIMIZED
            </span>
          </div>
          <div className="mt-3 text-3xl font-display font-black tabular-nums text-neutral-950 dark:text-white">
            {seoChecklist.score}/100
          </div>
          <div className="w-full bg-neutral-200 dark:bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                seoChecklist.score >= 80 ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${seoChecklist.score}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2">
            Based on Google &amp; OpenGraph best practices.
          </p>
        </div>

        {/* Live Sitemap Link */}
        <a
          href="/sitemap.xml"
          target="_blank"
          rel="noopener noreferrer"
          className="sound-card rounded-xl p-5 border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-400 dark:hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span>SITEMAP.XML</span>
            <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-2 text-base font-display font-bold text-neutral-950 dark:text-white group-hover:text-amber-500 transition-colors">
            Dynamic XML Sitemap
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Auto-generated endpoint indexing all releases, mixes, documentary, events, and archive anchors.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>HTTP 200 · Active</span>
          </div>
        </a>

        {/* Live Robots.txt Link */}
        <a
          href="/robots.txt"
          target="_blank"
          rel="noopener noreferrer"
          className="sound-card rounded-xl p-5 border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 hover:border-amber-400 dark:hover:border-amber-400 transition-colors group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-neutral-500 dark:text-neutral-400">
            <span>ROBOTS.TXT</span>
            <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-amber-500 transition-colors" />
          </div>
          <div className="mt-2 text-base font-display font-bold text-neutral-950 dark:text-white group-hover:text-amber-500 transition-colors">
            Crawler Directives
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
            Protects private administrative panels while allowing search crawlers full access to public pages.
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            <span>HTTP 200 · Active</span>
          </div>
        </a>
      </div>

      {/* Interactive Real-Time Search & Social Preview Simulator */}
      <div className="sound-card rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-neutral-950 dark:text-white uppercase tracking-wider text-sm">
              Live Search Engine &amp; Social Link Simulator
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Platform Toggle */}
            <div className="inline-flex rounded-lg border border-neutral-200 dark:border-white/10 p-0.5 bg-neutral-100 dark:bg-black/30 text-xs">
              <button
                type="button"
                onClick={() => setPreviewPlatform('google')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  previewPlatform === 'google'
                    ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950'
                }`}
              >
                Google Search
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlatform('social')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  previewPlatform === 'social'
                    ? 'bg-white dark:bg-white/15 text-neutral-950 dark:text-white shadow-sm font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950'
                }`}
              >
                Social Card (OG / X)
              </button>
            </div>

            {/* Device Toggle for Google Preview */}
            {previewPlatform === 'google' && (
              <div className="inline-flex rounded-lg border border-neutral-200 dark:border-white/10 p-0.5 bg-neutral-100 dark:bg-black/30 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-white dark:bg-white/15 text-amber-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Desktop Preview"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-white dark:bg-white/15 text-amber-500 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Mobile Preview"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview Screen */}
        <div className="pt-5">
          {previewPlatform === 'google' ? (
            <div
              className={`rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#202124] p-4 sm:p-5 transition-all shadow-inner ${
                previewDevice === 'mobile' ? 'max-w-md mx-auto' : 'w-full'
              }`}
            >
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200 dark:border-neutral-700">
                  <span className="text-[10px] font-mono font-black text-amber-500">DJ</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] text-neutral-800 dark:text-[#dadce0] font-sans truncate font-medium">
                    {displayUrl}
                  </div>
                  <div className="text-[10px] text-neutral-500 dark:text-[#bdc1c6] font-mono truncate">
                    https://{displayUrl} › sound-system-vault
                  </div>
                </div>
              </div>

              <div className="mt-1">
                <h4 className="text-base sm:text-lg font-sans font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer line-clamp-1">
                  {formData.site_title || 'DJ Ital Official | Jungle & D&B Pioneer & Vital Fest'}
                </h4>
                <p className="mt-1 text-xs sm:text-sm font-sans text-neutral-700 dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                  {formData.meta_description ||
                    'Official archive and booking portal for UK jungle pioneer DJ Ital (Kool FM 94.5, Vital Fest, and V&A East exhibition honouree). Explore live dubplates, audio sets, event dates, and festival bookings.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto rounded-xl border border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-950 overflow-hidden shadow-lg">
              {/* Card Image */}
              <div className="relative aspect-[1200/630] bg-neutral-900 overflow-hidden flex items-center justify-center">
                {formData.og_image_url ? (
                  <img
                    src={formData.og_image_url}
                    alt="Social Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/dj_ital_hero_1790112374509.jpg';
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <Share2 className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                    <span className="text-xs font-mono text-neutral-500">No Social Image Set</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-white">
                  1200 × 630 Preview
                </div>
              </div>

              {/* Card Metadata */}
              <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-white/10">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {displayUrl}
                </div>
                <div className="text-sm font-sans font-bold text-neutral-950 dark:text-white mt-1 line-clamp-1">
                  {formData.site_title}
                </div>
                <div className="text-xs font-sans text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                  {formData.meta_description}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Core Search Engine Meta Tags */}
        <div className="sound-card rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
            <Search className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-neutral-950 dark:text-white uppercase tracking-wider text-sm">
              Primary Search Engine Meta Tags
            </h3>
          </div>

          {/* Page Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Page Title Tag (`&lt;title&gt;`)
              </label>
              <span
                className={`font-mono text-[11px] ${
                  isTitleOptimal ? 'text-emerald-500 font-bold' : 'text-amber-500'
                }`}
              >
                {titleLength} / 60 chars {isTitleOptimal ? '· (Optimal)' : '· (Rec: 40-65)'}
              </span>
            </div>
            <input
              type="text"
              value={formData.site_title}
              onChange={(e) => handleChange('site_title', e.target.value)}
              placeholder="e.g. DJ Ital Official | Jungle & D&B Pioneer & Vital Fest"
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Appears as the primary clickable headline in Google, Bing, and web browser tabs.
            </p>
          </div>

          {/* Meta Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Meta Description (`meta[name="description"]`)
              </label>
              <span
                className={`font-mono text-[11px] ${
                  isDescOptimal ? 'text-emerald-500 font-bold' : 'text-amber-500'
                }`}
              >
                {descLength} / 160 chars {isDescOptimal ? '· (Optimal)' : '· (Rec: 120-160)'}
              </span>
            </div>
            <textarea
              rows={3}
              value={formData.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              placeholder="Provide a compelling 1-2 sentence summary of DJ Ital, Kool FM 94.5 heritage, dubplates, audio mixes, and booking enquiries."
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Displayed below the title in search engine result pages. Encourages click-throughs from listeners and festival promoters.
            </p>
          </div>

          {/* Meta Keywords */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                Meta Keywords (Comma-separated)
              </label>
              <span className="font-mono text-[11px] text-neutral-500">{keywordList.length} tags</span>
            </div>
            <input
              type="text"
              value={formData.meta_keywords}
              onChange={(e) => handleChange('meta_keywords', e.target.value)}
              placeholder="e.g. DJ Ital, UK Jungle, Drum and Bass, Kool FM 94.5, Vital Fest, Dubplate Mastery"
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
            />
            {keywordList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {keywordList.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Canonical URL & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                  Canonical URL
                </label>
                <button
                  type="button"
                  onClick={handleAutoFillDomain}
                  className="text-[10px] font-mono text-amber-600 hover:text-amber-500 dark:text-amber-400 underline cursor-pointer"
                >
                  Use current host
                </button>
              </div>
              <input
                type="url"
                value={formData.canonical_url}
                onChange={(e) => handleChange('canonical_url', e.target.value)}
                placeholder="https://djital.co.uk"
                className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Prevents duplicate content penalties if accessible via multiple domains or HTTP/HTTPS.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                Author / Artist Meta
              </label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => handleChange('author_name', e.target.value)}
                placeholder="DJ Ital"
                className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Injected into `meta[name="author"]` and JSON-LD entity graph.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Social Media Link Sharing (Open Graph & Twitter / X) */}
        <div className="sound-card rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
            <Share2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-neutral-950 dark:text-white uppercase tracking-wider text-sm">
              Social Media Link Sharing (Open Graph &amp; Twitter / X)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* OG Image Input */}
            <div>
              <ImageInput
                label="Social Share Preview Image (og:image)"
                value={formData.og_image_url}
                onChange={(url) => handleChange('og_image_url', url)}
                defaultUrl="/images/dj_ital_hero_1790112374509.jpg"
                aspectRatio="1200 / 630"
                helperText="Optimal resolution: 1200 × 630 px. Shown when links are shared on WhatsApp, Twitter/X, iMessage, Discord, and Facebook."
              />
            </div>

            <div className="space-y-4">
              {/* Twitter / X Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                  Twitter / X Handle (`twitter:site`)
                </label>
                <input
                  type="text"
                  value={formData.twitter_handle}
                  onChange={(e) => handleChange('twitter_handle', e.target.value)}
                  placeholder="@djital"
                  className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Tags your Twitter account on shared sound sets and mixes.
                </p>
              </div>

              {/* OG Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                  Open Graph Type (`og:type`)
                </label>
                <select
                  value={formData.og_type}
                  onChange={(e) => handleChange('og_type', e.target.value)}
                  className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
                >
                  <option value="website">website (Standard recommended)</option>
                  <option value="music.musician">music.musician (Audio &amp; Artist)</option>
                  <option value="profile">profile (Individual)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Search Engine Crawlers & Verification */}
        <div className="sound-card rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-white/10">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-neutral-950 dark:text-white uppercase tracking-wider text-sm">
              Search Engine Crawlers &amp; Webmaster Verification
            </h3>
          </div>

          {/* Robots Index Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
              Robots Crawler Directives (`meta[name="robots"]`)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-3.5 rounded border transition-colors cursor-pointer ${
                  formData.robots_index === 'index, follow'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-neutral-200 dark:border-white/10 hover:border-neutral-400'
                }`}
              >
                <input
                  type="radio"
                  name="robots_index"
                  value="index, follow"
                  checked={formData.robots_index === 'index, follow'}
                  onChange={(e) => handleChange('robots_index', e.target.value)}
                  className="mt-0.5 text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-mono font-bold text-neutral-950 dark:text-white">
                    index, follow (Recommended)
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Allow Google, Bing, DuckDuckGo to index this archive and follow dubplate links.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3.5 rounded border transition-colors cursor-pointer ${
                  formData.robots_index === 'noindex, nofollow'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-neutral-200 dark:border-white/10 hover:border-neutral-400'
                }`}
              >
                <input
                  type="radio"
                  name="robots_index"
                  value="noindex, nofollow"
                  checked={formData.robots_index === 'noindex, nofollow'}
                  onChange={(e) => handleChange('robots_index', e.target.value)}
                  className="mt-0.5 text-red-500 focus:ring-red-400"
                />
                <div>
                  <div className="text-xs font-mono font-bold text-neutral-950 dark:text-white">
                    noindex, nofollow (Private / Staging)
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Instruct search engines not to display this website in search results.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Webmaster Verifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                Google Search Console Verification Code
              </label>
              <input
                type="text"
                value={formData.google_site_verification}
                onChange={(e) => handleChange('google_site_verification', e.target.value)}
                placeholder="e.g. aBcD1234EfGhIjkLmNoPqRsTuVwXyZ"
                className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Injected into `&lt;meta name="google-site-verification" content="..."&gt;`.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider block">
                Bing Webmaster Verification Code
              </label>
              <input
                type="text"
                value={formData.bing_site_verification}
                onChange={(e) => handleChange('bing_site_verification', e.target.value)}
                placeholder="e.g. 1234567890ABCDEF1234567890ABCDEF"
                className="w-full px-3.5 py-2 rounded bg-neutral-50 dark:bg-black/30 border border-neutral-300 dark:border-white/10 text-neutral-950 dark:text-white text-xs font-mono focus:border-amber-400 focus:outline-none transition-colors"
              />
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Injected into `&lt;meta name="msvalidate.01" content="..."&gt;`.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Schema.org Structured Data (Rich Results) */}
        <div className="sound-card rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-500" />
              <h3 className="font-display font-bold text-neutral-950 dark:text-white uppercase tracking-wider text-sm">
                Schema.org Structured Data (Rich Results)
              </h3>
            </div>

            {/* Structured Data Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.structured_data_enabled === 1}
                onChange={(e) => handleChange('structured_data_enabled', e.target.checked ? 1 : 0)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  formData.structured_data_enabled === 1 ? 'bg-amber-400' : 'bg-neutral-300 dark:bg-white/20'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                    formData.structured_data_enabled === 1 ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                {formData.structured_data_enabled === 1 ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            Schema.org structured data allows Google to understand DJ Ital as an official{' '}
            <strong className="text-amber-500">MusicGroup</strong> and <strong className="text-amber-500">Person</strong> entity, enabling rich search features, festival tour date cards, and knowledge panels.
          </p>

          {/* JSON-LD Preview Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Generated JSON-LD Graph Preview</span>
              </span>
              <button
                type="button"
                onClick={handleCopyJsonLd}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 text-[11px] font-mono transition-colors cursor-pointer"
              >
                {copiedJsonLd ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedJsonLd ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-neutral-950 text-neutral-300 text-[11px] font-mono overflow-x-auto max-h-56 border border-neutral-800">
              {jsonLdPreview}
            </pre>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl sound-card border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/60">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            <Info className="w-4 h-4 text-amber-500" />
            <span>Changes take effect immediately on public site and sitemap.</span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="hover-shimmer px-6 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All SEO Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
