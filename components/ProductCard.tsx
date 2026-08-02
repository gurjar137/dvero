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
  const isLowStock = !isOutOfStock && totalStock <= 5;
  const imageUrl = product.images?.[0] || '';

  useEffect(() => {
    if (!imageUrl) {
      onImageReady?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  function handleWishlistToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  }

  function quickAdd(e: React.MouseEvent) {
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
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-line/30 shadow-md md:hover:shadow-2xl md:hover:-translate-y-1 transition-all duration-500 bg-ink">
        
        {/* 100% Full-Card Background Photography (Hero Image) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              priority={priority}
              unoptimized={imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')}
              sizes="(max-width: 768px) 100vw, 50vw"
              onLoad={() => onImageReady?.()}
              className="object-cover object-center transition-transform duration-700 ease-out md:group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-panel">
              <GarmentIcon type={product.type} mirror={mirror} className="w-28 h-28 text-camelDeep/60" />
            </div>
          )}
        </div>

        {/* Soft Editorial Gradient Overlay (Photography remains bright & hero) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        {/* TOP LEFT: Generous Breathing Space (Top ~32-40px, Left ~32px) */}
        <div className="absolute top-8 sm:top-9 md:top-10 left-7 sm:left-8 md:left-9 right-16 z-10 flex flex-col items-start gap-1 max-w-[82%] sm:max-w-[78%]">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {product.badge && (
              <span className="font-oswald text-[0.6rem] sm:text-[0.65rem] tracking-widest uppercase bg-white/20 backdrop-blur-md text-white border border-white/30 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                {product.badge}
              </span>
            )}
            {isOutOfStock ? (
              <span className="font-oswald text-[0.6rem] sm:text-[0.65rem] tracking-widest uppercase bg-rose-600/80 backdrop-blur-md text-white border border-rose-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="font-oswald text-[0.6rem] sm:text-[0.65rem] tracking-widest uppercase bg-amber-600/80 backdrop-blur-md text-white border border-amber-500/40 px-2.5 py-0.5 rounded-full font-medium shadow-sm">
                Low Stock
              </span>
            ) : null}
          </div>

          {/* Product Name — Large Editorial Typography */}
          <h3 className="font-oswald text-2xl sm:text-3xl lg:text-4xl xl:text-[2.75rem] uppercase font-semibold text-white tracking-normal leading-[1.04] drop-shadow-md md:group-hover:text-camel transition-colors">
            {product.name}
          </h3>

          {/* Fabric Name — Elegant Subtitle */}
          {product.fabric && (
            <p className="font-inter text-xs sm:text-sm text-white/85 font-medium tracking-wide mt-0.5">
              {product.fabric}
            </p>
          )}
        </div>

        {/* TOP RIGHT: Wishlist Icon Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label="Toggle Wishlist"
          className={`absolute top-6 right-6 sm:top-8 sm:right-8 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center backdrop-blur-md transition-all duration-300 ${
            wishlisted
              ? 'bg-camel text-ink border-camel shadow-lg scale-105'
              : 'bg-black/30 text-white border-white/30 hover:bg-white hover:text-ink hover:border-white md:hover:scale-110'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={wishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.8}
            className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 md:group-hover:scale-105"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* BOTTOM LEFT: Price & Auto-Width Luxury Add To Bag CTA Button */}
        <div className="absolute bottom-6 left-7 sm:left-8 md:left-9 right-7 sm:right-8 md:right-auto z-20 flex flex-col items-start gap-2.5">
          {/* Price */}
          <div className="font-oswald text-xl sm:text-2xl lg:text-3xl font-bold text-camel drop-shadow-md">
            {formatINR(product.price)}
          </div>

          {/* Add To Bag — Auto-width Luxury CTA */}
          <button
            disabled={isOutOfStock}
            onClick={quickAdd}
            className={`w-full sm:w-auto min-w-[180px] font-oswald text-xs sm:text-sm tracking-widest uppercase py-3 sm:py-3.5 px-7 rounded-xl font-medium backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${
              isOutOfStock
                ? 'bg-white/20 text-white/50 cursor-not-allowed border border-white/10'
                : added
                ? 'bg-emerald-600 text-white border border-emerald-500 shadow-emerald-900/40 scale-[1.02]'
                : 'bg-white text-ink border border-white/80 md:hover:bg-camel md:hover:text-ink md:hover:border-camel md:hover:-translate-y-0.5 active:scale-95'
            }`}
          >
            {isOutOfStock ? (
              'Sold Out'
            ) : added ? (
              <>
                <span>Added to Bag</span>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </>
            ) : (
              'Add To Bag'
            )}
          </button>
        </div>

      </div>
    </Link>
  );
}
