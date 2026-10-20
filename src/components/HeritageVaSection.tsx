import React, { useState } from 'react';
import { Radio, Award, Disc, Landmark, Sparkles, History, Calendar, CheckCircle2 } from 'lucide-react';
import {
  HeritageSettingsData,
  HeritageCredentialData,
  HeritageChapterData,
  HeritageMilestoneData,
} from '../db/sqlite';
import { normalizeImageUrl } from '../utils/imageOptimization';

export interface HeritageVaSectionProps {
  settings: HeritageSettingsData;
  credentials?: HeritageCredentialData[];
  chapters?: HeritageChapterData[];
  milestones?: HeritageMilestoneData[];
}

export const HeritageVaSection: React.FC<HeritageVaSectionProps> = ({
  settings,
  credentials = [],
  chapters = [],
  milestones = [],
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const getIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'award':
        return <Award className="w-5 h-5" />;
      case 'disc':
        return <Disc className="w-5 h-5" />;
      case 'landmark':
        return <Landmark className="w-5 h-5" />;
      default:
        return <Radio className="w-5 h-5" />;
    }
  };

  return (
    <section id="heritage" className="py-24 px-4 sm:px-6 lg:px-8 relative bg-neutral-950 text-white overflow-hidden border-t border-white/5">
      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5" />
            <span>{settings.subbadge_text || 'UK JUNGLE HERITAGE'}</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight uppercase">
            {settings.heading}
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            {settings.description}
          </p>
        </div>

        {/* Feature Hero Card (V&A East Museum + Kool FM) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-900/60 rounded-2xl border border-white/10 p-6 sm:p-10 backdrop-blur-xl">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-mono font-bold uppercase">
              <Landmark className="w-4 h-4" />
              <span>{settings.plaque_tag || 'EXHIBITION ARCHIVE'}</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white uppercase">
              {settings.plaque_title}
            </h3>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              {settings.plaque_description}
            </p>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                {settings.residency_label || 'ORIGINAL RESIDENCY'}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-lg text-white">
                  {settings.residency_title || 'Kool FM 94.5 London'}
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-400 text-neutral-950">
                  {settings.residency_badge || '1992 - 1999'}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3] bg-neutral-900 shadow-2xl group">
              <img
                src={normalizeImageUrl(settings.va_image)}
                alt={settings.va_image_alt || 'V&A East Exhibition'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/va_museum_exhibition_1790112416279.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono text-neutral-300 bg-black/60 backdrop-blur-md p-3 rounded border border-white/10">
                {settings.va_image_alt || 'Victoria & Albert East Museum Collection'}
              </div>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        {credentials.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-6 rounded-xl border border-white/10 bg-neutral-900/40 backdrop-blur-md space-y-3 hover:border-amber-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center">
                  {getIcon(cred.icon)}
                </div>
                <h4 className="font-display font-bold text-base text-white uppercase">{cred.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{cred.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Archival Chapters Tabs */}
        {chapters.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
              {chapters.map((chap, idx) => (
                <button
                  key={chap.id}
                  onClick={() => setActiveTab(idx)}
                  className={`px-4 py-2 rounded-lg text-xs font-mono uppercase font-bold tracking-wider shrink-0 transition-all cursor-pointer ${
                    activeTab === idx
                      ? 'bg-amber-400 text-neutral-950 shadow-md'
                      : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {chap.tab_label}
                </button>
              ))}
            </div>

            {chapters[activeTab] && (
              <div className="p-8 rounded-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                  <h3 className="text-2xl font-display font-bold text-white uppercase">
                    {chapters[activeTab].title}
                  </h3>
                  <span className="px-3 py-1 rounded text-xs font-mono font-bold bg-white/10 text-amber-400">
                    {chapters[activeTab].period}
                  </span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
                  {chapters[activeTab].content}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Timeline Milestones */}
        {milestones.length > 0 && (
          <div className="space-y-8 pt-8">
            <div className="text-center">
              <h3 className="text-2xl font-display font-bold uppercase text-white tracking-tight">
                Historical Chronology
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-xl border border-white/10 bg-neutral-900/60 backdrop-blur-md space-y-2 relative"
                >
                  <div className="text-xs font-mono font-black text-amber-400 tracking-wider">
                    {m.year_badge}
                  </div>
                  <h4 className="font-display font-bold text-sm text-white uppercase">{m.title}</h4>
                  <p className="text-xs text-neutral-400 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
