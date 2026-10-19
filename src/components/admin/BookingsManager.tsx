import React, { useState } from 'react';
import {
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import { BookingData, updateBookingStatus, deleteBooking } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { useToast } from '../../context/ToastContext';
import { useSaving } from '../../context/SavingContext';

interface BookingsManagerProps {
  bookings: BookingData[];
  onRefresh: () => void;
}

export const BookingsManager: React.FC<BookingsManagerProps> = ({ bookings, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const { withSaving } = useSaving();
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);
  const [savingBookingId, setSavingBookingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setSavingBookingId(id);
    try {
      await withSaving(async () => {
        await updateBookingStatus(id, newStatus);
        showSuccess('Status Updated', `Booking status changed to "${newStatus}".`);
        onRefresh();
      }, `Updating booking status to "${newStatus}"...`);
    } catch (err: any) {
      console.error('Failed to update booking status:', err);
      showError('Failed to Update Status', err?.message || 'A database error occurred.');
    } finally {
      setSavingBookingId(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null && !isDeleting) {
      setIsDeleting(true);
      try {
        await withSaving(async () => {
          await deleteBooking(deleteCandidateId);
          showSuccess('Booking Enquiry Deleted', 'Record was removed from SQLite.');
          setDeleteCandidateId(null);
          onRefresh();
        }, 'Deleting booking enquiry from database...');
      } catch (err: any) {
        console.error('Failed to delete booking:', err);
        showError('Failed to Delete Booking', err?.message || 'A database error occurred.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  const exportToCsv = () => {
    if (bookings.length === 0) return;
    const headers = [
      'ID',
      'Client Name',
      'Email',
      'Phone',
      'Event Type',
      'Target Date',
      'Venue City',
      'Set Length',
      'Budget',
      'Status',
      'Date Submitted',
      'Message',
    ];
    const rows = bookings.map((b) => [
      b.id,
      `"${b.client_name.replace(/"/g, '""')}"`,
      `"${b.client_email.replace(/"/g, '""')}"`,
      `"${(b.client_phone || '').replace(/"/g, '""')}"`,
      `"${b.event_type.replace(/"/g, '""')}"`,
      `"${b.target_date || ''}"`,
      `"${(b.venue_city || '').replace(/"/g, '""')}"`,
      `"${(b.set_length || '').replace(/"/g, '""')}"`,
      `"${(b.estimated_budget || '').replace(/"/g, '""')}"`,
      `"${b.status}"`,
      `"${b.created_at}"`,
      `"${(b.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dj_ital_bookings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            Promoter & Booking Enquiries ({bookings.length})
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Real-time enquiries recorded in the SQLite database with full contact, set length, and budget specs.
          </p>
        </div>

        {bookings.length > 0 && (
          <button
            onClick={exportToCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-white/10 hover:border-amber-400 text-xs font-bold text-neutral-800 dark:text-neutral-200 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>Export Bookings CSV</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {bookings.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-neutral-300 dark:border-white/10 rounded bg-white/50 dark:bg-neutral-900/30 text-neutral-500 dark:text-neutral-400 text-sm space-y-2">
            <Clock className="w-8 h-8 mx-auto text-neutral-400 opacity-60" />
            <p className="font-semibold">No booking enquiries logged yet.</p>
            <p className="text-xs">Enquiries submitted through the public booking form will appear here instantly.</p>
          </div>
        ) : (
          bookings.map((b) => {
            const cleanPhone = b.client_phone ? b.client_phone.replace(/[^0-9+]/g, '') : '';

            return (
              <div
                key={b.id}
                className="p-6 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-md space-y-4 hover:border-neutral-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-display font-black text-neutral-950 dark:text-white">
                        {b.client_name}
                      </h4>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                        ({b.created_at})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <a
                          href={`mailto:${b.client_email}?subject=RE:%20DJ%20Ital%20Booking%20Enquiry`}
                          className="text-amber-600 dark:text-amber-400 hover:underline font-mono font-bold"
                        >
                          {b.client_email}
                        </a>
                      </div>

                      {b.client_phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-mono text-neutral-700 dark:text-neutral-300">
                            {b.client_phone}
                          </span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=Hi%20${encodeURIComponent(
                                b.client_name
                              )},%20thank%20you%20for%20your%20enquiry%20regarding%20DJ%20Ital...`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-600 hover:underline inline-flex items-center gap-0.5 font-bold font-mono ml-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status select dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 font-bold">
                      Status:
                    </span>
                    <div className="relative flex items-center">
                      <select
                        value={b.status}
                        disabled={savingBookingId === b.id}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className="px-3 py-1.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/15 dark:text-white text-xs font-bold focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Declined">Declined</option>
                      </select>
                      {savingBookingId === b.id && (
                        <div className="ml-2 flex items-center gap-1 text-[11px] font-mono text-amber-500 animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={savingBookingId === b.id}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40"
                      aria-label="Delete booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Event Metadata row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-neutral-700 dark:text-neutral-300 pt-3 border-t border-neutral-100 dark:border-white/5 font-medium">
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px]">EVENT FORMAT</span>
                    <span className="font-bold text-neutral-950 dark:text-white">{b.event_type}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px]">TARGET DATE</span>
                    <span>{b.target_date || 'Flexible'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px]">LOCATION / VENUE</span>
                    <span>{b.venue_city || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block font-mono text-[10px]">SET LENGTH / BUDGET</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {b.set_length || '90 min'} · {b.estimated_budget || 'TBD'}
                    </span>
                  </div>
                </div>

                {/* Message block */}
                {b.message && (
                  <div className="p-4 rounded bg-neutral-50 border border-neutral-200 dark:bg-black/40 dark:border-white/5 text-xs text-neutral-800 dark:text-neutral-300 leading-relaxed font-sans">
                    <span className="font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
                      Promoter Notes & Sound Specs:
                    </span>
                    {b.message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Confirm Booking Deletion"
        message="Are you sure you want to remove this promoter booking enquiry from the SQLite database?"
        confirmLabel="Delete Enquiry"
        cancelLabel="Keep Record"
        isDestructive
        isLoading={isDeleting}
        loadingLabel="Deleting Enquiry..."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
