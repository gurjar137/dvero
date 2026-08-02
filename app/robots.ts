import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/checkout', '/confirmation', '/orders/invoice/'],
    },
    sitemap: 'https://dvero.com/sitemap.xml',
  };
}
