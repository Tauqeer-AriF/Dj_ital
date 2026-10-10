import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Disc3,
  Image,
  User,
  Inbox,
  Database,
  ArrowLeft,
  Sun,
  Moon,
  CheckCircle,
  Radio,
  Download,
  Lock,
  Layers,
  Cloud,
  RefreshCw,
  Smartphone,
  Monitor,
  Music,
  FileText,
  Quote,
  Mail,
  FolderArchive,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ProfileData, EventData, ReleaseData, GalleryData, BookingData, downloadDatabaseFile, forcePushToServer, forcePullFromServer } from '../../db/sqlite';
import { EventsManager } from './EventsManager';
import { ReleasesManager } from './ReleasesManager';
import { GalleryManager } from './GalleryManager';
import { ProfileManager } from './ProfileManager';
import { BookingsManager } from './BookingsManager';
import { SqliteConsole } from './SqliteConsole';
import { MediaLibraryManager } from './MediaLibraryManager';
import { AudioMediaManager } from './AudioMediaManager';
import { EPKManager } from './EPKManager';
import { SocialProofManager } from './SocialProofManager';
import { NewsletterManager } from './NewsletterManager';
import { SecurityManager } from './SecurityManager';

interface AdminDashboardProps {
  onClose: () => void;
  onLock?: () => void;
  profile: ProfileData | null;
  events: EventData[];
  releases: ReleaseData[];
  gallery: GalleryData[];
  bookings: BookingData[];
  onRefreshData: () => void;
}

