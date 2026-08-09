/**
 * D'VERO — Razorpay Payment & Pincode Serviceability Engine
 */

import crypto from 'crypto';
import Razorpay from 'razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function isPincodeCODServiceable(pincode: string): boolean {
  const pin = pincode.trim();
  if (!/^\d{6}$/.test(pin)) return false;
  // Non-serviceable remote zones fallback check
  const nonServiceablePrefixes = ['19', '79', '78', '74'];
  return !nonServiceablePrefixes.some(prefix => pin.startsWith(prefix));
}

export function generatePaymentSignatureData(orderId: string, paymentId: string) {
  return `${orderId}|${paymentId}`;
}

/**
 * Server-side Razorpay SDK Instance Factory
 */
export function getRazorpayInstance(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET) are missing from environment configuration.');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Server-Side HMAC SHA256 Signature Verification for Razorpay Payment Callbacks
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured.');
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Server-Side HMAC SHA256 Signature Verification for Razorpay Webhook Events
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}
