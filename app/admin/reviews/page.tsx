'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { ProductReview } from '@/lib/types';
import { useAdminData } from '@/lib/useAdminData';
import { useToast } from '@/components/admin/Toast';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { productNameById } = useAdminData();
  const showToast = useToast();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setReviews(data as ProductReview[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleDeleteReview(id: number) {
    if (!confirm('Delete this client review permanently?')) return;
    const { error } = await supabase.from('product_reviews').delete().eq('id', id);
    if (!error) {
      showToast('Review removed');
      fetchReviews();
    } else {
      showToast('Error removing review');
    }
  }

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-oswald text-2xl uppercase">Review Moderation Feed</h1>
        <p className="text-sm text-mute mt-1">Review ratings and client feedback submitted across garments.</p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-panel border border-line rounded-xl shadow-sm2 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="font-oswald text-xs tracking-wider uppercase text-mute border-b border-line bg-bg">
              <th className="py-3.5 px-4">Garment</th>
              <th className="py-3.5 px-4">Client Name</th>
              <th className="py-3.5 px-4">Rating</th>
              <th className="py-3.5 px-4">Review Comment</th>
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-mute font-oswald text-xs uppercase">
                  Loading client reviews...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-mute">
                  No reviews submitted yet.
                </td>
              </tr>
            ) : (
              reviews.map(r => (
                <tr key={r.id} className="border-b border-line last:border-0 hover:bg-bg/40">
                  <td className="py-3.5 px-4 font-oswald text-xs uppercase text-ink">
                    {productNameById(r.product_id)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-medium">{r.author_name}</td>
                  <td className="py-3.5 px-4 text-camelDeep font-bold">
                    {'★'.repeat(r.rating)}
                    <span className="text-mute font-normal">{'☆'.repeat(5 - r.rating)}</span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-mute max-w-xs leading-relaxed">{r.comment}</td>
                  <td className="py-3.5 px-4 text-xs text-mute font-mono">
                    {new Date(r.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="font-oswald text-xs uppercase text-error border-b border-error min-h-[44px]"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute font-oswald text-xs uppercase">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="bg-panel border border-line rounded-lg p-8 text-center text-mute font-oswald text-xs uppercase">No client reviews submitted yet.</div>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-panel border border-line rounded-lg p-4 shadow-sm2 space-y-2.5">
              <div className="flex justify-between items-start border-b border-line pb-2">
                <div>
                  <h4 className="font-oswald text-xs uppercase text-ink font-semibold">{productNameById(r.product_id)}</h4>
                  <div className="text-[0.75rem] text-mute">{r.author_name} · {new Date(r.created_at).toLocaleDateString('en-IN')}</div>
                </div>
                <div className="text-camelDeep font-bold text-sm">
                  {'★'.repeat(r.rating)}
                </div>
              </div>

              <p className="text-xs text-mute leading-relaxed italic">&ldquo;{r.comment}&rdquo;</p>

              <div className="pt-2 border-t border-line text-right">
                <button
                  onClick={() => handleDeleteReview(r.id)}
                  className="font-oswald text-xs uppercase text-error border-b border-error min-h-[44px]"
                >
                  Remove Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
