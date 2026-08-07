'use client';
import { HomepageSettings } from '@/lib/types';
import { ToggleSwitch } from '@/components/admin/FormPrimitives';

interface HomepageSettingsManagerProps {
  settings: HomepageSettings;
  onChange: (patch: Partial<HomepageSettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function HomepageSettingsManager({
  settings,
  onChange,
  onSave,
  saving,
}: HomepageSettingsManagerProps) {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Control Header */}
      <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-lg uppercase font-semibold text-ink tracking-wide">Homepage Settings</h2>
          <p className="text-xs text-mute font-inter mt-0.5">
            Adjust layout dimensions, product grid columns per viewport, newsletter, footer, and section visibility.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-camelDeep transition-all duration-200 min-h-[44px] flex items-center font-semibold shadow-sm"
        >
          {saving ? 'Saving Settings...' : 'Save Homepage Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Layout & Dimensions */}
        <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
          <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
            Hero Viewport Height
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-oswald uppercase text-mute mb-1.5">
                Desktop Hero Height
              </label>
              <select
                value={settings.hero_height_desktop || '90vh'}
                onChange={e => onChange({ hero_height_desktop: e.target.value })}
                className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink uppercase font-medium"
              >
                <option value="100vh">100vh (Full Viewport)</option>
                <option value="90vh">90vh (Default Standard)</option>
                <option value="80vh">80vh (Compact)</option>
                <option value="70vh">70vh (Short)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-oswald uppercase text-mute mb-1.5">
                Mobile Hero Height
              </label>
              <select
                value={settings.hero_height_mobile || '100dvh'}
                onChange={e => onChange({ hero_height_mobile: e.target.value })}
                className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink uppercase font-medium"
              >
                <option value="100dvh">100dvh (Default Full Screen)</option>
                <option value="90dvh">90dvh (Medium)</option>
                <option value="80dvh">80dvh (Compact)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Per Row Grid */}
        <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
          <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
            Products Per Row Grid
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1.5">Desktop</label>
              <select
                value={settings.products_per_row_desktop || 4}
                onChange={e => onChange({ products_per_row_desktop: Number(e.target.value) })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink"
              >
                <option value={2}>2 Per Row</option>
                <option value={3}>3 Per Row</option>
                <option value={4}>4 Per Row</option>
                <option value={5}>5 Per Row</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1.5">Tablet</label>
              <select
                value={settings.products_per_row_tablet || 2}
                onChange={e => onChange({ products_per_row_tablet: Number(e.target.value) })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink"
              >
                <option value={2}>2 Per Row</option>
                <option value={3}>3 Per Row</option>
              </select>
            </div>

            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1.5">Mobile</label>
              <select
                value={settings.products_per_row_mobile || 1}
                onChange={e => onChange({ products_per_row_mobile: Number(e.target.value) })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink"
              >
                <option value={1}>1 Per Row</option>
                <option value={2}>2 Per Row</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Component Toggles */}
        <div className="md:col-span-2 bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
          <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
            Homepage Section Visibility Controls
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex justify-between items-center bg-panel border border-line p-4 rounded-lg">
              <div>
                <label className="font-oswald text-xs uppercase text-ink font-semibold block">
                  Show Featured Products
                </label>
                <span className="text-[0.68rem] text-mute font-inter">Default ON</span>
              </div>
              <ToggleSwitch
                label={settings.show_featured_products ? 'ON' : 'OFF'}
                checked={settings.show_featured_products}
                onChange={v => onChange({ show_featured_products: v })}
              />
            </div>

            <div className="flex justify-between items-center bg-panel border border-line p-4 rounded-lg">
              <div>
                <label className="font-oswald text-xs uppercase text-ink font-semibold block">
                  Enable Newsletter
                </label>
                <span className="text-[0.68rem] text-mute font-inter">Subscription form bar</span>
              </div>
              <ToggleSwitch
                label={settings.enable_newsletter ? 'ON' : 'OFF'}
                checked={settings.enable_newsletter}
                onChange={v => onChange({ enable_newsletter: v })}
              />
            </div>

            <div className="flex justify-between items-center bg-panel border border-line p-4 rounded-lg">
              <div>
                <label className="font-oswald text-xs uppercase text-ink font-semibold block">
                  Enable Footer
                </label>
                <span className="text-[0.68rem] text-mute font-inter">Global footer links</span>
              </div>
              <ToggleSwitch
                label={settings.enable_footer ? 'ON' : 'OFF'}
                checked={settings.enable_footer}
                onChange={v => onChange({ enable_footer: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
