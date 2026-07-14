import { getSupabase } from '../supabase';

export interface RevenueByPeriod {
  period: string;
  revenue_cents: number;
  booking_count: number;
}

export interface OccupancyByRoomType {
  room_type: string;
  total: number;
  occupied: number;
  rate: number;
}

export interface BookingStatusDistribution {
  status: string;
  count: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  total_cents: number;
  count: number;
}

export const analyticsService = {
  async revenueByMonth(hotelId: string, months = 12): Promise<RevenueByPeriod[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);
    const { data, error } = await getSupabase()
      .from('payments')
      .select('amount_cents, created_at')
      .eq('hotel_id', hotelId)
      .eq('status', 'success')
      .gte('created_at', since.toISOString())
      .order('created_at');
    if (error) throw error;

    const monthly: Record<string, RevenueByPeriod> = {};
    for (const p of data) {
      const m = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      if (!monthly[m]) monthly[m] = { period: m, revenue_cents: 0, booking_count: 0 };
      monthly[m].revenue_cents += p.amount_cents;
      monthly[m].booking_count += 1;
    }
    return Object.values(monthly);
  },

  async revenueByDay(hotelId: string, days = 30): Promise<RevenueByPeriod[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await getSupabase()
      .from('payments')
      .select('amount_cents, created_at')
      .eq('hotel_id', hotelId)
      .eq('status', 'success')
      .gte('created_at', since.toISOString())
      .order('created_at');
    if (error) throw error;

    const daily: Record<string, RevenueByPeriod> = {};
    for (const p of data) {
      const d = new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      if (!daily[d]) daily[d] = { period: d, revenue_cents: 0, booking_count: 0 };
      daily[d].revenue_cents += p.amount_cents;
      daily[d].booking_count += 1;
    }
    return Object.values(daily);
  },

  async paymentMethodBreakdown(hotelId: string): Promise<PaymentMethodBreakdown[]> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('method, amount_cents')
      .eq('hotel_id', hotelId)
      .eq('status', 'success');
    if (error) throw error;

    const grouped: Record<string, PaymentMethodBreakdown> = {};
    for (const p of data) {
      const m = p.method || 'other';
      if (!grouped[m]) grouped[m] = { method: m, total_cents: 0, count: 0 };
      grouped[m].total_cents += p.amount_cents;
      grouped[m].count += 1;
    }
    return Object.values(grouped);
  },

  async occupancyByRoomType(hotelId: string): Promise<OccupancyByRoomType[]> {
    const { data, error } = await getSupabase()
      .from('rooms')
      .select('status, room_type:room_types(name)')
      .eq('hotel_id', hotelId);
    if (error) throw error;

    const grouped: Record<string, { total: number; occupied: number }> = {};
    for (const r of data) {
      const roomType = r.room_type as unknown as { name: string } | null;
      const name = roomType?.name ?? 'Inconnu';
      if (!grouped[name]) grouped[name] = { total: 0, occupied: 0 };
      grouped[name].total += 1;
      if (r.status === 'occupied' || r.status === 'cleaning') grouped[name].occupied += 1;
    }
    return Object.entries(grouped).map(([room_type, v]) => ({
      room_type,
      total: v.total,
      occupied: v.occupied,
      rate: v.total > 0 ? Math.round((v.occupied / v.total) * 100) : 0,
    }));
  },

  async bookingStatusDistribution(hotelId: string): Promise<BookingStatusDistribution[]> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('status')
      .eq('hotel_id', hotelId);
    if (error) throw error;

    const grouped: Record<string, number> = {};
    for (const b of data) {
      grouped[b.status] = (grouped[b.status] ?? 0) + 1;
    }
    return Object.entries(grouped).map(([status, count]) => ({ status, count }));
  },

  async cancellationRate(hotelId: string): Promise<number> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('status')
      .eq('hotel_id', hotelId);
    if (error) throw error;
    const total = data.length;
    if (total === 0) return 0;
    const cancelled = data.filter(b => b.status === 'cancelled' || b.status === 'no_show').length;
    return Math.round((cancelled / total) * 100);
  },

  async totalRevenue(hotelId: string): Promise<number> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('amount_cents')
      .eq('hotel_id', hotelId)
      .eq('status', 'success');
    if (error) throw error;
    return data.reduce((sum, p) => sum + p.amount_cents, 0);
  },

  async avgStayDuration(hotelId: string): Promise<number> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('check_in_date, check_out_date')
      .eq('hotel_id', hotelId)
      .not('check_in_date', 'is', null)
      .not('check_out_date', 'is', null);
    if (error) throw error;
    if (data.length === 0) return 0;
    const totalDays = data.reduce((sum, b) => {
      const ci = new Date(b.check_in_date).getTime();
      const co = new Date(b.check_out_date).getTime();
      return sum + Math.max(0, (co - ci) / (1000 * 60 * 60 * 24));
    }, 0);
    return Math.round((totalDays / data.length) * 10) / 10;
  },
};
