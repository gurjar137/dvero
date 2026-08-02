'use client';
import { useProducts } from '@/lib/useProducts';
import { useSettings, SettingsProvider } from '@/lib/useSettings';
import { Hero } from '@/components/Hero';
import { FitSlider } from '@/components/FitSlider';
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
  return (
    <section id="drop01" style={{ backgroundColor: section.bg_color, color: section.text_color }} className="py-14 md:py-20 scroll-mt-20">
      <div className="mx-auto px-4 sm:px-6 md:px-14" style={{ maxWidth: containerWidth }}>
        <div className="text-center mb-10 md:mb-14">
          <div className="font-inter text-xs tracking-[0.2em] uppercase opacity-60 mb-2">{section.subtitle}</div>
          <h2 className="font-playfair text-[1.7rem] sm:text-3xl md:text-[2.4rem] relative inline-block pb-3">
            {section.title}
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-11 h-[2px]" style={{ backgroundColor: section.text_color }} />
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {products.map((p, i) => <BestSellerCard key={p.id} product={p} mirror={i % 2 === 1} />)}
        </div>
      </div>
    </section>
  );
}

function HomePageContent({ initialProducts }: { initialProducts: Product[] }) {
  const { products: clientProducts } = useProducts();
  const { settings } = useSettings();
  const products = clientProducts.length > 0 ? clientProducts : initialProducts;
  const trousers = products.filter(p => p.category === 'Trousers');

  const theme = settings.homepage_theme || DEFAULT_HOMEPAGE_THEME;
  const sections = (settings.homepage_sections && settings.homepage_sections.length > 0
    ? settings.homepage_sections
    : DEFAULT_HOMEPAGE_SECTIONS
  ).filter(s => s.enabled).sort((a, b) => a.order - b.order);

  return (
    <main className="page-fade" style={{ backgroundColor: theme.bg_color }}>
      {sections.map(section => {
        if (section.id === 'hero') {
          return <Hero key="hero" />;
        }
        if (section.id === 'shop_by_style') {
          return (
            <div key="shop_by_style">
              <ShopTheEdit />
              <FeaturesStrip />
              <FitSlider trousers={trousers} />
            </div>
          );
        }
        if (section.id === 'featured_collection') {
          return <FeaturedCollectionSection key="featured_collection" section={section} products={products} containerWidth={theme.container_width} />;
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
