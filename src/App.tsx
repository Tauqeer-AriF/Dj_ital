import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAudioMixes,
  getBookings,
  getDocumentaries,
  getDocumentarySettings,
  getEvents,
  getGallery,
  getHeritageFullData,
  getProfile,
  getReleases,
  getSeoSettings,
  getSiteMedia,
  getStats,
  getTestimonials,
  getVenueLogos,
  getVideos,
  initDatabase,
  type AudioMixData,
  type BookingData,
  type DocumentaryData,
  type DocumentarySettingsData,
  type EventData,
  type GalleryData,
  type HeritageFullData,
  type ProfileData,
  type ReleaseData,
  type SeoSettingsData,
  type SiteMediaSlot,
  type StatData,
  type TestimonialData,
  type VenueLogoData,
  type VideoData,
} from './db/sqlite';
import type { ActiveTrack } from './types';
import { BackToTop } from './components/BackToTop';
import { BookingFormSection } from './components/BookingFormSection';
import { DocumentarySection } from './components/DocumentarySection';
import { DynamicBackground } from './components/DynamicBackground';
import { EPKModal } from './components/EPKModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Footer } from './components/Footer';
import { GallerySection } from './components/GallerySection';
import { Hero } from './components/Hero';
import { HeritageVaSection } from './components/HeritageVaSection';
import { MainAudioPlayer } from './components/MainAudioPlayer';
import { Navbar } from './components/Navbar';
import { ReleasesSection } from './components/ReleasesSection';
import { AudioMixesGallery } from './components/AudioMixesGallery';
import { VitalFestEvents } from './components/VitalFestEvents';
import { VitalFestMerchNewsletter } from './components/VitalFestMerchNewsletter';
import { AppLoader } from './components/AppLoader';
import { SEOHead } from './components/SEOHead';
import { AdminEntryConfirmModal } from './components/admin/AdminEntryConfirmModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SavingProvider } from './context/SavingContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { SaveStatusBanner } from './components/SaveStatusBanner';
import { applyThemeToDOM, resolveColorHex } from './utils/themeEngine';

interface AppData {
  profile: ProfileData;
  stats: StatData[];
  events: EventData[];
  releases: ReleaseData[];
  gallery: GalleryData[];
  documentaries: DocumentaryData[];
  documentarySettings: DocumentarySettingsData;
  siteMedia: SiteMediaSlot[];
  audioMixes: AudioMixData[];
  videos: VideoData[];
  testimonials: TestimonialData[];
  venueLogos: VenueLogoData[];
  bookings: BookingData[];
  heritage: HeritageFullData;
  seoSettings?: SeoSettingsData;
}

function hasAdminSession() {
  return (
    sessionStorage.getItem('dj_ital_admin_authenticated') === 'true' &&
    sessionStorage.getItem('dj_ital_admin_confirmed') === 'true'
  );
}

