'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAdminAuth } from '@/components/admin/AdminAuthContext';
import { useToast } from '@/components/admin/Toast';

export default function AdminProfilePage() {
  const { admin, refresh } = useAdminAuth();
  const showToast = useToast();
  const [pwError, setPwError] = useState('');

  if (!admin) return null;

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('full_name') as string;
    try {
      const { error: e1 } = await supabase.from('profiles').update({ full_name: name }).eq('id', admin!.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.auth.updateUser({ data: { full_name: name } });
      if (e2) throw e2;
      showToast('Profile updated');
      refresh();
    } catch (err: any) {
      showToast('Could not update profile: ' + (err.message || ''));
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwError('');
    const fd = new FormData(e.currentTarget);
    const p1 = fd.get('password') as string, p2 = fd.get('confirm') as string;
    if (p1.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    if (p1 !== p2) { setPwError('Passwords do not match.'); return; }
    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (error) { setPwError(error.message); return; }
    showToast('Password changed successfully');
    e.currentTarget.reset();
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-oswald text-2xl uppercase">My Admin Profile</h1>
        <p className="text-sm text-mute mt-1">Update your personal administrator details and security credentials.</p>
      </div>

      <div className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-7 max-w-xl">
        <h3 className="font-oswald text-base uppercase border-b border-line pb-3 mb-4">Personal Details</h3>
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Full Name</label>
            <input required name="full_name" defaultValue={admin.full_name || ''} className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs text-ink outline-none focus:border-ink" />
          </div>
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Email Address</label>
            <input disabled value={admin.email} className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs text-ink opacity-60 font-mono" />
          </div>
          <button type="submit" className="w-full sm:w-auto bg-ink text-bg px-6 py-3.5 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors min-h-[44px]">
            Save Details
          </button>
        </form>
      </div>

      <div className="bg-panel border border-line rounded-xl shadow-sm2 p-5 sm:p-7 max-w-xl">
        <h3 className="font-oswald text-base uppercase border-b border-line pb-3 mb-4">Change Security Password</h3>
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">New Password</label>
            <input required type="password" name="password" minLength={6} className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink" />
          </div>
          <div>
            <label className="block font-oswald text-xs tracking-wider uppercase text-mute mb-1.5">Confirm New Password</label>
            <input required type="password" name="confirm" minLength={6} className="w-full border border-line bg-bg rounded px-3.5 py-3 text-xs font-mono text-ink outline-none focus:border-ink" />
          </div>
          {pwError && <div className="text-error text-xs font-oswald uppercase">{pwError}</div>}
          <button type="submit" className="w-full sm:w-auto bg-ink text-bg px-6 py-3.5 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors min-h-[44px]">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
