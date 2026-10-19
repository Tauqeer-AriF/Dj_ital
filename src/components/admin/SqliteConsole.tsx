import React, { useState } from 'react';
import { Play, RotateCcw, AlertCircle, History, Database } from 'lucide-react';
import { executeQuery, resetDatabaseToSeed, restorePreviousCustomData } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface SqliteConsoleProps {
  onRefresh: () => void;
}

export const SqliteConsole: React.FC<SqliteConsoleProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [query, setQuery] = useState('SELECT id, title, venue, event_date, status FROM events LIMIT 10;');
  const [results, setResults] = useState<any[] | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [execMessage, setExecMessage] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isRestoringPrevious, setIsRestoringPrevious] = useState(false);

  const presets = [
    { label: 'View Events', sql: 'SELECT id, title, venue, event_date, status FROM events;' },
    { label: 'View Releases', sql: 'SELECT id, title, release_year, bpm, format FROM releases;' },
    { label: 'View Bookings', sql: 'SELECT id, client_name, client_email, event_type, status FROM bookings;' },
    { label: 'View Gallery', sql: 'SELECT id, title, category, year FROM gallery;' },
    { label: 'Count Rows', sql: 'SELECT (SELECT count(*) FROM events) AS events_count, (SELECT count(*) FROM releases) AS releases_count, (SELECT count(*) FROM bookings) AS bookings_count;' },
  ];

  const handleRunQuery = async () => {
    setError(null);
    setExecMessage(null);
    try {
      const res = await executeQuery(query);
      if (res.length > 0) {
        setColumns(res[0].columns);
        setResults(res[0].values);
        const msg = `Query succeeded: returned ${res[0].values.length} rows.`;
        setExecMessage(msg);
        showSuccess('Query Executed', msg);
      } else {
        setColumns([]);
        setResults([]);
        const msg = 'Query executed successfully (statement yielded no result set).';
        setExecMessage(msg);
        showSuccess('Query Executed', msg);
      }
      onRefresh();
    } catch (err: any) {
      console.error('SQL execution error:', err);
      const errMsg = err.message || 'SQLite Syntax or Execution Error';
      setError(errMsg);
      showError('SQL Query Error', errMsg);
      setResults(null);
    }
  };

  const confirmRestorePrevious = async () => {
    setIsRestoringPrevious(true);
    try {
      const res = await restorePreviousCustomData();
      if (res.success) {
        showSuccess('Previous Data Restored', 'Successfully restored all previous custom events, 4 documentary episodes, 11 media library assets, and profile edits.');
        setIsRestoreConfirmOpen(false);
        onRefresh();
        handleRunQuery();
      } else {
        showError('Restore Error', res.message);
      }
    } catch (err: any) {
      showError('Restore Failed', err?.message || 'Failed to restore previous user data.');
    } finally {
      setIsRestoringPrevious(false);
    }
  };

  const confirmReset = async () => {
    setIsResetting(true);
    try {
      await resetDatabaseToSeed();
      showSuccess('Database Reset', 'SQLite database restored to initial factory seed with media library, heritage, audio & testimonials.');
      setIsResetConfirmOpen(false);
      onRefresh();
      handleRunQuery();
    } catch (err: any) {
      showError('Reset Failed', err?.message || 'Database reset failed.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleReset = () => {
    setIsResetConfirmOpen(true);
  };

  const handleRestorePrevious = () => {
    setIsRestoreConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">Direct SQLite SQL Console</h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Execute live SQL queries, inspect tables, and manage the in-browser SQLite database directly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRestorePrevious}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            title="Restore previous custom data (All 8 events, 4 documentaries, 11 media library assets, profile streams)"
          >
            <History className="w-3.5 h-3.5 text-emerald-500" />
            <span>Restore Previous User Data</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded border border-neutral-300 bg-neutral-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:hover:bg-red-500/20 dark:text-neutral-300 dark:hover:text-red-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Seed Data</span>
          </button>
        </div>
      </div>

      {/* Query Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mr-1">Quick Presets:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(p.sql);
            }}
            className="px-2.5 py-1 rounded-md text-xs font-mono bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-300 dark:hover:text-white dark:border-white/10 transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* SQL Input Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            rows={4}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-4 rounded font-mono text-xs bg-neutral-900 border border-neutral-700 text-amber-300 focus:outline-none focus:border-amber-400 shadow-inner"
            placeholder="Type your SQL query here (e.g. SELECT * FROM events;)"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-500">
            Powered by sql.js WebAssembly SQLite 3.39+ engine
          </span>

          <button
            onClick={handleRunQuery}
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Execute Query</span>
          </button>
        </div>
      </div>

      {/* Error or Success notification */}
      {error && (
        <div className="p-3.5 rounded bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {execMessage && !error && (
        <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
          {execMessage}
        </div>
      )}

      {/* Query Results Table */}
      {results && columns.length > 0 && (
        <div className="rounded border border-neutral-200 dark:border-white/10 overflow-hidden shadow-sm bg-white dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-100 text-neutral-700 border-b border-neutral-200 dark:bg-black/50 dark:text-neutral-300 dark:border-white/10">
                <tr>
                  {columns.map((col, i) => (
                    <th key={i} className="px-3.5 py-2.5 font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {results.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                    {row.map((val: any, colIdx: number) => (
                      <td key={colIdx} className="px-3.5 py-2 text-neutral-900 dark:text-neutral-200 whitespace-nowrap">
                        {val === null ? <span className="text-neutral-400 italic">null</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Confirm SQLite Database Reset"
        message="Are you sure you want to reset the SQLite database back to original seed records? All customised events, releases, bookings, media library assets, heritage milestones, audio mixes, and promoter testimonials will be reverted to the factory state."
        confirmLabel="Reset Database"
        cancelLabel="Keep Current DB"
        isLoading={isResetting}
        loadingLabel="Resetting Database & Seed Records..."
        isDestructive
        onConfirm={confirmReset}
        onCancel={() => !isResetting && setIsResetConfirmOpen(false)}
      />

      {/* Restore Previous User Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isRestoreConfirmOpen}
        title="Restore Previous User Data"
        message="Are you sure you want to restore your previous database? This will recover all 8 real events, 4 documentary episodes ('DJ Ital: The Journey'), 11 media library assets, radio broadcast streams, and custom profile edits."
        confirmLabel="Restore Previous Data"
        cancelLabel="Cancel"
        isLoading={isRestoringPrevious}
        loadingLabel="Restoring Previous Data & Documentaries..."
        onConfirm={confirmRestorePrevious}
        onCancel={() => !isRestoringPrevious && setIsRestoreConfirmOpen(false)}
      />
    </div>
  );
};
