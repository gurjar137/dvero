'use client';
import { useState, useRef } from 'react';
import { HomepageHero, ElementDeviceConfig } from '@/lib/types';
import { DEFAULT_HOMEPAGE_HERO, normalizeHomepageHero } from '@/lib/homepageDefaults';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { ToggleSwitch, NumberSlider } from '@/components/admin/FormPrimitives';

interface HeroBannerManagerProps {
  hero: HomepageHero;
  onChange: (patch: Partial<HomepageHero>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
}

type ElementKey = 'eyebrow' | 'mainHeading' | 'subDescription' | 'cta1' | 'cta2';
type DeviceMode = 'desktop' | 'mobile';

function getTransform(h: string = 'left', v: string = 'top') {
  const x = h === 'center' ? '-50%' : h === 'right' ? '-100%' : '0%';
  const y = v === 'center' ? '-50%' : v === 'bottom' ? '-100%' : '0%';
  return `translate(${x}, ${y})`;
}

export function HeroBannerManager({ hero, onChange, onSave, saving }: HeroBannerManagerProps) {
  const normalizedHero = normalizeHomepageHero(hero);
  const [deviceTab, setDeviceTab] = useState<DeviceMode>('desktop');
  const [activeElementKey, setActiveElementKey] = useState<ElementKey>('mainHeading');
  const [isDragging, setIsDragging] = useState(false);
  const previewCanvasRef = useRef<HTMLDivElement>(null);

  // Helper updates
  const updateElement = (key: ElementKey, patch: Partial<any>) => {
    const current = normalizedHero[key]!;
    onChange({
      [key]: {
        ...current,
        ...patch,
      },
    });
  };

  const updateElementDevice = (key: ElementKey, dev: DeviceMode, patch: Partial<ElementDeviceConfig>) => {
    const currentEl = normalizedHero[key]!;
    const currentDev = currentEl[dev];
    onChange({
      [key]: {
        ...currentEl,
        [dev]: {
          ...currentDev,
          ...patch,
        },
      },
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all Hero Banner settings, copy, and positioning back to original defaults?')) {
      onChange(DEFAULT_HOMEPAGE_HERO);
    }
  };

  // Drag-to-position handlers for Live Preview
  const handlePointerDown = (key: ElementKey, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveElementKey(key);
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !previewCanvasRef.current) return;
    const rect = previewCanvasRef.current.getBoundingClientRect();
    const xPercent = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const yPercent = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

    updateElementDevice(activeElementKey, deviceTab, {
      xPosition: xPercent,
      yPosition: yPercent,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const activeElement = normalizedHero[activeElementKey]!;
  const activeDeviceConfig = activeElement[deviceTab];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Control Header */}
      <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-oswald text-lg uppercase font-semibold text-ink tracking-wide">
            Homepage Hero Management
          </h2>
          <p className="text-xs text-mute font-inter mt-0.5">
            Full element-level text customization, desktop/mobile responsive positioning, and real-time preview.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-panel px-3 py-1.5 rounded-lg border border-line">
            <span className="text-xs font-oswald uppercase text-mute">Hero Visibility</span>
            <ToggleSwitch
              label={normalizedHero.enabled ? 'ON' : 'OFF'}
              checked={normalizedHero.enabled}
              onChange={v => onChange({ enabled: v })}
            />
          </div>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="border border-line bg-panel text-ink hover:bg-mute/10 font-oswald text-xs uppercase tracking-widest px-4 py-2.5 rounded-lg transition-colors font-medium min-h-[44px]"
          >
            Reset to Default
          </button>
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
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Hero Media Uploads */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-5 shadow-sm2">
            <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">
              Hero Media Uploads
            </h3>

            {/* Desktop Hero Image */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-oswald uppercase text-ink font-medium">
                  Desktop Hero Image (16:9 recommended)
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ desktop_image: '' })}
                  disabled={!normalizedHero.desktop_image}
                  className="text-[0.65rem] font-oswald uppercase text-error hover:underline disabled:opacity-40"
                >
                  Clear Image
                </button>
              </div>
              <ImageUploadField
                label="Desktop Banner Image"
                value={normalizedHero.desktop_image}
                onChange={url => onChange({ desktop_image: url })}
                aspect="aspect-video"
                folder="homepage/hero"
              />
            </div>

            {/* Mobile Hero Image */}
            <div className="space-y-2 pt-3 border-t border-line">
              <div className="flex justify-between items-center">
                <label className="text-xs font-oswald uppercase text-ink font-medium">
                  Mobile Hero Image (4:5 recommended)
                </label>
                <button
                  type="button"
                  onClick={() => onChange({ mobile_image: '' })}
                  disabled={!normalizedHero.mobile_image}
                  className="text-[0.65rem] font-oswald uppercase text-error hover:underline disabled:opacity-40"
                >
                  Clear Image
                </button>
              </div>
              <ImageUploadField
                label="Mobile Banner Image"
                value={normalizedHero.mobile_image || ''}
                onChange={url => onChange({ mobile_image: url })}
                aspect="aspect-[4/5]"
                folder="homepage/hero"
              />
            </div>

            {/* Overlay Opacity Slider */}
            <div className="pt-3 border-t border-line">
              <NumberSlider
                label="Dark Overlay Opacity"
                value={normalizedHero.overlay_opacity}
                onChange={v => onChange({ overlay_opacity: v })}
                min={0}
                max={90}
                unit="%"
              />
            </div>
          </div>

          {/* Section 2: HERO CONTENT & POSITIONING */}
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 space-y-6 shadow-sm2">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <h3 className="font-oswald text-sm uppercase font-semibold text-ink">
                  Hero Content &amp; Positioning
                </h3>
                <p className="text-[0.72rem] text-mute font-inter mt-0.5">
                  Select a device mode and element below to customize copy, typography, colors, and positioning.
                </p>
              </div>

              {/* Desktop / Mobile Device Mode Switcher */}
              <div className="flex p-1 bg-panel border border-line rounded-lg">
                <button
                  type="button"
                  onClick={() => setDeviceTab('desktop')}
                  className={`font-oswald text-xs uppercase px-4 py-1.5 rounded transition-all font-medium ${
                    deviceTab === 'desktop' ? 'bg-ink text-bg font-bold shadow' : 'text-mute hover:text-ink'
                  }`}
                >
                  DESKTOP (16:9)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('mobile')}
                  className={`font-oswald text-xs uppercase px-4 py-1.5 rounded transition-all font-medium ${
                    deviceTab === 'mobile' ? 'bg-ink text-bg font-bold shadow' : 'text-mute hover:text-ink'
                  }`}
                >
                  MOBILE (4:5)
                </button>
              </div>
            </div>

