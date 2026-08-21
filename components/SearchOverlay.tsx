'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { useWishlist } from './WishlistContext';
import { ProductVisual } from './GarmentIcon';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const TRENDING_SEARCHES = [
  {
    label: 'Relaxed Trousers',
    query: 'Relaxed Trousers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M7 3h10l1.2 18h-4.7L12 11l-1.5 10H5.8L7 3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Classic Shirts',
    query: 'Classic Shirts',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M20 7l-5-2-3 3-3-3-5 2v4l3 1v10h10V12l3-1V7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Wide Leg',
    query: 'Wide Leg',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M5 3h14l2 18h-6.5L12 11.5l-2.5 9.5H3.5L5 3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Linen',
    query: 'Linen',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
        <path d="M12 6v12M12 12l4-4M12 15l3-3M12 9l-3 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: 'Pleated',
    query: 'Pleated',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M4 5h16M4 19h16M7 5v14M12 5v14M17 5v14" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Best Sellers',
    query: 'Best Sellers',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-3.5 h-3.5 shrink-0">
        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.2L12 16.6l-6.3 4.6 2.3-7.2-6-4.6h7.6z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
];

const SUGGESTION_PILLS = ['Shirts', 'Trousers', 'Linen', 'Relaxed Fit'];

export function SearchOverlay({ isOpen, onClose, products }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Linen Shirts', 'Wide Leg Trousers', 'Relaxed Fit']);
  const [isListening, setIsListening] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isWishlisted, toggleWishlist } = useWishlist();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dvero_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto focus input when opened & setup ESC listener
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      setSearchQuery('');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Save term to recent searches
  const saveRecentSearch = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const updated = [cleaned, ...recentSearches.filter(s => s.toLowerCase() !== cleaned.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('dvero_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const removeRecentSearch = (termToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem('dvero_recent_searches', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('dvero_recent_searches');
    } catch (e) {
      // ignore
    }
  };

  const handleSelectSearchTerm = (term: string) => {
    setSearchQuery(term);
    saveRecentSearch(term);
  };

  // Voice Search Handler
  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined') {
      const windowObj = window as unknown as Record<string, unknown>;
      const SpeechRecognition =
        (windowObj.SpeechRecognition as new () => any) ||
        (windowObj.webkitSpeechRecognition as new () => any);

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          recognition.onresult = (event: any) => {
            const transcript = event.results?.[0]?.[0]?.transcript;
            if (transcript) {
              setSearchQuery(transcript);
              saveRecentSearch(transcript);
            }
          };
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        alert('Voice search is not supported in this browser.');
      }
    }
  };

  // Touch Swipe-Down Dismiss Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY;
      if (diffY > 60) {
        onClose();
      }
      setTouchStartY(null);
    }
  };

  if (!isOpen) return null;

  // Filter products matching debouncedQuery
  const filteredProducts = debouncedQuery
    ? products.filter(p => {
        const query = debouncedQuery;
        return (
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.type?.toLowerCase().includes(query) ||
          p.fabric?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.fit_type?.toLowerCase().includes(query) ||
          p.badge?.toLowerCase().includes(query)
        );
      })
    : [];

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[1500] bg-black/45 backdrop-blur-xs flex flex-col items-center justify-start pt-10 sm:pt-20 lg:pt-[96px] pb-6 px-4 overflow-y-auto animate-fadeIn transition-all duration-300"
    >
      {/* Elevated Luxury Search Modal Container */}
      <div
        className="w-full max-w-[92vw] sm:max-w-[84vw] lg:max-w-[82vw] xl:max-w-[1240px] bg-[#FAF9F6] text-[#111111] rounded-[28px] sm:rounded-[32px] border border-[#EBE8E1] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden max-h-[75vh] sm:max-h-[68vh] animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* TOP SECTION: DRAG HANDLE, HEADING & CLOSE BUTTON */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative px-6 sm:px-8 pt-3.5 pb-4 border-b border-[#EBE8E1] shrink-0 bg-[#FAF9F6]"
        >
          {/* Small Centered Drag Handle */}
          <div className="w-12 h-1 bg-[#D1CEC7] rounded-full mx-auto mb-3 cursor-grab active:cursor-grabbing" />

          {/* Close X Button in Top-Right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search modal"
            className="absolute top-4 right-4 sm:right-6 p-2 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* High-Contrast Serif Heading & Subtitle */}
          <div className="text-center max-w-md mx-auto">
            <h2 className="font-playfair text-xl sm:text-2xl tracking-[0.2em] uppercase font-normal text-[#111111]">
              SEARCH D’VERO
            </h2>
            <p className="font-inter text-xs sm:text-sm text-[#666666] tracking-wide font-light mt-1">
              Find your perfect fit
            </p>
          </div>

          {/* 68px LARGE ROUNDED SEARCH INPUT BAR */}
          <div className="mt-5 max-w-3xl mx-auto">
            <div className="relative h-[64px] sm:h-[68px] rounded-[34px] bg-white border border-[#E2DDD0] focus-within:border-[#111111] focus-within:ring-2 focus-within:ring-[#111111]/5 px-6 shadow-sm flex items-center transition-all">
              {/* Search Lens Icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="w-5 h-5 text-[#777777] mr-3.5 shrink-0"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>

              {/* Main Search Field Input */}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search shirts, trousers, fits, fabrics..."
                className="w-full bg-transparent text-xs sm:text-sm font-inter tracking-wide text-[#111111] placeholder:text-[#888888] placeholder:font-light outline-none border-none focus:outline-none focus:ring-0"
              />

              {/* Controls: Clear X & Microphone */}
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear text"
                    className="p-1 text-[#888888] hover:text-[#111111] transition-colors rounded-full cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  title="Search with Voice"
                  aria-label="Voice Search"
                  className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                    isListening
                      ? 'text-[#D4AF37] bg-[#D4AF37]/10 animate-pulse'
                      : 'text-[#777777] hover:text-[#111111] hover:bg-[#EAE7DF]'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
                    <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* INTERNAL SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-thin touch-pan-y">
          {!searchQuery ? (
            /* INITIAL DISCOVERY MODE */
            <div className="space-y-6 animate-fadeIn">
              {/* TRENDING SEARCHES PILLS */}
              <section className="space-y-3">
                <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                  TRENDING SEARCHES
                </h3>

                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none sm:flex-wrap">
                  {TRENDING_SEARCHES.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSelectSearchTerm(item.query)}
                      className="bg-white border border-[#EBE8E1] hover:border-[#111111] text-[#111111] text-xs font-inter tracking-wide px-4 py-2.5 rounded-full flex items-center gap-2 shrink-0 transition-all cursor-pointer shadow-2xs hover:shadow-xs group hover:scale-[1.02]"
                    >
                      <span className="text-[#666666] group-hover:text-[#111111] transition-colors">
                        {item.icon}
                      </span>
                      <span className="font-medium whitespace-nowrap">{item.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* PROMOTIONAL CARD */}
              <section>
                <Link
                  href="/#featured-collection"
                  onClick={onClose}
                  className="group flex items-center justify-between bg-gradient-to-r from-[#F6F4ED] to-[#ECE9DF] border border-[#E5E1D5] p-4 sm:p-5 rounded-2xl hover:border-[#D4AF37]/50 transition-all shadow-2xs cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Small Square D’V Logo Box */}
                    <div className="w-11 h-11 bg-white border border-[#E2DDD0] rounded-xl flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#111111] transition-colors">
                      <span className="font-playfair text-xs sm:text-sm font-semibold tracking-widest text-[#111111]">
                        D’V
                      </span>
                    </div>

                    <div>
                      <h4 className="font-playfair text-sm sm:text-base font-normal tracking-wide text-[#111111] group-hover:text-[#666666] transition-colors">
                        Discover your style
                      </h4>
                      <p className="font-inter text-xs text-[#666666] font-light mt-0.5">
                        Premium fabrics. Perfect fits.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-inter text-xs font-semibold uppercase tracking-widest text-[#111111] shrink-0 pl-2">
                    <span className="hidden sm:inline">EXPLORE NOW</span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                    >
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </Link>
              </section>

              {/* RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <section className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                      RECENT SEARCHES
                    </h3>
                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-[0.68rem] font-inter uppercase text-[#888888] hover:text-[#111111] underline tracking-wider cursor-pointer"
                    >
                      CLEAR ALL
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                      <div
                        key={term}
                        onClick={() => handleSelectSearchTerm(term)}
                        className="inline-flex items-center gap-2 bg-white border border-[#EBE8E1] text-[#111111] text-xs font-inter tracking-wide px-3.5 py-2 rounded-full hover:border-[#111111] transition-all cursor-pointer shadow-2xs group"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.4}
                          className="w-3.5 h-3.5 text-[#888888] group-hover:text-[#111111] shrink-0"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{term}</span>
                        <button
                          type="button"
                          onClick={e => removeRecentSearch(term, e)}
                          aria-label={`Remove ${term}`}
                          className="text-[#888888] hover:text-[#111111] p-0.5 rounded-full hover:bg-[#EFECE6] transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3 h-3">
                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            /* LIVE SEARCH RESULTS MODE */
            <div className="space-y-4 animate-fadeIn">
              {/* Count / Query Header */}
              <div className="flex items-center justify-between border-b border-[#EBE8E1] pb-2.5">
                <span className="font-inter text-xs tracking-[0.2em] uppercase font-semibold text-[#666666]">
                  SEARCH RESULTS ({filteredProducts.length})
                </span>
                <span className="font-inter text-xs text-[#888888]">
                  Results for &ldquo;{debouncedQuery}&rdquo;
                </span>
              </div>

              {/* EMPTY RESULTS STATE */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#EBE8E1] mx-auto flex items-center justify-center text-[#888888] shadow-2xs">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-6 h-6">
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div>
                    <h4 className="font-playfair text-base sm:text-lg uppercase tracking-[0.15em] text-[#111111] font-normal">
                      NO RESULTS
                    </h4>
                    <p className="font-inter text-xs text-[#666666] font-light max-w-[36ch] mx-auto mt-1 leading-relaxed">
                      We couldn&apos;t find anything matching your search.
                    </p>
                  </div>

                  {/* QUICK SUGGESTION PILLS */}
                  <div className="pt-2">
                    <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase text-[#666666] font-semibold block mb-2.5">
                      TRY SEARCHING FOR
                    </span>
                    <div className="flex flex-wrap justify-center gap-2">
                      {SUGGESTION_PILLS.map(pill => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => handleSelectSearchTerm(pill)}
                          className="bg-white border border-[#EBE8E1] hover:border-[#111111] text-[#111111] text-xs font-inter tracking-wide px-3.5 py-1.5 rounded-full transition-all cursor-pointer shadow-2xs hover:shadow-xs font-medium"
                        >
                          {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* CLEAN COMPACT PRODUCT RESULT CARDS LIST */
                <div className="space-y-2.5 pb-6">
                  {filteredProducts.map(product => {
                    const wishlisted = isWishlisted(product.id);
                    const imageUrl = product.images?.[0];

                    return (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => {
                          saveRecentSearch(searchQuery);
                          onClose();
                        }}
                        className="group flex items-center justify-between bg-white border border-[#EBE8E1] rounded-2xl p-3 sm:p-3.5 hover:border-[#111111] transition-all shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Compact Product Image Thumbnail */}
                          <div className="w-13 h-16 sm:w-14 sm:h-18 bg-[#F0EFEA] rounded-xl border border-[#EBE8E1] overflow-hidden flex items-center justify-center shrink-0">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <ProductVisual image={imageUrl} type={product.type} />
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="min-w-0">
                            <h4 className="font-playfair text-xs sm:text-sm uppercase tracking-wide text-[#111111] font-medium truncate group-hover:text-[#666666] transition-colors">
                              {product.name}
                            </h4>
                            <p className="font-inter text-[0.68rem] text-[#888888] uppercase tracking-wider truncate mt-0.5">
                              {product.fabric || product.category}
                              {product.fit_type && ` · ${product.fit_type}`}
                            </p>
                            <span className="font-inter text-xs font-semibold text-[#111111] block mt-1">
                              {formatINR(product.price)}
                            </span>
                          </div>
                        </div>

                        {/* Shortcuts */}
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <button
                            type="button"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleWishlist(product.id);
                            }}
                            aria-label="Wishlist"
                            className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#EAEAEA] flex items-center justify-center text-[#111111] hover:scale-110 transition-all shadow-2xs"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill={wishlisted ? 'currentColor' : 'none'}
                              stroke="currentColor"
                              strokeWidth={1.5}
                              className={`w-3.5 h-3.5 ${wishlisted ? 'text-[#111111]' : 'text-[#666666]'}`}
                            >
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          </button>

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            className="w-4 h-4 text-[#888888] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all"
                          >
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
