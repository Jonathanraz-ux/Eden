import { useQuery } from '@tanstack/react-query';
import { operationsService, type OperationsSummary } from '../services/operationsService';
import { useDemoMode } from '../demo-mode';
import { demoOperationsSummary } from '../../data/demo-data';

export function useOperationsSummary(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['operations_summary', hotelId],
    queryFn: (): Promise<OperationsSummary> => demoMode ? Promise.resolve(demoOperationsSummary) : operationsService.getSummary(hotelId),
    enabled: Boolean(hotelId),
    refetchInterval: 30_000,
  });
}
