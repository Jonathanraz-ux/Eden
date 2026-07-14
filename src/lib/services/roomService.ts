import { getSupabase } from '../supabase';
import type {
  Room,
  RoomStatus,
  RoomStatusHistory,
  Insert,
  Update,
} from '../types/database';

export type RoomWithType = Room & { room_types: import('../types/database').RoomType };

export const roomService = {
  // -- Room Types --
  async listTypes(hotelId: string): Promise<import('../types/database').RoomType[]> {
    const { data, error } = await getSupabase()
      .from('room_types')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  // -- Rooms --
  async list(hotelId: string, options?: { status?: RoomStatus }): Promise<RoomWithType[]> {
    let query = getSupabase()
      .from('rooms')
      .select('*, room_types(*)')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('name');

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as RoomWithType[];
  },

  async create(room: Insert<Room>): Promise<Room> {
    const { data, error } = await getSupabase()
      .from('rooms')
      .insert(room)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de la chambre');
    return data;
  },

  async update(id: string, updates: Update<Room>): Promise<Room> {
    const { data, error } = await getSupabase()
      .from('rooms')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Chambre introuvable pour la mise à jour');
    return data;
  },

  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    return roomService.update(id, { status });
  },

  // -- Room Status History --
  async listStatusHistory(roomId: string): Promise<RoomStatusHistory[]> {
    const { data, error } = await getSupabase()
      .from('room_status_history')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
};
