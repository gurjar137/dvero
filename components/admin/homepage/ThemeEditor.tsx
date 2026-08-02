'use client';
import { HomepageTheme } from '@/lib/types';
import { ColorInput, NumberSlider } from '@/components/admin/FormPrimitives';

const BUTTON_STYLES: HomepageTheme['button_style'][] = ['sharp', 'rounded', 'pill'];
const SHADOWS: HomepageTheme['shadow'][] = ['none', 'soft', 'strong'];

export function ThemeEditor({ theme, onChange }: { theme: HomepageTheme; onChange: (patch: Partial<HomepageTheme>) => void }) {
  return (
    <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
      <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">5. Homepage Theme</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ColorInput label="Background Color" value={theme.bg_color} onChange={v => onChange({ bg_color: v })} />
        <ColorInput label="Primary Color" value={theme.primary_color} onChange={v => onChange({ primary_color: v })} />
        <ColorInput label="Secondary Color" value={theme.secondary_color} onChange={v => onChange({ secondary_color: v })} />
        <ColorInput label="Accent Color" value={theme.accent_color} onChange={v => onChange({ accent_color: v })} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Button Style</label>
          <select
            value={theme.button_style}
            onChange={e => onChange({ button_style: e.target.value as HomepageTheme['button_style'] })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
          >
            {BUTTON_STYLES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Shadow</label>
          <select
            value={theme.shadow}
            onChange={e => onChange({ shadow: e.target.value as HomepageTheme['shadow'] })}
            className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald uppercase text-ink rounded outline-none"
          >
            {SHADOWS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <NumberSlider label="Border Radius" value={theme.border_radius} onChange={v => onChange({ border_radius: v })} min={0} max={32} unit="px" />
        <NumberSlider label="Container Width" value={theme.container_width} onChange={v => onChange({ container_width: v })} min={960} max={1600} step={20} unit="px" />
      </div>
    </div>
  );
}