            {/* Element Selection Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-line">
              {[
                { key: 'eyebrow', label: '1. Eyebrow' },
                { key: 'mainHeading', label: '2. Heading' },
                { key: 'subDescription', label: '3. Description' },
                { key: 'cta1', label: '4. CTA Button 1' },
                { key: 'cta2', label: '5. CTA Button 2' },
              ].map(item => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveElementKey(item.key as ElementKey)}
                  className={`font-oswald text-xs uppercase px-3.5 py-2 rounded-lg transition-all shrink-0 border ${
                    activeElementKey === item.key
                      ? 'border-ink bg-ink text-bg font-semibold'
                      : 'border-line bg-panel text-mute hover:text-ink'
                  }`}
                >
                  {item.label}
                  {!normalizedHero[item.key as ElementKey]?.enabled && (
                    <span className="ml-1 text-[0.6rem] opacity-60">(Off)</span>
                  )}
                </button>
              ))}
            </div>

            {/* Active Element Customization Form */}
            <div className="space-y-5 pt-2">
              {/* Enable / Disable Switch */}
              <div className="flex justify-between items-center bg-panel p-3 rounded-lg border border-line">
                <span className="font-oswald text-xs uppercase text-ink font-medium">
                  Enable {activeElementKey.toUpperCase()} Element
                </span>
                <ToggleSwitch
                  label={activeElement.enabled ? 'ENABLED' : 'DISABLED'}
                  checked={activeElement.enabled}
                  onChange={v => updateElement(activeElementKey, { enabled: v })}
                />
              </div>

              {/* Text / Copy Fields */}
              <div className="space-y-3">
                <label className="block text-xs font-oswald uppercase text-mute">
                  {activeElementKey.includes('cta') ? 'Button Text' : 'Text Content'}
                </label>
                {activeElementKey === 'mainHeading' || activeElementKey === 'subDescription' ? (
                  <textarea
                    rows={2}
                    value={activeElement.text || ''}
                    onChange={e => updateElement(activeElementKey, { text: e.target.value })}
                    placeholder="Enter text content..."
                    className="w-full bg-panel border border-line px-3.5 py-2.5 text-sm font-inter text-ink rounded-lg outline-none focus:border-ink resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={activeElement.text || ''}
                    onChange={e => updateElement(activeElementKey, { text: e.target.value })}
                    placeholder="Enter text content..."
                    className="w-full bg-panel border border-line px-3.5 py-2.5 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
                  />
                )}
              </div>

