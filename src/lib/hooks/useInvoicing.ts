import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicingService } from '../services/invoicingService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoTaxes, demoDiscounts, demoInvoiceItems } from '../../data/demo-data';
import type { Tax, Discount, Insert, Update } from '../types/database';

// -- Invoice Items --
export function useInvoiceItems(invoiceId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['invoice_items', invoiceId],
    queryFn: () => demoMode ? Promise.resolve(demoInvoiceItems.filter(i => i.invoice_id === invoiceId)) : invoicingService.listItems(invoiceId),
    enabled: Boolean(invoiceId),
  });
}

// -- Taxes --
export function useTaxes(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['taxes', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoTaxes) : invoicingService.listTaxes(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreateTax() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (tax: Insert<Tax>) => {
      if (demoMode) return demoMutationResult({ ...tax, id: 'demo-tax', created_at: new Date().toISOString() } as any);
      return invoicingService.createTax(tax);
    },
    onSuccess: (data) => { if (!demoMode) qc.invalidateQueries({ queryKey: ['taxes', data.hotel_id] }); },
  });
}

export function useUpdateTax() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<Tax> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return invoicingService.updateTax(id, updates);
    },
    onSuccess: () => { if (!demoMode) qc.invalidateQueries({ queryKey: ['taxes'] }); },
  });
}

export function useDeleteTax() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return invoicingService.deleteTax(id);
    },
    onSuccess: () => { if (!demoMode) qc.invalidateQueries({ queryKey: ['taxes'] }); },
  });
}

// -- Discounts --
export function useDiscounts(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['discounts', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoDiscounts) : invoicingService.listDiscounts(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (discount: Insert<Discount>) => {
      if (demoMode) return demoMutationResult({ ...discount, id: 'demo-disc', created_at: new Date().toISOString() } as any);
      return invoicingService.createDiscount(discount);
    },
    onSuccess: (data) => { if (!demoMode) qc.invalidateQueries({ queryKey: ['discounts', data.hotel_id] }); },
  });
}

export function useUpdateDiscount() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<Discount> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return invoicingService.updateDiscount(id, updates);
    },
    onSuccess: () => { if (!demoMode) qc.invalidateQueries({ queryKey: ['discounts'] }); },
  });
}

export function useDeleteDiscount() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return invoicingService.deleteDiscount(id);
    },
    onSuccess: () => { if (!demoMode) qc.invalidateQueries({ queryKey: ['discounts'] }); },
  });
}
