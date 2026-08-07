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
      <div className="relative w-full rounded-[12px] overflow-hidden bg-[#FAF9F6] border border-[#EAEAEA]/80 transition-shadow duration-300 hover:shadow-md mb-3">
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#F4F3EE]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              unoptimized={imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GarmentIcon type={product.type} mirror={mirror} className="w-16 h-16 text-[#666666]/40" />
            </div>
          )}

          {/* Optional Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3 z-10">
              <span className="font-inter text-[0.6rem] tracking-[0.15em] uppercase font-medium bg-[#111111] text-[#FAF9F6] px-2 py-0.5 rounded-sm">
                {product.badge}
              </span>
            </div>
          )}

          {/* Hover Wishlist Icon */}
          <button
            onClick={handleWishlistToggle}
            aria-label="Toggle Wishlist"
            className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-sm ${
              wishlisted ? 'bg-[#111111] text-[#FAF9F6]' : 'bg-[#FAF9F6]/90 text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6]'
            }`}
          >
            <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="px-1">
        <h4 className="font-inter text-sm font-medium text-[#111111] tracking-tight truncate">{product.name}</h4>
        <span className="font-inter text-xs text-[#666666] mt-0.5 block">{formatINR(product.price)}</span>
      </div>
    </Link>
  );
}
