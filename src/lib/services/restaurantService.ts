import { getSupabase } from '../supabase';
import type { RestaurantOrder, RestaurantTable, RestaurantMenuItem, RestaurantOrderItem, Insert, Update } from '../types/database';

export type OrderWithItems = RestaurantOrder & {
  items: (RestaurantOrderItem & { menu_item: RestaurantMenuItem })[];
  table: RestaurantTable | null;
};

export const restaurantService = {
  async listOrders(hotelId: string): Promise<OrderWithItems[]> {
    const { data: orders, error } = await getSupabase()
      .from('restaurant_orders')
      .select('*, table:restaurant_tables(*)')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(
      (orders ?? []).map(async (o) => {
        const { data: items, error: itemError } = await getSupabase()
          .from('restaurant_order_items')
          .select('*, menu_item:restaurant_menu_items(*)')
          .eq('order_id', o.id);
        if (itemError) throw itemError;
        return { ...o, items: items ?? [] };
      })
    );

    return enriched as unknown as OrderWithItems[];
  },

  async listTables(hotelId: string): Promise<RestaurantTable[]> {
    const { data, error } = await getSupabase()
      .from('restaurant_tables')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data;
  },

  async listMenuItems(hotelId: string): Promise<RestaurantMenuItem[]> {
    const { data, error } = await getSupabase()
      .from('restaurant_menu_items')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('sort_order');
    if (error) throw error;
    return data;
  },

  // -- Menu Items CRUD --
  async createMenuItem(item: Insert<RestaurantMenuItem>): Promise<RestaurantMenuItem> {
    const { data, error } = await getSupabase()
      .from('restaurant_menu_items')
      .insert(item)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création de l\'élément de menu');
    return data;
  },

  async updateMenuItem(id: string, updates: Update<RestaurantMenuItem>): Promise<RestaurantMenuItem> {
    const { data, error } = await getSupabase()
      .from('restaurant_menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Élément de menu introuvable');
    return data;
  },

  async updateOrderStatus(id: string, status: RestaurantOrder['status']): Promise<RestaurantOrder> {
    const { data, error } = await getSupabase()
      .from('restaurant_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Commande introuvable');
    return data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('restaurant_menu_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },
};