type TabType =
  | 'overview'
  | 'security'
  | 'events'
  | 'audio_media'
  | 'epk'
  | 'social_proof'
  | 'newsletter'
  | 'releases'
  | 'gallery'
  | 'media'
  | 'profile'
  | 'bookings'
  | 'sqlite';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onLock,
  profile,
  events,
  releases,
  gallery,
  bookings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;

  const handleDownloadDb = async () => {
    try {
      await downloadDatabaseFile();
    } catch (err) {
      console.error('Failed to export SQLite database:', err);
    }
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await forcePushToServer();
      if (res.success) {
        setSyncFeedback('✅ Synchronized! All devices (iOS, Android, Windows) will now display your updated images & data.');
        onRefreshData();
      } else {
        setSyncFeedback('⚠️ ' + res.message);
      }
    } catch (err: any) {
      setSyncFeedback('⚠️ Error during sync: ' + (err?.message || 'Server error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await forcePullFromServer();
      if (res.success) {
        setSyncFeedback('✅ Pulled latest database from server.');
        onRefreshData();
      } else {
        setSyncFeedback('⚠️ ' + res.message);
      }
    } catch (err: any) {
      setSyncFeedback('⚠️ Error pulling: ' + (err?.message || 'Server error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Password', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'media', label: 'Media & Documents', icon: <FolderArchive className="w-4 h-4" /> },
    { id: 'events', label: 'Vital Fest & Events', icon: <Calendar className="w-4 h-4" />, badge: events.length },
    { id: 'audio_media', label: 'Audio & Media Gallery', icon: <Music className="w-4 h-4" /> },
    { id: 'epk', label: 'Press Kit (EPK)', icon: <FileText className="w-4 h-4" /> },
    { id: 'social_proof', label: 'Testimonials & Venues', icon: <Quote className="w-4 h-4" /> },
    { id: 'newsletter', label: 'Newsletter Subscribers', icon: <Mail className="w-4 h-4" /> },
    { id: 'releases', label: 'Releases & Dubs', icon: <Disc3 className="w-4 h-4" />, badge: releases.length },
    { id: 'gallery', label: 'Visual Gallery', icon: <Image className="w-4 h-4" />, badge: gallery.length },
    { id: 'profile', label: 'Profile and branding', icon: <User className="w-4 h-4" /> },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Inbox className="w-4 h-4" />,
      badge: pendingBookings > 0 ? pendingBookings : undefined,
    },
    { id: 'sqlite', label: 'SQLite Console', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col antialiased transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 dark:border-white/10 glass-panel px-4 sm:px-6 py-3.5 flex items-center justify-between before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-amber-400/30 before:to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-display font-bold text-neutral-950 dark:text-white tracking-tight">
              DJ ITAL <span className="text-amber-500 dark:text-amber-400">ADMIN</span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
              <CheckCircle className="w-3 h-3" />
              SQLite Persistent DB Active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePushToCloud}
            disabled={isSyncing}
            title="Broadcast and sync database to all devices (iOS, Android, Windows)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 text-amber-900 dark:text-amber-300 hover:bg-amber-400/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync to All Devices'}</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            onClick={handleDownloadDb}
            title="Download SQLite Database File (.sqlite)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sqlite</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {onLock && (
            <button
              onClick={onLock}
              className="p-2 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-red-500 dark:border-white/10 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Lock Admin Dashboard"
              aria-label="Lock dashboard"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="hover-shimmer px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            View Live Site
          </button>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200/80 dark:border-white/10 glass-panel p-3 sm:p-4 shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-600 dark:text-neutral-300 px-3 py-2 font-bold hidden md:block">
            Database Collections
          </div>
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold tabular-nums ${
                        isActive
                          ? 'bg-neutral-950 text-amber-400'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcome Banner */}
              <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl relative overflow-hidden">
                <div className="relative z-10 max-w-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                    <span>SQLite Relational Engine</span>
                    <span aria-hidden="true">·</span>
                    <span>Server Sync Active</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
                    DJ Ital Heritage Management Console
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                    Manage real-time tour dates, discography releases, gallery archives, biographical copy, and customize every image across the website with automatic cloud persistence across Windows, iOS, Mac, and Android.
                  </p>
                </div>
              </div>

              {/* Cross-Device Sync Card */}
              <div className="p-6 rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-neutral-900/10 to-amber-500/10 dark:bg-neutral-900/80 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                      <Cloud className="w-4 h-4 text-amber-500" />
                      <span>Cross-Device Cloud Sync (iOS & Windows)</span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-neutral-950 dark:text-white">
                      Synchronize Media & Database Across All Phones & Computers
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl">
                      When you update images or content on your Windows computer or iOS iPhone, click <strong>"Broadcast to All Devices"</strong> to immediately publish your custom images and records to the live server.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={handlePushToCloud}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Broadcast to All Devices'}</span>
                    </button>
                    <button
                      onClick={handlePullFromCloud}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <span>Pull Latest from Server</span>
                    </button>
                  </div>
                </div>

                {syncFeedback && (
                  <div className="p-3 rounded-xl bg-amber-400/15 border border-amber-400/40 text-xs text-amber-950 dark:text-amber-200 font-medium">
                    {syncFeedback}
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('media')}
                  className="p-5 rounded-2xl border border-amber-400/40 bg-white shadow-sm hover:shadow-md hover:border-amber-500 dark:border-amber-400/20 dark:bg-neutral-900/70 dark:hover:border-amber-400 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-white">Site Images & Media</span>
                    <Layers className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-display font-bold text-neutral-950 dark:text-white">
                    10 Slots
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">
                    Hero, V&A, Vital Fest, Docs
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('events')}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Events & Shows</span>
                    <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-display font-bold text-neutral-950 dark:text-white tabular-nums">
                    {events.length}
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400/80 font-mono font-medium">
                    {events.filter((e) => e.status === 'Upcoming').length} upcoming
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('releases')}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Releases & Dubs</span>
                    <Disc3 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-display font-bold text-neutral-950 dark:text-white tabular-nums">
                    {releases.length}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                    Mid-90s to Present
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('bookings')}
                  className="p-5 rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Bookings Inquiries</span>
                    <Inbox className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div className="text-3xl font-display font-bold text-neutral-950 dark:text-white tabular-nums">
                    {bookings.length}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    {pendingBookings} pending review
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Bookings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Inquiries Card */}
                <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-display font-bold text-neutral-950 dark:text-white">Recent Booking Requests</h3>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 dark:bg-black/40 dark:border-white/5 dark:text-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-neutral-950 dark:text-white">{b.client_name}</div>
                          <div className="text-neutral-500 dark:text-neutral-400">{b.event_type} · {b.target_date || 'Date TBD'}</div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-neutral-100 dark:bg-white/5 border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Snapshot & Quick Shortcuts */}
                <div className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 space-y-4">
                  <h3 className="text-base font-display font-bold text-neutral-950 dark:text-white">Artist Profile & Media Status</h3>
                  <div className="text-xs space-y-2 text-neutral-700 dark:text-neutral-300">
                    <div>
                      <span className="text-neutral-500">Artist: </span>
                      <span className="font-semibold text-neutral-950 dark:text-white">{profile?.stage_name}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Tagline: </span>
                      <span>{profile?.tagline}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Kool FM Role: </span>
                      <span>{profile?.kool_fm_role}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">V&A Museum Honor: </span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-medium">{profile?.va_recognition_year} Recognized</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTab('media')}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer hover:bg-amber-300 shadow-sm"
                    >
                      Manage Media & Documents
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold dark:text-white transition-colors cursor-pointer"
                    >
                      Edit Profile and Branding
                    </button>
                    <button
                      onClick={() => setActiveTab('sqlite')}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Open SQLite Query Tool
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && <SecurityManager />}
          {activeTab === 'media' && <MediaLibraryManager onRefresh={onRefreshData} />}
          {activeTab === 'events' && <EventsManager events={events} onRefresh={onRefreshData} />}
          {activeTab === 'audio_media' && <AudioMediaManager onRefresh={onRefreshData} />}
          {activeTab === 'epk' && <EPKManager profile={profile} onRefresh={onRefreshData} />}
          {activeTab === 'social_proof' && <SocialProofManager onRefresh={onRefreshData} />}
          {activeTab === 'newsletter' && <NewsletterManager onRefresh={onRefreshData} />}
          {activeTab === 'releases' && <ReleasesManager releases={releases} onRefresh={onRefreshData} />}
          {activeTab === 'gallery' && <GalleryManager gallery={gallery} onRefresh={onRefreshData} />}
          {activeTab === 'profile' && (
            <ProfileManager
              profile={profile}
              onRefresh={onRefreshData}
              onNavigateToSecurity={() => setActiveTab('security')}
            />
          )}
          {activeTab === 'bookings' && <BookingsManager bookings={bookings} onRefresh={onRefreshData} />}
          {activeTab === 'sqlite' && <SqliteConsole onRefresh={onRefreshData} />}
        </main>
      </div>
    </div>
  );
};
