import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoNotifications } from '../../data/demo-data';

export function useNotifications(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['notifications', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoNotifications) : notificationService.listByHotel(hotelId),
    enabled: Boolean(hotelId),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ notificationId, recipientId }: { notificationId: string; recipientId: string }) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return notificationService.markAsRead(notificationId, recipientId);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
