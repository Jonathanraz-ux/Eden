import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoPayments, demoInvoices } from '../../data/demo-data';
import type { Payment, Invoice, InvoiceItem, Insert } from '../types/database';

export function usePayments(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['payments', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoPayments) : paymentService.listByHotel(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (payment: Insert<Payment>) => {
      if (demoMode) return demoMutationResult({ ...payment, id: 'demo-pay', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return paymentService.create(payment);
    },
    onSuccess: (data) => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['payments', data.hotel_id] });
        qc.invalidateQueries({ queryKey: ['payments', 'booking', data.booking_id] });
      }
    },
  });
}

export function useInvoices(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['invoices', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoInvoices) : paymentService.listInvoices(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useInvoice(id: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: () => demoMode ? Promise.resolve(demoInvoices.find(i => i.id === id) ?? null) : paymentService.getInvoice(id),
    enabled: Boolean(id),
  });
}

export function useGenerateInvoiceFromBooking() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ bookingId, hotelId }: { bookingId: string; hotelId: string }) => {
      if (demoMode) return demoMutationResult(demoInvoices[0]);
      return paymentService.generateInvoiceFromBooking(bookingId, hotelId);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      if (demoMode) return demoMutationResult({ id, status });
      return paymentService.updateInvoiceStatus(id, status);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useAddInvoiceItem() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (item: Insert<InvoiceItem>) => {
      if (demoMode) return demoMutationResult({ ...item, id: 'demo-inv-item', created_at: new Date().toISOString() } as any);
      return paymentService.addInvoiceItem(item);
    },
    onSuccess: (data) => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['invoice_items', data.invoice_id] });
        qc.invalidateQueries({ queryKey: ['invoices'] });
      }
    },
  });
}

export function useRemoveInvoiceItem() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return paymentService.removeInvoiceItem(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useBookingPayments(bookingId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['payments', 'booking', bookingId],
    queryFn: () => demoMode ? Promise.resolve(demoPayments.filter(p => p.booking_id === bookingId)) : paymentService.listByBooking(bookingId),
    enabled: Boolean(bookingId),
  });
}
