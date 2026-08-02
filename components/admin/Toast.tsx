'use client';
import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);

  const showToast = useCallback((m: string) => {
    setMsg(m); setShow(true);
    setTimeout(() => setShow(false), 2400);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-bg px-6 py-3.5 rounded-lg shadow-lg2 text-sm z-[500] transition-all ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
