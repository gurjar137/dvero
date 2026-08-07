'use client';
import { useState } from 'react';
import { MenuItem, NavbarSettings } from '@/lib/types';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ToggleSwitch } from '@/components/admin/FormPrimitives';

interface NavbarSettingsManagerProps {
  settings: NavbarSettings;
  onChange: (patch: Partial<NavbarSettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function NavbarSettingsManager({
  settings,
  onChange,
  onSave,
  saving,
}: NavbarSettingsManagerProps) {
  const [newDesktopLabel, setNewDesktopLabel] = useState('');
  const [newDesktopUrl, setNewDesktopUrl] = useState('');
  const [newMobileLabel, setNewMobileLabel] = useState('');
  const [newMobileUrl, setNewMobileUrl] = useState('');

  // Add Desktop Menu Item
  function addDesktopItem() {
    if (!newDesktopLabel || !newDesktopUrl) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: newDesktopLabel,
      url: newDesktopUrl,
    };
    onChange({ desktop_menu_items: [...(settings.desktop_menu_items || []), newItem] });
    setNewDesktopLabel('');
    setNewDesktopUrl('');
  }

  // Remove Desktop Menu Item
  function removeDesktopItem(id: string) {
    onChange({
      desktop_menu_items: (settings.desktop_menu_items || []).filter(item => item.id !== id),
    });
  }

  // Add Mobile Menu Item
  function addMobileItem() {
    if (!newMobileLabel || !newMobileUrl) return;
    const newItem: MenuItem = {
      id: Date.now().toString(),
      label: newMobileLabel,
      url: newMobileUrl,
    };
    onChange({ mobile_menu_items: [...(settings.mobile_menu_items || []), newItem] });
    setNewMobileLabel('');
    setNewMobileUrl('');
  }

  // Remove Mobile Menu Item
  function removeMobileItem(id: string) {
    onChange({
      mobile_menu_items: (settings.mobile_menu_items || []).filter(item => item.id !== id),
    });
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Control Header */}
      <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-lg uppercase font-semibold text-ink tracking-wide">Navbar Settings</h2>
          <p className="text-xs text-mute font-inter mt-0.5">
            Configure header logo, desktop &amp; mobile navigation links, announcement bar, and layout options.
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-camelDeep transition-all duration-200 min-h-[44px] flex items-center font-semibold shadow-sm"
        >
          {saving ? 'Saving Settings...' : 'Save Navbar Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Logo & Navbar Appearance */}
        <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Brand Logo Upload
            </h3>
            <ImageUploadField
              label="Header & Navbar Logo"
              value={settings.logo_url}
              onChange={v => onChange({ logo_url: v })}
              aspect="aspect-[3/1]"
              folder="branding"
            />
          </div>

          {/* Behavior Toggles */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Navbar Behavior &amp; Layout
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-line/60">
                <div>
                  <label className="font-oswald text-xs uppercase text-ink font-semibold block">Transparent Navbar</label>
                  <span className="text-[0.68rem] text-mute font-inter">Overlays transparently on top of hero banner</span>
                </div>
                <ToggleSwitch
                  checked={settings.transparent_navbar}
                  onChange={v => onChange({ transparent_navbar: v })}
                />
              </div>

              <div className="flex justify-between items-center py-2">
                <div>
                  <label className="font-oswald text-xs uppercase text-ink font-semibold block">Sticky Navbar</label>
                  <span className="text-[0.68rem] text-mute font-inter">Sticks to top of screen on page scroll</span>
                </div>
                <ToggleSwitch
                  checked={settings.sticky_navbar}
                  onChange={v => onChange({ sticky_navbar: v })}
                />
              </div>
            </div>
          </div>

          {/* Announcement Bar Settings (Default OFF) */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-sm2">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-oswald text-sm uppercase font-semibold text-ink">Announcement Bar</h3>
              <ToggleSwitch
                label={settings.announcement_bar_enabled ? 'ON' : 'OFF (Default)'}
                checked={settings.announcement_bar_enabled}
                onChange={v => onChange({ announcement_bar_enabled: v })}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-oswald uppercase text-mute">Announcement Bar Text</label>
              <input
                type="text"
                value={settings.announcement_text}
                onChange={e => onChange({ announcement_text: e.target.value })}
                placeholder="e.g. Complimentary shipping on orders above ₹2,999"
                className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
              />
            </div>
          </div>
        </div>

        {/* Menu Items Managers */}
        <div className="space-y-6">
          {/* Desktop Menu Items */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Desktop Menu Items
            </h3>

            {/* List */}
            <div className="space-y-2">
              {(settings.desktop_menu_items || []).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-panel border border-line rounded-lg px-3 py-2 text-xs">
                  <div>
                    <span className="font-oswald text-ink font-semibold uppercase">{item.label}</span>
                    <span className="text-mute font-mono text-[0.65rem] block">{item.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDesktopItem(item.id)}
                    className="text-error font-oswald uppercase text-[0.65rem] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Desktop Item */}
            <div className="pt-3 border-t border-line space-y-2">
              <span className="text-[0.68rem] font-oswald uppercase text-mute block">Add Desktop Link</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newDesktopLabel}
                  onChange={e => setNewDesktopLabel(e.target.value)}
                  placeholder="Label (e.g. Shirts)"
                  className="bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded-lg outline-none"
                />
                <input
                  type="text"
                  value={newDesktopUrl}
                  onChange={e => setNewDesktopUrl(e.target.value)}
                  placeholder="URL (e.g. /category/shirts)"
                  className="bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addDesktopItem}
                className="w-full bg-panel border border-line hover:border-ink text-ink font-oswald text-xs uppercase py-2 rounded-lg transition-colors font-semibold"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Mobile Menu Items */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-4 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Mobile Menu Items
            </h3>

            {/* List */}
            <div className="space-y-2">
              {(settings.mobile_menu_items || []).map(item => (
                <div key={item.id} className="flex items-center justify-between bg-panel border border-line rounded-lg px-3 py-2 text-xs">
                  <div>
                    <span className="font-oswald text-ink font-semibold uppercase">{item.label}</span>
                    <span className="text-mute font-mono text-[0.65rem] block">{item.url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMobileItem(item.id)}
                    className="text-error font-oswald uppercase text-[0.65rem] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Mobile Item */}
            <div className="pt-3 border-t border-line space-y-2">
              <span className="text-[0.68rem] font-oswald uppercase text-mute block">Add Mobile Link</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newMobileLabel}
                  onChange={e => setNewMobileLabel(e.target.value)}
                  placeholder="Label (e.g. About Us)"
                  className="bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded-lg outline-none"
                />
                <input
                  type="text"
                  value={newMobileUrl}
                  onChange={e => setNewMobileUrl(e.target.value)}
                  placeholder="URL (e.g. /about)"
                  className="bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addMobileItem}
                className="w-full bg-panel border border-line hover:border-ink text-ink font-oswald text-xs uppercase py-2 rounded-lg transition-colors font-semibold"
              >
                + Add Item
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
