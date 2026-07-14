import { getSupabase } from '../supabase';
import type { Guest, Insert, Update } from '../types/database';

export const guestService = {
  async list(hotelId: string): Promise<Guest[]> {
    const { data, error } = await getSupabase()
      .from('guests')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('last_name');
    if (error) throw error;
    return data;
  },

  async search(hotelId: string, query: string): Promise<Guest[]> {
    const { data, error } = await getSupabase()
      .from('guests')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .or(`last_name.ilike.%${query}%,first_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('last_name')
      .limit(20);
    if (error) throw error;
    return data;
  },

  async create(guest: Insert<Guest>): Promise<Guest> {
    const { data, error } = await getSupabase()
      .from('guests')
      .insert(guest)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création du client');
    return data;
  },

  async update(id: string, updates: Update<Guest>): Promise<Guest> {
    const { data, error } = await getSupabase()
      .from('guests')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Client introuvable pour la mise à jour');
    return data;
  },

};
