import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomService } from '../services/roomService';
import { useDemoMode, demoMutationResult, demoMutationSuccess } from '../demo-mode';
import { demoRooms, demoRoomTypes, DEMO_HOTEL_ID } from '../../data/demo-data';
import type { Room, RoomStatus, RoomType, Insert } from '../types/database';
import type { RoomWithType } from '../services/roomService';

export function useRooms(hotelId: string, status?: RoomStatus) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['rooms', hotelId, status],
    queryFn: () => {
      if (demoMode) {
        let result = demoRooms as any as RoomWithType[];
        if (status) result = result.filter(r => r.status === status);
        return Promise.resolve(result);
      }
      return roomService.list(hotelId, { status });
    },
    enabled: Boolean(hotelId),
  });
}

export function useRoomTypes(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['room_types', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoRoomTypes) : roomService.listTypes(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useUpdateRoomStatus() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoomStatus }) => {
      if (demoMode) return demoMutationSuccess().then(() => ({ id, status, hotel_id: DEMO_HOTEL_ID }));
      return roomService.updateStatus(id, status);
    },
    onSuccess: (data) => {
      if (!demoMode) {
        qc.invalidateQueries({ queryKey: ['rooms', data.hotel_id] });
        qc.invalidateQueries({ queryKey: ['rooms', data.id] });
      }
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (room: Insert<Room>) => {
      if (demoMode) return demoMutationResult({ ...room, id: 'demo-room', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return roomService.create(room);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['rooms', data.hotel_id] });
    },
  });
}

export function useRoomStatusHistory(roomId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['room_status_history', roomId],
    queryFn: () => demoMode ? Promise.resolve([]) : roomService.listStatusHistory(roomId),
    enabled: Boolean(roomId),
  });
}
