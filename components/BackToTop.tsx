'use client';
import { useState, useEffect } from 'react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function toggleVisibility() {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Back to top"
      className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 w-11 h-11 rounded-full bg-bg/85 backdrop-blur-md border border-line text-ink hover:bg-ink hover:text-bg transition-all duration-300 shadow-md2 flex items-center justify-center animate-fadeIn active:scale-95"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
