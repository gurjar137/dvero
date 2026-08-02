'use client';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-fade py-24 md:py-32 text-center min-h-[65vh] flex flex-col items-center justify-center px-4">
      <div className="font-cinzel text-5xl sm:text-7xl font-bold tracking-widest text-ink/20 mb-4">404</div>
      <h1 className="font-oswald text-2xl sm:text-3xl uppercase mb-3">Garment Silhouette Not Found</h1>
      <p className="text-mute text-sm max-w-md mb-8 leading-relaxed">
        The piece or page you are searching for has been moved, renamed, or is currently out of catalog.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/"
          className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-all shadow-sm2 min-h-[44px] flex items-center"
        >
          Return To Shop
        </Link>
        <Link
          href="/category/shirts"
          className="border border-line font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded-sm hover:border-ink transition-all min-h-[44px] flex items-center"
        >
          Explore Shirts
        </Link>
      </div>
    </main>
  );
}
