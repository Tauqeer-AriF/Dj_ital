import React, { useEffect } from 'react';
import { SeoSettingsData, ProfileData, EventData, ReleaseData } from '../db/sqlite';

export interface SEOHeadProps {
  seoSettings?: SeoSettingsData | null;
  profile?: ProfileData | null;
  events?: EventData[];
  releases?: ReleaseData[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  seoSettings,
  profile,
  events = [],
  releases = [],
}) => {
  useEffect(() => {
    // 1. Resolve effective SEO values with sensible defaults
    const artistName = profile?.artist_name || 'DJ Ital';
    const siteTitle =
      seoSettings?.site_title?.trim() ||
      `${artistName} Official | Jungle & D&B Pioneer & Vital Fest`;
    const metaDescription =
      seoSettings?.meta_description?.trim() ||
      profile?.bio_short ||
      'Official archive and booking portal for UK jungle pioneer DJ Ital (Kool FM 94.5, Vital Fest, and V&A East exhibition honouree). Explore live dubplates, audio sets, event dates, and festival bookings.';
    const metaKeywords =
      seoSettings?.meta_keywords?.trim() ||
      'DJ Ital, UK Jungle, Drum and Bass, D&B, Kool FM 94.5, Vital Fest, Dubplate, Sound System Culture, Dubplate Mastery, London DJ booking, 164 BPM, V&A Museum Music';
    const authorName = seoSettings?.author_name?.trim() || artistName;
    const robotsIndex = seoSettings?.robots_index?.trim() || 'index, follow';
    const twitterHandle = seoSettings?.twitter_handle?.trim() || '@djital';
    const ogType = seoSettings?.og_type?.trim() || 'website';

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://djital.co.uk';
    const canonicalUrl = seoSettings?.canonical_url?.trim() || origin;

    let rawOgImage = seoSettings?.og_image_url?.trim() || '/images/dj_ital_hero_1790112374509.jpg';
    if (rawOgImage.startsWith('/')) {
      rawOgImage = `${origin}${rawOgImage}`;
    }
    const ogImageUrl = rawOgImage;

    // 2. Update Document Title
    document.title = siteTitle;

    // 3. Helper to update or inject meta tags
    const setMeta = (attr: 'name' | 'property', key: string, content: string | undefined | null) => {
      if (!content) return;
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Primary Meta Tags
    setMeta('name', 'title', siteTitle);
    setMeta('name', 'description', metaDescription);
    setMeta('name', 'keywords', metaKeywords);
    setMeta('name', 'author', authorName);
    setMeta('name', 'robots', robotsIndex);

    // Search Engine Verifications (if set)
    if (seoSettings?.google_site_verification) {
      setMeta('name', 'google-site-verification', seoSettings.google_site_verification.trim());
    }
    if (seoSettings?.bing_site_verification) {
      setMeta('name', 'msvalidate.01', seoSettings.bing_site_verification.trim());
    }

    // Canonical link
    let canonicalTag = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.rel = 'canonical';
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonicalUrl;

    // Open Graph
    setMeta('property', 'og:title', siteTitle);
    setMeta('property', 'og:description', metaDescription);
    setMeta('property', 'og:image', ogImageUrl);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:site_name', `${artistName} Sound System`);
    setMeta('property', 'og:locale', 'en_GB');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:url', canonicalUrl);
    setMeta('name', 'twitter:title', siteTitle);
    setMeta('name', 'twitter:description', metaDescription);
    setMeta('name', 'twitter:image', ogImageUrl);
    setMeta('name', 'twitter:site', twitterHandle);
    setMeta('name', 'twitter:creator', twitterHandle);

    // 4. Schema.org JSON-LD Structured Data
    const isSchemaEnabled = (seoSettings?.structured_data_enabled ?? 1) === 1;
    let schemaScript = document.getElementById('djital-schema-markup') as HTMLScriptElement | null;

    if (isSchemaEnabled) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.id = 'djital-schema-markup';
        document.head.appendChild(schemaScript);
      }

      // Collect social links for sameAs
      const socialLinks: string[] = [];
      if (profile?.social_instagram) socialLinks.push(profile.social_instagram);
      if (profile?.social_facebook) socialLinks.push(profile.social_facebook);
      if (profile?.social_youtube) socialLinks.push(profile.social_youtube);
      if (profile?.social_soundcloud) socialLinks.push(profile.social_soundcloud);
      if (profile?.social_mixcloud) socialLinks.push(profile.social_mixcloud);
      if (profile?.social_spotify) socialLinks.push(profile.social_spotify);
      if (profile?.social_tiktok) socialLinks.push(profile.social_tiktok);

      const genres = profile?.genres
        ? profile.genres.split(',').map((g) => g.trim()).filter(Boolean)
        : ['Jungle', 'Drum and Bass', 'Sound System', 'Dubplate'];

      // Generate event markup for active upcoming events
      const upcomingEventsMarkup = events
        .filter((e) => e.status?.toLowerCase() === 'upcoming')
        .slice(0, 5)
        .map((e) => ({
          '@type': 'MusicEvent',
          name: e.title,
          startDate: e.event_date ? `${e.event_date}T${e.start_time || '20:00'}:00` : undefined,
          location: {
            '@type': 'Place',
            name: e.venue || 'Venue TBA',
            address: {
              '@type': 'PostalAddress',
              addressLocality: e.location || 'London',
              addressCountry: 'GB',
            },
          },
          offers: e.ticket_url
            ? {
                '@type': 'Offer',
                url: e.ticket_url,
                price: e.price_text?.replace(/[^0-9.]/g, '') || undefined,
                priceCurrency: 'GBP',
                availability: 'https://schema.org/InStock',
              }
            : undefined,
          performer: {
            '@type': 'MusicGroup',
            name: artistName,
          },
        }));

      // Generate music release recording markup
      const releasesMarkup = releases
        .filter((r) => r.is_featured)
        .slice(0, 5)
        .map((r) => ({
          '@type': 'MusicAlbum',
          name: r.title,
          byArtist: {
            '@type': 'MusicGroup',
            name: artistName,
          },
          datePublished: r.release_year ? `${r.release_year}` : undefined,
          recordLabel: r.label || 'Dubplate Special',
          catalogNumber: r.catalog_number || undefined,
          image: r.album_cover_url
            ? (r.album_cover_url.startsWith('http') ? r.album_cover_url : `${origin}${r.album_cover_url}`)
            : undefined,
        }));

      const structuredGraph: any = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${canonicalUrl}#website`,
            url: canonicalUrl,
            name: `${artistName} Official Sound System Archive`,
            description: metaDescription,
            publisher: {
              '@type': 'MusicGroup',
              name: artistName,
            },
          },
          {
            '@type': ['MusicGroup', 'Person'],
            '@id': `${canonicalUrl}#artist`,
            name: artistName,
            alternateName: profile?.stage_name || profile?.brand_slogan || 'DjItal 164bpm',
            url: canonicalUrl,
            description: profile?.bio_full || metaDescription,
            image: ogImageUrl,
            genre: genres,
            sameAs: socialLinks.length > 0 ? socialLinks : undefined,
            homeLocation: {
              '@type': 'Place',
              name: profile?.origin || 'London, United Kingdom',
            },
            track: releasesMarkup.length > 0 ? releasesMarkup : undefined,
            event: upcomingEventsMarkup.length > 0 ? upcomingEventsMarkup : undefined,
          },
        ],
      };

      schemaScript.textContent = JSON.stringify(structuredGraph, null, 2);
    } else if (schemaScript) {
      schemaScript.textContent = '';
    }
  }, [seoSettings, profile, events, releases]);

  return null;
};

