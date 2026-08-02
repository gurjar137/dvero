'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from './Toast';

export function ImageUploadField({
  label,
  value,
  onChange,
  aspect = 'aspect-video',
  folder = 'homepage',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const showToast = useToast();

  async function upload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('product-images').getPublicUrl(path);
      onChange(pub.publicUrl);
      showToast(`${label} uploaded!`);
    } catch (err: any) {
      showToast('Image upload failed: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-oswald uppercase text-mute mb-1">{label}</label>
      <div className={`w-full ${aspect} bg-panel border border-line rounded mb-2 flex items-center justify-center overflow-hidden`}>
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[0.68rem] font-oswald uppercase text-mute px-3 text-center">No Image Set</span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Image URL..."
        className="w-full bg-panel border border-line px-3 py-2 text-xs font-mono text-ink rounded outline-none focus:border-ink mb-1.5"
      />
      <label className="block text-center border border-line bg-panel hover:bg-line text-ink font-oswald text-[0.68rem] uppercase py-2 rounded cursor-pointer">
        {uploading ? 'Uploading...' : `Upload ${label}`}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
        />
      </label>
    </div>
  );
}
