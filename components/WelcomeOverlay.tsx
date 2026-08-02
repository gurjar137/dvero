'use client';
import { useEffect } from 'react';

type WelcomeOverlayProps = {
  title: string;
  name?: string;
  subtitle: string;
  onComplete: () => void;
  duration?: number;
};

export function WelcomeOverlay({
  title,
  name,
  subtitle,
  onComplete,
  duration = 2500,
}: WelcomeOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-[250] bg-ink/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="bg-bg border border-line rounded-xl shadow-2xl p-8 sm:p-12 max-w-md w-full text-center relative space-y-6 overflow-hidden transform scale-100 animate-slideUp">
        {/* Soft Golden Glow Ring */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full bg-camel/30 blur-2xl pointer-events-none animate-pulse" />

        {/* 60fps Animated Checkmark */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-md">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#1D1A15"
              strokeWidth="3.5"
              strokeDasharray="345"
              strokeDashoffset="345"
              style={{ animation: 'drawCircle 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            />
            <path
              d="M28 52 L44 68 L74 34"
              fill="none"
              stroke="#B78F5E"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="70"
              strokeDashoffset="70"
              style={{ animation: 'drawCheck 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.7s' }}
            />
          </svg>
        </div>

        <div className="space-y-2 relative z-10">
          <div className="font-cinzel text-xl sm:text-2xl tracking-[0.14em] uppercase text-ink">
            {title}
            {name && <span className="block font-oswald text-camelDeep text-lg sm:text-xl mt-1 normal-case">{name}</span>}
          </div>
          <p className="text-mute text-xs sm:text-sm font-inter leading-relaxed max-w-xs mx-auto pt-1">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar Indicator */}
        <div className="pt-2 relative z-10">
          <div className="w-32 bg-line h-1 mx-auto rounded-full overflow-hidden">
            <div className="bg-camelDeep h-full animate-[progress_2.5s_linear_forwards] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
