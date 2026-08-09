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

export function calculateShippingRates(_subtotal: number): { standard: ShippingTier; express: ShippingTier } {
  const now = new Date();
  const standardDate = addBusinessDays(now, 5);
  const expressDate = addBusinessDays(now, 2);

  return {
    standard: {
      method: 'standard',
      label: 'Free Standard Shipping',
      cost: 0,
      estimatedDays: 5,
      deliveryDate: standardDate,
    },
    express: {
      method: 'express',
      label: 'Free Express Air Courier',
      cost: 0,
      estimatedDays: 2,
      deliveryDate: expressDate,
    },
  };
}
