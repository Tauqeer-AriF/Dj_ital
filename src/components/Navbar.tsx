import React, { useState } from 'react';
import { Sun, Moon, ArrowUpRight, FileText } from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { ProfileData } from '../db/sqlite';

interface NavbarProps {
  onOpenDashboard?: () => void;
  isAdmin?: boolean;
  onOpenEpk?: () => void;
  profile?: ProfileData | null;
}

const menuItems = [
  { href: '#events', label: 'Vital Fest', tag: 'CH 01' },
  { href: '#audio-media', label: 'Audio & Media', tag: 'CH 02' },
  { href: '#releases', label: 'Dubs & Audio', tag: 'CH 03' },
  { href: '#heritage', label: 'V&A Archive', tag: 'CH 04' },
  { href: '#documentary', label: 'Documentary', tag: 'CH 05' },
  { href: '#gallery', label: 'Gallery', tag: 'CH 06' },
];

const drawerVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -14,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 26,
      stiffness: 300,
      mass: 0.8,
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 22,
      stiffness: 340,
    },
  },
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenEpk, profile }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const streamUrl = profile?.stream_url || 'https://dejavufm.radioca.st/;';
  const isLive = Boolean(profile?.is_live_on_air);
  const shopifyUrl = profile?.shopify_merch_url || 'https://linktr.ee/vital.fest';
  const logoSrc = profile?.logo_url || profile?.epk_logo_png || '/images/vital_fest_logo.png';
  const navbarSubtitle =
    profile?.navbar_subtitle?.trim() ||
    profile?.subtitle?.trim() ||
    profile?.tagline ||
    'British Jungle & Drum and Bass Pioneer | Kool FM 94.5 | Founder of Vital Fest';

  return (
    <header
      style={{ position: 'fixed' }}
      className="!fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-200 sound-cabinet rounded-none border-b border-neutral-300 dark:border-white/10 text-neutral-900 dark:text-white shadow-xl backdrop-blur-2xl"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 relative z-10 w-full min-w-0">
        
        {/* Zone 1: Sound System Brand & Heritage Mark */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <a
            href="#"
            className="group flex items-center gap-2 sm:gap-2.5 select-none min-w-0 flex-1 overflow-hidden py-1"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <img
                src={logoSrc}
                alt="DJ Ital"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/vital_fest_logo.png';
                }}
                className="h-8 sm:h-9 md:h-10 w-auto max-w-[48px] sm:max-w-[58px] md:max-w-[64px] object-contain shrink-0 filter drop-shadow-[0_1px_6px_rgba(245,158,11,0.35)] transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1 text-lg sm:text-xl md:text-2xl font-display font-black tracking-wider text-neutral-950 dark:text-white uppercase leading-none truncate">
                <span>DJ</span>
                <span className="text-amber-500 dark:text-amber-400">ITAL</span>
              </div>
              <span
                title={navbarSubtitle}
                className="text-[9px] sm:text-[10px] font-industrial tracking-wide text-neutral-500 dark:text-neutral-400 font-bold uppercase mt-0.5 truncate block w-full min-w-0"
              >
                {navbarSubtitle}
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Industrial Chapter Navigation Links */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6 2xl:gap-7 text-xs font-industrial font-black uppercase tracking-wider text-neutral-800 dark:text-white">
          <a href="#events" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>Events</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
          </a>
          <a href="#audio-media" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>Audio</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
          </a>
          <a href="#releases" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>Releases</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
          </a>
          <a href="#heritage" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>V&A Heritage</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
          </a>
          <a href="#documentary" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>Docu</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
          </a>
          <a href="#gallery" className="group relative py-1 text-neutral-700 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors whitespace-nowrap">
            <span>Gallery</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-400 transition-all duration-200 group-hover:w-full" />
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

        {/* Zone 3: Hardware Controls (Distinct Rectangular Rocker Toggle & Actions) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onOpenEpk && (
            <button
              onClick={onOpenEpk}
              className="hardware-btn hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-400 hover:text-neutral-950 dark:hover:text-neutral-950 text-xs font-industrial font-bold transition-all shrink-0"
              title="View Electronic Press Kit"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>DOSSIER</span>
            </button>
          )}

          {/* Industrial Hardware Rocker Switch for Theme (Replacing Circular Pill Toggle) */}
          <div
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleTheme();
              }
            }}
            aria-label={`Toggle theme (currently ${theme})`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="hardware-btn flex items-center p-0.5 rounded bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-white/20 cursor-pointer shadow-inner shrink-0"
          >
            <span
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] font-industrial font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-neutral-800 text-amber-400 shadow-sm border border-white/10'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span className="hidden sm:inline">DARK</span>
            </span>
            <span
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded text-[10px] font-industrial font-bold transition-all ${
                theme === 'light'
                  ? 'bg-white text-neutral-950 shadow-sm border border-neutral-300'
                  : 'text-neutral-500 hover:text-neutral-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">LIGHT</span>
            </span>
          </div>

          {/* Machined Booking Button */}
          <a
            href="#booking"
            className="hardware-btn hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded bg-amber-400 text-neutral-950 hover:bg-amber-300 font-industrial text-xs font-black transition-all shadow-md active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>BOOK SELECTOR</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile / Tablet Menu Toggle with Smooth Morphing Bars */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`hardware-btn lg:hidden relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded border flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300 cursor-pointer ${
              mobileMenuOpen
                ? 'border-amber-500 bg-amber-500/15 text-amber-500 dark:text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'border-neutral-300 dark:border-white/20 text-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-white/10'
            }`}
            aria-label={mobileMenuOpen ? 'Close mobile navigation' : 'Open mobile navigation'}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className={`block h-0.5 w-4 sm:w-5 bg-current rounded-full transition-all duration-300 ease-out origin-center ${
                mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-4 sm:w-5 bg-current rounded-full transition-all duration-200 ease-out ${
                mobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100'
              }`}
            />
            <span
              className={`block h-0.5 w-4 sm:w-5 bg-current rounded-full transition-all duration-300 ease-out origin-center ${
                mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Animated Mobile Drawer & Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Dimmer with Blur (Tap outside to close) */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-16 bg-neutral-950/60 backdrop-blur-sm z-40 lg:hidden"
              aria-hidden="true"
            />

            {/* Mobile Drawer Content */}
            <motion.div
              key="mobile-drawer"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              style={{ transformOrigin: 'top center' }}
              className="relative z-50 lg:hidden border-t border-neutral-300 dark:border-white/10 sound-cabinet text-neutral-900 dark:text-white px-5 sm:px-6 pt-5 pb-6 space-y-4 shadow-2xl max-h-[calc(100vh-4rem)] overflow-y-auto"
            >
              {/* Sound System Channel Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-industrial font-bold uppercase tracking-wider">
                {menuItems.map((item) => (
                  <motion.a
                    key={item.href}
                    variants={itemVariants}
                    whileTap={{ scale: 0.97 }}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="group relative p-3 rounded border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-all duration-200 flex flex-col justify-between gap-1 shadow-sm active:scale-95"
                  >
                    <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 group-hover:text-neutral-900 transition-colors font-black">
                      {item.tag}
                    </span>
                    <span className="font-industrial font-bold text-sm leading-tight">
                      {item.label}
                    </span>
                  </motion.a>
                ))}

                <motion.a
                  variants={itemVariants}
                  whileTap={{ scale: 0.97 }}
                  href={shopifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="group p-3 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition-all duration-200 font-bold flex flex-col justify-between gap-1 shadow-sm active:scale-95"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 group-hover:text-neutral-900">
                      EXT 01
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <span className="font-industrial font-bold text-sm leading-tight">
                    Shopify Merch
                  </span>
                </motion.a>

                {onOpenEpk && (
                  <motion.button
                    variants={itemVariants}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEpk();
                    }}
                    className="group p-3 rounded border border-neutral-300 dark:border-white/15 bg-neutral-100 dark:bg-white/5 text-neutral-900 dark:text-white hover:bg-amber-400 hover:text-neutral-950 dark:hover:bg-amber-400 dark:hover:text-neutral-950 transition-all duration-200 font-bold text-left cursor-pointer flex flex-col justify-between gap-1 shadow-sm active:scale-95"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-black text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900">
                        DOC 02
                      </span>
                      <FileText className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900" />
                    </div>
                    <span className="font-industrial font-bold text-sm leading-tight">
                      EPK Dossier
                    </span>
                  </motion.button>
                )}
              </div>

              {/* Action Buttons */}
              <motion.div
                variants={itemVariants}
                className="pt-2 border-t border-neutral-200 dark:border-white/10 flex flex-col gap-2"
              >
                <motion.a
                  whileTap={{ scale: 0.98 }}
                  href="#booking"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 rounded bg-amber-400 text-neutral-950 font-industrial font-black text-center text-sm uppercase tracking-wider shadow-lg hover:bg-amber-300 active:bg-amber-500 transition-all flex items-center justify-center gap-2"
                >
                  <span>Book DJ Ital (Selector)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </motion.a>

                {isLive && (
                  <motion.a
                    whileTap={{ scale: 0.98 }}
                    href={streamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded bg-red-600 hover:bg-red-500 text-white font-industrial text-center text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                    </span>
                    <span>Listen Live Radio Stream</span>
                  </motion.a>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};
