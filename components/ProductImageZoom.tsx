'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ProductVisual } from './GarmentIcon';

type ProductImageZoomProps = {
  images: (string | null)[];
  productName: string;
  productType: 'shirt' | 'trouser';
};

export function ProductImageZoom({ images, productName, productType }: ProductImageZoomProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  // Touch swipe handling for mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Normalize images array so we always have at least 1 slot
  const validImages = images && images.length > 0 ? images : [null];

  const handleNext = useCallback(() => {
    setActiveIdx(prev => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const handlePrev = useCallback(() => {
    setActiveIdx(prev => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  // Keyboard Navigation for Lightbox & Gallery
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false);
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  // Lock body scroll when Lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // Mouse move handler for hover zoom
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setZoomPos(null);
  }

  // Mobile Touch Swipe Handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > 40;
    if (isSwipe) {
      if (distance > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  }

  function handleImageLoad(index: number) {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  }

  return (
    <div className="w-full md:sticky md:top-24 flex flex-col md:flex-row gap-4 md:h-[calc(100vh-140px)] md:max-h-[820px]">
      {/* Vertical Thumbnails (Desktop) */}
      {validImages.length > 1 && (
        <div className="hidden md:flex flex-col gap-3 overflow-y-auto pr-1 w-20 flex-shrink-0 no-scrollbar select-none">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`View product image ${i + 1}`}
              className={`relative w-full aspect-[3/4] bg-panel rounded-sm overflow-hidden border transition-all duration-200 flex items-center justify-center ${
                activeIdx === i
                  ? 'border-ink ring-1 ring-ink opacity-100 scale-105'
                  : 'border-line/60 opacity-65 hover:opacity-100 hover:border-ink/40'
              }`}
            >
              {img ? (
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="80px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-1/2 h-1/2 flex items-center justify-center">
                  <ProductVisual image={null} type={productType} mirror={i % 2 === 1} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image Stage Container */}
      <div className="relative flex-1 bg-panel rounded-lg border border-line shadow-sm overflow-hidden flex items-center justify-center group select-none min-h-[420px] md:min-h-0 h-full">
        {/* Primary Interactive Stage */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-full flex items-center justify-center cursor-zoom-in overflow-hidden"
        >
          {validImages.map((img, i) => {
            const isActive = activeIdx === i;
            const isLoaded = loadedImages[i];

            return (
              <div
                key={i}
                className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-500 ease-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Skeleton Loader */}
                {!isLoaded && img && (
                  <div className="absolute inset-0 bg-line/20 animate-pulse flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  </div>
                )}

                {img ? (
                  <div
                    className="relative w-full h-full transition-transform duration-200 ease-out"
                    style={
                      isActive && isHovered && zoomPos
                        ? {
                            transform: 'scale(2.2)',
                            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                          }
                        : { transform: 'scale(1)', transformOrigin: 'center center' }
                    }
                  >
                    <Image
                      src={img}
                      alt={`${productName} image ${i + 1}`}
                      fill
                      priority={i === 0}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                      unoptimized
                      onLoad={() => handleImageLoad(i)}
                      className={`object-contain transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-8">
                    <div className="w-2/3 max-w-[320px] aspect-square flex items-center justify-center">
                      <ProductVisual image={null} type={productType} mirror={i % 2 === 1} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Luxury Floating UI Badges */}
          {/* Image Index Counter */}
          {validImages.length > 1 && (
            <div className="absolute top-4 left-4 z-20 bg-bg/85 backdrop-blur-md px-3 py-1 rounded-full text-[0.65rem] font-oswald tracking-widest uppercase text-ink shadow-sm border border-line/40">
              {String(activeIdx + 1).padStart(2, '0')} / {String(validImages.length).padStart(2, '0')}
            </div>
          )}

          {/* Zoom Hint Badge */}
          <div className="absolute bottom-4 right-4 z-20 bg-bg/85 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[0.65rem] font-oswald tracking-widest uppercase text-mute group-hover:text-ink transition-all shadow-sm border border-line/40 flex items-center gap-1.5 pointer-events-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
            <span className="hidden sm:inline">Click to enlarge</span>
          </div>

          {/* On-hover Navigation Arrows (Desktop) */}
          {validImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous image"
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-bg/80 backdrop-blur-md border border-line shadow-md items-center justify-center text-ink opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg hover:scale-110"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-bg/80 backdrop-blur-md border border-line shadow-md items-center justify-center text-ink opacity-0 group-hover:opacity-100 transition-opacity hover:bg-bg hover:scale-110"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Horizontal Thumbnails (Mobile) */}
      {validImages.length > 1 && (
        <div className="flex md:hidden gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar select-none snap-x">
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`View slide ${i + 1}`}
              className={`relative w-16 h-20 flex-shrink-0 snap-start bg-panel rounded-sm border overflow-hidden transition-all ${
                activeIdx === i ? 'border-ink ring-1 ring-ink opacity-100' : 'border-line opacity-60'
              }`}
            >
              {img ? (
                <Image
                  src={img}
                  alt={`${productName} thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <ProductVisual image={null} type={productType} mirror={i % 2 === 1} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 animate-fade-in"
        >
          {/* Top Header Controls */}
          <div className="flex items-center justify-between z-50 text-bg">
            <div className="font-oswald text-xs tracking-widest uppercase opacity-80">
              {productName} — {String(activeIdx + 1).padStart(2, '0')} / {String(validImages.length).padStart(2, '0')}
            </div>

            <button
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close Lightbox"
              className="flex items-center gap-2 font-oswald text-xs tracking-widest uppercase hover:text-camelDeep transition-colors bg-bg/10 hover:bg-bg/20 px-3 py-1.5 rounded-full border border-bg/20"
            >
              <span>Close</span>
              <span className="text-base leading-none">✕</span>
            </button>
          </div>

          {/* Lightbox Main Stage */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 w-full max-w-6xl mx-auto flex items-center justify-center my-4 select-none"
          >
            {/* Prev Arrow */}
            {validImages.length > 1 && (
              <button
                onClick={handlePrev}
                aria-label="Previous image"
                className="absolute left-2 md:left-4 z-50 p-3 rounded-full bg-bg/10 hover:bg-bg/20 text-bg border border-bg/20 transition-all hover:scale-110"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Displayed Image */}
            <div className="relative w-full h-full max-h-[78vh] flex items-center justify-center">
              {validImages[activeIdx] ? (
                <Image
                  src={validImages[activeIdx]!}
                  alt={`${productName} full view ${activeIdx + 1}`}
                  fill
                  sizes="100vw"
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <div className="w-72 h-72 flex items-center justify-center bg-bg/5 rounded-2xl border border-bg/10 p-8">
                  <ProductVisual image={null} type={productType} mirror={activeIdx % 2 === 1} />
                </div>
              )}
            </div>

            {/* Next Arrow */}
            {validImages.length > 1 && (
              <button
                onClick={handleNext}
                aria-label="Next image"
                className="absolute right-2 md:right-4 z-50 p-3 rounded-full bg-bg/10 hover:bg-bg/20 text-bg border border-bg/20 transition-all hover:scale-110"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip / Dots */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2.5 z-50 py-2"
          >
            {validImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  activeIdx === i
                    ? 'w-8 h-2 bg-camelDeep scale-100'
                    : 'w-2 h-2 bg-bg/40 hover:bg-bg/80'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

