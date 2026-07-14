import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoReviews } from '../../data/demo-data';
import type { Review } from '../types/database';

export function useReviews(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['reviews', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoReviews) : reviewService.list(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useReviewReply() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, hotelReply }: { id: string; hotelReply: string }) => {
      if (demoMode) return demoMutationResult({ id, hotelReply } as unknown as Review);
      return reviewService.reply(id, hotelReply);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useReviewToggleVisibility() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) => {
      if (demoMode) return demoMutationResult({ id, isVisible } as unknown as Review);
      return reviewService.toggleVisibility(id, isVisible);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as unknown as void);
      return reviewService.archive(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}
