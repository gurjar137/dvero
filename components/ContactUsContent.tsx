'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ContactSettings } from '@/lib/types';

const DEFAULT_SETTINGS: ContactSettings = {
  brand_name: "D'VERO",
  email: 'hello@dvero.in',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: 'Jaipur, Rajasthan, India',
  google_maps_url: 'https://maps.google.com',
  hours_monday: '10:00 AM – 7:00 PM',
  hours_tuesday: '10:00 AM – 7:00 PM',
  hours_wednesday: '10:00 AM – 7:00 PM',
  hours_thursday: '10:00 AM – 7:00 PM',
  hours_friday: '10:00 AM – 7:00 PM',
  hours_saturday: '10:00 AM – 5:00 PM',
  hours_sunday: 'Closed',
  instagram_url: 'https://instagram.com/dvero.in',
  facebook_url: 'https://facebook.com/dvero.in',
  youtube_url: 'https://youtube.com/@dvero.official',
  page_heading: 'Get in Touch',
  page_description: 'Have a question about your order or D’VERO? We’re here to help.',
};

export function ContactUsContent({ showHeader = true }: { showHeader?: boolean }) {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Check local cache first for zero-latency render
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_contact_settings_cache');
        if (cached) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(cached) });
          } catch (e) {}
        }
      }

      // 2. Fetch from primary settings table (key = 'contact_settings')
      const { data: settingsRow } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'contact_settings')
        .maybeSingle();

      let data = settingsRow?.value;

      // 3. Fallback to contact_settings table if available
      if (!data) {
        const { data: tableData } = await supabase
          .from('contact_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (tableData) data = tableData;
      }

      if (data) {
        const merged: ContactSettings = {
          brand_name: data.brand_name || DEFAULT_SETTINGS.brand_name,
          email: data.email || DEFAULT_SETTINGS.email,
          phone: data.phone || DEFAULT_SETTINGS.phone,
          whatsapp: data.whatsapp || DEFAULT_SETTINGS.whatsapp,
          address: data.address || DEFAULT_SETTINGS.address,
          google_maps_url: data.google_maps_url || DEFAULT_SETTINGS.google_maps_url,
          hours_monday: data.hours_monday || DEFAULT_SETTINGS.hours_monday,
          hours_tuesday: data.hours_tuesday || DEFAULT_SETTINGS.hours_tuesday,
          hours_wednesday: data.hours_wednesday || DEFAULT_SETTINGS.hours_wednesday,
          hours_thursday: data.hours_thursday || DEFAULT_SETTINGS.hours_thursday,
          hours_friday: data.hours_friday || DEFAULT_SETTINGS.hours_friday,
          hours_saturday: data.hours_saturday || DEFAULT_SETTINGS.hours_saturday,
          hours_sunday: data.hours_sunday || DEFAULT_SETTINGS.hours_sunday,
          instagram_url: data.instagram_url || DEFAULT_SETTINGS.instagram_url,
          facebook_url: data.facebook_url || DEFAULT_SETTINGS.facebook_url,
          youtube_url: data.youtube_url || DEFAULT_SETTINGS.youtube_url,
          page_heading: data.page_heading || DEFAULT_SETTINGS.page_heading,
          page_description: data.page_description || DEFAULT_SETTINGS.page_description,
        };
        setSettings(merged);
        if (typeof window !== 'undefined') {
          localStorage.setItem('dvero_contact_settings_cache', JSON.stringify(merged));
        }
      }
    } catch (e) {
      console.warn('Using fallback contact settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    const handleSync = () => fetchSettings();
    window.addEventListener('dvero_settings_updated', handleSync);
    return () => window.removeEventListener('dvero_settings_updated', handleSync);
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMessage) {
      setFeedback({ type: 'error', message: 'Please complete all required fields.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setSubmitting(true);

    try {
      let { error } = await supabase.from('contact_messages').insert([
        {
          name: cleanName,
          email: cleanEmail,
          subject: cleanSubject,
          message: cleanMessage,
          status: 'new',
        },
      ]);

      if (error && (error.message?.includes('status') || error.code === 'PGRST204')) {
        const fallbackRes = await supabase.from('contact_messages').insert([
          {
            name: cleanName,
            email: cleanEmail,
            subject: cleanSubject,
            message: cleanMessage,
          },
        ]);
        error = fallbackRes.error;
      }

      if (error) throw error;

      setFeedback({
        type: 'success',
        message: 'Thank you. Your message has been sent successfully. Our atelier team will get back to you shortly.',
      });
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setFeedback({
        type: 'error',
        message: err?.message || 'Could not send your message. Please try again or reach out directly via email.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWhatsappNumber = (settings.whatsapp || '').replace(/[^0-9+]/g, '');

  const hoursList = [
    { day: 'Monday', time: settings.hours_monday },
    { day: 'Tuesday', time: settings.hours_tuesday },
    { day: 'Wednesday', time: settings.hours_wednesday },
    { day: 'Thursday', time: settings.hours_thursday },
    { day: 'Friday', time: settings.hours_friday },
    { day: 'Saturday', time: settings.hours_saturday },
    { day: 'Sunday', time: settings.hours_sunday },
  ];

  if (loading) {
    return (
      <div className="space-y-10 animate-pulse">
        {showHeader && (
          <div className="border-b border-line pb-6 space-y-3">
            <div className="h-8 bg-[#EFECE6] rounded w-64"></div>
            <div className="h-4 bg-[#EFECE6] rounded w-96 max-w-full"></div>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-panel border border-line rounded-lg p-6 h-64 bg-[#F7F5F0]"></div>
            <div className="bg-panel border border-line rounded-lg p-6 h-48 bg-[#F7F5F0]"></div>
          </div>
          <div className="lg:col-span-7">
            <div className="bg-panel border border-line rounded-lg p-6 sm:p-8 h-96 bg-[#F7F5F0]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      {showHeader && (
        <div className="border-b border-line pb-6">
          <h2 className="font-oswald text-2xl sm:text-3xl uppercase tracking-wide text-ink">
            {settings.page_heading}
          </h2>
          <p className="text-mute text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed font-inter">
            {settings.page_description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Contact Information & Details Column */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Contact Card */}
          <div className="bg-panel border border-line rounded-lg p-6 sm:p-7 shadow-sm2 space-y-5">
            <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-3">
              Direct Channels
            </h3>

            <div className="space-y-4 font-inter text-xs">
              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-bg border border-line flex items-center justify-center text-ink shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Email Address</div>
                  <a href={`mailto:${settings.email}`} className="text-ink font-medium hover:text-camelDeep transition-colors block mt-0.5">
                    {settings.email}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-bg border border-line flex items-center justify-center text-ink shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Client Support Phone</div>
                  <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="text-ink font-mono font-medium hover:text-camelDeep transition-colors block mt-0.5">
                    {settings.phone}
                  </a>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-bg border border-line flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">WhatsApp Concierge</div>
                  <a
                    href={`https://wa.me/${cleanWhatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink font-mono font-medium hover:text-emerald-600 transition-colors block mt-0.5"
                  >
                    {settings.whatsapp}
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-bg border border-line flex items-center justify-center text-ink shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="font-oswald text-[0.68rem] uppercase text-mute tracking-wider">Atelier Address</div>
                  <div className="text-ink font-medium leading-relaxed mt-0.5">{settings.address}</div>
                  {settings.google_maps_url && (
                    <a
                      href={settings.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-oswald text-[0.68rem] uppercase tracking-wider text-camelDeep hover:underline mt-1.5"
                    >
                      <span>Open in Google Maps</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3 h-3">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours Card */}
          <div className="bg-panel border border-line rounded-lg p-6 sm:p-7 shadow-sm2 space-y-4">
            <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-3">
              Studio Operating Hours
            </h3>
            <div className="space-y-2 text-xs font-inter">
              {hoursList.map(h => (
                <div key={h.day} className="flex justify-between items-center py-1 border-b border-line/40 last:border-0">
                  <span className="font-oswald text-xs uppercase text-mute tracking-wide">{h.day}</span>
                  <span className={`font-mono text-[0.75rem] ${h.time.toLowerCase() === 'closed' ? 'text-red-500 font-medium' : 'text-ink'}`}>
                    {h.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-panel border border-line rounded-lg p-6 sm:p-7 shadow-sm2 space-y-4">
            <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-3">
              Social Presence
            </h3>
            <div className="flex flex-wrap gap-3">
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded bg-bg border border-line font-oswald text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-bg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </a>
              )}
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded bg-bg border border-line font-oswald text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-bg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span>Facebook</span>
                </a>
              )}
              {settings.youtube_url && (
                <a
                  href={settings.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded bg-bg border border-line font-oswald text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-bg transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Customer Contact Form Column */}
        <div className="lg:col-span-7">
          <div className="bg-panel border border-line rounded-lg p-6 sm:p-8 shadow-sm2 space-y-6">
            <div>
              <h3 className="font-oswald text-lg uppercase tracking-wider text-ink">
                Send Us A Message
              </h3>
              <p className="text-xs text-mute mt-1 font-inter">
                Please fill in the form below. We typically respond within 24 business hours.
              </p>
            </div>

            {feedback && (
              <div
                className={`p-4 rounded-md text-xs font-inter leading-relaxed ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-bg border border-line rounded px-3.5 py-3 text-xs text-ink outline-none focus:border-ink transition-colors font-inter"
                  />
                </div>

                <div>
                  <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-bg border border-line rounded px-3.5 py-3 text-xs text-ink outline-none focus:border-ink transition-colors font-inter"
                  />
                </div>
              </div>

              <div>
                <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1.5">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Order Inquiry / Sizing Question / Custom Tailoring"
                  className="w-full bg-bg border border-line rounded px-3.5 py-3 text-xs text-ink outline-none focus:border-ink transition-colors font-inter"
                />
              </div>

              <div>
                <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  className="w-full bg-bg border border-line rounded px-3.5 py-3 text-xs text-ink outline-none focus:border-ink transition-colors font-inter resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto bg-ink text-bg px-8 py-3.5 rounded font-oswald text-xs uppercase tracking-widest hover:bg-camelDeep disabled:opacity-60 transition-colors min-h-[44px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <span>Send Message</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
