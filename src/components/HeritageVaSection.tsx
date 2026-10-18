import React, { useState, useEffect } from 'react';
import {
  Radio,
  Landmark,
  ShieldCheck,
  Sparkles,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle2,
  Calendar,
  Disc3,
} from 'lucide-react';
import {
  ProfileData,
  HeritageFullData,
  getHeritageFullData,
  subscribeDb,
  DEFAULT_HERITAGE_SETTINGS,
  DEFAULT_HERITAGE_CREDENTIALS,
  DEFAULT_HERITAGE_CHAPTERS,
  DEFAULT_HERITAGE_MILESTONES,
} from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

interface HeritageVaSectionProps {
  profile: ProfileData | null;
  vaImage?: string;
}

function getCredentialIcon(iconName: string) {
  switch (iconName) {
    case 'radio':
      return <Radio className="w-4 h-4 animate-pulse" />;
    case 'landmark':
      return <Landmark className="w-4 h-4" />;
    case 'award':
      return <Award className="w-4 h-4" />;
    case 'sparkles':
      return <Sparkles className="w-4 h-4 text-amber-500" />;
    case 'shield':
      return <ShieldCheck className="w-4 h-4" />;
    case 'book':
      return <BookOpen className="w-4 h-4" />;
    case 'disc':
      return <Disc3 className="w-4 h-4" />;
    case 'calendar':
      return <Calendar className="w-4 h-4" />;
    default:
      return <Landmark className="w-4 h-4" />;
  }
}

function getColorClasses(colorName: string) {
  switch (colorName) {
    case 'cyan':
      return {
        text: 'text-cyan-600 dark:text-cyan-300',
        badge: 'bg-cyan-500 dark:bg-cyan-400 text-white dark:text-neutral-950',
        borderHover: 'hover:border-cyan-400/50',
        glow: 'text-cyan-400',
      };
    case 'emerald':
      return {
        text: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-neutral-950',
        borderHover: 'hover:border-emerald-400/50',
        glow: 'text-emerald-400',
      };
    case 'purple':
      return {
        text: 'text-purple-600 dark:text-purple-300',
        badge: 'bg-purple-500 dark:bg-purple-400 text-white dark:text-neutral-950',
        borderHover: 'hover:border-purple-400/50',
        glow: 'text-purple-400',
      };
    case 'red':
      return {
        text: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-500 text-white',
        borderHover: 'hover:border-red-400/50',
        glow: 'text-red-400',
      };
    case 'amber':
    default:
      return {
        text: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-400 text-neutral-950',
        borderHover: 'hover:border-amber-400/50',
        glow: 'text-amber-500',
      };
  }
}

function getResidencyBadgeClasses(colorName: string) {
  switch (colorName) {
    case 'cyan':
      return {
        container: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
        dot: 'bg-cyan-500',
      };
    case 'amber':
      return {
        container: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30',
        dot: 'bg-amber-500',
      };
    case 'purple':
      return {
        container: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30',
        dot: 'bg-purple-500',
      };
    case 'red':
      return {
        container: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30',
        dot: 'bg-red-500',
      };
    case 'emerald':
    default:
      return {
        container: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        dot: 'bg-emerald-500',
      };
  }
}

