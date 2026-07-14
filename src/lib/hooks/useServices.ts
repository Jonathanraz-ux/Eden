import { useQuery } from '@tanstack/react-query';
import { servicesService, type ServiceWithStats } from '../services/servicesService';
import { useDemoMode } from '../demo-mode';
import { demoServices, demoServicesWithStats } from '../../data/demo-data';

export function useServices(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['services', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoServices) : servicesService.list(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useServicesWithStats(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['services_with_stats', hotelId],
    queryFn: (): Promise<ServiceWithStats[]> => demoMode ? Promise.resolve(demoServicesWithStats) : servicesService.listWithStats(hotelId),
    enabled: Boolean(hotelId),
  });
}
