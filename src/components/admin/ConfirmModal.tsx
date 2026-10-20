import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen?: boolean;
  title: string;
  message?: string;
  description?: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isDestructive?: boolean;
  isProcessing?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void | false;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen = true,
  title,
  message,
  description,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant,
  isDestructive = false,
  isProcessing = false,
  isLoading = false,
  loadingLabel = 'Processing...',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const resolvedVariant = isDestructive ? 'danger' : (variant || 'primary');
  const resolvedConfirmText = confirmLabel || confirmText || (isDestructive ? 'Delete' : 'Confirm');
  const resolvedCancelText = cancelLabel || cancelText || 'Cancel';
  const busy = isProcessing || isLoading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded border border-neutral-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
        <button
          onClick={() => onCancel && onCancel()}
          disabled={busy}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-full shrink-0 ${
              resolvedVariant === 'danger'
                ? 'bg-red-500/10 text-red-500'
                : resolvedVariant === 'warning'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-cyan-500/10 text-cyan-500'
            }`}
          >
            {resolvedVariant === 'danger' ? <Trash2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">{title}</h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{description || message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-white/10">
          <button
            type="button"
            onClick={() => onCancel && onCancel()}
            disabled={busy}
            className="px-4 py-2 rounded text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {resolvedCancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm ${
              resolvedVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : resolvedVariant === 'warning'
                ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold'
                : 'bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold'
            }`}
          >
            <span>{busy ? loadingLabel : resolvedConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
