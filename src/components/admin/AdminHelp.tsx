import React, { useState } from 'react';
import {
  HelpCircle,
  Radio,
  Film,
  Music,
  User,
  Sliders,
  HardDrive,
  Calendar,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  FolderGit2,
  Play,
  Download,
  Flame,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layers,
  FileText,
  Mail,
  Quote,
  Disc3,
  Image as ImageIcon,
  Inbox,
  Database,
  Lock,
  Landmark,
  Video,
  Check,
  Info,
  Clock,
  Eye,
  Settings,
} from 'lucide-react';

export interface HelpSection {
  id: string;
  tabKey?: string;
  title: string;
  badge: string;
  badgeColor?: string;
  icon: React.ReactNode;
  summary: string;
  content: React.ReactNode;
}

export const AdminHelp: React.FC<{ onNavigateTab?: (tab: string) => void }> = ({ onNavigateTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('live_broadcasting');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const toggleSection = (id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  };

  const sections: HelpSection[] = [
    {
      id: 'live_broadcasting',
      tabKey: 'profile',
      title: '1. Live Broadcasting: Go Live Only When You Are On Air',
      badge: 'BROADCAST CONTROL',
      badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      icon: <Radio className="w-4 h-4 text-red-500 animate-pulse" />,
      summary: 'How to use the 1-click On Air toggle so you do not need a continuous stream running 24/7.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            You do <strong>not</strong> need to broadcast 24/7 or keep an audio server running constantly. The website features an intelligent, dual-state broadcast routing system:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded sound-card border border-amber-500/30 bg-amber-500/5 space-y-2">
              <div className="font-bold text-amber-600 dark:text-amber-400 font-mono text-xs uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>STATE 1: OFF AIR (Default Archive Mode)</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>Displays an amber <strong>[ OFF AIR // ARCHIVE VAULT ]</strong> status beacon.</li>
                <li>Displays your next scheduled broadcast message (e.g. <em>"Next show: Thursday 8pm GMT on DejaVu FM & Rinse FM"</em>).</li>
                <li>When visitors click the turntable dubplate console in the hero, the site plays your built-in 164 BPM acetate dubplates (stems/beats) and recorded mixes rather than dead stream silence.</li>
              </ul>
            </div>

            <div className="p-4 rounded sound-card border border-red-500/40 bg-red-500/5 space-y-2">
              <div className="font-bold text-red-600 dark:text-red-400 font-mono text-xs uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span>STATE 2: ON AIR (Live Transmission Mode)</span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs">
                <li>The site immediately lights up with a pulsing red <strong>[ 🔴 LIVE ON AIR TRANSMISSION ]</strong> beacon across both the navigation bar and hero.</li>
                <li>Displays your custom live show title (e.g. <em>"DJ Ital Special Live Birthday Clashing Set"</em>).</li>
                <li>The audio console connects directly to your live stream feed (Icecast, Shoutcast, DejaVu FM, Rinse FM, or custom relay).</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-2">
            <div className="font-bold text-xs uppercase text-neutral-900 dark:text-white font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>How to Go Live in 1-Click:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Look at the very top of the Admin Dashboard header on any page.</li>
              <li>Click the button reading <strong>"⚪ OFF AIR (CLICK TO GO LIVE)"</strong>.</li>
              <li>The button immediately pulses red reading <strong>"🔴 ON AIR (CLICK TO GO OFF AIR)"</strong> and saves instantly to the database.</li>
              <li>When your set is finished, simply click the button again to return to OFF AIR mode.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Dashboard Header or Profile & Branding → Section 5 (Audio Stream URL & Radio)</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Broadcast Controls</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'documentary_series',
      tabKey: 'documentary',
      title: '2. Documentary Series & Short Movie Clips',
      badge: 'VIDEO ARCHIVE',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <Film className="w-4 h-4 text-amber-500" />,
      summary: 'Upload short movie clips (.mp4 up to 80MB), embed YouTube Shorts, or link full-length documentaries.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            The Documentary Series section is fully flexible and supports both full-length multi-part documentary episodes and <strong>short video clips</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                📹 Direct Short Clips (MP4/WebM)
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Upload short MP4, WebM, or MOV clips up to 80MB directly. Played through a hardware-accelerated HTML5 player.
              </p>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono block">
                📱 YouTube Shorts
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Paste any <code className="font-mono text-[10px] text-amber-500">youtube.com/shorts/...</code> link. The engine automatically parses and embeds it seamlessly.
              </p>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 font-mono block">
                🎥 Full Episodes & Vimeo
              </span>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Paste standard YouTube links or Vimeo IDs. Works with custom thumbnail covers and duration stamps.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-2">
            <div className="font-bold text-xs uppercase text-neutral-900 dark:text-white font-mono">
              Step-by-Step: Adding a Short Movie Clip:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>Open the <strong>Documentary Series</strong> tab.</li>
              <li>Click <strong>"Add New Episode"</strong>.</li>
              <li>Set your Badge Pill Label (e.g. <em>"SHORT CLIP"</em>, <em>"TEASER"</em>, <em>"EPISODE 01"</em>, or <em>"CLASH HIGHLIGHT"</em>).</li>
              <li>Enter the clip Title and Description.</li>
              <li>Click <strong>"Upload Short Movie Clip (.mp4)"</strong> to select an MP4 from your computer, or click <strong>"Pick from Media Library"</strong>, or paste a URL.</li>
              <li>Click <strong>"Save Episode"</strong>. Your clip immediately appears on the website!</li>
            </ol>
          </div>

          <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
            <strong>Pro-Tip:</strong> You can re-order episodes anytime using the Up and Down arrow buttons, test playback directly in the admin with the <strong>"Test"</strong> button, or duplicate existing episodes to quickly clone layout settings.
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Documentary Series tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('documentary')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Documentary Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'audio_links',
      tabKey: 'audio_media',
      title: '3. Audio Sets: MediaFire, Rinse FM & DejaVu FM Links',
      badge: 'AUDIO VAULT',
      badgeColor: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
      icon: <Music className="w-4 h-4 text-blue-500" />,
      summary: 'Add MediaFire download vaults, Rinse FM archive links, and DejaVu FM stream relays to recorded sets.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Every mix and recorded pirate radio set in the <strong>Audio & Media Gallery</strong> can feature dedicated outbound links to official stations and file archives:
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded sound-card border border-blue-500/30 bg-blue-500/5">
              <span className="font-bold text-blue-600 dark:text-blue-400 font-mono shrink-0">📥 MediaFire Download Vault:</span>
              <span>Provide direct folder links or file URLs where fans and collectors can download complete 320kbps MP3 or WAV tape rips.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded sound-card border border-rose-500/30 bg-rose-500/5">
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono shrink-0">📻 Rinse FM Archive:</span>
              <span>Link directly to official Rinse FM podcast or show episodes so listeners can stream archived sets on Rinse's website or app.</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded sound-card border border-amber-500/30 bg-amber-500/5">
              <span className="font-bold text-amber-600 dark:text-amber-400 font-mono shrink-0">📡 DejaVu FM Station Link:</span>
              <span>Link directly to DJ Ital resident archives and replay slots on London's leading urban pirate & digital relay.</span>
            </div>
          </div>

          <div className="p-3.5 rounded bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-2">
            <div className="font-bold text-xs uppercase text-neutral-900 dark:text-white font-mono">
              In-Page Audio Deck Streaming:
            </div>
            <p className="text-xs">
              When listeners click <strong>"STREAM MIX"</strong> on any set, the site opens an in-page floating player supporting SoundCloud, Mixcloud, YouTube audio, and direct audio files (<code className="font-mono text-[10px]">.mp3</code>).
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Audio & Media Gallery tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('audio_media')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Audio Mixes Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'branding_bpm',
      tabKey: 'profile',
      title: '4. Profile & Signature Branding: "DjItal 164bpm"',
      badge: 'TEMPO & BRANDING',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <User className="w-4 h-4 text-amber-500" />,
      summary: 'Edit the signature brand slogan ("DjItal 164bpm"), master tempo (164 BPM), artist bio, and booking contacts.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            DJ Ital's signature branding is centered around the legendary <strong>164 BPM</strong> East London sound-system tempo:
          </p>

          <div className="p-4 rounded-lg bg-amber-500/10 border-2 border-amber-500/30 space-y-3">
            <div className="font-bold text-xs uppercase text-amber-700 dark:text-amber-400 font-mono">
              Core Branding Controls:
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-xs">
              <li>
                <strong>Brand Name / Signature Slogan:</strong> Change to any custom text (e.g. <em>"DjItal 164bpm"</em>, <em>"DJ ITAL SOUND SYSTEM 164"</em>). Used on marquee ribbons, the hero dub console, and loading screens.
              </li>
              <li>
                <strong>Signature Tempo (BPM):</strong> Adjust the master tempo clock (default <strong>164 BPM</strong>) with 1-click quick presets: <strong>160</strong>, <strong>164</strong>, <strong>168</strong>, <strong>172</strong>, or <strong>175 BPM</strong>.
              </li>
              <li>
                <strong>Turntable Dub Clock:</strong> The real-time interactive audio engine automatically syncs its beat triggers and synthesizer clocks to your selected BPM.
              </li>
            </ul>
          </div>

          <div className="space-y-1.5 text-xs">
            <p><strong>Other editable profile details:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600 dark:text-neutral-400">
              <li>Stage Name & Real Name</li>
              <li>Tagline & Editorial Subtitles</li>
              <li>Short Bio & Comprehensive Press Biography</li>
              <li>Booking Agency Email & Direct Management WhatsApp (with pre-filled message)</li>
              <li>Shopify & Linktree Merch Store Links</li>
              <li>Social Media URLs (Instagram, SoundCloud, Mixcloud, YouTube, Spotify, TikTok)</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Profile & Branding → Section 1 (Signature Tempo & Turntable Dub Clock)</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Profile and Branding</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'background_motion',
      tabKey: 'profile',
      title: '5. Background Motion & Visual FX Engine',
      badge: 'VISUAL FX',
      badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
      icon: <Sliders className="w-4 h-4 text-purple-500" />,
      summary: 'Customize the moving ambient background, floating gold vinyl particles, subwoofer pulse, and slideshows.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            The website's background is powered by a GPU-accelerated visual engine supporting 8 distinct sound-system aesthetic modes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">1. Subtle Ambient Motion:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Drifting amber & cyan spheres orbiting continuously, combined with fluid soundwave ribbons and subtle vinyl dust.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">2. Floating Bass Particles:</span>
              <span className="text-neutral-600 dark:text-neutral-400">28 distinct gold vinyl dust particles floating upwards across the viewport with organic horizontal drift.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">3. Warm Sound System Glow:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Subwoofer bass tube-glow breathing in exact tempo with your 164 BPM clock.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">4. Photo Slideshow:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Cinematic crossfade between archival rave and sound system images with subtle Ken Burns zoom. You can add photos from the Media Library, enter image URLs, reorder, or remove slides in Section 7.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">5. Dynamic Soundwave Waves:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Equalizer ribbons undulating across the horizon with glowing multi-tone frequencies.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">6. Concentric Bass Sonar:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Expanding acoustic shockwave rings radiating outwards from the turntable platter.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">7. Minimal Static:</span>
              <span className="text-neutral-600 dark:text-neutral-400">Architectural sound-stage engineering grid and acoustic dot matrix with zero motion.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-amber-500 block">8. Full Atmosphere (Hybrid):</span>
              <span className="text-neutral-600 dark:text-neutral-400">Complete sound-system stage presence uniting ambient glow, floating particles, and soundwave motion.</span>
            </div>
          </div>

          <div className="p-3 rounded bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-1 text-xs">
            <span className="font-bold text-neutral-900 dark:text-white font-mono">Speed & Motion Controls:</span>
            <p className="text-neutral-600 dark:text-neutral-400">
              Choose between <strong>Slow & Gentle</strong>, <strong>Medium</strong>, and <strong>Dynamic / Fast</strong>. If animations ever appear still, verify that your operating system does not have "Reduce Motion" enabled in accessibility settings.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Profile & Branding → Section 7</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('profile')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Edit Background Motion</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'heritage_va',
      tabKey: 'heritage',
      title: '6. Heritage & V&A East Museum Archive',
      badge: 'CULTURAL ARCHIVE',
      badgeColor: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      icon: <Landmark className="w-4 h-4 text-cyan-500" />,
      summary: 'Manage V&A National Museum recognition honours, East London pirate radio history chapters, and milestones.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            DJ Ital is officially recognised by the <strong>Victoria and Albert Museum (V&A East)</strong> for pioneering British sound system culture and UK jungle music history.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 block mb-1">🏛️ Museum Plaque & Badges:</span>
              <span>Edit the official archival citation, badge text (e.g. <em>"[ V&A NATIONAL ARCHIVE // 1991—2026 ]"</em>), and exhibition loan provenance.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 block mb-1">📖 Historical Narrative Chapters:</span>
              <span>Customize the 4 core historical tabs: <em>1991 Pirate Radio Inception</em>, <em>Kool FM Rooftop Rigs</em>, <em>Vital Fest Evolution</em>, and <em>Museum Permanent Recognition</em>.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10">
              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 block mb-1">⏱️ Interactive Milestones:</span>
              <span>Add, edit, or reorder milestone timeline cards with custom year badges ('91, '95, '23, '26).</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Heritage & V&A Archive tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('heritage')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Heritage Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'events_vitalfest',
      tabKey: 'events',
      title: '7. Vital Fest & Live Events Management',
      badge: 'LIVE SHOWS',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: <Calendar className="w-4 h-4 text-emerald-500" />,
      summary: 'Add upcoming tour dates, club nights at The Hackney Social, festival bookings, and ticket links.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Keep your fans and promoters informed on all upcoming Vital Fest clashes and live appearances:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Event Info:</strong> Title, Venue, City/Location, Date, and Start Time.</li>
            <li><strong>Lineup:</strong> Mention fellow legends (e.g. <em>Brockie, Det, Ragga Twins, Jumpin Jack Frost, Ital</em>).</li>
            <li><strong>Status:</strong> Mark shows as <strong>Upcoming</strong>, <strong>Sold Out</strong>, or <strong>Past</strong>.</li>
            <li><strong>Ticket Link:</strong> Connect directly to Skiddle, Resident Advisor, Eventbrite, or DICE.</li>
            <li><strong>Flyers:</strong> Upload high-impact event flyers with instant preview.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Events & Shows tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Events Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'releases_dubplates',
      tabKey: 'releases',
      title: '8. Releases & Acetate Dubplate Archive',
      badge: 'VINYL RELEASES',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <Disc3 className="w-4 h-4 text-amber-500" />,
      summary: 'Manage official vinyl catalog, dubplate acetate pressings, release years, and turntable audio triggers.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Showcase the deep back-catalog of Kool FM dubplates, white labels, and 12" vinyl releases:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Catalog Metadata:</strong> Release Title, Year (e.g. 1994, 1995, 2026), Record Label, Catalog Number, and Format (10" Acetate Dubplate, 12" Vinyl, Digital).</li>
            <li><strong>Turntable Integration:</strong> Releases directly integrate with the Hero section turntable console. Clicking play will spin the virtual vinyl and trigger beat stems.</li>
            <li><strong>Artwork:</strong> Upload authentic vinyl centre labels and acetate sleeve photos.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Releases & Dubplates tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('releases')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Releases Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'epk_press_kit',
      tabKey: 'epk',
      title: '9. Electronic Press Kit (EPK) & Promoter Dossier',
      badge: 'PROMOTER TOOLS',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <FileText className="w-4 h-4 text-amber-500" />,
      summary: 'Upload transparent PNG logos, vector SVGs, press photos, technical riders, and downloadable EPK PDFs.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Promoters and festival organizers can access your high-resolution assets via the <strong>DOSSIER</strong> button on the website navigation:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">Logos & Assets:</span>
              <span>Upload transparent PNG and vector SVG logos for festival flyers, stage LED screens, and printed posters.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">Press Photos:</span>
              <span>High-resolution landscape (16:9) and portrait (4:5) photos for magazine interviews and club promotion.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">Technical Rider:</span>
              <span>2x Pioneer CDJ-3000 / Technics 1210 MK7 turntable specs, mixer preferences, and monitor requirements.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">Downloadable EPK PDF:</span>
              <span>Link an offline complete press dossier PDF for agency booking representation.</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: EPK & Press Kit tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('epk')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open EPK Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'bookings_inbox',
      tabKey: 'bookings',
      title: '10. Bookings & Promoter Enquiries',
      badge: 'INBOX & CRM',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: <Inbox className="w-4 h-4 text-emerald-500" />,
      summary: 'Manage booking inquiries received through the website contact form and track confirmation status.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            When promoters fill out the <strong>"Book Selector"</strong> form on the site, inquiries land instantly in this dashboard:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Details Captured:</strong> Promoter Name, Email, Organization, Proposed Event Date, City/Country, Venue, Event Type, and Offer Details.</li>
            <li><strong>Status Workflow:</strong> Update requests from <strong>Pending</strong> to <strong>Confirmed</strong> or <strong>Declined</strong>.</li>
            <li><strong>Contact Shortcuts:</strong> 1-click email links to reply directly from your mail client.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Bookings & Enquiries tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('bookings')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Bookings Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'gallery_photos',
      tabKey: 'gallery',
      title: '11. Photo Gallery & Rave Archives',
      badge: 'PHOTO ARCHIVE',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <ImageIcon className="w-4 h-4 text-amber-500" />,
      summary: 'Curate vintage 90s pirate radio photos, sound system rig photography, and festival crowd moments.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Manage the visual photographic archive of UK jungle sound system culture:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Captions & Metadata:</strong> Title, description, historical year tag, and photography location.</li>
            <li><strong>Categories:</strong> Tag photos as <em>Sound System Rigs</em>, <em>Vital Fest</em>, <em>Kool FM Studios</em>, or <em>Dubplate Pressing</em>.</li>
            <li><strong>Interactive Lightbox:</strong> Website visitors can click any photo to open a fullscreen high-definition lightbox.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Photo Gallery tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('gallery')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Photo Gallery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'media_library',
      tabKey: 'media',
      title: '12. Media Library & File Storage',
      badge: 'ASSET VAULT',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: <Layers className="w-4 h-4 text-emerald-500" />,
      summary: 'Upload images, short movie clips, audio stems, and documents with instant persistent URLs.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            The centralized Media Library stores all uploaded files and provides instant public URLs:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Direct Uploads:</strong> Drag and drop images, video clips, MP3 audio, or PDF documents.</li>
            <li><strong>One-Click Picker:</strong> Use the <em>"Choose from Media Library"</em> modal in any editor tab instead of re-uploading duplicate files.</li>
            <li><strong>Automatic Storage Mirroring:</strong> All files uploaded are mirrored to both <code className="font-mono text-[10px]">/public/uploads</code> and the persistent disk volume.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Site Media & Library tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('media')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Media Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'social_proof',
      tabKey: 'social_proof',
      title: '13. Social Proof, Quotes & Venue Logos',
      badge: 'CREDENTIALS',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <Quote className="w-4 h-4 text-amber-500" />,
      summary: 'Display quotes from jungle legends (Brockie, Ragga Twins) and iconic venue logos.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Reinforce DJ Ital's pioneer standing with endorsements from fellow jungle pioneers and legendary clubs:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Legend Testimonials:</strong> Add quotes from peers (e.g. Brockie, Jumpin Jack Frost, Kool FM founders).</li>
            <li><strong>Star Ratings & Avatars:</strong> Include avatar images and 5-star badges.</li>
            <li><strong>Venue Logos:</strong> Add logos of clubs and institutions headlined: <em>fabric, Ministry of Sound, V&A East, Printworks, Subdub</em>.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Social Proof tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('social_proof')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Social Proof Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'newsletter_fans',
      tabKey: 'newsletter',
      title: '14. Newsletter Subscribers & Fan Club',
      badge: 'FAN COMMUNITY',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      icon: <Mail className="w-4 h-4 text-amber-500" />,
      summary: 'View fans subscribed to the Vital Fest mailing list and export email lists to CSV.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Fans signing up in the Vital Fest newsletter section are logged automatically in SQLite:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Subscriber Log:</strong> View email address, signup date, and source.</li>
            <li><strong>CSV Export:</strong> Click <strong>"Export CSV"</strong> to download a clean spreadsheet ready for Mailchimp, Substack, or ticket presales.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Newsletter tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('newsletter')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Newsletter Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'storage_persistence',
      tabKey: 'storage',
      title: '15. Website Backup & Data Restore',
      badge: 'DATA PROTECTION',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: <HardDrive className="w-4 h-4 text-emerald-500" />,
      summary: 'How content auto-saves across browser sessions, and how to export/restore complete website bundles.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Your website runs on an embedded high-speed SQLite database engine with dual-layer safety:
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">💾 Automatic Local & Server Sync:</span>
              <span>Every change made in this dashboard saves instantly to your local browser storage and synchronizes asynchronously with the Node.js backend.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">📥 Download Website Bundle (.djbundle):</span>
              <span>Click <strong>"Download Whole Website Bundle"</strong> in Backup & Restore to take an exact replica of your entire website (database, events, releases, bio, and all uploaded media) into a portable package.</span>
            </div>
            <div className="p-3 rounded sound-card border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-bold text-neutral-900 dark:text-white font-mono block">🔄 1-Click Restore:</span>
              <span>If you ever want to revert or move databases, upload your <code className="font-mono text-[10px]">.djbundle</code> or <code className="font-mono text-[10px]">.sqlite</code> file to restore instantly.</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Backup & Restore tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('storage')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Backup & Restore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'security_passkey',
      tabKey: 'security',
      title: '16. Security & Master Admin Passkey',
      badge: 'SECURITY',
      badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30',
      icon: <ShieldCheck className="w-4 h-4 text-purple-500" />,
      summary: 'Change your admin password, lock your session, and manage portal access permissions.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            Protect your website administration dashboard with passkey authorization:
          </p>

          <ul className="list-disc list-inside space-y-1.5 text-xs">
            <li><strong>Default Master Passkey:</strong> The pre-configured access key is <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono font-bold text-amber-500">djital164</code>.</li>
            <li><strong>Change Password:</strong> You can set a custom master password anytime in the <strong>Security & Password</strong> tab.</li>
            <li><strong>1-Click Lock Session:</strong> Click the padlock icon in the top header to immediately lock the admin view when stepping away.</li>
          </ul>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: Security & Password tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('security')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Security Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'sqlite_console',
      tabKey: 'sqlite',
      title: '17. Direct SQLite Query Console (Power Tool)',
      badge: 'DEVELOPER TOOL',
      badgeColor: 'bg-neutral-500/20 text-neutral-700 dark:text-neutral-300 border-neutral-500/30',
      icon: <Database className="w-4 h-4 text-neutral-400" />,
      summary: 'Inspect database tables, run custom SQL queries, verify record counts, and inspect raw schemas.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            For advanced administrative queries and audits, the SQLite Console provides direct database interaction:
          </p>

          <div className="p-3 rounded bg-neutral-900 text-neutral-200 font-mono text-xs space-y-1">
            <div className="text-neutral-400">// Example useful query:</div>
            <div className="text-amber-400">SELECT id, title, style, mediafire_url, rinse_fm_url FROM audio_mixes;</div>
          </div>

          <p className="text-xs text-neutral-500">
            View table schemas for: <code className="font-mono text-[10px]">profile</code>, <code className="font-mono text-[10px]">events</code>, <code className="font-mono text-[10px]">releases</code>, <code className="font-mono text-[10px]">documentary</code>, <code className="font-mono text-[10px]">audio_mixes</code>, <code className="font-mono text-[10px]">heritage_settings</code>, and <code className="font-mono text-[10px]">bookings</code>.
          </p>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Managed via: SQLite Console tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('sqlite')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open SQLite Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'download_codebase',
      tabKey: 'storage',
      title: '18. Download Complete Project Directory (ZIP) & Railway Deployment',
      badge: 'PROJECT EXPORT',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      icon: <FolderGit2 className="w-4 h-4 text-emerald-500" />,
      summary: 'Download the entire source code directory as a clean ZIP, and deploy smoothly on Railway with 0 errors.',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          <p>
            You can download the <strong>complete application codebase directory</strong> at any time as a clean ZIP archive directly to your computer.
          </p>

          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold text-neutral-950 dark:text-white text-sm block font-display">
                  ⚡ 1-Click Codebase ZIP Download
                </span>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                  Bundles all components, styles, server scripts, Vite configuration, .npmrc dependency resolver, and sound system assets.
                </p>
              </div>

              <a
                href="/api/download-project"
                download="dj-ital-sound-system.zip"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Full Project (ZIP)</span>
              </a>
            </div>
            <p className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
              Direct download URL: <code className="text-amber-600 dark:text-amber-400 font-bold">/api/download-project</code>
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-xs uppercase text-neutral-900 dark:text-white font-mono">
              What is included in the Download:
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Frontend React 19 Application:</strong> All TypeScript components in <code className="font-mono text-[10px]">src/</code>, Tailwind 4 styling, and icons.</li>
              <li><strong>Full-Stack Express Server:</strong> <code className="font-mono text-[10px]">server.ts</code> with automatic volume synchronization and static serving.</li>
              <li><strong>Production Build Config:</strong> <code className="font-mono text-[10px]">vite.config.ts</code> with ESM dirname compatibility and Tailwind plugin.</li>
              <li><strong>Railway CI Protection:</strong> <code className="font-mono text-[10px]">.npmrc</code> configured with <code className="font-mono text-[10px]">legacy-peer-deps=true</code> to guarantee zero npm peer resolution crashes on Railway.</li>
              <li><strong>Database & Seed Data:</strong> <code className="font-mono text-[10px]">seed_data/</code> containing the full SQLite database snapshot and metadata.</li>
              <li><strong>Audio & Media:</strong> All local artwork, badges, sounds, and sample clips in <code className="font-mono text-[10px]">public/</code> and <code className="font-mono text-[10px]">src/assets/</code>.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded bg-neutral-100 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/10 space-y-2">
            <div className="font-bold text-xs uppercase text-neutral-900 dark:text-white font-mono">
              How to Deploy this ZIP to Railway:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs">
              <li>Unzip the downloaded file on your computer.</li>
              <li>Push the folder to your GitHub repository (or use Railway CLI / Railway template).</li>
              <li>On Railway, connect your repository. Railway automatically detects Node.js and builds using <code className="font-mono text-[10px]">npm run build</code> and starts with <code className="font-mono text-[10px]">npm start</code>.</li>
              <li>In your Railway service <strong>Settings &rarr; Volumes</strong>, attach a volume with mount path <code className="font-mono text-[10px] text-amber-500 font-bold">/app/data</code>.</li>
              <li>In <strong>Variables</strong>, set <code className="font-mono text-[10px] text-amber-500 font-bold">DATA_DIR=/app/data</code>.</li>
            </ol>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-500 font-mono">Also available in: Storage & Volume Manager tab</span>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('storage')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                <span>Open Storage Manager</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ),
    },
  ];

  const categories = [
    { id: 'all', label: 'All Guides (18)' },
    { id: 'broadcast', label: 'Broadcasting & Audio' },
    { id: 'video', label: 'Video & Media' },
    { id: 'branding', label: 'Branding & 164 BPM' },
    { id: 'heritage', label: 'Heritage & Shows' },
    { id: 'system', label: 'Security & Deployment' },
  ];

  const filteredSections = sections.filter((sec) => {
    const matchesSearch =
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.badge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'all') return true;
    if (activeCategory === 'broadcast') {
      return ['live_broadcasting', 'audio_links'].includes(sec.id);
    }
    if (activeCategory === 'video') {
      return ['documentary_series', 'gallery_photos', 'media_library'].includes(sec.id);
    }
    if (activeCategory === 'branding') {
      return ['branding_bpm', 'background_motion', 'epk_press_kit'].includes(sec.id);
    }
    if (activeCategory === 'heritage') {
      return ['heritage_va', 'events_vitalfest', 'releases_dubplates', 'social_proof'].includes(sec.id);
    }
    if (activeCategory === 'system') {
      return ['storage_persistence', 'security_passkey', 'bookings_inbox', 'newsletter_fans', 'sqlite_console', 'download_codebase'].includes(sec.id);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl sound-cabinet border border-neutral-200 dark:border-white/10 bg-gradient-to-br from-amber-500/10 via-neutral-100 dark:via-neutral-900 to-amber-500/5 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>DJ ITAL SOUND SYSTEM // ADMIN MASTER REFERENCE & USER GUIDE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight">
            Admin Help & Operation Guide
          </h2>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            Exhaustive operational manual for every tab, feature, and control on your portal: 1-click live on-air broadcasting, short video clips, MediaFire & radio links, 164 BPM signature branding, background motion, and SQLite data protection.
          </p>

          {/* Quick Search */}
          <div className="pt-2 relative max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides (e.g. 'go live', 'short clips', 'mediafire', '164 bpm', 'background')..."
              className="w-full pl-10 pr-4 py-2.5 rounded bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-amber-400 shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="mt-6 pt-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center gap-2 flex-wrap text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-industrial font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                  : 'bg-white/80 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion Guide List */}
      <div className="space-y-3">
        {filteredSections.map((sec) => {
          const isExpanded = expandedSection === sec.id;
          return (
            <div
              key={sec.id}
              className={`rounded-lg sound-cabinet border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'border-amber-500/50 shadow-lg bg-white dark:bg-neutral-900/90'
                  : 'border-neutral-200 dark:border-white/10 bg-white/70 dark:bg-neutral-900/50 hover:border-neutral-300 dark:hover:border-white/20'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="p-2.5 rounded bg-neutral-100 dark:bg-white/10 shrink-0">
                    {sec.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${sec.badgeColor || 'bg-amber-400/20 text-amber-700 dark:text-amber-400 border-amber-400/30'}`}>
                        {sec.badge}
                      </span>
                    </div>
                    <h3 className="font-display font-black text-base sm:text-lg text-neutral-950 dark:text-white uppercase leading-snug truncate">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                      {sec.summary}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 p-1.5 rounded hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400">
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-neutral-100 dark:border-white/5 animate-in fade-in duration-150">
                  {sec.content}
                </div>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="p-8 text-center sound-card rounded border border-dashed border-neutral-300 dark:border-white/20">
            <HelpCircle className="w-8 h-8 mx-auto text-amber-500 opacity-60 mb-2" />
            <p className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
              No matching help guides found for "{searchQuery}"
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-2 text-xs font-mono text-amber-500 underline cursor-pointer"
            >
              Reset filters and view all 17 guides
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