function AppContent() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedData = useRef(false);
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isEpkOpen, setIsEpkOpen] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(
    () => window.location.pathname.replace(/\/+$/, '') === '/admin'
  );
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(
    () => window.location.pathname.replace(/\/+$/, '') === '/admin' && !hasAdminSession()
  );
  const [isAdminOpen, setIsAdminOpen] = useState(
    () => window.location.pathname.replace(/\/+$/, '') === '/admin' && hasAdminSession()
  );

  const refreshData = useCallback(async () => {
    if (!hasLoadedData.current) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      await initDatabase();
      const [
        profile,
        stats,
        events,
        releases,
        gallery,
        documentaries,
        documentarySettings,
        siteMedia,
        audioMixes,
        videos,
        testimonials,
        venueLogos,
        bookings,
        heritage,
        seoSettings,
      ] = await Promise.all([
        getProfile(),
        getStats(),
        getEvents(),
        getReleases(),
        getGallery(),
        getDocumentaries(),
        getDocumentarySettings(),
        getSiteMedia(),
        getAudioMixes(),
        getVideos(),
        getTestimonials(),
        getVenueLogos(),
        getBookings(),
        getHeritageFullData(),
        getSeoSettings().catch(() => null),
      ]);

      setData({
        profile,
        stats,
        events,
        releases,
        gallery,
        documentaries,
        documentarySettings,
        siteMedia,
        audioMixes,
        videos,
        testimonials,
        venueLogos,
        bookings,
        heritage,
        seoSettings: seoSettings || undefined,
      });
      hasLoadedData.current = true;
    } catch (error) {
      console.error('Failed to load DJ Ital site data:', error);
      if (!hasLoadedData.current) {
        setLoadError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/admin') return;

    let sessionId: string;
    try {
      const storedSessionId = window.sessionStorage.getItem('djital_analytics_session_id');
      sessionId = storedSessionId || window.crypto.randomUUID();
      if (!storedSessionId) {
        window.sessionStorage.setItem('djital_analytics_session_id', sessionId);
      }
    } catch (error) {
      console.warn('Site visit was not recorded because browser session storage is unavailable:', error);
      return;
    }

    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      keepalive: true,
    }).then((response) => {
      if (!response.ok) throw new Error(`Visit tracking failed (HTTP ${response.status}).`);
    }).catch((error: unknown) => {
      console.warn('Could not record site visit:', error);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    const { profile } = data;
    applyThemeToDOM(
      resolveColorHex(profile.color_scheme, profile.custom_accent_color),
      profile.font_family_preset || 'syne',
      profile.body_font_preset || 'jakarta',
      profile.color_scheme || 'amber'
    );
  }, [data?.profile.color_scheme, data?.profile.custom_accent_color, data?.profile.font_family_preset, data?.profile.body_font_preset]);

  useEffect(() => {
    const syncAdminRoute = () => {
      const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';
      const isAuthenticated = hasAdminSession();
      setIsAdminRoute(isAdmin);
      setIsAdminOpen(isAdmin && isAuthenticated);
      setIsAdminLoginOpen(isAdmin && !isAuthenticated);
    };

    window.addEventListener('popstate', syncAdminRoute);
    return () => window.removeEventListener('popstate', syncAdminRoute);
  }, []);

  const closeAdminRoute = useCallback(() => {
    sessionStorage.removeItem('dj_ital_admin_authenticated');
    sessionStorage.removeItem('dj_ital_admin_confirmed');
    if (window.location.pathname.replace(/\/+$/, '') === '/admin') {
      window.history.pushState({}, '', '/');
    }
    setIsAdminRoute(false);
    setIsAdminOpen(false);
    setIsAdminLoginOpen(false);
  }, []);

  const startLiveStream = useCallback(() => {
    if (isPlaying && activeTrack?.type === 'live_stream') {
      setIsPlaying(false);
      return;
    }

    const streamUrl = data?.profile.main_player_stream_url || data?.profile.stream_url;
    setActiveTrack({
      id: -1,
      title: 'Deja Vu FM Live',
      artist: 'DJ Ital',
      year: new Date().getFullYear(),
      bpm: data?.profile.signature_bpm || 164,
      format: 'Live Radio',
      type: 'live_stream',
      streamUrl: streamUrl || undefined,
    });
    setIsPlaying(true);
  }, [activeTrack, data, isPlaying]);

  const playRelease = useCallback((release: ReleaseData) => {
    setActiveTrack({
      id: release.id,
      title: release.title,
      artist: data?.profile.artist_name || 'DJ Ital',
      year: release.release_year,
      bpm: release.bpm,
      format: release.format,
      type: 'decibel',
      streamUrl: release.stream_url || undefined,
    });
    setIsPlaying(true);
  }, [data]);

  if (loading && !data) {
    return <AppLoader message="Loading DJ Ital sound system..." />;
  }

  if (loadError || !data) {
    return (
      <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div role="alert" className="max-w-lg space-y-4 rounded-xl border border-red-400/30 bg-neutral-900 p-6">
          <h1 className="text-xl font-bold">The site could not load</h1>
          <p className="text-sm text-neutral-300">
            {loadError || 'The site data is unavailable.'}
          </p>
          <button
            type="button"
            onClick={() => void refreshData()}
            className="rounded bg-amber-400 px-4 py-2 font-bold text-neutral-950 hover:bg-amber-300"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (isAdminRoute) {
    if (isAdminOpen) {
      return (
        <AdminDashboard
          onClose={closeAdminRoute}
          onLock={closeAdminRoute}
          profile={data.profile}
          events={data.events}
          releases={data.releases}
          gallery={data.gallery}
          bookings={data.bookings}
          documentaries={data.documentaries}
          onRefreshData={refreshData}
        />
      );
    }

    return (
      <main className="min-h-screen bg-neutral-950">
        <AdminEntryConfirmModal
          isOpen={isAdminLoginOpen}
          onConfirm={() => {
            setIsAdminLoginOpen(false);
            setIsAdminOpen(true);
          }}
          onCancel={closeAdminRoute}
          stats={{
            eventsCount: data.events.length,
            releasesCount: data.releases.length,
            pendingBookingsCount: data.bookings.filter((booking) => booking.status === 'Pending').length,
          }}
        />
      </main>
    );
  }

  const heroImage = data.siteMedia.find((item) => item.key === 'hero_image')?.image_url;
  const nextEvent = data.events.find((event) => event.status === 'Upcoming') || null;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-white">
      <SEOHead
        seoSettings={data.seoSettings}
        profile={data.profile}
        events={data.events}
        releases={data.releases}
      />
      <DynamicBackground
        style={data.profile.bg_style}
        speed={data.profile.bg_speed}
        accentColor={resolveColorHex(data.profile.color_scheme, data.profile.custom_accent_color)}
        slideshowEnabled={Number(data.profile.slideshow_enabled) === 1}
        slideshowInterval={data.profile.slideshow_interval}
        slideshowImages={data.profile.slideshow_images}
      />
      <div className="public-site-content relative z-10">
        <Navbar profile={data.profile} onOpenEpk={() => setIsEpkOpen(true)} />
        <main>
          <Hero
            profile={data.profile}
            stats={data.stats}
            nextEvent={nextEvent}
            onPlayTrack={startLiveStream}
            isPlaying={isPlaying}
            activeTrack={activeTrack}
            heroImage={heroImage}
            onOpenEpk={() => setIsEpkOpen(true)}
          />
          <VitalFestEvents
            events={data.events}
            testimonials={data.testimonials}
            venueLogos={data.venueLogos}
          />
          <AudioMixesGallery
            mixes={data.audioMixes}
            videos={data.videos}
            isLooping={isLooping}
            onToggleLoop={() => setIsLooping((looping) => !looping)}
          />
          <ReleasesSection
            releases={data.releases}
            activeTrack={activeTrack}
            isPlaying={isPlaying}
            onPlayTrack={playRelease}
            onTogglePlay={() => setIsPlaying((playing) => !playing)}
            logoUrl={data.profile.logo_url}
            signatureBpm={data.profile.signature_bpm}
          />
          <HeritageVaSection
            settings={data.heritage.settings}
            credentials={data.heritage.credentials}
            chapters={data.heritage.chapters}
            milestones={data.heritage.milestones}
          />
          <DocumentarySection
            settings={data.documentarySettings}
            episodes={data.documentaries}
          />
          <GallerySection gallery={data.gallery} />
          <VitalFestMerchNewsletter profile={data.profile} />
          <BookingFormSection
            profile={data.profile}
            onBookingSubmitted={refreshData}
            onOpenEpk={() => setIsEpkOpen(true)}
          />
        </main>
        <Footer
          profile={data.profile}
          onOpenEpk={() => setIsEpkOpen(true)}
        />
        <div className="public-site-shimmer" aria-hidden="true" />
      </div>
      <MainAudioPlayer
        profile={data.profile}
        activeTrack={activeTrack}
        isPlaying={isPlaying}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping((looping) => !looping)}
        onTogglePlay={() => setIsPlaying((playing) => !playing)}
        onPlayLiveStream={startLiveStream}
      />
      <BackToTop />
      <EPKModal
        isOpen={isEpkOpen}
        onClose={() => setIsEpkOpen(false)}
        profile={data.profile}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <SavingProvider>
            <>
              <AppContent />
              <SaveStatusBanner />
            </>
          </SavingProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
