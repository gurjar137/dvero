'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { GarmentIcon } from './GarmentIcon';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
import { useState, useEffect } from 'react';

export function ProductCard({
  product,
  mirror,
  stockFor,
  priority = false,
  onImageReady,
}: {
  product: Product;
  mirror?: boolean;
  stockFor: (id: string, size: string) => number;
  priority?: boolean;
  onImageReady?: () => void;
}) {
  const { addToCart, setCartDrawerOpen } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const totalStock = product.sizes.reduce((acc, s) => acc + stockFor(product.id, s), 0);
  const isOutOfStock = totalStock <= 0;
  const imageUrl = product.images?.[0] || '';

  useEffect(() => {
    if (!imageUrl) {
      onImageReady?.();
    }
  }, [imageUrl, onImageReady]);

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }

  function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const firstAvailable = product.sizes.find(s => stockFor(product.id, s) > 0) || product.sizes[0];
    if (stockFor(product.id, firstAvailable) <= 0) return;
    addToCart(product.id, firstAvailable, 1);
    setAdded(true);
    setCartDrawerOpen(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <Link href={`/product/${product.id}`} className="group block w-full">
      <div className="relative w-full rounded-[12px] overflow-hidden bg-[#FAF9F6] border border-[#EAEAEA]/80 transition-shadow duration-300 hover:shadow-md">
        
        {/* Large Product Image Container — Dominates Card */}
        <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#F4F3EE]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              priority={priority}
              unoptimized={imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              onLoad={() => onImageReady?.()}
              className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GarmentIcon type={product.type} mirror={mirror} className="w-20 h-20 text-[#666666]/40" />
            </div>
          )}

          {/* Optional Luxury Badge */}
          {product.badge && (
            <div className="absolute top-3 left-3 z-10">
              <span className="font-inter text-[0.65rem] tracking-[0.15em] uppercase font-medium bg-[#111111] text-[#FAF9F6] px-2.5 py-1 rounded-sm shadow-sm">
                {product.badge}
              </span>
            </div>
          )}

          {/* Out of Stock Overlay Badge */}
          {isOutOfStock && (
            <div className="absolute top-3 right-3 z-10">
              <span className="font-inter text-[0.65rem] tracking-[0.15em] uppercase font-medium bg-[#FAF9F6]/90 text-[#666666] border border-[#EAEAEA] px-2 py-0.5 rounded-sm">
                Sold Out
              </span>
            </div>
          )}

          {/* Hover Action Icons: Wishlist & Quick Add / View */}
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleWishlistToggle}
              aria-label="Wishlist"
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors shadow-sm ${
                wishlisted
                  ? 'bg-[#111111] text-[#FAF9F6]'
                  : 'bg-[#FAF9F6]/90 text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6]'
              }`}
            >
              <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {!isOutOfStock && (
              <button
                onClick={handleQuickAdd}
                aria-label="Quick View / Add"
                className="w-9 h-9 rounded-full bg-[#FAF9F6]/90 text-[#111111] hover:bg-[#111111] hover:text-[#FAF9F6] flex items-center justify-center backdrop-blur-md transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Minimal Card Details */}
        <div className="p-3.5 flex flex-col gap-1 bg-[#FAF9F6]">
          <h3 className="font-inter text-sm sm:text-[0.95rem] font-medium text-[#111111] tracking-tight truncate">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="font-inter text-xs sm:text-sm text-[#666666]">
              {formatINR(product.price)}
            </span>
            {added && (
              <span className="font-inter text-[0.68rem] text-[#2E5B37] font-medium">Added ✓</span>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}
