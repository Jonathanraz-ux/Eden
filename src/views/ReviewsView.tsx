import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { StarRating } from '../components/StarRating';
import { Reply, TrendingUp, Eye, EyeOff, Send, Trash2 } from 'lucide-react';
import { useReviews, useReviewReply, useReviewToggleVisibility, useDeleteReview } from '../lib/hooks/useReviews';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from '../components/Toast';

const ratingLabels = ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

function ReviewSkeleton() {
  return (
    <div className="bg-white border border-[#1A1A1A]/10 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-20 h-2.5" />
        </div>
        <Skeleton className="w-20 h-3.5" />
      </div>
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="w-10 h-3" />
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  );
}

export function ReviewsView() {
  const hotelId = useCurrentHotelId();
  const { data: reviews, isLoading } = useReviews(hotelId ?? '');
  const replyMutation = useReviewReply();
  const toggleMutation = useReviewToggleVisibility();
  const deleteMutation = useDeleteReview();
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const average = useMemo(() => {
    if (!reviews || reviews.length === 0) return '—';
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const distribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    if (reviews) reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) dist[r.rating - 1]++; });
    return dist;
  }, [reviews]);

  const handleReply = async (reviewId: string) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) return;
    setSubmitting(prev => ({ ...prev, [reviewId]: true }));
    try {
      await replyMutation.mutateAsync({ id: reviewId, hotelReply: text });
      triggerToast('Réponse publiée');
      setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleToggleVisibility = async (reviewId: string, current: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id: reviewId, isVisible: !current });
      triggerToast(current ? 'Avis masqué' : 'Avis affiché');
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async (reviewId: string) => {
    try {
      await deleteMutation.mutateAsync(reviewId);
      triggerToast('Avis archivé');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Avis Clients & Réputation</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {isLoading ? 'Chargement...' : `${reviews?.length ?? 0} avis · Note moyenne ${average}/5`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <ReviewSkeleton key={i} />)}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#1A1A1A]/10">
          <TrendingUp className="w-10 h-10 text-[#1A1A1A]/20 mb-4" />
          <p className="text-sm font-medium text-[#1A1A1A]/50">Aucun avis pour le moment</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1">
            Les avis clients apparaîtront ici
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#1A1A1A]/10 p-6 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div className="text-center shrink-0">
                <p className="text-5xl font-serif text-[#1A1A1A] tracking-tight">{average}</p>
                <StarRating rating={Math.round(Number(average))} />
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">{reviews.length} avis</p>
              </div>
              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = distribution[star - 1];
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-8 text-right text-[#1A1A1A]/40 text-[10px] font-medium">{star}★</span>
                      <div className="flex-1 h-2 bg-[#1A1A1A]/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C5A059] rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-[#1A1A1A]/40 text-[10px]">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {reviews.map((review) => {
              const guest = (review as any).guest as { first_name?: string; last_name?: string } | undefined;
              const guestName = guest ? `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim() : 'Client';
              const hasReply = Boolean(review.hotel_reply);
              const replyText = replyInputs[review.id] ?? '';
              const isReplying = submitting[review.id];

              return (
                <div
                  key={review.id}
                  className={cn(
                    "bg-white border transition-all duration-200 p-6 flex flex-col group",
                    review.is_visible ? "border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 hover:shadow-sm" : "border-[#1A1A1A]/5 bg-[#FAF9F6]/60"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-[#1A1A1A]">{guestName}</h4>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-0.5">
                        {new Date(review.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <StarRating rating={review.rating} />
                      <p className="text-[9px] text-[#C5A059]/70 mt-0.5 font-medium">{ratingLabels[review.rating]}</p>
                    </div>
                  </div>

                  {review.title && (
                    <p className="text-xs font-semibold text-[#1A1A1A] mb-1">{review.title}</p>
                  )}

                  <p className="text-sm text-[#1A1A1A]/65 italic leading-relaxed flex-1">
                    "{review.comment ?? '—'}"
                  </p>

                  {hasReply && (
                    <div className="mt-3 px-3 py-2 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-xs text-[#1A1A1A]/60">
                      <p className="text-[9px] uppercase tracking-[0.15em] font-semibold text-[#C5A059] mb-1">Votre réponse</p>
                      <p>{review.hotel_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#1A1A1A]/5">
                    <button
                      onClick={() => handleToggleVisibility(review.id, review.is_visible)}
                      className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
                    >
                      {review.is_visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {review.is_visible ? 'Masquer' : 'Afficher'}
                    </button>
                    <button
                      onClick={() => handleArchive(review.id)}
                      className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Archiver
                    </button>

                    {!hasReply && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                          placeholder="Répondre..."
                          className="w-40 px-3 py-1.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-xs text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                        />
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={!replyText.trim() || isReplying}
                          className="p-1.5 text-[#C5A059] hover:text-[#1A1A1A] transition-colors disabled:opacity-30"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
