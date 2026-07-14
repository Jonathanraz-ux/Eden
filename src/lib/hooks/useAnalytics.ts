import { useQuery } from '@tanstack/react-query';
import { analyticsService, type RevenueByPeriod, type PaymentMethodBreakdown, type OccupancyByRoomType, type BookingStatusDistribution } from '../services/analyticsService';
import { useDemoMode } from '../demo-mode';
import { demoRevenueByMonth, demoRevenueByDay, demoPaymentMethods, demoOccupancyByRoomType, demoBookingStatusDist } from '../../data/demo-data';

export function useRevenueByMonth(hotelId: string, months = 12) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'revenue_month', hotelId, months],
    queryFn: (): Promise<RevenueByPeriod[]> => demoMode ? Promise.resolve(demoRevenueByMonth) : analyticsService.revenueByMonth(hotelId, months),
    enabled: Boolean(hotelId),
  });
}

export function useRevenueByDay(hotelId: string, days = 30) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'revenue_day', hotelId, days],
    queryFn: (): Promise<RevenueByPeriod[]> => demoMode ? Promise.resolve(demoRevenueByDay) : analyticsService.revenueByDay(hotelId, days),
    enabled: Boolean(hotelId),
  });
}

export function usePaymentMethodBreakdown(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'payment_methods', hotelId],
    queryFn: (): Promise<PaymentMethodBreakdown[]> => demoMode ? Promise.resolve(demoPaymentMethods) : analyticsService.paymentMethodBreakdown(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useOccupancyByRoomType(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'occupancy', hotelId],
    queryFn: (): Promise<OccupancyByRoomType[]> => demoMode ? Promise.resolve(demoOccupancyByRoomType) : analyticsService.occupancyByRoomType(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useBookingStatusDistribution(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'booking_status', hotelId],
    queryFn: (): Promise<BookingStatusDistribution[]> => demoMode ? Promise.resolve(demoBookingStatusDist) : analyticsService.bookingStatusDistribution(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCancellationRate(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'cancellation_rate', hotelId],
    queryFn: (): Promise<number> => demoMode ? Promise.resolve(8.5) : analyticsService.cancellationRate(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useTotalRevenue(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'total_revenue', hotelId],
    queryFn: (): Promise<number> => demoMode ? Promise.resolve(214700000) : analyticsService.totalRevenue(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useAvgStayDuration(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['analytics', 'avg_stay', hotelId],
    queryFn: (): Promise<number> => demoMode ? Promise.resolve(3.8) : analyticsService.avgStayDuration(hotelId),
    enabled: Boolean(hotelId),
  });
}
