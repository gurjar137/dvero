'use client';
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Profile } from '@/lib/types';

type AdminAuthType = {
  admin: (Profile & { email: string }) | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthType>({ admin: null, loading: true, refresh: async () => {} });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<(Profile & { email: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAdmin(null); setLoading(false); return; }
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    if (error || !profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
      await supabase.auth.signOut();
      setAdmin(null);
    } else {
      setAdmin({ id: session.user.id, email: session.user.email!, full_name: profile.full_name, role: profile.role, created_at: profile.created_at });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setAdmin(null);
      if (event === 'SIGNED_IN') refresh();
    });
    return () => listener.subscription.unsubscribe();
  }, [refresh]);

  return <AdminAuthContext.Provider value={{ admin, loading, refresh }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
