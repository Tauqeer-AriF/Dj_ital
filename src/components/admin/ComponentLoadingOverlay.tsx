import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ComponentLoadingOverlayProps {
  isSaving: boolean;
  message?: string;
  variant?: 'overlay' | 'inline' | 'bar';
}

export const ComponentLoadingOverlay: React.FC<ComponentLoadingOverlayProps> = ({
  isSaving,
  message = 'Saving changes to database...',
  variant = 'overlay',
}) => {
  if (!isSaving) return null;

  if (variant === 'bar') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full bg-amber-400 text-neutral-950 px-4 py-2 flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-wide shadow-md animate-in slide-in-from-top duration-200"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-neutral-950" />
        <span>{message}</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-500 text-xs font-mono font-bold animate-pulse"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-400" />
        <span>{message}</span>
      </div>
    );
  }

  // Default: 'overlay'
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-[2px] rounded flex flex-col items-center justify-center p-4 transition-all duration-200 animate-in fade-in"
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded border border-amber-500/30 bg-neutral-950 text-white shadow-2xl">
        <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
        <span className="text-xs font-mono font-semibold tracking-wide text-neutral-100">
          {message}
        </span>
      </div>
    </div>
  );
};
