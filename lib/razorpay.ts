/**
 * D'VERO — Razorpay Payment & Pincode Serviceability Engine
 */

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
  const nonServiceablePrefixes = ['19', '79', '78', '79', '74'];
  return !nonServiceablePrefixes.some(prefix => pin.startsWith(prefix));
}

export function generatePaymentSignatureData(orderId: string, paymentId: string) {
  return `${orderId}|${paymentId}`;
}
