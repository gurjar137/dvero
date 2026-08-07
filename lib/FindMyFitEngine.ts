import fitCategoriesData from './fitCategories.json';
import { Product, FitProfile, FitResult, FitCategoryConfig } from './types';

export function resolveFitCategory(product: Product): string {
  if (product.fitCategory && (fitCategoriesData.categories as Record<string, any>)[product.fitCategory]) {
    return product.fitCategory;
  }
  const candidate = (product.fit_slug || product.fit_type || product.fit || '').toLowerCase();
  if (candidate.includes('slim')) return 'slim';
  if (candidate.includes('tailored')) return 'tailored';
  if (candidate.includes('relaxed')) return 'relaxed';
  if (candidate.includes('oversized')) return 'oversized';
  if (candidate.includes('boot')) return 'bootcut';
  if (candidate.includes('baggy')) return 'baggy';
  if (candidate.includes('pleat')) return 'pleated';
  if (candidate.includes('office')) return 'office-fit';
  if (candidate.includes('straight')) return 'straight';

  return product.category?.toLowerCase() === 'trousers' || product.type === 'trouser' ? 'straight' : 'regular';
}

export function getFitCategoryConfig(product: Product): FitCategoryConfig {
  const catKey = resolveFitCategory(product);
  const categories = fitCategoriesData.categories as Record<string, FitCategoryConfig>;
  return categories[catKey] || categories['regular'];
}

export function resolveNearestAvailableSize(
  recommended: string,
  availableSizes: string[],
  stockChecker?: (size: string) => boolean
): { appliedSize: string; isNearest: boolean } {
  if (!availableSizes || availableSizes.length === 0) {
    return { appliedSize: recommended, isNearest: false };
  }

  const isAvailable = availableSizes.includes(recommended);
  const inStock = stockChecker ? stockChecker(recommended) : true;

  if (isAvailable && inStock) {
    return { appliedSize: recommended, isNearest: false };
  }

  const recIndex = availableSizes.indexOf(recommended);
  if (recIndex !== -1) {
    for (let offset = 1; offset < availableSizes.length; offset++) {
      if (recIndex + offset < availableSizes.length && (!stockChecker || stockChecker(availableSizes[recIndex + offset]))) {
        return { appliedSize: availableSizes[recIndex + offset], isNearest: true };
      }
      if (recIndex - offset >= 0 && (!stockChecker || stockChecker(availableSizes[recIndex - offset]))) {
        return { appliedSize: availableSizes[recIndex - offset], isNearest: true };
      }
    }
  }

  const firstInStock = availableSizes.find(s => !stockChecker || stockChecker(s));
  return { appliedSize: firstInStock || availableSizes[0], isNearest: true };
}

