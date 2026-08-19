'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

const EMAIL_SHAPE_REGEX =
  /^(?!\.)(?!.*\.\.)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

const VALID_TLDS = new Set([
  'ac','ad','ae','af','ag','ai','al','am','ao','aq','ar','as','at','au','aw','ax','az',
  'ba','bb','bd','be','bf','bg','bh','bi','bj','bm','bn','bo','bq','br','bs','bt','bv','bw','by','bz',
  'ca','cc','cd','cf','cg','ch','ci','ck','cl','cm','cn','co','cr','cu','cv','cw','cx','cy','cz',
  'de','dj','dk','dm','do','dz',
  'ec','ee','eg','eh','er','es','et','eu',
  'fi','fj','fk','fm','fo','fr',
  'ga','gb','gd','ge','gf','gg','gh','gi','gl','gm','gn','gp','gq','gr','gs','gt','gu','gw','gy',
  'hk','hm','hn','hr','ht','hu',
  'id','ie','il','im','in','io','iq','ir','is','it',
  'je','jm','jo','jp',
  'ke','kg','kh','ki','km','kn','kp','kr','kw','ky','kz',
  'la','lb','lc','li','lk','lr','ls','lt','lu','lv','ly',
  'ma','mc','md','me','mg','mh','mk','ml','mm','mn','mo','mp','mq','mr','ms','mt','mu','mv','mw','mx','my','mz',
  'na','nc','ne','nf','ng','ni','nl','no','np','nr','nu','nz',
  'om',
  'pa','pe','pf','pg','ph','pk','pl','pm','pn','pr','ps','pt','pw','py',
  'qa',
  're','ro','rs','ru','rw',
  'sa','sb','sc','sd','se','sg','sh','si','sj','sk','sl','sm','sn','so','sr','ss','st','su','sv','sx','sy','sz',
  'tc','td','tf','tg','th','tj','tk','tl','tm','tn','to','tr','tt','tv','tw','tz',
  'ua','ug','uk','us','uy','uz',
  'va','vc','ve','vg','vi','vn','vu',
  'wf','ws',
  'ye','yt',
  'za','zm','zw',
  'com','org','net','edu','gov','mil','int','info','biz','name','pro','coop','museum',
  'aero','jobs','mobi','travel','xxx','asia','cat','tel','post','xyz',
  'online','site','tech','store','app','dev','cloud','digital','email','live','news','blog',
  'shop','design','agency','solutions','expert','guru','life','world','today','network',
  'company','group','systems','services','media','studio','team','work','zone','click','link',
  'run','fund','capital','finance','market','ventures','holdings','industries','energy',
  'construction','engineering','education','academy','institute','university','school',
  'training','courses','science','software','computer',
]);

function isValidEmail(rawEmail: string): boolean {
  const email = rawEmail.trim();
  if (!email || email.length > 254 || !EMAIL_SHAPE_REGEX.test(email)) return false;

  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  const labels = domain.split('.');
  const tld = labels[labels.length - 1];

  return VALID_TLDS.has(tld);
}

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
  onSocialAuth?: (provider: 'google' | 'apple') => void;
};

