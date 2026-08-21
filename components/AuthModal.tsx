'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';
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
  title,
  subtitle,
  onAuthSuccess,
}: AuthModalProps) {
  const { authError: globalAuthError, clearAuthError } = useAuth();
  const [screen, setScreen] = useState<'choice' | 'login' | 'signup'>('choice');
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScreen('choice');
      setSocialLoading(null);
      setLocalError(null);
    }
  }, [isOpen]);

  const activeError = localError || globalAuthError;

  if (!isOpen) return null;

  function handleClose() {
    clearAuthError();
    setLocalError(null);
    onClose();
  }

  function handleSuccess(result: AuthSuccessResult) {
    handleClose();
    onAuthSuccess?.(result);
  }

  async function handleSocialAuth(provider: 'google' = 'google') {
    setLocalError(null);
    clearAuthError();
    setSocialLoading('google');

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/profile`,
        },
      });

      if (error) {
        console.error('Supabase OAuth Error:', error);
        setLocalError('Unable to sign in with Google. Please try again.');
      }
    } catch (err: any) {
      console.error('Social login exception:', err);
      setLocalError('Unable to sign in with Google. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] bg-[#111111]/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      onClick={e => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-[600px] bg-[#FAF9F6] border border-[#EAEAEA] rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-6 sm:p-8 animate-scaleUp overflow-y-auto max-h-[92vh] space-y-6">
        {/* Back Button (Left top) */}
        {screen !== 'choice' && (
          <button
            onClick={() => {
              setScreen('choice');
              setLocalError(null);
              clearAuthError();
            }}
            aria-label="Back to choices"
            className="absolute top-4 left-4 sm:top-5 sm:left-5 text-[#777777] hover:text-[#111111] p-2 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Close Button (Right top) */}
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 text-[#777777] hover:text-[#111111] p-2 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px] cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header Hierarchy */}
        <div className="text-center pt-1">
          <span className="font-inter text-[0.62rem] tracking-[0.25em] uppercase text-[#888888] font-medium block">
            {screen === 'signup' ? 'JOIN THE ATELIER' : 'WELCOME BACK'}
          </span>
          <h2 className="font-playfair text-2xl sm:text-3xl tracking-[0.22em] uppercase text-[#111111] font-normal my-1">
            D'VERO
          </h2>
          <p className="text-[0.76rem] text-[#666666] font-inter max-w-sm mx-auto leading-relaxed">
            {subtitle || 'Sign in to access your orders, saved addresses & wishlist.'}
          </p>
        </div>

        {/* Error Banner inside Modal */}
        {activeError && (
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-[#8B7355] font-inter text-center leading-relaxed animate-fadeIn flex items-center justify-between gap-2">
            <span className="flex-1 font-medium">{activeError}</span>
            <button
              onClick={() => {
                setLocalError(null);
                clearAuthError();
              }}
              className="text-[#8B7355] hover:text-[#111111] font-bold px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {screen === 'choice' ? (
          <>
            {/* Main Content Grid (Two Column Desktop / Single Column Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch pt-1">
              {/* Left Column - Account Benefits */}
              <div className="md:col-span-5 bg-[#F4F3EE] border border-[#EBE8E0] rounded-xl p-4 sm:p-4.5 flex flex-col justify-center space-y-3">
                <span className="font-inter text-[0.58rem] tracking-[0.2em] uppercase text-[#888888] font-semibold block mb-0.5">
                  CLIENT PRIVILEGES
                </span>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8B7355] shrink-0">
                      <path d="M6 7h12l1 14H5L6 7Z" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 7V5a3 3 0 0 1 6 0v2" strokeLinecap="round" />
                    </svg>
                    <span className="font-inter text-[0.72rem] text-[#333333] font-medium">Track & manage orders</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8B7355] shrink-0">
                      <path d="M12 21s-7-5.33-7-10a7 7 0 0 1 14 0c0 4.67-7 10-7 10z" />
                      <circle cx="12" cy="11" r="2.5" />
                    </svg>
                    <span className="font-inter text-[0.72rem] text-[#333333] font-medium">Faster checkout with saved addresses</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8B7355] shrink-0">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="font-inter text-[0.72rem] text-[#333333] font-medium">Save pieces to your wishlist</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-[#8B7355] shrink-0">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span className="font-inter text-[0.72rem] text-[#333333] font-medium">Easy 14-day doorstep returns</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Primary Actions & OAuth */}
              <div className="md:col-span-7 flex flex-col justify-center space-y-3">
                {/* Primary SIGN IN Button */}
                <button
                  onClick={() => {
                    setLocalError(null);
                    clearAuthError();
                    setScreen('login');
                  }}
                  className="w-full bg-[#111111] text-[#FAF9F6] font-inter text-xs tracking-[0.18em] uppercase py-3.5 px-5 rounded-lg hover:bg-[#8B7355] transition-all flex items-center justify-center gap-2 shadow-sm font-semibold group cursor-pointer min-h-[44px]"
                >
                  <span>SIGN IN</span>
                  <span className="group-hover:translate-x-1 transition-transform font-normal">→</span>
                </button>

                {/* CREATE ACCOUNT Button */}
                <button
                  onClick={() => {
                    setLocalError(null);
                    clearAuthError();
                    setScreen('signup');
                  }}
                  className="w-full bg-[#FAF9F6] border border-[#D5D3CC] text-[#111111] font-inter text-xs tracking-[0.18em] uppercase py-3.5 px-5 rounded-lg hover:border-[#111111] hover:bg-white transition-all flex items-center justify-center font-semibold shadow-xs cursor-pointer min-h-[44px]"
                >
                  <span>CREATE ACCOUNT</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-0.5">
                  <div className="h-px bg-[#E2E0D8] flex-1" />
                  <span className="font-inter text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-medium">
                    OR CONTINUE WITH
                  </span>
                  <div className="h-px bg-[#E2E0D8] flex-1" />
                </div>

                {/* Google Sign In Button */}
                <button
                  onClick={() => handleSocialAuth('google')}
                  disabled={socialLoading !== null}
                  type="button"
                  className="w-full border border-[#D5D3CC] bg-white hover:border-[#111111] hover:bg-[#FAF9F6] py-3.5 px-5 rounded-lg flex items-center justify-center gap-2.5 text-xs font-inter text-[#222222] hover:text-[#111111] transition-all cursor-pointer shadow-xs min-h-[44px] disabled:opacity-60 font-semibold tracking-[0.18em] uppercase"
                >
                  {socialLoading === 'google' ? (
                    <svg className="animate-spin h-4 w-4 text-[#111111]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>
                    {socialLoading === 'google' ? 'Connecting...' : 'Google'}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pt-1">
            <AuthFormCore
              initialMode={screen}
              onSuccess={handleSuccess}
              onModeChange={next => {
                setScreen(next);
                setLocalError(null);
                clearAuthError();
              }}
              variant="modal"
              onSocialAuth={handleSocialAuth}
            />
          </div>
        )}

        {/* Bottom Footer Area */}
        <div className="pt-3 border-t border-[#EAEAEA] flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[0.68rem] text-[#888888] font-inter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-[#888888]">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Secure & private</span>
          </div>

          <button
            onClick={handleClose}
            className="font-inter text-[0.68rem] text-[#999999] hover:text-[#111111] transition-colors underline cursor-pointer"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}
