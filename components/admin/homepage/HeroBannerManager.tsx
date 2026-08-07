'use client';
import { useState } from 'react';
import { HomepageHero } from '@/lib/types';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ToggleSwitch, NumberSlider } from '@/components/admin/FormPrimitives';

interface HeroBannerManagerProps {
  hero: HomepageHero;
  onChange: (patch: Partial<HomepageHero>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

export function HeroBannerManager({ hero, onChange, onSave, saving }: HeroBannerManagerProps) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const replaceDesktopImage = (newUrl: string) => {
    onChange({ desktop_image: newUrl });
  };

  const deleteDesktopImage = () => {
    onChange({ desktop_image: '' });
  };

  const replaceMobileImage = (newUrl: string) => {
    onChange({ mobile_image: newUrl });
  };

  const deleteMobileImage = () => {
    onChange({ mobile_image: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Control Header */}
      <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-lg uppercase font-semibold text-ink tracking-wide">Single Hero Banner</h2>
          <p className="text-xs text-mute font-inter mt-0.5">
            Manage the primary hero banner displayed at the top of your homepage.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-lg border border-line">
            <span className="text-xs font-oswald uppercase text-mute">Hero Visibility</span>
            <ToggleSwitch
              label={hero.enabled ? 'ON' : 'OFF'}
              checked={hero.enabled}
              onChange={v => onChange({ enabled: v })}
            />
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-camelDeep transition-all duration-200 min-h-[44px] flex items-center font-semibold shadow-sm"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Form Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* Images Section */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Hero Media Uploads
            </h3>

            {/* Desktop Hero Image */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-oswald uppercase text-ink font-medium">Desktop Hero Image</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={deleteDesktopImage}
                    disabled={!hero.desktop_image}
                    className="text-[0.65rem] font-oswald uppercase text-error hover:underline disabled:opacity-40"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
              <ImageUploadField
                label="Desktop Banner Image (16:9 recommended)"
                value={hero.desktop_image}
                onChange={replaceDesktopImage}
                aspect="aspect-video"
                folder="homepage/hero"
              />
            </div>

            {/* Mobile Hero Image (Optional) */}
            <div className="space-y-3 pt-4 border-t border-line">
              <div className="flex justify-between items-center">
                <label className="text-xs font-oswald uppercase text-ink font-medium">
                  Mobile Hero Image <span className="text-mute font-normal">(Optional)</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={deleteMobileImage}
                    disabled={!hero.mobile_image}
                    className="text-[0.65rem] font-oswald uppercase text-error hover:underline disabled:opacity-40"
                  >
                    Delete Image
                  </button>
                </div>
              </div>
              <ImageUploadField
                label="Mobile Banner Image (4:5 recommended)"
                value={hero.mobile_image || ''}
                onChange={replaceMobileImage}
                aspect="aspect-[4/5]"
                folder="homepage/hero"
              />
            </div>
          </div>

          {/* Content & Styling Section */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Content &amp; Typography
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Headline</label>
                <input
                  type="text"
                  value={hero.heading}
                  onChange={e => onChange({ heading: e.target.value })}
                  placeholder="e.g. Timeless Formals"
                  className="w-full bg-panel border border-line px-3.5 py-2.5 text-sm font-playfair text-ink rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-oswald uppercase text-mute mb-1">Subtitle</label>
                <input
                  type="text"
                  value={hero.label}
                  onChange={e => onChange({ label: e.target.value })}
                  placeholder="e.g. Power In Simplicity"
                  className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={hero.button_text}
                  onChange={e => onChange({ button_text: e.target.value })}
                  placeholder="e.g. Shop Now"
                  className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-oswald text-ink rounded-lg outline-none focus:border-ink uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-oswald uppercase text-mute mb-1">CTA Button URL</label>
                <input
                  type="text"
                  value={hero.button_link}
                  onChange={e => onChange({ button_link: e.target.value })}
                  placeholder="e.g. /category/shirts"
                  className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line space-y-4">
              <NumberSlider
                label="Overlay Opacity Slider"
                value={hero.overlay_opacity}
                onChange={v => onChange({ overlay_opacity: v })}
                min={0}
                max={90}
                unit="%"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="w-full sm:w-auto bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg hover:bg-camelDeep transition-all duration-200 font-semibold shadow-sm min-h-[44px]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 space-y-4 sticky top-6">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-oswald text-sm uppercase font-semibold text-ink">Live Preview Panel</h3>
              <div className="flex gap-1.5 bg-panel p-1 rounded-lg border border-line">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`font-oswald text-[0.65rem] uppercase px-3 py-1 rounded transition-colors ${
                    previewDevice === 'desktop' ? 'bg-ink text-bg font-bold' : 'text-mute hover:text-ink'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`font-oswald text-[0.65rem] uppercase px-3 py-1 rounded transition-colors ${
                    previewDevice === 'mobile' ? 'bg-ink text-bg font-bold' : 'text-mute hover:text-ink'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className="flex justify-center bg-panel p-4 rounded-lg overflow-hidden border border-line">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile' ? 'w-[280px] h-[480px]' : 'w-full aspect-[16/9]'
                } rounded-lg overflow-hidden relative shadow-md bg-ink text-white flex flex-col justify-end p-6`}
              >
                {/* Background Image */}
                {previewDevice === 'mobile' && hero.mobile_image ? (
                  <img
                    src={hero.mobile_image}
                    alt="Mobile Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : hero.desktop_image ? (
                  <img
                    src={hero.desktop_image}
                    alt="Desktop Hero"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-neutral-500 font-oswald uppercase text-xs">
                    No Image Uploaded
                  </div>
                )}

                {/* Dark Overlay */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: hero.overlay_opacity / 100 }}
                />

                {/* Hero Visibility Badge */}
                {!hero.enabled && (
                  <div className="absolute top-3 right-3 bg-error text-white font-oswald text-[0.6rem] uppercase px-2 py-0.5 rounded font-bold z-20">
                    HIDDEN ON HOMEPAGE
                  </div>
                )}

                {/* Hero Text Overlay Content */}
                <div className="relative z-10 space-y-2 text-left">
                  {hero.label && (
                    <span className="font-oswald text-[0.65rem] uppercase tracking-[0.2em] text-camel block">
                      {hero.label}
                    </span>
                  )}
                  <h4 className="font-playfair text-lg sm:text-xl font-bold leading-tight">
                    {hero.heading || 'Hero Headline'}
                  </h4>
                  {hero.button_text && (
                    <div className="pt-2">
                      <span className="inline-block bg-white text-black font-oswald text-[0.65rem] uppercase tracking-widest px-4 py-2 rounded font-semibold shadow">
                        {hero.button_text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <p className="text-[0.68rem] text-mute text-center font-inter">
              Updates in real-time as you modify headline, images, and opacity above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
