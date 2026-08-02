'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!admin && pathname !== '/admin/login') router.replace('/admin/login');
    if (admin && pathname === '/admin/login') router.replace('/admin');
  }, [admin, loading, pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (loading || !admin) return <main className="min-h-screen flex items-center justify-center text-mute font-oswald text-sm">Loading…</main>;

  return (
    <div className="grid md:grid-cols-[240px_1fr] min-h-screen">
      <AdminSidebar />
      <div className="p-6 md:p-12 max-w-[1400px]">{children}</div>
    </div>
  );
}
