'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[DVERO SYSTEM ERROR]', error);
  }, [error]);

  return (
    <main className="page-fade py-24 md:py-32 text-center min-h-[65vh] flex flex-col items-center justify-center px-4">
      <div className="font-oswald text-xs uppercase tracking-widest text-error mb-2 font-bold">System Exception</div>
      <h1 className="font-oswald text-2xl sm:text-3xl uppercase mb-3">Something Went Wrong</h1>
      <p className="text-mute text-sm max-w-md mb-8 leading-relaxed">
        We encountered a temporary network exception. Your cart items and session details remain completely secure.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={() => reset()}
          className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-all shadow-sm2 min-h-[44px]"
        >
          Try Again ↺
        </button>
        <Link
          href="/"
          className="border border-line font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm hover:border-ink transition-all min-h-[44px] flex items-center"
        >
          Back To Home
        </Link>
      </div>
    </main>
  );
}
