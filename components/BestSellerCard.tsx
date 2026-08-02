'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { GarmentIcon } from './GarmentIcon';
import { useWishlist } from './WishlistContext';

export function BestSellerCard({ product, mirror }: { product: Product; mirror?: boolean }) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const imageUrl = product.images?.[0] || '';

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block w-full">
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-panel mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            unoptimized={imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')}
            sizes="(max-width: 768px) 50vw, 20vw"
            className="object-cover object-center transition-transform duration-500 md:group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GarmentIcon type={product.type} mirror={mirror} className="w-16 h-16 text-camelDeep/50" />
          </div>
        )}

        <button
          onClick={handleWishlistToggle}
          aria-label="Toggle Wishlist"
          className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center shadow-sm2 transition-colors ${
            wishlisted ? 'bg-ink text-bg' : 'bg-bg text-ink hover:bg-ink hover:text-bg'
          }`}
        >
          <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6} className="w-3.5 h-3.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      <h4 className="font-inter text-sm text-ink">{product.name}</h4>
      <span className="font-inter text-sm text-mute">{formatINR(product.price)}</span>
    </Link>
  );
}
