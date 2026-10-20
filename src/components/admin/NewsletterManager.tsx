import React, { useState, useEffect } from 'react';
import { Mail, Copy, Check, Download, Trash2, Users } from 'lucide-react';
import {
  NewsletterSubscriberData,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';
import { ComponentLoadingOverlay } from './ComponentLoadingOverlay';

interface NewsletterManagerProps {
  onRefresh: () => void;
}

export const NewsletterManager: React.FC<NewsletterManagerProps> = ({ onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { isSaving, savingMessage, withSaving } = useSaving();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberData[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  const loadData = async () => {
    const list = await getNewsletterSubscribers();
    setSubscribers(list);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyAll = () => {
    const emails = subscribers.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopiedAll(true);
    showSuccess('Copied to Clipboard', `Copied ${subscribers.length} subscriber email addresses.`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportCsv = () => {
    try {
      const csvContent =
        'ID,Email,Created At,Source\n' +
        subscribers.map((s) => `${s.id},"${s.email}","${s.created_at}","${s.source}"`).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `djital_newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('CSV Exported', 'Subscribers list downloaded.');
    } catch (err: any) {
      showError('Export Failed', err?.message || 'Failed to export CSV');
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null) {
      try {
        await withSaving(async () => {
          await deleteNewsletterSubscriber(deleteCandidateId);
          showSuccess('Subscriber Deleted', 'Subscriber removed from SQLite.');
          setDeleteCandidateId(null);
          await loadData();
          onRefresh();
        }, 'Deleting subscriber from database...');
      } catch (err: any) {
        console.error('Failed to delete subscriber:', err);
        showError('Delete Failed', err?.message || 'A database error occurred.');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12 relative">
      <ComponentLoadingOverlay
        isSaving={isSaving}
        message={savingMessage || 'Updating subscriber list in database...'}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>Subscriber Community</span>
          </div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            VIP Newsletter & Ticket Drop Subscribers ({subscribers.length})
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Fans signed up for exclusive unreleased dubplate audio links and Vital Fest ticket alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={subscribers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAll ? 'Emails Copied!' : 'Copy All Emails'}</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={subscribers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="rounded border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 overflow-hidden shadow-sm">
        {subscribers.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-xs font-mono">
            No subscribers registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 font-mono uppercase text-neutral-500">
                <tr>
                  <th className="px-6 py-3.5 font-bold">#</th>
                  <th className="px-6 py-3.5 font-bold">Email Address</th>
                  <th className="px-6 py-3.5 font-bold">Subscribed Date</th>
                  <th className="px-6 py-3.5 font-bold">Source</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-neutral-400">{s.id}</td>
                    <td className="px-6 py-4 font-bold text-neutral-900 dark:text-white font-mono">{s.email}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono">{s.created_at}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 text-[10px] font-mono">
                        {s.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteCandidateId(s.id)}
                        className="p-1.5 rounded text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Remove Subscriber"
        message="Are you sure you want to remove this subscriber from the SQLite database?"
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
