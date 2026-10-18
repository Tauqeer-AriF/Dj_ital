import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, Check, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen?: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen = true,
  title,
  message,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  loadingLabel,
  onConfirm,
  onCancel,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const effectiveLoading = isLoading || internalLoading;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || effectiveLoading) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, effectiveLoading, onCancel]);

  if (!isOpen) return null;
  const displayMessage = message || description || '';

  const handleConfirmClick = async () => {
    if (effectiveLoading) return;
    try {
      const result = onConfirm();
      if (result && typeof (result as any).then === 'function') {
        setInternalLoading(true);
        await result;
      }
    } catch (err) {
      console.error('Confirmation action error:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !effectiveLoading) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded sound-cabinet bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-11 h-11 rounded flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}
          >
            {effectiveLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isDestructive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Info className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <h3 className="text-lg font-display font-black text-neutral-950 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {displayMessage}
            </p>
          </div>

          <button
            onClick={() => !effectiveLoading && onCancel()}
            disabled={effectiveLoading}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={effectiveLoading}
            className="px-4 py-2.5 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={effectiveLoading}
            className={`px-5 py-2.5 rounded text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-2 ${
              effectiveLoading
                ? 'opacity-85 cursor-wait bg-amber-500/80 text-neutral-950'
                : isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 active:scale-95'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-400/20 active:scale-95'
            } disabled:cursor-not-allowed`}
          >
            {effectiveLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingLabel || 'Processing...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
