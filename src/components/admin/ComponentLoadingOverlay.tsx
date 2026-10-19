import React from 'react';
import { Loader2, Database } from 'lucide-react';

interface ComponentLoadingOverlayProps {
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
        className="w-full mb-4 px-3.5 py-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-center justify-between text-xs font-mono animate-in fade-in slide-in-from-top-1 duration-150"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
        <span className="text-[10px] opacity-75 hidden sm:inline flex items-center gap-1">
          <Database className="w-3 h-3 text-amber-500" />
          <span>SQLite Volume</span>
        </span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-mono font-medium animate-pulse"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
        <span>{message}</span>
      </div>
    );
  }

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
