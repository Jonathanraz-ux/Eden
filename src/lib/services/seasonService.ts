import { getSupabase } from '../supabase';
import type { Season, Insert, Update } from '../types/database';

export const seasonService = {
  async list(hotelId: string): Promise<Season[]> {
    const { data, error } = await getSupabase()
      .from('seasons')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('start_date');
    if (error) throw error;
    return data;
  },

  async create(season: Insert<Season>): Promise<Season> {
    const { data, error } = await getSupabase()
      .from('seasons')
      .insert(season)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la saison');
    return data;
  },

  async update(id: string, updates: Update<Season>): Promise<Season> {
    const { data, error } = await getSupabase()
      .from('seasons')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Saison introuvable pour la mise à jour');
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('seasons')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
