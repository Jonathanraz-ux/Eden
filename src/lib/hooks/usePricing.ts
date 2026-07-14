import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { seasonService } from '../services/seasonService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoRatePlans, demoSeasons } from '../../data/demo-data';
import type { RatePlan, Season, Insert, Update } from '../types/database';

// -- Rate Plans --
export function useRatePlans(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['rate_plans', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoRatePlans) : paymentService.listRatePlans(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreateRatePlan() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (ratePlan: Insert<RatePlan>) => {
      if (demoMode) return demoMutationResult({ ...ratePlan, id: 'demo-rp', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return paymentService.createRatePlan(ratePlan);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['rate_plans', data.hotel_id] });
    },
  });
}

export function useUpdateRatePlan() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<RatePlan> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return paymentService.updateRatePlan(id, updates);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['rate_plans'] });
    },
  });
}

export function useDeleteRatePlan() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined);
      return paymentService.softDeleteRatePlan(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['rate_plans'] });
    },
  });
}

export function useRatePlanPrices(ratePlanId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['rate_plan_prices', ratePlanId],
    queryFn: () => demoMode ? Promise.resolve([]) : paymentService.listRatePlanPrices(ratePlanId),
    enabled: Boolean(ratePlanId),
  });
}

export function useSetRatePlanPrice() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ ratePlanId, roomTypeId, appliedPriceCents }: { ratePlanId: string; roomTypeId: string; appliedPriceCents: number | null }) => {
      if (demoMode) return demoMutationResult(undefined);
      return paymentService.setRatePlanPrice(ratePlanId, roomTypeId, appliedPriceCents);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['rate_plan_prices'] });
    },
  });
}

// -- Seasons --
export function useSeasons(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['seasons', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoSeasons) : seasonService.list(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreateSeason() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (season: Insert<Season>) => {
      if (demoMode) return demoMutationResult({ ...season, id: 'demo-season', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return seasonService.create(season);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['seasons', data.hotel_id] });
    },
  });
}

export function useUpdateSeason() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<Season> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return seasonService.update(id, updates);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['seasons'] });
    },
  });
}

export function useDeleteSeason() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined);
      return seasonService.remove(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['seasons'] });
    },
  });
}
