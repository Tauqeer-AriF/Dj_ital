import React, { useState } from 'react';
import {
  Mail,
  Send,
  CheckCircle,
  MapPin,
  Building2,
  Sliders,
  Disc,
  Sparkles,
  Speaker,
  ArrowUpRight,
  MessageCircle,
  Clock,
  Phone,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { createBooking, ProfileData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { useToast } from '../context/ToastContext';

interface BookingFormSectionProps {
  profile: ProfileData | null;
  onBookingSubmitted?: () => void;
  onOpenEpk?: () => void;
}

export const BookingFormSection: React.FC<BookingFormSectionProps> = ({
  profile,
  onBookingSubmitted,
  onOpenEpk,
}) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: 'Festival booking',
    target_date: '',
    venue_city: '',
    set_length: '90 min',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const bookingTypes = [
    'Dj booking',
    'Festival booking',
    'Vital fest booking',
    'Panalist booking',
  ];

  const handleSelectBookingType = (eventType: string) => {
    setFormData((prev) => ({
      ...prev,
      event_type: eventType,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_email) return;

    setIsSubmitting(true);
    try {
      await createBooking(formData);
      setSubmittedSuccess(true);
      showSuccess('Booking Enquiry Sent', 'Thank you! Your booking enquiry has been recorded.');
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        event_type: 'Festival booking',
        target_date: '',
        venue_city: '',
        set_length: '90 min',
        message: '',
      });
      if (onBookingSubmitted) onBookingSubmitted();
    } catch (err: any) {
      console.error('Booking failed:', err);
      showError('Booking Submission Failed', err?.message || 'Could not save enquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // The active contact email directly reflects dashboard edits
  const directEmail = profile?.direct_email || profile?.booking_email || 'djital.booking@gmail.com';
  const agencyEmail = profile?.booking_email || profile?.direct_email || 'djital.booking@gmail.com';
  const rawWhatsApp = profile?.whatsapp_number || '+44 7900 123456';
  const cleanWhatsApp = rawWhatsApp.replace(/[^0-9+]/g, '');
  const defaultWhatsAppText = encodeURIComponent(
    profile?.whatsapp_message || 'Hi DJ Ital, I would like to enquire about booking you for an event.'
  );

  return (
    <section id="booking" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Quick Contact & Agency Representation */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal variant="fade-right">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-neutral-800 dark:text-white">
                  <span className="text-amber-600 dark:text-amber-400 font-black">[ WORLDWIDE BOOKINGS // SOUND SYSTEM TRANSMISSION ]</span>
                  <span aria-hidden="true" className="opacity-60">·</span>
                  <span>DIRECT ENQUIRY</span>
                </div>
                <h2 className="text-3xl xs:text-4xl sm:text-5xl font-display font-black text-neutral-950 dark:text-white tracking-tight uppercase leading-tight sm:leading-[0.95] break-words">
                  Direct Booking & Enquiries
                </h2>
                <p className="text-neutral-700 dark:text-white/90 text-sm sm:text-base leading-relaxed font-normal">
                  Available worldwide for festival headline stages, authentic vinyl dubplate heritage sessions, and Vital Fest club takeovers.
                </p>
              </div>
            </ScrollReveal>

            {/* Quick Contact Help Buttons */}
            <ScrollReveal variant="fade-up" delay={100}>
              <div className="p-6 sm:p-7 rounded sound-cabinet space-y-4 shadow-xl text-neutral-900 dark:text-white relative overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-industrial font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <HelpCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Immediate Promoter Help & Quick Chat</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp Quick Help Button */}
                  <a
                    href={`https://wa.me/${cleanWhatsApp}?text=${defaultWhatsAppText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hardware-btn flex items-center justify-center gap-2 px-4 py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-industrial font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>WhatsApp Help</span>
                  </a>

                  {/* Direct Email Button */}
                  <a
                    href={`mailto:${directEmail}?subject=DJ%20Ital%20Booking%20Enquiry`}
                    className="hardware-btn flex items-center justify-center gap-2 px-4 py-3 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-amber-400 hover:text-neutral-950 font-industrial font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Direct Email</span>
                  </a>
                </div>

                <div className="text-[11px] font-industrial text-neutral-600 dark:text-white/80 flex items-center justify-between font-bold uppercase tracking-wider pt-1 border-t border-neutral-200 dark:border-white/10">
                  <span>WhatsApp: {rawWhatsApp}</span>
                  <span>Email: {directEmail}</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Official Agency Card */}
            <ScrollReveal variant="fade-up" delay={150}>
              <div className="p-6 sm:p-7 rounded sound-cabinet shadow-xl text-neutral-900 dark:text-white space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded bg-amber-400 text-neutral-950 flex items-center justify-center font-bold shadow-md">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-industrial text-neutral-500 dark:text-white/80 font-bold uppercase tracking-wider">
                        Exclusive Representation
                      </div>
                      <div className="text-lg font-display font-black text-neutral-950 dark:text-white">
                        {profile?.booking_agency || 'IP1 Agency London'}
                      </div>
                    </div>
                  </div>

                  {onOpenEpk && (
                    <button
                      type="button"
                      onClick={onOpenEpk}
                      className="hardware-btn px-3 py-1.5 rounded border border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-400 hover:text-neutral-950 text-xs font-industrial font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      EPK Rider
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-white/10 space-y-2 text-xs text-neutral-800 dark:text-white font-industrial font-bold tracking-wider uppercase">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    <a
                      href={`mailto:${agencyEmail}`}
                      className="hover:text-amber-600 dark:hover:text-amber-300 transition-colors text-neutral-900 dark:text-white"
                    >
                      Agency: {agencyEmail}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                    <span className="text-neutral-700 dark:text-white">{profile?.origin || 'Hackney, East London, United Kingdom'}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400 shrink-0" />
                    <span className="text-neutral-700 dark:text-white">Coverage: {profile?.regions_covered || 'UK, Europe & International / Worldwide'}</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Simple Form Fields */}
          <div className="lg:col-span-7">
            <ScrollReveal variant="fade-left" delay={100}>
              <div className="p-6 sm:p-8 md:p-9 rounded sound-cabinet shadow-2xl text-neutral-900 dark:text-white relative overflow-hidden">
                
                {/* Preset Package / Set Format Dropdown */}
                <div className="mb-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-industrial font-black text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      <span>Curated Package / Set Format:</span>
                    </label>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-white/60 hidden sm:inline">
                      Select a booking type
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={formData.event_type}
                      onChange={(e) => {
                        handleSelectBookingType(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-industrial font-bold cursor-pointer shadow-sm"
                    >
                      {bookingTypes.map((bookingType) => (
                        <option key={bookingType} value={bookingType}>
                          {bookingType}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {submittedSuccess ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle className="w-9 h-9" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-display font-black text-neutral-950 dark:text-white">
                      Enquiry Received
                    </h3>
                    <p className="text-sm text-neutral-700 dark:text-white/90 max-w-md mx-auto leading-relaxed">
                      Your booking enquiry has been received and forwarded directly to {profile?.booking_agency || 'IP1 Agency London'}. We typically respond via email or WhatsApp within 24 hours.
                    </p>
                    <button
                      onClick={() => setSubmittedSuccess(false)}
                      className="hardware-btn px-6 py-3 rounded bg-amber-400 text-neutral-950 hover:bg-amber-300 text-xs font-industrial font-black uppercase tracking-wider transition-all cursor-pointer shadow-md"
                    >
                      Submit Another Enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Date & Location/Venue */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Event Date *</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.target_date}
                          onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Location / Venue *</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Fabric, London or Motion, Bristol"
                          value={formData.venue_city}
                          onChange={(e) => setFormData({ ...formData, venue_city: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Set length */}
                    <div className="space-y-1.5 max-w-sm">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Set Length</span>
                        </label>
                        <select
                          value={formData.set_length}
                          onChange={(e) => setFormData({ ...formData, set_length: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all font-industrial font-bold cursor-pointer"
                        >
                          <option value="60 min">60 min</option>
                          <option value="90 min">90 min</option>
                          <option value="2 hours">2 hours</option>
                          <option value="3+ hours">3+ hours (All-Nighter / Takeover)</option>
                        </select>
                    </div>

                    {/* Row 3: Contact Details (Name, Email, Phone/WhatsApp) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          Promoter / Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Marcus Vance"
                          value={formData.client_name}
                          onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="promoter@events.com"
                          value={formData.client_email}
                          onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Phone / WhatsApp</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="+44 7..."
                          value={formData.client_phone}
                          onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                          className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                        />
                      </div>
                    </div>

                    {/* Row 4: Additional Sound System Specifications or Notes */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-industrial font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                        Sound System Specifications & Context
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Share any additional event or technical details..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="hardware-btn w-full py-4 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial font-black text-sm uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-400/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span className="font-industrial font-bold uppercase">Submitting Enquiry...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Direct Booking Enquiry</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

              </div>
            </ScrollReveal>
          </div>

        </div>

      </div>
    </section>
  );
};
