'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.currentTarget);
    const p1 = fd.get('password') as string, p2 = fd.get('confirm') as string;
    if (p1.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return; }
    if (p1 !== p2) { setError('Passwords do not match.'); setLoading(false); return; }
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push('/profile'), 1500);
    } catch (err: any) {
      setError(err.message || 'Could not reset password.');
    } finally { setLoading(false); }
  }

  return (
    <main className="page-fade py-12 md:py-20 min-h-[60vh]">
      <div className="max-w-[420px] mx-auto px-5">
        <div className="bg-panel rounded-md border border-line shadow-lg2 p-9 text-center">
          <h2 className="font-oswald text-2xl uppercase mb-2">Set New Password</h2>
          {!ready && !done && (
            <p className="text-sm text-mute">Open this page from the reset link in your email.</p>
          )}
          {ready && !done && (
            <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4 mt-6">
              <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">New Password</label><input required name="password" type="password" minLength={6} className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
              <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Confirm Password</label><input required name="confirm" type="password" minLength={6} className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
              {error && <p className="text-error text-sm">{error}</p>}
              <button disabled={loading} type="submit" className="w-full bg-ink text-bg py-3.5 rounded-sm font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors disabled:opacity-60">
                {loading ? 'Saving…' : 'Save New Password'}
              </button>
            </form>
          )}
          {done && <p className="text-success text-sm mt-4">Password updated. Redirecting…</p>}
          <Link href="/login" className="inline-block mt-6 font-oswald text-sm tracking-wider uppercase border-b border-ink">Back To Login →</Link>
        </div>
      </div>
    </main>
  );
}
