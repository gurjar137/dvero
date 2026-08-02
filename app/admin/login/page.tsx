'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAdminAuth } from '@/components/admin/AdminAuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { refresh } = useAdminAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError('');
    const fd = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: fd.get('email') as string, password: fd.get('password') as string });
      if (error) throw error;
      await refresh();
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your email and password.');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(183,143,94,0.18),transparent_60%)] bg-bg">
      <div className="w-full max-w-[400px] bg-panel border border-line rounded-xl shadow-lg2 p-11 text-center">
        <div className="font-cinzel text-2xl tracking-[0.14em] mb-1">D&apos;VERO</div>
        <div className="text-sm text-mute mb-8">Admin Panel — sign in to manage the store.</div>
        <form onSubmit={handleLogin} className="text-left flex flex-col gap-4">
          <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Email</label><input required name="email" type="email" autoFocus className="w-full border border-line bg-bg rounded-md px-3.5 py-2.5 outline-none focus:border-camelDeep" /></div>
          <div><label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-2">Password</label><input required name="password" type="password" className="w-full border border-line bg-bg rounded-md px-3.5 py-2.5 outline-none focus:border-camelDeep" /></div>
          <div className="text-error text-sm min-h-[1.2em]">{error}</div>
          <button disabled={loading} type="submit" className="w-full bg-ink text-bg py-3.5 rounded-md font-oswald text-sm tracking-wider uppercase hover:bg-camelDeep transition-colors disabled:opacity-60">
            {loading ? 'Logging In…' : 'Log In'}
          </button>
        </form>
        <p className="text-sm text-mute mt-6">Access is limited to registered D&apos;Vero admins.<br />Contact the store owner if you need an account.</p>
      </div>
    </div>
  );
}
