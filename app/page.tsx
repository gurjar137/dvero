import { getHomepageSettings, getHomepageProducts } from '@/lib/serverData';
import { HomePageClient } from '@/components/HomePageClient';

export const revalidate = 60;

export default async function HomePage() {
  const [settings, products] = await Promise.all([
    getHomepageSettings(),
    getHomepageProducts(),
  ]);

  return <HomePageClient initialSettings={settings} initialProducts={products} />;
}
