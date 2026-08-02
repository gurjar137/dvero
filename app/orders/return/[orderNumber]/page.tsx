'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';

export default function ReturnRequestPage({ params }: { params: { orderNumber: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [type, setType] = useState<'return' | 'exchange'>('return');
  const [reason, setReason] = useState('');
  const [requestedSize, setRequestedSize] = useState('M');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', params.orderNumber)
        .maybeSingle();

      if (data) setOrder(data as Order);
    }
    fetchOrder();
  }, [params.orderNumber]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for your request.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { error: reqErr } = await supabase.from('return_requests').insert([
        {
          order_id: order?.id,
          customer_email: order?.email || '',
          type,
          reason: reason.trim(),
          requested_size: type === 'exchange' ? requestedSize : null,
          status: 'pending',
        },
      ]);

      if (reqErr) throw reqErr;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="page-fade py-20 text-center min-h-[60vh]">
        <div className="max-w-md mx-auto bg-panel border border-line p-8 rounded-md shadow-sm2">
          <div className="w-12 h-12 bg-camel/30 rounded-full flex items-center justify-center mx-auto mb-4 text-camelDeep text-2xl">
            ✓
          </div>
          <h2 className="font-oswald text-2xl uppercase mb-2">Request Submitted</h2>
          <p className="text-mute text-sm mb-6 leading-relaxed">
            Your {type === 'return' ? 'Return' : 'Exchange'} request for Order #{params.orderNumber} has been received. Our team will email pickup details within 24 hours.
          </p>
          <Link
            href={`/orders/track/${params.orderNumber}`}
            className="inline-block bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-6 py-3 rounded-sm hover:bg-camelDeep transition-colors"
          >
            Track Order Status
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-fade py-10 md:py-16 min-h-[65vh]">
      <div className="max-w-[700px] mx-auto px-4 sm:px-5">
        <div className="font-oswald text-xs tracking-wider uppercase text-mute mb-6">
          <Link href="/" className="hover:text-ink">Home</Link> /{' '}
          <Link href={`/orders/track/${params.orderNumber}`} className="hover:text-ink">Order #{params.orderNumber}</Link> /{' '}
          <span className="text-ink">Return / Exchange</span>
        </div>

        <div className="bg-panel border border-line p-6 md:p-8 rounded-md shadow-sm2">
          <h1 className="font-oswald text-2xl uppercase mb-2">Return or Exchange Request</h1>
          <p className="text-mute text-xs mb-6">
            D'VERO 14-Day Hassle-Free Policy. Pickups arranged from your doorstep.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-2">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('return')}
                  className={`py-3 font-oswald text-xs uppercase tracking-wider border rounded-sm transition-all ${
                    type === 'return' ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink'
                  }`}
                >
                  Return Piece
                </button>
                <button
                  type="button"
                  onClick={() => setType('exchange')}
                  className={`py-3 font-oswald text-xs uppercase tracking-wider border rounded-sm transition-all ${
                    type === 'exchange' ? 'bg-ink text-bg border-ink' : 'border-line hover:border-ink'
                  }`}
                >
                  Exchange Size
                </button>
              </div>
            </div>

            {type === 'exchange' && (
              <div>
                <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1">
                  Select New Requested Size
                </label>
                <select
                  value={requestedSize}
                  onChange={e => setRequestedSize(e.target.value)}
                  className="w-full bg-bg border border-line p-3 rounded-sm font-oswald text-xs uppercase tracking-wider text-ink outline-none"
                >
                  {['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38'].map(s => (
                    <option key={s} value={s}>
                      Size {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1">Reason for Request</label>
              <textarea
                rows={4}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain fit issue, size requirement or reason..."
                className="w-full bg-bg border border-line p-4 rounded-sm font-inter text-sm text-ink outline-none focus:border-ink"
                required
              />
            </div>

            {error && <p className="text-error text-xs font-oswald uppercase">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-bg py-4 rounded-sm font-oswald text-xs tracking-widest uppercase hover:bg-camelDeep transition-colors shadow-sm2"
            >
              {submitting ? 'Submitting Request...' : `Submit ${type === 'return' ? 'Return' : 'Exchange'} Request`}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