              {/* Destination URL for CTA Buttons */}
              {activeElementKey.includes('cta') && (
                <div className="space-y-1">
                  <label className="block text-xs font-oswald uppercase text-mute">Button Destination Link</label>
                  <input
                    type="text"
                    value={(activeElement as any).link || ''}
                    onChange={e => updateElement(activeElementKey, { link: e.target.value })}
                    placeholder="e.g. /category/shirts or /about"
                    className="w-full bg-panel border border-line px-3.5 py-2 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                  />
                </div>
              )}

              {/* Device Specific Settings Header Badge */}
              <div className="bg-panel border border-line px-3.5 py-2 rounded-lg flex items-center justify-between text-xs font-oswald uppercase">
                <span className="text-ink font-semibold">
                  Editing Context: <span className="text-camel uppercase font-bold">{deviceTab} Mode</span>
                </span>
                <span className="text-mute text-[0.65rem]">
                  Changes below apply strictly to {deviceTab} screens
                </span>
              </div>

              {/* Typography & Dimensions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Font Size */}
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                    Font Size ({deviceTab})
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={120}
                    value={activeDeviceConfig.fontSize || 14}
                    onChange={e =>
                      updateElementDevice(activeElementKey, deviceTab, { fontSize: parseInt(e.target.value) || 14 })
                    }
                    className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                  />
                </div>

                {/* Font Weight */}
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Font Weight</label>
                  <select
                    value={activeElement.fontWeight || '500'}
                    onChange={e => updateElement(activeElementKey, { fontWeight: e.target.value })}
                    className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
                  >
                    <option value="300">300 (Light)</option>
                    <option value="400">400 (Normal)</option>
                    <option value="500">500 (Medium)</option>
                    <option value="600">600 (SemiBold)</option>
                    <option value="700">700 (Bold)</option>
                  </select>
                </div>

                {/* Letter Spacing */}
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Letter Spacing</label>
                  <select
                    value={activeElement.letterSpacing || '0.1em'}
                    onChange={e => updateElement(activeElementKey, { letterSpacing: e.target.value })}
                    className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink"
                  >
                    <option value="0em">Normal (0em)</option>
                    <option value="0.05em">Tight (0.05em)</option>
                    <option value="0.1em">Wide (0.1em)</option>
                    <option value="0.2em">Expanded (0.2em)</option>
                    <option value="0.3em">Extra Wide (0.3em)</option>
                  </select>
                </div>

                {/* Line Height (Heading & Description) */}
                {(activeElementKey === 'mainHeading' || activeElementKey === 'subDescription') && (
                  <div>
                    <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                      Line Height ({deviceTab})
                    </label>
                    <input
                      type="number"
                      step={0.1}
                      min={0.8}
                      max={2.5}
                      value={activeDeviceConfig.lineHeight || 1.2}
                      onChange={e =>
                        updateElementDevice(activeElementKey, deviceTab, {
                          lineHeight: parseFloat(e.target.value) || 1.2,
                        })
                      }
                      className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                    />
                  </div>
                )}

                {/* Max Width */}
                {(activeElementKey === 'mainHeading' || activeElementKey === 'subDescription') && (
                  <div>
                    <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                      Max Width ({deviceTab} px)
                    </label>
                    <input
                      type="number"
                      step={20}
                      min={100}
                      max={1400}
                      value={activeDeviceConfig.maxWidth || 600}
                      onChange={e =>
                        updateElementDevice(activeElementKey, deviceTab, {
                          maxWidth: parseInt(e.target.value) || 600,
                        })
                      }
                      className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                    />
                  </div>
                )}

                {/* Text Alignment */}
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Text Align</label>
                  <select
                    value={activeDeviceConfig.textAlign || 'left'}
                    onChange={e =>
                      updateElementDevice(activeElementKey, deviceTab, {
                        textAlign: e.target.value as any,
                      })
                    }
                    className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded-lg outline-none focus:border-ink uppercase"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>

