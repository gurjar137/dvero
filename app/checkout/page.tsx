'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/AuthContext';
import { useProducts } from '@/lib/useProducts';
import { useSettings } from '@/lib/useSettings';
import { supabase } from '@/lib/supabase/client';
import { formatINR, addBusinessDays, generateOrderNumber } from '@/lib/utils';
import { Address } from '@/lib/types';
import { loadRazorpayScript, isPincodeCODServiceable } from '@/lib/razorpay';
import { validateStockAvailability } from '@/lib/inventory';
import { sendEmail, generateOrderConfirmationEmailHTML } from '@/lib/email';
import { logAudit } from '@/lib/logger';

export default function CheckoutPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { cart, appliedCoupon, calcDiscount, clearCart } = useCart();
  const { findProduct } = useProducts();
  const { shippingFor } = useSettings();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [stateVal, setStateVal] = useState('Rajasthan');
  const [pincode, setPincode] = useState('');

  // Fetch Saved Customer Addresses if logged in
  const fetchAddresses = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', session.user.id);

    if (data && data.length > 0) {
      setSavedAddresses(data as Address[]);
      const def = data.find((a: Address) => a.is_default) || data[0];
      applyAddress(def);
    }
  }, [session]);

  const [isNavigatingToConfirmation, setIsNavigatingToConfirmation] = useState(false);
  const isNavigatingRef = useRef(false);
  const validCartItems = cart.filter(c => c && c.id && c.size && Number(c.qty) > 0 && Boolean(findProduct(c.id)));

  useEffect(() => {
    if (isNavigatingRef.current || isNavigatingToConfirmation) return;
    if (validCartItems.length === 0) {
      router.replace('/bag');
      return;
    }
    if (session?.user) {
      setEmail(prev => prev || session.user.email || '');
      const metaName = session.user.user_metadata?.full_name;
      if (metaName) setName(prev => prev || metaName);
      fetchAddresses();
    }
    loadRazorpayScript();
  }, [validCartItems.length, isNavigatingToConfirmation, router, session, fetchAddresses]);

  function applyAddress(addr: Address) {
    setSelectedAddrId(addr.id);
    setName(addr.full_name);
    setPhone(addr.phone);
    setAddress(addr.address);
    setCity(addr.city);
    setStateVal(addr.state);
    setPincode(addr.pincode);
  }

  const subtotal = validCartItems.reduce((s, c) => {
    const p = findProduct(c.id);
    return s + (p ? Number(p.price || 0) * (Number(c.qty) || 0) : 0);
  }, 0);

  const discount = calcDiscount(subtotal);
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const baseShipping = 0;
  const shippingCost = 0;
  const total = discountedSubtotal;

  const now = new Date();
  const deliveryEstDays = shippingMethod === 'express' ? 3 : 6;
  const estDeliveryDate = addBusinessDays(now, deliveryEstDays);

  async function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return; // Prevent duplicate submission

    setLoading(true);
    setError('');

    if (validCartItems.length === 0 || subtotal <= 0) {
      setError('Your shopping bag is empty or contains unavailable items.');
      setLoading(false);
      return;
    }

    // 1. Input Validation
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !pincode.trim()) {
      setError('Please complete all required shipping fields.');
      setLoading(false);
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      setLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError('Please enter a valid 6-digit postal pincode.');
      setLoading(false);
      return;
    }

    // 2. COD Pincode Serviceability Check
    if (paymentMethod === 'cod' && !isPincodeCODServiceable(pincode)) {
      setError('Cash on Delivery (COD) is not serviceable for this pincode. Please select UPI or Card.');
      setLoading(false);
      return;
    }

    // 3. Stock Overselling Protection
    const stockCheck = await validateStockAvailability(validCartItems, supabase);
    if (!stockCheck.valid) {
      setError('Some items in your bag exceed available stock. Please update quantity.');
      setLoading(false);
      return;
    }

    const orderNumber = generateOrderNumber();
    const cartSnapshot = [...validCartItems];

    const currentUserId = session?.user?.id ?? null;

    const orderPayload = {
      customer_id: currentUserId,
      order_number: orderNumber,
      customer_name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: stateVal.trim(),
      pincode: pincode.trim(),
      payment_method: paymentMethod === 'cod' ? 'cod' : 'razorpay',
      payment_status: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending',
      subtotal,
      shipping: shippingCost,
      total,
      status: 'processing',
      delivery_date: estDeliveryDate.toISOString().slice(0, 10),
      order_notes: orderNotes.trim() || null,
      shipping_method: shippingMethod,
    };

    try {
      // Handle Razorpay Modal Checkout for Prepaid (UPI / Card)
      if (paymentMethod !== 'cod') {
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded || typeof window === 'undefined' || !window.Razorpay) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection and try again.');
        }

        // 1. Create Razorpay Order Server-Side
        const createRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: cartSnapshot,
            shippingMethod,
            couponCode: appliedCoupon?.code,
            orderNumber,
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok || !createData.success) {
          throw new Error(createData.error || 'Could not initialize payment with Razorpay.');
        }

        const { orderId, amount, currency, keyId } = createData;

        // 2. Open Razorpay Checkout Modal with Server Order ID & Public Key
        const options = {
          key: keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          order_id: orderId,
          amount,
          currency: currency || 'INR',
          name: "D'VERO",
          description: `Order #${orderNumber}`,
          handler: async function (response: any) {
            logAudit('razorpay_payment_success', 'info', { orderNumber, paymentId: response.razorpay_payment_id });

            try {
              setLoading(true);
              // 3. Verify Payment Signature Server-Side and Finalize Order
              const { data: { session: verifySession } } = await supabase.auth.getSession();
              const verifyToken = verifySession?.access_token;

              const verifyRes = await fetch('/api/razorpay/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(verifyToken ? { Authorization: `Bearer ${verifyToken}` } : {}),
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderPayload,
                  cartSnapshot,
                  saveAddress,
                  userId: currentUserId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Server payment verification failed.');
              }

              // 4. Set Session Storage & Redirect to Confirmation
              sessionStorage.setItem(
                'dvero_last_order',
                JSON.stringify({
                  orderNumber,
                  total,
                  deliveryDate: estDeliveryDate.toISOString(),
                  customerName: name.trim(),
                  email: email.trim(),
                  paymentMethod: 'Prepaid (UPI / Card / Razorpay)',
                  paymentStatus: 'Paid',
                  shippingAddress: `${address.trim()}, ${city.trim()}, ${stateVal.trim()} - ${pincode.trim()}`,
                })
              );

              isNavigatingRef.current = true;
              setIsNavigatingToConfirmation(true);
              clearCart();
              router.push(`/confirmation/${orderNumber}`);
            } catch (vErr: any) {
              logAudit('payment_verification_error', 'error', { error: vErr.message });
              setError(vErr.message || 'Payment verification failed. Please contact support with Payment ID: ' + response.razorpay_payment_id);
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              logAudit('razorpay_payment_dismissed', 'warn', { orderNumber });
            },
          },
          prefill: {
            name: name.trim(),
            email: email.trim(),
            contact: phone.trim(),
          },
          theme: {
            color: '#111111',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }

      // Finalize Cash on Delivery (COD) order
      await finalizeOrderSubmission(orderPayload, cartSnapshot, orderNumber, estDeliveryDate);
    } catch (err: any) {
      logAudit('checkout_error', 'error', { error: err.message });
      setError(err.message || 'Could not place order — please try again.');
      setLoading(false);
    }
  }

  async function finalizeOrderSubmission(
    orderPayload: any,
    cartSnapshot: typeof cart,
    orderNumber: string,
    estDeliveryDate: Date
  ) {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const token = currentSession?.access_token;

    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        cartSnapshot,
        shippingMethod,
        couponCode: appliedCoupon?.code,
        saveAddress,
        orderPayload,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Could not complete order — please try again.');
    }

    sessionStorage.setItem(
      'dvero_last_order',
      JSON.stringify({
        orderNumber: data.orderNumber || orderNumber,
        total: data.total || total,
        deliveryDate: data.deliveryDate || estDeliveryDate.toISOString(),
        customerName: name.trim(),
        email: email.trim(),
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid (UPI / Card / Razorpay)',
        paymentStatus: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending',
        shippingAddress: `${address.trim()}, ${city.trim()}, ${stateVal.trim()} - ${pincode.trim()}`,
      })
    );

    isNavigatingRef.current = true;
    setIsNavigatingToConfirmation(true);
    clearCart();
    const finalOrderNumber = data.orderNumber || orderNumber;
    router.push(`/confirmation/${finalOrderNumber}`);
  }

  if (isNavigatingRef.current || isNavigatingToConfirmation) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-2 border-ink border-t-transparent rounded-full animate-spin" />
        <p className="font-oswald text-xs uppercase tracking-widest text-mute">Finalizing Order & Redirecting...</p>
      </main>
    );
  }

  if (validCartItems.length === 0) {
    return (
      <main className="page-fade py-24 text-center min-h-[50vh]">
        <h2 className="font-oswald text-2xl uppercase mb-3">Your Bag Is Empty</h2>
        <p className="text-mute mb-7 text-sm max-w-[30ch] mx-auto">There are no items in your bag to checkout.</p>
        <Link href="/" className="font-oswald text-xs tracking-widest uppercase bg-ink text-bg px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-colors inline-block">
          Explore Shop →
        </Link>
      </main>
    );
  }

  return (
    <main className="page-fade py-8 md:py-16 min-h-[60vh] pb-24 md:pb-16">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        <h1 className="font-oswald text-2xl sm:text-3xl uppercase mb-6 md:mb-9">Secure Checkout</h1>

        <form onSubmit={placeOrder} className="grid md:grid-cols-[1.5fr_1fr] gap-8 md:gap-14 items-start">
          <div className="flex flex-col gap-6">
            {/* Address Selection Pills for Authenticated User */}
            {savedAddresses.length > 0 && (
              <div className="bg-panel p-4 rounded-md border border-line">
                <h3 className="font-oswald text-xs uppercase tracking-wider text-camelDeep mb-3">Saved Addresses</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map(addr => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => applyAddress(addr)}
                      className={`p-3 rounded border text-left text-xs transition-all ${
                        selectedAddrId === addr.id ? 'border-ink bg-bg ring-1 ring-ink' : 'border-line hover:border-ink'
                      }`}
                    >
                      <div className="font-oswald uppercase text-ink">{addr.label || 'Home'} — {addr.full_name}</div>
                      <div className="text-mute truncate mt-1">{addr.address}, {addr.city}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Details */}
            <div className="space-y-4">
              <h3 className="font-oswald text-base uppercase border-b border-line pb-2">1. Contact & Recipient</h3>
              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Full Name *</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full border border-line bg-bg rounded-sm px-4 py-3 outline-none text-sm text-ink focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full border border-line bg-bg rounded-sm px-4 py-3 outline-none text-sm text-ink focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Phone Number (10 Digits) *</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full border border-line bg-bg rounded-sm px-4 py-3 outline-none text-sm text-ink focus:border-ink font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
              <h3 className="font-oswald text-base uppercase border-b border-line pb-2">2. Shipping Destination</h3>
              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Street Address / House / Suite *</label>
                <input
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="House No., Street, Area"
                  className="w-full border border-line bg-bg rounded-sm px-4 py-3 outline-none text-sm text-ink focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">City *</label>
                  <input
                    required
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full border border-line bg-bg rounded-sm px-3 py-3 outline-none text-sm text-ink focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">State *</label>
                  <input
                    required
                    value={stateVal}
                    onChange={e => setStateVal(e.target.value)}
                    placeholder="State"
                    className="w-full border border-line bg-bg rounded-sm px-3 py-3 outline-none text-sm text-ink focus:border-ink"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Pincode (6 Digits) *</label>
                  <input
                    required
                    value={pincode}
                    onChange={e => setPincode(e.target.value)}
                    placeholder="302001"
                    maxLength={6}
                    className="w-full border border-line bg-bg rounded-sm px-3 py-3 outline-none text-sm text-ink focus:border-ink font-mono"
                  />
                </div>
              </div>

              {session?.user && !selectedAddrId && (
                <label className="flex items-center gap-2 text-xs font-oswald uppercase text-mute cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={e => setSaveAddress(e.target.checked)}
                    className="rounded border-line"
                  />
                  Save address to my account directory
                </label>
              )}
            </div>

            {/* Shipping Method Options */}
            <div className="space-y-3">
              <h3 className="font-oswald text-base uppercase border-b border-line pb-2">3. Shipping Speed & Estimate</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setShippingMethod('standard')}
                  className={`p-4 border rounded-sm cursor-pointer flex justify-between items-center transition-all ${
                    shippingMethod === 'standard' ? 'border-ink bg-bg ring-1 ring-ink' : 'border-line bg-panel'
                  }`}
                >
                  <div>
                    <div className="font-oswald text-xs uppercase font-medium">Standard Delivery</div>
                    <div className="text-[0.7rem] text-mute">4–6 Business Days</div>
                  </div>
                  <span className="font-oswald text-xs text-camelDeep font-semibold">FREE</span>
                </label>

                <label
                  onClick={() => setShippingMethod('express')}
                  className={`p-4 border rounded-sm cursor-pointer flex justify-between items-center transition-all ${
                    shippingMethod === 'express' ? 'border-ink bg-bg ring-1 ring-ink' : 'border-line bg-panel'
                  }`}
                >
                  <div>
                    <div className="font-oswald text-xs uppercase font-medium">Express Air Courier</div>
                    <div className="text-[0.7rem] text-mute">2–3 Business Days</div>
                  </div>
                  <span className="font-oswald text-xs text-camelDeep font-semibold">FREE</span>
                </label>
              </div>
            </div>

            {/* Order Notes / Tailoring instructions */}
            <div>
              <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Order / Tailoring Notes (Optional)</label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="Mention specific length requests or delivery instructions..."
                className="w-full border border-line bg-bg rounded-sm p-3 outline-none text-xs text-ink focus:border-ink"
              />
            </div>

            {/* Payment Options */}
            <div>
              <h3 className="font-oswald text-base uppercase border-b border-line pb-2 mb-3">4. Payment Method</h3>
              <div className="flex flex-col gap-3">
                {[
                  ['upi', 'UPI / GPay / PhonePe (Razorpay)'],
                  ['card', 'Credit / Debit Card (Razorpay)'],
                  ['cod', 'Cash on Delivery (COD)'],
                ].map(([v, l]) => (
                  <label
                    key={v}
                    onClick={() => setPaymentMethod(v as any)}
                    className={`flex items-center gap-3 border rounded-sm px-4 py-3.5 cursor-pointer transition-all ${
                      paymentMethod === v ? 'border-ink bg-bg ring-1 ring-ink' : 'border-line bg-panel'
                    }`}
                  >
                    <input type="radio" name="payment" value={v} checked={paymentMethod === v} onChange={() => {}} className="accent-ink" />
                    <span className="font-oswald text-xs uppercase tracking-wider">{l}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary Right Panel */}
          <div className="bg-panel rounded-md border border-line shadow-md2 p-6 md:p-8 md:sticky md:top-24">
            <h3 className="font-oswald text-base uppercase mb-4 border-b border-line pb-3">Order Breakdown</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4 border-b border-line pb-4">
              {validCartItems.map((c, i) => {
                const p = findProduct(c.id);
                return (
                  <div key={i} className="flex justify-between text-xs text-mute">
                    <span className="truncate max-w-[200px]">
                      {p?.name} × {c.qty} ({c.size})
                    </span>
                    <span className="font-oswald text-ink">{formatINR((p?.price || 0) * c.qty)}</span>
                  </div>
                );
              })}
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-xs font-oswald uppercase text-success mb-2">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}

            <div className="space-y-2 text-xs font-oswald uppercase text-mute">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({shippingMethod === 'express' ? 'Express' : 'Standard'})</span>
                <span className="text-camelDeep font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-ink font-semibold border-t border-line pt-3 text-sm">
                <span>Total Payable</span>
                <span className="text-camelDeep">{formatINR(total)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-bg border border-line rounded text-[0.7rem] font-oswald uppercase text-mute">
              Est. Delivery Date: <strong className="text-ink">{estDeliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
            </div>

            {error && (
              <div className="bg-red-50/90 border border-red-200 rounded-md p-4 text-xs font-oswald uppercase space-y-2 mt-4 text-red-900 shadow-sm">
                <div className="font-bold flex items-center gap-2 text-sm text-red-700">
                  <span>⚠️</span> WE COULDN&apos;T COMPLETE YOUR ORDER
                </div>
                <p className="font-inter normal-case text-xs text-red-800 leading-relaxed">
                  {error} Your cart has not been lost.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-ink text-bg px-4 py-2.5 rounded text-[0.7rem] uppercase tracking-wider font-oswald hover:bg-camelDeep transition-colors min-h-[36px]"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/bag')}
                    className="border border-line bg-bg text-ink px-4 py-2.5 rounded text-[0.7rem] uppercase tracking-wider font-oswald hover:border-ink transition-colors min-h-[36px]"
                  >
                    Back to Bag
                  </button>
                </div>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-ink text-bg py-4 rounded-sm font-oswald text-xs tracking-widest uppercase mt-6 hover:bg-camelDeep transition-all disabled:opacity-60 min-h-[44px] shadow-sm2"
            >
              {loading ? 'Processing Order...' : `Place Order — ${formatINR(total)}`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