export function computeFit(
  profile: FitProfile,
  product?: Product,
  stockChecker?: (size: string) => boolean
): FitResult {
  const { height_cm, weight_kg, body_type, chest, current_waist, current_trouser_length, current_fit_feedback } = profile;
  
  const dummyProduct: Product = product || {
    id: 'default',
    name: 'Shirt',
    category: 'Shirts',
    type: 'shirt',
    fit_type: null,
    fit_slug: null,
    price: 0,
    fabric: null,
    cut: null,
    fit: null,
    sizes: ['S', 'M', 'L', 'XL'],
    description: null,
    care: null,
    badge: null,
    images: [],
    active: true,
  };

  const config = getFitCategoryConfig(dummyProduct);
  const isTrouser = config.garmentType === 'trouser' || dummyProduct.category?.toLowerCase() === 'trousers' || dummyProduct.type === 'trouser';
  const garmentType: 'shirt' | 'trouser' = isTrouser ? 'trouser' : 'shirt';
  const sizesOrder = config.sizeChart.map(s => s.size);

  if (!height_cm || !weight_kg || height_cm <= 0 || weight_kg <= 0) {
    const defaultRec = sizesOrder.includes('M') ? 'M' : sizesOrder.includes('32') ? '32' : sizesOrder[0];
    const availableSizes = dummyProduct.sizes || sizesOrder;
    const { appliedSize, isNearest } = resolveNearestAvailableSize(defaultRec, availableSizes, stockChecker);

    return {
      garmentType,
      recommendedSize: defaultRec,
      appliedSize,
      isNearestAvailable: isNearest,
      fitCategory: config.name,
      confidence: 80,
      explanation: `Calculated from standard ${config.name} dimensions.`,
      shirtSize: garmentType === 'shirt' ? defaultRec : undefined,
      trouserWaist: garmentType === 'trouser' ? defaultRec : undefined,
      trouserLength: garmentType === 'trouser' ? (current_trouser_length ? `${current_trouser_length}"` : 'Select Length') : undefined,
      trouserFit: garmentType === 'trouser' ? config.name : undefined,
    };
  }

  let baseIndex = Math.floor(sizesOrder.length / 2);

  if (garmentType === 'shirt' && chest && chest > 0) {
    const chestInches = chest > 65 ? chest * 0.393701 : chest;
    let closestIndex = 0;
    let minDiff = Infinity;
    config.sizeChart.forEach((row, idx) => {
      const chartChest = parseFloat(String(row.chest || '0'));
      if (chartChest > 0) {
        const diff = Math.abs(chartChest - chestInches);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = idx;
        }
      }
    });
    baseIndex = closestIndex;
  } else if (garmentType === 'trouser' && current_waist && current_waist >= 24 && current_waist <= 48) {
    const roundedWaist = (Math.round(current_waist / 2) * 2).toString();
    const foundIdx = sizesOrder.indexOf(roundedWaist);
    if (foundIdx !== -1) baseIndex = foundIdx;
  } else {
    const foundBracket = config.weightBrackets.find(b => weight_kg >= b.minWeight && weight_kg <= b.maxWeight);
    if (foundBracket) {
      const idx = sizesOrder.indexOf(foundBracket.size);
      if (idx !== -1) baseIndex = idx;
    }
  }

  if (body_type === 'heavy' && baseIndex < sizesOrder.length - 1) baseIndex += 1;
  if (body_type === 'slim' && baseIndex > 0 && garmentType === 'shirt') baseIndex -= 1;
  if (current_fit_feedback === 'too_tight' && baseIndex < sizesOrder.length - 1) baseIndex += 1;
  if (current_fit_feedback === 'too_loose' && baseIndex > 0) baseIndex -= 1;

  baseIndex = Math.max(0, Math.min(sizesOrder.length - 1, baseIndex));
  const recommendedSize = sizesOrder[baseIndex];

  const availableSizes = dummyProduct.sizes || sizesOrder;
  const { appliedSize, isNearest } = resolveNearestAvailableSize(recommendedSize, availableSizes, stockChecker);

  let confidence = 94;
  if (chest && chest > 0) confidence += 3;
  if (current_waist && current_waist > 0) confidence += 3;
  confidence = Math.min(99, Math.max(86, confidence));

  let sizeSuggestion = `Engineered for D'VERO ${config.name} silhouette.`;
  if (isNearest) {
    sizeSuggestion = `Recommended size ${recommendedSize} is currently unavailable. We auto-selected nearest available size ${appliedSize}.`;
  }

  const trouserLengthStr = current_trouser_length && current_trouser_length > 0 ? `${current_trouser_length}"` : 'Select Length';

  return {
    garmentType,
    recommendedSize,
    appliedSize,
    isNearestAvailable: isNearest,
    fitCategory: config.name,
    confidence,
    explanation: `Calculated using ${config.name} size chart matrix for ${height_cm}cm height and ${weight_kg}kg weight.`,
    sizeSuggestion,
    shirtSize: garmentType === 'shirt' ? recommendedSize : undefined,
    trouserWaist: garmentType === 'trouser' ? recommendedSize : undefined,
    trouserLength: garmentType === 'trouser' ? trouserLengthStr : undefined,
    trouserFit: garmentType === 'trouser' ? config.name : undefined,
  };
}
