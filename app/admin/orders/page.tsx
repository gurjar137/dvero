'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';
import { ProductVisual } from '@/components/GarmentIcon';

const STATUS_OPTIONS = [
  { value: 'placed', label: 'Placed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out For Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'return_requested', label: 'Return Requested' },
  { value: 'returned', label: 'Returned' },
];

export default function AdminOrdersPage() {
  const { orders, products, loadOrders, loaded } = useAdminData();
  const [open, setOpen] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToast();

  // 1. Calculate KPI Metrics dynamically from actual orders
  const metrics = useMemo(() => {
    const total = orders.length;
    const processing = orders.filter(o =>
      ['processing', 'placed', 'pending'].includes(o.status)
    ).length;
    const shipped = orders.filter(o =>
      ['shipped', 'out_for_delivery', 'packed'].includes(o.status)
    ).length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o =>
      ['cancelled', 'returned'].includes(o.status)
    ).length;

    return { total, processing, shipped, delivered, cancelled };
  }, [orders]);

  // 2. Filter Orders based on Search & Status Filter
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'processing' && !['processing', 'placed', 'pending'].includes(o.status)) {
          return false;
        }
        if (statusFilter === 'shipped' && !['shipped', 'out_for_delivery', 'packed'].includes(o.status)) {
          return false;
        }
        if (statusFilter !== 'processing' && statusFilter !== 'shipped' && o.status !== statusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderNumber = o.order_number.toLowerCase().includes(q);
        const matchesCustomer = o.customer_name.toLowerCase().includes(q);
        const matchesEmail = o.email.toLowerCase().includes(q);
        const matchesPhone = o.phone.toLowerCase().includes(q);
        const matchesProduct = (o.order_items || []).some(
          it =>
            it.product_name.toLowerCase().includes(q) ||
            it.product_id.toLowerCase().includes(q)
        );

        return (
          matchesOrderNumber ||
          matchesCustomer ||
          matchesEmail ||
          matchesPhone ||
          matchesProduct
        );
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  // Helper to find real product image
  const getProductImage = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    return prod?.images?.[0] || null;
  };

  // Helper to find product garment type
  const getProductType = (productId: string): 'shirt' | 'trouser' => {
    const prod = products.find(p => p.id === productId);
    return prod?.type || 'shirt';
  };

  // Update Order Status in Supabase
  async function updateOrder(orderId: number, status: string, tracking: string, delivery: string) {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, tracking_number: tracking || null, delivery_date: delivery || null })
        .eq('id', orderId);

      if (error) {
        showToast('Could not update order status');
        return;
      }
      showToast(`Order status updated to ${status.replace(/_/g, ' ').toUpperCase()}`);
      await loadOrders();

      // Refresh opened modal reference if open
      setOpen(prev => (prev ? { ...prev, status: status as any, tracking_number: tracking || null, delivery_date: delivery || null } : null));
    } catch (err) {
      showToast('An error occurred while updating status');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Copy Shipping Address to Clipboard
  const copyAddressToClipboard = (order: Order) => {
    const formattedAddress = `${order.customer_name}\n${order.address}\n${order.city}, ${order.state} ${order.pincode}\nIndia\nPhone: ${order.phone}`;
    navigator.clipboard.writeText(formattedAddress);
    showToast('Shipping address copied to clipboard!');
  };

  // Export Orders CSV
  function exportOrdersCSV() {
    if (orders.length === 0) return;
    const headers = ['Order Number', 'Customer Name', 'Email', 'Phone', 'Total', 'Payment Method', 'Status', 'Date'];
    const rows = orders.map(o => [
      o.order_number,
      `"${o.customer_name}"`,
      o.email,
      o.phone,
      o.total,
      o.payment_method,
      o.status,
      new Date(o.created_at).toISOString().slice(0, 10),
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dvero_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders CSV exported successfully');
  }

  // Badge Status Styling Helper
  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let badgeStyle = 'bg-[#F4F4F4] text-[#111111] border-[#E5E5E5]';

    if (s === 'delivered') {
      badgeStyle = 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    } else if (['processing', 'placed', 'pending'].includes(s)) {
      badgeStyle = 'bg-[#F0F9FF] text-[#0369A1] border-[#BAE6FD]';
    } else if (['shipped', 'out_for_delivery', 'packed'].includes(s)) {
      badgeStyle = 'bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]';
    } else if (['cancelled', 'returned', 'rejected'].includes(s)) {
      badgeStyle = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-inter text-[0.68rem] tracking-wider uppercase font-semibold border ${badgeStyle}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & CSV Export */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-normal uppercase tracking-wide text-[#111111]">
            Orders Management
          </h1>
          <p className="text-xs font-inter text-[#666666] mt-1 font-light">
            Manage, track, and process customer orders cleanly.
          </p>
        </div>

        <button
          onClick={exportOrdersCSV}
          className="border border-[#EBE8E1] bg-white font-inter text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg hover:border-[#111111] transition-all font-medium shadow-2xs min-h-[42px] flex items-center gap-2 cursor-pointer"
        >
          <span>Export Orders CSV</span>
          <span>📥</span>
        </button>
      </div>

      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#EBE8E1] p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-[#666666] block">
            TOTAL ORDERS
          </span>
          <span className="font-playfair text-2xl font-normal text-[#111111] mt-1 block">
            {metrics.total}
          </span>
        </div>

        <div className="bg-white border border-[#EBE8E1] p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-[#0369A1] block">
            PROCESSING
          </span>
          <span className="font-playfair text-2xl font-normal text-[#111111] mt-1 block">
            {metrics.processing}
          </span>
        </div>

        <div className="bg-white border border-[#EBE8E1] p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-[#6B21A8] block">
            SHIPPED
          </span>
          <span className="font-playfair text-2xl font-normal text-[#111111] mt-1 block">
            {metrics.shipped}
          </span>
        </div>

        <div className="bg-white border border-[#EBE8E1] p-3.5 sm:p-4 rounded-xl shadow-2xs">
          <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-[#166534] block">
            DELIVERED
          </span>
          <span className="font-playfair text-2xl font-normal text-[#111111] mt-1 block">
            {metrics.delivered}
          </span>
        </div>

        <div className="bg-white border border-[#EBE8E1] p-3.5 sm:p-4 rounded-xl shadow-2xs col-span-2 sm:col-span-1">
          <span className="font-inter text-[0.68rem] tracking-[0.15em] uppercase font-semibold text-[#991B1B] block">
            CANCELLED
          </span>
          <span className="font-playfair text-2xl font-normal text-[#111111] mt-1 block">
            {metrics.cancelled}
          </span>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white border border-[#EBE8E1] p-4 rounded-2xl shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-md">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, email, or product..."
            className="w-full bg-[#F6F4ED] border border-transparent focus:border-[#D4D1C9] focus:bg-white focus:ring-2 focus:ring-[#111111]/5 rounded-full pl-9 pr-4 py-2 text-xs font-inter text-[#111111] placeholder:text-[#888888] outline-none transition-all"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex overflow-x-auto gap-1.5 scrollbar-none pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'processing', label: 'Processing' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 rounded-full font-inter text-xs tracking-wider uppercase whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-[#111111] text-white font-medium shadow-2xs'
                  : 'bg-[#F3F1EC] text-[#666666] hover:bg-[#EBE8E1] hover:text-[#111111]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white border border-[#EBE8E1] rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="font-inter text-[0.68rem] tracking-[0.15em] uppercase text-[#666666] border-b border-[#EBE8E1] bg-[#FAF9F6]">
                <th className="py-3.5 px-5 font-semibold">Order</th>
                <th className="py-3.5 px-5 font-semibold">Customer</th>
                <th className="py-3.5 px-5 font-semibold">Products</th>
                <th className="py-3.5 px-5 font-semibold">Total</th>
                <th className="py-3.5 px-5 font-semibold">Status</th>
                <th className="py-3.5 px-5 font-semibold">Date</th>
                <th className="py-3.5 px-5 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E1]">
              {!loaded ? (
                /* Skeleton Loader */
                [1, 2, 3, 4].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-5"><div className="h-4 bg-[#EBE8E1] rounded w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-[#EBE8E1] rounded w-32 mb-1" /><div className="h-3 bg-[#EBE8E1] rounded w-40" /></td>
                    <td className="py-4 px-5"><div className="h-10 bg-[#EBE8E1] rounded w-48" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-[#EBE8E1] rounded w-16" /></td>
                    <td className="py-4 px-5"><div className="h-5 bg-[#EBE8E1] rounded-full w-20" /></td>
                    <td className="py-4 px-5"><div className="h-4 bg-[#EBE8E1] rounded w-20" /></td>
                    <td className="py-4 px-5 text-right"><div className="h-8 bg-[#EBE8E1] rounded-lg w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredOrders.length ? (
                filteredOrders.map(o => {
                  const firstItem = o.order_items?.[0];
                  const firstImage = firstItem ? getProductImage(firstItem.product_id) : null;
                  const firstType = firstItem ? getProductType(firstItem.product_id) : 'shirt';
                  const remainingCount = (o.order_items || []).length - 1;

                  return (
                    <tr key={o.id} className="hover:bg-[#FAF9F6] transition-colors">
                      {/* Order Number */}
                      <td className="py-4 px-5 font-mono font-semibold text-[#111111]">
                        #{o.order_number}
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-5">
                        <div className="font-playfair text-xs uppercase font-medium text-[#111111]">
                          {o.customer_name}
                        </div>
                        <div className="text-[0.72rem] text-[#666666] font-inter truncate max-w-[180px]">
                          {o.email}
                        </div>
                      </td>

                      {/* PRODUCT PREVIEW COLUMN */}
                      <td className="py-4 px-5">
                        {firstItem ? (
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#F0EFEA] border border-[#EBE8E1] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                              {firstImage ? (
                                <img
                                  src={firstImage}
                                  alt={firstItem.product_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ProductVisual image={firstImage} type={firstType} />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-playfair text-xs uppercase text-[#111111] font-medium truncate max-w-[200px]">
                                {firstItem.product_name}
                                {remainingCount > 0 && (
                                  <span className="font-inter text-[0.68rem] text-[#666666] font-semibold ml-1.5 bg-[#EFECE6] px-1.5 py-0.5 rounded">
                                    +{remainingCount} more
                                  </span>
                                )}
                              </div>
                              <div className="font-inter text-[0.7rem] text-[#666666] mt-0.5">
                                Size: <span className="font-medium text-[#111111]">{firstItem.size}</span> · Qty: <span className="font-medium text-[#111111]">{firstItem.qty}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#888888] font-inter italic">No items listed</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="py-4 px-5 font-inter font-semibold text-[#111111]">
                        {formatINR(o.total)}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {renderStatusBadge(o.status)}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 font-inter text-[#666666]">
                        {new Date(o.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => setOpen(o)}
                          className="border border-[#EBE8E1] bg-white hover:border-[#111111] hover:bg-[#111111] hover:text-white px-3.5 py-1.5 rounded-lg font-inter text-xs tracking-wider uppercase font-medium transition-all shadow-2xs cursor-pointer"
                        >
                          MANAGE
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* EMPTY STATE */
                <tr>
                  <td colSpan={7} className="text-center py-16 px-4">
                    <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#EBE8E1] mx-auto flex items-center justify-center text-[#888888] mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="w-6 h-6">
                        <path d="M6 8h12l1 13H5L6 8Z" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="font-playfair text-base uppercase tracking-[0.15em] text-[#111111] font-normal">
                      NO ORDERS FOUND
                    </h3>
                    <p className="font-inter text-xs text-[#666666] mt-1 font-light max-w-[32ch] mx-auto">
                      Orders placed by customers matching your filters will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE STACKED CARDS VIEW */}
      <div className="md:hidden space-y-3.5">
        {!loaded ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-[#EBE8E1] rounded-2xl p-4 shadow-2xs animate-pulse space-y-3">
              <div className="h-4 bg-[#EBE8E1] rounded w-24" />
              <div className="h-12 bg-[#EBE8E1] rounded" />
              <div className="h-8 bg-[#EBE8E1] rounded" />
            </div>
          ))
        ) : filteredOrders.length ? (
          filteredOrders.map(o => {
            const firstItem = o.order_items?.[0];
            const firstImage = firstItem ? getProductImage(firstItem.product_id) : null;
            const firstType = firstItem ? getProductType(firstItem.product_id) : 'shirt';
            const remainingCount = (o.order_items || []).length - 1;

            return (
              <div
                key={o.id}
                className="bg-white border border-[#EBE8E1] rounded-2xl p-4 shadow-2xs space-y-3"
              >
                {/* Header Row */}
                <div className="flex justify-between items-start border-b border-[#EBE8E1] pb-2.5">
                  <div>
                    <span className="font-mono text-xs font-semibold text-[#111111]">
                      #{o.order_number}
                    </span>
                    <h4 className="font-playfair text-xs uppercase text-[#111111] font-medium mt-0.5">
                      {o.customer_name}
                    </h4>
                    <p className="text-[0.7rem] text-[#666666] font-inter">{o.email}</p>
                  </div>
                  {renderStatusBadge(o.status)}
                </div>

                {/* Product Thumbnail Row */}
                {firstItem && (
                  <div className="flex items-center gap-3 bg-[#FAF9F6] p-2.5 rounded-xl border border-[#EBE8E1]">
                    <div className="w-12 h-12 rounded-lg bg-[#F0EFEA] border border-[#EBE8E1] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                      {firstImage ? (
                        <img src={firstImage} alt={firstItem.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ProductVisual image={firstImage} type={firstType} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-playfair text-xs uppercase text-[#111111] font-medium truncate">
                        {firstItem.product_name}
                        {remainingCount > 0 && (
                          <span className="font-inter text-[0.65rem] text-[#666666] font-semibold ml-1 bg-[#EFECE6] px-1 py-0.5 rounded">
                            +{remainingCount} more
                          </span>
                        )}
                      </div>
                      <div className="font-inter text-[0.68rem] text-[#666666] mt-0.5">
                        Size: {firstItem.size} · Qty: {firstItem.qty}
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Info & Action */}
                <div className="flex justify-between items-center text-xs font-inter pt-1">
                  <span className="text-[#666666]">
                    {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </span>
                  <span className="font-semibold text-[#111111] text-sm">
                    {formatINR(o.total)}
                  </span>
                </div>

                <button
                  onClick={() => setOpen(o)}
                  className="w-full border border-[#EBE8E1] bg-white hover:border-[#111111] py-2.5 rounded-xl font-inter text-xs tracking-wider uppercase font-medium text-center shadow-2xs min-h-[42px] cursor-pointer"
                >
                  MANAGE ORDER
                </button>
              </div>
            );
          })
        ) : (
          <div className="bg-white border border-[#EBE8E1] rounded-2xl p-8 text-center text-[#666666] text-xs font-inter uppercase">
            No orders found.
          </div>
        )}
      </div>

      {/* MANAGE ORDER DETAILS DRAWER / MODAL */}
      {open && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
          className="fixed inset-0 z-[2000] bg-black/40 backdrop-blur-xs flex justify-end animate-fadeIn transition-all duration-300"
        >
          {/* Right-Side Drawer Container */}
          <div
            className="w-full sm:w-[560px] md:w-[600px] h-full bg-[#FAF9F6] text-[#111111] border-l border-[#EBE8E1] shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft rounded-t-[28px] sm:rounded-none mt-auto sm:mt-0 max-h-[92vh] sm:max-h-full"
            onClick={e => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div className="px-6 py-4 border-b border-[#EBE8E1] flex justify-between items-center bg-[#FAF9F6] shrink-0">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-playfair text-lg sm:text-xl uppercase tracking-[0.15em] font-normal text-[#111111]">
                    ORDER #{open.order_number}
                  </h2>
                  {renderStatusBadge(open.status)}
                </div>
                <p className="font-inter text-xs text-[#666666] font-light mt-0.5">
                  Placed on{' '}
                  {new Date(open.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <button
                onClick={() => setOpen(null)}
                aria-label="Close modal"
                className="p-2 rounded-full text-[#666666] hover:text-[#111111] hover:bg-[#EFECE6] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* SCROLLABLE DRAWER BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin touch-pan-y">
              {/* CUSTOMER INFORMATION CARD */}
              <section className="bg-white border border-[#EBE8E1] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
                <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                  CUSTOMER INFORMATION
                </h3>
                <div className="pt-1">
                  <h4 className="font-playfair text-sm uppercase text-[#111111] font-medium">
                    {open.customer_name}
                  </h4>
                  <div className="font-inter text-xs text-[#666666] space-y-1 mt-1">
                    <p>Email: <span className="text-[#111111] font-mono">{open.email}</span></p>
                    <p>Phone: <span className="text-[#111111] font-mono">{open.phone || 'Not specified'}</span></p>
                  </div>
                </div>
              </section>

              {/* PRODUCTS ORDERED SECTION */}
              <section className="space-y-3">
                <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                  ORDER ITEMS ({(open.order_items || []).length})
                </h3>

                <div className="space-y-2.5">
                  {(open.order_items || []).map((it, idx) => {
                    const img = getProductImage(it.product_id);
                    const garmentType = getProductType(it.product_id);
                    const prod = products.find(p => p.id === it.product_id);

                    return (
                      <div
                        key={idx}
                        className="bg-white border border-[#EBE8E1] rounded-2xl p-3.5 flex gap-4 items-center shadow-2xs"
                      >
                        {/* Product Image Thumbnail */}
                        <div className="w-16 h-20 bg-[#F0EFEA] rounded-xl border border-[#EBE8E1] overflow-hidden flex items-center justify-center shrink-0">
                          {img ? (
                            <img src={img} alt={it.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <ProductVisual image={img} type={garmentType} />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-playfair text-xs sm:text-sm uppercase tracking-wide text-[#111111] font-normal truncate">
                            {it.product_name}
                          </h4>
                          <div className="font-inter text-[0.72rem] text-[#666666]">
                            Size: <span className="font-medium text-[#111111]">{it.size}</span>
                            {prod?.fabric && ` · Fabric: ${prod.fabric}`}
                          </div>
                          <div className="font-inter text-xs text-[#666666]">
                            Qty: <span className="font-semibold text-[#111111]">{it.qty}</span> × {formatINR(it.price)}
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="font-inter text-xs font-semibold text-[#111111] text-right shrink-0">
                          {formatINR(it.price * it.qty)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* SHIPPING ADDRESS CARD */}
              <section className="bg-white border border-[#EBE8E1] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                    DELIVERY ADDRESS
                  </h3>
                  <button
                    type="button"
                    onClick={() => copyAddressToClipboard(open)}
                    className="text-[0.68rem] font-inter uppercase tracking-wider text-[#111111] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Copy Address</span>
                    <span>📋</span>
                  </button>
                </div>

                <div className="font-inter text-xs text-[#111111] leading-relaxed">
                  <p className="font-semibold font-playfair uppercase text-xs">{open.customer_name}</p>
                  <p>{open.address}</p>
                  <p>{open.city}, {open.state} {open.pincode}</p>
                  <p className="text-[#666666] font-light mt-0.5">India</p>
                </div>
              </section>

              {/* PAYMENT & ORDER NOTES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <section className="bg-white border border-[#EBE8E1] rounded-2xl p-4 shadow-2xs space-y-2">
                  <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                    PAYMENT
                  </h3>
                  <div className="font-inter text-xs text-[#111111] space-y-1">
                    <p>Method: <span className="font-mono uppercase font-semibold">{open.payment_method}</span></p>
                    <p>Status: <span className="font-mono text-[#166534] font-semibold">{open.payment_status || 'Paid'}</span></p>
                  </div>
                </section>

                {open.order_notes && (
                  <section className="bg-white border border-[#EBE8E1] rounded-2xl p-4 shadow-2xs space-y-1">
                    <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                      ORDER NOTES
                    </h3>
                    <p className="font-inter text-xs text-[#111111] italic">&ldquo;{open.order_notes}&rdquo;</p>
                  </section>
                )}
              </div>

              {/* ORDER SUMMARY */}
              <section className="bg-white border border-[#EBE8E1] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
                <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666] mb-3">
                  ORDER SUMMARY
                </h3>
                <div className="space-y-2 text-xs font-inter uppercase">
                  <div className="flex justify-between text-[#666666]">
                    <span>Subtotal</span>
                    <span className="font-medium text-[#111111]">
                      {formatINR(open.subtotal || (open.order_items || []).reduce((s, i) => s + i.price * i.qty, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>Shipping</span>
                    <span className="font-medium text-[#111111]">
                      {open.shipping > 0 ? formatINR(open.shipping) : 'FREE'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-[#111111] font-semibold pt-2 border-t border-[#EBE8E1]">
                    <span>TOTAL</span>
                    <span>{formatINR(open.total)}</span>
                  </div>
                </div>
              </section>

              {/* STATUS UPDATE FORM */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  updateOrder(
                    open.id,
                    fd.get('status') as string,
                    fd.get('tracking') as string,
                    fd.get('delivery') as string
                  );
                }}
                className="bg-white border border-[#EBE8E1] rounded-2xl p-5 shadow-2xs space-y-4"
              >
                <h3 className="font-inter text-[0.68rem] tracking-[0.2em] uppercase font-semibold text-[#666666]">
                  UPDATE ORDER STATUS
                </h3>

                <div className="space-y-3.5">
                  <div>
                    <label className="block font-inter text-[0.68rem] tracking-wider uppercase text-[#666666] mb-1 font-medium">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={open.status}
                      className="w-full border border-[#EBE8E1] bg-[#FAF9F6] focus:border-[#111111] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-inter uppercase text-[#111111] outline-none transition-all cursor-pointer"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-inter text-[0.68rem] tracking-wider uppercase text-[#666666] mb-1 font-medium">
                        Courier AWB / Tracking Code
                      </label>
                      <input
                        type="text"
                        name="tracking"
                        defaultValue={open.tracking_number || ''}
                        placeholder="e.g. AWB-982314502"
                        className="w-full border border-[#EBE8E1] bg-[#FAF9F6] focus:border-[#111111] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#111111] outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-inter text-[0.68rem] tracking-wider uppercase text-[#666666] mb-1 font-medium">
                        Estimated Delivery Date
                      </label>
                      <input
                        type="date"
                        name="delivery"
                        defaultValue={open.delivery_date || ''}
                        className="w-full border border-[#EBE8E1] bg-[#FAF9F6] focus:border-[#111111] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#111111] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#111111] text-white py-3.5 rounded-xl font-inter text-xs tracking-[0.15em] uppercase hover:bg-[#333333] transition-all font-medium shadow-2xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Saving Updates...</span>
                    ) : (
                      <>
                        <span>UPDATE STATUS</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* DRAWER FOOTER SHORTCUTS */}
            <div className="px-6 py-4 border-t border-[#EBE8E1] bg-[#FAF9F6] flex items-center justify-between gap-3 shrink-0">
              <div className="flex gap-2">
                <Link
                  href={`/orders/invoice/${open.order_number}`}
                  target="_blank"
                  className="border border-[#EBE8E1] bg-white font-inter text-xs tracking-wider uppercase px-3.5 py-2 rounded-lg hover:border-[#111111] transition-all font-medium shadow-2xs flex items-center gap-1.5"
                >
                  <span>Invoice</span>
                  <span>🖨</span>
                </Link>
                <Link
                  href={`/orders/track/${open.order_number}`}
                  target="_blank"
                  className="border border-[#EBE8E1] bg-white font-inter text-xs tracking-wider uppercase px-3.5 py-2 rounded-lg hover:border-[#111111] transition-all font-medium shadow-2xs flex items-center gap-1.5"
                >
                  <span>Tracker</span>
                  <span>↗</span>
                </Link>
              </div>

              <div className="font-inter text-xs uppercase font-semibold text-[#111111]">
                Total: <span className="font-bold text-sm">{formatINR(open.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
