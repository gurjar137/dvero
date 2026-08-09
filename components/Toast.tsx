'use client';
import { useEffect } from 'react';

type ToastProps = {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
};

export function Toast({ message, type = 'success', onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed bottom-24 sm:bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[100] animate-fadeIn max-w-[90vw] sm:max-w-md pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-2xl border font-oswald text-xs uppercase tracking-wider backdrop-blur-md transition-all ${
          type === 'error'
            ? 'bg-error text-bg border-error'
            : type === 'info'
            ? 'bg-ink/95 text-bg border-ink'
            : 'bg-[#111111]/95 text-[#FAF9F6] border-[#B78F5E]/70 shadow-[0_8px_30px_rgba(0,0,0,0.35)]'
        }`}
      >
        <span className="text-camel font-bold text-sm flex-shrink-0">{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span className="truncate font-medium">{message}</span>
        <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 min-w-[28px] min-h-[28px] flex items-center justify-center text-xs" aria-label="Dismiss notification">
          ✕
        </button>
      </div>
    </div>
  );
}
