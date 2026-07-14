import { getSupabase } from '../supabase';
import type { Hotel } from '../types/database';

export const hotelService = {
  async list(): Promise<Hotel[]> {
    const { data, error } = await getSupabase()
      .from('hotels')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data;
  },

  async getDefault(): Promise<Hotel | null> {
    const hotels = await this.list();
    return hotels[0] ?? null;
  },
};
