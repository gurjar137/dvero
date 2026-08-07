'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';

// Structural email shape check (RFC-5322-ish, simplified): local-part@label(.label)+
// Requires at least one dot in the domain, so single-label hosts like "gmail", "test",
// "xyz", or "localhost" are rejected outright.
const EMAIL_SHAPE_REGEX =
  /^(?!\.)(?!.*\.\.)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

// Trusted TLD list (equivalent to the Public Suffix List's set of valid top-level domains).
// A domain is only accepted if its final label is a real, publicly registered TLD.
// This is what rejects things like "abc@gmail.iy" ("iy" is not an assigned TLD)
// while still accepting real ccTLDs/gTLDs such as .com, .in, .co.uk, etc.
const VALID_TLDS = new Set([
  // Country-code TLDs (ISO 3166-1 based ccTLDs currently in use)
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
  // Generic TLDs (gTLDs)
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

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      isSubmittingRef.current = false;
      return;
    }

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
