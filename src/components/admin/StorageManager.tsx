import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  ExternalLink,
  ShieldCheck,
  Server,
  FolderGit2,
  Terminal,
  FileCheck,
  Info,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getDatabase, uint8ArrayToBase64, base64ToUint8Array } from '../../db/sqlite';

interface StorageStatus {
  resolvedDataDir: string;
  isPersistent: boolean;
  mountSource: string;
  isWritable: boolean;
  dbExists: boolean;
  dbSizeBytes: number;
  dbUpdatedAt?: string;
  isSeed?: boolean;
  candidatesChecked: Array<{ path: string; exists: boolean; writable: boolean; note: string }>;
  env: Record<string, string | undefined>;
}

interface StorageManagerProps {
  onRefresh: () => void;
}

export const StorageManager: React.FC<StorageManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/system/storage-status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err: any) {
      console.error('Error fetching storage status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleForceSync = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);
      const db = await getDatabase();
      const data = db.export();
      const b64 = uint8ArrayToBase64(data);
      const timestamp = new Date().toISOString();

      const res = await fetch('/api/db/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseBase64: b64,
          timestamp,
          clientDevice: 'Admin Storage Manager (Manual Push)',
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      setSyncResult(`Successfully synchronized ${Math.round(b64.length / 1024)} KB to "${json.storageInfo?.dataDir}". Volume: ${json.storageInfo?.isPersistent ? 'PERSISTENT' : 'EPHEMERAL'}`);
      showSuccess('Volume Synchronised', 'Current database snapshot written to server persistent storage.');
      fetchStatus();
      onRefresh();
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
      showError('Sync Failed', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const [isDownloadingProject, setIsDownloadingProject] = useState(false);

  const handleDownloadProject = () => {
    try {
      setIsDownloadingProject(true);
      showSuccess('Downloading Full Project', 'Your complete project ZIP archive is being generated. Download starting...');
      const link = document.createElement('a');
      link.href = '/api/download-project';
      link.setAttribute('download', 'dj-ital-sound-system.zip');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => {
        setIsDownloadingProject(false);
      }, 3500);
    } catch (err: any) {
      setIsDownloadingProject(false);
      showError('Download Failed', err?.message || 'Could not download project ZIP');
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/db/export';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncing(true);
      setSyncResult(null);

      let base64String = '';
      if (file.name.endsWith('.b64') || file.name.endsWith('.txt')) {
        const text = await file.text();
        base64String = text.trim();
      } else {
        const buffer = await file.arrayBuffer();
        base64String = uint8ArrayToBase64(new Uint8Array(buffer));
      }

      if (!base64String.startsWith('U1FMaXRlIGZvcm1')) {
        throw new Error('Selected file does not appear to be a valid SQLite database binary or base64 snapshot.');
      }

      const res = await fetch('/api/db/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseBase64: base64String }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Import failed on server');
      }

      // Also reload in-memory client database
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('djital_sqlite_db_v1', base64String);
        localStorage.setItem(
          'djital_sqlite_meta_v1',
          JSON.stringify({
            updatedAt: new Date().toISOString(),
            isCustom: true,
            clientDevice: 'manual-restore-file',
          })
        );
      }

      showSuccess('Database Restored', 'Uploaded SQLite database has been restored to the persistent volume.');
      setSyncResult('Database restored successfully from backup file!');
      fetchStatus();
      onRefresh();
      // Reload window after brief delay to reinitialize WASM memory cleanly
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      showError('Restore Failed', err.message);
      setSyncResult(`Restore error: ${err.message}`);
    } finally {
      setIsSyncing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const isRailway = Boolean(
    status?.env?.RAILWAY_VOLUME_NAME ||
      status?.env?.RAILWAY_VOLUME_MOUNT_PATH ||
      status?.mountSource?.toLowerCase().includes('railway')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
              Railway Volume & Persistent Storage
            </h3>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium ${
                status?.isPersistent
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {status?.isPersistent ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Volume Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Ephemeral Container Disk
                </>
              )}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Diagnose persistent disk attachments, verify Railway mount paths, prevent code deployments from wiping data, and export/import database backups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Storage Directory */}
        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-mono uppercase font-semibold">Active Storage Path</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {status?.resolvedDataDir || 'Detecting...'}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
            Source: <span className="text-neutral-800 dark:text-neutral-200">{status?.mountSource || 'N/A'}</span>
          </div>
        </div>

        {/* Persistence & Writable Status */}
        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-mono uppercase font-semibold">Persistence & Permissions</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${
                status?.isPersistent ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {status?.isPersistent ? 'Persistent Volume Attached' : 'Ephemeral Disk'}
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono flex items-center gap-2">
            <span>Disk Writable:</span>
            <span className={status?.isWritable ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>
              {status?.isWritable ? 'YES (Read/Write OK)' : 'NO (Read-only Error)'}
            </span>
          </div>
        </div>

        {/* Database Snapshot Stats */}
        <div className="p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white dark:bg-neutral-900/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-mono uppercase font-semibold">Volume Database State</span>
            <FileCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100">
            {status?.dbExists
              ? `${(status.dbSizeBytes / 1024 / 1024).toFixed(2)} MB snapshot`
              : 'No DB on Volume Yet'}
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate">
            {status?.isSeed ? (
              <span className="text-amber-500">Factory baseline seed snapshot</span>
            ) : status?.dbUpdatedAt ? (
              <span>Updated: {new Date(status.dbUpdatedAt).toLocaleString()}</span>
            ) : (
              <span>Not seeded</span>
            )}
          </div>
        </div>
      </div>

      {/* Railway Root-Cause Investigation Card */}
      <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Why Railway loses updates and how to make persistence 100% permanent:</span>
        </div>
        <div className="text-xs text-neutral-700 dark:text-neutral-300 space-y-2 leading-relaxed">
          <p>
            When deploying on <strong>Railway.com</strong>, Docker containers are <em>ephemeral</em> by default. Every time you push a code update or Railway restarts the service, Railway creates a <strong>fresh new container</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-white/80 dark:bg-black/30 border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                The Common Pitfall
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                1. A volume was created in Railway canvas, but <strong>never attached to this Web Service</strong>.<br />
                2. Or the volume was mounted at <code>/data</code>, but the Node.js application runs in <code>/app</code> with working data at <code>/app/data</code>.<br />
                3. The container wrote changes to ephemeral root disk, which Railway destroyed upon the next commit!
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/80 dark:bg-black/30 border border-neutral-200 dark:border-white/10 space-y-1">
              <span className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                The 2-Minute Solution
              </span>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                In Railway Dashboard:<br />
                1. Click your Web Service &rarr; <strong>Settings</strong> &rarr; scroll to <strong>Volumes</strong>.<br />
                2. Attach Volume with <strong>Mount Path</strong>: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-bold">/app/data</code>.<br />
                3. In <strong>Variables</strong> tab, add: <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-bold">DATA_DIR=/app/data</code>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Project Archive Export (Ready for Railway / Local) */}
      <div className="p-5 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:bg-amber-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                Download Complete Project Directory (ZIP)
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-neutral-950 uppercase">
                Railway Ready
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Download the entire codebase (React components, Vite build config, Express backend, SQLite database schemas, .npmrc dependency resolver, and audio/image assets) as a clean, ready-to-deploy ZIP archive.
            </p>
          </div>

          <button
            onClick={handleDownloadProject}
            disabled={isDownloadingProject}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
          >
            <Download className={`w-4 h-4 ${isDownloadingProject ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingProject ? 'Preparing ZIP...' : 'Download Full Project (ZIP)'}</span>
          </button>
        </div>
      </div>

      {/* Backup & Direct Sync Action Bar */}
      <div className="p-5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900/70 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Database Snapshot Actions</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Download your full database anytime or upload a backup file to restore.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download Backup */}
          <button
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download SQLite Backup (.sqlite)</span>
          </button>

          {/* Upload Backup */}
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-300 dark:border-white/15 bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition-colors cursor-pointer shadow-sm">
            <Upload className="w-4 h-4" />
            <span>Restore From File (.sqlite / .b64)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.b64,.db,.bin"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Force Push to Volume */}
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shadow-sm ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Writing to Volume...' : 'Force Sync to Volume Now'}</span>
          </button>
        </div>

        {syncResult && (
          <div className="p-3 rounded-lg bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs font-mono text-neutral-800 dark:text-neutral-200">
            {syncResult}
          </div>
        )}
      </div>

      {/* Diagnostic Candidates Inspector */}
      {status?.candidatesChecked && status.candidatesChecked.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-neutral-900/60">
          <div className="p-3.5 bg-neutral-100 dark:bg-black/40 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
              Storage Candidates & Mount Point Probe Results
            </span>
            <span className="text-[11px] font-mono text-neutral-500">
              {status.candidatesChecked.length} paths probed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-neutral-600 dark:text-neutral-400 border-b border-neutral-200 dark:border-white/10">
                <tr>
                  <th className="px-3.5 py-2 font-semibold">Directory Path</th>
                  <th className="px-3.5 py-2 font-semibold">Exists</th>
                  <th className="px-3.5 py-2 font-semibold">Writable</th>
                  <th className="px-3.5 py-2 font-semibold">Candidate Type / Source</th>
                  <th className="px-3.5 py-2 font-semibold">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {status.candidatesChecked.map((c, i) => {
                  const isActive = status.resolvedDataDir === c.path;
                  return (
                    <tr
                      key={i}
                      className={
                        isActive
                          ? 'bg-amber-500/10 dark:bg-amber-500/15 font-semibold'
                          : 'hover:bg-neutral-50 dark:hover:bg-white/5'
                      }
                    >
                      <td className="px-3.5 py-2.5 text-neutral-900 dark:text-neutral-100">
                        {c.path}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {c.exists ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">YES</span>
                        ) : (
                          <span className="text-neutral-400">NO</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {c.writable ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">YES</span>
                        ) : (
                          <span className="text-red-500 font-bold">NO</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-neutral-600 dark:text-neutral-400">
                        {c.note}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-neutral-950 font-bold">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
