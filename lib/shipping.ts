/**
 * D'VERO — Shipping Calculator & Delivery Date Engine
 */

import { addBusinessDays } from '@/lib/utils';

export type ShippingTier = {
  method: 'standard' | 'express';
  label: string;
  cost: number;
  estimatedDays: number;
  deliveryDate: Date;
};

export function calculateShippingRates(subtotal: number): { standard: ShippingTier; express: ShippingTier } {
  const isFreeStandard = subtotal >= 4999;
  const standardCost = isFreeStandard ? 0 : 149;
  const expressCost = standardCost + 150;

  const now = new Date();
  const standardDate = addBusinessDays(now, 5);
  const expressDate = addBusinessDays(now, 2);

  return {
    standard: {
      method: 'standard',
      label: isFreeStandard ? 'Free Standard Shipping' : 'Standard Shipping',
      cost: standardCost,
      estimatedDays: 5,
      deliveryDate: standardDate,
    },
    express: {
      method: 'express',
      label: 'Express Air Courier',
      cost: expressCost,
      estimatedDays: 2,
      deliveryDate: expressDate,
    },
  };
}
