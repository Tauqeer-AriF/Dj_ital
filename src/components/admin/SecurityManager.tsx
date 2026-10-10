import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { getAdminAuthInfo, changeAdminPassword, AdminAuthInfo } from '../../db/sqlite';

export const SecurityManager: React.FC = () => {
  const [authInfo, setAuthInfo] = useState<AdminAuthInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAuthInfo = async () => {
    try {
      const info = await getAdminAuthInfo();
      setAuthInfo(info);
    } catch (err) {
      console.warn('Failed to load auth info:', err);
    }
  };

  useEffect(() => {
    loadAuthInfo();
  }, []);

  // Compute simple password strength
  const calculateStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-neutral-200 dark:bg-neutral-800' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, label: 'Moderate', color: 'bg-amber-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = calculateStrength(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isTooShort = newPassword.length > 0 && newPassword.length < 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Please enter your current admin password.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await changeAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setSuccessMsg(res.message || 'Dashboard password successfully changed!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await loadAuthInfo();
      } else {
        setErrorMsg(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected error updating password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/60 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Production Security & Credentials</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
              Dashboard Access & Password
            </h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl leading-relaxed">
              Manage the master password protecting the management dashboard at <code className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold">/admin</code>. All credentials are encrypted locally using WebCrypto SHA-256 with unique cryptographic salts.
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="shrink-0 p-4 rounded-2xl glass-card space-y-1 min-w-[200px]">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Access State
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              {authInfo?.hasCustomPassword ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Custom Password Active</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Default Passcode Active</span>
                </span>
              )}
            </div>
            {authInfo?.updatedAt && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-500 dark:text-neutral-400 pt-0.5">
                <Clock className="w-3 h-3" />
                <span>Updated: {new Date(authInfo.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel hover-glass-sheen shadow-xl space-y-6 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-amber-400/40 before:to-transparent">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-black text-neutral-950 dark:text-white">
                Change Dashboard Password
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Update your login credentials. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <div className="space-y-1">
              <p className="font-bold">{successMsg}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400/80">
                Next time you enter the dashboard, use this new password. It has been synced with your SQLite persistent database.
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <p className="font-bold">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
              <span>Current Password</span>
              {!authInfo?.hasCustomPassword && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 normal-case font-mono">
                  (Initial Default: <code className="font-bold">ital1991</code>)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password..."
                required
                className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 pr-11 font-mono transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                title={showCurrent ? 'Hide password' : 'Show password'}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password & Confirm Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>New Password</span>
                <span className="text-[10px] text-neutral-500 normal-case">Min 6 characters</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 pr-11 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                  title={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-500">Strength:</span>
                    <span className="font-bold text-neutral-700 dark:text-neutral-300">
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex gap-1">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        strength.score >= 1 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.3%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        strength.score >= 2 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.3%' }}
                    />
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        strength.score >= 3 ? strength.color : 'bg-transparent'
                      }`}
                      style={{ width: '33.4%' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                <span>Confirm New Password</span>
                {confirmPassword && (
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isMatch ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {isMatch ? '✓ Passwords match' : '✕ Does not match'}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-white/10 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-amber-500 pr-11 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer transition-colors"
                  title={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 dark:border-white/10">
            <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Password change updates local SQLite database & server snapshot</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || isTooShort || !isMatch}
              className="hover-shimmer w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-400/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Architecture Information Panel */}
      <div className="p-6 rounded-3xl glass-card text-xs space-y-4">
        <h3 className="font-mono font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Security Architecture Standards</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-600 dark:text-neutral-400">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 space-y-1">
            <span className="font-mono font-bold text-neutral-900 dark:text-white block">
              Cryptographic Salt & Hash
            </span>
            <p className="text-[11px] leading-relaxed">
              Passwords are never stored in plain text. Each password uses a 128-bit cryptographically secure pseudorandom salt with SHA-256 digests.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 space-y-1">
            <span className="font-mono font-bold text-neutral-900 dark:text-white block">
              SQLite Isolation
            </span>
            <p className="text-[11px] leading-relaxed">
              Authentication state is encapsulated in an internal <code className="font-mono text-amber-500">admin_auth</code> database relation, protected from public queries.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-neutral-950/60 border border-neutral-200 dark:border-white/5 space-y-1">
            <span className="font-mono font-bold text-neutral-900 dark:text-white block">
              Multi-Device Persistence
            </span>
            <p className="text-[11px] leading-relaxed">
              When synced, your updated password automatically applies to all linked mobile, tablet, and desktop administrative sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
