'use client';
import { useState } from 'react';
import { HomepageSection } from '@/lib/types';
import { ColorInput, ToggleSwitch } from '@/components/admin/FormPrimitives';
import { ImageUploadField } from '@/components/admin/ImageUploadField';

const IMAGE_GALLERY_SECTIONS = new Set(['premium_fabrics', 'instagram']);

export function SectionsManager({ sections, onChange }: { sections: HomepageSection[]; onChange: (next: HomepageSection[]) => void }) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const ordered = [...sections].sort((a, b) => a.order - b.order);

  function reorder(from: number, to: number) {
    const next = [...ordered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next.map((s, i) => ({ ...s, order: i })));
  }

  function patchSection(id: string, patch: Partial<HomepageSection>) {
    onChange(sections.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  return (
    <div className="space-y-8">
      <div className="bg-bg border border-line rounded-lg p-5 sm:p-6 shadow-sm2">
        <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3 mb-4">3. Homepage Sections — Drag &amp; Drop Order</h3>
        <div className="space-y-2">
          {ordered.map((section, i) => (
            <div
              key={section.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null && dragIndex !== i) reorder(dragIndex, i);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
              className={`flex items-center gap-3 bg-panel border border-line rounded px-4 py-3 cursor-grab active:cursor-grabbing transition-opacity ${
                dragIndex === i ? 'opacity-40' : 'opacity-100'
              }`}
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 text-mute shrink-0">
                <circle cx="6" cy="5" r="1.3" fill="currentColor" /><circle cx="6" cy="10" r="1.3" fill="currentColor" /><circle cx="6" cy="15" r="1.3" fill="currentColor" />
                <circle cx="14" cy="5" r="1.3" fill="currentColor" /><circle cx="14" cy="10" r="1.3" fill="currentColor" /><circle cx="14" cy="15" r="1.3" fill="currentColor" />
              </svg>
              <span className="font-oswald text-xs uppercase text-mute w-5 shrink-0">{i + 1}</span>
              <span className="font-oswald text-sm uppercase text-ink flex-1">{section.label}</span>
              <ToggleSwitch checked={section.enabled} onChange={v => patchSection(section.id, { enabled: v })} />
              <button
                onClick={() => setOpenId(openId === section.id ? null : section.id)}
                className="font-oswald text-[0.68rem] uppercase text-camelDeep border-b border-camelDeep shrink-0"
              >
                {openId === section.id ? 'Close' : 'Customize'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {ordered.filter(s => s.id === openId).map(section => (
        <div key={section.id} className="bg-bg border border-line rounded-lg p-5 sm:p-6 space-y-5 shadow-sm2">
          <h3 className="font-oswald text-sm uppercase font-semibold text-ink border-b border-line pb-3">4. Section Customization — {section.label}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Title</label>
              <input
                type="text"
                value={section.title}
                onChange={e => patchSection(section.id, { title: e.target.value })}
                className="w-full bg-panel border border-line px-3 py-2 text-sm font-playfair text-ink rounded outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Subtitle</label>
              <input
                type="text"
                value={section.subtitle}
                onChange={e => patchSection(section.id, { subtitle: e.target.value })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Description</label>
              <textarea
                value={section.description}
                onChange={e => patchSection(section.id, { description: e.target.value })}
                rows={2}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-inter text-ink rounded outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Button Text</label>
              <input
                type="text"
                value={section.button_text}
                onChange={e => patchSection(section.id, { button_text: e.target.value })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-oswald text-ink rounded outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Button Link</label>
              <input
                type="text"
                value={section.button_link}
                onChange={e => patchSection(section.id, { button_link: e.target.value })}
                className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line">
            <ColorInput label="Background Color" value={section.bg_color} onChange={v => patchSection(section.id, { bg_color: v })} />
            <ColorInput label="Text Color" value={section.text_color} onChange={v => patchSection(section.id, { text_color: v })} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-line">
            <span className="font-oswald text-xs uppercase text-mute">Visibility</span>
            <ToggleSwitch label={section.enabled ? 'Visible' : 'Hidden'} checked={section.enabled} onChange={v => patchSection(section.id, { enabled: v })} />
          </div>

          {IMAGE_GALLERY_SECTIONS.has(section.id) && (
            <div className="pt-2 border-t border-line space-y-3">
              <span className="font-oswald text-xs uppercase text-mute block">Gallery Images</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(section.images || []).map((img, i) => (
                  <div key={i} className="relative">
                    <ImageUploadField
                      label={`Image ${i + 1}`}
                      value={img}
                      onChange={v => {
                        const next = [...(section.images || [])];
                        next[i] = v;
                        patchSection(section.id, { images: next });
                      }}
                      aspect="aspect-square"
                      folder={`homepage/${section.id}`}
                    />
                    <button
                      onClick={() => patchSection(section.id, { images: (section.images || []).filter((_, idx) => idx !== i) })}
                      className="mt-1.5 w-full text-center bg-error/10 text-error font-oswald text-[0.65rem] uppercase py-1.5 rounded border border-error/20"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => patchSection(section.id, { images: [...(section.images || []), ''] })}
                className="border border-line bg-panel hover:bg-line text-ink font-oswald text-[0.68rem] uppercase px-4 py-2 rounded"
              >
                + Add Gallery Image
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
