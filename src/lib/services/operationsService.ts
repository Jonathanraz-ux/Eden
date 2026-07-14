import { getSupabase } from '../supabase';

export interface OperationTask {
  id: string;
  type: 'check_in' | 'check_out' | 'cleaning' | 'maintenance' | 'payment_pending' | 'room_unassigned';
  title: string;
  subtitle: string;
  priority: 'high' | 'medium' | 'low';
  href: string;
  booking_id?: string;
  room_number?: string;
}

export interface OperationsSummary {
  arrivalsToday: number;
  departuresToday: number;
  toClean: number;
  inMaintenance: number;
  pendingPayments: number;
  activeBookings: number;
  overdueArrivals: number;
  overdueDepartures: number;
  totalRooms: number;
  occupiedRooms: number;
  tasks: OperationTask[];
}

export const operationsService = {
  async getSummary(hotelId: string): Promise<OperationsSummary> {
    const today = new Date().toISOString().slice(0, 10);

    const [arrivalsResult, departuresResult, roomsResult, paymentsResult, overdueArrivalsResult, overdueDeparturesResult] = await Promise.all([
      getSupabase()
        .from('bookings')
        .select('id, booking_reference, booking_guests(guest:guests(first_name, last_name)), booking_rooms(id)')
        .eq('hotel_id', hotelId)
        .eq('status', 'confirmed')
        .eq('check_in_date', today)
        .limit(50),
      getSupabase()
        .from('bookings')
        .select('id, booking_reference, booking_guests(guest:guests(first_name, last_name))')
        .eq('hotel_id', hotelId)
        .eq('status', 'checked_in')
        .eq('check_out_date', today)
        .limit(50),
      getSupabase()
        .from('rooms')
        .select('id, name, status')
        .eq('hotel_id', hotelId)
        .is('deleted_at', null)
        .limit(100),
      getSupabase()
        .from('payments')
        .select('id, amount_cents, method, booking_id')
        .eq('hotel_id', hotelId)
        .eq('status', 'pending')
        .limit(50),
      getSupabase()
        .from('bookings')
        .select('id, booking_reference, booking_guests(guest:guests(first_name, last_name))')
        .eq('hotel_id', hotelId)
        .eq('status', 'confirmed')
        .lt('check_in_date', today)
        .limit(50),
      getSupabase()
        .from('bookings')
        .select('id, booking_reference, booking_guests(guest:guests(first_name, last_name))')
        .eq('hotel_id', hotelId)
        .eq('status', 'checked_in')
        .lt('check_out_date', today)
        .limit(50),
    ]);

    const arrivals = arrivalsResult.data ?? [];
    const departures = departuresResult.data ?? [];
    const rooms = roomsResult.data ?? [];
    const pendingPayments = paymentsResult.data ?? [];
    const overdueArrivals = overdueArrivalsResult.data ?? [];
    const overdueDepartures = overdueDeparturesResult.data ?? [];

    const { count: activeBookingsRaw } = await getSupabase()
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotelId)
      .not('status', 'in', '("completed","cancelled","no_show","expired")');

    const activeBookings = activeBookingsRaw ?? 0;

    const toClean = rooms.filter(r => r.status === 'cleaning');
    const inMaintenance = rooms.filter(r => r.status === 'maintenance');
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');
    const totalRooms = rooms.length;

    const tasks: OperationTask[] = [];

    for (const b of arrivals) {
      const bg = (b as any).booking_guests?.[0];
      const g = bg?.guest as { first_name?: string; last_name?: string } | undefined;
      const guestName = g ? `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim() : '';
      const hasRoom = ((b as any).booking_rooms?.length ?? 0) > 0;

      if (!hasRoom) {
        tasks.push({
          id: `unassigned-${b.id}`,
          type: 'room_unassigned',
          title: guestName || 'Réservation',
          subtitle: `Chambre non assignée · ${(b as any).booking_reference ?? b.id.slice(0, 8)}`,
          priority: 'high',
          href: `/bookings?id=${b.id}`,
          booking_id: b.id,
        });
      }

      tasks.push({
        id: `arrival-${b.id}`,
        type: 'check_in',
        title: guestName || 'Réservation',
        subtitle: `Arrivée · ${(b as any).booking_reference ?? b.id.slice(0, 8)}`,
        priority: 'high',
        href: `/bookings?id=${b.id}`,
        booking_id: b.id,
      });
    }

    for (const b of departures) {
      const bg = (b as any).booking_guests?.[0];
      const g = bg?.guest as { first_name?: string; last_name?: string } | undefined;
      const guestName = g ? `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim() : '';
      tasks.push({
        id: `departure-${b.id}`,
        type: 'check_out',
        title: guestName || 'Réservation',
        subtitle: `Départ · ${(b as any).booking_reference ?? b.id.slice(0, 8)}`,
        priority: 'high',
        href: `/bookings?id=${b.id}`,
        booking_id: b.id,
      });
    }

    for (const r of toClean) {
      tasks.push({
        id: `clean-${r.id}`,
        type: 'cleaning',
        title: r.name ?? 'Chambre',
        subtitle: r.status === 'cleaning' ? 'En cours de nettoyage' : 'À nettoyer',
        priority: 'medium',
        href: `/housekeeping`,
        room_number: r.name ?? undefined,
      });
    }

    for (const r of inMaintenance) {
      tasks.push({
        id: `maint-${r.id}`,
        type: 'maintenance',
        title: r.name ?? 'Chambre',
        subtitle: 'En maintenance',
        priority: 'low',
        href: `/housekeeping`,
        room_number: r.name ?? undefined,
      });
    }

    for (const p of pendingPayments) {
      tasks.push({
        id: `payment-${p.id}`,
        type: 'payment_pending',
        title: `${(p.amount_cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
        subtitle: `Paiement en attente · ${p.method ?? '—'}`,
        priority: 'medium',
        href: `/payments`,
        booking_id: p.booking_id ?? undefined,
      });
    }

    for (const b of overdueArrivals) {
      const bg = (b as any).booking_guests?.[0];
      const g = bg?.guest as { first_name?: string; last_name?: string } | undefined;
      const guestName = g ? `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim() : '';
      tasks.push({
        id: `overdue-arrival-${b.id}`,
        type: 'check_in',
        title: guestName || 'Réservation',
        subtitle: `Arrivée en retard · ${(b as any).booking_reference ?? b.id.slice(0, 8)}`,
        priority: 'high',
        href: `/bookings?id=${b.id}`,
        booking_id: b.id,
      });
    }

    for (const b of overdueDepartures) {
      const bg = (b as any).booking_guests?.[0];
      const g = bg?.guest as { first_name?: string; last_name?: string } | undefined;
      const guestName = g ? `${g.first_name ?? ''} ${g.last_name ?? ''}`.trim() : '';
      tasks.push({
        id: `overdue-departure-${b.id}`,
        type: 'check_out',
        title: guestName || 'Réservation',
        subtitle: `Départ en retard · ${(b as any).booking_reference ?? b.id.slice(0, 8)}`,
        priority: 'high',
        href: `/bookings?id=${b.id}`,
        booking_id: b.id,
      });
    }

    return {
      arrivalsToday: arrivals.length,
      departuresToday: departures.length,
      toClean: toClean.length,
      inMaintenance: inMaintenance.length,
      pendingPayments: pendingPayments.length,
      activeBookings,
      overdueArrivals: overdueArrivals.length,
      overdueDepartures: overdueDepartures.length,
      totalRooms,
      occupiedRooms: occupiedRooms.length,
      tasks,
    };
  },
};
