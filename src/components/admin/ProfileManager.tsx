import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Check,
  User,
  Radio,
  ShoppingBag,
  MessageCircle,
  Mail,
  MapPin,
  Sparkles,
  Share2,
  Sliders,
  Globe,
  Palette,
  Type,
  Upload,
  Link2,
  RotateCcw,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  FolderArchive,
  X,
  Play,
  Pause,
  Disc3,
  ExternalLink,
  Volume2,
  RefreshCw,
  KeyRound,
  Lock,
  Clock,
} from 'lucide-react';
import { audioEngine } from '../../audio/audioEngine';
import { ProfileData, updateProfile, trackMediaUpload } from '../../db/sqlite';
import { optimizeImageFile, normalizeImageUrl } from '../../utils/imageOptimization';
import { MediaPickerModal } from './MediaPickerModal';
import { applyThemeToDOM, resolveColorHex } from '../../utils/themeEngine';
import { AppLoader } from '../AppLoader';
import { getPlayableStreamUrl, getProxyStreamUrl, isEmbedStream } from '../../utils/streamAudio';
import { useToast } from '../../context/ToastContext';

interface ProfileManagerProps {
  profile: ProfileData | null;
  onRefresh: () => void;
  onNavigateToSecurity?: () => void;
}

export const ProfileManager: React.FC<ProfileManagerProps> = ({ profile, onRefresh, onNavigateToSecurity }) => {
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showLoaderPreview, setShowLoaderPreview] = useState(false);
  const { showSuccess, showError } = useToast();
  const [logoMode, setLogoMode] = useState<'upload' | 'library' | 'url' | 'presets'>('upload');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Turntable Dub Clock & BPM Synthesiser Audition State
  const [isDubClockPlaying, setIsDubClockPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dubTrackType, setDubTrackType] = useState<'decibel' | 'vital' | 'hackney' | 'transmission'>('decibel');
  const [dubFilterCutoff, setDubFilterCutoff] = useState(18000);
  const [dubVolume, setDubVolume] = useState(0.75);

  // In-dashboard live radio stream testing
  const [testPlayingUrl, setTestPlayingUrl] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testIsBuffering, setTestIsBuffering] = useState(false);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current.removeAttribute('src');
      }
      audioEngine.stop();
      audioEngine.setOnTick(null);
    };
  }, []);

  const handleTestAudioStream = (rawUrl?: string) => {
    if (!rawUrl || !rawUrl.trim()) return;
    const url = rawUrl.trim();

    if (testPlayingUrl === url) {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current.removeAttribute('src');
      }
      setTestPlayingUrl(null);
      setTestStatus(null);
      setTestIsBuffering(false);
      return;
    }

    if (isEmbedStream(url)) {
      window.open(url, '_blank', 'noreferrer');
      return;
    }

    setTestPlayingUrl(url);
    setTestStatus('Connecting to radio stream...');
    setTestIsBuffering(true);

    const playable = getPlayableStreamUrl(url);
    if (testAudioRef.current && playable) {
      testAudioRef.current.src = playable;
      testAudioRef.current.load();
      testAudioRef.current
        .play()
        .then(() => {
          setTestIsBuffering(false);
          setTestStatus('Stream playing successfully');
        })
        .catch(() => {
          // If direct connection failed, retry via secure audio proxy
          const proxyUrl = getProxyStreamUrl(url);
          if (proxyUrl && testAudioRef.current && !testAudioRef.current.src.includes(proxyUrl)) {
            setTestStatus('Connecting via secure audio proxy...');
            testAudioRef.current.src = proxyUrl;
            testAudioRef.current.load();
            testAudioRef.current
              .play()
              .then(() => {
                setTestIsBuffering(false);
                setTestStatus('Playing stream via secure proxy');
              })
              .catch(() => {
                setTestIsBuffering(false);
                setTestStatus('Stream connection failed: check URL or mount point');
              });
          } else {
            setTestIsBuffering(false);
            setTestStatus('Stream connection error: check station or network');
          }
        });
    }
  };

  const handleBpmChange = (newBpm: number) => {
    const clamped = Math.max(140, Math.min(185, Math.round(newBpm)));
    setFormData((prev) => ({ ...prev, signature_bpm: clamped }));
    audioEngine.setBpm(clamped);
  };

  const handleToggleDubClock = () => {
    if (isDubClockPlaying) {
      audioEngine.stop();
      audioEngine.setOnTick(null);
      setIsDubClockPlaying(false);
      setActiveStep(0);
    } else {
      const currentBpm = formData.signature_bpm || 164;
      audioEngine.setVolume(dubVolume);
      audioEngine.setFilterCutoff(dubFilterCutoff);
      audioEngine.setOnTick((step) => {
        setActiveStep(step);
      });
      audioEngine.play(currentBpm, dubTrackType);
      setIsDubClockPlaying(true);
    }
  };

  const handleTrackTypeChange = (type: 'decibel' | 'vital' | 'hackney' | 'transmission') => {
    setDubTrackType(type);
    if (isDubClockPlaying) {
      const currentBpm = formData.signature_bpm || 164;
      audioEngine.play(currentBpm, type);
    }
  };

  const handleFilterChange = (hz: number) => {
    setDubFilterCutoff(hz);
    audioEngine.setFilterCutoff(hz);
  };

  const handleTriggerSubDrop = () => {
    audioEngine.triggerSubDrop();
  };

  useEffect(() => {
    if (profile) {
      const unifiedStream = (profile.stream_url || 'https://dejavufm.radioca.st/;').trim();
      setFormData({
        ...profile,
        direct_email: profile.direct_email || profile.booking_email || '',
        booking_email: profile.booking_email || profile.direct_email || '',
        stream_url: unifiedStream,
        signature_bpm: profile.signature_bpm ? Number(profile.signature_bpm) : 164,
        brand_slogan: profile.brand_slogan || 'DjItal 164bpm',
      });
    }
  }, [profile]);

  const currentLogo = formData.logo_url || formData.epk_logo_png || '/images/vital_fest_logo.png';

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      setLogoError(null);
      const dataUrl = await optimizeImageFile(file, 800, 0.95);
      setFormData((prev) => ({
        ...prev,
        logo_url: dataUrl,
        epk_logo_png: dataUrl,
      }));
      trackMediaUpload({
        title: `Official Brand Logo (${file.name})`,
        file_name: file.name,
        file_type: 'image',
        mime_type: file.type || 'image/png',
        url: dataUrl,
        source: 'Brand Logo Customiser',
        category: 'Branding',
      });
    } catch (err: any) {
      setLogoError(err?.message || 'Failed to process logo file');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleResetLogo = () => {
    setLogoError(null);
    setFormData((prev) => ({
      ...prev,
      logo_url: '/images/vital_fest_logo.png',
      epk_logo_png: '/images/vital_fest_logo.png',
    }));
  };

  const logoPresets = [
    {
      id: 'vital_fest_badge',
      name: 'Vital Fest Official Badge',
      description: 'Transparent Vector-Crisp PNG',
      url: '/images/vital_fest_logo.png',
    },
    {
      id: 'vital_fest_alt',
      name: 'Vital Fest Alternative Lockup',
      description: 'Square Festival Artwork',
      url: '/images/vital_fest_mobile_logo.jpg',
    },
    {
      id: 'vinyl_acetate',
      name: 'Decibel Acetate Roundel',
      description: '10" Dubplate Acetate Center',
      url: '/images/vinyl_dubplate_acetate_1790113879360.jpg',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = { ...formData };
      // If one email was provided while the other is empty, harmonize them
      if (payload.direct_email && !payload.booking_email) {
        payload.booking_email = payload.direct_email;
      } else if (payload.booking_email && !payload.direct_email) {
        payload.direct_email = payload.booking_email;
      }
      // Harmonize unified stream URL
      if (payload.stream_url !== undefined) {
        payload.hero_stream_url = payload.stream_url;
        payload.main_player_stream_url = payload.stream_url;
        payload.dejavu_stream_url = payload.stream_url;
      }
      if (payload.signature_bpm !== undefined) {
        payload.signature_bpm = parseInt(String(payload.signature_bpm), 10) || 164;
      }
      if (payload.brand_slogan !== undefined) {
        payload.brand_slogan = String(payload.brand_slogan).trim() || 'DjItal 164bpm';
      }
      await updateProfile(payload);
      const activeHex = resolveColorHex(payload.color_scheme, payload.custom_accent_color);
      applyThemeToDOM(activeHex, payload.font_family_preset || 'syne', payload.body_font_preset || 'jakarta', payload.color_scheme);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
      showSuccess('Profile & Theme Saved Successfully', 'All profile branding, colors, stream URLs, and contacts updated.');
      onRefresh();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      const errMsg = err?.message || 'Failed to save changes to database';
      setSubmitError(errMsg);
      showError('Failed to Save Profile', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  const colorSchemes = [
    {
      id: 'amber',
      name: 'Amber Gold',
      subtitle: 'Classic Jungle Sound System',
      bgClass: 'bg-amber-400',
      borderClass: 'border-amber-400',
      textClass: 'text-amber-400',
      hex: '#f59e0b',
    },
    {
      id: 'emerald',
      name: 'Acid Jungle Green',
      subtitle: 'Sound Clash & Dub Station',
      bgClass: 'bg-emerald-500',
      borderClass: 'border-emerald-500',
      textClass: 'text-emerald-400',
      hex: '#10b981',
    },
    {
      id: 'cyan',
      name: 'Cyber Laser Cyan',
      subtitle: 'Electric Laser Club Night',
      bgClass: 'bg-cyan-500',
      borderClass: 'border-cyan-500',
      textClass: 'text-cyan-400',
      hex: '#06b6d4',
    },
    {
      id: 'crimson',
      name: 'Sub-Bass Crimson',
      subtitle: 'Pirate Radio Fire & Dubplate',
      bgClass: 'bg-red-500',
      borderClass: 'border-red-500',
      textClass: 'text-red-400',
      hex: '#ef4444',
    },
    {
      id: 'violet',
      name: 'Dub Syndicate Violet',
      subtitle: 'Deep Underground Sub-bass',
      bgClass: 'bg-purple-500',
      borderClass: 'border-purple-500',
      textClass: 'text-purple-400',
      hex: '#8b5cf6',
    },
    {
      id: 'acid-lime',
      name: 'Acid Electric Lime',
      subtitle: '1990s Warehouse Rave',
      bgClass: 'bg-lime-500',
      borderClass: 'border-lime-500',
      textClass: 'text-lime-400',
      hex: '#84cc16',
    },
    {
      id: 'monochrome',
      name: 'Monochrome Platinum',
      subtitle: 'High-Contrast Silver & White',
      bgClass: 'bg-white',
      borderClass: 'border-white',
      textClass: 'text-white',
      hex: '#ffffff',
    },
    {
      id: 'custom',
      name: 'Custom Hex Color',
      subtitle: 'Pick Any Custom Color Wheel',
      bgClass: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
      borderClass: 'border-white/40',
      textClass: 'text-white',
      hex: formData.custom_accent_color || '#f59e0b',
    },
  ];

  const fontPresets = [
    {
      id: 'syne',
      name: 'Syne (Default)',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'Bold, expressive sound system and festival display font',
      fontFamily: "'Syne', sans-serif",
    },
    {
      id: 'space-grotesk',
      name: 'Space Grotesk',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'Cybernetic, technical underground warehouse grotesque',
      fontFamily: "'Space Grotesk', sans-serif",
    },
    {
      id: 'outfit',
      name: 'Outfit',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'Modern geometric, clean luxury typography',
      fontFamily: "'Outfit', sans-serif",
    },
    {
      id: 'bebas',
      name: 'Bebas Neue',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'All-caps ultra-bold vintage sound clash poster condensed',
      fontFamily: "'Bebas Neue', cursive, sans-serif",
    },
    {
      id: 'inter',
      name: 'Inter',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'Neutral Swiss modernist font with maximum legibility',
      fontFamily: "'Inter', sans-serif",
    },
    {
      id: 'jakarta',
      name: 'Plus Jakarta Sans',
      sample: 'DJ ITAL 168 BPM JUNGLE',
      description: 'Clean contemporary editorial geometric humanist font',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
  ];

  const bodyFontPresets = [
    {
      id: 'jakarta',
      name: 'Plus Jakarta Sans (Default)',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Modern, crisp geometric humanist body font for readability',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    {
      id: 'inter',
      name: 'Inter',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Neutral Swiss modernist interface font with sharp paragraph clarity',
      fontFamily: "'Inter', sans-serif",
    },
    {
      id: 'space-grotesk',
      name: 'Space Grotesk',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Cybernetic technical underground warehouse aesthetic',
      fontFamily: "'Space Grotesk', sans-serif",
    },
    {
      id: 'outfit',
      name: 'Outfit',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Clean luxury geometric typeface for smooth editorial flow',
      fontFamily: "'Outfit', sans-serif",
    },
    {
      id: 'mono',
      name: 'JetBrains Mono',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Underground tape archive & frequency dubplate monospace font',
      fontFamily: "'JetBrains Mono', monospace",
    },
    {
      id: 'system',
      name: 'System Native Sans',
      sample: 'Pioneering UK jungle selector, Kool FM resident, and founder of Vital Fest.',
      description: 'Ultra-fast native OS sans-serif (San Francisco / Segoe UI / Roboto)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  ];

  const selectedColorScheme = formData.color_scheme || 'amber';
  const selectedFontPreset = formData.font_family_preset || 'syne';
  const selectedBodyFontPreset = formData.body_font_preset || 'jakarta';
  const currentCustomColor = formData.custom_accent_color || '#f59e0b';

  return (
    <div className="space-y-8 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            Artist Profile and Branding Customiser
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Customise upfront taglines, custom colour palettes, font typography, radio streams, contact details, and background styles.
          </p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Check className="w-4 h-4" />
            <span>Profile & Theme Saved to SQLite!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Brand Identity: Official Logo Management */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>Official Brand & Application Logo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                Fixed Navbar · Dub Console · Turntables · EPK · Footer
              </span>
              {currentLogo !== '/images/vital_fest_logo.png' && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Default</span>
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            Upload or change your official brand mark. The selected logo updates automatically across the fixed top navigation bar, Technics SL-1210 vinyl dub console, releases vinyl center labels, press kit (EPK), and site footer.
          </p>

          {/* Dual Theme Live Logo Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Theme Background Preview */}
            <div className="p-5 rounded bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-center min-h-[140px] relative group shadow-inner">
              <span className="absolute top-2.5 left-3 text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Dark Theme Preview</span>
              </span>
              <img
                src={normalizeImageUrl(currentLogo)}
                alt="Brand Logo Dark Preview"
                className="max-h-20 max-w-[85%] object-contain filter drop-shadow-[0_2px_14px_rgba(245,158,11,0.45)] transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                }}
              />
            </div>

            {/* Light Theme Background Preview */}
            <div className="p-5 rounded bg-white border border-neutral-200 flex flex-col items-center justify-center min-h-[140px] relative group shadow-inner">
              <span className="absolute top-2.5 left-3 text-[10px] font-mono uppercase tracking-wider text-neutral-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Light Theme Preview</span>
              </span>
              <img
                src={normalizeImageUrl(currentLogo)}
                alt="Brand Logo Light Preview"
                className="max-h-20 max-w-[85%] object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                }}
              />
            </div>

            {/* Live Fixed Navbar Mini-Simulation */}
            <div className="sm:col-span-2 p-3.5 rounded bg-white/95 dark:bg-neutral-950/95 border border-neutral-200 dark:border-white/15 flex items-center justify-between text-xs shadow-md">
              <div className="flex items-center gap-3">
                <img
                  src={normalizeImageUrl(currentLogo)}
                  alt="Navbar Simulation"
                  className="h-9 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                  }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 font-display font-black text-neutral-950 dark:text-white uppercase text-base leading-none">
                    <span>{formData.stage_name ? formData.stage_name.split(' ')[0] : 'DJ'}</span>
                    <span className="text-amber-500 dark:text-amber-400">
                      {formData.stage_name ? formData.stage_name.split(' ').slice(1).join(' ') || 'ITAL' : 'ITAL'}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 inline-block animate-pulse" />
                  </div>
                  <span className="text-[8px] font-mono text-neutral-600 dark:text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
                    VITAL FEST FOUNDER
                  </span>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                <Eye className="w-3 h-3" />
                <span>Live Navbar Simulation</span>
              </span>
            </div>
          </div>

          {/* Logo Input Mode Switcher */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2 p-1 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 w-fit">
              <button
                type="button"
                onClick={() => setLogoMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  logoMode === 'upload'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Logo File</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoMode('library');
                  setIsLogoPickerOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  logoMode === 'library'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
                title="Select existing logo from Media Library"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Media Library</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  logoMode === 'url'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>URL / Path</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoMode('presets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  logoMode === 'presets'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>
            </div>

            {/* Mode: Media Library */}
            {logoMode === 'library' && (
              <div className="p-5 rounded border-2 border-dashed border-amber-400/50 bg-amber-400/5 dark:bg-amber-400/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md shrink-0">
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-950 dark:text-white">
                        Application Media Library
                      </h4>
                      <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                        Select any uploaded logo, SVG badge, or visual brand asset from your media catalogue.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLogoPickerOpen(true)}
                    className="px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono text-xs font-bold shadow-md transition-all cursor-pointer shrink-0"
                  >
                    Open Media Picker
                  </button>
                </div>
              </div>
            )}

            {/* Mode 1: File Upload */}
            {logoMode === 'upload' && (
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={handleLogoFileUpload}
                  className="hidden"
                  id="logo-file-upload-input"
                />
                <label
                  htmlFor="logo-file-upload-input"
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-white/20 hover:border-amber-400 dark:hover:border-amber-400 rounded cursor-pointer bg-neutral-50/50 dark:bg-neutral-950/40 hover:bg-amber-400/5 transition-all text-center group"
                >
                  <Upload className={`w-8 h-8 text-neutral-400 group-hover:text-amber-500 transition-colors mb-2 ${isUploadingLogo ? 'animate-bounce' : ''}`} />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                    {isUploadingLogo ? 'Optimizing and saving logo...' : 'Click to select or drag a new Logo file'}
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                    Supports PNG (with transparency), SVG vector, JPG, or WebP. Auto-compressed & stored in persistent database.
                  </span>
                </label>
              </div>
            )}

            {/* Mode 2: Direct URL */}
            {logoMode === 'url' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.logo_url || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        logo_url: val,
                        epk_logo_png: val,
                      }));
                    }}
                    placeholder="/images/vital_fest_logo.png or https://example.com/logo.png"
                    className="flex-1 px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                  {formData.logo_url && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      className="px-3 py-2.5 rounded border border-neutral-300 dark:border-white/15 text-xs font-mono font-bold hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-neutral-500">
                  Tip: Relative paths (e.g. <code className="font-mono text-amber-600 dark:text-amber-400">/images/vital_fest_logo.png</code>) or full https:// image URLs are supported.
                </p>
              </div>
            )}

            {/* Mode 3: Presets */}
            {logoMode === 'presets' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {logoPresets.map((preset) => {
                  const isSelected = currentLogo === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          logo_url: preset.url,
                          epk_logo_png: preset.url,
                        }));
                      }}
                      className={`p-3.5 rounded border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 dark:bg-neutral-800 shadow-md ring-2 ring-amber-400/50'
                          : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-white/20'
                      }`}
                    >
                      <div className="w-10 h-10 rounded bg-neutral-950 border border-white/10 flex items-center justify-center p-1 shrink-0">
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="max-h-8 max-w-8 object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {logoError && (
              <div className="flex items-center gap-1.5 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{logoError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 0: Application Color Scheme & Typography Controls */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <Palette className="w-4 h-4" />
              <span>Theme Styling: Colour Scheme & Typography Font</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Live SQLite Preference
            </span>
          </div>

          {/* Color Scheme Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <span>Primary Accent Colour Scheme & Custom Picker</span>
              </label>
              <button
                type="button"
                onClick={() => setShowLoaderPreview(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm hover:opacity-90 transition-opacity cursor-pointer border border-neutral-700 dark:border-neutral-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview App Loader</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {colorSchemes.map((scheme) => {
                const isSelected = selectedColorScheme === scheme.id;
                const isCustom = scheme.id === 'custom';
                const schemeHex = isCustom ? currentCustomColor : scheme.hex;
                return (
                  <button
                    key={scheme.id}
                    type="button"
                    onClick={() => {
                      if (isCustom) {
                        setFormData({ ...formData, color_scheme: 'custom', custom_accent_color: currentCustomColor });
                        applyThemeToDOM(currentCustomColor, selectedFontPreset, selectedBodyFontPreset, 'custom');
                      } else {
                        setFormData({ ...formData, color_scheme: scheme.id });
                        applyThemeToDOM(scheme.hex, selectedFontPreset, selectedBodyFontPreset, scheme.id);
                      }
                    }}
                    style={{
                      borderColor: isSelected ? schemeHex : undefined,
                      boxShadow: isSelected ? `0 0 0 2px ${schemeHex}40` : undefined,
                    }}
                    className={`p-3.5 rounded border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-neutral-800 shadow-md ring-2'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full shrink-0 shadow-md border border-white/20 flex items-center justify-center`}
                      style={{ backgroundColor: schemeHex }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {scheme.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {isCustom ? currentCustomColor : scheme.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Colour Input Controls */}
            {selectedColorScheme === 'custom' && (
              <div className="mt-4 p-4 rounded bg-neutral-100 dark:bg-neutral-950 border border-neutral-300 dark:border-white/15 space-y-3 animate-in fade-in-0 duration-150">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-neutral-900 dark:text-white">
                  <span>🎨 Custom Hex Colour Chooser</span>
                  <span className="text-[10px] text-neutral-500">Live Realtime Hex Engine</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 p-1.5 rounded bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-sm">
                    <input
                      type="color"
                      value={currentCustomColor}
                      onChange={(e) => {
                        const newCol = e.target.value;
                        setFormData({
                          ...formData,
                          color_scheme: 'custom',
                          custom_accent_color: newCol,
                        });
                        applyThemeToDOM(newCol, selectedFontPreset, selectedBodyFontPreset, 'custom');
                      }}
                      className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent p-0"
                    />
                    <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 pr-2">
                      Wheel Picker
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <span className="text-xs font-mono text-neutral-500 font-bold">HEX:</span>
                    <input
                      type="text"
                      value={currentCustomColor}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                        setFormData({
                          ...formData,
                          color_scheme: 'custom',
                          custom_accent_color: val,
                        });
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                          applyThemeToDOM(val, selectedFontPreset, selectedBodyFontPreset, 'custom');
                        }
                      }}
                      placeholder="#f59e0b"
                      maxLength={7}
                      className="w-36 px-3 py-2 rounded text-xs font-mono font-bold uppercase bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/15 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  {/* Quick preset colour chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {['#FF0055', '#FF7700', '#FFCC00', '#00FF99', '#00CCFF', '#9900FF', '#FF00CC'].map((quickHex) => (
                      <button
                        key={quickHex}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            color_scheme: 'custom',
                            custom_accent_color: quickHex,
                          });
                          applyThemeToDOM(quickHex, selectedFontPreset, selectedBodyFontPreset, 'custom');
                        }}
                        style={{ backgroundColor: quickHex }}
                        className="w-6 h-6 rounded border border-white/30 shadow-sm transition-transform hover:scale-110 cursor-pointer"
                        title={`Select ${quickHex}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Headline Typography Font Preset Picker */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              <span>Display Headline Font Family</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {fontPresets.map((preset) => {
                const isSelected = selectedFontPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, font_family_preset: preset.id })}
                    className={`p-4 rounded border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 dark:bg-neutral-800 shadow-md ring-2 ring-amber-400/50'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div
                      className="text-base font-bold text-neutral-950 dark:text-white tracking-wide truncate"
                      style={{ fontFamily: preset.fontFamily }}
                    >
                      {preset.sample}
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Text Font Family Picker */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Body Text & Paragraph Font Family</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {bodyFontPresets.map((preset) => {
                const isSelected = selectedBodyFontPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, body_font_preset: preset.id })}
                    className={`p-4 rounded border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 dark:bg-neutral-800 shadow-md ring-2 ring-amber-400/50'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 hover:border-neutral-400 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                        {preset.name}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 text-[10px] font-mono font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div
                      className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 line-clamp-2"
                      style={{ fontFamily: preset.fontFamily }}
                    >
                      {preset.sample}
                    </div>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 1: Signature Tempo Clock (BPM), Turntable Dub Engine & Brand Slogan */}
        <div className="p-6 rounded border border-amber-500/30 bg-amber-500/[0.03] dark:border-amber-400/30 dark:bg-amber-400/[0.03] shadow-sm backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20 dark:border-amber-400/20">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>1. Signature Tempo (BPM), Turntable Dub Clock & Slogan</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30 self-start sm:self-auto">
              Live Sound System Clock: {formData.signature_bpm || 164} BPM
            </span>
          </div>

          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Configure DJ Ital's master tempo clock and signature brand slogan. Changes here automatically synchronize the interactive Web Audio turntable engine, ambient breathing pulse, marquee ribbons, dubplate catalog badges, and application loader.
          </p>

          {/* 1. Signature Master Tempo (BPM) Controls with Quick Presets */}
          <div className="p-5 rounded bg-white dark:bg-neutral-950/70 border border-neutral-200 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5 font-mono">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Signature Master Tempo Clock (BPM)</span>
                </label>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Adjust master tempo clock (default 164 BPM) with 1-click quick presets: 160, 164, 168, 172, or 175 BPM.
                </p>
              </div>

              {/* Live BPM Badge with -1 / +1 step buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleBpmChange((formData.signature_bpm || 164) - 1)}
                  className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-sm hover:bg-amber-400 hover:text-neutral-950 transition-colors flex items-center justify-center cursor-pointer border border-neutral-300 dark:border-white/10"
                  title="Decrease 1 BPM"
                >
                  -
                </button>
                <div className="px-4 py-1.5 rounded bg-amber-400/15 border-2 border-amber-400/50 text-neutral-950 dark:text-amber-300 font-mono font-black text-lg tracking-wider tabular-nums min-w-[100px] text-center shadow-inner">
                  {formData.signature_bpm || 164} <span className="text-xs font-bold opacity-80">BPM</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleBpmChange((formData.signature_bpm || 164) + 1)}
                  className="w-8 h-8 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-bold text-sm hover:bg-amber-400 hover:text-neutral-950 transition-colors flex items-center justify-center cursor-pointer border border-neutral-300 dark:border-white/10"
                  title="Increase 1 BPM"
                >
                  +
                </button>
              </div>
            </div>

            {/* BPM Range Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                <span>140 BPM (Downbeat Dub)</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">Smooth Tempo Slider (140—185 BPM)</span>
                <span>185 BPM (High Velocity)</span>
              </div>
              <input
                type="range"
                min={140}
                max={185}
                step={1}
                value={formData.signature_bpm || 164}
                onChange={(e) => handleBpmChange(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* 1-Click Quick Presets */}
            <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-white/10">
              <span className="text-[11px] font-mono uppercase font-bold text-neutral-700 dark:text-neutral-300 block">
                1-Click Quick Tempo Presets:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { bpm: 160, label: '160 BPM', style: 'Deep Ragga Jungle' },
                  { bpm: 164, label: '164 BPM', style: 'DJ Ital Master (Default)' },
                  { bpm: 168, label: '168 BPM', style: 'Kool FM Rollers' },
                  { bpm: 172, label: '172 BPM', style: 'Clash & Sub Pressure' },
                  { bpm: 175, label: '175 BPM', style: 'Fast Tech-Step / DnB' },
                ].map((preset) => {
                  const isSelected = (formData.signature_bpm || 164) === preset.bpm;
                  return (
                    <button
                      key={preset.bpm}
                      type="button"
                      onClick={() => handleBpmChange(preset.bpm)}
                      className={`p-2.5 rounded border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400 text-neutral-950 shadow-md ring-2 ring-amber-400/50'
                          : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900/60 text-neutral-800 dark:text-neutral-200 hover:border-amber-400/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-sm">{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className={`text-[9px] font-mono font-semibold truncate mt-1 ${isSelected ? 'text-neutral-900' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {preset.style}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. Turntable Dub Clock & Real-time Synthesiser Sync */}
          <div className="p-5 rounded sound-card bg-neutral-950 text-white border border-amber-500/30 space-y-4 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Disc3 className={`w-5 h-5 text-amber-400 shrink-0 ${isDubClockPlaying ? 'animate-spin' : ''}`} />
                <div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <span>Turntable Dub Clock (Real-time Audio Engine Sync)</span>
                    <span className={`w-2 h-2 rounded-full ${isDubClockPlaying ? 'bg-red-500 animate-ping' : 'bg-neutral-600'}`} />
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-400">
                    The real-time interactive audio engine automatically syncs its beat triggers and synthesizer clocks to your selected BPM.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleToggleDubClock}
                  className={`px-4 py-2 rounded font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    isDubClockPlaying
                      ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
                  }`}
                >
                  {isDubClockPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current" />
                      <span>Stop Audition</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Audition Dub Clock</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSubDrop}
                  className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-mono text-xs font-bold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Trigger Heavy Sub-Bass 808 Drop"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sub Drop</span>
                </button>
              </div>
            </div>

            {/* 32-Step Live Sequencer Grid */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isDubClockPlaying ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'}`} />
                  <span>32-STEP REAL-TIME SEQUENCER // STEP {(activeStep + 1).toString().padStart(2, '0')}/32</span>
                </span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {((60 / (formData.signature_bpm || 164)) / 4 * 1000).toFixed(1)} ms / step
                </span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 p-2 rounded bg-black/60 border border-white/10">
                {Array.from({ length: 32 }).map((_, stepIdx) => {
                  const isCurrent = isDubClockPlaying && activeStep === stepIdx;
                  const isDownbeat = stepIdx % 4 === 0;
                  const isKick = stepIdx === 0 || stepIdx === 10 || stepIdx === 18 || stepIdx === 24;
                  return (
                    <div
                      key={stepIdx}
                      className={`h-6 rounded-xs flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                        isCurrent
                          ? 'bg-amber-400 text-neutral-950 scale-110 shadow-[0_0_12px_rgba(251,191,36,0.9)] z-10'
                          : isDownbeat
                          ? 'bg-neutral-700/80 text-white/90 border-t-2 border-amber-500/60'
                          : 'bg-neutral-800/60 text-white/50'
                      }`}
                      title={`Step ${stepIdx + 1}${isKick ? ' (Kick/Sub)' : ''}`}
                    >
                      {stepIdx + 1}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio Engine Live Parameters: Stem Style & DJ Isolator Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-neutral-400 uppercase font-bold block">
                  Procedural Track Style:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'decibel', label: 'Decibel Dub (1995)' },
                    { id: 'vital', label: 'Vital Rhythm' },
                    { id: 'hackney', label: 'Hackney Roller' },
                    { id: 'transmission', label: 'Pirate Transmission' },
                  ].map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackTypeChange(track.id as any)}
                      className={`px-2.5 py-1.5 rounded text-[11px] font-mono text-left truncate transition-colors cursor-pointer border ${
                        dubTrackType === track.id
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300 font-bold'
                          : 'border-white/10 bg-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lowpass Cutoff (DJ Filter)</span>
                  </span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {dubFilterCutoff >= 18000 ? 'OPEN (Flat)' : `${dubFilterCutoff} Hz`}
                  </span>
                </div>
                <input
                  type="range"
                  min={300}
                  max={20000}
                  step={100}
                  value={dubFilterCutoff}
                  onChange={(e) => handleFilterChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex items-center justify-between text-[9px] font-mono text-neutral-500">
                  <span>Sub Only (300Hz)</span>
                  <span>Mid Resonance</span>
                  <span>Full Range (20kHz)</span>
                </div>
              </div>
            </div>

            {/* Dub Clock Live Synchronisation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center font-mono text-xs">
              <div className="p-2 rounded bg-neutral-900/90 border border-white/5">
                <span className="text-[10px] text-neutral-500 block uppercase">Master Clock</span>
                <span className="font-bold text-amber-400 tabular-nums">{formData.signature_bpm || 164} BPM</span>
              </div>
              <div className="p-2 rounded bg-neutral-900/90 border border-white/5">
                <span className="text-[10px] text-neutral-500 block uppercase">16th Note Step</span>
                <span className="font-bold text-neutral-200 tabular-nums">
                  {((60 / (formData.signature_bpm || 164)) / 4 * 1000).toFixed(1)} ms
                </span>
              </div>
              <div className="p-2 rounded bg-neutral-900/90 border border-white/5">
                <span className="text-[10px] text-neutral-500 block uppercase">Sub Breathing Cycle</span>
                <span className="font-bold text-cyan-400 tabular-nums">
                  {(240 / (formData.signature_bpm || 164)).toFixed(2)}s
                </span>
              </div>
              <div className="p-2 rounded bg-neutral-900/90 border border-white/5">
                <span className="text-[10px] text-neutral-500 block uppercase">4-Bar Loop Length</span>
                <span className="font-bold text-emerald-400 tabular-nums">
                  {((60 / (formData.signature_bpm || 164)) * 16).toFixed(2)}s
                </span>
              </div>
            </div>
          </div>

          {/* 3. Brand Name / Signature Slogan ("DjItal 164bpm") */}
          <div className="p-5 rounded bg-white dark:bg-neutral-950/70 border border-neutral-200 dark:border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-1.5 font-mono">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Brand Name / Signature Slogan ("DjItal 164bpm")</span>
                </label>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Change to any custom brand text (e.g. <em>"DjItal 164bpm"</em>, <em>"DJ ITAL SOUND SYSTEM 164"</em>). Used on marquee ribbons, the hero dub console, and loading screens.
                </p>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                Default: <code className="text-amber-600 dark:text-amber-400 font-bold">DjItal 164bpm</code>
              </span>
            </div>

            <input
              type="text"
              value={formData.brand_slogan || ''}
              onChange={(e) => setFormData({ ...formData, brand_slogan: e.target.value })}
              placeholder="e.g. DjItal 164bpm"
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm font-mono font-bold tracking-wide"
            />

            {/* Quick Slogan Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-bold">
                Quick Suggestions:
              </span>
              {[
                'DjItal 164bpm',
                'DJ ITAL 164',
                'DJ ITAL SOUND SYSTEM 164',
                'VITAL FEST 164 BPM',
                'KOOL FM 94.5 DUB // 164 BPM',
              ].map((slogan) => (
                <button
                  key={slogan}
                  type="button"
                  onClick={() => setFormData({ ...formData, brand_slogan: slogan })}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                    formData.brand_slogan === slogan
                      ? 'border-amber-400 bg-amber-400 text-neutral-950 font-bold'
                      : 'border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:border-amber-400/50'
                  }`}
                >
                  {slogan}
                </button>
              ))}
            </div>

            {/* Live Marquee Ribbon Simulation Preview */}
            <div className="mt-2 p-3 rounded bg-neutral-950 border border-neutral-800 flex items-center justify-between overflow-hidden shadow-inner">
              <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold shrink-0 mr-3">
                Live Marquee Preview:
              </span>
              <div className="flex items-center gap-3 font-industrial font-black text-xs text-amber-400 uppercase tracking-widest truncate">
                <span className="bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 border border-amber-400/40">
                  {(formData.brand_slogan || 'DJITAL 164BPM').toUpperCase()}
                </span>
                <span className="text-white/40">·</span>
                <span className="text-neutral-300">FOUNDATION JUNGLE</span>
                <span className="text-white/40">·</span>
                <span className="text-amber-400">{formData.signature_bpm || 164} BPM SOUND SYSTEM CLOCK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Upfront Tagline & Identity */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
            <User className="w-4 h-4" />
            <span>2. Core Tagline & Upfront Branding</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Stage Name</label>
              <input
                type="text"
                value={formData.stage_name || ''}
                onChange={(e) => setFormData({ ...formData, stage_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Origin / City</label>
              <input
                type="text"
                value={formData.origin || ''}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Upfront Tagline (Featured under name)
            </label>
            <input
              type="text"
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. British Jungle & Drum and Bass Pioneer | Kool FM 94.5 | Founder of Vital Fest"
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
            />
          </div>

          <div className="space-y-1.5 p-4 rounded bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 dark:border-amber-400/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <span>Navbar Sub-Title</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold border border-amber-500/20">
                Replaces Tagline in Navbar Only
              </span>
            </div>
            <input
              type="text"
              value={formData.navbar_subtitle !== undefined ? formData.navbar_subtitle : (formData.subtitle || '')}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, navbar_subtitle: val, subtitle: val });
              }}
              placeholder="e.g. British Jungle Pioneer & Radio Broadcaster (or leave blank to use main tagline)"
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
            />
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
              When entered, this replaces the tagline under <strong>DJ ITAL</strong> specifically in the top navigation bar. If left blank, the navbar will display the upfront tagline above.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Genres Covered
              </label>
              <input
                type="text"
                value={formData.genres || ''}
                onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
                placeholder="e.g. Jungle · Drum & Bass · Reggae · Dub · UK Bass"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Regions / Territories Covered
              </label>
              <input
                type="text"
                value={formData.regions_covered || ''}
                onChange={(e) => setFormData({ ...formData, regions_covered: e.target.value })}
                placeholder="e.g. UK, Europe & International / Worldwide"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Biography & Highlights */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>3. Skimmable Biography & Archival Credentials</span>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Short, Skimmable Bio (Featured on Homepage)
            </label>
            <textarea
              rows={3}
              value={formData.bio_short || ''}
              onChange={(e) => setFormData({ ...formData, bio_short: e.target.value })}
              placeholder="Skimmable summary highlighting key venues, festivals, V&A East recognition, media archive and radio slots..."
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Key Venues Highlighted
              </label>
              <input
                type="text"
                value={formData.key_venues || ''}
                onChange={(e) => setFormData({ ...formData, key_venues: e.target.value })}
                placeholder="Fabric London, The Hackney Social, Ministry of Sound, The Yard Theatre"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Radio Residency Slots
              </label>
              <input
                type="text"
                value={formData.radio_show || ''}
                onChange={(e) => setFormData({ ...formData, radio_show: e.target.value })}
                placeholder="The Ital Show on Dejavu FM"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Full Archival Biography
            </label>
            <textarea
              rows={4}
              value={formData.bio_full || ''}
              onChange={(e) => setFormData({ ...formData, bio_full: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Section 4: Direct Promoter Contact & WhatsApp */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
            <MessageCircle className="w-4 h-4" />
            <span>4. Direct Booking & WhatsApp Quick Contact</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Direct Contact Email (Promoter Help & Quick Chat)</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">Main Site Contact</span>
              </label>
              <input
                type="email"
                value={formData.direct_email || ''}
                onChange={(e) => setFormData({ ...formData, direct_email: e.target.value })}
                placeholder="djital.booking@gmail.com"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
              <p className="text-[10px] text-neutral-500">
                Shown in Immediate Promoter Help card, Direct Email button, and site footer.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                WhatsApp Phone Number (with international dial code)
              </label>
              <input
                type="text"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="+44 7900 123456"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Prefilled WhatsApp Enquiry Message
            </label>
            <input
              type="text"
              value={formData.whatsapp_message || ''}
              onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
              placeholder="Hi DJ Ital, I would like to enquire about booking you for an event."
              className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-white/10">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Booking Agency Name</label>
              <input
                type="text"
                value={formData.booking_agency || ''}
                onChange={(e) => setFormData({ ...formData, booking_agency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Booking Agency Email</label>
              <input
                type="email"
                value={formData.booking_email || ''}
                onChange={(e) => setFormData({ ...formData, booking_email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Live Audio Stream, Player & Radio Broadcasting */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-red-500 font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4" />
              <span>5. Audio Stream URL, Radio & Merch</span>
            </div>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-bold">
              Audio & Radio Settings
            </span>
          </div>

          {/* Unified Single Stream URL Option */}
          <div className="p-5 rounded bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <label className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Live Radio & Audio Stream URL</span>
                </label>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  The primary stream URL powering the default floating player bar and the Hero section audio deck. Supports Icecast/Shoutcast radio casts, direct MP3/AAC links, or external players.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {formData.stream_url && (
                  <button
                    type="button"
                    onClick={() => handleTestAudioStream(formData.stream_url)}
                    className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      testPlayingUrl === formData.stream_url
                        ? 'bg-amber-400 text-neutral-950 scale-102 ring-2 ring-amber-400/50'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 hover:bg-amber-400 hover:text-neutral-950'
                    }`}
                  >
                    {testPlayingUrl === formData.stream_url ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Stop Test</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Test Audio</span>
                      </>
                    )}
                  </button>
                )}
                {formData.stream_url && (
                  <a
                    href={formData.stream_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <input
              type="url"
              value={formData.stream_url || ''}
              onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
              placeholder="e.g. https://dejavufm.radioca.st/; or http://cast.radioserver.com:8000/stream"
              className="w-full px-3.5 py-2.5 rounded bg-white border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm font-mono"
            />

            {testPlayingUrl === formData.stream_url && testStatus && (
              <div className="flex items-center gap-2 p-2.5 rounded bg-amber-400/10 border border-amber-400/30 text-xs font-mono text-amber-600 dark:text-amber-400">
                <Volume2 className="w-4 h-4 animate-pulse shrink-0" />
                <span className="font-bold">{testStatus}</span>
              </div>
            )}

            <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
              When configured, this stream is loaded by default into the persistent player bar and triggers instantly when visitors click "PLAY STREAM" or the Vital logo on the Hero section.
            </p>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Shopify Merch Store URL
              </label>
              <input
                type="url"
                value={formData.shopify_merch_url || ''}
                onChange={(e) => setFormData({ ...formData, shopify_merch_url: e.target.value })}
                placeholder="https://vitalfest.myshopify.com"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Merch Badge Label
              </label>
              <input
                type="text"
                value={formData.merch_badge_text || ''}
                onChange={(e) => setFormData({ ...formData, merch_badge_text: e.target.value })}
                placeholder="Official Vital Fest Merch & Vinyl Store"
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 focus:outline-none text-sm"
              />
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                Displayed on the homepage Merch card badge (above "Vital Fest Apparel & Limited Dubplates") and in the Footer store link.
              </p>
            </div>
          </div>
        </div>

        {/* Section 6: Official Social Links */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-5">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-700 dark:text-neutral-300 font-bold uppercase tracking-wider">
            <Share2 className="w-4 h-4 text-amber-500" />
            <span>6. Official Social & Platform Links</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">Instagram</label>
              <input
                type="url"
                value={formData.social_instagram || ''}
                onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                placeholder="https://instagram.com/djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">Facebook</label>
              <input
                type="url"
                value={formData.social_facebook || ''}
                onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                placeholder="https://facebook.com/djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">YouTube</label>
              <input
                type="url"
                value={formData.social_youtube || ''}
                onChange={(e) => setFormData({ ...formData, social_youtube: e.target.value })}
                placeholder="https://youtube.com/@djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">TikTok</label>
              <input
                type="url"
                value={formData.social_tiktok || ''}
                onChange={(e) => setFormData({ ...formData, social_tiktok: e.target.value })}
                placeholder="https://tiktok.com/@djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">SoundCloud</label>
              <input
                type="url"
                value={formData.social_soundcloud || ''}
                onChange={(e) => setFormData({ ...formData, social_soundcloud: e.target.value })}
                placeholder="https://soundcloud.com/djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-neutral-700 dark:text-neutral-300">Mixcloud</label>
              <input
                type="url"
                value={formData.social_mixcloud || ''}
                onChange={(e) => setFormData({ ...formData, social_mixcloud: e.target.value })}
                placeholder="https://mixcloud.com/djital"
                className="w-full px-3 py-2 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Background Motion & Slideshow Options */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
              <Sliders className="w-4 h-4" />
              <span>7. Background Motion Styles & Visual FX Engine</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              Active: {formData.bg_style || 'subtle-motion'}
            </span>
          </div>

          {/* Interactive Visual Style Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
              Select Sound-System Motion Aesthetic:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'subtle-motion',
                  label: 'Subtle Motion',
                  badge: 'AMBIENT FLOW',
                  desc: 'Drifting amber & cyan spheres with gentle wave ribbons',
                },
                {
                  id: 'particles',
                  label: 'Bass Particles',
                  badge: 'VINYL DUST',
                  desc: 'Upward floating gold vinyl flecks & bass particles',
                },
                {
                  id: 'ambient-glow',
                  label: 'Sound System Glow',
                  badge: '164 BPM PULSE',
                  desc: 'Warm tube-amp amber glow breathing with subwoofer',
                },
                {
                  id: 'slideshow',
                  label: 'Photo Slideshow',
                  badge: 'ARCHIVAL RAVE',
                  desc: 'Cinematic Ken Burns crossfade between archival photos',
                },
                {
                  id: 'soundwave',
                  label: 'Soundwave Waves',
                  badge: 'EQUALIZER FX',
                  desc: 'Dynamic audio spectrum ribbons flowing horizontally',
                },
                {
                  id: 'dub-sonar',
                  label: 'Bass Sonar Rings',
                  badge: 'ACOUSTIC RADAR',
                  desc: 'Concentric bass shockwave rings expanding outward',
                },
                {
                  id: 'minimal',
                  label: 'Minimal Static',
                  badge: 'STUDIO MATRIX',
                  desc: 'Clean precision sound engineering grid, zero motion',
                },
                {
                  id: 'hybrid',
                  label: 'Full Atmosphere',
                  badge: 'ALL FX COMBINED',
                  desc: 'Full sound-system presence: glow + particles + waves',
                },
              ].map((styleOption) => {
                const isSelected = (formData.bg_style || 'subtle-motion') === styleOption.id;
                return (
                  <button
                    key={styleOption.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, bg_style: styleOption.id });
                    }}
                    className={`p-3 rounded text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 dark:bg-amber-400/15 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                        : 'border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 hover:border-neutral-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                          {styleOption.badge}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <div className="text-xs font-bold text-neutral-950 dark:text-white font-industrial uppercase">
                        {styleOption.label}
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 leading-snug line-clamp-2">
                      {styleOption.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-200 dark:border-white/10">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Background Motion Dropdown
              </label>
              <select
                value={formData.bg_style || 'subtle-motion'}
                onChange={(e) => setFormData({ ...formData, bg_style: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-sm"
              >
                <option value="subtle-motion">Subtle Ambient Gradient Motion</option>
                <option value="particles">Floating Bass Particles</option>
                <option value="ambient-glow">Warm Sound System Glow</option>
                <option value="slideshow">Photo Slideshow Background</option>
                <option value="soundwave">Dynamic Equalizer & Soundwaves</option>
                <option value="dub-sonar">Concentric Bass Sonar Rings</option>
                <option value="minimal">Minimal Static Studio Grid</option>
                <option value="hybrid">Full Atmosphere (Hybrid All-In-One)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Animation Speed
              </label>
              <select
                value={formData.bg_speed || 'medium'}
                onChange={(e) => setFormData({ ...formData, bg_speed: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-sm"
              >
                <option value="slow">Slow & Gentle</option>
                <option value="medium">Medium</option>
                <option value="fast">Dynamic / Fast</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Slideshow Interval (Seconds)
              </label>
              <input
                type="number"
                min={3}
                max={30}
                value={formData.slideshow_interval || 6}
                onChange={(e) =>
                  setFormData({ ...formData, slideshow_interval: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Slideshow Secondary Overlay Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-neutral-900 dark:text-white block font-mono">
                Archival Photo Background Underlay
              </span>
              <p className="text-neutral-500 dark:text-neutral-400">
                Display subtle archival rave photos behind moving particles and glow effects.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.slideshow_enabled)}
                onChange={(e) =>
                  setFormData({ ...formData, slideshow_enabled: e.target.checked ? 1 : 0 })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Archival Slideshow Photos Manager */}
          <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Archival Slideshow Photo Collection</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const defaultPhotos = JSON.stringify([
                    '/images/dj_ital_hero_1790112374509.jpg',
                    '/images/vital_fest_crowd_1790112387611.jpg',
                    '/images/kool_fm_vintage_1790112400005.jpg',
                    '/images/va_museum_exhibition_1790112416279.jpg',
                    '/images/hackney_pirate_radio_1790113898507.jpg',
                    '/images/vinyl_dubplate_acetate_1790113879360.jpg',
                  ]);
                  setFormData({ ...formData, slideshow_images: defaultPhotos });
                }}
                className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to 6 Heritage Rave Photos</span>
              </button>
            </div>

            {/* Thumbnail previews */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'DJ Ital Hero', src: '/images/dj_ital_hero_1790112374509.jpg' },
                { label: 'Vital Fest Crowd', src: '/images/vital_fest_crowd_1790112387611.jpg' },
                { label: 'Kool FM Vintage', src: '/images/kool_fm_vintage_1790112400005.jpg' },
                { label: 'V&A East Archive', src: '/images/va_museum_exhibition_1790112416279.jpg' },
                { label: 'Hackney Pirate', src: '/images/hackney_pirate_radio_1790113898507.jpg' },
                { label: 'Decibel Acetate', src: '/images/vinyl_dubplate_acetate_1790113879360.jpg' },
              ].map((item, i) => (
                <div key={i} className="group relative rounded overflow-hidden border border-neutral-300 dark:border-white/10 aspect-video bg-neutral-900">
                  <img src={item.src} alt={item.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-x-0 bottom-0 bg-neutral-950/80 px-1 py-0.5 text-[9px] font-mono text-neutral-300 truncate text-center">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 8: Administrative Security & Dashboard Access Password */}
        <div className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>8. Administrative Security & Dashboard Access Password</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              WebCrypto Protected
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/20">
            <div className="space-y-1">
              <div className="text-sm font-bold text-neutral-950 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Dashboard Entrance Password</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed">
                Change the master password required to log into this administrative console at <code className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold">/admin</code>. All passwords use cryptographic salts and SHA-256 hashes.
              </p>
            </div>
            {onNavigateToSecurity && (
              <button
                type="button"
                onClick={onNavigateToSecurity}
                className="px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0 active:scale-95"
              >
                Change Password →
              </button>
            )}
          </div>
        </div>

        {/* Submit Bar with feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-200 dark:border-white/10">
          <div className="w-full sm:w-auto">
            {isSaved && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold animate-in fade-in">
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>All Profile changes saved successfully to SQLite!</span>
              </div>
            )}
            {submitError && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>Error: {submitError}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded font-display font-extrabold text-sm uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-400/20 active:scale-98 cursor-pointer w-full sm:w-auto ${
              isSubmitting
                ? 'bg-amber-400/60 text-neutral-800 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving to SQLite...</span>
              </>
            ) : isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Brand Logo Media Picker Modal */}
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
        selectedUrl={currentLogo}
      />

      {/* App Loader Realtime Preview Modal */}
      {showLoaderPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="absolute top-5 right-5 z-[110]">
            <button
              type="button"
              onClick={() => setShowLoaderPreview(false)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-md text-xs font-mono font-bold shadow-2xl transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close App Loader Preview</span>
            </button>
          </div>
          <AppLoader
            colorScheme={selectedColorScheme}
            accentColor={currentCustomColor}
            logoUrl={currentLogo}
            signatureBpm={formData.signature_bpm || 164}
            brandSlogan={formData.brand_slogan || 'DjItal 164bpm'}
            statusText={`PREVIEWING THEME (${formData.signature_bpm || 164} BPM CLOCK)...`}
          />
        </div>
      )}
      {/* Hidden audio element for in-dashboard radio cast stream testing */}
      <audio
        ref={testAudioRef}
        preload="auto"
        onWaiting={() => setTestIsBuffering(true)}
        onPlaying={() => {
          setTestIsBuffering(false);
          setTestStatus('Playing stream successfully');
        }}
        onError={() => {
          if (testPlayingUrl && !testAudioRef.current?.src.includes('/api/audio-proxy')) {
            const proxyUrl = getProxyStreamUrl(testPlayingUrl);
            if (proxyUrl && testAudioRef.current) {
              setTestStatus('Retrying connection via proxy...');
              testAudioRef.current.src = proxyUrl;
              testAudioRef.current.load();
              testAudioRef.current.play().catch(() => {
                setTestIsBuffering(false);
                setTestStatus('Unable to play: verify stream URL or server state');
              });
              return;
            }
          }
          setTestIsBuffering(false);
          setTestStatus('Stream connection failed');
        }}
      />
    </div>
  );
};
