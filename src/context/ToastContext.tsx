import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  toast: (options: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      type = 'info',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 active toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'success', title, message, duration: duration ?? 3800 });
    },
    [addToast]
  );

  const showError = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'error', title, message, duration: duration ?? 6000 });
    },
    [addToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'info', title, message, duration: duration ?? 4000 });
    },
    [addToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, duration?: number) => {
      addToast({ type: 'warning', title, message, duration: duration ?? 4500 });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        toast: addToast,
        dismissToast,
      }}
    >
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[99999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-none"
      >
        {toasts.map((item) => {
          const isSuccess = item.type === 'success';
          const isError = item.type === 'error';
          const isWarning = item.type === 'warning';
          const isInfo = item.type === 'info';

          return (
            <div
              key={item.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded sound-cabinet shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
                isSuccess
                  ? 'bg-neutral-900/95 border-emerald-500/50 text-white shadow-emerald-950/30'
                  : isError
                  ? 'bg-neutral-900/95 border-rose-500/60 text-white shadow-rose-950/30'
                  : isWarning
                  ? 'bg-neutral-900/95 border-amber-500/50 text-white shadow-amber-950/30'
                  : 'bg-neutral-900/95 border-cyan-500/50 text-white shadow-cyan-950/30'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isInfo && <Info className="w-5 h-5 text-cyan-400" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div
                  className={`text-sm font-semibold tracking-tight ${
                    isSuccess
                      ? 'text-emerald-300'
                      : isError
                      ? 'text-rose-300'
                      : isWarning
                      ? 'text-amber-300'
                      : 'text-cyan-300'
                  }`}
                >
                  {item.title}
                </div>
                {item.message && (
                  <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed break-words font-sans">
                    {item.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => dismissToast(item.id)}
                className="shrink-0 p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
