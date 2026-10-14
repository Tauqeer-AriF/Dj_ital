import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X, Image as ImageIcon } from 'lucide-react';
import { EventData, createEvent, updateEvent, deleteEvent } from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';
import { useToast } from '../../context/ToastContext';

interface EventsManagerProps {
  events: EventData[];
  onRefresh: () => void;
}

export const EventsManager: React.FC<EventsManagerProps> = ({ events, onRefresh }) => {
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    venue: '',
    location: '',
    event_date: '',
    start_time: '',
    lineup: '',
    ticket_url: '',
    status: 'Upcoming',
    price_text: '£15.00',
    is_featured: 0,
    flyer_image: '/images/vital_fest_crowd_1790112387611.jpg',
  });

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      venue: '',
      location: 'London, UK',
      event_date: new Date().toISOString().split('T')[0],
      start_time: '20:00 - 03:00',
      lineup: 'DJ Ital, Special Guests',
      ticket_url: 'https://djital.me/vitalfest',
      status: 'Upcoming',
      price_text: '£18.00',
      is_featured: 0,
      flyer_image: '/images/vital_fest_crowd_1790112387611.jpg',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (evt: EventData) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      venue: evt.venue,
      location: evt.location,
      event_date: evt.event_date,
      start_time: evt.start_time || '',
      lineup: evt.lineup || '',
      ticket_url: evt.ticket_url || '',
      status: evt.status || 'Upcoming',
      price_text: evt.price_text || '',
      is_featured: evt.is_featured,
      flyer_image: evt.flyer_image || '/images/vital_fest_crowd_1790112387611.jpg',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        showSuccess('Event Updated Successfully', `"${formData.title}" was saved.`);
      } else {
        await createEvent(formData);
        showSuccess('New Event Created Successfully', `"${formData.title}" was added to the calendar.`);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.error('Failed to save event:', err);
      showError('Failed to Save Event', err?.message || 'A database error occurred.');
    }
  };

  const confirmDelete = async () => {
    if (deleteCandidateId !== null) {
      try {
        await deleteEvent(deleteCandidateId);
        showSuccess('Event Deleted', 'The event was successfully removed from SQLite.');
        setDeleteCandidateId(null);
        onRefresh();
      } catch (err: any) {
        console.error('Failed to delete event:', err);
        showError('Failed to Delete Event', err?.message || 'A database error occurred.');
      }
    }
  };

  const handleDelete = (id: number) => {
    setDeleteCandidateId(id);
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">Vital Fest & Event Manager</h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Create, update, or remove live shows and festival dates in the SQLite database.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Event</span>
        </button>
      </div>

      {/* Events List (Responsive Cards for mobile & tablet) */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="p-8 text-center border border-neutral-200 dark:border-white/10 rounded bg-white dark:bg-transparent text-neutral-500 dark:text-neutral-400 text-sm">
            No events found. Click "Add New Event" to create one.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="p-4 sm:p-5 rounded border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{evt.event_date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{evt.start_time || 'TBA'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-neutral-800 dark:text-neutral-300 font-medium">{evt.status}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-neutral-600 dark:text-neutral-400">{evt.price_text}</span>
                </div>

                <h4 className="text-base sm:text-lg font-display font-bold text-neutral-950 dark:text-white truncate">
                  {evt.title}
                </h4>

                <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                  <span>{evt.venue}</span>
                  <span className="text-neutral-400 dark:text-neutral-500">/</span>
                  <span className="text-neutral-500 dark:text-neutral-400">{evt.location}</span>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xl">
                  <span className="text-neutral-400 dark:text-neutral-500">Lineup: </span>
                  {evt.lineup}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-white/5">
                <button
                  onClick={() => openEditModal(evt)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(evt.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded border border-neutral-200 dark:border-white/15 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-white/10">
              <h4 className="text-lg font-display font-bold">
                {editingEvent ? 'Edit Event in SQLite' : 'Add New Event to SQLite'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Vital Fest: Hackney All-Dayer"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Venue *</label>
                  <input
                    type="text"
                    required
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="e.g. The Hackney Social"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Location City / Area *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Hackney, London E8"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Time Window</label>
                  <input
                    type="text"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    placeholder="e.g. 15:00 - 23:00"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Price Text</label>
                  <input
                    type="text"
                    value={formData.price_text}
                    onChange={(e) => setFormData({ ...formData, price_text: e.target.value })}
                    placeholder="e.g. £17.50 Adv"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Lineup Artists</label>
                <input
                  type="text"
                  value={formData.lineup}
                  onChange={(e) => setFormData({ ...formData, lineup: e.target.value })}
                  placeholder="e.g. DJ Ital, Brockie, Ragga Twins, Jumpin Jack Frost, Det"
                  className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Sold Out">Sold Out</option>
                    <option value="Past">Past</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Ticket Link</label>
                  <input
                    type="text"
                    value={formData.ticket_url}
                    onChange={(e) => setFormData({ ...formData, ticket_url: e.target.value })}
                    placeholder="https://djital.me/vitalfest"
                    className="w-full px-3.5 py-2.5 rounded bg-neutral-50 border border-neutral-300 text-neutral-900 dark:bg-neutral-950 dark:border-white/10 dark:text-white focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Event Flyer Image Space */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-300 uppercase">
                  Event Flyer Artwork (Displayed on Show Card)
                </label>
                <ImageInput
                  value={formData.flyer_image}
                  onChange={(newUrl) => setFormData({ ...formData, flyer_image: newUrl })}
                  defaultUrl="/images/vital_fest_crowd_1790112387611.jpg"
                  aspectRatio="landscape"
                  helperText="Upload or enter URL for high-res show flyer image."
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteCandidateId !== null}
        title="Confirm Event Deletion"
        message="Are you sure you want to permanently remove this show from the SQLite database? This cannot be undone."
        confirmLabel="Delete Event"
        cancelLabel="Keep Event"
        isDestructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteCandidateId(null)}
      />
    </div>
  );
};
