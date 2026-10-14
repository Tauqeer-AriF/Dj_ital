import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import {
  getProfile,
  getEvents,
  getReleases,
  getGallery,
  getDocumentaries,
  getDocumentarySettings,
  getStats,
  getBookings,
  getSiteMedia,
  getTestimonials,
  getVenueLogos,
  getAudioMixes,
  getVideos,
  subscribeDb,
  ProfileData,
  EventData,
  ReleaseData,
  GalleryData,
  DocumentaryData,
  DocumentarySettingsData,
  StatData,
  BookingData,
  TestimonialData,
  VenueLogoData,
  AudioMixData,
  VideoData,
} from './db/sqlite';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MarqueeRibbon } from './components/MarqueeRibbon';
import { VitalFestEvents } from './components/VitalFestEvents';
import { AudioMixesGallery } from './components/AudioMixesGallery';
import { ReleasesSection } from './components/ReleasesSection';
import { HeritageVaSection } from './components/HeritageVaSection';
import { DocumentarySection } from './components/DocumentarySection';
import { VitalFestMerchNewsletter } from './components/VitalFestMerchNewsletter';
import { GallerySection } from './components/GallerySection';
import { BookingFormSection } from './components/BookingFormSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminEntryConfirmModal } from './components/admin/AdminEntryConfirmModal';
import { EPKModal } from './components/EPKModal';
import { DynamicBackground } from './components/DynamicBackground';
import { ActiveTrack } from './types';
import { audioEngine } from './audio/audioEngine';
import { AppLoader } from './components/AppLoader';
import { BackToTop } from './components/BackToTop';
import { applyThemeToDOM, resolveColorHex } from './utils/themeEngine';

const isAdminPath = () => {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || path.startsWith('/admin/') || hash === '#admin' || hash === '#/admin';
};

