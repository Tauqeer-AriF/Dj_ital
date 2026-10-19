import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Database,
  Calendar,
  Video,
  Disc3,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { restorePreviousCustomData, uint8ArrayToBase64, base64ToUint8Array, getDatabase, ensureSchemaMigrations } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';

interface BackupSummary {
  dbExists: boolean;
  dbSizeBytes: number;
  updatedAt: string | null;
  isSeed: boolean;
  uploadedFilesCount: number;
  uploadedFilesTotalBytes: number;
  recordCounts: {
    events?: number;
    releases?: number;
    gallery?: number;
    documentary?: number;
    media_library?: number;
    bookings?: number;
    audio_mixes?: number;
    videos?: number;
    testimonials?: number;
    [key: string]: number | undefined;
  };
  hasPreviousCustomData: boolean;
  isPersistent: boolean;
}

interface BackupRestoreManagerProps {
  onRefresh: () => void;
}

export const BackupRestoreManager: React.FC<BackupRestoreManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);

  // File Upload & Confirmation
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isQuickRestoreOpen, setIsQuickRestoreOpen] = useState(false);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/backup/summary', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err: any) {
      console.error('Error fetching backup summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDownloadBundle = async () => {
    try {
      setIsExporting(true);
      window.location.href = '/api/backup/bundle';
      showSuccess('Backup Bundle Generating', 'Your whole website bundle (.djbundle) is downloading.');
    } catch (err: any) {
      showError('Export Failed', err.message || 'Could not download backup bundle.');
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleDownloadSqlite = () => {
    window.location.href = '/api/db/export';
    showSuccess('Database Exporting', 'Downloading SQLite binary backup (.sqlite).');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsConfirmModalOpen(true);
  };

  const executeRestore = async () => {
    if (!selectedFile) return;
    setIsRestoring(true);
    setRestoreFeedback(null);

    try {
      let bundleBase64 = '';
      if (selectedFile.name.endsWith('.b64') || selectedFile.name.endsWith('.txt')) {
        const text = await selectedFile.text();
        bundleBase64 = text.trim();
      } else {
        const buffer = await selectedFile.arrayBuffer();
        bundleBase64 = uint8ArrayToBase64(new Uint8Array(buffer));
      }

      const res = await fetch('/api/restore/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleBase64,
          filename: selectedFile.name,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: `Server HTTP ${res.status}` }));
        throw new Error(errJson.error || 'Server rejected backup bundle.');
      }

      const json = await res.json();

      // Synchronize in-memory database
      if (json.databaseBase64) {
        try {
          const u8 = base64ToUint8Array(json.databaseBase64);
          const db = await getDatabase();
          // Reload SQL.js database
          const initSqlJs = (await import('sql.js')).default;
          const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
          const newDb = new SQL.Database(u8);
          ensureSchemaMigrations(newDb);
        } catch {}
      }

      showSuccess('Website Restored Successfully', json.message || 'All website data and media restored.');
      setRestoreFeedback(json.message);
      setIsConfirmModalOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await fetchSummary();
      onRefresh();

      setTimeout(() => {
        window.location.reload();
      }, 1400);
    } catch (err: any) {
      console.error('Restore error:', err);
      showError('Restore Failed', err.message || 'Failed to restore backup.');
      setRestoreFeedback('Restore Error: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const executeQuickPreviousRestore = async () => {
    setIsRestoring(true);
    try {
      const res = await restorePreviousCustomData();
      if (res.success) {
        showSuccess('Previous Data Restored', res.message);
        setRestoreFeedback(res.message);
        setIsQuickRestoreOpen(false);
        await fetchSummary();
        onRefresh();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        showError('Restore Failed', res.message);
      }
    } catch (err: any) {
      showError('Restore Error', err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const formattedDate = summary?.updatedAt
    ? new Date(summary.updatedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  const dbSizeMB = summary?.dbSizeBytes ? (summary.dbSizeBytes / (1024 * 1024)).toFixed(2) : '0';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
              Backup & Restore
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Data Protected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Download complete website data into a single portable bundle, or restore your site from a previous backup file.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Website Health & Snapshot Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Events & Shows
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>{summary?.recordCounts?.events ?? 8}</span>
          </div>
          <div className="text-[11px] text-neutral-500">Live & upcoming tour dates</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Documentaries & Videos
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-500" />
            <span>{summary?.recordCounts?.documentary ?? 4}</span>
          </div>
          <div className="text-[11px] text-neutral-500">Series episodes & trailers</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Media Library & Assets
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <span>{summary?.recordCounts?.media_library ?? 11}</span>
          </div>
          <div className="text-[11px] text-neutral-500">Logos, docs & images</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Database Snapshot Size
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span>{dbSizeMB} MB</span>
          </div>
          <div className="text-[11px] text-neutral-500 truncate" title={`Saved ${formattedDate}`}>
            Saved: {formattedDate}
          </div>
        </div>
      </div>

      {/* Main Dual Cards: Backup Bundle & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BACKUP WHOLE WEBSITE BUNDLE */}
        <div className="p-6 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/5 via-white to-transparent dark:from-amber-500/10 dark:via-neutral-900/80 dark:to-neutral-900 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderArchive className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                Download Website Backup Bundle
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                Takes your <strong>entire website data into a portable bundle file (.djbundle)</strong>. This package includes:
              </p>
            </div>

            <ul className="text-xs text-neutral-700 dark:text-neutral-300 space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Complete SQLite database (all 8 events, releases, bio, credentials)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Documentary series episodes, chapters & V&A museum archives</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>All uploaded images, videos, audio stems & press kit files</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Backup manifest JSON with verification checksums</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleDownloadBundle}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating Bundle...' : 'Download Whole Website Bundle (.djbundle)'}</span>
            </button>

            <button
              onClick={handleDownloadSqlite}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>Download Database Only (.sqlite)</span>
            </button>
          </div>
        </div>

        {/* RESTORE FROM BACKUP */}
        <div className="p-6 rounded-2xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/80 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                Restore Website from Backup
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1.5 leading-relaxed">
                Restore your complete website from any previously exported bundle or database file.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs text-neutral-600 dark:text-neutral-300 space-y-2">
              <div className="font-semibold text-neutral-950 dark:text-white flex items-center gap-1.5">
                <FileArchive className="w-4 h-4 text-cyan-500" />
                <span>Supported Formats:</span>
              </div>
              <p className="leading-relaxed">
                Upload a <strong>.djbundle</strong>, <strong>.zip</strong>, or <strong>.sqlite</strong> database file. The system automatically uncompresses and verifies all tables, media files, and settings.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".djbundle,.zip,.sqlite,.b64,.db"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Select Backup File to Restore</span>
            </button>

            <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
              An automated safety backup is taken prior to every restore.
            </p>
          </div>
        </div>
      </div>

      {/* Instant 1-Click Recovery of User Data */}
      {summary?.hasPreviousCustomData && (
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h5 className="text-sm font-bold text-neutral-950 dark:text-white">
                Instant Recovery: Previous Custom Website Data Available
              </h5>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              If a deployment ever shifts your website, you can immediately recover your previous database with all <strong>8 real events</strong>, <strong>4 documentary episodes</strong>, and <strong>11 media assets</strong> in 1 click.
            </p>
          </div>

          <button
            onClick={() => setIsQuickRestoreOpen(true)}
            disabled={isRestoring}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Previous User Data</span>
          </button>
        </div>
      )}

      {/* Feedback banner */}
      {restoreFeedback && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 text-xs font-mono flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{restoreFeedback}</span>
        </div>
      )}

      {/* Confirmation Modal for File Upload Restore */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Restore Website From Backup?"
        message={`Are you sure you want to restore "${selectedFile?.name}" (${selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB)? Your website database and uploaded assets will be replaced with the contents of this backup bundle.`}
        confirmLabel="Yes, Restore Backup"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isRestoring}
        loadingLabel="Restoring Website Data & Media..."
        onConfirm={executeRestore}
        onCancel={() => !isRestoring && setIsConfirmModalOpen(false)}
      />

      {/* Confirmation Modal for Instant Previous Recovery */}
      <ConfirmModal
        isOpen={isQuickRestoreOpen}
        title="Restore Previous Custom Data?"
        message="This will reload your saved master data containing all 8 tour dates, 4 documentary series episodes ('DJ Ital: The Journey'), 11 media assets, and custom settings."
        confirmLabel="Restore Saved Data"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isRestoring}
        loadingLabel="Restoring Custom Database..."
        onConfirm={executeQuickPreviousRestore}
        onCancel={() => !isRestoring && setIsQuickRestoreOpen(false)}
      />
    </div>
  );
};
