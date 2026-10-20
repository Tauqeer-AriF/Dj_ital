import React from 'react';
import { Disc, Radio } from 'lucide-react';

export interface AppLoaderProps {
  message?: string;
  colorScheme?: string;
  accentColor?: string;
  logoUrl?: string;
  signatureBpm?: number;
  brandSlogan?: string;
  statusText?: string;
}

export const AppLoader: React.FC<AppLoaderProps> = ({
  message,
  colorScheme = 'amber',
  accentColor = '#f59e0b',
  logoUrl,
  signatureBpm = 164,
  brandSlogan = 'DjItal 164bpm',
  statusText,
}) => {
  const displayText = statusText || message || 'INITIALIZING DJ ITAL SOUND SYSTEM...';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 text-white p-4">
      <div className="relative flex items-center justify-center mb-6">
        <div
          className="w-20 h-20 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: `${accentColor}33`, borderTopColor: accentColor }}
        />
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain absolute" />
        ) : (
          <Disc className="w-10 h-10 absolute" style={{ color: accentColor }} />
        )}
      </div>

      <div className="text-center space-y-2">
        <div
          className="flex items-center justify-center gap-2 text-xs font-mono font-bold uppercase tracking-widest animate-pulse"
          style={{ color: accentColor }}
        >
          <Radio className="w-4 h-4" />
          <span>KOOL FM 94.5 DUBPLATE LINK • {signatureBpm} BPM</span>
        </div>
        <p className="text-xs font-mono text-neutral-400 tracking-wider uppercase">{displayText}</p>
        {brandSlogan && (
          <p className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">{brandSlogan}</p>
        )}
      </div>
    </div>
  );
};
