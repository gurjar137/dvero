'use client';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { consumeScrollPositionFor } from '@/lib/scrollMemory';

export function ScrollRestorer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const key = query ? `${pathname}?${query}` : pathname;
    const saved = consumeScrollPositionFor(key);
    if (saved !== null) {
      requestAnimationFrame(() => {
        window.scrollTo(0, saved);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return null;
}
