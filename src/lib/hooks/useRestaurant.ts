import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '../services/restaurantService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoRestaurantOrders, demoRestaurantMenuItems, demoRestaurantTables } from '../../data/demo-data';
import type { RestaurantOrder, RestaurantMenuItem, Insert, Update } from '../types/database';

export function useRestaurantOrders(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['restaurant_orders', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoRestaurantOrders) : restaurantService.listOrders(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useRestaurantTables(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['restaurant_tables', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoRestaurantTables) : restaurantService.listTables(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useRestaurantMenuItems(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['restaurant_menu_items', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoRestaurantMenuItems) : restaurantService.listMenuItems(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RestaurantOrder['status'] }) => {
      if (demoMode) return demoMutationResult({ id, status });
      return restaurantService.updateOrderStatus(id, status);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['restaurant_orders'] });
    },
  });
}

export function useCreateMenuItem() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (item: Insert<RestaurantMenuItem>) => {
      if (demoMode) return demoMutationResult({ ...item, id: 'demo-menu-item', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return restaurantService.createMenuItem(item);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['restaurant_menu_items', data.hotel_id] });
    },
  });
}

export function useUpdateMenuItem() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<RestaurantMenuItem> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return restaurantService.updateMenuItem(id, updates);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['restaurant_menu_items'] });
    },
  });
}

export function useDeleteMenuItem() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return restaurantService.deleteMenuItem(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['restaurant_menu_items'] });
    },
  });
}
