'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';
import { ContactSettings } from '@/lib/types';

const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
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

export default function AdminSettingsPage() {
  const { settings, loadSettings } = useAdminData();
  const showToast = useToast();
  const [activeTab, setActiveTab] = useState<'storefront' | 'contact'>('storefront');

  // Contact Settings Form State
  const [contactSettings, setContactSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);
  const [contactLoading, setContactLoading] = useState(true);
  const [savingContact, setSavingContact] = useState(false);

  const loadContactSettings = useCallback(async () => {
    setContactLoading(true);
    try {
      // 1. Check settings table first (key = 'contact_settings')
      const { data: settingsRow } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'contact_settings')
        .maybeSingle();

      let contactObj = settingsRow?.value;

      // 2. Check contact_settings table fallback if available
      if (!contactObj) {
        const { data: contactData } = await supabase
          .from('contact_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (contactData) {
          contactObj = contactData;
        }
      }

      setContactSettings({
        brand_name: contactObj?.brand_name || DEFAULT_CONTACT_SETTINGS.brand_name,
        email: contactObj?.email || DEFAULT_CONTACT_SETTINGS.email,
        phone: contactObj?.phone || DEFAULT_CONTACT_SETTINGS.phone,
        whatsapp: contactObj?.whatsapp || DEFAULT_CONTACT_SETTINGS.whatsapp,
        address: contactObj?.address || DEFAULT_CONTACT_SETTINGS.address,
        google_maps_url: contactObj?.google_maps_url || DEFAULT_CONTACT_SETTINGS.google_maps_url,
        hours_monday: contactObj?.hours_monday || DEFAULT_CONTACT_SETTINGS.hours_monday,
        hours_tuesday: contactObj?.hours_tuesday || DEFAULT_CONTACT_SETTINGS.hours_tuesday,
        hours_wednesday: contactObj?.hours_wednesday || DEFAULT_CONTACT_SETTINGS.hours_wednesday,
        hours_thursday: contactObj?.hours_thursday || DEFAULT_CONTACT_SETTINGS.hours_thursday,
        hours_friday: contactObj?.hours_friday || DEFAULT_CONTACT_SETTINGS.hours_friday,
        hours_saturday: contactObj?.hours_saturday || DEFAULT_CONTACT_SETTINGS.hours_saturday,
        hours_sunday: contactObj?.hours_sunday || DEFAULT_CONTACT_SETTINGS.hours_sunday,
        instagram_url: contactObj?.instagram_url || DEFAULT_CONTACT_SETTINGS.instagram_url,
        facebook_url: contactObj?.facebook_url || DEFAULT_CONTACT_SETTINGS.facebook_url,
        youtube_url: contactObj?.youtube_url || DEFAULT_CONTACT_SETTINGS.youtube_url,
        page_heading: contactObj?.page_heading || DEFAULT_CONTACT_SETTINGS.page_heading,
        page_description: contactObj?.page_description || DEFAULT_CONTACT_SETTINGS.page_description,
      });
    } catch (e) {
      console.error('Error loading contact settings:', e);
    } finally {
      setContactLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContactSettings();
  }, [loadContactSettings]);

  async function saveStorefrontSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updates = [
      { key: 'free_shipping_threshold', value: Number(fd.get('free_shipping_threshold')) },
      { key: 'flat_shipping_rate', value: Number(fd.get('flat_shipping_rate')) },
      { key: 'announcement_text', value: fd.get('announcement_text') },
      { key: 'return_window_days', value: Number(fd.get('return_window_days')) },
    ];
    try {
      for (const u of updates) {
        const { error } = await supabase.from('settings').upsert({ key: u.key, value: u.value });
        if (error) throw error;
      }
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        updates.forEach(u => {
          parsed[u.key] = u.value;
        });
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }
      showToast('Storefront settings saved — live on the website now');
      loadSettings();
    } catch (err: any) {
      showToast('Could not save settings: ' + (err.message || ''));
    }
  }

  async function saveContactSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingContact(true);
    const fd = new FormData(e.currentTarget);

    const payload: ContactSettings = {
      brand_name: (fd.get('brand_name') as string) || DEFAULT_CONTACT_SETTINGS.brand_name,
      email: (fd.get('email') as string) || DEFAULT_CONTACT_SETTINGS.email,
      phone: (fd.get('phone') as string) || DEFAULT_CONTACT_SETTINGS.phone,
      whatsapp: (fd.get('whatsapp') as string) || DEFAULT_CONTACT_SETTINGS.whatsapp,
      address: (fd.get('address') as string) || DEFAULT_CONTACT_SETTINGS.address,
      google_maps_url: (fd.get('google_maps_url') as string) || DEFAULT_CONTACT_SETTINGS.google_maps_url,
      hours_monday: (fd.get('hours_monday') as string) || DEFAULT_CONTACT_SETTINGS.hours_monday,
      hours_tuesday: (fd.get('hours_tuesday') as string) || DEFAULT_CONTACT_SETTINGS.hours_tuesday,
      hours_wednesday: (fd.get('hours_wednesday') as string) || DEFAULT_CONTACT_SETTINGS.hours_wednesday,
      hours_thursday: (fd.get('hours_thursday') as string) || DEFAULT_CONTACT_SETTINGS.hours_thursday,
      hours_friday: (fd.get('hours_friday') as string) || DEFAULT_CONTACT_SETTINGS.hours_friday,
      hours_saturday: (fd.get('hours_saturday') as string) || DEFAULT_CONTACT_SETTINGS.hours_saturday,
      hours_sunday: (fd.get('hours_sunday') as string) || DEFAULT_CONTACT_SETTINGS.hours_sunday,
      instagram_url: (fd.get('instagram_url') as string) || DEFAULT_CONTACT_SETTINGS.instagram_url,
      facebook_url: (fd.get('facebook_url') as string) || DEFAULT_CONTACT_SETTINGS.facebook_url,
      youtube_url: (fd.get('youtube_url') as string) || DEFAULT_CONTACT_SETTINGS.youtube_url,
      page_heading: (fd.get('page_heading') as string) || DEFAULT_CONTACT_SETTINGS.page_heading,
      page_description: (fd.get('page_description') as string) || DEFAULT_CONTACT_SETTINGS.page_description,
    };

    try {
      // 1. Primary Save to settings table (key = 'contact_settings')
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({ key: 'contact_settings', value: payload });

      if (settingsError) throw settingsError;

      // 2. Safe attempt to sync compatible fields to contact_settings table
      try {
        await supabase.from('contact_settings').upsert({
          id: 1,
          google_maps_url: payload.google_maps_url,
          instagram_url: payload.instagram_url,
          facebook_url: payload.facebook_url,
          youtube_url: payload.youtube_url,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        // Safe catch for database schema variations
      }

      // 3. Cache & Real-Time Event Dispatch
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('dvero_settings_cache');
        const parsed = cached ? JSON.parse(cached) : {};
        parsed['contact_settings'] = payload;
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        localStorage.setItem('dvero_contact_settings_cache', JSON.stringify(payload));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }

      showToast('Contact Us information updated successfully — live on the website now');
      setContactSettings(payload);
      loadSettings();
    } catch (err: any) {
      console.error('Error saving contact settings:', err);
      showToast('Could not save Contact Us settings: ' + (err?.message || ''));
    } finally {
      setSavingContact(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-oswald text-2xl uppercase">Store & Contact Settings</h1>
        <p className="text-sm text-mute mt-1">Manage global storefront rules and Contact Us studio information.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-line pb-px mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('storefront')}
          className={`font-oswald text-xs uppercase tracking-wider px-5 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'storefront' ? 'border-ink text-ink font-semibold' : 'border-transparent text-mute hover:text-ink'
          }`}
        >
          Storefront Settings
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`font-oswald text-xs uppercase tracking-wider px-5 py-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'contact' ? 'border-ink text-ink font-semibold' : 'border-transparent text-mute hover:text-ink'
          }`}
        >
          Contact Us Settings
        </button>
      </div>

      {/* 1. STOREFRONT SETTINGS FORM */}
      {activeTab === 'storefront' && (
        <form onSubmit={saveStorefrontSettings} className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-7 max-w-2xl animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                name="free_shipping_threshold"
                defaultValue={settings.free_shipping_threshold}
                className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">
                Flat Shipping Rate (₹)
              </label>
              <input
                type="number"
                name="flat_shipping_rate"
                defaultValue={settings.flat_shipping_rate}
                className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">
                Announcement Bar Text
              </label>
              <input
                type="text"
                name="announcement_text"
                defaultValue={settings.announcement_text}
                className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-oswald uppercase tracking-wider text-ink outline-none focus:border-ink"
              />
            </div>

            <div>
              <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">
                Return Window (days)
              </label>
              <input
                type="number"
                name="return_window_days"
                defaultValue={settings.return_window_days}
                className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-6 w-full sm:w-auto bg-ink text-bg px-6 py-3.5 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors min-h-[44px] cursor-pointer"
          >
            Save Storefront Settings
          </button>
        </form>
      )}

      {/* 2. CONTACT US SETTINGS FORM */}
      {activeTab === 'contact' && (
        <form key={JSON.stringify(contactSettings)} onSubmit={saveContactSettings} className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-7 max-w-3xl space-y-8 animate-fadeIn">
          {contactLoading ? (
            <div className="text-center py-12 font-oswald text-xs uppercase text-mute">Loading Contact Settings...</div>
          ) : (
            <>
              {/* Contact Page Copy */}
              <div className="space-y-4">
                <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-2">
                  1. Contact Page Content
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Page Heading</label>
                    <input
                      type="text"
                      name="page_heading"
                      defaultValue={contactSettings.page_heading}
                      placeholder="e.g. Get in Touch"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Short Description</label>
                    <textarea
                      name="page_description"
                      rows={2}
                      defaultValue={contactSettings.page_description}
                      placeholder="e.g. Have a question about your order or D’VERO? We’re here to help."
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink resize-y"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Direct Contact Information */}
              <div className="space-y-4">
                <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-2">
                  2. Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Brand Name</label>
                    <input
                      type="text"
                      name="brand_name"
                      defaultValue={contactSettings.brand_name}
                      placeholder="D'VERO"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={contactSettings.email}
                      placeholder="hello@dvero.in"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      defaultValue={contactSettings.phone}
                      placeholder="+91 98765 43210"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">WhatsApp Number</label>
                    <input
                      type="text"
                      name="whatsapp"
                      defaultValue={contactSettings.whatsapp}
                      placeholder="+91 98765 43210"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Business / Brand Address</label>
                    <input
                      type="text"
                      name="address"
                      defaultValue={contactSettings.address}
                      placeholder="Jaipur, Rajasthan, India"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs text-ink outline-none focus:border-ink"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Google Maps URL</label>
                    <input
                      type="url"
                      name="google_maps_url"
                      defaultValue={contactSettings.google_maps_url}
                      placeholder="https://maps.google.com/..."
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>

              {/* Business Operating Hours */}
              <div className="space-y-4">
                <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-2">
                  3. Business Hours
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Monday</label>
                    <input
                      type="text"
                      name="hours_monday"
                      defaultValue={contactSettings.hours_monday}
                      placeholder="10:00 AM – 7:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Tuesday</label>
                    <input
                      type="text"
                      name="hours_tuesday"
                      defaultValue={contactSettings.hours_tuesday}
                      placeholder="10:00 AM – 7:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Wednesday</label>
                    <input
                      type="text"
                      name="hours_wednesday"
                      defaultValue={contactSettings.hours_wednesday}
                      placeholder="10:00 AM – 7:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Thursday</label>
                    <input
                      type="text"
                      name="hours_thursday"
                      defaultValue={contactSettings.hours_thursday}
                      placeholder="10:00 AM – 7:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Friday</label>
                    <input
                      type="text"
                      name="hours_friday"
                      defaultValue={contactSettings.hours_friday}
                      placeholder="10:00 AM – 7:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Saturday</label>
                    <input
                      type="text"
                      name="hours_saturday"
                      defaultValue={contactSettings.hours_saturday}
                      placeholder="10:00 AM – 5:00 PM or Closed"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] uppercase text-mute mb-1">Sunday</label>
                    <input
                      type="text"
                      name="hours_sunday"
                      defaultValue={contactSettings.hours_sunday}
                      placeholder="Closed or 10:00 AM – 4:00 PM"
                      className="w-full border border-line bg-bg rounded px-3 py-2 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="font-oswald text-sm uppercase tracking-wider text-ink border-b border-line pb-2">
                  4. Social Media Links
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Instagram URL</label>
                    <input
                      type="url"
                      name="instagram_url"
                      defaultValue={contactSettings.instagram_url}
                      placeholder="https://instagram.com/dvero.in"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">Facebook URL</label>
                    <input
                      type="url"
                      name="facebook_url"
                      defaultValue={contactSettings.facebook_url}
                      placeholder="https://facebook.com/dvero.in"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-oswald text-xs uppercase text-mute mb-1.5">YouTube URL</label>
                    <input
                      type="url"
                      name="youtube_url"
                      defaultValue={contactSettings.youtube_url}
                      placeholder="https://youtube.com/@dvero"
                      className="w-full border border-line bg-bg rounded px-3.5 py-2.5 text-xs font-mono text-ink outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={savingContact}
                className="w-full sm:w-auto bg-ink text-bg px-8 py-3.5 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep disabled:opacity-60 transition-colors min-h-[44px] cursor-pointer"
              >
                {savingContact ? 'Saving Changes...' : 'Save Contact Us Settings'}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}
