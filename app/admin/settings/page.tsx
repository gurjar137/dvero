'use client';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';

export default function AdminSettingsPage() {
  const { settings, loadSettings } = useAdminData();
  const showToast = useToast();

  async function saveSettings(e: React.FormEvent<HTMLFormElement>) {
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
        updates.forEach(u => { parsed[u.key] = u.value; });
        localStorage.setItem('dvero_settings_cache', JSON.stringify(parsed));
        window.dispatchEvent(new Event('dvero_settings_updated'));
      }
      showToast('Settings saved — live on the website now');
      loadSettings();
    } catch (err: any) {
      showToast('Could not save settings: ' + (err.message || ''));
    }
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-oswald text-2xl uppercase">Storefront Settings</h1>
        <p className="text-sm text-mute mt-1">Store-wide configurations — changes go live on the website instantly.</p>
      </div>

      <form onSubmit={saveSettings} className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-7 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Free Shipping Threshold (₹)</label>
            <input
              type="number"
              name="free_shipping_threshold"
              defaultValue={settings.free_shipping_threshold}
              className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Flat Shipping Rate (₹)</label>
            <input
              type="number"
              name="flat_shipping_rate"
              defaultValue={settings.flat_shipping_rate}
              className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Announcement Bar Text</label>
            <input
              type="text"
              name="announcement_text"
              defaultValue={settings.announcement_text}
              className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-oswald uppercase tracking-wider text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Return Window (days)</label>
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
          className="mt-6 w-full sm:w-auto bg-ink text-bg px-6 py-3.5 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors min-h-[44px]"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
