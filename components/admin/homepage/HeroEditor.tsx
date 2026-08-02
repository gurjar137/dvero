'use client';
import { HomepageHero, HomepageHeroLayout } from '@/lib/types';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ColorInput, ToggleSwitch, NumberSlider } from '@/components/admin/FormPrimitives';

const LAYOUTS: { id: HomepageHeroLayout; label: string }[] = [
  { id: 'split', label: 'Split (Left Content + Right Image)' },
  { id: 'full', label: 'Full Image' },
  { id: 'center', label: 'Center Content' },
];

const POSITIONS = ['top', 'center', 'bottom', 'left', 'right'] as const;

export function HeroEditor({ hero, onChange }: { hero: HomepageHero; onChange: (patch: Partial<HomepageHero>) => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <h3 className="font-oswald text-sm uppercase font-semibold text-ink">1. Hero Section</h3>
          <ToggleSwitch label={hero.enabled ? 'Enabled' : 'Disabled'} checked={hero.enabled} onChange={v => onChange({ enabled: v })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Small Label</label>
            <input
              type="text"
              value={hero.label}
              onChange={e => onChange({ label: e.target.value })}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Primary Button Text</label>
            <input
              type="text"
              value={hero.button_text}
              onChange={e => onChange({ button_text: e.target.value })}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Main Heading</label>
            <input
              type="text"
              value={hero.heading}
              onChange={e => onChange({ heading: e.target.value })}
              className="w-full bg-panel border border-line px-3 py-2 text-sm font-playfair text-ink rounded outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Description</label>
            <textarea
              value={hero.description}
              onChange={e => onChange({ description: e.target.value })}
              rows={2}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Primary Button Link</label>
            <input
              type="text"
              value={hero.button_link}
              onChange={e => onChange({ button_link: e.target.value })}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none"
            />
          </div>
          <div>
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Hero Layout</label>
            <select
              value={hero.layout}
              onChange={e => onChange({ layout: e.target.value as HomepageHeroLayout })}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
            >
              {LAYOUTS.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line">
          <ColorInput label="Background Color" value={hero.bg_color} onChange={v => onChange({ bg_color: v })} />
          <ColorInput label="Text Color" value={hero.text_color} onChange={v => onChange({ text_color: v })} />
        </div>
      </div>

      <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
        <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">2. Hero Image Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ImageUploadField label="Desktop Image (16:9)" value={hero.desktop_image} onChange={v => onChange({ desktop_image: v })} aspect="aspect-video" folder="homepage/hero" />
          <ImageUploadField label="Mobile Image (4:5)" value={hero.mobile_image} onChange={v => onChange({ mobile_image: v })} aspect="aspect-[4/5]" folder="homepage/hero" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Image Position</label>
            <select
              value={hero.image_position}
              onChange={e => onChange({ image_position: e.target.value as HomepageHero['image_position'] })}
              className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
            >
              {POSITIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <NumberSlider label="Image Scale" value={hero.image_scale} onChange={v => onChange({ image_scale: v })} min={80} max={140} unit="%" />
          <NumberSlider label="Overlay Opacity" value={hero.overlay_opacity} onChange={v => onChange({ overlay_opacity: v })} min={0} max={80} unit="%" />
          <NumberSlider label="Border Radius" value={hero.border_radius} onChange={v => onChange({ border_radius: v })} min={0} max={48} unit="px" />
        </div>
      </div>
    </div>
  );
}
