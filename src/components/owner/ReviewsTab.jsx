import React, { useState, useEffect, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  getAllReviewsForOwner,
  setReviewApproval,
  deleteReview
} from '../../services/restaurantService';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllReviewsForOwner();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setError(err.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleApproval = async (review) => {
    setActionId(review.id);
    try {
      const newStatus = !review.is_approved;
      await setReviewApproval(review.id, newStatus);
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, is_approved: newStatus } : r))
      );
    } catch (err) {
      console.error('Failed to toggle review approval:', err);
      alert('Failed to update review approval status.');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer review?')) {
      return;
    }

    setActionId(reviewId);
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error('Failed to delete review:', err);
      alert('Failed to delete review.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Customer Reviews Moderation
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {reviews.length} Reviews
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Moderate customer feedback. Only approved reviews appear publicly on the storefront testimonials section.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <Star className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No customer reviews yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                rev.is_approved ? 'border-stone-800' : 'border-amber-500/30 bg-stone-950/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-sm">{rev.customer_name}</h3>
                    <div className="flex items-center gap-1 mt-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      rev.is_approved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {rev.is_approved ? 'Approved & Public' : 'Pending Moderation'}
                  </span>
                </div>

                <p className="text-xs text-stone-300 mt-2.5 italic">
                  "{rev.review_text}"
                </p>

                <div className="mt-2 text-[10px] text-stone-500">
                  Submitted {new Date(rev.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  disabled={actionId === rev.id}
                  onClick={() => handleToggleApproval(rev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    rev.is_approved
                      ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                  }`}
                >
                  {rev.is_approved ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Review</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve Review</span>
                    </>
                  )}
                </button>

                <button
                  disabled={actionId === rev.id}
                  onClick={() => handleDelete(rev.id)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
