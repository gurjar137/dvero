'use client';
import { usePathname } from 'next/navigation';
import React from 'react';

export function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAdmin = pathname?.startsWith('/admin');
  const isHomepage = pathname === '/';

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <main className={`storefront-main-layout ${isHomepage ? 'is-homepage' : ''}`}>
      {children}
    </main>
  );
}
