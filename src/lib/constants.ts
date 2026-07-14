import type { RoomStatus } from './types/database';

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  checked_in: 'En cours',
  checked_out: 'Départ',
  completed: 'Terminée',
  cancelled: 'Annulée',
  no_show: 'No Show',
  expired: 'Expirée',
};

export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  checked_in: 'bg-blue-50 text-blue-700 border-blue-200/60',
  checked_out: 'bg-violet-50 text-violet-700 border-violet-200/60',
  completed: 'bg-gray-50 text-gray-700 border-gray-200/60',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60',
  no_show: 'bg-rose-50 text-rose-700 border-rose-200/60',
  expired: 'bg-orange-50 text-orange-700 border-orange-200/60',
};

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: 'Disponible',
  reserved: 'Réservé',
  occupied: 'Occupé',
  cleaning: 'Nettoyage',
  maintenance: 'Maintenance',
  out_of_service: 'Hors service',
};

export const BOOKING_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: ['completed'],
};

export const STATUS_CHANGE_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'occupied', label: 'Occupé' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_service', label: 'Hors service' },
  { value: 'reserved', label: 'Réservé' },
];
