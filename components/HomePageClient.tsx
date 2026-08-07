'use client';
import { useProducts } from '@/lib/useProducts';
import { useSettings, SettingsProvider } from '@/lib/useSettings';
import { Hero } from '@/components/Hero';
import { ProductCard } from '@/components/ProductCard';
import { BestSellerCard } from '@/components/BestSellerCard';
import { ShopTheEdit } from '@/components/ShopTheEdit';
import { HomepageGenericSection } from '@/components/HomepageGenericSection';
import { HomepageSection, Product, SiteSettings } from '@/lib/types';
import { DEFAULT_HOMEPAGE_SECTIONS, DEFAULT_HOMEPAGE_THEME } from '@/lib/homepageDefaults';

const FEATURES = [
  {
    title: 'Free Shipping',
    desc: 'On orders above ₹1999',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M2 7h13v9H2z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M15 10h4l3 3v3h-7z" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="6.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    title: 'Premium Quality',
    desc: 'Finest fabrics & craftsmanship',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M12 2l7 3v6c0 5-3 8.5-7 11-4-2.5-7-6-7-11V5l7-3z" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    title: 'Easy Exchanges',
    desc: 'Hassle free returns',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path d="M4 7h13l-3-3M20 17H7l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    desc: '100% safe & secure',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="5" y="10" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

function FeaturesStrip() {
  return (
    <section className="border-y border-line">
      <div className="max-w-[1360px] mx-auto grid grid-cols-2 md:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`flex items-center gap-3.5 px-5 sm:px-8 py-6 border-line
              ${i % 2 === 0 ? 'border-r' : ''}
              ${i < FEATURES.length - 2 ? 'border-b' : ''}
              md:border-b-0 md:border-r md:last:border-r-0`}
          >
            <span className="text-ink shrink-0">{f.icon}</span>
            <div>
              <div className="font-inter text-[0.8rem] font-medium text-ink">{f.title}</div>
              <div className="font-inter text-[0.72rem] text-mute mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedCollectionSection({ section, products, containerWidth }: { section: HomepageSection; products: Product[]; containerWidth: number }) {
  const { stockFor } = useProducts();
  return (
    <section id="featured-collection" className="py-12 sm:py-16 md:py-24 scroll-mt-20 bg-[#FAF9F6]">
      <div className="mx-auto px-4 sm:px-6 md:px-14" style={{ maxWidth: containerWidth }}>
        <div className="text-center mb-10 sm:mb-14 md:mb-16">
          <div className="font-inter text-xs tracking-[0.25em] uppercase text-[#666666] mb-2.5">
            {section.subtitle || 'D\'VERO Edits'}
          </div>
          <h2 className="font-playfair text-2xl sm:text-3xl md:text-4xl text-[#111111] uppercase tracking-[0.15em] font-normal">
            {section.title || 'Featured Collection'}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} mirror={i % 2 === 1} stockFor={stockFor} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomePageContent({ initialProducts }: { initialProducts: Product[] }) {
  const { products: clientProducts } = useProducts();
  const { settings } = useSettings();
  const products = clientProducts.length > 0 ? clientProducts : initialProducts;

  const theme = settings.homepage_theme || DEFAULT_HOMEPAGE_THEME;
  const sections = (settings.homepage_sections && settings.homepage_sections.length > 0
    ? settings.homepage_sections
    : DEFAULT_HOMEPAGE_SECTIONS
  ).filter(s => s.enabled).sort((a, b) => a.order - b.order);

  const featuredSection = sections.find(s => s.id === 'featured_collection') || {
    id: 'featured_collection',
    title: 'Featured Collection',
    subtitle: 'D\'VERO Edits',
    enabled: true,
    order: 2,
  };

  return (
    <main className="page-fade bg-[#FAF9F6]">
      {/* 1. Full-Height Cinematic Hero Banner */}
      <Hero />

      {/* 2. Immediate Featured Products Grid */}
      <FeaturedCollectionSection
        section={featuredSection as HomepageSection}
        products={products}
        containerWidth={theme.container_width}
      />

      {/* 3. Brand Promise Strip */}
      <FeaturesStrip />

      {/* 4. Optional Generic Sections (e.g. Instagram feed) */}
      {sections.map(section => {
        if (section.id === 'hero' || section.id === 'shop_by_style' || section.id === 'featured_collection') {
          return null; // Skip category showcase & redundant hero
        }
        return <HomepageGenericSection key={section.id} section={section} theme={theme} />;
      })}
    </main>
  );
}

export function HomePageClient({ initialSettings, initialProducts }: { initialSettings: SiteSettings; initialProducts: Product[] }) {
  return (
    <SettingsProvider initialSettings={initialSettings}>
      <HomePageContent initialProducts={initialProducts} />
    </SettingsProvider>
  );
}
