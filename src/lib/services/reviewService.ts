import { getSupabase } from '../supabase';
import type { Review } from '../types/database';

export const reviewService = {
  async list(hotelId: string, options?: { visibleOnly?: boolean }): Promise<Review[]> {
    let query = getSupabase()
      .from('reviews')
      .select('*, guest:guests(first_name, last_name)')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (options?.visibleOnly) query = query.eq('is_visible', true);

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Review[];
  },

  async reply(id: string, hotelReply: string): Promise<Review> {
    const { data, error } = await getSupabase()
      .from('reviews')
      .update({ hotel_reply: hotelReply })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Avis introuvable pour la réponse');
    return data;
  },

  async toggleVisibility(id: string, isVisible: boolean): Promise<Review> {
    const { data, error } = await getSupabase()
      .from('reviews')
      .update({ is_visible: isVisible })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Avis introuvable');
    return data;
  },

  async archive(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('reviews')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
