import { getSupabase } from '../supabase';
import type { Service } from '../types/database';

export type ServiceWithStats = Service & { active_bookings: number; revenue_cents: number };

export const servicesService = {
  async list(hotelId: string): Promise<Service[]> {
    const { data, error } = await getSupabase()
      .from('services')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data;
  },

  async listWithStats(hotelId: string): Promise<ServiceWithStats[]> {
    const { data: services, error } = await getSupabase()
      .from('services')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];

    const enriched = await Promise.all(
      services.map(async (s) => {
        const { count } = await getSupabase()
          .from('booking_services')
          .select('*', { count: 'exact', head: true })
          .eq('service_id', s.id)
          .gte('service_date', today)
          .lt('service_date', today + 'T23:59:59')
          .neq('status', 'cancelled');

        const { data: revenueData } = await getSupabase()
          .from('booking_services')
          .select('total_price_cents')
          .eq('service_id', s.id)
          .gte('service_date', today)
          .lt('service_date', today + 'T23:59:59')
          .neq('status', 'cancelled');

        const revenue_cents = (revenueData ?? []).reduce(
          (sum, r) => sum + (r.total_price_cents ?? 0), 0
        );

        return {
          ...s,
          active_bookings: count ?? 0,
          revenue_cents,
        };
      })
    );

    return enriched;
  },
};
