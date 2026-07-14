import { getSupabase } from '../supabase';
import type {
  Payment,
  Invoice,
  InvoiceItem,
  RatePlan,
  RatePlanRoomType,
  Insert,
  Update,
} from '../types/database';

export const paymentService = {
  // -- Payments --
  async listByBooking(bookingId: string): Promise<Payment[]> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at');
    if (error) throw error;
    return data;
  },

  async listByHotel(hotelId: string): Promise<Payment[]> {
    const { data, error } = await getSupabase()
      .from('payments')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(payment: Insert<Payment>): Promise<Payment> {
    const { data, error } = await getSupabase()
      .from('payments')
      .insert(payment)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création du paiement');
    return data;
  },

  // -- Invoices --
  async listInvoices(hotelId: string): Promise<Invoice[]> {
    const { data, error } = await getSupabase()
      .from('invoices')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await getSupabase()
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async generateInvoiceNumber(hotelId: string): Promise<string> {
    const { data, error } = await getSupabase()
      .rpc('fn_generate_invoice_number', { p_hotel_id: hotelId, p_prefix: 'FAC' });
    if (error) throw error;
    return data as string;
  },

  async createInvoice(invoice: Insert<Invoice>): Promise<Invoice> {
    const { data, error } = await getSupabase()
      .from('invoices')
      .insert(invoice)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la facture');
    return data;
  },

  async updateInvoice(id: string, updates: Update<Invoice>): Promise<Invoice> {
    const { data, error } = await getSupabase()
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Facture introuvable pour la mise à jour');
    return data;
  },

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    return paymentService.updateInvoice(id, { status } as Update<Invoice>);
  },

  async addInvoiceItem(item: Insert<InvoiceItem>): Promise<InvoiceItem> {
    const { data, error } = await getSupabase()
      .from('invoice_items')
      .insert(item)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de l\'ajout de la ligne de facture');
    return data;
  },

  async removeInvoiceItem(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('invoice_items')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async generateInvoiceFromBooking(bookingId: string, hotelId: string): Promise<Invoice> {
    const { data: booking } = await getSupabase()
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();
    if (!booking) throw new Error('Réservation introuvable');

    const invoiceNumber = await paymentService.generateInvoiceNumber(hotelId);
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const invoice = await paymentService.createInvoice({
      booking_id: bookingId,
      hotel_id: hotelId,
      invoice_number: invoiceNumber,
      issue_date: today,
      due_date: dueDate,
      total_amount_cents: 0,
      tax_amount_cents: 0,
      discount_amount_cents: 0,
      net_amount_cents: 0,
      status: 'draft',
      notes: null,
    } as Insert<Invoice>);

    const { data: rooms } = await getSupabase()
      .from('booking_rooms')
      .select('*, room:rooms(name)')
      .eq('booking_id', bookingId);

    let sortOrder = 0;
    let total = 0;

    if (rooms) {
      for (const br of rooms) {
        const roomName = (br as any).room?.name ?? 'Chambre';
        const pricePerNight = br.applied_price_cents / br.night_count;
        for (let i = 1; i <= br.night_count; i++) {
          sortOrder++;
          await paymentService.addInvoiceItem({
            invoice_id: invoice.id,
            description: `${roomName} — Nuitée ${i}/${br.night_count}`,
            quantity: 1,
            unit_price_cents: Math.round(pricePerNight),
            total_price_cents: Math.round(pricePerNight),
            tax_rate: 0,
            tax_id: null,
            discount_id: null,
            sort_order: sortOrder,
          });
          total += Math.round(pricePerNight);
        }
      }
    }

    const { data: services } = await getSupabase()
      .from('booking_services')
      .select('*, service:services(name)')
      .eq('booking_id', bookingId)
      .neq('status', 'cancelled');

    if (services) {
      for (const bs of services) {
        sortOrder++;
        const serviceName = (bs as any).service?.name ?? 'Service';
        await paymentService.addInvoiceItem({
          invoice_id: invoice.id,
          description: serviceName,
          quantity: bs.quantity,
          unit_price_cents: bs.unit_price_cents,
          total_price_cents: bs.total_price_cents,
          tax_rate: 0,
          tax_id: null,
          discount_id: null,
          sort_order: sortOrder,
        });
        total += bs.total_price_cents;
      }
    }

    const updated = await paymentService.updateInvoice(invoice.id, {
      total_amount_cents: total,
      net_amount_cents: total,
    } as Update<Invoice>);

    return updated;
  },

  // -- Rate Plans --
  async listRatePlans(hotelId: string): Promise<RatePlan[]> {
    const { data, error } = await getSupabase()
      .from('rate_plans')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data;
  },

  async createRatePlan(ratePlan: Insert<RatePlan>): Promise<RatePlan> {
    const { data, error } = await getSupabase()
      .from('rate_plans')
      .insert(ratePlan)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création du plan tarifaire');
    return data;
  },

  async updateRatePlan(id: string, updates: Update<RatePlan>): Promise<RatePlan> {
    const { data, error } = await getSupabase()
      .from('rate_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Plan tarifaire introuvable pour la mise à jour');
    return data;
  },

  async softDeleteRatePlan(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('rate_plans')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // -- Rate Plan Room Type Prices --
  async listRatePlanPrices(ratePlanId: string): Promise<(RatePlanRoomType & { room_type_name?: string })[]> {
    const { data, error } = await getSupabase()
      .from('rate_plan_room_types')
      .select('*, room_type:room_types(name)')
      .eq('rate_plan_id', ratePlanId);
    if (error) throw error;
    return data as unknown as (RatePlanRoomType & { room_type_name?: string })[];
  },

  async setRatePlanPrice(ratePlanId: string, roomTypeId: string, appliedPriceCents: number | null): Promise<void> {
    const { error } = await getSupabase()
      .from('rate_plan_room_types')
      .upsert({ rate_plan_id: ratePlanId, room_type_id: roomTypeId, applied_price_cents: appliedPriceCents }, { onConflict: 'rate_plan_id,room_type_id' });
    if (error) throw error;
  },

  async removeRatePlanPrice(ratePlanId: string, roomTypeId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('rate_plan_room_types')
      .delete()
      .eq('rate_plan_id', ratePlanId)
      .eq('room_type_id', roomTypeId);
    if (error) throw error;
  },
};