export default function App() {
  const [isAdminView, setIsAdminView] = useState(() => isAdminPath());
  const [isDashboardConfirmed, setIsDashboardConfirmed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const sessionAuth =
      sessionStorage.getItem('dj_ital_admin_authenticated') === 'true' ||
      sessionStorage.getItem('dj_ital_admin_confirmed') === 'true';
    const localAuth = localStorage.getItem('dj_ital_admin_authenticated') === 'true';
    return sessionAuth || localAuth;
  });
  const [isLoading, setIsLoading] = useState(true);

  // SQLite data state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [releases, setReleases] = useState<ReleaseData[]>([]);
  const [gallery, setGallery] = useState<GalleryData[]>([]);
  const [documentaries, setDocumentaries] = useState<DocumentaryData[]>([]);
  const [documentarySettings, setDocumentarySettings] = useState<DocumentarySettingsData | null>(null);
  const [stats, setStats] = useState<StatData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [venueLogos, setVenueLogos] = useState<VenueLogoData[]>([]);
  const [audioMixes, setAudioMixes] = useState<AudioMixData[]>([]);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [siteMediaMap, setSiteMediaMap] = useState<Record<string, string>>({});
  const [isEpkOpen, setIsEpkOpen] = useState(false);

  // Audio player state - defaulted to single live radio stream in player bar
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(() => ({
    id: 9990,
    title: 'DJ Ital Live Radio Stream Transmission',
    artist: 'DJ Ital',
    year: 2026,
    bpm: 168,
    format: 'Live Radio Stream',
    type: 'live_stream',
    streamUrl: 'https://dejavufm.radioca.st/;',
  }));
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync /admin browser URL route
  useEffect(() => {
    const syncRoute = () => {
      const onAdmin = isAdminPath();
      setIsAdminView(onAdmin);
    };

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);

    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (href === '/admin' || href === '#admin' || href === '#/admin') {
        e.preventDefault();
        setIsAdminView(true);
        if (window.location.pathname !== '/admin') {
          window.history.pushState({ view: 'admin' }, '', '/admin');
        }
      }
    };

    document.addEventListener('click', handleLinkClick);

    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  const handleOpenAdmin = () => {
    setIsAdminView(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({ view: 'admin' }, '', '/admin');
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminView(false);
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin')) {
      window.history.pushState({ view: 'public' }, '', '/');
    } else if (window.location.hash === '#admin' || window.location.hash === '#/admin') {
      window.history.pushState({ view: 'public' }, '', window.location.pathname);
    }
  };

  const handleConfirmDashboard = () => {
    sessionStorage.setItem('dj_ital_admin_confirmed', 'true');
    sessionStorage.setItem('dj_ital_admin_authenticated', 'true');
    setIsDashboardConfirmed(true);
  };

  const handleLockAdmin = () => {
    sessionStorage.removeItem('dj_ital_admin_confirmed');
    sessionStorage.removeItem('dj_ital_admin_authenticated');
    localStorage.removeItem('dj_ital_admin_authenticated');
    localStorage.removeItem('dj_ital_admin_auth_timestamp');
    setIsDashboardConfirmed(false);
  };

  const loadData = useCallback(async () => {
    const startTime = Date.now();
    try {
      const [prof, evts, rels, gals, docs, docSett, st, bks, media, tests, vLogos, mixes, vids] = await Promise.all([
        getProfile(),
        getEvents(),
        getReleases(),
        getGallery(),
        getDocumentaries(),
        getDocumentarySettings(),
        getStats(),
        getBookings(),
        getSiteMedia(),
        getTestimonials(),
        getVenueLogos(),
        getAudioMixes(),
        getVideos(),
      ]);

      setProfile(prof);
      setEvents(evts);
      setReleases(rels);
      setGallery(gals);
      setDocumentaries(docs);
      setDocumentarySettings(docSett);
      setStats(st);
      setBookings(bks);
      setTestimonials(tests);
      setVenueLogos(vLogos);
      setAudioMixes(mixes);
      setVideos(vids);

      const mediaDict: Record<string, string> = {};
      media.forEach((m) => {
        mediaDict[m.key] = m.image_url;
      });
      setSiteMediaMap(mediaDict);

      // Default active track to "Decibel" if not set
      if (!activeTrack && rels.length > 0) {
        const decibel = rels.find((r) => r.title.includes('Decibel')) || rels[0];
        setActiveTrack({
          id: decibel.id,
          title: decibel.title,
          artist: 'DJ Ital',
          year: decibel.release_year,
          bpm: decibel.bpm || 168,
          format: decibel.format || '12" Vinyl',
          type: 'decibel',
        });
      }
    } catch (err) {
      console.error('Error loading SQLite data:', err);
    } finally {
      // Ensure the prominent dubplate loader displays smoothly on boot without flickering
      const elapsed = Date.now() - startTime;
      const minDisplayDuration = 650;
      if (elapsed < minDisplayDuration) {
        setTimeout(() => {
          setIsLoading(false);
        }, minDisplayDuration - elapsed);
      } else {
        setIsLoading(false);
      }
    }
  }, [activeTrack]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeDb(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Dynamically sync theme color scheme, custom colors, hovers, focus rings, and font presets on root element
  useEffect(() => {
    // If profile is not yet loaded from SQLite, do not overwrite cached/active theme
    if (!profile) return;

    const colorScheme = profile.color_scheme || 'amber';
    const fontPreset = profile.font_family_preset || 'syne';
    const bodyFontPreset = profile.body_font_preset || 'jakarta';
    const customHex = profile.custom_accent_color || '#f59e0b';

    const activeHex = resolveColorHex(colorScheme, customHex);
    applyThemeToDOM(activeHex, fontPreset, bodyFontPreset, colorScheme);
  }, [profile?.color_scheme, profile?.font_family_preset, profile?.body_font_preset, profile?.custom_accent_color]);

  // Audio actions
  // Keep single default live radio stream synchronized in persistent player bar
  // Audio stream ref for background radio stream playback (without playerbar)
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying && activeTrack?.type === 'live_stream' && activeTrack.streamUrl) {
      if (audioRef.current.src !== activeTrack.streamUrl) {
        audioRef.current.src = activeTrack.streamUrl;
      }
      audioRef.current.play().catch((err) => {
        console.log('Background stream play notice:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeTrack]);

  useEffect(() => {
    const stream = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
    if (!activeTrack || activeTrack.type === 'live_stream') {
      setActiveTrack({
        id: 9990,
        title: profile?.live_show_title ? `${profile.live_show_title} (Live Feed)` : 'DJ Ital Live Radio Stream Transmission',
        artist: 'DJ Ital',
        year: 2026,
        bpm: 168,
        format: 'Live Radio Stream',
        type: 'live_stream',
        streamUrl: stream,
      });
    }
  }, [profile?.stream_url, profile?.live_show_title]);

  const handlePlayRelease = (release: ReleaseData) => {
    let trackType: 'decibel' | 'vital' | 'hackney' | 'transmission' = 'decibel';
    if (release.title.toLowerCase().includes('vital')) trackType = 'vital';
    else if (release.title.toLowerCase().includes('hackney')) trackType = 'hackney';
    else if (release.title.toLowerCase().includes('transmission')) trackType = 'transmission';

    const track: ActiveTrack = {
      id: release.id,
      title: release.title,
      artist: 'DJ Ital',
      year: release.release_year,
      bpm: release.bpm || 168,
      format: release.format || '12" Vinyl',
      type: trackType,
    };

    setActiveTrack(track);
    setIsPlaying(true);
    audioEngine.play(track.bpm, trackType);
  };

  const handlePlayLiveStream = (overrideUrl?: string) => {
    const streamUrl = (overrideUrl || profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
    audioEngine.stop();
    const track: ActiveTrack = {
      id: 9990,
      title: profile?.live_show_title ? `${profile.live_show_title} (Live Feed)` : 'DJ Ital Live Radio Stream Transmission',
      artist: 'DJ Ital',
      year: 2026,
      bpm: 168,
      format: 'Live Radio Stream',
      type: 'live_stream',
      streamUrl: streamUrl,
    };
    setActiveTrack(track);
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else if (activeTrack) {
      if (
        activeTrack.type === 'decibel' ||
        activeTrack.type === 'vital' ||
        activeTrack.type === 'hackney' ||
        activeTrack.type === 'transmission'
      ) {
        audioEngine.play(activeTrack.bpm, activeTrack.type);
      }
      setIsPlaying(true);
    } else {
      const stream = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
      handlePlayLiveStream(stream);
    }
  };

  const handleNextTrack = () => {
    if (releases.length === 0 || !activeTrack) return;
    const currentIndex = releases.findIndex((r) => r.id === activeTrack.id);
    const nextIndex = (currentIndex + 1) % releases.length;
    handlePlayRelease(releases[nextIndex]);
  };

  const handlePrevTrack = () => {
    if (releases.length === 0 || !activeTrack) return;
    const currentIndex = releases.findIndex((r) => r.id === activeTrack.id);
    const prevIndex = (currentIndex - 1 + releases.length) % releases.length;
    handlePlayRelease(releases[prevIndex]);
  };

  const pendingBookingsCount = bookings.filter((b) => b.status === 'Pending').length;

  return (
    <ThemeProvider>
      <ToastProvider>
        {isLoading ? (
        <AppLoader
          logoUrl={profile?.logo_url || profile?.epk_logo_png}
          colorScheme={profile?.color_scheme}
          accentColor={profile?.custom_accent_color}
        />
      ) : isAdminView && isDashboardConfirmed ? (
        <AdminDashboard
          onClose={handleCloseAdmin}
          onLock={handleLockAdmin}
          profile={profile}
          events={events}
          releases={releases}
          gallery={gallery}
          bookings={bookings}
          documentaries={documentaries}
          onRefreshData={loadData}
        />
      ) : isAdminView && !isDashboardConfirmed ? (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-4">
          <AdminEntryConfirmModal
            isOpen={true}
            onConfirm={handleConfirmDashboard}
            onCancel={handleCloseAdmin}
            stats={{
              eventsCount: events.length,
              releasesCount: releases.length,
              pendingBookingsCount: pendingBookingsCount,
            }}
          />
        </div>
      ) : (
        <div className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 selection:bg-amber-400 selection:text-neutral-950 transition-colors duration-200">
          {/* Dynamic Background with slideshow / moving subtle patterns */}
          <DynamicBackground
            style={profile?.bg_style}
            speed={profile?.bg_speed}
            slideshowEnabled={Boolean(profile?.slideshow_enabled)}
            slideshowInterval={profile?.slideshow_interval}
            slideshowImages={
              profile?.slideshow_images
                ? profile.slideshow_images.split(',').map((s) => s.trim()).filter(Boolean)
                : undefined
            }
          />

          {/* Top Bar Navigation */}
          <Navbar
            profile={profile}
            onOpenEpk={() => setIsEpkOpen(true)}
            onOpenDashboard={handleOpenAdmin}
          />

          {/* Hero Section with Live Turntable Dub Console */}
          <Hero
            profile={profile}
            stats={stats}
            nextEvent={events.find((e) => e.status === 'Upcoming') || events[0] || null}
            heroImage={siteMediaMap['hero_image']}
            onPlayTrack={() => {
              const stream = (profile?.stream_url || 'https://dejavufm.radioca.st/;').trim();
              if (!activeTrack || activeTrack.type !== 'live_stream') {
                handlePlayLiveStream(stream);
              } else {
                handleTogglePlay();
              }
            }}
            isPlaying={isPlaying}
            activeTrack={activeTrack}
            onOpenEpk={() => setIsEpkOpen(true)}
          />

          {/* Editorial Marquee Ribbon */}
          <MarqueeRibbon />

          {/* Vital Fest Events & Shows (with Flyers, Testimonials & Venue Logos) */}
          <VitalFestEvents
            events={events}
            testimonials={testimonials}
            venueLogos={venueLogos}
          />

          {/* Audio & Media Gallery: Embedded SoundCloud/Mixcloud players, videos, action photos */}
          <AudioMixesGallery mixes={audioMixes} videos={videos} />

          {/* Releases & Audio Synthesiser */}
          <ReleasesSection
            releases={releases}
            activeTrack={activeTrack}
            isPlaying={isPlaying}
            onPlayTrack={handlePlayRelease}
            onTogglePlay={handleTogglePlay}
            logoUrl={profile?.logo_url || profile?.epk_logo_png}
          />

          {/* V&A Museum Recognition & Kool FM 94.5 Heritage */}
          <HeritageVaSection profile={profile} vaImage={siteMediaMap['va_museum_image']} />

          {/* Documentary Series: "DJ Ital: The Journey" */}
          <DocumentarySection
            episodes={documentaries}
            settings={documentarySettings}
            thumbnails={{
              1: siteMediaMap['doc_ep1_thumbnail'],
              2: siteMediaMap['doc_ep2_thumbnail'],
              3: siteMediaMap['doc_ep3_thumbnail'],
              4: siteMediaMap['doc_ep4_thumbnail'],
            }}
          />

          {/* Vital Fest Official Shopify Merch & Newsletter Sign-up */}
          <VitalFestMerchNewsletter profile={profile} />

          {/* Reverse Marquee Ribbon */}
          <MarqueeRibbon
            reverse
            textItems={[
              'EAST LONDON SUB-BASS',
              'KOOL FM ARCHIVES',
              'VITAL FEST 2026',
              'V&A PERMANENT DISPLAY',
              'ORIGINAL JUNGLE SELECTOR',
              '168 BPM BREAKBEATS',
            ]}
          />

          {/* Rave & Sound System Visual Gallery */}
          <GallerySection gallery={gallery} />

          {/* Direct Booking Enquiries Form (SQLite-backed) */}
          <BookingFormSection profile={profile} onBookingSubmitted={loadData} />

          {/* Site Footer with subtle /admin portal link */}
          <Footer
            profile={profile}
            onOpenDashboard={handleOpenAdmin}
            onOpenEpk={() => setIsEpkOpen(true)}
          />

          {/* Background Audio Stream (Playerbar removed) */}
          <audio ref={audioRef} preload="none" className="hidden" aria-hidden="true" />

          {/* Floating Back To Top Button with Circular Progress Track */}
          <BackToTop />

          {/* EPK Modal / Full Page Drawer */}
          <EPKModal
            isOpen={isEpkOpen}
            onClose={() => setIsEpkOpen(false)}
            profile={profile}
          />
        </div>
      )}
      </ToastProvider>
    </ThemeProvider>
  );
}
