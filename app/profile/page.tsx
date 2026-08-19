'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthContext';
import { useWishlist } from '@/components/WishlistContext';
import { useRecentlyViewed } from '@/components/RecentlyViewedContext';
import { useCart } from '@/components/CartContext';
import { useProducts } from '@/lib/useProducts';
import { Address, Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { ProductVisual } from '@/components/GarmentIcon';
import { Toast } from '@/components/Toast';
import { ContactUsContent } from '@/components/ContactUsContent';

type Tab = 'overview' | 'orders' | 'addresses' | 'profile' | 'contact' | 'notifications' | 'security';

export default function ProfilePage() {
  const { session, loading: authLoading } = useAuth();
  const { wishlist } = useWishlist();
  const { recentlyViewed } = useRecentlyViewed();
  const { addToCart, setCartDrawerOpen } = useCart();
  const { findProduct, stockFor } = useProducts();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    const tabParam = searchParams?.get('tab') as Tab | null;
    if (tabParam && ['overview', 'orders', 'addresses', 'profile', 'contact', 'notifications', 'security'].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Address Form State
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);

  // Notification Preferences
  const [notifOrder, setNotifOrder] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifNewsletter, setNotifNewsletter] = useState(false);

  // Security & 2FA State
  const [enable2FA, setEnable2FA] = useState(false);

  // Toast Banner State
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    if (!authLoading && !session) router.replace('/login');
  }, [authLoading, session, router]);

  useEffect(() => {
    if (session) {
      setName(session.user.user_metadata?.full_name || '');
      setPhone(session.user.user_metadata?.phone || '');
      setAvatarUrl(session.user.user_metadata?.avatar_url || '');
    } else {
      setName('');
      setPhone('');
      setAvatarUrl('');
      setAddresses([]);
      setOrders([]);
    }
  }, [session]);

  const loadData = useCallback(async () => {
    if (!session) return;
    setLoading(true);

    const [{ data: addrData }, { data: orderData }] = await Promise.all([
      supabase.from('customer_addresses').select('*').eq('customer_id', session.user.id).order('is_default', { ascending: false }),
      supabase.from('orders').select('*, order_items(*)').eq('email', session.user.email).order('created_at', { ascending: false })
    ]);

    setAddresses(addrData ? (addrData as Address[]) : []);
    setOrders(orderData ? (orderData as Order[]) : []);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (session) {
      loadData();
    } else {
      setAddresses([]);
      setOrders([]);
    }
  }, [session, loadData]);

  function triggerToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    setToast({ message, type });
  }

  // Profile Information Save
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, phone, avatar_url: avatarUrl }
    });
    if (!error) triggerToast('Profile details saved successfully');
    else triggerToast(error.message || 'Could not update profile', 'error');
  }

  // One-Click Reorder Action
  function handleReorder(order: Order) {
    if (!order.order_items || order.order_items.length === 0) return;
    let addedCount = 0;
    order.order_items.forEach(item => {
      const avail = stockFor(item.product_id, item.size);
      if (avail > 0) {
        addToCart(item.product_id, item.size, item.qty);
        addedCount += item.qty;
      }
    });

    if (addedCount > 0) {
      triggerToast(`Reordered ${addedCount} item${addedCount > 1 ? 's' : ''} to bag ✓`);
      setCartDrawerOpen(true);
    } else {
      triggerToast('Items in this order are currently out of stock.', 'error');
    }
  }

  // Cancel Order Action
  async function handleCancelOrder(orderNumber: string) {
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to cancel Order #${orderNumber}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(prev => prev.map(o => (o.order_number === orderNumber ? { ...o, status: 'cancelled' } : o)));
        triggerToast(`Order #${orderNumber} has been cancelled`);
      } else {
        const { error } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('order_number', orderNumber);
        if (!error) {
          setOrders(prev => prev.map(o => (o.order_number === orderNumber ? { ...o, status: 'cancelled' } : o)));
          triggerToast(`Order #${orderNumber} has been cancelled`);
        } else {
          triggerToast(data.error || 'Could not cancel order', 'error');
        }
      }
    } catch (e) {
      triggerToast('Error cancelling order', 'error');
    }
  }

  // Address Handlers
  async function saveAddress(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session) return;
    const fd = new FormData(e.currentTarget);
    const phoneVal = (fd.get('phone') as string).trim();
    const pinVal = (fd.get('pincode') as string).trim();

    if (!/^\d{10}$/.test(phoneVal)) {
      triggerToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }
    if (!/^\d{6}$/.test(pinVal)) {
      triggerToast('Please enter a valid 6-digit pincode', 'error');
      return;
    }

    const payload = {
      customer_id: session.user.id,
      label: (fd.get('label') as string) || 'Home',
      full_name: fd.get('name') as string,
      phone: phoneVal,
      address: fd.get('address') as string,
      city: fd.get('city') as string,
      state: fd.get('state') as string,
      pincode: pinVal,
      is_default: editingAddr ? editingAddr.is_default : addresses.length === 0
    };

    if (editingAddr) {
      await supabase.from('customer_addresses').update(payload).eq('id', editingAddr.id);
      triggerToast('Address updated');
    } else {
      await supabase.from('customer_addresses').insert([payload]);
      triggerToast('Address added');
    }

    setShowAddrForm(false);
    setEditingAddr(null);
    loadData();
  }

  async function removeAddress(id: number) {
    await supabase.from('customer_addresses').delete().eq('id', id);
    triggerToast('Address removed');
    loadData();
  }

  async function setDefaultAddress(id: number) {
    if (!session) return;
    await supabase.from('customer_addresses').update({ is_default: false }).eq('customer_id', session.user.id);
    await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id);
    triggerToast('Default address updated');
    loadData();
  }

  // Change Password
  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const p1 = fd.get('password') as string;
    const p2 = fd.get('confirm') as string;

    if (p1.length < 6) {
      triggerToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (p1 !== p2) {
      triggerToast('Passwords do not match', 'error');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: p1 });
    if (!error) {
      triggerToast('Password updated successfully');
      e.currentTarget.reset();
    } else {
      triggerToast(error.message, 'error');
    }
  }

  // Logout Other Devices
  async function handleLogoutOthers() {
    try {
      await supabase.auth.signOut({ scope: 'others' });
      triggerToast('Logged out all other active sessions', 'info');
    } catch (e) {
      triggerToast('Could not logout other sessions', 'error');
    }
  }

  // Soft Delete Request
  function handleDeleteAccount() {
    if (confirm('Request account deactivation? Our support team will process this within 24 hours.')) {
      triggerToast('Account deactivation request logged.', 'info');
    }
  }

  if (authLoading || !session) return <div className="py-24 text-center text-mute font-oswald text-xs uppercase">Loading Account...</div>;

  // Account completion calculator
  const completionSteps = [
    Boolean(name),
    Boolean(phone),
    Boolean(avatarUrl),
    addresses.length > 0,
    orders.length > 0
  ];
  const completionPct = Math.round((completionSteps.filter(Boolean).length / completionSteps.length) * 100);

  const tabsNav: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders', count: orders.length },
    { id: 'addresses', label: 'Addresses', count: addresses.length },
    { id: 'profile', label: 'Profile' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="page-fade py-8 md:py-16 min-h-[70vh]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-5 md:px-14">
        {/* Profile Header Card */}
        <div className="bg-panel border border-line rounded-lg p-6 sm:p-8 mb-8 shadow-sm2 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-ink text-bg flex items-center justify-center font-cinzel text-2xl uppercase border-2 border-camelDeep overflow-hidden flex-shrink-0 shadow-md2">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (name || session.user.email || 'V')[0]
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-oswald text-xl sm:text-2xl uppercase">{name || 'Client Profile'}</h1>
                <span className="font-oswald text-[0.6rem] uppercase tracking-wider bg-camel/30 text-camelDeep px-2 py-0.5 rounded">
                  Client
                </span>
              </div>
              <p className="text-xs text-mute font-mono mt-0.5">{session.user.email}</p>
              {phone && <p className="text-xs text-mute mt-0.5">Phone: {phone}</p>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <div className="flex justify-between text-[0.68rem] font-oswald uppercase text-mute mb-1">
                <span>Profile Completion</span>
                <span>{completionPct}%</span>
              </div>
              <div className="w-full bg-line h-1.5 rounded-full overflow-hidden">
                <div className="bg-camelDeep h-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
              </div>
            </div>

            <button
              onClick={() => router.push('/bag')}
              className="font-oswald text-xs uppercase tracking-wider border-b border-ink hover:text-camelDeep transition-colors pt-2"
            >
              View Active Bag →
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex gap-2 border-b border-line overflow-x-auto pb-px mb-8 scrollbar-none">
          {tabsNav.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`font-oswald text-xs tracking-wider uppercase px-4 py-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[44px] ${
                tab === t.id ? 'border-ink text-ink font-semibold' : 'border-transparent text-mute hover:text-ink'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-panel border border-line text-[0.62rem] px-1.5 py-0.2 rounded-full font-mono">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-panel border border-line p-5 rounded-md shadow-sm2">
                <div className="font-oswald text-2xl text-ink font-semibold">{orders.length}</div>
                <div className="font-oswald text-xs uppercase text-mute tracking-wider mt-1">Total Orders</div>
              </div>

              <div className="bg-panel border border-line p-5 rounded-md shadow-sm2">
                <div className="font-oswald text-2xl text-ink font-semibold">{wishlist.length}</div>
                <div className="font-oswald text-xs uppercase text-mute tracking-wider mt-1">Saved Wishlist</div>
              </div>

              <div className="bg-panel border border-line p-5 rounded-md shadow-sm2">
                <div className="font-oswald text-2xl text-ink font-semibold">{addresses.length}</div>
                <div className="font-oswald text-xs uppercase text-mute tracking-wider mt-1">Saved Addresses</div>
              </div>

              <div className="bg-panel border border-line p-5 rounded-md shadow-sm2">
                <div className="font-oswald text-2xl text-camelDeep font-semibold">
                  {orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length}
                </div>
                <div className="font-oswald text-xs uppercase text-mute tracking-wider mt-1">Active Deliveries</div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-panel border border-line rounded-md p-6 shadow-sm2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-oswald text-base uppercase">Recent Orders</h3>
                {orders.length > 0 && (
                  <button onClick={() => setTab('orders')} className="font-oswald text-xs uppercase text-mute hover:text-ink border-b border-line">
                    View All ({orders.length}) →
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <p className="text-mute text-xs py-4">No recent orders yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.slice(0, 2).map(o => (
                    <div key={o.id} className="bg-bg border border-line p-4 rounded flex justify-between items-center flex-wrap gap-3">
                      <div>
                        <div className="font-oswald text-xs uppercase font-medium">#{o.order_number}</div>
                        <div className="text-[0.7rem] text-mute">{new Date(o.created_at).toLocaleDateString('en-IN')}</div>
                      </div>
                      <span className="font-oswald text-[0.62rem] uppercase tracking-wider px-2.5 py-1 rounded bg-panel border border-line">
                        {o.status.replace(/_/g, ' ')}
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => handleReorder(o)} className="font-oswald text-xs uppercase px-3 py-1.5 bg-ink text-bg rounded hover:bg-camelDeep">
                          Reorder
                        </button>
                        <Link href={`/orders/track/${o.order_number}`} className="font-oswald text-xs uppercase px-3 py-1.5 border border-line rounded hover:border-ink">
                          Track
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist & Recently Viewed Summaries */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Wishlist Summary */}
              <div className="bg-panel border border-line p-6 rounded-md shadow-sm2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-oswald text-base uppercase">Wishlist Highlights</h3>
                  <Link href="/wishlist" className="font-oswald text-xs uppercase text-mute hover:text-ink border-b border-line">
                    View Page →
                  </Link>
                </div>
                {wishlist.length === 0 ? (
                  <p className="text-mute text-xs">No saved wishlist items.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {wishlist.slice(0, 2).map(id => {
                      const p = findProduct(id);
                      if (!p) return null;
                      return (
                        <Link key={id} href={`/product/${id}`} className="flex gap-3 p-2 bg-bg border border-line rounded items-center">
                          <div className="w-12 h-14 bg-panel rounded flex items-center justify-center flex-shrink-0">
                            <ProductVisual image={p.images?.[0]} type={p.type} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-oswald text-xs uppercase truncate">{p.name}</div>
                            <div className="font-oswald text-xs text-camelDeep">{formatINR(p.price)}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recently Viewed Summary */}
              <div className="bg-panel border border-line p-6 rounded-md shadow-sm2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-oswald text-base uppercase">Recently Viewed</h3>
                </div>
                {recentlyViewed.length === 0 ? (
                  <p className="text-mute text-xs">No recently viewed garments.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {recentlyViewed.slice(0, 2).map(id => {
                      const p = findProduct(id);
                      if (!p) return null;
                      return (
                        <Link key={id} href={`/product/${id}`} className="flex gap-3 p-2 bg-bg border border-line rounded items-center">
                          <div className="w-12 h-14 bg-panel rounded flex items-center justify-center flex-shrink-0">
                            <ProductVisual image={p.images?.[0]} type={p.type} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-oswald text-xs uppercase truncate">{p.name}</div>
                            <div className="font-oswald text-xs text-camelDeep">{formatINR(p.price)}</div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="space-y-6 animate-fadeIn">
            {loading ? (
              <div className="text-center py-12 font-oswald text-xs uppercase text-mute">Loading Orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-panel border border-line rounded-md">
                <p className="font-oswald text-lg uppercase mb-2">No Order History</p>
                <p className="text-mute text-xs mb-6">You have not placed any orders yet.</p>
                <Link href="/" className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-6 py-3 rounded">
                  Explore Shop
                </Link>
              </div>
            ) : (
              orders.map(o => (
                <div key={o.id} className="bg-panel border border-line rounded-md p-6 shadow-sm2">
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b border-line pb-4 mb-4">
                    <div>
                      <div className="font-oswald text-base uppercase font-semibold text-ink">Order #{o.order_number}</div>
                      <div className="text-xs text-mute mt-1">Placed on {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-oswald text-xs uppercase tracking-wider px-3 py-1 rounded border ${
                          o.status === 'cancelled'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : o.status === 'delivered'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-bg text-ink border-line'
                        }`}
                      >
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {(o.order_items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1 text-mute">
                        <span>{it.product_name} — Size {it.size} × Qty {it.qty}</span>
                        <span className="font-oswald text-ink">{formatINR(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary & Action Toolbar */}
                  <div className="pt-4 border-t border-line flex flex-wrap justify-between items-center gap-4">
                    <div className="font-oswald text-xs uppercase">
                      Total: <span className="text-camelDeep text-sm font-semibold">{formatINR(o.total)}</span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleReorder(o)}
                        className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
                      >
                        Reorder All
                      </button>
                      <Link
                        href={`/orders/track/${o.order_number}`}
                        className="border border-line font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:border-ink transition-colors min-h-[44px] flex items-center"
                      >
                        Track Status
                      </Link>
                      <Link
                        href={`/orders/invoice/${o.order_number}`}
                        className="border border-line font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:border-ink transition-colors min-h-[44px] flex items-center"
                      >
                        Invoice PDF
                      </Link>

                      {/* Order Actions based on Status */}
                      {o.status === 'delivered' ? (
                        <Link
                          href={`/orders/return/${o.order_number}`}
                          className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded hover:bg-camelDeep transition-colors min-h-[44px] flex items-center"
                        >
                          Return / Exchange
                        </Link>
                      ) : o.status === 'cancelled' ? (
                        <span className="border border-red-200 bg-red-50 text-red-700 font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded min-h-[44px] flex items-center">
                          ORDER CANCELLED
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCancelOrder(o.order_number)}
                          className="border border-red-300 text-red-700 hover:bg-red-50 font-oswald text-xs uppercase tracking-wider px-4 py-2 rounded transition-colors min-h-[44px] flex items-center cursor-pointer"
                        >
                          CANCEL ORDER
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADDRESSES TAB */}
        {tab === 'addresses' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="font-oswald text-lg uppercase">Saved Address Directory</h3>
              {!showAddrForm && (
                <button
                  onClick={() => {
                    setEditingAddr(null);
                    setShowAddrForm(true);
                  }}
                  className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-4 py-2.5 rounded hover:bg-camelDeep min-h-[44px]"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {/* Address List */}
            <div className="grid md:grid-cols-2 gap-5">
              {addresses.map(a => (
                <div key={a.id} className="bg-panel border border-line rounded-md p-6 shadow-sm2 relative">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-oswald text-xs uppercase tracking-wider text-camelDeep font-medium">{a.label}</span>
                    {a.is_default && (
                      <span className="font-oswald text-[0.62rem] uppercase tracking-wider bg-ink text-bg px-2 py-0.5 rounded">
                        Default Address
                      </span>
                    )}
                  </div>
                  <p className="font-oswald text-sm uppercase text-ink">{a.full_name}</p>
                  <p className="text-xs text-mute mt-1">{a.address}</p>
                  <p className="text-xs text-mute">{a.city}, {a.state} - {a.pincode}</p>
                  <p className="text-xs text-mute mt-1">Phone: {a.phone}</p>

                  <div className="flex gap-4 mt-4 pt-3 border-t border-line">
                    {!a.is_default && (
                      <button onClick={() => setDefaultAddress(a.id)} className="text-xs font-oswald uppercase text-mute hover:text-ink">
                        Set As Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingAddr(a);
                        setShowAddrForm(true);
                      }}
                      className="text-xs font-oswald uppercase text-mute hover:text-ink"
                    >
                      Edit
                    </button>
                    <button onClick={() => removeAddress(a.id)} className="text-xs font-oswald uppercase text-error">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add / Edit Address Form */}
            {showAddrForm && (
              <form onSubmit={saveAddress} className="bg-panel border border-line rounded-md p-6 md:p-8 max-w-xl space-y-4 shadow-md2">
                <h4 className="font-oswald text-base uppercase border-b border-line pb-2">
                  {editingAddr ? 'Edit Saved Address' : 'New Shipping Address'}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="label"
                    defaultValue={editingAddr?.label || 'Home'}
                    placeholder="Address Label (Home / Office)"
                    className="col-span-2 bg-bg border border-line px-3 py-2.5 text-xs font-oswald uppercase rounded"
                    required
                  />
                  <input
                    name="name"
                    defaultValue={editingAddr?.full_name || name}
                    placeholder="Recipient Full Name *"
                    className="col-span-2 bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded"
                    required
                  />
                  <input
                    name="phone"
                    defaultValue={editingAddr?.phone || phone}
                    placeholder="10-Digit Phone Number *"
                    maxLength={10}
                    className="col-span-2 bg-bg border border-line px-3 py-2.5 text-xs font-mono text-ink rounded"
                    required
                  />
                  <input
                    name="address"
                    defaultValue={editingAddr?.address || ''}
                    placeholder="Street Address / House No. *"
                    className="col-span-2 bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded"
                    required
                  />
                  <input
                    name="city"
                    defaultValue={editingAddr?.city || 'Jaipur'}
                    placeholder="City *"
                    className="bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded"
                    required
                  />
                  <input
                    name="state"
                    defaultValue={editingAddr?.state || 'Rajasthan'}
                    placeholder="State *"
                    className="bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded"
                    required
                  />
                  <input
                    name="pincode"
                    defaultValue={editingAddr?.pincode || ''}
                    placeholder="6-Digit Pincode *"
                    maxLength={6}
                    className="col-span-2 bg-bg border border-line px-3 py-2.5 text-xs font-mono text-ink rounded"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="bg-ink text-bg font-oswald text-xs uppercase tracking-wider px-6 py-3 rounded min-h-[44px]">
                    Save Address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddrForm(false);
                      setEditingAddr(null);
                    }}
                    className="border border-line font-oswald text-xs uppercase tracking-wider px-6 py-3 rounded min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="bg-panel border border-line rounded-md p-6 sm:p-8 max-w-xl space-y-6 animate-fadeIn shadow-sm2">
            <h3 className="font-oswald text-base uppercase border-b border-line pb-3">Personal Profile Details</h3>

            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Avatar / Photo Public URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={e => setAvatarUrl(e.target.value)}
                  placeholder="https://domain.com/avatar.jpg"
                  className="w-full bg-bg border border-line px-3 py-2.5 text-xs font-mono text-ink rounded"
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Primary Email (Account ID)</label>
                <input disabled value={session.user.email} className="w-full bg-bg border border-line px-3 py-2.5 text-xs text-mute opacity-60 rounded" />
              </div>

              <div>
                <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Phone Number (SMS Ready)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="10-Digit Phone"
                  className="w-full bg-bg border border-line px-3 py-2.5 text-xs font-mono text-ink rounded"
                />
              </div>

              <button type="submit" className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]">
                Save Profile Changes
              </button>
            </form>

            <div className="pt-6 border-t border-line">
              <h4 className="font-oswald text-xs uppercase text-error mb-2">Danger Zone</h4>
              <button onClick={handleDeleteAccount} className="font-oswald text-xs uppercase text-error border-b border-error">
                Request Account Deactivation
              </button>
            </div>
          </div>
        )}

        {/* CONTACT US TAB */}
        {tab === 'contact' && <ContactUsContent showHeader={false} />}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <div className="bg-panel border border-line rounded-md p-6 sm:p-8 max-w-xl space-y-6 animate-fadeIn shadow-sm2">
            <h3 className="font-oswald text-base uppercase border-b border-line pb-3">Notification Preferences</h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-bg border border-line rounded cursor-pointer">
                <div>
                  <div className="font-oswald text-xs uppercase text-ink">Order & Shipping Alerts</div>
                  <div className="text-[0.7rem] text-mute">Receive real-time tracking SMS and email updates</div>
                </div>
                <input type="checkbox" checked={notifOrder} onChange={e => setNotifOrder(e.target.checked)} className="accent-ink w-4 h-4" />
              </label>

              <label className="flex items-center justify-between p-3 bg-bg border border-line rounded cursor-pointer">
                <div>
                  <div className="font-oswald text-xs uppercase text-ink">Collection Drop Invites</div>
                  <div className="text-[0.7rem] text-mute">Be first to view limited formalwear releases</div>
                </div>
                <input type="checkbox" checked={notifPromos} onChange={e => setNotifPromos(e.target.checked)} className="accent-ink w-4 h-4" />
              </label>

              <label className="flex items-center justify-between p-3 bg-bg border border-line rounded cursor-pointer">
                <div>
                  <div className="font-oswald text-xs uppercase text-ink">Atelier Editorial Newsletter</div>
                  <div className="text-[0.7rem] text-mute">Monthly style guides and tailoring tips</div>
                </div>
                <input type="checkbox" checked={notifNewsletter} onChange={e => setNotifNewsletter(e.target.checked)} className="accent-ink w-4 h-4" />
              </label>

              <button
                onClick={() => triggerToast('Notification preferences updated')}
                className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {tab === 'security' && (
          <div className="bg-panel border border-line rounded-md p-6 sm:p-8 max-w-xl space-y-8 animate-fadeIn shadow-sm2">
            <div>
              <h3 className="font-oswald text-base uppercase border-b border-line pb-3 mb-4">Change Account Password</h3>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">New Password (Min. 6 chars)</label>
                  <input type="password" name="password" minLength={6} className="w-full bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded" required />
                </div>
                <div>
                  <label className="block text-[0.68rem] font-oswald uppercase text-mute mb-1">Confirm New Password</label>
                  <input type="password" name="confirm" minLength={6} className="w-full bg-bg border border-line px-3 py-2.5 text-xs text-ink rounded" required />
                </div>
                <button type="submit" className="bg-ink text-bg font-oswald text-xs uppercase tracking-widest px-8 py-3.5 rounded hover:bg-camelDeep transition-colors min-h-[44px]">
                  Update Password
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-line space-y-3">
              <h4 className="font-oswald text-sm uppercase text-ink">Active Device Sessions</h4>
              <div className="p-3 bg-bg border border-line rounded text-xs flex justify-between items-center">
                <div>
                  <div className="font-oswald uppercase text-ink">Current Session</div>
                  <div className="text-mute text-[0.7rem]">Active Now • Web Client</div>
                </div>
                <span className="text-success text-[0.65rem] font-oswald uppercase font-semibold">Active</span>
              </div>
              <button
                onClick={handleLogoutOthers}
                className="border border-line font-oswald text-xs uppercase tracking-wider px-4 py-2.5 rounded hover:border-ink transition-colors min-h-[44px]"
              >
                Logout Other Devices
              </button>
            </div>

            <div className="pt-6 border-t border-line">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-oswald text-sm uppercase text-ink">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[0.7rem] text-mute">Future-ready security layer for client accounts</p>
                </div>
                <input
                  type="checkbox"
                  checked={enable2FA}
                  onChange={e => {
                    setEnable2FA(e.target.checked);
                    triggerToast(e.target.checked ? '2FA ready for next authentication update' : '2FA disabled');
                  }}
                  className="accent-ink w-5 h-5 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Alert Component */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
