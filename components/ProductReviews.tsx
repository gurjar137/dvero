'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { ProductReview } from '@/lib/types';

type ProductReviewsProps = {
  productId: string;
};

export function ProductReviews({ productId }: ProductReviewsProps) {
  const { session } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setReviews(data as ProductReview[]);
      }
    } catch (e) {
      console.error('Error fetching product reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (session?.user?.email) {
      const nameFromMeta = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
      setAuthorName(nameFromMeta);
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) {
      setMsg({ text: 'Please write a review comment.', type: 'error' });
      return;
    }
    setSubmitting(true);
    setMsg(null);

    try {
      const { error } = await supabase.from('product_reviews').insert([
        {
          product_id: productId,
          user_id: session?.user?.id || null,
          author_name: authorName || 'Anonymous Client',
          rating,
          comment: comment.trim(),
        },
      ]);

      if (error) {
        setMsg({ text: 'Unable to submit review. Please try again.', type: 'error' });
      } else {
        setMsg({ text: 'Thank you for your review ✓', type: 'success' });
        setComment('');
        fetchReviews();
      }
    } catch (err) {
      setMsg({ text: 'Error submitting review.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const count = reviews.length;
  const avgRating = count > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1) : '5.0';

  const breakdown = [5, 4, 3, 2, 1].map(stars => {
    const c = reviews.filter(r => r.rating === stars).length;
    const pct = count > 0 ? Math.round((c / count) * 100) : 0;
    return { stars, count: c, pct };
  });

  return (
    <div className="pt-12 border-t border-line mt-14">
      <h2 className="font-oswald text-2xl uppercase mb-8">Client Reviews & Ratings</h2>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Rating Summary */}
        <div className="bg-panel border border-line p-6 rounded-md flex flex-col justify-center items-center text-center shadow-sm2">
          <div className="font-oswald text-5xl font-medium text-ink mb-2">{avgRating}</div>
          <div className="flex gap-1 text-camelDeep mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className="text-lg">
                {s <= Math.round(Number(avgRating)) ? '★' : '☆'}
              </span>
            ))}
          </div>
          <p className="font-oswald text-xs tracking-wider uppercase text-mute">
            Based on {count} review{count !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-panel border border-line p-6 rounded-md md:col-span-2 shadow-sm2 flex flex-col justify-center">
          {breakdown.map(b => (
            <div key={b.stars} className="flex items-center gap-3 mb-2 text-xs">
              <span className="font-oswald uppercase text-mute w-12 text-right">{b.stars} Stars</span>
              <div className="flex-1 bg-line h-2 rounded-full overflow-hidden">
                <div className="bg-camelDeep h-full transition-all duration-500" style={{ width: `${b.pct}%` }} />
              </div>
              <span className="font-oswald text-mute w-8">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-panel border border-line p-6 md:p-8 rounded-md mb-12 shadow-sm2">
        <h3 className="font-oswald text-lg uppercase mb-4">Write A Review</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1">Your Name</label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-bg border border-line px-4 py-2.5 rounded-sm font-inter text-sm text-ink outline-none focus:border-ink transition-colors"
                required
              />
            </div>
            <div>
              <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1">Rating</label>
              <div className="flex gap-2 items-center py-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-2xl text-camelDeep focus:outline-none transition-transform hover:scale-110"
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-oswald text-xs uppercase tracking-wider text-mute mb-1">Your Experience</label>
            <textarea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe fit, fabric quality, and overall finish..."
              className="w-full bg-bg border border-line p-4 rounded-sm font-inter text-sm text-ink outline-none focus:border-ink transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-ink text-bg font-oswald text-xs tracking-widest uppercase px-8 py-3.5 rounded-sm hover:bg-camelDeep transition-colors shadow-sm2"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          {msg && (
            <div className={`font-oswald text-xs tracking-wider uppercase mt-2 ${msg.type === 'success' ? 'text-success' : 'text-error'}`}>
              {msg.text}
            </div>
          )}
        </form>
      </div>

      {/* Review List */}
      {loading ? (
        <div className="text-center py-8 font-oswald text-xs uppercase tracking-wider text-mute">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <p className="text-center py-8 text-mute text-sm">Be the first to review this garment.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map(rev => (
            <div key={rev.id} className="border-b border-line pb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="font-oswald text-sm uppercase tracking-wide">{rev.author_name}</div>
                <div className="text-xs text-mute">{new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="flex gap-1 text-camelDeep text-xs mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                ))}
              </div>
              <p className="text-sm text-mute leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
