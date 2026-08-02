'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { useAdminAuth } from '@/components/admin/AdminAuthContext';
import { useToast } from '@/components/admin/Toast';

export default function AdminUsersPage() {
  const { profiles, loadProfiles } = useAdminData();
  const { admin } = useAdminAuth();
  const showToast = useToast();
  const [search, setSearch] = useState('');

  async function updateRole(id: string, role: string) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) { showToast('Could not update role'); return; }
    showToast('Role updated');
    loadProfiles();
  }

  const filtered = profiles.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (p.full_name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-oswald text-2xl uppercase">Customer & Staff Directory</h1>
        <p className="text-sm text-mute mt-1">All registered users — customers, staff, and admins.</p>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full max-w-md border border-line bg-panel rounded-md px-3.5 py-3 mb-6 outline-none focus:border-camelDeep text-sm font-oswald uppercase min-h-[44px]"
      />

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-oswald text-xs tracking-wider uppercase text-mute border-b border-line">
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">Email</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Joined</th>
              <th className="py-3.5 px-4">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? filtered.map(p => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                <td className="py-3.5 px-4 font-oswald uppercase text-ink">{p.full_name || '—'}{p.id === admin?.id && <span className="text-camelDeep text-xs ml-1">(you)</span>}</td>
                <td className="py-3.5 px-4 text-xs font-mono">{p.email || '—'}</td>
                <td className="py-3.5 px-4"><span className="bg-bg border border-line px-2.5 py-1 rounded font-oswald text-xs uppercase text-ink">{p.role}</span></td>
                <td className="py-3.5 px-4 text-xs font-mono text-mute">{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td>
                <td className="py-3.5 px-4">
                  <select
                    defaultValue={p.role}
                    disabled={p.id === admin?.id}
                    onChange={(e) => updateRole(p.id, e.target.value)}
                    className="border border-line bg-bg rounded px-3 py-1.5 text-xs font-oswald uppercase text-ink outline-none min-h-[44px]"
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="text-center py-10 text-mute">No users found.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length ? filtered.map(p => (
          <div key={p.id} className="bg-panel border border-line rounded-lg p-4 shadow-sm2 space-y-3">
            <div className="flex justify-between items-start border-b border-line pb-2">
              <div>
                <h4 className="font-oswald text-sm uppercase text-ink font-semibold">{p.full_name || 'Anonymous User'}</h4>
                <div className="font-mono text-xs text-mute">{p.email}</div>
              </div>
              <span className="bg-bg border border-line px-2 py-0.5 rounded font-oswald text-[0.65rem] uppercase">{p.role}</span>
            </div>

            <div className="flex justify-between items-center pt-1 text-xs">
              <span className="text-mute font-mono">Joined: {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</span>
              <select
                defaultValue={p.role}
                disabled={p.id === admin?.id}
                onChange={(e) => updateRole(p.id, e.target.value)}
                className="border border-line bg-bg rounded px-3 py-2 text-xs font-oswald uppercase text-ink outline-none min-h-[44px]"
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        )) : (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute text-xs font-oswald uppercase">
            No matching users found.
          </div>
        )}
      </div>
    </div>
  );
}
