import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService } from '../services/guestService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoGuests } from '../../data/demo-data';
import type { Guest, Insert } from '../types/database';

export function useGuests(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['guests', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoGuests) : guestService.list(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useSearchGuests(hotelId: string, query: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['guests', hotelId, 'search', query],
    queryFn: () => {
      if (demoMode) {
        const q = query.toLowerCase();
        return Promise.resolve(demoGuests.filter(g =>
          g.first_name?.toLowerCase().includes(q) ||
          g.last_name.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q)
        ));
      }
      return guestService.search(hotelId, query);
    },
    enabled: Boolean(hotelId) && query.length >= 2,
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (guest: Insert<Guest>) => {
      if (demoMode) return demoMutationResult({ ...guest, id: 'demo-guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return guestService.create(guest);
    },
    onSuccess: (data) => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['guests', data.hotel_id] });
        qc.invalidateQueries({ queryKey: ['guests', data.hotel_id, 'search'] });
      }
    },
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Insert<Guest>> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates } as any);
      return guestService.update(id, updates);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
