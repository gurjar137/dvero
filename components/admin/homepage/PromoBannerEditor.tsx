'use client';
import { useState } from 'react';
import { PromoBanner, PromoBannerTextPosition, PromoBannerVerticalPosition } from '@/lib/types';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ColorInput, ToggleSwitch, NumberSlider } from '@/components/admin/FormPrimitives';
import { PromoBannerPreview } from './PromoBannerPreview';

const TEXT_POSITIONS: PromoBannerTextPosition[] = ['left', 'center', 'right'];
const VERTICAL_POSITIONS: PromoBannerVerticalPosition[] = ['top', 'center', 'bottom'];

export function PromoBannerEditor({
  label,
  banner,
  onChange,
  onSave,
  saving,
}: {
  label: string;
  banner: PromoBanner;
  onChange: (patch: Partial<PromoBanner>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
      <div className="flex justify-between items-center flex-wrap gap-3 border-b border-line pb-3">
        <h3 className="font-oswald text-sm uppercase font-semibold text-ink">{label}</h3>
        <ToggleSwitch label={banner.enabled ? 'Enabled' : 'Disabled'} checked={banner.enabled} onChange={v => onChange({ enabled: v })} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUploadField
          label="Desktop Image (16:9, High Resolution)"
          value={banner.desktop_image}
          onChange={v => onChange({ desktop_image: v })}
          aspect="aspect-video"
          folder="homepage/promo-banners"
        />
        <ImageUploadField
          label="Mobile Image (4:5, Responsive)"
          value={banner.mobile_image}
          onChange={v => onChange({ mobile_image: v })}
          aspect="aspect-[4/5]"
          folder="homepage/promo-banners"
        />
      </div>
      <p className="text-[0.65rem] text-mute -mt-2">If Mobile Image is left empty, the Desktop Image is used automatically on mobile.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Title</label>
          <input
            type="text"
            value={banner.title}
            onChange={e => onChange({ title: e.target.value })}
            className="w-full bg-panel border border-line px-3 py-2 text-sm font-playfair text-ink rounded outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Subtitle</label>
          <input
            type="text"
            value={banner.subtitle}
            onChange={e => onChange({ subtitle: e.target.value })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Description</label>
          <textarea
            value={banner.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={2}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Button Text</label>
          <input
            type="text"
            value={banner.button_text}
            onChange={e => onChange({ button_text: e.target.value })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Button Link</label>
          <input
            type="text"
            value={banner.button_link}
            onChange={e => onChange({ button_link: e.target.value })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none"
          />
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Text Position</label>
          <select
            value={banner.text_position}
            onChange={e => onChange({ text_position: e.target.value as PromoBannerTextPosition })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
          >
            {TEXT_POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Vertical Position</label>
          <select
            value={banner.vertical_position}
            onChange={e => onChange({ vertical_position: e.target.value as PromoBannerVerticalPosition })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
          >
            {VERTICAL_POSITIONS.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-line">
        <ColorInput label="Text Color" value={banner.text_color} onChange={v => onChange({ text_color: v })} />
        <ColorInput label="Overlay Color" value={banner.overlay_color} onChange={v => onChange({ overlay_color: v })} />
        <NumberSlider label="Overlay Opacity" value={banner.overlay_opacity} onChange={v => onChange({ overlay_opacity: v })} min={0} max={100} unit="%" />
        <div className="flex items-end pb-1.5">
          <ToggleSwitch label="Background Gradient" checked={banner.gradient_enabled} onChange={v => onChange({ gradient_enabled: v })} />
        </div>
      </div>

      <div className="pt-3 border-t border-line space-y-3">
        <div className="flex justify-between items-center">
          <span className="font-oswald text-[0.68rem] uppercase text-mute">Live Preview</span>
          <div className="flex gap-2">
            {(['desktop', 'mobile'] as const).map(d => (
              <button
                key={d}
                onClick={() => setPreviewDevice(d)}
                className={`font-oswald text-[0.65rem] uppercase px-3 py-1.5 rounded border transition-colors ${
                  previewDevice === d ? 'bg-ink text-bg border-ink' : 'border-line text-mute hover:border-ink hover:text-ink'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-panel rounded-lg p-4 flex justify-center">
          <PromoBannerPreview banner={banner} device={previewDevice} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-6 py-2.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
