'use client';
import { useState } from 'react';

type ShareModalProps = {
  title: string;
  url?: string;
  isOpen: boolean;
  onClose: () => void;
};

export function ShareModal({ title, url, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  if (!isOpen) return null;

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `D'VERO — ${title}`,
          text: `Check out ${title} on D'VERO Formalwear`,
          url: shareUrl,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    }
  }

  function handleCopy() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Check out ${title} on D'VERO: `);

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg border border-line rounded-lg shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-mute hover:text-ink font-oswald text-xs uppercase tracking-wider"
        >
          ✕
        </button>

        <h3 className="font-oswald text-xl uppercase mb-1">Share Garment</h3>
        <p className="text-mute text-xs mb-6 truncate">{title}</p>

        <div className="flex flex-col gap-3">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full bg-ink text-bg font-oswald text-xs tracking-widest uppercase py-3 rounded-sm hover:bg-camelDeep transition-colors"
            >
              Share via App...
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=${encodedText}${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-line hover:border-ink py-3 px-4 rounded-sm font-oswald text-xs tracking-wider uppercase transition-colors"
            >
              <span>WhatsApp</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border border-line hover:border-ink py-3 px-4 rounded-sm font-oswald text-xs tracking-wider uppercase transition-colors"
            >
              <span>X (Twitter)</span>
            </a>
          </div>

          <div className="mt-3">
            <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Product Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-panel border border-line text-xs font-mono px-3 py-2 rounded-sm text-ink outline-none"
              />
              <button
                onClick={handleCopy}
                className="bg-camel text-ink font-oswald text-xs tracking-wider uppercase px-4 py-2 rounded-sm hover:bg-camelDeep hover:text-bg transition-colors"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
