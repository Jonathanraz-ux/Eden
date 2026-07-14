import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { ROOM_STATUS_LABELS as statusLabels, STATUS_CHANGE_OPTIONS } from '../lib/constants';
import { Plus, Users, Eye, ChevronDown } from 'lucide-react';
import { RoomFormModal } from '../components/RoomFormModal';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRooms, useRoomTypes, useUpdateRoomStatus } from '../lib/hooks/useRooms';
import type { RoomStatus } from '../lib/types/database';

type Mode = 'rooms' | 'bungalows';

const MODE_TABS: { value: Mode; label: string }[] = [
  { value: 'rooms', label: 'Chambres' },
  { value: 'bungalows', label: 'Bungalows & Villas' },
];

const statusTabs: { value: RoomStatus | ''; label: string }[] = [
  { value: '', label: 'Toutes' },
  { value: 'available', label: 'Disponibles' },
  { value: 'occupied', label: 'Occupées' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'maintenance', label: 'Maintenance' },
];

const statusConfig: Record<RoomStatus, { dot: string; badge: string }> = {
  available: {
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  },
  reserved: {
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/60',
  },
  occupied: {
    dot: 'bg-blue-900',
    badge: 'bg-blue-50 text-blue-800 border-blue-200/60',
  },
  cleaning: {
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
  },
  maintenance: {
    dot: 'bg-orange-400',
    badge: 'bg-orange-50 text-orange-700 border-orange-200/60',
  },
  out_of_service: {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200/60',
  },
};

function CardSkeleton() {
  return (
    <div className="bg-white border border-[#1A1A1A]/10 p-6 space-y-5">
      <div className="flex justify-between items-start">
        <Skeleton className="w-28 h-5" />
        <Skeleton className="w-20 h-5 rounded-full" />
      </div>
      <Skeleton className="w-32 h-3" />
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="w-12 h-3" />
          <Skeleton className="w-16 h-3" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="w-14 h-3" />
          <Skeleton className="w-12 h-3" />
        </div>
      </div>
      <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center">
        <Skeleton className="w-20 h-6" />
        <Skeleton className="w-16 h-3" />
      </div>
    </div>
  );
}

