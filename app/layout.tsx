import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Oswald, Inter, Cinzel, Playfair_Display } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartContext';
import { AuthProvider } from '@/components/AuthContext';
import { WishlistProvider } from '@/components/WishlistContext';
import { RecentlyViewedProvider } from '@/components/RecentlyViewedContext';
import { ProductsProvider } from '@/components/ProductsContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { ScrollRestorer } from '@/components/ScrollRestorer';
import { MainLayoutWrapper } from '@/components/MainLayoutWrapper';

const oswald = Oswald({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-oswald' });
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600'], variable: '--font-inter' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'], variable: '--font-cinzel' });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: {
    default: "D'VERO — Modern Retro Menswear | Precision Tailoring",
    template: "%s | D'VERO",
  },
  description: 'Modern retro menswear designed in Jaipur, India. Premium shirts and precision trousers tailored by the past, defined for today.',
  keywords: ['DVERO', 'Retro Menswear', 'Modern Retro', 'Jaipur Tailoring', 'Retro Shirts', 'Men Trousers', 'Luxury Fashion India'],
  authors: [{ name: "D'VERO" }],
  metadataBase: new URL('https://dvero.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "D'VERO — Modern Retro Menswear",
    description: 'Precision tailored modern retro menswear engineered in Jaipur, India.',
    url: 'https://dvero.com',
    siteName: "D'VERO",
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "D'VERO — Modern Retro Menswear",
    description: 'Modern retro menswear designed in Jaipur.',
  },
};

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: "D'VERO",
  url: 'https://dvero.com',
  logo: 'https://dvero.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9876543210',
    contactType: 'customer service',
    areaServed: 'IN',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className={`${oswald.variable} ${inter.variable} ${cinzel.variable} ${playfair.variable} font-inter font-light`}>
        <ProductsProvider>
          <AuthProvider>
            <WishlistProvider>
              <RecentlyViewedProvider>
                <CartProvider>
                  <Suspense fallback={null}>
                    <ScrollRestorer />
                  </Suspense>
                  <Header />
                  <MainLayoutWrapper>{children}</MainLayoutWrapper>
                  <Footer />
                  <BackToTop />
                </CartProvider>
              </RecentlyViewedProvider>
            </WishlistProvider>
          </AuthProvider>
        </ProductsProvider>
      </body>
    </html>
  );
}
