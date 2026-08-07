'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useProducts } from '@/lib/useProducts';
import { ProductCard } from '@/components/ProductCard';
import { ProductImageZoom } from '@/components/ProductImageZoom';
import { ShareModal } from '@/components/ShareModal';
import { ProductReviews } from '@/components/ProductReviews';
import { ProductPageSkeleton } from '@/components/ProductPageSkeleton';
import { FindMyFitModal } from '@/components/FindMyFitModal';
import { useCart } from '@/components/CartContext';
import { useWishlist } from '@/components/WishlistContext';
import { useRecentlyViewed } from '@/components/RecentlyViewedContext';
import { formatINR } from '@/lib/utils';

export default function ProductPage({ params }: { params: { id: string } }) {
  const { products, findProduct, stockFor, loading } = useProducts();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { recentlyViewed, addRecentlyViewed } = useRecentlyViewed();

  const product = findProduct(params.id);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [openAcc, setOpenAcc] = useState<'details' | 'care' | 'shipping'>('details');
  const [shareOpen, setShareOpen] = useState(false);
  const [fitModalOpen, setFitModalOpen] = useState(false);

  // Track Recently Viewed
  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
    }
  }, [product, addRecentlyViewed]);

  if (loading) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh]">
        <h2 className="font-oswald text-2xl uppercase mb-3">Product Not Found</h2>
        <Link href="/" className="font-oswald text-sm tracking-wider uppercase border-b border-ink">
          Back To Shop →
        </Link>
      </main>
    );
  }

  const wishlisted = isWishlisted(product.id);

  // Stock status for selected size or overall
  const selectedSizeStock = size ? stockFor(product.id, size) : null;
  const isSelectedSizeLow = selectedSizeStock !== null && selectedSizeStock > 0 && selectedSizeStock <= 5;
  const isSelectedSizeOut = selectedSizeStock !== null && selectedSizeStock <= 0;

  function handleAdd() {
    if (!size) {
      setMsg({ text: 'Please select a size.', type: 'error' });
      return;
    }
    if (stockFor(product!.id, size) <= 0) {
      setMsg({ text: 'This size is out of stock.', type: 'error' });
      return;
    }
    addToCart(product!.id, size, qty);
    setMsg({ text: 'Added to bag ✓', type: 'success' });
  }

  const images = product.images && product.images.length ? product.images : [null, null, null];

  // Algorithmic Related & Recommended Products
  const related = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const recommended = products
    .filter(p => p.category !== product.category && p.id !== product.id)
    .slice(0, 4);

  const recentlyViewedProducts = recentlyViewed
    .filter(id => id !== product.id)
    .map(id => findProduct(id))
    .filter(Boolean) as typeof products;

  return (
    <main className="page-fade content-fade-in pb-24 md:pb-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Breadcrumb Navigation */}
        <div className="font-oswald text-xs tracking-wider uppercase text-mute pt-6 flex items-center justify-between">
          <div>
            <Link href="/" className="hover:text-ink">Shop</Link> /{' '}
            <Link href={`/category/${product.category.toLowerCase()}`} className="hover:text-ink">{product.category}</Link> /{' '}
            <span className="text-ink">{product.name}</span>
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1.5 hover:text-ink text-mute transition-colors uppercase font-oswald text-xs tracking-wider min-h-[44px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" />
            </svg>
            <span>Share</span>
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-14 py-6 md:py-8 pb-14 md:pb-20">
          {/* Gallery with Image Zoom */}
          <ProductImageZoom images={images} productName={product.name} productType={product.type} />

          {/* Product Info & Actions */}
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                {product.badge && (
                  <span className="inline-block font-oswald text-[0.62rem] tracking-wider uppercase bg-ink text-bg px-2.5 py-1 rounded-sm mb-3">
                    {product.badge}
                  </span>
                )}
                <h1 className="font-oswald text-2xl sm:text-3xl md:text-4xl uppercase">{product.name}</h1>
              </div>

              {/* Wishlist Toggle Button */}
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Toggle Wishlist"
                className="min-w-[44px] min-h-[44px] rounded-full border border-line flex items-center justify-center text-ink hover:scale-110 transition-transform bg-panel shadow-sm2"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={wishlisted ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth={1.6}
                  className={`w-5 h-5 ${wishlisted ? 'text-camelDeep' : 'text-ink'}`}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            <div className="font-oswald text-xl text-camelDeep mb-5">{formatINR(product.price)}</div>
            <p className="text-mute leading-relaxed max-w-[48ch] mb-8 text-sm">{product.description}</p>

            {/* Size Selection */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3">
                <span className="font-oswald text-xs tracking-widest uppercase text-camelDeep">Select Size</span>
                <Link href="/contact" className="font-oswald text-xs tracking-wider uppercase border-b border-ink">
                  Size Guide
                </Link>
              </div>

              <div className="flex gap-2 flex-wrap mb-2">
                {product.sizes.map(s => {
                  const currentStock = stockFor(product.id, s);
                  const out = currentStock <= 0;
                  return (
                    <button
                      key={s}
                      disabled={out}
                      onClick={() => setSize(s)}
                      className={`min-w-[48px] min-h-[44px] px-3.5 py-2.5 rounded-sm font-oswald text-sm border transition-all ${
                        size === s ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink hover:-translate-y-0.5'
                      } ${out ? 'opacity-35 line-through cursor-not-allowed' : ''}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Find My Fit Button */}
              <div className="mt-2.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setFitModalOpen(true)}
                  className="font-oswald text-xs tracking-wider uppercase border border-line hover:border-ink px-3 py-1.5 rounded-sm bg-panel hover:bg-panel2 text-ink transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
                >
                  <span>📏 Find My Fit</span>
                </button>
              </div>

              {/* Stock Indicator Feedback */}
              {size && (
                <div className="text-xs font-oswald uppercase tracking-wider mt-2">
                  {isSelectedSizeOut ? (
                    <span className="text-error">Size {size} is currently out of stock</span>
                  ) : isSelectedSizeLow ? (
                    <span className="text-amber-700 font-medium">Low stock: Only {selectedSizeStock} left in size {size}!</span>
                  ) : (
                    <span className="text-success">In Stock & Ready to Dispatch</span>
                  )}
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex justify-between items-center mb-7">
              <span className="font-oswald text-xs tracking-widest uppercase text-camelDeep">Quantity</span>
              <div className="flex items-center border border-line rounded-sm bg-panel">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="min-w-[44px] min-h-[44px] font-oswald text-sm">
                  −
                </button>
                <span className="min-w-[36px] text-center font-oswald text-sm">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="min-w-[44px] min-h-[44px] font-oswald text-sm">
                  +
                </button>
              </div>
            </div>

            {/* Add to Bag Button */}
            <button
              onClick={handleAdd}
              className="block w-full bg-ink text-bg py-4 rounded-sm font-oswald text-xs tracking-widest uppercase shadow-sm2 hover:bg-camelDeep hover:-translate-y-0.5 transition-all min-h-[44px]"
            >
              Add to Bag — {formatINR(product.price * qty)}
            </button>
            {msg && (
              <div className={`font-oswald text-xs tracking-wider uppercase mt-3 ${msg.type === 'success' ? 'text-success' : 'text-error'}`}>
                {msg.text}
              </div>
            )}

            {/* Product Accordion */}
            <div className="mt-9 border-t border-line">
              {(['details', 'care', 'shipping'] as const).map(key => (
                <div key={key} className="border-b border-line">
                  <button
                    onClick={() => setOpenAcc(key)}
                    className="w-full flex justify-between items-center py-4 font-oswald text-sm tracking-wider uppercase hover:text-camelDeep min-h-[44px]"
                  >
                    {key === 'details' ? 'Details' : key === 'care' ? 'Fabric & Care' : 'Shipping & Returns'}
                    <span className="text-camelDeep">{openAcc === key ? '−' : '+'}</span>
                  </button>
                  <div className={`overflow-hidden transition-all ${openAcc === key ? 'max-h-80 pb-5' : 'max-h-0'}`}>
                    <p className="text-sm text-mute leading-relaxed">
                      {key === 'details' && (
                        <>
                          Fabric: {product.fabric}
                          <br />
                          Cut: {product.cut}
                          <br />
                          Fit: {product.fit}
                        </>
                      )}
                      {key === 'care' && product.care}
                      {key === 'shipping' &&
                        'Free shipping on orders over ₹4,999, flat ₹149 otherwise. Standard delivery in 4–7 business days. Easy 14-day returns on unworn pieces with tags attached.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Product Reviews & Ratings */}
        <ProductReviews productId={product.id} />

        {/* Related Products */}
        {related.length > 0 && (
          <div className="py-14 border-t border-line">
            <h2 className="font-oswald text-2xl uppercase mb-8">Related Pieces</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} mirror={i % 2 === 1} stockFor={stockFor} />
              ))}
            </div>
          </div>
        )}

        {/* Algorithmic Recommended Products */}
        {recommended.length > 0 && (
          <div className="py-14 border-t border-line">
            <h2 className="font-oswald text-2xl uppercase mb-2">Complete The Edit</h2>
            <p className="text-mute text-sm mb-8">Curated pieces that complement this garment silhouette.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
              {recommended.map((p, i) => (
                <ProductCard key={p.id} product={p} mirror={i % 2 === 1} stockFor={stockFor} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewedProducts.length > 0 && (
          <div className="py-14 border-t border-line pb-12">
            <h2 className="font-oswald text-2xl uppercase mb-8">Recently Viewed</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-9">
              {recentlyViewedProducts.slice(0, 4).map((p, i) => (
                <ProductCard key={p.id} product={p} mirror={i % 2 === 1} stockFor={stockFor} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky Mobile Add To Cart Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-bg border-t border-line p-3 z-40 shadow-2xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-oswald text-xs uppercase truncate">{product.name}</div>
          <div className="font-oswald text-sm text-camelDeep">{formatINR(product.price * qty)}</div>
        </div>
        <button
          onClick={handleAdd}
          className="bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-6 py-3.5 rounded-sm hover:bg-camelDeep transition-colors min-h-[44px] flex items-center"
        >
          Add To Bag
        </button>
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        title={product.name}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Find My Fit Modal */}
      <FindMyFitModal
        isOpen={fitModalOpen}
        onClose={() => setFitModalOpen(false)}
        product={product}
        stockFor={stockFor}
        onSelectSize={(recommendedSize) => setSize(recommendedSize)}
      />
    </main>
  );
}
