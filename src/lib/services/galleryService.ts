import { getSupabase } from '../supabase';
import type { GalleryImage, Insert, Update } from '../types/database';

export const galleryService = {
  async list(hotelId: string): Promise<GalleryImage[]> {
    const { data, error } = await getSupabase()
      .from('gallery_images')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  async create(image: Insert<GalleryImage>): Promise<GalleryImage> {
    const { data, error } = await getSupabase()
      .from('gallery_images')
      .insert(image)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de l\'ajout de l\'image');
    return data;
  },

  async update(id: string, updates: Update<GalleryImage>): Promise<GalleryImage> {
    const { data, error } = await getSupabase()
      .from('gallery_images')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Image introuvable pour la mise à jour');
    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('gallery_images')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
