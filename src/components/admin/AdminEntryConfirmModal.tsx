import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Database,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  KeyRound,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { verifyAdminPassword, getAdminAuthInfo, AdminAuthInfo } from '../../db/sqlite';

interface AdminEntryConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  stats?: {
    eventsCount: number;
    releasesCount: number;
    pendingBookingsCount: number;
  };
}

export const AdminEntryConfirmModal: React.FC<AdminEntryConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  stats,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [authInfo, setAuthInfo] = useState<AdminAuthInfo | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load auth status
  useEffect(() => {
    if (isOpen) {
      getAdminAuthInfo()
        .then((info) => setAuthInfo(info))
        .catch(() => {});
      setPassword('');
      setErrorMessage(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Handle escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) return;

    if (!password || password.trim() === '') {
      setErrorMessage('Please enter the dashboard access password.');
      inputRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await verifyAdminPassword(password);
      if (res.success) {
        // Store session authentication state
        sessionStorage.setItem('dj_ital_admin_authenticated', 'true');
        sessionStorage.setItem('dj_ital_admin_confirmed', 'true');
        if (rememberMe) {
          localStorage.setItem('dj_ital_admin_authenticated', 'true');
          localStorage.setItem('dj_ital_admin_auth_timestamp', new Date().toISOString());
        } else {
          localStorage.removeItem('dj_ital_admin_authenticated');
        }
        setFailedAttempts(0);
        onConfirm();
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= 5) {
          setLockoutTimer(30);
          setErrorMessage('Too many failed attempts. Security cooldown active for 30 seconds.');
        } else {
          setErrorMessage(
            res.error || `Incorrect password. ${5 - nextAttempts} attempt${5 - nextAttempts === 1 ? '' : 's'} remaining.`
          );
        }
        setPassword('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl glass-panel shadow-2xl overflow-hidden transition-all text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-white/15 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-amber-400/40 before:to-transparent"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-portal-title"
      >
        {/* Banner with Sound System Heritage Aesthetic */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 p-6 sm:p-7 text-neutral-950 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 select-none pointer-events-none">
            <Sliders className="w-48 h-48" />
          </div>

          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center shadow-lg shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-black uppercase tracking-widest text-neutral-900/80">
                PRODUCTION ACCESS GATE
              </div>
              <h2 id="login-portal-title" className="text-2xl sm:text-3xl font-display font-black tracking-tight leading-none text-neutral-950">
                DJ Ital Management Portal
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <p className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Enter your master administrative password to launch the <strong className="text-neutral-950 dark:text-white">DJ Ital Live Management Console</strong>.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Provides direct write access to your persistent local <strong className="text-neutral-700 dark:text-neutral-300">SQLite Database</strong> to publish dubplates, edit tour dates, update audio streams, and manage promoter bookings.
            </p>
          </div>

          {/* Database System Readiness Status */}
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950/70 border border-neutral-200 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-2 font-bold text-neutral-800 dark:text-neutral-200">
                <Database className="w-3.5 h-3.5 text-amber-500" />
                <span>STORAGE ENGINE:</span>
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>WebAssembly SQLite Ready</span>
              </span>
            </div>

            {stats && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-200 dark:border-white/10 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5">
                  <div className="text-base font-black font-display text-neutral-950 dark:text-white tabular-nums">{stats.eventsCount}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Live Shows</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5">
                  <div className="text-base font-black font-display text-neutral-950 dark:text-white tabular-nums">{stats.releasesCount}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Dubplates</div>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5">
                  <div className="text-base font-black font-display text-amber-500 tabular-nums">{stats.pendingBookingsCount}</div>
                  <div className="text-[10px] font-mono text-neutral-500 uppercase">Enquiries</div>
                </div>
              </div>
            )}
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="admin-password-input"
                  className="text-xs font-bold font-mono text-neutral-700 dark:text-neutral-300 uppercase flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Admin Access Password</span>
                </label>

                {!authInfo?.hasCustomPassword ? (
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    Default: <code className="font-bold">ital1991</code>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                    Custom Password Active
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  id="admin-password-input"
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isVerifying || lockoutTimer > 0}
                  placeholder={lockoutTimer > 0 ? `Locked for ${lockoutTimer}s...` : 'Enter dashboard password...'}
                  className={`w-full px-4 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border ${
                    errorMessage
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-neutral-300 dark:border-white/15 focus:border-amber-500 dark:focus:border-amber-400'
                  } text-sm focus:outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-white transition-colors pr-11 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-mono flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Default Password Helpful Autofill Button (Only shown if still on default password) */}
              {!authInfo?.hasCustomPassword && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    <Info className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>Change this in Dashboard → Security & Access</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPassword('ital1991');
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Fill Default
                  </button>
                </div>
              )}
            </div>

            {/* Remember Me Option */}
            <label className="flex items-center gap-2.5 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer pt-1 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500"
              />
              <span>Remember authentication on this device (30 days)</span>
            </label>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-white/10">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Public Site</span>
              </button>

              <button
                type="submit"
                disabled={isVerifying || lockoutTimer > 0}
                className="hover-shimmer w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
