'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true); setError('');
    const fd = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      const message = err?.message || '';
      if (message.toLowerCase().includes('rate limit exceeded')) {
        setError('Too many requests. Please wait a few minutes before requesting another reset email.');
      } else {
        setError(message || 'Could not send reset link.');
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  }

  return (
    <main className="page-fade py-12 md:py-20 min-h-[60vh]">
      <div className="max-w-[420px] mx-auto px-5">
        <div className="bg-panel rounded-md border border-line shadow-lg2 p-9 text-center">
          <h2 className="font-oswald text-2xl uppercase mb-2">Reset Password</h2>
          {sent ? (
            <p className="text-sm text-mute">Check your email for a password reset link.</p>
          ) : (
            <>
              <p className="text-sm text-mute mb-8">Enter your email and we&apos;ll send you a link to reset your password.</p>
              <form onSubmit={handleSubmit} className="text-left flex flex-col gap-4">
                <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Email</label><input required name="email" type="email" className="w-full border border-line bg-bg rounded-sm px-3 py-2.5 outline-none focus:border-camelDeep" /></div>
                {error && <p className="text-error text-sm">{error}</p>}
                <button disabled={loading || isSubmittingRef.current} type="submit" className="w-full bg-ink text-bg py-3.5 rounded-sm font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
          <Link href="/login" className="inline-block mt-6 font-oswald text-sm tracking-wider uppercase border-b border-ink">Back To Login →</Link>
        </div>
      </div>
    </main>
  );
}
