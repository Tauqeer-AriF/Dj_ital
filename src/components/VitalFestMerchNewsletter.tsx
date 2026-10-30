import React, { useState } from 'react';
import { ShoppingBag, Mail, Send, CheckCircle, ArrowUpRight } from 'lucide-react';
import { addNewsletterSubscriber, ProfileData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';
import { useToast } from '../context/ToastContext';

interface VitalFestMerchNewsletterProps {
  profile: ProfileData | null;
}

export const VitalFestMerchNewsletter: React.FC<VitalFestMerchNewsletterProps> = ({ profile }) => {
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const shopifyUrl = profile?.shopify_merch_url || 'https://linktr.ee/vital.fest';
  const merchBadgeText = profile?.merch_badge_text || 'Official Vital Fest Merch & Vinyl Store';

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      showError('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addNewsletterSubscriber(email, 'Homepage Banner');
      setIsSubscribed(true);
      showSuccess('Subscribed!', 'You are now on the Vital Fest guestlist for upcoming show announcements.');
      setEmail('');
    } catch (err: any) {
      const msg = 'Subscription failed. Please try again.';
      setErrorMsg(msg);
      showError('Subscription Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="merch-newsletter" className="py-24 md:py-32 lg:py-36 border-t border-neutral-200 dark:border-white/10 relative transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card 1: Official Shopify Merch Portal */}
          <div className="lg:col-span-6">
            <ScrollReveal variant="fade-right">
              <div className="p-8 sm:p-10 rounded sound-cabinet shadow-2xl text-neutral-900 dark:text-white flex flex-col justify-between h-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-[90px] rounded-full pointer-events-none group-hover:bg-amber-400/20 transition-all" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-amber-600 dark:text-amber-400">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{merchBadgeText}</span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight leading-tight">
                    Vital Fest Featured
                  </h3>

                  <p className="text-sm text-neutral-700 dark:text-white/95 leading-relaxed max-w-md font-normal">
                    Visit our online store for branded clothing and accessories.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-industrial font-bold text-neutral-800 dark:text-white uppercase tracking-wider">
                    <span className="sound-tag">
                      Worldwide Shipping
                    </span>
                  </div>
                </div>

                <div className="pt-8 relative z-10">
                  <a
                    href={shopifyUrl}
                    className="hardware-btn inline-flex items-center gap-2.5 px-6 py-3.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-400/20 active:scale-98 cursor-pointer group/link hover:scale-102"
                  >
                    <span>Visit Shopify Merch Store</span>
                    <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Card 2: Exclusive VIP Newsletter Sign-up */}
          <div className="lg:col-span-6">
            <ScrollReveal variant="fade-left" delay={100}>
              <div className="p-8 sm:p-10 rounded sound-cabinet shadow-2xl text-neutral-900 dark:text-white flex flex-col justify-between h-full relative overflow-hidden">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-industrial font-black tracking-wider uppercase text-cyan-600 dark:text-cyan-300">
                    <Mail className="w-4 h-4" />
                    <span>[ SUBSCRIBER DISPATCH // DUB ALERT SYSTEM ]</span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight leading-tight">
                    Exclusive Ticket Alerts
                  </h3>

                  <p className="text-sm text-neutral-700 dark:text-white/95 leading-relaxed max-w-md font-normal">
                    Sign up with your email to be notified of event dates, Vital Fest early-bird presales, and secret line-up announcements.
                  </p>
                </div>

                <div className="pt-8">
                  {isSubscribed ? (
                    <div className="p-5 rounded sound-card border border-emerald-500/30 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="w-6 h-6 shrink-0" />
                      <div className="text-xs space-y-0.5">
                        <strong className="font-bold text-sm block text-neutral-950 dark:text-white font-industrial uppercase">Welcome to the Inner Sound System Circle</strong>
                        <span className="text-neutral-700 dark:text-white/90">You are on the priority list. Check your inbox for the archival dubplate stream link.</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email address..."
                          className="flex-1 px-4 py-3.5 rounded border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-neutral-500 dark:placeholder:text-white/50"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="hardware-btn px-6 py-3.5 rounded bg-amber-400 hover:bg-amber-300 text-neutral-950 font-industrial font-black text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <span>Subscribing...</span>
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                      {errorMsg && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-industrial font-bold uppercase">{errorMsg}</p>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
};
