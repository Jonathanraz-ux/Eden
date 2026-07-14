import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '../services/bookingService';
import { useDemoMode, demoMutationResult, demoMutationSuccess } from '../demo-mode';
import { demoBookings } from '../../data/demo-data';
import type { Booking, BookingRoom, BookingGuest, BookingStatus, BookingStatusHistory, Insert, Update } from '../types/database';

export function useBookings(hotelId: string, options?: { status?: BookingStatus }) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['bookings', hotelId, options],
    queryFn: () => {
      if (demoMode) {
        let result = demoBookings;
        if (options?.status) result = result.filter(b => b.status === options.status);
        return Promise.resolve(result);
      }
      return bookingService.list(hotelId, options);
    },
    enabled: Boolean(hotelId),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (booking: Insert<Booking>) => {
      if (demoMode) return demoMutationResult({ ...booking, id: 'demo-new', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return bookingService.create(booking);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['bookings', data.hotel_id] });
    },
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: BookingStatus; reason?: string }) => {
      if (demoMode) return demoMutationSuccess().then(() => ({ id, status }));
      return bookingService.updateStatus(id, status, reason);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useBookingRooms(bookingId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['booking_rooms', bookingId],
    queryFn: () => demoMode ? Promise.resolve([]) : bookingService.listRooms(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useBookingGuests(bookingId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['booking_guests', bookingId],
    queryFn: () => demoMode ? Promise.resolve([]) : bookingService.listGuests(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useAddBookingRoom() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (room: Insert<BookingRoom>) => {
      if (demoMode) return demoMutationResult({ ...room, id: 'demo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return bookingService.addRoom(room);
    },
    onSuccess: (data) => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['booking_rooms', data.booking_id] });
        qc.invalidateQueries({ queryKey: ['bookings'] });
      }
    },
  });
}

export function useAddBookingGuest() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (guest: Insert<BookingGuest>) => {
      if (demoMode) return demoMutationResult({ ...guest, id: 'demo' } as any);
      return bookingService.addGuest(guest);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['booking_guests', data.booking_id] });
    },
  });
}

export function useBookingStatusHistory(bookingId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['booking_status_history', bookingId],
    queryFn: () => demoMode ? Promise.resolve([]) : bookingService.listStatusHistory(bookingId),
    enabled: Boolean(bookingId),
  });
}

// -- Front Desk --
export function useArrivals(hotelId: string, date: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['bookings', 'arrivals', hotelId, date],
    queryFn: () => {
      if (demoMode) return Promise.resolve(demoBookings.filter(b => b.status === 'confirmed').slice(0, 3));
      return bookingService.listArrivals(hotelId, date);
    },
    enabled: Boolean(hotelId) && Boolean(date),
    refetchInterval: 30_000,
  });
}

export function useInHouse(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['bookings', 'in_house', hotelId],
    queryFn: () => {
      if (demoMode) return Promise.resolve(demoBookings.filter(b => b.status === 'checked_in'));
      return bookingService.listInHouse(hotelId);
    },
    enabled: Boolean(hotelId),
    refetchInterval: 30_000,
  });
}

export function useDepartures(hotelId: string, date: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['bookings', 'departures', hotelId, date],
    queryFn: () => {
      if (demoMode) return Promise.resolve(demoBookings.filter(b => b.status === 'checked_out').slice(0, 2));
      return bookingService.listDepartures(hotelId, date);
    },
    enabled: Boolean(hotelId) && Boolean(date),
    refetchInterval: 30_000,
  });
}

export function useUpdateBookingRoom() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<BookingRoom> }) => {
      if (demoMode) return demoMutationSuccess().then(() => ({ id, ...updates } as any));
      return bookingService.updateBookingRoom(id, updates);
    },
    onSuccess: () => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['booking_rooms'] });
        qc.invalidateQueries({ queryKey: ['bookings'] });
      }
    },
  });
}


