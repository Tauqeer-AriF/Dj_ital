import React, { useState } from 'react';
import { Sun, Moon, Menu, X, ArrowUpRight, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ProfileData } from '../db/sqlite';

interface NavbarProps {
  onOpenDashboard?: () => void;
  isAdmin?: boolean;
  onOpenEpk?: () => void;
  profile?: ProfileData | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEpk, profile }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const streamUrl = profile?.stream_url || 'https://dejavufm.radioca.st/;';
  const isLive = Boolean(profile?.is_live_on_air);
  const shopifyUrl = profile?.shopify_merch_url || 'https://linktr.ee/vital.fest';
  const logoSrc = profile?.logo_url || profile?.epk_logo_png || '/images/vital_fest_logo.png';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200 glass-panel border-b border-neutral-200/80 dark:border-white/10 text-neutral-900 dark:text-white shadow-lg dark:shadow-[0_12px_40px_rgba(0,0,0,0.65)] before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-amber-400/30 before:to-transparent pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-4 relative z-10 pointer-events-auto">
        
        {/* Zone 1: Brand & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#"
            className="group flex items-center gap-3 select-none transition-transform hover:scale-102"
          >
            <img
              src={logoSrc}
              alt="Vital Fest Logo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
              }}
              className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1 text-lg sm:text-xl font-display font-black tracking-tight text-neutral-950 dark:text-white uppercase leading-none">
                <span>DJ</span>
                <span className="text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">ITAL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5 inline-block animate-pulse shadow-[0_0_8px_#f59e0b]" />
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-widest text-neutral-600 dark:text-neutral-300 font-bold uppercase mt-0.5">
                VITAL FEST FOUNDER
              </span>
            </div>
          </a>

          {/* Live on Air Indicator */}
          {isLive && (
            <a
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/15 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-mono font-bold hover:bg-red-600/25 transition-colors shimmer-badge"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>LIVE ON AIR</span>
            </a>
          )}
        </div>

        {/* Zone 2: Streamlined, Spacious Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 2xl:gap-7 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white">
          <a href="#events" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Events</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#audio-media" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Audio</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#releases" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Releases</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#heritage" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Archive</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#documentary" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Docu</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a href="#gallery" className="group relative py-1 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span className="text-neutral-700 dark:text-neutral-200 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">Gallery</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href={shopifyUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative py-1 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors whitespace-nowrap flex items-center gap-1 font-bold"
          >
            <span>Merch</span>
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </nav>

        {/* Zone 3: Sleek, Well-Proportioned Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenEpk && (
            <button
              onClick={onOpenEpk}
              className="group hover-shimmer hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white dark:hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm hover:scale-102"
              title="View Electronic Press Kit"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
              <span className="group-hover:text-white transition-colors">EPK</span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="p-2 rounded-lg border border-neutral-300 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          <a
            href="#booking"
            className="group hover-shimmer hidden md:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-amber-400 text-neutral-950 hover:bg-amber-300 font-mono text-xs font-bold transition-all shadow-md shadow-amber-400/20 cursor-pointer whitespace-nowrap hover:scale-102 active:scale-95"
          >
            <span>Book Now</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>

          {/* Mobile / Tablet Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg border border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-neutral-200/80 dark:border-white/10 glass-panel text-neutral-900 dark:text-white px-6 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono font-bold uppercase">
            <a
              href="#events"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              Vital Fest
            </a>
            <a
              href="#audio-media"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              Audio & Media
            </a>
            <a
              href="#releases"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              Dubs & Audio
            </a>
            <a
              href="#heritage"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              V&A Archive
            </a>
            <a
              href="#documentary"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              Documentary
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors"
            >
              Gallery
            </a>
            <a
              href={shopifyUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="p-3 rounded-xl bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition-colors font-bold flex items-center justify-between"
            >
              <span>Shopify Merch</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            {onOpenEpk && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenEpk();
                }}
                className="p-3 rounded-xl bg-neutral-100 dark:bg-white/10 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-colors font-bold text-left cursor-pointer"
              >
                EPK Press Kit
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2">
            <a
              href="#booking"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 rounded-xl bg-amber-400 text-neutral-950 font-display font-extrabold text-center text-xs uppercase tracking-wider shadow-md"
            >
              Book DJ Ital
            </a>
            {isLive && (
              <a
                href={streamUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-red-600 text-white font-mono text-center text-xs font-bold flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>Listen Live Radio Stream</span>
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
