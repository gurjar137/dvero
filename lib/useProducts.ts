'use client';
// Products are now loaded once by the global ProductsProvider (see
// components/ProductsContext.tsx) and shared through Context. This file is
// kept so every existing `import { useProducts } from '@/lib/useProducts'`
// call site keeps working unchanged, while internally reading from the
// single cached source instead of fetching independently on every mount.
export { useProductsContext as useProducts } from '@/components/ProductsContext';
