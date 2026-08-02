'use client';
import { useEffect, useState } from 'react';
import { AuthFormCore, AuthSuccessResult } from '@/components/AuthFormCore';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  onAuthSuccess?: (result: AuthSuccessResult) => void;
};

export function AuthModal({
  isOpen,
  onClose,
  title = "Welcome to D'VERO",
  subtitle = 'Experience personalized shopping and tailored luxury.',
  onAuthSuccess,
}: AuthModalProps) {
  const [screen, setScreen] = useState<'choice' | 'login' | 'signup'>('choice');

  useEffect(() => {
    if (isOpen) setScreen('choice');
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSuccess(result: AuthSuccessResult) {
    onClose();
    onAuthSuccess?.(result);
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-ink/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg border-t sm:border border-line rounded-t-xl sm:rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-slideUp sm:animate-fadeIn space-y-6 max-h-[92vh] overflow-y-auto">
        {screen !== 'choice' && (
          <button
            onClick={() => setScreen('choice')}
            aria-label="Back"
            className="absolute top-4 left-4 text-mute hover:text-ink font-oswald text-xs uppercase min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            ←
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 text-mute hover:text-ink font-oswald text-xs uppercase min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          ✕
        </button>

        {screen === 'choice' ? (
          <>
            <div className="text-center space-y-2 pt-2 sm:pt-0">
              <div className="font-cinzel text-xl sm:text-2xl tracking-[0.18em] uppercase text-ink">{title}</div>
              <p className="text-mute text-xs sm:text-sm font-inter leading-relaxed">{subtitle}</p>
            </div>

            <div className="bg-panel border border-line rounded-lg p-4 space-y-2 text-xs font-oswald uppercase tracking-wider text-ink/90">
              <div className="flex items-center gap-2.5">
                <span className="text-camelDeep font-bold">✓</span>
                <span>Track & Manage Orders</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-camelDeep font-bold">✓</span>
                <span>Saved Addresses & Fast Checkout</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-camelDeep font-bold">✓</span>
                <span>Personalized Atelier Wishlist</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-camelDeep font-bold">✓</span>
                <span>Easy 14-Day Doorstep Returns</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => setScreen('login')}
                className="w-full bg-ink text-bg font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm hover:bg-camelDeep transition-all min-h-[44px] shadow-sm2"
              >
                Sign In
              </button>

              <button
                onClick={() => setScreen('signup')}
                className="w-full border border-line bg-panel text-ink font-oswald text-xs tracking-widest uppercase py-3.5 rounded-sm hover:border-ink transition-all min-h-[44px]"
              >
                Create Account
              </button>

              <button
                onClick={onClose}
                className="w-full font-oswald text-[0.68rem] tracking-wider uppercase text-mute hover:text-ink pt-1"
              >
                Continue Browsing
              </button>
            </div>
          </>
        ) : (
          <div className="pt-4">
            <AuthFormCore
              initialMode={screen}
              onSuccess={handleSuccess}
              onModeChange={next => setScreen(next)}
              variant="modal"
            />
          </div>
        )}
      </div>
    </div>
  );
}