              {/* Color & Button Styling */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={activeElement.textColor || '#FFFFFF'}
                      onChange={e => updateElement(activeElementKey, { textColor: e.target.value })}
                      className="w-8 h-8 rounded border border-line cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={activeElement.textColor || '#FFFFFF'}
                      onChange={e => updateElement(activeElementKey, { textColor: e.target.value })}
                      className="w-full bg-panel border border-line px-2.5 py-1.5 text-xs font-mono text-ink rounded outline-none"
                    />
                  </div>
                </div>

                {activeElementKey.includes('cta') && (
                  <>
                    <div>
                      <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                        Background Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={
                            (activeElement as any).bgColor === 'transparent'
                              ? '#000000'
                              : (activeElement as any).bgColor || '#FFFFFF'
                          }
                          onChange={e => updateElement(activeElementKey, { bgColor: e.target.value })}
                          className="w-8 h-8 rounded border border-line cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={(activeElement as any).bgColor || '#FFFFFF'}
                          onChange={e => updateElement(activeElementKey, { bgColor: e.target.value })}
                          className="w-full bg-panel border border-line px-2.5 py-1.5 text-xs font-mono text-ink rounded outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                        Border Color
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="color"
                          value={(activeElement as any).borderColor || '#FFFFFF'}
                          onChange={e => updateElement(activeElementKey, { borderColor: e.target.value })}
                          className="w-8 h-8 rounded border border-line cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={(activeElement as any).borderColor || '#FFFFFF'}
                          onChange={e => updateElement(activeElementKey, { borderColor: e.target.value })}
                          className="w-full bg-panel border border-line px-2.5 py-1.5 text-xs font-mono text-ink rounded outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Position Presets & Fine Adjustments */}
              <div className="space-y-4 pt-3 border-t border-line">
                <h4 className="font-oswald text-xs uppercase font-semibold text-ink flex items-center justify-between">
                  <span>Position Controls ({deviceTab.toUpperCase()})</span>
                  <span className="text-mute text-[0.68rem] font-normal">Relative Percentage (%)</span>
                </h4>

                {/* Preset Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                      Horizontal Preset
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-panel p-1 rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignHorizontal: 'left',
                            xPosition: 8,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignHorizontal === 'left' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignHorizontal: 'center',
                            xPosition: 50,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignHorizontal === 'center' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignHorizontal: 'right',
                            xPosition: 92,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignHorizontal === 'right' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Right
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                      Vertical Preset
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-panel p-1 rounded-lg border border-line">
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignVertical: 'top',
                            yPosition: 15,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignVertical === 'top' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Top
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignVertical: 'center',
                            yPosition: 50,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignVertical === 'center' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElementDevice(activeElementKey, deviceTab, {
                            alignVertical: 'bottom',
                            yPosition: 80,
                          })
                        }
                        className={`text-[0.65rem] font-oswald uppercase py-1 rounded ${
                          activeDeviceConfig.alignVertical === 'bottom' ? 'bg-ink text-bg font-bold' : 'text-mute'
                        }`}
                      >
                        Bottom
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fine Sliders */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberSlider
                    label={`X Position (${deviceTab})`}
                    value={activeDeviceConfig.xPosition || 0}
                    onChange={v => updateElementDevice(activeElementKey, deviceTab, { xPosition: v })}
                    min={0}
                    max={100}
                    unit="%"
                  />
                  <NumberSlider
                    label={`Y Position (${deviceTab})`}
                    value={activeDeviceConfig.yPosition || 0}
                    onChange={v => updateElementDevice(activeElementKey, deviceTab, { yPosition: v })}
                    min={0}
                    max={100}
                    unit="%"
                  />
                </div>

                {/* Z-Index Depth Control */}
                <div className="pt-2">
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">
                    Layer Depth Order (Z-Index)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={activeElement.zIndex || 10}
                    onChange={e => updateElement(activeElementKey, { zIndex: parseInt(e.target.value) || 10 })}
                    className="w-full sm:w-1/3 bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded-lg outline-none focus:border-ink"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="border border-line bg-panel text-ink hover:bg-mute/10 font-oswald text-xs uppercase tracking-widest px-6 py-3.5 rounded-lg transition-colors font-medium min-h-[44px]"
            >
              Reset to Default
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-lg hover:bg-camelDeep transition-all duration-200 font-semibold shadow-sm min-h-[44px]"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-bg border border-line rounded-xl p-5 sm:p-6 shadow-sm2 space-y-4 sticky top-6">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <div>
                <h3 className="font-oswald text-sm uppercase font-semibold text-ink">
                  Interactive Live Preview
                </h3>
                <p className="text-[0.65rem] text-mute font-inter">
                  Click &amp; drag elements below to position visually.
                </p>
              </div>

              {/* Device Selector Sync */}
              <div className="flex p-1 bg-panel border border-line rounded-lg">
                <button
                  type="button"
                  onClick={() => setDeviceTab('desktop')}
                  className={`font-oswald text-[0.65rem] uppercase px-3 py-1 rounded transition-colors ${
                    deviceTab === 'desktop' ? 'bg-ink text-bg font-bold' : 'text-mute'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceTab('mobile')}
                  className={`font-oswald text-[0.65rem] uppercase px-3 py-1 rounded transition-colors ${
                    deviceTab === 'mobile' ? 'bg-ink text-bg font-bold' : 'text-mute'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Canvas Frame Container */}
            <div className="flex justify-center bg-panel p-3 rounded-lg overflow-hidden border border-line">
              <div
                ref={previewCanvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`transition-all duration-300 ${
                  deviceTab === 'mobile' ? 'w-[260px] h-[480px]' : 'w-full aspect-[16/9]'
                } rounded-lg overflow-hidden relative shadow-md bg-ink text-white select-none touch-none`}
              >
                {/* Background Image */}
                {deviceTab === 'mobile' && normalizedHero.mobile_image ? (
                  <img
                    src={normalizedHero.mobile_image}
                    alt="Mobile Hero"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : normalizedHero.desktop_image ? (
                  <img
                    src={normalizedHero.desktop_image}
                    alt="Desktop Hero"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center text-neutral-500 font-oswald uppercase text-xs pointer-events-none">
                    Default Photography Active
                  </div>
                )}

                {/* Dark Overlay */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none transition-opacity"
                  style={{ opacity: normalizedHero.overlay_opacity / 100 }}
                />

                {/* Hidden Badge */}
                {!normalizedHero.enabled && (
                  <div className="absolute top-3 right-3 bg-error text-white font-oswald text-[0.6rem] uppercase px-2 py-0.5 rounded font-bold z-30 pointer-events-none">
                    HERO DISABLED
                  </div>
                )}

                {/* Render Positioned Elements */}
                {(['eyebrow', 'mainHeading', 'subDescription', 'cta1', 'cta2'] as ElementKey[]).map(key => {
                  const el = normalizedHero[key];
                  if (!el || !el.enabled || !el.text) return null;
                  const cfg = el[deviceTab];
                  const isSelected = activeElementKey === key;

                  const transformStr = getTransform(cfg.alignHorizontal, cfg.alignVertical);
                  const scaleFactor = deviceTab === 'desktop' ? 0.45 : 0.65; // scale factor for admin preview box

                  return (
                    <div
                      key={key}
                      onPointerDown={e => handlePointerDown(key, e)}
                      style={{
                        position: 'absolute',
                        left: `${cfg.xPosition}%`,
                        top: `${cfg.yPosition}%`,
                        transform: transformStr,
                        textAlign: cfg.textAlign || 'left',
                        fontSize: `${Math.round((cfg.fontSize || 14) * scaleFactor)}px`,
                        lineHeight: cfg.lineHeight ? `${cfg.lineHeight}` : '1.2',
                        maxWidth: cfg.maxWidth ? `${Math.round(cfg.maxWidth * scaleFactor)}px` : 'none',
                        color: el.textColor || '#FFFFFF',
                        fontWeight: el.fontWeight || 'normal',
                        letterSpacing: el.letterSpacing || 'normal',
                        zIndex: el.zIndex || 10,
                      }}
                      className={`cursor-grab active:cursor-grabbing border transition-shadow rounded px-1.5 py-0.5 whitespace-pre-wrap ${
                        isSelected
                          ? 'border-camel ring-2 ring-camel/50 bg-black/40 font-bold'
                          : 'border-transparent hover:border-white/40'
                      }`}
                    >
                      {key.includes('cta') ? (
                        <span
                          className="inline-block px-3 py-1 rounded text-center"
                          style={{
                            color: el.textColor,
                            backgroundColor: (el as any).bgColor || '#FFFFFF',
                            borderColor: (el as any).borderColor || '#FFFFFF',
                            borderWidth: `${(el as any).borderWidth || 1}px`,
                          }}
                        >
                          {el.text}
                        </span>
                      ) : (
                        el.text
                      )}
                      {isSelected && (
                        <span className="absolute -top-4 left-0 bg-camel text-black font-oswald text-[0.55rem] uppercase px-1 rounded font-bold shadow pointer-events-none">
                          {key} ({cfg.xPosition}%, {cfg.yPosition}%)
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[0.68rem] text-mute text-center font-inter">
              Drag selected elements inside preview frame above to position visually in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
