'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

export type AuthSuccessResult = {
  mode: 'login' | 'signup';
  name?: string;
};

type AuthFormCoreProps = {
  initialMode: 'login' | 'signup';
  onSuccess: (result: AuthSuccessResult) => void;
  onModeChange?: (mode: 'login' | 'signup') => void;
  showForgotPasswordLink?: boolean;
  showSwitchModeLink?: boolean;
  switchModeHrefFor?: (mode: 'login' | 'signup') => string;
  variant?: 'page' | 'modal';
};

export function AuthFormCore({
  initialMode,
  onSuccess,
  onModeChange,
  showForgotPasswordLink = true,
  showSwitchModeLink = true,
  switchModeHrefFor,
  variant = 'page',
}: AuthFormCoreProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setPasswordInput('');
  }, [initialMode]);

  function changeMode(next: 'login' | 'signup') {
    setMode(next);
    setError('');
    setPasswordInput('');
    onModeChange?.(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const email = (fd.get('email') as string).trim();
    const password = fd.get('password') as string;

    try {
      if (mode === 'signup') {
        const name = (fd.get('name') as string).trim();

        console.log("SIGNUP START");

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });

        console.log({ data, error: signUpError });

        if (data?.user) {
          if (!data.session) {
            await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
          }
          setError('');
          onSuccess({ mode: 'signup', name: name || undefined });
          return;
        }

        if (signUpError) {
          console.error(signUpError);
          throw signUpError;
        }
      } else {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.error('Supabase auth.signInWithPassword Error:', signInError);
          throw signInError;
        }

        const userName = authData.user?.user_metadata?.full_name || authData.user?.email || undefined;
        setError('');
        onSuccess({ mode: 'login', name: userName });
      }
    } catch (err: any) {
      console.error('Supabase Auth Exception:', err);
      setError(err?.message || '');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  const switchHref = switchModeHrefFor
    ? switchModeHrefFor(mode === 'signup' ? 'login' : 'signup')
    : mode === 'signup' ? '/login' : '/signup';

  return (
    <div className={variant === 'modal' ? 'text-center' : 'bg-panel rounded-md border border-line shadow-lg2 p-7 sm:p-9 text-center'}>
      <h2 className="font-oswald text-2xl uppercase mb-2">
        {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
      </h2>
      <p className="text-sm text-mute mb-8">
        {mode === 'signup'
          ? 'Sign up to save addresses and track your formalwear orders.'
          : 'Log in to view your orders, saved addresses, and account details.'}
      </p>
      <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Full Name</label>
            <input
              required
              name="name"
              type="text"
              placeholder="Full Name"
              className="w-full border border-line bg-bg rounded-sm px-3.5 py-3 outline-none text-sm text-ink focus:border-camelDeep"
            />
          </div>
        )}
        <div>
          <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Email Address</label>
          <input
            required
            name="email"
            type="email"
            placeholder="name@domain.com"
            className="w-full border border-line bg-bg rounded-sm px-3.5 py-3 outline-none text-sm text-ink focus:border-camelDeep"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute">Password</label>
            {mode === 'login' && showForgotPasswordLink && (
              <Link href="/forgot-password" className="font-oswald text-[0.68rem] tracking-wider uppercase text-camelDeep">
                Forgot?
              </Link>
            )}
          </div>
          <input
            required
            name="password"
            type="password"
            minLength={6}
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-line bg-bg rounded-sm px-3.5 py-3 outline-none text-sm text-ink focus:border-camelDeep font-mono"
          />
          {mode === 'signup' && <PasswordStrengthMeter password={passwordInput} />}
        </div>

        {error && <p className="text-error text-xs font-oswald uppercase mt-1">{error}</p>}

        <button
          disabled={loading || isSubmittingRef.current}
          type="submit"
          className="w-full bg-ink text-bg py-3.5 rounded-sm font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-all disabled:opacity-60 min-h-[44px] shadow-sm2"
        >
          {loading ? (mode === 'signup' ? 'Creating Account…' : 'Logging In…') : mode === 'signup' ? 'Create Account' : 'Log In'}
        </button>
      </form>
      {showSwitchModeLink && (
        <p className="text-sm text-mute mt-6">
          {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          {switchModeHrefFor ? (
            <Link href={switchHref} className="text-camelDeep underline">
              {mode === 'signup' ? 'Log in' : 'Create one'}
            </Link>
          ) : (
            <button type="button" onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')} className="text-camelDeep underline">
              {mode === 'signup' ? 'Log in' : 'Create one'}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
