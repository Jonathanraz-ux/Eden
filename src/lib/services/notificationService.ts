import { getSupabase } from '../supabase';
import type { Notification } from '../types/database';

export const notificationService = {
  async listByHotel(hotelId: string): Promise<Notification[]> {
    const { data, error } = await getSupabase()
      .from('notifications')
      .select('*')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markAsRead(notificationId: string, recipientId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('notification_recipients')
      .update({ status: 'read', read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('id', recipientId);
    if (error) throw error;
  },
};
