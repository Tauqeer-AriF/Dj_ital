import React from 'react';
import { ArrowUp, Award, ExternalLink, Radio, ShoppingBag, FileText, Globe } from 'lucide-react';
import { ProfileData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';

interface FooterProps {
  profile: ProfileData | null;
  onOpenEpk?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ profile, onOpenEpk }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const socials = [
    { label: 'Instagram', url: profile?.social_instagram || 'https://instagram.com/djital' },
    { label: 'Facebook', url: profile?.social_facebook || 'https://facebook.com/djital' },
    { label: 'YouTube', url: profile?.social_youtube || 'https://youtube.com/@djital' },
    { label: 'TikTok', url: profile?.social_tiktok || 'https://tiktok.com/@djital' },
    { label: 'SoundCloud', url: profile?.social_soundcloud || 'https://soundcloud.com/djital' },
    { label: 'Mixcloud', url: profile?.social_mixcloud || 'https://mixcloud.com/djital' },
    { label: 'Spotify', url: profile?.social_spotify || 'https://open.spotify.com' },
  ].filter((s) => s.url && s.url.trim() !== '');

  const liveStreamUrl = profile?.stream_url || 'https://dejavufm.radioca.st/;';
  const shopifyUrl = profile?.shopify_merch_url || 'https://vitalfest.myshopify.com';
  const logoSrc = profile?.logo_url || profile?.epk_logo_png || '/images/vital_fest_logo.png';

  return (
    <footer className="border-t border-neutral-300 dark:border-white/10 sound-cabinet pb-16 pt-16 text-neutral-900 dark:text-white transition-colors duration-200 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <ScrollReveal variant="fade-up">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-neutral-200 dark:border-white/15">
            
            {/* Brand & Manifesto */}
            <div className="md:col-span-5 space-y-4">
              <a href="#" className="flex items-center gap-3 group">
                <img
                  src={logoSrc}
                  alt="Vital Fest"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                  }}
                  className="h-11 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)] transition-transform group-hover:scale-105"
                />
                <div>
                  <div className="text-xl font-display font-black text-neutral-950 dark:text-white tracking-tight flex items-center gap-1.5 uppercase">
                    <span>DJ</span>
                    <span className="text-amber-500 dark:text-amber-400">ITAL</span>
                    <span className="w-1.5 h-1.5 rounded-none bg-amber-400 ml-0.5 inline-block animate-pulse" />
                  </div>
                  <div className="text-[10px] font-industrial text-neutral-600 dark:text-white/80 font-bold uppercase tracking-wider">
                    VITAL FEST FOUNDER · LONDON
                  </div>
                </div>
              </a>

              <p className="text-xs sm:text-sm text-neutral-700 dark:text-white/90 leading-relaxed max-w-sm">
                Dedicated to the preservation and progression of UK jungle drum and bass culture,
                from the 1991 pirate radio dawn to 2026 Victoria and Albert Museum recognition.
              </p>
              
              <div className="flex items-center gap-2 text-xs font-industrial font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300 pt-1">
                <Award className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                <span>Acknowledged by Victoria & Albert Museum (V&A East)</span>
              </div>

              {/* Social Channels Strip */}
              <div className="pt-2">
                <div className="text-[11px] font-industrial uppercase tracking-wider text-amber-600 dark:text-amber-400 font-black mb-2">
                  Official Channels & Audio
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-industrial">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hardware-btn px-2.5 py-1 rounded sound-card text-neutral-900 hover:text-neutral-950 dark:text-white font-bold uppercase tracking-wider transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Navigation Links */}
            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-industrial font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Site Navigation
              </div>
              <ul className="space-y-2 text-xs font-industrial font-bold uppercase tracking-wider">
                <li>
                  <a href="#events" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Vital Fest Live Events</a>
                </li>
                <li>
                  <a href="#audio-media" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Live Sets & Media Gallery</a>
                </li>
                <li>
                  <a href="#releases" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Releases</a>
                </li>
                <li>
                  <a href="#heritage" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">V&A Museum Exhibition</a>
                </li>
                <li>
                  <a href="#documentary" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">"The Journey" Documentary</a>
                </li>
                <li>
                  <a href="#gallery" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Rave Gallery</a>
                </li>
                <li>
                  <a href="#booking" className="text-neutral-700 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Direct Bookings & Enquiries</a>
                </li>
                {onOpenEpk && (
                  <li>
                    <button
                      type="button"
                      onClick={onOpenEpk}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors text-left font-black uppercase cursor-pointer flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Electronic Press Kit (EPK)</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Official Representation & Broadcasting */}
            <div className="md:col-span-4 space-y-3">
              <div className="text-xs font-industrial font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Agency & Enquiries
              </div>
              <div className="text-xs space-y-2.5 font-industrial uppercase tracking-wider">
                <div>
                  <span className="text-neutral-600 dark:text-white/70">Exclusive Agency: </span>
                  <span className="text-neutral-950 dark:text-white font-bold">{profile?.booking_agency || 'IP1 Agency London'}</span>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-white/70">Official Email: </span>
                  <a
                    href={`mailto:${profile?.direct_email || profile?.booking_email || 'djital.booking@gmail.com'}`}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                  >
                    {profile?.direct_email || profile?.booking_email || 'djital.booking@gmail.com'}
                  </a>
                </div>
                {profile?.whatsapp_number && (
                  <div>
                    <span className="text-neutral-600 dark:text-white/70">WhatsApp: </span>
                    <a
                      href={`https://wa.me/${profile.whatsapp_number.replace(/[^0-9+]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                    >
                      {profile.whatsapp_number}
                    </a>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-neutral-600 dark:text-white/70">Radio Residency: </span>
                  <a
                    href={liveStreamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-900 dark:text-white font-bold hover:text-amber-600 dark:hover:text-amber-400 inline-flex items-center gap-1"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span>{profile?.radio_show || 'The Ital Show - Live Radio'}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 dark:text-white/60" />
                  </a>
                </div>
                <div>
                  <span className="text-neutral-600 dark:text-white/70">Shopify Store: </span>
                  <a
                    href={shopifyUrl}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{profile?.merch_badge_text || 'Vital Fest Official Merch & Vinyl'}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500 dark:text-white/60" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </ScrollReveal>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-industrial uppercase tracking-wider text-neutral-600 dark:text-white/80">
          <div>
            © {new Date().getFullYear()} DJ Ital. All rights reserved. Content based on djital.me.
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="hardware-btn px-2.5 py-1 rounded flex items-center gap-1.5 text-neutral-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer font-black uppercase tracking-wider"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