export function AuthFormCore({
  initialMode,
  onSuccess,
  onModeChange,
  showForgotPasswordLink = true,
  showSwitchModeLink = true,
  switchModeHrefFor,
  variant = 'page',
  onSocialAuth,
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

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      if (mode === 'signup') {
        const name = (fd.get('name') as string).trim();

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });

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
    <div className={variant === 'modal' ? 'w-full max-w-md mx-auto' : 'bg-panel rounded-xl border border-line shadow-lg2 p-7 sm:p-9 text-center max-w-md mx-auto'}>
      <div className="text-center mb-6">
        <h2 className="font-playfair text-xl sm:text-2xl uppercase tracking-[0.15em] text-[#111111]">
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </h2>
        <p className="text-xs text-[#666666] font-inter mt-1">
          {mode === 'signup'
            ? 'Sign up to save addresses and track your formalwear orders.'
            : 'Enter your credentials to access your D’VERO account.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4">
        {mode === 'signup' && (
          <div>
            <label className="block font-inter text-[0.65rem] tracking-[0.18em] uppercase text-[#666666] font-medium mb-1.5">
              Full Name
            </label>
            <input
              required
              name="name"
              type="text"
              placeholder="Your Full Name"
              className="w-full border border-[#D5D3CC] bg-white rounded-lg px-3.5 py-3 outline-none text-xs text-[#111111] focus:border-[#111111] transition-all font-inter shadow-xs"
            />
          </div>
        )}

        <div>
          <label className="block font-inter text-[0.65rem] tracking-[0.18em] uppercase text-[#666666] font-medium mb-1.5">
            Email Address
          </label>
          <input
            required
            name="email"
            type="email"
            placeholder="name@domain.com"
            className="w-full border border-[#D5D3CC] bg-white rounded-lg px-3.5 py-3 outline-none text-xs text-[#111111] focus:border-[#111111] transition-all font-inter shadow-xs"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block font-inter text-[0.65rem] tracking-[0.18em] uppercase text-[#666666] font-medium">
              Password
            </label>
            {mode === 'login' && showForgotPasswordLink && (
              <Link href="/forgot-password" className="font-inter text-[0.65rem] tracking-wider uppercase text-[#8B7355] hover:underline">
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
            className="w-full border border-[#D5D3CC] bg-white rounded-lg px-3.5 py-3 outline-none text-xs text-[#111111] focus:border-[#111111] transition-all font-mono shadow-xs"
          />
          {mode === 'signup' && <PasswordStrengthMeter password={passwordInput} />}
        </div>

        {error && <p className="text-red-600 text-xs font-inter mt-1">{error}</p>}

        <button
          disabled={loading || isSubmittingRef.current}
          type="submit"
          className="w-full bg-[#111111] text-[#FAF9F6] py-3.5 rounded-lg font-inter text-xs tracking-[0.18em] uppercase hover:bg-[#8B7355] transition-all disabled:opacity-60 min-h-[44px] shadow-sm font-semibold flex items-center justify-center gap-2 group cursor-pointer mt-1"
        >
          <span>{loading ? (mode === 'signup' ? 'Creating Account…' : 'Logging In…') : mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
          <span className="group-hover:translate-x-1 transition-transform font-normal">→</span>
        </button>
      </form>

      {onSocialAuth && (
        <div className="mt-4 pt-4 border-t border-[#EAEAEA] space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px bg-[#E2E0D8] flex-1" />
            <span className="font-inter text-[0.6rem] tracking-[0.15em] uppercase text-[#999999] font-medium">
              OR CONTINUE WITH
            </span>
            <div className="h-px bg-[#E2E0D8] flex-1" />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => onSocialAuth('google')}
              type="button"
              className="flex-1 border border-[#D5D3CC] bg-white hover:border-[#111111] py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-inter text-[#333333] hover:text-[#111111] transition-all cursor-pointer shadow-xs min-h-[40px]"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="font-medium text-[0.72rem]">Google</span>
            </button>

            <button
              onClick={() => onSocialAuth('apple')}
              type="button"
              className="flex-1 border border-[#D5D3CC] bg-white hover:border-[#111111] py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-inter text-[#333333] hover:text-[#111111] transition-all cursor-pointer shadow-xs min-h-[40px]"
            >
              <svg className="w-4 h-4 shrink-0 fill-current text-[#111111]" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.1c.67-.82 1.13-1.96.99-3.1-.98.04-2.17.65-2.86 1.46-.62.72-1.16 1.88-1.01 3 1.1.08 2.22-.54 2.88-1.36z" />
              </svg>
              <span className="font-medium text-[0.72rem]">Apple</span>
            </button>
          </div>
        </div>
      )}

      {showSwitchModeLink && (
        <p className="text-xs text-[#666666] font-inter mt-5 text-center">
          {mode === 'signup' ? 'Already have an account?' : 'New to D’VERO?'}{' '}
          {switchModeHrefFor ? (
            <Link href={switchHref} className="text-[#8B7355] font-semibold underline hover:text-[#111111]">
              {mode === 'signup' ? 'Sign in' : 'Create account'}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => changeMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-[#8B7355] font-semibold underline hover:text-[#111111] cursor-pointer"
            >
              {mode === 'signup' ? 'Sign in' : 'Create account'}
            </button>
          )}
        </p>
      )}
    </div>
  );
}
