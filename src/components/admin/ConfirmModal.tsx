import React from 'react';
import { AlertTriangle, Info, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen?: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
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
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  const displayMessage = message || description || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
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
            {isDestructive ? (
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
            onClick={onCancel}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20 active:scale-95'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-amber-400/20 active:scale-95'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