export function RoomsView() {
  const hotelId = useCurrentHotelId();
  const [mode, setMode] = useState<Mode>('rooms');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);

  const { data: rooms, isLoading } = useRooms(hotelId ?? '', statusFilter || undefined);
  const { data: roomTypes } = useRoomTypes(hotelId ?? '');
  const updateStatus = useUpdateRoomStatus();

  const filtered = useMemo(() => {
    if (!rooms) return rooms;
    if (mode === 'bungalows') {
      return rooms.filter((r) => {
        const typeName = r.room_types?.name?.toLowerCase() ?? '';
        return typeName.includes('bungalow') || typeName.includes('villa');
      });
    }
    return rooms;
  }, [rooms, mode]);

  const counts = {
    total: filtered?.length ?? 0,
    disponibles: filtered?.filter((r) => r.status === 'available').length ?? 0,
    occupees: filtered?.filter((r) => r.status === 'occupied').length ?? 0,
    nettoyage: filtered?.filter((r) => r.status === 'cleaning' || r.status === 'maintenance').length ?? 0,
  };

  const handleStatusChange = async (roomId: string, newStatus: RoomStatus) => {
    setChangingStatus(roomId);
    try {
      await updateStatus.mutateAsync({ id: roomId, status: newStatus });
    } catch (err) {
      console.error('Erreur changement de statut:', err);
    } finally {
      setChangingStatus(null);
    }
  };

  const createLabel = mode === 'bungalows' ? 'Nouveau Bungalow' : 'Nouvelle Chambre';

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">{mode === 'bungalows' ? 'Bungalows & Villas' : 'État des Chambres'}</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {isLoading ? 'Chargement...' : `${counts.disponibles} disponible${counts.disponibles > 1 ? 's' : ''} · ${counts.occupees} occupée${counts.occupees > 1 ? 's' : ''} · ${counts.nettoyage} en entretien`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          {createLabel}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 p-1 bg-white border border-[#1A1A1A]/10 w-fit rounded-sm">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMode(tab.value)}
              className={cn(
                "px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold rounded-sm transition-all duration-200",
                mode === tab.value
                  ? "bg-[#1A1A1A] text-white shadow-sm"
                  : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 hover:bg-[#FAF9F6]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {mode === 'rooms' && (
          <div className="flex gap-1 p-1 bg-white border border-[#1A1A1A]/10 w-fit rounded-sm">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-4 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold rounded-sm transition-all duration-200",
                  statusFilter === tab.value
                    ? "bg-[#1A1A1A] text-white shadow-sm"
                    : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]/80 hover:bg-[#FAF9F6]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#1A1A1A]/10">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center mb-4">
            <Eye className="w-5 h-5 text-[#1A1A1A]/30" />
          </div>
          <p className="text-sm font-medium text-[#1A1A1A]/50">
            {mode === 'bungalows' ? 'Aucun bungalow ou villa' : 'Aucune chambre trouvée'}
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1">
            {mode === 'bungalows' ? 'Créez un bungalow ou une villa pour commencer' : 'Aucune chambre ne correspond au filtre sélectionné'}
          </p>
        </div>
      ) : mode === 'bungalows' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((bungalow) => {
            const roomType = bungalow.room_types;
            const price = roomType
              ? (roomType.base_price_cents + bungalow.price_adjustment_cents) / 100
              : 0;

            return (
              <div key={bungalow.id} className="bg-white border border-[#1A1A1A]/10 group rounded-sm flex flex-col">
                <div className="h-48 relative overflow-hidden bg-[#1A1A1A]/5">
                  <img
                    src={`https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&q=80&w=800&h=600`}
                    alt={bungalow.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={cn(
                      "px-2 py-1 text-[9px] uppercase font-bold rounded-full shadow-sm backdrop-blur-md",
                      bungalow.status === 'available' && "bg-green-100 text-green-800",
                      bungalow.status === 'occupied' && "bg-amber-100 text-amber-800",
                      bungalow.status === 'cleaning' && "bg-blue-100 text-blue-800",
                      bungalow.status === 'maintenance' && "bg-red-100 text-red-800",
                      bungalow.status === 'out_of_service' && "bg-gray-100 text-gray-800",
                      bungalow.status === 'reserved' && "bg-purple-100 text-purple-800",
                    )}>
                      {statusLabels[bungalow.status]}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center text-[10px] uppercase tracking-widest opacity-40 mb-2">
                    {roomType?.name ?? 'Type inconnu'}
                  </div>
                  <h4 className="font-serif text-xl font-medium text-[#1A1A1A] mb-6">{bungalow.name}</h4>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-[#1A1A1A]/5 p-3 rounded-sm">
                      <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Capacité</p>
                      <p className="font-medium text-[#1A1A1A] text-sm">
                        {bungalow.actual_capacity ?? roomType?.base_capacity ?? 0} pers.
                      </p>
                    </div>
                    <div className="border border-[#1A1A1A]/5 p-3 rounded-sm">
                      <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Statut</p>
                      <div className="relative">
                        <button
                          disabled={changingStatus === bungalow.id}
                          className="flex items-center gap-1 text-sm font-medium text-[#1A1A1A]"
                        >
                          {statusLabels[bungalow.status]}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <select
                          value={bungalow.status}
                          onChange={(e) => handleStatusChange(bungalow.id, e.target.value as RoomStatus)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={changingStatus === bungalow.id}
                        >
                          {STATUS_CHANGE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center mt-auto">
                    <span className="text-xl font-serif text-[#C5A059]">{price}€<span className="text-[10px] uppercase tracking-widest opacity-40 font-sans ml-1 text-[#1A1A1A]">/nuit</span></span>
                    <button className="text-[#1A1A1A] text-[10px] font-bold uppercase tracking-widest hover:text-[#C5A059] transition-colors">Gérer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((room) => {
            const config = statusConfig[room.status];
            const roomType = room.room_types;
            const price = roomType
              ? (roomType.base_price_cents + room.price_adjustment_cents) / 100
              : 0;
            const capacity = room.actual_capacity ?? roomType?.base_capacity ?? 0;

            return (
              <div
                key={room.id}
                className="bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 hover:shadow-sm transition-all duration-200 p-6 flex flex-col group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-base font-serif font-medium text-[#1A1A1A]">{room.name}</h4>
                  <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 text-[8px] uppercase tracking-wider font-semibold border rounded-full", config.badge)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                    {statusLabels[room.status]}
                  </span>
                </div>

                <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 font-medium mb-6">
                  {roomType?.name ?? 'Type inconnu'}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#1A1A1A]/40 uppercase tracking-wider text-[9px]">Capacité</span>
                    <span className="flex items-center gap-1.5 text-sm text-[#1A1A1A]">
                      <Users className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                      {capacity} pers.
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#1A1A1A]/40 uppercase tracking-wider text-[9px]">Tarif</span>
                    <span className="text-base font-serif text-[#1A1A1A]">{price}€ <span className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40 font-sans">/nuit</span></span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1A1A1A]/5 mt-auto flex justify-between items-center">
                  {room.status === 'occupied' ? (
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#1A1A1A]/40">Client en cours</span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#C5A059]/60">
                      {room.status === 'available' ? 'Prête à accueillir' : 'En préparation'}
                    </span>
                  )}
                  <div className="relative">
                    <button
                      disabled={changingStatus === room.id}
                      className="flex items-center gap-1 text-[#1A1A1A] text-[9px] uppercase tracking-[0.15em] font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#C5A059]"
                    >
                      Statut
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <select
                      value={room.status}
                      onChange={(e) => handleStatusChange(room.id, e.target.value as RoomStatus)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={changingStatus === room.id}
                    >
                      {STATUS_CHANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RoomFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
