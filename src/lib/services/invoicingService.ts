import { getSupabase } from '../supabase';
import type { InvoiceItem, Tax, Discount, Insert, Update } from '../types/database';

export const invoicingService = {
  // -- Invoice Items --
  async listItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await getSupabase()
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  // -- Taxes --
  async listTaxes(hotelId: string): Promise<Tax[]> {
    const { data, error } = await getSupabase()
      .from('taxes')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createTax(tax: Insert<Tax>): Promise<Tax> {
    const { data, error } = await getSupabase()
      .from('taxes')
      .insert(tax)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la taxe');
    return data;
  },

  async updateTax(id: string, updates: Update<Tax>): Promise<Tax> {
    const { data, error } = await getSupabase()
      .from('taxes')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Taxe introuvable pour la mise à jour');
    return data;
  },

  async deleteTax(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('taxes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // -- Discounts --
  async listDiscounts(hotelId: string): Promise<Discount[]> {
    const { data, error } = await getSupabase()
      .from('discounts')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createDiscount(discount: Insert<Discount>): Promise<Discount> {
    const { data, error } = await getSupabase()
      .from('discounts')
      .insert(discount)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la remise');
    return data;
  },

  async updateDiscount(id: string, updates: Update<Discount>): Promise<Discount> {
    const { data, error } = await getSupabase()
      .from('discounts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Remise introuvable pour la mise à jour');
    return data;
  },

  async deleteDiscount(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('discounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
