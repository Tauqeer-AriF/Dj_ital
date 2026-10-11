import React, { useState } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Speaker,
  Disc3,
  ExternalLink,
  Printer,
  Sparkles,
  ShieldCheck,
  Mail,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { ProfileData } from '../db/sqlite';
import { normalizeImageUrl } from '../utils/imageOptimization';

interface EPKModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfileData | null;
}

export const EPKModal: React.FC<EPKModalProps> = ({ isOpen, onClose, profile }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'photos' | 'rider' | 'logos' | 'bio'>('overview');
  const [copiedRider, setCopiedRider] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);

  if (!isOpen) return null;

  const landscapePhoto = normalizeImageUrl(
    profile?.epk_press_photo_landscape || '/images/dj_ital_hero_1790112374509.jpg'
  );
  const portraitPhoto = normalizeImageUrl(
    profile?.epk_press_photo_portrait || '/images/kool_fm_vintage_1790112400005.jpg'
  );
  const logoSrc = normalizeImageUrl(
    profile?.logo_url || profile?.epk_logo_png || '/images/vital_fest_logo.png'
  );

  const cleanWhatsApp = (profile?.whatsapp_number || '+447900123456').replace(/[^0-9+]/g, '');

  const techRider =
    profile?.tech_rider_text ||
    `DJ ITAL — TECHNICAL RIDER & STAGE SPECIFICATIONS (2026)

1. DJ BOOTH AUDIO EQUIPMENT:
   - 2x Technics SL-1210 MK2 / MK7 Turntables (calibrated, with ground leads & fresh Ortofon Concorde cartridges provided if possible, or standard headshells).
   - OPTIONAL / HYBRID: 2x Pioneer CDJ-3000 or CDJ-2000NXS2 players linked via Ethernet hub.
   - 1x Pioneer DJM-900NXS2 or Allen & Heath Xone:96 mixer.

2. MONITORING:
   - High-power stereo booth monitor system (minimum 2x 12" or 15" powered wedge speakers / line array top) with an independent volume control knob located within immediate reach of selector.
   - Low-latency sub reinforcement in booth for sub-bass monitoring (30Hz-80Hz).

3. MICROPHONE:
   - 1x Shure SM58 wireless or switched wired handheld microphone connected directly to front-of-house or mixer Mic channel for MC/Vocalist.

4. POWER & LIGHTING:
   - 4x 13A UK mains sockets (clean isolated audio power).
   - Adjustable low-level booth light (white or warm amber, non-strobe) directed at turntable decks for dubplate cueing.

5. HOSPITALITY & SECURE STORAGE:
   - 4x 500ml still bottled water (room temperature).
   - 2x clean hand towels.
   - Secure lockable backstage case storage for heavy vinyl record flight cases during and post performance.`;

  const printableBio = `DJ ITAL — OFFICIAL ARTIST BIOGRAPHY

Stage Name: ${profile?.stage_name || 'DJ Ital'}
Real Name: ${profile?.real_name || 'Ital (Hackney, 1968)'}
Origin: ${profile?.origin || 'Hackney, East London, United Kingdom'}
Genres: ${profile?.genres || 'Jungle · Drum & Bass · Reggae · Dub · UK Bass'}
Coverage: ${profile?.regions_covered || 'UK, Europe & International / Worldwide'}
Active Since: ${profile?.active_since || '1991'}

HERITAGE & RECOGNITION:
- Victoria & Albert Museum (V&A East): Formally recognised in national archival exhibitions documenting Black British sound system culture and 1990s rave heritage.
- Kool FM (94.5 FM): Original 1991 resident broadcaster and pirate radio pioneer during jungle's golden genesis.
- Vital Fest: Founder and curator of London's authentic underground sound system clash festival.
- Classic Discography: Producer of the seminal 1995 anthem "Decibel" (Kool FM 5th Anniversary).

SHORT BIO:
${profile?.bio_short || ''}

FULL BIOGRAPHY:
${profile?.bio_full || ''}

KEY VENUES & FESTIVALS:
${profile?.key_venues || 'Fabric London, The Hackney Social, Ministry of Sound, The Yard Theatre, Boomtown Fair'}

MANAGEMENT & BOOKINGS:
Exclusive Agency: ${profile?.booking_agency || 'IP1 Agency London'}
Booking Email: ${profile?.booking_email || profile?.direct_email || 'ip1.agency@mail.com'}
Direct Artist Email: ${profile?.direct_email || profile?.booking_email || 'djital.booking@gmail.com'}
WhatsApp Quick Contact: ${profile?.whatsapp_number || '+44 7900 123456'}`;

  const handleCopyRider = () => {
    navigator.clipboard.writeText(techRider);
    setCopiedRider(true);
    setTimeout(() => setCopiedRider(false), 2000);
  };

  const handleCopyBio = () => {
    navigator.clipboard.writeText(printableBio);
    setCopiedBio(true);
    setTimeout(() => setCopiedBio(false), 2000);
  };

  const handleDownloadRiderTxt = () => {
    const blob = new Blob([techRider], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DJ_ITAL_Technical_Rider_2026.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadBioTxt = () => {
    const blob = new Blob([printableBio], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DJ_ITAL_Official_Biography_2026.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl rounded sound-cabinet shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-neutral-300 dark:border-white/20">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-100/70 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight">
                  Electronic Press Kit (EPK)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-industrial bg-amber-400/20 text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider">
                  Press & Promoters
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Official media assets, technical riders, hi-res photography, and verified bio for DJ Ital.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="hardware-btn p-2 rounded text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="hardware-btn p-2 rounded text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-950/60 overflow-x-auto shrink-0">
          {(
            [
              { id: 'overview', label: 'EPK Overview', icon: <Sparkles className="w-3.5 h-3.5" /> },
              { id: 'photos', label: 'Hi-Res Press Photos', icon: <ImageIcon className="w-3.5 h-3.5" /> },
              { id: 'rider', label: 'Tech Rider & Specs', icon: <Speaker className="w-3.5 h-3.5" /> },
              { id: 'logos', label: 'Official Logos (PNG/SVG)', icon: <img src={logoSrc} alt="Logo" className="w-3.5 h-3.5 object-contain" /> },
              { id: 'bio', label: 'Downloadable Bio', icon: <FileText className="w-3.5 h-3.5" /> },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-industrial font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-amber-400 text-amber-600 dark:text-amber-400 font-black'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded sound-card space-y-2">
                  <div className="text-[11px] font-industrial text-neutral-400 uppercase tracking-wider font-bold">
                    Artist Tagline
                  </div>
                  <div className="text-sm font-display font-bold text-neutral-900 dark:text-white">
                    {profile?.stage_name || 'DJ Ital'}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {profile?.tagline || 'British Jungle & Drum and Bass Pioneer | Kool FM 94.5 | Founder of Vital Fest'}
                  </p>
                </div>

                <div className="p-5 rounded sound-card space-y-2">
                  <div className="text-[11px] font-industrial text-neutral-400 uppercase tracking-wider font-bold">
                    Genres & Musical Styles
                  </div>
                  <div className="text-sm font-display font-bold text-amber-600 dark:text-amber-400">
                    {profile?.genres || 'Jungle · Drum & Bass · Reggae · Dub · UK Bass'}
                  </div>
                  <div className="text-xs text-neutral-500 font-industrial uppercase font-bold tracking-wider">
                    Territory: {profile?.regions_covered || 'UK, Europe & Worldwide'}
                  </div>
                </div>

                <div className="p-5 rounded sound-card space-y-2">
                  <div className="text-[11px] font-industrial text-neutral-400 uppercase tracking-wider font-bold">
                    Booking Management
                  </div>
                  <div className="text-sm font-display font-bold text-neutral-900 dark:text-white">
                    {profile?.booking_agency || 'IP1 Agency London'}
                  </div>
                  <div className="text-xs space-y-1 font-industrial uppercase font-bold tracking-wider">
                    <a
                      href={`mailto:${profile?.booking_email || profile?.direct_email || 'ip1.agency@mail.com'}`}
                      className="text-amber-600 dark:text-amber-400 hover:underline block"
                    >
                      {profile?.booking_email || profile?.direct_email || 'ip1.agency@mail.com'}
                    </a>
                    {profile?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${cleanWhatsApp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp Quick Contact</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified Accreditations Banner */}
              <div className="p-6 rounded sound-card border border-cyan-500/20 bg-cyan-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-industrial text-cyan-600 dark:text-cyan-400 font-black uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Victoria & Albert Museum (V&A East) Permanent Archive Loan</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 max-w-xl">
                    Recognised by the UK national museum of art and design for enduring cultural contribution to Black British sound systems and early 90s pirate radio innovation.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('bio')}
                    className="hardware-btn px-4 py-2 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/30 font-industrial text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View Archival Bio
                  </button>
                </div>
              </div>

              {/* One-Click EPK Package Download */}
              <div className="p-6 rounded sound-card border border-amber-400/30 bg-amber-400/5 space-y-3">
                <h4 className="text-base font-display font-black text-neutral-900 dark:text-white uppercase">
                  Complete EPK Press Pack Bundle
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  Includes full biography (.txt/.pdf), technical rider specification, landscape & portrait press photos (300 DPI print-ready), and vector logo files.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleDownloadBioTxt}
                    className="hardware-btn flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Bio (.txt)</span>
                  </button>
                  <button
                    onClick={handleDownloadRiderTxt}
                    className="hardware-btn flex items-center gap-2 px-4 py-2.5 rounded bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white/10 dark:hover:bg-white/20 font-industrial text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Tech Rider (.txt)</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="hardware-btn flex items-center gap-2 px-4 py-2.5 rounded border border-neutral-300 dark:border-white/10 hover:border-amber-400 font-industrial text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Press Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HI-RES PRESS PHOTOS */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-display font-black text-neutral-900 dark:text-white uppercase">
                  Official Approved Press Photography
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Cleared for promotional print, digital festival flyers, editorial features, and media articles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Landscape Photo */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 space-y-3">
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-white/10">
                    <img
                      src={landscapePhoto}
                      alt="DJ Ital Landscape Press Photo"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                      LANDSCAPE (16:9 / 16:10)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">Main Turntables Press Shot</div>
                      <div className="text-[11px] text-neutral-500 font-mono">Hi-Res JPG / Print & Web</div>
                    </div>
                    <a
                      href={landscapePhoto}
                      download="DJ_ITAL_Press_Photo_Landscape.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>

                {/* Portrait Photo */}
                <div className="p-4 rounded-2xl border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 space-y-3">
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-200 dark:border-white/10">
                    <img
                      src={portraitPhoto}
                      alt="DJ Ital Portrait / Studio Archive Press Photo"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 text-[10px] font-mono text-white font-bold">
                      ARCHIVE / STUDIO SETUP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white">Studio & Turntables Archive</div>
                      <div className="text-[11px] text-neutral-500 font-mono">Hi-Res JPG / Print & Web</div>
                    </div>
                    <a
                      href={portraitPhoto}
                      download="DJ_ITAL_Press_Photo_Studio.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TECH RIDER & SPECS */}
          {activeTab === 'rider' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-display font-black text-neutral-900 dark:text-white uppercase">
                    Stage & Sound Technical Rider (2026)
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Standard equipment required for festival stages, club sound clashes, and all-vinyl heritage sets.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyRider}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {copiedRider ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRider ? 'Rider Copied!' : 'Copy Rider'}</span>
                  </button>
                  <button
                    onClick={handleDownloadRiderTxt}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              {/* Rider Code/Text Display */}
              <div className="p-6 rounded-2xl bg-neutral-950 text-neutral-200 font-mono text-xs leading-relaxed border border-neutral-800 shadow-inner overflow-x-auto whitespace-pre-wrap">
                {techRider}
              </div>
            </div>
          )}

          {/* TAB 4: OFFICIAL LOGOS */}
          {activeTab === 'logos' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-display font-black text-neutral-900 dark:text-white uppercase">
                  Official Brand Marks & Logos (PNG / SVG)
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Vector SVG and transparent PNG versions for event artwork, line-up posters, and website promotions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Official Vital Fest Logo */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-amber-400/40 flex flex-col items-center justify-between gap-6 shadow-xl">
                  <div className="py-6 flex flex-col items-center text-center">
                    <img
                      src={logoSrc}
                      alt="Vital Fest Official Logo"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                      }}
                      className="h-20 w-auto object-contain filter drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]"
                    />
                    <div className="text-[11px] font-mono tracking-widest text-amber-400 font-bold uppercase mt-3">
                      VITAL FEST JUNGLE OFFICIAL
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-800 text-xs">
                    <span className="font-mono text-white/80">Transparent PNG</span>
                    <a
                      href={logoSrc}
                      download="Vital_Fest_Official_Logo.png"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </a>
                  </div>
                </div>

                {/* Dark Logo Presentation */}
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 flex flex-col items-center justify-between gap-6">
                  <div className="py-8 text-center">
                    <span className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-white uppercase">
                      DJ <span className="text-amber-400">ITAL</span>
                    </span>
                    <div className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase mt-1">
                      EAST LONDON SOUNDS
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-800 text-xs">
                    <span className="font-mono text-neutral-400">Dark / Amber Vector</span>
                    <button
                      onClick={() => {
                        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120"><rect width="100%" height="100%" fill="#0a0a0c"/><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="46" fill="#ffffff">DJ <tspan fill="#f59e0b">ITAL</tspan></text><text x="50%" y="88%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-weight="700" font-size="12" fill="#9ca3af" letter-spacing="4">EAST LONDON SOUNDS</text></svg>`;
                        const blob = new Blob([svgData], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'DJ_ITAL_Logo_Dark.svg';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>
                </div>

                {/* Light Logo Presentation */}
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 flex flex-col items-center justify-between gap-6 shadow-sm">
                  <div className="py-8 text-center">
                    <span className="text-4xl sm:text-5xl font-display font-black tracking-tighter text-neutral-950 uppercase">
                      DJ <span className="text-amber-500">ITAL</span>
                    </span>
                    <div className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase mt-1">
                      EAST LONDON SOUNDS
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-100 text-xs">
                    <span className="font-mono text-neutral-600">Light / High-Contrast</span>
                    <button
                      onClick={() => {
                        const svgData = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" width="400" height="120"><rect width="100%" height="100%" fill="#ffffff"/><text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="46" fill="#000000">DJ <tspan fill="#f59e0b">ITAL</tspan></text><text x="50%" y="88%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-weight="700" font-size="12" fill="#4b5563" letter-spacing="4">EAST LONDON SOUNDS</text></svg>`;
                        const blob = new Blob([svgData], { type: 'image/svg+xml' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'DJ_ITAL_Logo_Light.svg';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download SVG</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOADABLE BIO */}
          {activeTab === 'bio' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-display font-black text-neutral-900 dark:text-white uppercase">
                    Official Artist Biography & Press Copy
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Skimmable summary and complete archival history for print programmes and festival guides.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyBio}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {copiedBio ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBio ? 'Bio Copied!' : 'Copy Bio'}</span>
                  </button>
                  <button
                    onClick={handleDownloadBioTxt}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              {/* Bio Text Display */}
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-neutral-200 font-sans text-sm leading-relaxed space-y-4">
                <div>
                  <h5 className="font-display font-bold text-neutral-950 dark:text-white text-base">
                    Quick Skimmable Bio:
                  </h5>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                    {profile?.bio_short ||
                      'Pioneering UK jungle producer, Kool FM 94.5 original, and founder of Vital Fest. A cornerstone of East London sound system heritage whose contribution was officially recognised by the Victoria and Albert Museum.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-white/10">
                  <h5 className="font-display font-bold text-neutral-950 dark:text-white text-base">
                    Full Heritage Biography:
                  </h5>
                  <p className="text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">
                    {profile?.bio_full || ''}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-neutral-400 uppercase font-bold block">Key Venues & Festivals:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {profile?.key_venues || 'Fabric London, The Hackney Social, Ministry of Sound, Boomtown Fair'}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-400 uppercase font-bold block">Radio & Broadcasts:</span>
                    <span className="text-neutral-900 dark:text-white font-medium">
                      {profile?.radio_show || 'The Ital Show on Dejavu FM'} / Kool FM 94.5 (Heritage)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar with Agency Contact */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-white/10 bg-neutral-100/70 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0 font-mono">
          <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
            <span>Exclusive Agency: <strong className="text-neutral-900 dark:text-white">{profile?.booking_agency || 'IP1 Agency London'}</strong></span>
            <span aria-hidden="true">·</span>
            <a
              href={`mailto:${profile?.booking_email || profile?.direct_email || 'ip1.agency@mail.com'}`}
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              {profile?.booking_email || profile?.direct_email || 'ip1.agency@mail.com'}
            </a>
          </div>

          <div className="flex items-center gap-3">
            {profile?.whatsapp_number && (
              <a
                href={`https://wa.me/${cleanWhatsApp}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/30 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {profile.whatsapp_number}</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-neutral-950 text-white dark:bg-white/10 dark:hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
            >
              Close EPK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
