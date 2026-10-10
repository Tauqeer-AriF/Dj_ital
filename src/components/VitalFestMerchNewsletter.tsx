import React, { useState } from 'react';
import { ShoppingBag, Mail, Send, CheckCircle, ArrowUpRight } from 'lucide-react';
import { addNewsletterSubscriber, ProfileData } from '../db/sqlite';
import { ScrollReveal } from './ScrollReveal';

interface VitalFestMerchNewsletterProps {
  profile: ProfileData | null;
}

export const VitalFestMerchNewsletter: React.FC<VitalFestMerchNewsletterProps> = ({ profile }) => {
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
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addNewsletterSubscriber(email, 'Homepage Banner');
      setIsSubscribed(true);
      setEmail('');
    } catch (err: any) {
      setErrorMsg('Subscription failed. Please try again.');
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
              <div className="p-8 sm:p-10 rounded-3xl glass-panel hover-glass-sheen shadow-2xl text-neutral-900 dark:text-white flex flex-col justify-between h-full relative overflow-hidden group before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-amber-400/40 before:to-transparent">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-[90px] rounded-full pointer-events-none group-hover:bg-amber-400/20 transition-all" />

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-amber-600 dark:text-amber-400 font-bold">
                    <ShoppingBag className="w-4 h-4" />
                    <span>{merchBadgeText}</span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight leading-tight">
                    Vital Fest Apparel & Limited Dubplates
                  </h3>

                  <p className="text-sm text-neutral-700 dark:text-white/95 leading-relaxed max-w-md font-normal">
                    Official heavyweight hoodies, vintage Hackney sound clash t-shirts, Technics slipmats, and limited 10" vinyl releases directly dispatched from East London.
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono font-bold text-neutral-800 dark:text-white">
                    <span className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/15">
                      100% Organic Heavy Cotton
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/15">
                      Worldwide Shipping
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/15">
                      Limited Dubplate Pressings
                    </span>
                  </div>
                </div>

                <div className="pt-8 relative z-10">
                  <a
                    href={shopifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover-shimmer inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-extrabold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-400/20 active:scale-98 cursor-pointer group/link hover:scale-102"
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
              <div className="p-8 sm:p-10 rounded-3xl glass-panel hover-glass-sheen shadow-2xl text-neutral-900 dark:text-white flex flex-col justify-between h-full relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/50 dark:before:via-cyan-400/40 before:to-transparent">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-cyan-600 dark:text-cyan-300 font-bold">
                    <Mail className="w-4 h-4" />
                    <span>07 / SUBSCRIBER DISPATCH</span>
                  </div>

                  <h3 className="text-3xl sm:text-4xl font-display font-black text-neutral-950 dark:text-white uppercase tracking-tight leading-tight">
                    Exclusive Mixes & Ticket Alerts
                  </h3>

                  <p className="text-sm text-neutral-700 dark:text-white/95 leading-relaxed max-w-md font-normal">
                    Sign up with your email to be notified of event dates, unreleased 90s pirate radio tape archives, Vital Fest early-bird presales, and secret lineup announcements.
                  </p>
                </div>

                <div className="pt-8">
                  {isSubscribed ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="w-6 h-6 shrink-0" />
                      <div className="text-xs space-y-0.5">
                        <strong className="font-bold text-sm block text-neutral-950 dark:text-white">Welcome to the Inner Sound System Circle</strong>
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
                          className="flex-1 px-4 py-3.5 rounded-xl border border-neutral-300 dark:border-white/20 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-neutral-500 dark:placeholder:text-white/50"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-mono text-xs font-bold transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-400/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <span>Subscribing...</span>
                          ) : (
                            <>
                              <span>Subscribe</span>
                              <Send className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      {errorMsg && (
                        <p className="text-xs text-red-500 dark:text-red-400 font-mono">{errorMsg}</p>
                      )}

                      <p className="text-[11px] font-mono text-neutral-500 dark:text-white/70">
                        Zero spam. Strictly unreleased foundation dubs and Vital Fest tickets.
                      </p>
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
