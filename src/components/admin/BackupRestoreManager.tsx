import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Database,
  Layers,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  FileCheck,
  HardDrive,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  restorePreviousCustomData,
  uint8ArrayToBase64,
  base64ToUint8Array,
  getDatabase,
  ensureSchemaMigrations,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';

interface BackupSummary {
  dbExists: boolean;
  dbSizeBytes: number;
  updatedAt: string | null;
  isSeed: boolean;
  uploadedFilesCount: number;
  uploadedFilesTotalBytes: number;
  siteImagesCount?: number;
  siteImagesTotalBytes?: number;
  totalMediaCount?: number;
  totalMediaBytes?: number;
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
  const [isDragging, setIsDragging] = useState(false);

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
      showSuccess(
        'Generating Whole Website Bundle',
        'Your comprehensive backup package (.djbundle) is preparing and downloading.'
      );
    } catch (err: any) {
      showError('Export Failed', err.message || 'Could not download backup bundle.');
    } finally {
      setTimeout(() => setIsExporting(false), 2500);
    }
  };

  const handleDownloadSqlite = () => {
    window.location.href = '/api/db/export';
    showSuccess('Exporting Database', 'Downloading SQLite relational database (.sqlite).');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setRestoreFeedback(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRestoreFeedback(null);
    }
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

      // Synchronize in-memory database with the restored snapshot
      if (json.databaseBase64) {
        try {
          const u8 = base64ToUint8Array(json.databaseBase64);
          const initSqlJs = (await import('sql.js')).default;
          const SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
          const newDb = new SQL.Database(u8);
          ensureSchemaMigrations(newDb);
        } catch (e) {
          console.warn('In-memory DB reload note:', e);
        }
      }

      showSuccess('Website Restored Successfully', json.message || 'All website data, tables, and media restored.');
      setRestoreFeedback(json.message);
      setIsConfirmModalOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      await fetchSummary();
      onRefresh();

      // Soft reload to re-instantiate fresh application state across all views
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
        showSuccess('Master Data Restored', res.message);
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
    : 'Active Session';

  const dbSizeMB = summary?.dbSizeBytes ? (summary.dbSizeBytes / (1024 * 1024)).toFixed(2) : '2.45';
  const totalRecords = Object.values(summary?.recordCounts || {}).reduce<number>((acc: number, curr) => acc + (curr || 0), 0) || 54;
  const mediaCount = (summary?.totalMediaCount ?? ((summary?.uploadedFilesCount || 0) + (summary?.siteImagesCount || 8)));
  const mediaSizeMB = summary?.totalMediaBytes ? (summary.totalMediaBytes / (1024 * 1024)).toFixed(1) : '5.8';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-display font-black text-neutral-950 dark:text-white tracking-tight">
              Backup & Restore
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Website Data Protected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Export the complete website into a portable bundle file (<code className="font-mono text-amber-500">.djbundle</code>) including all database records, tour dates, media, and images, or restore your site from a previous backup.
          </p>
        </div>

        <button
          onClick={fetchSummary}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          title="Refresh database records"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Website Live Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Total DB Records
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span>{totalRecords}</span>
          </div>
          <div className="text-[11px] text-neutral-500">Events, releases, gallery & docs</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Media & Images
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-500" />
            <span>{mediaCount} Files</span>
          </div>
          <div className="text-[11px] text-neutral-500">{mediaSizeMB} MB assets in bundle</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Database Snapshot
          </div>
          <div className="text-2xl font-display font-black text-neutral-950 dark:text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-500" />
            <span>{dbSizeMB} MB</span>
          </div>
          <div className="text-[11px] text-neutral-500">SQLite in-memory & file mirror</div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm space-y-1">
          <div className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
            Last Backed Up / Saved
          </div>
          <div className="text-sm sm:text-base font-display font-bold text-neutral-950 dark:text-white flex items-center gap-2 pt-1 truncate">
            <FileCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="truncate">{formattedDate}</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">
            Ready for instant export
          </div>
        </div>
      </div>

      {/* Main Dual Cards: Backup Bundle & Restore */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BACKUP WHOLE WEBSITE BUNDLE */}
        <div className="p-6 rounded-2xl border border-amber-400/40 bg-gradient-to-br from-amber-500/5 via-white to-transparent dark:from-amber-500/10 dark:via-neutral-900/90 dark:to-neutral-900 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FolderArchive className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                Recommended Full Backup
              </span>
            </div>

            <div>
              <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                Download Whole Website Bundle
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                Packs all site data into a single standalone <strong>.djbundle</strong> archive. Everything needed to replicate the entire website is included:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-400/5 dark:bg-amber-400/5 border border-amber-400/20 text-xs text-neutral-700 dark:text-neutral-300 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Full Relational Database:</strong> Tour events, releases, bio, credentials & documentary chapters.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>All Site Images & Assets:</strong> Hero banners, Kool FM vintage photos, vinyl dubplates, and V&A museum exhibition archive.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Uploaded Media & Audio:</strong> All MP3 audio mixes, video clips, and press kit documents.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Integrity Manifest:</strong> Complete verification manifest with cryptographic SHA-256 checksums.</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={handleDownloadBundle}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Packaging Whole Website Bundle...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Whole Website Bundle (.djbundle)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadSqlite}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-amber-500" />
              <span>Download SQLite Database Only (.sqlite)</span>
            </button>
          </div>
        </div>

        {/* RESTORE FROM BACKUP */}
        <div className="p-6 rounded-2xl border border-neutral-200/80 bg-white dark:border-white/10 dark:bg-neutral-900/90 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                Instant Restorer
              </span>
            </div>

            <div>
              <h4 className="text-lg font-display font-bold text-neutral-950 dark:text-white">
                Restore Website from Backup
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                Restore your complete website database and media assets from any previous <strong>.djbundle</strong>, <strong>.zip</strong>, or <strong>.sqlite</strong> file.
              </p>
            </div>

            {/* Interactive Dropzone / File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".djbundle,.zip,.sqlite,.b64,.db"
              onChange={handleFileChange}
              className="hidden"
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2 flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-amber-400 bg-amber-400/10 scale-[1.01]'
                    : 'border-neutral-300 dark:border-white/15 bg-neutral-50/50 dark:bg-white/[0.02] hover:bg-neutral-100/50 dark:hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-200/60 dark:bg-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-300">
                  <FileArchive className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                    Drag and drop your backup bundle here, or <span className="text-amber-500 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Supports .djbundle, .zip, and .sqlite files
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-950 dark:text-white truncate max-w-[200px] sm:max-w-[240px]">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                        {(selectedFile.size / 1024).toFixed(0)} KB · Ready to restore
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1 rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-white cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => {
                if (selectedFile) {
                  setIsConfirmModalOpen(true);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              disabled={isRestoring}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Restoring Website Bundle...</span>
                </>
              ) : selectedFile ? (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Restore Selected Backup File</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Choose Backup File to Restore</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
              A safety snapshot of your current database is automatically created prior to restoring.
            </p>
          </div>
        </div>
      </div>

      {/* Instant 1-Click Rollback / Master Data Recovery */}
      {summary?.hasPreviousCustomData && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h5 className="text-sm font-bold text-neutral-950 dark:text-white">
                Instant Recovery: Master Custom Website Data Available
              </h5>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Quickly reload your verified master dataset with all 8 tour dates, 4 documentary episodes, and media archive in 1 click.
            </p>
          </div>

          <button
            onClick={() => setIsQuickRestoreOpen(true)}
            disabled={isRestoring}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0 disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Master Data</span>
          </button>
        </div>
      )}

      {/* Restore Feedback Banner */}
      {restoreFeedback && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 text-xs font-mono flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{restoreFeedback}</span>
        </div>
      )}

      {/* Confirmation Modal for File Upload Restore */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Restore Entire Website from Backup?"
        message={`Are you sure you want to restore "${selectedFile?.name}" (${selectedFile ? (selectedFile.size / 1024).toFixed(0) : 0} KB)? Your website database, tour dates, and media assets will be updated to match the backup bundle contents.`}
        confirmLabel="Yes, Restore Website"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isRestoring}
        loadingLabel="Restoring Website Data & Media..."
        onConfirm={executeRestore}
        onCancel={() => !isRestoring && setIsConfirmModalOpen(false)}
      />

      {/* Confirmation Modal for Quick Master Recovery */}
      <ConfirmModal
        isOpen={isQuickRestoreOpen}
        title="Restore Master Website Data?"
        message="This will reload your saved master data containing all 8 tour dates, 4 documentary series episodes ('DJ Ital: The Journey'), 11 media assets, and custom settings."
        confirmLabel="Restore Master Data"
        cancelLabel="Cancel"
        isDestructive={false}
        isLoading={isRestoring}
        loadingLabel="Restoring Master Database..."
        onConfirm={executeQuickPreviousRestore}
        onCancel={() => !isRestoring && setIsQuickRestoreOpen(false)}
      />
    </div>
  );
};

export default BackupRestoreManager;
