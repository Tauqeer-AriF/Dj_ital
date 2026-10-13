import React, { useState, useRef } from 'react';
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
  Upload,
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
  Server,
  Landmark,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import {
  ProfileData,
  EventData,
  ReleaseData,
  GalleryData,
  BookingData,
  downloadDatabaseFile,
  forcePushToServer,
  forcePullFromServer,
  importDatabaseBinary,
} from '../../db/sqlite';
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
import { HeritageManager } from './HeritageManager';

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
  | 'heritage'
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
  const { showSuccess, showError } = useToast();

  const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadDb = async () => {
    try {
      await downloadDatabaseFile();
      showSuccess('SQLite Database Exported', 'Downloaded .sqlite backup file to your device.');
    } catch (err: any) {
      console.error('Failed to export SQLite database:', err);
      showError('Export Failed', err?.message || 'Could not export database.');
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const buffer = await file.arrayBuffer();
      await importDatabaseBinary(new Uint8Array(buffer));
      const msg = 'Database restored successfully from backup and synchronized across all devices!';
      setSyncFeedback('✅ ' + msg);
      showSuccess('Database Restored', msg);
      onRefreshData();
    } catch (err: any) {
      console.error('Failed to import database:', err);
      const errMsg = err?.message || 'Invalid SQLite file';
      setSyncFeedback('⚠️ Failed to restore backup: ' + errMsg);
      showError('Restore Failed', errMsg);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePushToCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await forcePushToServer();
      if (res.success) {
        const msg = 'Synchronised! All devices will now display your updated images & data.';
        setSyncFeedback('✅ ' + msg);
        showSuccess('Sync Successful', msg);
        onRefreshData();
      } else {
        setSyncFeedback('⚠️ ' + res.message);
        showError('Sync Warning', res.message);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Server error';
      setSyncFeedback('⚠️ Error during sync: ' + errMsg);
      showError('Sync Error', errMsg);
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
        showSuccess('Database Updated', 'Successfully pulled latest changes from server.');
        onRefreshData();
      } else {
        setSyncFeedback('⚠️ ' + res.message);
        showError('Pull Failed', res.message);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Server error';
      setSyncFeedback('⚠️ Error pulling: ' + errMsg);
      showError('Pull Error', errMsg);
    } finally {
      setIsSyncing(false);
    }
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Password', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'heritage', label: 'Heritage & V&A Archive', icon: <Landmark className="w-4 h-4" /> },
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-400/40 bg-amber-400/10 text-amber-900 dark:text-amber-300 hover:bg-amber-400/20 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync to All Devices'}</span>
            <span className="sm:hidden">Sync</span>
          </button>

          <button
            onClick={handleRestoreClick}
            disabled={isSyncing}
            title="Upload and restore a previous .sqlite database backup"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>

          <button
            onClick={handleDownloadDb}
            title="Download SQLite Database File (.sqlite)"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .sqlite</span>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-neutral-700" />}
          </button>

          {onLock && (
            <button
              onClick={onLock}
              className="p-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-red-500 dark:border-white/10 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Lock Admin Dashboard"
              aria-label="Lock dashboard"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="hover-shimmer px-3.5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
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
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold tabular-nums ${
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
              <div className="p-6 sm:p-8 rounded sound-cabinet border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl relative overflow-hidden">
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
                    Manage real-time tour dates, discography releases, gallery archives, biographical copy, and customise every image across the website with automatic cloud persistence across Windows, iOS, Mac, and Android.
                  </p>
                </div>
              </div>

              {/* Hidden file input for restoring SQLite backups */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadBackup}
                accept=".sqlite,.db"
                className="hidden"
                aria-label="Upload SQLite backup"
              />

              {/* Cross-Device Sync Card */}
              <div className="p-6 rounded sound-cabinet border border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-neutral-900/10 to-amber-500/10 dark:bg-neutral-900/80 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                      <Cloud className="w-4 h-4 text-amber-500" />
                      <span>Cross-Device Cloud Sync & Persistence</span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-neutral-950 dark:text-white">
                      Synchronize Media & Database Across All Phones & Computers
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
                      Your changes are automatically saved to browser storage and synced to the live server. When you update content, click <strong>"Broadcast to All Devices"</strong> to immediately publish your custom images and records to all visitors.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={handlePushToCloud}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Broadcast to All Devices'}</span>
                    </button>
                    <button
                      onClick={handlePullFromCloud}
                      disabled={isSyncing}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <span>Pull Latest from Server</span>
                    </button>
                    <button
                      onClick={handleRestoreClick}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded border border-amber-400/40 hover:bg-amber-400/10 text-xs font-medium text-amber-900 dark:text-amber-300 transition-colors cursor-pointer"
                      title="Upload and restore a previous .sqlite database backup"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Restore Backup</span>
                    </button>
                    <button
                      onClick={handleDownloadDb}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded border border-neutral-300 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                      title="Download complete database backup file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .sqlite</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-white/5 text-[11px] text-neutral-600 dark:text-neutral-300 leading-normal">
                  <Server className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-white">Continuous Deployment Protection:</span>{' '}
                    Your custom dashboard changes are now protected against code redeployments. Even if a new container image is started, your newest local edits automatically heal and repopulate the server. For 100% server-side persistence on Railway, attach a Volume at <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">/data</code>.
                  </div>
                </div>

                {syncFeedback && (
                  <div className="p-3 rounded bg-amber-400/15 border border-amber-400/40 text-xs text-amber-950 dark:text-amber-200 font-medium">
                    {syncFeedback}
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div
                  onClick={() => setActiveTab('heritage')}
                  className="p-5 rounded sound-card border border-cyan-400/40 bg-white shadow-sm hover:shadow-md hover:border-cyan-500 dark:border-cyan-400/20 dark:bg-neutral-900/70 dark:hover:border-cyan-400 cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-white">Heritage & V&A</span>
                    <Landmark className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-3xl font-display font-bold text-neutral-950 dark:text-white">
                    100%
                  </div>
                  <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-medium">
                    Fully Customisable
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('media')}
                  className="p-5 rounded sound-card border border-amber-400/40 bg-white shadow-sm hover:shadow-md hover:border-amber-500 dark:border-amber-400/20 dark:bg-neutral-900/70 dark:hover:border-amber-400 cursor-pointer transition-all space-y-2 group"
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
                  className="p-5 rounded sound-card border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
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
                  className="p-5 rounded sound-card border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
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
                  className="p-5 rounded sound-card border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-amber-500/40 dark:border-white/10 dark:bg-neutral-900/70 dark:hover:border-amber-400/40 cursor-pointer transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Booking Enquiries</span>
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
                {/* Recent Enquiries Card */}
                <div className="p-6 rounded sound-card border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 space-y-4">
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
                        className="p-3 rounded bg-neutral-50 border border-neutral-200 text-neutral-900 dark:bg-black/40 dark:border-white/5 dark:text-white flex items-center justify-between text-xs"
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
                <div className="p-6 rounded sound-card border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 space-y-4">
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
                    {Boolean(profile?.navbar_subtitle || profile?.subtitle) && (
                      <div>
                        <span className="text-neutral-500">Navbar Sub-title: </span>
                        <span className="text-amber-500 dark:text-amber-400 font-medium">
                          {profile?.navbar_subtitle || profile?.subtitle}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-neutral-500">Kool FM Role: </span>
                      <span>{profile?.kool_fm_role}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">V&A Museum Honour: </span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-medium">{profile?.va_recognition_year} Recognised</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveTab('heritage')}
                      className="px-3 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Edit Heritage & V&A Archive
                    </button>
                    <button
                      onClick={() => setActiveTab('media')}
                      className="px-3 py-1.5 rounded bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer hover:bg-amber-300 shadow-sm"
                    >
                      Manage Media & Documents
                    </button>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="px-3 py-1.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-900 dark:bg-white/10 dark:hover:bg-white/20 text-xs font-semibold dark:text-white transition-colors cursor-pointer"
                    >
                      Edit Profile and Branding
                    </button>
                    <button
                      onClick={() => setActiveTab('sqlite')}
                      className="px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Open SQLite Query Tool
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && <SecurityManager />}
          {activeTab === 'heritage' && <HeritageManager onRefresh={onRefreshData} />}
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
