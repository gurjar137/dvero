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
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[100] animate-fadeIn max-w-[90vw] sm:max-w-md">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-md shadow-2xl border font-oswald text-xs uppercase tracking-wider backdrop-blur-md ${
          type === 'error'
            ? 'bg-error text-bg border-error'
            : type === 'info'
            ? 'bg-ink/95 text-bg border-ink'
            : 'bg-ink/95 text-bg border-camelDeep'
        }`}
      >
        <span className="text-camel font-bold text-sm">{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span className="truncate">{message}</span>
        <button onClick={onClose} className="ml-3 opacity-70 hover:opacity-100 min-w-[32px] min-h-[32px] flex items-center justify-center">
          ✕
        </button>
      </div>
    </div>
  );
}