export const HeritageVaSection: React.FC<HeritageVaSectionProps> = ({
  profile,
  vaImage = '/images/va_museum_exhibition_1790112416279.jpg',
}) => {
  const [heritageData, setHeritageData] = useState<HeritageFullData | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isDossierExpanded, setIsDossierExpanded] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await getHeritageFullData();
      setHeritageData(data);
    } catch (err) {
      console.warn('Failed to load heritage data in section:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeDb(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  // Resolved dynamic values with fallbacks
  const settings = heritageData?.settings || {
    id: 1,
    ...DEFAULT_HERITAGE_SETTINGS,
    updated_at: '',
  };

  const resolvedVaImage = normalizeImageUrl(settings.va_image || vaImage);
  const credentials = heritageData?.credentials ?? [];
  const chapters = heritageData?.chapters ?? [];
  const milestones = heritageData?.milestones ?? [];

  const leadParagraph = settings.lead_paragraph !== undefined && settings.lead_paragraph !== null ? settings.lead_paragraph : (profile?.bio_full || DEFAULT_HERITAGE_SETTINGS.lead_paragraph);
  const residencyBadgeClasses = getResidencyBadgeClasses(settings.residency_badge_color || 'emerald');

  const badgeText = settings.badge_text !== undefined ? settings.badge_text : DEFAULT_HERITAGE_SETTINGS.badge_text;
  const subbadgeText = settings.subbadge_text !== undefined ? settings.subbadge_text : DEFAULT_HERITAGE_SETTINGS.subbadge_text;
  const heading = settings.heading !== undefined ? settings.heading : DEFAULT_HERITAGE_SETTINGS.heading;
  const description = settings.description !== undefined ? settings.description : DEFAULT_HERITAGE_SETTINGS.description;

  return (
    <section id="heritage" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="max-w-3xl mb-12 md:mb-16 space-y-3">
            {(badgeText || subbadgeText) && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
                {badgeText && (
                  <span className="sound-badge text-cyan-600 dark:text-cyan-300 border-cyan-500/40 bg-cyan-500/10">
                    {badgeText}
                  </span>
                )}
                {subbadgeText && (
                  <>
                    {badgeText && <span aria-hidden="true" className="opacity-60">·</span>}
                    <span className="text-neutral-700 dark:text-white">
                      {subbadgeText}
                    </span>
                  </>
                )}
              </div>
            )}
            {heading && (
              <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                {heading}
              </h2>
            )}
            {description && (
              <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Visual Exhibition Showcase & Institutional Credentials */}
          <div className="lg:col-span-6 space-y-5">
            {/* Primary V&A Exhibition Showcase Card */}
            <ScrollReveal variant="fade-right">
              <div className="relative rounded sound-cabinet overflow-hidden border border-neutral-300 dark:border-white/15 bg-white dark:bg-neutral-950 group shadow-xl hover:border-cyan-400/50 transition-colors">
                <img
                  src={resolvedVaImage}
                  alt={settings.va_image_alt || "Victoria and Albert Museum exhibition featuring DJ Ital original Kool FM jacket"}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/30 to-transparent pointer-events-none" />

                {/* Museum Institutional Plaque */}
                <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5 p-4 sm:p-5 rounded backdrop-blur-2xl bg-neutral-950/95 border border-white/20 text-white space-y-2 shadow-2xl group-hover:border-cyan-400/40 transition-colors">
                  <div className="flex items-center justify-between text-xs font-industrial font-black">
                    <span className="text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                      <span>{settings.plaque_title || 'V&A EAST: THE MUSIC IS BLACK'}</span>
                    </span>
                    <span className="text-[10px] text-white/80 font-mono">
                      {settings.plaque_tag || '#VAM.2026.E14'}
                    </span>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed font-normal">
                    {settings.plaque_description || "Exhibition loan of DJ Ital's authentic 1990s Kool FM flight jacket and rare acetate dubplates featured in \"The Music is Black: A British Story\" at V&A East in April 2026, documenting UK Black British music history and pirate radio heritage."}
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Dynamic Archival Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {credentials.map((cred, idx) => {
                const colorClasses = getColorClasses(cred.color);
                return (
                  <ScrollReveal key={cred.id} variant="fade-up" delay={100 + idx * 50}>
                    <div className={`p-4 sm:p-5 rounded sound-card text-neutral-900 dark:text-white space-y-2 ${colorClasses.borderHover} hover:-translate-y-0.5 transition-all duration-300 h-full shadow-md`}>
                      <div className={`flex items-center gap-2 text-xs font-industrial ${colorClasses.text} font-black uppercase tracking-wider`}>
                        {getCredentialIcon(cred.icon)}
                        <span>{cred.title}</span>
                      </div>
                      <p className="text-xs text-neutral-700 dark:text-white/90 leading-relaxed font-normal">
                        {cred.description}
                      </p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>

            {/* Radio Residency Institutional Callout */}
            <ScrollReveal variant="fade-up" delay={300}>
              <div className="p-4 sm:p-5 rounded sound-card bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/15 flex items-center justify-between hover:border-emerald-500/40 transition-colors shadow-sm">
                <div>
                  <div className="text-[11px] font-industrial text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
                    {settings.residency_label || 'Current Broadcast Residency'}
                  </div>
                  <div className="text-sm sm:text-base font-display font-black text-neutral-950 dark:text-white mt-0.5 uppercase tracking-wide">
                    {settings.residency_title || 'DejaVu FM · Fortnightly Saturdays'}
                  </div>
                </div>
                <div className={`flex items-center gap-2 text-xs font-industrial font-black px-3 py-1.5 rounded sound-tag border ${residencyBadgeClasses.container}`}>
                  <span className={`w-2 h-2 rounded-none ${residencyBadgeClasses.dot} animate-ping`} />
                  <span>{settings.residency_badge || 'ON AIR'}</span>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Biographical Narrative & Chronology (Cleanly Structured) */}
          <div className="lg:col-span-6 space-y-6">
            <ScrollReveal variant="fade-left" delay={100}>
              <div className="p-6 sm:p-8 rounded sound-cabinet text-neutral-900 dark:text-white space-y-6 shadow-2xl relative overflow-hidden">
                
                {/* Curatorial Provenance Header */}
                <div id="biography" className="space-y-3">
                  <div className="text-xs font-industrial text-amber-600 dark:text-amber-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                    <span>{settings.provenance_tag || 'CURATORIAL PROVENANCE'}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase">
                    {settings.provenance_heading || 'Rooted in Hackney Sound Systems'}
                  </h3>
                  
                  {/* Clean Lead Paragraph */}
                  <p className="text-sm sm:text-base text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                    {leadParagraph}
                  </p>
                </div>

                {/* Chapter Explorer: Replaces chaotic wall-of-text with clean structured chapters */}
                {chapters.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-industrial">
                      <span className="text-neutral-500 uppercase tracking-wider font-bold">
                        Archival Chapters
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsDossierExpanded(!isDossierExpanded)}
                        className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer uppercase tracking-wider"
                      >
                        <span>{isDossierExpanded ? 'Compact View' : 'Expand All Chapters'}</span>
                        {isDossierExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Chapter Tabs for Quick Switching */}
                    <div className="sound-filter-group flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                      {chapters.map((chap, idx) => (
                        <button
                          key={chap.id}
                          type="button"
                          onClick={() => {
                            setActiveChapterIndex(idx);
                            setIsDossierExpanded(false);
                          }}
                          className={`sound-filter-tab whitespace-nowrap shrink-0 ${
                            activeChapterIndex === idx && !isDossierExpanded
                              ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                              : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white'
                          }`}
                        >
                          {chap.tab_label}
                        </button>
                      ))}
                    </div>

                    {/* Active Chapter Display (Compact) or All Chapters (Expanded) */}
                    {!isDossierExpanded ? (
                      <div className="p-4 sm:p-5 rounded sound-card bg-neutral-50 dark:bg-neutral-900/80 space-y-2 animate-in fade-in-0 duration-200">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white">
                            {chapters[activeChapterIndex]?.title}
                          </h4>
                          <span className="text-[10px] sound-tag shrink-0">
                            {chapters[activeChapterIndex]?.period}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {chapters[activeChapterIndex]?.content}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                        {chapters.map((chap) => (
                          <div
                            key={chap.id}
                            className="p-3.5 rounded sound-card bg-neutral-50 dark:bg-neutral-900/80 space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white">
                                {chap.title}
                              </span>
                              <span className="text-[9px] sound-tag">
                                {chap.period}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                              {chap.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timeline Milestones with Bold Typographic Numbers */}
                <div className="space-y-3.5 pt-4 border-t border-neutral-200 dark:border-white/10 relative">
                  <div className="text-xs font-industrial uppercase tracking-wider text-neutral-500 font-bold mb-1">
                    Key Historical Milestones
                  </div>

                  {milestones.map((m) => {
                    const colorClasses = getColorClasses(m.color);
                    return (
                      <div
                        key={m.id}
                        className="group/item flex items-start gap-4 p-2.5 -mx-2.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                      >
                        <div
                          className={`w-10 h-10 rounded flex items-center justify-center text-xs font-display font-black shrink-0 shadow-md group-hover/item:scale-110 transition-transform ${colorClasses.badge}`}
                        >
                          {m.year_badge}
                        </div>
                        <div className="space-y-0.5">
                          <div
                            className={`text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white ${colorClasses.text} transition-colors`}
                          >
                            {m.title}
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-white/85">
                            {m.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};
