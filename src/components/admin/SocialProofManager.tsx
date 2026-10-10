import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Quote,
  Star,
  Building2,
  X,
  Check,
} from 'lucide-react';
import {
  TestimonialData,
  VenueLogoData,
  getTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getVenueLogos,
  createVenueLogo,
  updateVenueLogo,
  deleteVenueLogo,
} from '../../db/sqlite';
import { ConfirmModal } from './ConfirmModal';
import { ImageInput } from './ImageInput';

interface SocialProofManagerProps {
  onRefresh: () => void;
}

export const SocialProofManager: React.FC<SocialProofManagerProps> = ({ onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'testimonials' | 'venues'>('testimonials');
  const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
  const [venues, setVenues] = useState<VenueLogoData[]>([]);

  // Testimonial Modal
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialData | null>(null);
  const [deleteCandidateTestimonialId, setDeleteCandidateTestimonialId] = useState<number | null>(null);
  const [testimonialFormData, setTestimonialFormData] = useState({
    quote: '',
    author_name: '',
    role_venue: '',
    avatar_url: '',
    rating: 5,
    order_index: 0,
  });

  // Venue Modal
  const [isVenueModalOpen, setIsVenueModalOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<VenueLogoData | null>(null);
  const [deleteCandidateVenueId, setDeleteCandidateVenueId] = useState<number | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    location: '',
    logo_text: '',
    order_index: 0,
  });

  const loadData = async () => {
    const [t, v] = await Promise.all([getTestimonials(), getVenueLogos()]);
    setTestimonials(t);
    setVenues(v);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Testimonials
  const openCreateTestimonial = () => {
    setEditingTestimonial(null);
    setTestimonialFormData({
      quote: '',
      author_name: '',
      role_venue: '',
      avatar_url: '',
      rating: 5,
      order_index: testimonials.length + 1,
    });
    setIsTestimonialModalOpen(true);
  };

  const openEditTestimonial = (t: TestimonialData) => {
    setEditingTestimonial(t);
    setTestimonialFormData({
      quote: t.quote,
      author_name: t.author_name,
      role_venue: t.role_venue,
      avatar_url: t.avatar_url || '',
      rating: t.rating || 5,
      order_index: t.order_index,
    });
    setIsTestimonialModalOpen(true);
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTestimonial) {
      await updateTestimonial(editingTestimonial.id, testimonialFormData);
    } else {
      await createTestimonial(testimonialFormData);
    }
    setIsTestimonialModalOpen(false);
    await loadData();
    onRefresh();
  };

  const confirmDeleteTestimonial = async () => {
    if (deleteCandidateTestimonialId !== null) {
      await deleteTestimonial(deleteCandidateTestimonialId);
      setDeleteCandidateTestimonialId(null);
      await loadData();
      onRefresh();
    }
  };

  // Handlers for Venues
  const openCreateVenue = () => {
    setEditingVenue(null);
    setVenueFormData({
      name: '',
      location: 'London, UK',
      logo_text: '',
      order_index: venues.length + 1,
    });
    setIsVenueModalOpen(true);
  };

  const openEditVenue = (v: VenueLogoData) => {
    setEditingVenue(v);
    setVenueFormData({
      name: v.name,
      location: v.location || '',
      logo_text: v.logo_text || v.name,
      order_index: v.order_index,
    });
    setIsVenueModalOpen(true);
  };

  const handleVenueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVenue) {
      await updateVenueLogo(editingVenue.id, venueFormData);
    } else {
      await createVenueLogo(venueFormData);
    }
    setIsVenueModalOpen(false);
    await loadData();
    onRefresh();
  };

  const confirmDeleteVenue = async () => {
    if (deleteCandidateVenueId !== null) {
      await deleteVenueLogo(deleteCandidateVenueId);
      setDeleteCandidateVenueId(null);
      await loadData();
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-900/70 backdrop-blur-xl">
        <div>
          <h3 className="text-xl font-display font-bold text-neutral-950 dark:text-white">
            Social Proof, Testimonials & Venue Badges
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
            Manage promoter quotes, museum accreditations, and top spots played.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'testimonials' ? (
            <button
              onClick={openCreateTestimonial}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Testimonial</span>
            </button>
          ) : (
            <button
              onClick={openCreateVenue}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Venue Badge</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'testimonials'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <Quote className="w-3.5 h-3.5" />
          <span>Promoter & Venue Quotes ({testimonials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('venues')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            activeTab === 'venues'
              ? 'bg-amber-400 text-neutral-950 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Top Spots Played ({venues.length})</span>
        </button>
      </div>

      {/* Testimonials List */}
      {activeTab === 'testimonials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="pt-2 border-t border-neutral-100 dark:border-white/10 text-xs">
                  <div className="font-bold text-neutral-900 dark:text-white">{t.author_name}</div>
                  <div className="text-[11px] font-mono text-neutral-500">{t.role_venue}</div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => openEditTestimonial(t)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteCandidateTestimonialId(t.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Venues List */}
      {activeTab === 'venues' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v) => (
            <div
              key={v.id}
              className="p-4 rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900/60 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="font-display font-bold text-sm text-neutral-900 dark:text-white">
                  {v.name}
                </h4>
                <div className="text-[11px] font-mono text-neutral-500">{v.location}</div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditVenue(v)}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteCandidateVenueId(v.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Testimonial Edit/Create Modal */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
              <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                {editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
              </h4>
              <button
                onClick={() => setIsTestimonialModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Quote
                </label>
                <textarea
                  rows={3}
                  required
                  value={testimonialFormData.quote}
                  onChange={(e) => setTestimonialFormData({ ...testimonialFormData, quote: e.target.value })}
                  placeholder="The feedback or review from the promoter..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Author / Promoter Name
                  </label>
                  <input
                    type="text"
                    required
                    value={testimonialFormData.author_name}
                    onChange={(e) =>
                      setTestimonialFormData({ ...testimonialFormData, author_name: e.target.value })
                    }
                    placeholder="Marcus Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                    Role & Venue / Event
                  </label>
                  <input
                    type="text"
                    required
                    value={testimonialFormData.role_venue}
                    onChange={(e) =>
                      setTestimonialFormData({ ...testimonialFormData, role_venue: e.target.value })
                    }
                    placeholder="Head of Programming, The Hackney Social"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <ImageInput
                  value={testimonialFormData.avatar_url || ''}
                  onChange={(newUrl) =>
                    setTestimonialFormData((prev) => ({ ...prev, avatar_url: newUrl }))
                  }
                  label="Author Avatar / Photo (Optional)"
                  aspectRatio="square"
                  helperText="Upload or pick from Media Library, Presets, or enter URL."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-neutral-950 font-mono text-xs font-bold"
                >
                  Save Testimonial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Venue Edit/Create Modal */}
      {isVenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-white/10">
              <h4 className="font-display font-bold text-base text-neutral-900 dark:text-white">
                {editingVenue ? 'Edit Venue Badge' : 'Add New Venue Badge'}
              </h4>
              <button
                onClick={() => setIsVenueModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVenueSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Spot / Venue Name
                </label>
                <input
                  type="text"
                  required
                  value={venueFormData.name}
                  onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                  placeholder="e.g. Fabric London"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-neutral-600 dark:text-neutral-300 uppercase">
                  Location
                </label>
                <input
                  type="text"
                  value={venueFormData.location}
                  onChange={(e) => setVenueFormData({ ...venueFormData, location: e.target.value })}
                  placeholder="Farringdon, London"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVenueModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 text-neutral-950 font-mono text-xs font-bold"
                >
                  Save Spot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <ConfirmModal
        isOpen={deleteCandidateTestimonialId !== null}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial from the database?"
        confirmLabel="Delete"
        onConfirm={confirmDeleteTestimonial}
        onCancel={() => setDeleteCandidateTestimonialId(null)}
      />

      <ConfirmModal
        isOpen={deleteCandidateVenueId !== null}
        title="Delete Venue Badge"
        message="Are you sure you want to delete this venue spot badge?"
        confirmLabel="Delete"
        onConfirm={confirmDeleteVenue}
        onCancel={() => setDeleteCandidateVenueId(null)}
      />
    </div>
  );
};
