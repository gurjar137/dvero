'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAdminData } from '@/lib/useAdminData';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';
import { useToast } from '@/components/admin/Toast';

const STATUSES = ['processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { orders, loadOrders } = useAdminData();
  const [open, setOpen] = useState<Order | null>(null);
  const showToast = useToast();

  async function updateOrder(orderId: number, status: string, tracking: string, delivery: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status, tracking_number: tracking || null, delivery_date: delivery || null })
      .eq('id', orderId);
    if (error) {
      showToast('Could not update order');
      return;
    }
    showToast('Order status updated');
    loadOrders();
    setOpen(null);
  }

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
      new Date(o.created_at).toISOString().slice(0, 10)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dvero_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders CSV exported');
  }

  return (
    <div>
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="font-oswald text-2xl uppercase">Orders Management</h1>
          <p className="text-sm text-mute mt-1">{orders.length} total orders across store.</p>
        </div>

        <button
          onClick={exportOrdersCSV}
          className="border border-line font-oswald text-xs uppercase px-4 py-2.5 rounded hover:border-ink transition-colors min-h-[44px]"
        >
          Export Orders CSV 📥
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="font-oswald text-xs tracking-wider uppercase text-mute border-b border-line bg-bg">
              <th className="py-3.5 px-4">Order</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Items</th>
              <th className="py-3.5 px-4">Total</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Placed</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length ? (
              orders.map(o => (
                <tr key={o.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                  <td className="py-3.5 px-4 font-mono font-medium text-ink">#{o.order_number}</td>
                  <td className="py-3.5 px-4">
                    <div className="font-oswald uppercase text-ink">{o.customer_name}</div>
                    <div className="text-xs text-mute">{o.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono">
                    {(o.order_items || []).length} item{(o.order_items || []).length !== 1 ? 's' : ''}
                  </td>
                  <td className="py-3.5 px-4 font-oswald text-camelDeep font-semibold">{formatINR(o.total)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded font-oswald text-xs uppercase ${
                        o.status === 'delivered'
                          ? 'bg-success/15 text-success'
                          : o.status === 'cancelled'
                          ? 'bg-error/10 text-error'
                          : 'bg-line text-ink'
                      }`}
                    >
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-mute">
                    {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setOpen(o)}
                      className="border border-line px-3.5 py-1.5 rounded font-oswald text-xs uppercase hover:border-ink min-h-[44px]"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-10 text-mute">
                  No orders placed yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View */}
      <div className="md:hidden space-y-4">
        {orders.length ? (
          orders.map(o => (
            <div key={o.id} className="bg-panel border border-line rounded-lg p-4 shadow-sm2 space-y-3">
              <div className="flex justify-between items-start border-b border-line pb-2">
                <div>
                  <div className="font-mono text-xs font-bold text-ink">#{o.order_number}</div>
                  <div className="font-oswald text-sm uppercase text-ink mt-0.5">{o.customer_name}</div>
                  <div className="text-[0.75rem] text-mute">{o.email}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-oswald text-[0.65rem] uppercase ${
                    o.status === 'delivered'
                      ? 'bg-success/15 text-success'
                      : o.status === 'cancelled'
                      ? 'bg-error/10 text-error'
                      : 'bg-line text-ink'
                  }`}
                >
                  {o.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs font-oswald uppercase">
                <span>{(o.order_items || []).length} items · {new Date(o.created_at).toLocaleDateString('en-IN')}</span>
                <span className="text-camelDeep font-bold text-sm">{formatINR(o.total)}</span>
              </div>

              <button
                onClick={() => setOpen(o)}
                className="w-full border border-line py-2.5 rounded font-oswald text-xs uppercase text-center hover:border-ink min-h-[44px]"
              >
                Manage Order Details
              </button>
            </div>
          ))
        ) : (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute text-xs font-oswald uppercase">
            No orders placed yet.
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-ink/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setOpen(null);
          }}
        >
          <div className="bg-bg border border-line rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            <div className="flex justify-between items-center px-6 py-4 border-b border-line sticky top-0 bg-bg z-10">
              <div>
                <h3 className="font-oswald text-lg uppercase">Order #{open.order_number}</h3>
                <p className="text-xs text-mute font-mono">ID: {open.id}</p>
              </div>
              <button onClick={() => setOpen(null)} className="text-xl text-mute hover:text-ink font-oswald uppercase min-w-[44px] min-h-[44px] flex items-center justify-center">
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-panel border border-line rounded-lg p-4 text-xs space-y-1">
                <div className="font-oswald text-sm uppercase text-camelDeep font-semibold">{open.customer_name}</div>
                <div>Email: {open.email} | Phone: {open.phone}</div>
                <div>Address: {open.address}, {open.city}, {open.state} {open.pincode}</div>
                <div>Payment Method: <span className="font-mono uppercase">{open.payment_method}</span></div>
                {open.order_notes && <div className="mt-2 text-ink font-medium">Order Notes: &ldquo;{open.order_notes}&rdquo;</div>}
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-oswald text-xs uppercase text-mute mb-2">Order Line Items</h4>
                <div className="border border-line rounded overflow-hidden">
                  {(open.order_items || []).map((it, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border-b border-line last:border-0 bg-panel text-xs">
                      <div>
                        <div className="font-oswald uppercase text-ink font-medium">{it.product_name}</div>
                        <div className="text-[0.7rem] text-mute">Size: {it.size} | Qty: {it.qty}</div>
                      </div>
                      <div className="font-oswald text-camelDeep font-semibold">{formatINR(it.price * it.qty)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action Shortcuts */}
              <div className="flex justify-between items-center pt-2 border-t border-line flex-wrap gap-3">
                <div className="flex gap-2">
                  <Link
                    href={`/orders/invoice/${open.order_number}`}
                    target="_blank"
                    className="border border-line font-oswald text-xs uppercase px-3 py-2 rounded hover:border-ink min-h-[44px] flex items-center"
                  >
                    Invoice 🖨
                  </Link>
                  <Link
                    href={`/orders/track/${open.order_number}`}
                    target="_blank"
                    className="border border-line font-oswald text-xs uppercase px-3 py-2 rounded hover:border-ink min-h-[44px] flex items-center"
                  >
                    Tracker ↗
                  </Link>
                </div>

                <div className="font-oswald text-sm uppercase">
                  Total: <span className="text-camelDeep font-bold">{formatINR(open.total)}</span>
                </div>
              </div>

              {/* Status Update Form */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  updateOrder(open.id, fd.get('status') as string, fd.get('tracking') as string, fd.get('delivery') as string);
                }}
                className="bg-panel border border-line rounded-lg p-4 sm:p-5 space-y-4"
              >
                <h4 className="font-oswald text-xs uppercase text-ink font-semibold">Update Order Status</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-oswald text-[0.68rem] tracking-wider uppercase text-mute mb-1">Status</label>
                    <select
                      name="status"
                      defaultValue={open.status}
                      className="w-full border border-line bg-bg rounded px-3 py-2.5 text-xs font-oswald uppercase text-ink outline-none min-h-[44px]"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-oswald text-[0.68rem] tracking-wider uppercase text-mute mb-1">Estimated Delivery Date</label>
                    <input
                      type="date"
                      name="delivery"
                      defaultValue={open.delivery_date || ''}
                      className="w-full border border-line bg-bg rounded px-3 py-2.5 text-xs font-mono text-ink outline-none min-h-[44px]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-oswald text-[0.68rem] tracking-wider uppercase text-mute mb-1">Courier Tracking Code</label>
                    <input
                      type="text"
                      name="tracking"
                      defaultValue={open.tracking_number || ''}
                      placeholder="e.g. AWB-982314502"
                      className="w-full border border-line bg-bg rounded px-3 py-2.5 text-xs font-mono text-ink outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto bg-ink text-bg px-6 py-3 rounded font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors min-h-[44px]"
                >
                  Save Status Updates
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
