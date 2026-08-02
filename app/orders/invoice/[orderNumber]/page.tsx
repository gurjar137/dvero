'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';

export default function InvoicePage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('order_number', params.orderNumber)
        .maybeSingle();

      if (data) setOrder(data as Order);
      setLoading(false);
    }
    fetchOrder();
  }, [params.orderNumber]);

  if (loading) {
    return <div className="p-12 text-center font-oswald text-xs uppercase">Loading Tax Invoice...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center font-oswald text-xs uppercase">Invoice Not Found</div>;
  }

  return (
    <main className="bg-white text-black p-6 sm:p-12 max-w-3xl mx-auto my-8 border border-gray-200 rounded shadow-sm font-sans">
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="font-cinzel text-3xl tracking-widest text-black mb-1">D'VERO</h1>
          <p className="text-xs text-gray-500 font-mono"> Jaipur, Rajasthan, India</p>
          <p className="text-xs text-gray-500">GSTIN: 08AAACD1234F1Z0 | support@dvero.com</p>
        </div>
        <div className="text-right">
          <h2 className="font-oswald text-lg uppercase tracking-wider text-gray-800">TAX INVOICE</h2>
          <p className="text-xs font-mono text-gray-600 mt-1">Invoice #: INV-{order.order_number}</p>
          <p className="text-xs text-gray-500">Date: {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
          <button
            onClick={() => window.print()}
            className="mt-3 bg-black text-white text-xs font-oswald uppercase px-4 py-1.5 rounded print:hidden hover:bg-gray-800"
          >
            Print / Download PDF 🖨
          </button>
        </div>
      </div>

      {/* Bill To & Ship To */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-xs">
        <div>
          <h3 className="font-oswald uppercase text-gray-700 font-semibold mb-2">Billed To</h3>
          <p className="font-medium text-gray-900">{order.customer_name}</p>
          <p className="text-gray-600">{order.address}</p>
          <p className="text-gray-600">{order.city}, {order.state} - {order.pincode}</p>
          <p className="text-gray-600">Email: {order.email}</p>
          <p className="text-gray-600">Phone: {order.phone}</p>
        </div>
        <div>
          <h3 className="font-oswald uppercase text-gray-700 font-semibold mb-2">Order Details</h3>
          <p className="text-gray-600">Order Ref: <span className="font-mono text-black font-semibold">#{order.order_number}</span></p>
          <p className="text-gray-600">Payment Mode: <span className="uppercase text-black">{order.payment_method}</span></p>
          <p className="text-gray-600">Status: <span className="uppercase text-black font-semibold">{order.status}</span></p>
        </div>
      </div>

      {/* Item Table */}
      <table className="w-full text-xs text-left mb-8 border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900 font-oswald uppercase text-gray-800">
            <th className="py-2">Item Description</th>
            <th className="py-2 text-center">Size</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(order.order_items || []).map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-3 font-medium text-gray-900">{item.product_name}</td>
              <td className="py-3 text-center">{item.size}</td>
              <td className="py-3 text-center">{item.qty}</td>
              <td className="py-3 text-right">{formatINR(item.price)}</td>
              <td className="py-3 text-right font-medium">{formatINR(item.price * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Table */}
      <div className="flex justify-end mb-8 text-xs">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Shipping ({order.shipping_method || 'Standard'})</span>
            <span>{order.shipping === 0 ? 'Free' : formatINR(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-black border-t border-gray-900 pt-2">
            <span>Total Paid</span>
            <span>{formatINR(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 text-center text-[0.7rem] text-gray-500 font-mono">
        <p>Thank you for choosing D'VERO Formalwear. Built true in Jaipur, India.</p>
        <p className="mt-1">For return or exchange support, visit dvero.com/orders/return/{order.order_number}</p>
      </div>
    </main>
  );
}
