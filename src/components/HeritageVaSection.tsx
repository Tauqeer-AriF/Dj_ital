import React, { useState } from 'react';
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
} from 'lucide-react';
import { ProfileData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { FALLBACK_IMAGE, normalizeImageUrl } from '../utils/imageOptimization';

interface HeritageVaSectionProps {
  profile: ProfileData | null;
  vaImage?: string;
}

interface BioChapter {
  id: string;
  tabLabel: string;
  title: string;
  period: string;
  content: string;
}

function parseBioChapters(rawText: string | undefined): { lead: string; chapters: BioChapter[] } {
  const fallbackLead =
    'DJ Ital (born Martin Oscar, 1968, Hackney, London) is a British DJ, producer, and event promoter. A pioneer of the jungle music genre, he joined the legendary pirate radio station Kool FM (94.5) during its explosive early 90s genesis. In 2026, his enduring influence on British music culture was formally recognised by the Victoria and Albert Museum (V&A East).';

  const defaultChapters: BioChapter[] = [
    {
      id: 'kool-fm',
      tabLabel: 'Kool FM',
      title: 'Underground Genesis & Rooftop Transmitters',
      period: '1991 — 1994',
      content:
        'Emerging from the East London underground scene, Ital joined Kool FM 94.5 during its foundational years. Transmitting weekly live sets from rooftop pirate rigs in Hackney and Bow, he played an integral role in establishing jungle and drum and bass across London.',
    },
    {
      id: 'decibel',
      tabLabel: '"Decibel"',
      title: 'Production of Jungle Anthem "Decibel"',
      period: '1995',
      content:
        'In 1995, Ital produced "Decibel" (widely known as "Decibels"), featured on the Kool FM 5th Anniversary compilation. The track is recognised as a benchmark of mid-90s jungle, marrying intricate time-stretched breakbeats with heavyweight electronic sub-bass.',
    },
    {
      id: 'media',
      tabLabel: 'Media & Docu',
      title: 'Knowledge Magazine Retrospective & Journey Series',
      period: '2006 — 2024',
      content:
        'Featured in Knowledge Magazine (Issue 85) by Giles Wood, detailing technical mixing craft and pirate radio evolution. In 2024, he released the documentary series "DJ Ital: The Journey", cataloguing first-hand accounts and rare archival rave footage.',
    },
    {
      id: 'vital-fest',
      tabLabel: 'Vital Fest',
      title: 'Preserving Sound System Culture in East London',
      period: '2023 — Present',
      content:
        'Founded Vital Fest in Hackney, hosting events across The Hackney Social, The Yard Theatre, and Arch 14. Resident Advisor highlighted the series for keeping grassroots sound system heritage alive with veterans DJ Brockie, Ragga Twins, and Jumpin Jack Frost.',
    },
    {
      id: 'va-museum',
      tabLabel: 'V&A East',
      title: 'V&A East: The Music is Black Exhibition',
      period: 'April 2026',
      content:
        'His cultural legacy was formally memorialised by the Victoria and Albert Museum for the exhibition "The Music is Black: A British Story" at V&A East, with his original 1990s flight jacket and acetate dubplates preserved as permanent artefacts of UK Black British music history.',
    },
  ];

  if (!rawText) {
    return { lead: fallbackLead, chapters: defaultChapters };
  }

  // Clean unescaped literal \n from database string
  const clean = rawText
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  const rawParagraphs = clean.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (rawParagraphs.length === 0) {
    return { lead: fallbackLead, chapters: defaultChapters };
  }

  const lead = rawParagraphs[0];

  if (rawParagraphs.length === 1) {
    return { lead, chapters: defaultChapters };
  }

  // Parse remaining paragraphs into chapters
  const parsedChapters: BioChapter[] = rawParagraphs.slice(1).map((sec, idx) => {
    const lines = sec.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = `Archival Record ${idx + 1}`;
    let tabLabel = `Part ${idx + 1}`;
    let period = 'Archival Dossier';
    let content = sec;

    if (lines.length > 1 && lines[0].length < 60) {
      title = lines[0].replace(/[:#]/g, '').trim();
      content = lines.slice(1).join(' ');
    }

    const lower = sec.toLowerCase();
    if (lower.includes('career') || lower.includes('kool fm')) {
      tabLabel = 'Career & Kool FM';
      period = '1991—1994';
      if (title.startsWith('Archival')) title = 'Underground Genesis & Kool FM Transmitters';
    } else if (lower.includes('decibel')) {
      tabLabel = '"Decibel" 1995';
      period = '1995 Milestone';
      if (title.startsWith('Archival')) title = 'Production of Anthem "Decibel"';
    } else if (lower.includes('knowledge') || lower.includes('documentar')) {
      tabLabel = 'Media & Press';
      period = 'Retrospective Accounts';
      if (title.startsWith('Archival')) title = 'Knowledge Magazine & Documentary Archive';
    } else if (lower.includes('vital fest')) {
      tabLabel = 'Vital Fest';
      period = '2023—Present';
      if (title.startsWith('Archival')) title = 'Vital Fest Sound System Series';
    } else if (lower.includes('victoria') || lower.includes('v&a') || lower.includes('cultural recognition')) {
      tabLabel = 'V&A East 2026';
      period = 'Institutional Archive';
      if (title.startsWith('Archival')) title = 'V&A East Museum Cultural Memorialisation';
    }

    return {
      id: `bio-chap-${idx}`,
      tabLabel,
      title,
      period,
      content,
    };
  });

  return {
    lead,
    chapters: parsedChapters.length > 0 ? parsedChapters : defaultChapters,
  };
}

export const HeritageVaSection: React.FC<HeritageVaSectionProps> = ({
  profile,
  vaImage = '/images/va_museum_exhibition_1790112416279.jpg',
}) => {
  const resolvedVaImage = normalizeImageUrl(vaImage);
  const { lead, chapters } = parseBioChapters(profile?.bio_full);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [isDossierExpanded, setIsDossierExpanded] = useState<boolean>(false);

  return (
    <section id="heritage" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <ScrollReveal variant="fade-up">
          <div className="max-w-3xl mb-12 md:mb-16 space-y-3">
            <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
              <span className="sound-badge text-cyan-600 dark:text-cyan-300 border-cyan-500/40 bg-cyan-500/10">[ V&A NATIONAL ARCHIVE // 1991—2026 ]</span>
              <span aria-hidden="true" className="opacity-60">·</span>
              <span className="text-neutral-700 dark:text-white">EAST LONDON PIRATE RIGS TO NATIONAL MUSEUM</span>
            </div>
            <h2 className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
              From Hackney Pirate Towers to the V&A Museum
            </h2>
            <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base max-w-xl font-normal leading-relaxed">
              Tracing DJ Ital's 35-year journey from pirate broadcasts across East London rooftops to receiving permanent archival recognition in the Victoria & Albert Museum in 2026.
            </p>
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
                  alt="Victoria and Albert Museum exhibition featuring DJ Ital original Kool FM jacket"
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
                      <span>V&A EAST: THE MUSIC IS BLACK</span>
                    </span>
                    <span className="text-[10px] text-white/80 font-mono">
                      #VAM.2026.E14
                    </span>
                  </div>
                  <p className="text-xs text-white/95 leading-relaxed font-normal">
                    Exhibition loan of DJ Ital's authentic 1990s Kool FM flight jacket and rare acetate dubplates featured in "The Music is Black: A British Story" at V&A East in April 2026, documenting UK Black British music history and pirate radio heritage.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* 4-Item Balanced Archival Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScrollReveal variant="fade-up" delay={100}>
                <div className="p-4 sm:p-5 rounded sound-card text-neutral-900 dark:text-white space-y-2 hover:border-amber-400/50 hover:-translate-y-0.5 transition-all duration-300 h-full shadow-md">
                  <div className="flex items-center gap-2 text-xs font-industrial text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>Kool FM 94.5 (Est. 1991)</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-white/90 leading-relaxed font-normal">
                    Core resident broadcaster on the undisputed pirate powerhouse that established jungle worldwide across London's high-rise transmitters.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={150}>
                <div className="p-4 sm:p-5 rounded sound-card text-neutral-900 dark:text-white space-y-2 hover:border-cyan-400/50 hover:-translate-y-0.5 transition-all duration-300 h-full shadow-md">
                  <div className="flex items-center gap-2 text-xs font-industrial text-cyan-600 dark:text-cyan-300 font-black uppercase tracking-wider">
                    <Landmark className="w-4 h-4" />
                    <span>Knowledge Magazine</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-white/90 leading-relaxed font-normal">
                    Featured in the landmark print retrospective (Issue 85) honouring DJ Ital's technical mixing approach and the golden era evolution of pirate radio.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={200}>
                <div className="p-4 sm:p-5 rounded sound-card text-neutral-900 dark:text-white space-y-2 hover:border-cyan-400/50 hover:-translate-y-0.5 transition-all duration-300 h-full shadow-md">
                  <div className="flex items-center gap-2 text-xs font-industrial text-cyan-600 dark:text-cyan-300 font-black uppercase tracking-wider">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>V&A Curatorial Loan</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-white/90 leading-relaxed font-normal">
                    Official museum accession of original flight jacket artefact and master acetate dubplates memorialised in national heritage collections.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={250}>
                <div className="p-4 sm:p-5 rounded sound-card text-neutral-900 dark:text-white space-y-2 hover:border-amber-400/50 hover:-translate-y-0.5 transition-all duration-300 h-full shadow-md">
                  <div className="flex items-center gap-2 text-xs font-industrial text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Resident Advisor</span>
                  </div>
                  <p className="text-xs text-neutral-700 dark:text-white/90 leading-relaxed font-normal">
                    Praised by electronic music media for leading the community sound-system resurgence at Hackney Social, Yard Theatre, and Arch 14.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Radio Residency Institutional Callout */}
            <ScrollReveal variant="fade-up" delay={300}>
              <div className="p-4 sm:p-5 rounded sound-card bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-white/15 flex items-center justify-between hover:border-emerald-500/40 transition-colors shadow-sm">
                <div>
                  <div className="text-[11px] font-industrial text-amber-600 dark:text-amber-400 font-black uppercase tracking-wider">
                    Current Broadcast Residency
                  </div>
                  <div className="text-sm sm:text-base font-display font-black text-neutral-950 dark:text-white mt-0.5 uppercase tracking-wide">
                    DejaVu FM · Fortnightly Saturdays
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-industrial text-emerald-600 dark:text-emerald-400 font-black px-3 py-1.5 rounded sound-tag bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-none bg-emerald-500 animate-ping" />
                  <span>ON AIR</span>
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
                    <span>CURATORIAL PROVENANCE</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase">
                    Rooted in Hackney Sound Systems
                  </h3>
                  
                  {/* Clean Lead Paragraph */}
                  <p className="text-sm sm:text-base text-neutral-700 dark:text-white/95 leading-relaxed font-normal">
                    {lead}
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
                          {chap.tabLabel}
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

                  <div className="group/item flex items-start gap-4 p-2.5 -mx-2.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded bg-amber-400 text-neutral-950 flex items-center justify-center text-xs font-display font-black shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      '91
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors">
                        Joined Kool FM 94.5 Core
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-white/85">
                        Broadcasting weekly sets over London from Hackney and Bow rooftop pirate rigs.
                      </div>
                    </div>
                  </div>

                  <div className="group/item flex items-start gap-4 p-2.5 -mx-2.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded bg-amber-400 text-neutral-950 flex items-center justify-center text-xs font-display font-black shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      '95
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors">
                        Produced Jungle Anthem "Decibel"
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-white/85">
                        Released on Kool FM 5th Anniversary compilation; played out across raves throughout the UK.
                      </div>
                    </div>
                  </div>

                  <div className="group/item flex items-start gap-4 p-2.5 -mx-2.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded bg-amber-400 text-neutral-950 flex items-center justify-center text-xs font-display font-black shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      '23
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors">
                        Founded Vital Fest Series
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-white/85">
                        Launched East London festival series uniting legends Brockie, Ragga Twins, and Jumpin Jack Frost.
                      </div>
                    </div>
                  </div>

                  <div className="group/item flex items-start gap-4 p-2.5 -mx-2.5 rounded hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors">
                    <div className="w-10 h-10 rounded bg-cyan-500 dark:bg-cyan-400 text-white dark:text-neutral-950 flex items-center justify-center text-xs font-display font-black shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      '26
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-black font-industrial uppercase tracking-wider text-neutral-950 dark:text-white group-hover/item:text-cyan-600 dark:group-hover/item:text-cyan-300 transition-colors">
                        V&A Museum Archival Recognition
                      </div>
                      <div className="text-xs text-neutral-600 dark:text-white/85">
                        Permanently recognised for cultural contributions to British music history with museum exhibition loans at V&A East.
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};
