'use client';
import Link from 'next/link';
import { useWishlist } from '@/components/WishlistContext';
import { useProducts } from '@/lib/useProducts';
import { ProductCard } from '@/components/ProductCard';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { products, stockFor, loading } = useProducts();

  const wishlistedProducts = wishlist
    .map(id => products.find(p => p.id === id))
    .filter(Boolean) as typeof products;

  return (
    <div className="page-fade py-12 md:py-20 min-h-[65vh]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        <div className="flex justify-between items-end mb-8 border-b border-line pb-6">
          <div>
            <h1 className="font-oswald text-3xl md:text-4xl uppercase">Your Saved Wishlist</h1>
            <p className="text-mute text-sm mt-2">
              {wishlistedProducts.length} piece{wishlistedProducts.length !== 1 ? 's' : ''} saved for later.
            </p>
          </div>
          <Link href="/" className="font-oswald text-xs tracking-wider uppercase border-b border-ink">
            Continue Shopping →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16 font-oswald text-xs uppercase tracking-wider text-mute">
            Loading your wishlist...
          </div>
        ) : wishlistedProducts.length === 0 ? (
          <div className="text-center py-20 bg-panel border border-line rounded-md max-w-md mx-auto my-8 p-8 shadow-sm2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-mute mx-auto mb-4">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <h2 className="font-oswald text-xl uppercase mb-2">Your Wishlist Is Empty</h2>
            <p className="text-mute text-sm mb-6 max-w-[28ch] mx-auto">
              Save your favorite formalwear pieces to review or add to bag at any time.
            </p>
            <Link
              href="/"
              className="inline-block bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-colors shadow-sm2"
            >
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {wishlistedProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} mirror={i % 2 === 1} stockFor={stockFor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
