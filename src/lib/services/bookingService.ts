import { getSupabase } from '../supabase';
import type {
  Booking,
  BookingRoom,
  BookingGuest,
  BookingStatus,
  BookingStatusHistory,
  Insert,
  Update,
} from '../types/database';

export interface BookingWithRelations extends Booking {
  booking_guests?: Array<{ guest?: { first_name?: string; last_name?: string } | null }>;
  booking_rooms?: Array<{ room?: { name?: string; room_types?: { name?: string } } | null }>;
}

export const bookingService = {
  // -- Bookings --
  async list(hotelId: string, options?: { status?: BookingStatus; from?: string; to?: string }): Promise<Booking[]> {
    let query = getSupabase()
      .from('bookings')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.status) query = query.eq('status', options.status);
    if (options?.from) query = query.gte('check_in_date', options.from);
    if (options?.to) query = query.lte('check_out_date', options.to);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Booking | null> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(booking: Insert<Booking>): Promise<Booking> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .insert(booking)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la réservation');
    return data;
  },

  async update(id: string, updates: Update<Booking>): Promise<Booking> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Réservation introuvable pour la mise à jour');
    return data;
  },

  async updateStatus(id: string, status: BookingStatus, reason?: string): Promise<Booking> {
    const patch: Record<string, unknown> = { status };
    if (status === 'confirmed') patch.confirmed_at = new Date().toISOString();
    if (status === 'cancelled') {
      patch.cancelled_at = new Date().toISOString();
      patch.cancellation_reason = reason ?? null;
    }
    return bookingService.update(id, patch as Update<Booking>);
  },

  // -- Booking Rooms --
  async listRooms(bookingId: string): Promise<(BookingRoom & { room_name?: string })[]> {
    const { data, error } = await getSupabase()
      .from('booking_rooms')
      .select('*, room:rooms(name)')
      .eq('booking_id', bookingId);
    if (error) throw error;
    return data as unknown as (BookingRoom & { room_name?: string })[];
  },

  async updateBookingRoom(bookingRoomId: string, updates: Update<BookingRoom>): Promise<BookingRoom> {
    const { data, error } = await getSupabase()
      .from('booking_rooms')
      .update(updates)
      .eq('id', bookingRoomId)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Ligne de chambre introuvable');
    return data;
  },

  async addRoom(bookingRoom: Insert<BookingRoom>): Promise<BookingRoom> {
    const { data, error } = await getSupabase()
      .from('booking_rooms')
      .insert(bookingRoom)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de l\'ajout de la chambre');
    return data;
  },

  // -- Booking Guests --
  async listGuests(bookingId: string): Promise<(BookingGuest & { guest_name?: string })[]> {
    const { data, error } = await getSupabase()
      .from('booking_guests')
      .select('*, guest:guests(first_name, last_name)')
      .eq('booking_id', bookingId);
    if (error) throw error;
    return data as unknown as (BookingGuest & { guest_name?: string })[];
  },

  async addGuest(bookingGuest: Insert<BookingGuest>): Promise<BookingGuest> {
    const { data, error } = await getSupabase()
      .from('booking_guests')
      .insert(bookingGuest)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de l\'ajout du client à la réservation');
    return data;
  },

  // -- Front Desk --
  async listArrivals(hotelId: string, date: string): Promise<BookingWithRelations[]> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*, booking_guests(guest:guests(first_name, last_name)), booking_rooms(room:rooms(name, room_types(name)))')
      .eq('hotel_id', hotelId)
      .eq('check_in_date', date)
      .in('status', ['confirmed', 'pending'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as BookingWithRelations[];
  },

  async listInHouse(hotelId: string): Promise<BookingWithRelations[]> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*, booking_guests(guest:guests(first_name, last_name)), booking_rooms(room:rooms(name, room_types(name)))')
      .eq('hotel_id', hotelId)
      .eq('status', 'checked_in')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as BookingWithRelations[];
  },

  async listDepartures(hotelId: string, date: string): Promise<BookingWithRelations[]> {
    const { data, error } = await getSupabase()
      .from('bookings')
      .select('*, booking_guests(guest:guests(first_name, last_name)), booking_rooms(room:rooms(name, room_types(name)))')
      .eq('hotel_id', hotelId)
      .eq('check_out_date', date)
      .eq('status', 'checked_in')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as BookingWithRelations[];
  },

  // -- History --
  async listStatusHistory(bookingId: string): Promise<BookingStatusHistory[]> {
    const { data, error } = await getSupabase()
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
