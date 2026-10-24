import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Disc3,
  Image,
  User,
  Inbox,
  Database,
  Sun,
  Moon,
  CheckCircle,
  RotateCcw,
  Lock,
  Music,
  FileText,
  Quote,
  Mail,
  FolderArchive,
  KeyRound,
  Landmark,
  Video,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import {
  ProfileData,
  EventData,
  ReleaseData,
  GalleryData,
  BookingData,
  DocumentaryData,
  updateProfile,
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
import { DocumentaryManager } from './DocumentaryManager';
import { BackupRestoreManager } from './BackupRestoreManager';
import { AdminHelp } from './AdminHelp';
import { REMEMBERED_AUTH_KEY } from './AdminEntryConfirmModal';

interface AdminDashboardProps {
  onClose: () => void;
  onLock?: () => void;
  profile: ProfileData | null;
  events: EventData[];
  releases: ReleaseData[];
  gallery: GalleryData[];
  bookings: BookingData[];
  documentaries?: DocumentaryData[];
  onRefreshData: () => void;
}

type TabType =
  | 'analytics'
  | 'security'
  | 'backup_restore'
  | 'storage'
  | 'heritage'
  | 'documentary'
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
  | 'sqlite'
  | 'help';

interface VisitAnalyticsData {
  totalVisits: number;
  visitsLast30Days: number;
  uniqueSessionsLast30Days: number;
  daily: Array<{ date: string; visits: number }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onLock,
  profile,
  events,
  releases,
  gallery,
  bookings,
  documentaries = [],
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [visitAnalytics, setVisitAnalytics] = useState<VisitAnalyticsData | null>(null);
  const [visitAnalyticsError, setVisitAnalyticsError] = useState<string | null>(null);
  const [isLoadingVisitAnalytics, setIsLoadingVisitAnalytics] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { showSuccess, showError } = useToast();
  const { isSaving, savingMessage, recentlySaved, withSaving } = useSaving();

  const pendingBookings = bookings.filter((b) => b.status === 'Pending').length;
  const upcomingEvents = events.filter((event) => event.status.toLowerCase() === 'upcoming').length;
  const confirmedBookings = bookings.filter((booking) =>
    ['confirmed', 'accepted', 'approved'].includes(booking.status.trim().toLowerCase())
  ).length;
  const bookingStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      const status = booking.status.trim() || 'Unknown';
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [bookings]);
  const eventStatusData = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((event) => {
      const status = event.status.trim() || 'Unknown';
      counts.set(status, (counts.get(status) || 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }, [events]);
  const monthlyBookings = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleDateString(undefined, { month: 'short' }),
        count: 0,
      };
    });
    const monthIndexes = new Map(months.map((month, index) => [month.key, index]));

    bookings.forEach((booking) => {
      const createdAt = new Date(booking.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      const index = monthIndexes.get(`${createdAt.getFullYear()}-${createdAt.getMonth()}`);
      if (index !== undefined) months[index].count += 1;
    });
    return months;
  }, [bookings]);
  const topBookingTypes = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      const type = booking.event_type.trim() || 'Unspecified';
      counts.set(type, (counts.get(type) || 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [bookings]);
  const galleryCategoryStats = useMemo(() => {
    const counts = new Map<string, number>();
    gallery.forEach((item) => {
      const category = item.category.trim() || 'Uncategorised';
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [gallery]);
  const releaseAssetStats = [
    { label: 'With audio', count: releases.filter((release) => Boolean(release.stream_url?.trim())).length },
    { label: 'With cover', count: releases.filter((release) => Boolean(release.album_cover_url?.trim())).length },
    { label: 'With video', count: releases.filter((release) => Boolean(release.video_url?.trim())).length },
  ];
  const maxMonthlyBookings = Math.max(...monthlyBookings.map((month) => month.count), 1);
  const maxBookingTypeCount = Math.max(...topBookingTypes.map((item) => item.count), 1);
  const maxGalleryCategoryCount = Math.max(...galleryCategoryStats.map((item) => item.count), 1);
  const maxBookingStatusCount = Math.max(...bookingStatusData.map((item) => item.count), 1);
  const maxEventStatusCount = Math.max(...eventStatusData.map((item) => item.count), 1);
  const maxDailyVisits = Math.max(...(visitAnalytics?.daily.map((day) => day.visits) || []), 1);

  useEffect(() => {
    if (activeTab !== 'analytics') return;

    const controller = new AbortController();
    const loadVisitAnalytics = async () => {
      setIsLoadingVisitAnalytics(true);
      setVisitAnalyticsError(null);
      try {
        const response = await fetch('/api/analytics/visits', {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Could not load visitor analytics (HTTP ${response.status}).`);

        const result: unknown = await response.json();
        if (
          typeof result !== 'object' ||
          result === null ||
          !('totalVisits' in result) ||
          typeof result.totalVisits !== 'number' ||
          !('visitsLast30Days' in result) ||
          typeof result.visitsLast30Days !== 'number' ||
          !('uniqueSessionsLast30Days' in result) ||
          typeof result.uniqueSessionsLast30Days !== 'number' ||
          !('daily' in result) ||
          !Array.isArray(result.daily) ||
          !result.daily.every(
            (day) =>
              typeof day === 'object' &&
              day !== null &&
              'date' in day &&
              typeof day.date === 'string' &&
              'visits' in day &&
              typeof day.visits === 'number'
          )
        ) {
          throw new Error('The server returned invalid visitor analytics data.');
        }
        setVisitAnalytics(result as VisitAnalyticsData);
      } catch (error) {
        if (controller.signal.aborted) return;
        const message = error instanceof Error ? error.message : 'Could not load visitor analytics.';
        setVisitAnalyticsError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoadingVisitAnalytics(false);
      }
    };

    void loadVisitAnalytics();
    return () => controller.abort();
  }, [activeTab]);

  const handleToggleLive = async () => {
    if (isTogglingLive) return;
    setIsTogglingLive(true);
    try {
      await withSaving(async () => {
        const nextStatus = profile?.is_live_on_air ? 0 : 1;
        await updateProfile({ is_live_on_air: nextStatus });
        onRefreshData();
        if (nextStatus) {
          showSuccess('LIVE BROADCAST ACTIVE', '🔴 Station is now LIVE ON AIR! Broadcast beacon active on site.');
        } else {
          showSuccess('STATION OFF AIR', 'Station set to OFF AIR. Public site switched to Archive Vault & Dubplates.');
        }
      }, 'Updating station broadcast transmission status...');
    } catch (err: any) {
      showError('Failed to change broadcast status', err?.message || 'Database error');
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleLockDashboard = () => {
    try {
      localStorage.removeItem(REMEMBERED_AUTH_KEY);
    } catch {
      // Locking still clears the active session through the parent callback.
    }
    onLock?.();
  };

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'help', label: 'Admin Help & Guide', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Password', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'backup_restore', label: 'Backup & Restore', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'heritage', label: 'Heritage & V&A Archive', icon: <Landmark className="w-4 h-4" /> },
    {
      id: 'documentary',
      label: 'Documentary Series',
      icon: <Video className="w-4 h-4" />,
      badge: documentaries ? documentaries.length : undefined,
    },
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

            {/* 1-Click Master Live Broadcast Switch */}
            <button
              type="button"
              onClick={handleToggleLive}
              disabled={isTogglingLive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-wait ${
                profile?.is_live_on_air
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse ring-2 ring-red-400/50'
                  : 'bg-neutral-200 dark:bg-white/10 hover:bg-emerald-500 hover:text-neutral-950 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-white/10'
              }`}
              title={profile?.is_live_on_air ? 'Click to stop broadcasting and go Off Air' : 'Click to Go Live and broadcast stream to listeners'}
            >
              {isTogglingLive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span className={`w-2 h-2 rounded-full ${profile?.is_live_on_air ? 'bg-white' : 'bg-neutral-500'}`} />
              )}
              <span className="hidden sm:inline">
                {isTogglingLive
                  ? 'SAVING STATUS...'
                  : profile?.is_live_on_air
                  ? '🔴 ON AIR (CLICK TO GO OFF AIR)'
                  : '⚪ OFF AIR (CLICK TO GO LIVE)'}
              </span>
              <span className="sm:hidden">
                {isTogglingLive ? 'SAVING...' : profile?.is_live_on_air ? '🔴 ON AIR' : '⚪ OFF AIR'}
              </span>
            </button>

            {/* Global Live Save Status Indicator */}
            {isSaving ? (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold animate-pulse shrink-0"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                <span className="hidden sm:inline">Saving to Database...</span>
                <span className="sm:hidden">Saving...</span>
              </div>
            ) : recentlySaved ? (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold shrink-0 animate-in fade-in"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="hidden sm:inline">All Changes Saved</span>
                <span className="sm:hidden">Saved</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Help Guide Button */}
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer border ${
              activeTab === 'help'
                ? 'bg-amber-400 text-neutral-950 border-amber-400 font-bold'
                : 'border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 dark:border-white/10 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-white/5'
            }`}
            title="Open Admin Help & Documentation"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Help Guide</span>
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
              onClick={handleLockDashboard}
              className="p-2 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100 hover:text-red-500 dark:border-white/10 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="Lock Admin Dashboard"
              aria-label="Lock dashboard"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-shimmer px-3.5 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
          >
            View Live Site
          </a>
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
          {/* Real-time Save Progress Banner across all tabs */}
          {isSaving && (
            <div
              role="status"
              aria-live="polite"
              className="mb-6 p-3.5 rounded border border-amber-500/40 bg-amber-500/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-200 flex items-center justify-between shadow-sm animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                <span className="text-xs font-mono font-bold">
                  {savingMessage || 'Saving changes to database...'}
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-80 hidden sm:inline flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>Persisting to SQLite storage</span>
              </span>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    <BarChart3 className="h-4 w-4" />
                    Dashboard Analytics
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white">Performance & Content Insights</h2>
                  <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    Live summaries from booking requests and the content currently managed on your site.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                  Data updates when dashboard records change
                </div>
              </div>

              <div className="rounded border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                Visits are measured with a temporary first-party browser session ID. No IP addresses or third-party tracking services are used. A session is an estimate, not a guaranteed count of individual people.
              </div>

              <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-display font-bold text-neutral-950 dark:text-white">Site visits</h3>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Public site sessions recorded by the server</p>
                  </div>
                  {isLoadingVisitAnalytics && !visitAnalytics ? (
                    <div role="status" className="text-xs text-neutral-500 dark:text-neutral-400">Loading visit data...</div>
                  ) : visitAnalyticsError ? (
                    <div role="alert" className="text-xs text-red-600 dark:text-red-400">{visitAnalyticsError}</div>
                  ) : visitAnalytics ? (
                    <div className="grid grid-cols-3 gap-3 sm:gap-6">
                      {[
                        { label: 'All-time visits', value: visitAnalytics.totalVisits },
                        { label: 'Last 30 days', value: visitAnalytics.visitsLast30Days },
                        { label: 'Sessions (30d)', value: visitAnalytics.uniqueSessionsLast30Days },
                      ].map((metric) => (
                        <div key={metric.label} className="min-w-0">
                          <div className="text-xl sm:text-2xl font-display font-black tabular-nums text-neutral-950 dark:text-white">{metric.value}</div>
                          <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">No visit data recorded yet.</div>
                  )}
                </div>
                {visitAnalytics && !visitAnalyticsError && (
                  <div className="mt-6">
                    <div className="flex h-36 items-end gap-1 border-b border-neutral-200 dark:border-white/10 sm:gap-1.5">
                      {visitAnalytics.daily.map((day, index) => {
                        const dayLabel = new Date(`${day.date}T00:00:00Z`).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          timeZone: 'UTC',
                        });
                        return (
                          <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                            <div
                              className="w-full max-w-3 rounded-t bg-emerald-500 transition-colors group-hover:bg-amber-400 sm:max-w-4"
                              style={{ height: `${Math.max((day.visits / maxDailyVisits) * 100, day.visits ? 7 : 2)}%` }}
                              title={`${dayLabel}: ${day.visits} visits`}
                            />
                            {index % 5 === 0 && (
                              <span className="absolute -bottom-5 whitespace-nowrap text-[8px] font-mono text-neutral-500 dark:text-neutral-400 sm:text-[9px]">
                                {dayLabel}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-8 text-[10px] text-neutral-500 dark:text-neutral-400">Daily visits for the last 30 days. Each browser session is counted once per day.</p>
                  </div>
                )}
              </section>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Booking enquiries', value: bookings.length, detail: `${pendingBookings} awaiting review`, icon: <Inbox className="h-4 w-4" />, tab: 'bookings' as TabType },
                  { label: 'Upcoming events', value: upcomingEvents, detail: `${events.length} events in catalogue`, icon: <Calendar className="h-4 w-4" />, tab: 'events' as TabType },
                  { label: 'Music releases', value: releases.length, detail: `${releaseAssetStats[0].count} with audio attached`, icon: <Disc3 className="h-4 w-4" />, tab: 'releases' as TabType },
                  { label: 'Gallery assets', value: gallery.length, detail: `${new Set(gallery.map((item) => item.category).filter(Boolean)).size} categories`, icon: <Image className="h-4 w-4" />, tab: 'gallery' as TabType },
                ].map((metric) => (
                  <button
                    key={metric.label}
                    type="button"
                    onClick={() => setActiveTab(metric.tab)}
                    className="rounded sound-card border border-neutral-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-amber-400 dark:border-white/10 dark:bg-neutral-900/70"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      {metric.label}
                      <span className="text-amber-500">{metric.icon}</span>
                    </div>
                    <div className="mt-3 text-3xl font-display font-black tabular-nums text-neutral-950 dark:text-white">{metric.value}</div>
                    <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{metric.detail}</div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-neutral-950 dark:text-white">Booking enquiry trend</h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">New submissions over the last six months</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('bookings')} className="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400">
                      View bookings
                    </button>
                  </div>
                  <div className="flex h-40 items-end gap-3 border-b border-neutral-200 dark:border-white/10">
                    {monthlyBookings.map((month) => (
                      <div key={month.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] font-mono text-neutral-600 dark:text-neutral-300">{month.count}</span>
                        <div
                          className="w-full max-w-12 rounded-t bg-amber-400 transition-all"
                          style={{ height: `${Math.max((month.count / maxMonthlyBookings) * 100, month.count ? 8 : 2)}%` }}
                          title={`${month.label}: ${month.count} enquiries`}
                        />
                        <span className="pb-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{month.label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[11px] text-neutral-500 dark:text-neutral-400">
                    {bookings.filter((booking) => {
                      const date = new Date(booking.created_at);
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      return !Number.isNaN(date.getTime()) && date >= start;
                    }).length} enquiries received in the last 30 days · {confirmedBookings} confirmed or approved overall
                  </p>
                </section>

                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                  <h3 className="font-display font-bold text-neutral-950 dark:text-white">Booking pipeline</h3>
                  <p className="mb-5 text-[11px] text-neutral-500 dark:text-neutral-400">Distribution by current request status</p>
                  {bookingStatusData.length ? (
                    <div className="space-y-4">
                      {bookingStatusData.map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.label}</span>
                            <span className="font-mono text-neutral-500 dark:text-neutral-400">{item.count} ({Math.round((item.count / bookings.length) * 100)}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${(item.count / maxBookingStatusCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs text-neutral-500">No booking enquiries yet.</p>
                  )}
                </section>

                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                  <h3 className="font-display font-bold text-neutral-950 dark:text-white">Popular enquiry types</h3>
                  <p className="mb-5 text-[11px] text-neutral-500 dark:text-neutral-400">Most requested booking categories</p>
                  {topBookingTypes.length ? (
                    <div className="space-y-4">
                      {topBookingTypes.map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="truncate pr-3 font-medium text-neutral-800 dark:text-neutral-200">{item.label}</span>
                            <span className="font-mono text-neutral-500 dark:text-neutral-400">{item.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(item.count / maxBookingTypeCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs text-neutral-500">No enquiry category data yet.</p>
                  )}
                </section>

                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-neutral-950 dark:text-white">Event catalogue status</h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Event records grouped by status</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('events')} className="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400">
                      Manage events
                    </button>
                  </div>
                  {eventStatusData.length ? (
                    <div className="space-y-4">
                      {eventStatusData.map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.label}</span>
                            <span className="font-mono text-neutral-500 dark:text-neutral-400">{item.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(item.count / maxEventStatusCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-xs text-neutral-500">No events in the catalogue yet.</p>
                  )}
                </section>

                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-neutral-950 dark:text-white">Release asset coverage</h3>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Releases with linked media</p>
                    </div>
                    <button type="button" onClick={() => setActiveTab('releases')} className="text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400">
                      Manage releases
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {releaseAssetStats.map((item) => (
                      <div key={item.label} className="rounded border border-neutral-200 bg-neutral-50 p-3 text-center dark:border-white/10 dark:bg-black/20">
                        <div className="text-2xl font-display font-black tabular-nums text-neutral-950 dark:text-white">{item.count}</div>
                        <div className="mt-1 text-[10px] font-mono uppercase text-neutral-500 dark:text-neutral-400">{item.label}</div>
                        <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                          {releases.length ? Math.round((item.count / releases.length) * 100) : 0}% of releases
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-neutral-100 px-2.5 py-1.5 text-neutral-700 dark:bg-white/10 dark:text-neutral-300">{events.length} events</span>
                    <span className="rounded bg-neutral-100 px-2.5 py-1.5 text-neutral-700 dark:bg-white/10 dark:text-neutral-300">{documentaries.length} documentary episodes</span>
                    <span className="rounded bg-neutral-100 px-2.5 py-1.5 text-neutral-700 dark:bg-white/10 dark:text-neutral-300">{gallery.filter((item) => /video/i.test(item.category)).length} gallery video clips</span>
                  </div>
                </section>

                <section className="rounded sound-card border border-neutral-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900/60 xl:col-span-2">
                  <h3 className="font-display font-bold text-neutral-950 dark:text-white">Gallery category distribution</h3>
                  <p className="mb-5 text-[11px] text-neutral-500 dark:text-neutral-400">Assets grouped by their assigned category</p>
                  {galleryCategoryStats.length ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {galleryCategoryStats.map((item) => (
                        <div key={item.label}>
                          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{item.label}</span>
                            <span className="font-mono text-neutral-500 dark:text-neutral-400">{item.count}</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                            <div className="h-full rounded-full bg-violet-500" style={{ width: `${(item.count / maxGalleryCategoryCount) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-neutral-500">No gallery assets yet.</p>
                  )}
                </section>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <AdminHelp onNavigateTab={(tab) => setActiveTab(tab as TabType)} />
          )}
          {activeTab === 'security' && <SecurityManager />}
          {(activeTab === 'backup_restore' || activeTab === 'storage') && (
            <BackupRestoreManager onRefresh={onRefreshData} />
          )}
          {activeTab === 'heritage' && <HeritageManager onRefresh={onRefreshData} />}
          {activeTab === 'documentary' && <DocumentaryManager onRefresh={onRefreshData} />}
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
