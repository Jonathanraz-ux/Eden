import { useState, useMemo } from 'react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRooms, useUpdateRoomStatus, useRoomStatusHistory } from '../lib/hooks/useRooms';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { cn, formatDate } from '../lib/utils';
import { ROOM_STATUS_LABELS } from '../lib/constants';
import { Sparkles, Wrench, CheckCircle2, History, BedDouble } from 'lucide-react';
import { triggerToast } from '../components/Toast';
import type { RoomStatus } from '../lib/types/database';
import type { RoomWithType } from '../lib/services/roomService';

type Tab = 'cleaning' | 'maintenance' | 'all';

const statusBadgeConfig: Record<string, { bg: string; text: string; dot: string }> = {
  available: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  occupied: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  reserved: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  cleaning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  maintenance: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  out_of_service: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
};

function getStatusConfig(status: string) {
  return statusBadgeConfig[status] ?? { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' };
}

interface HistoryPanelProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

function HistoryPanel({ roomId, roomName, onClose }: HistoryPanelProps) {
  const { data: history = [] } = useRoomStatusHistory(roomId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center">
              <History className="w-5 h-5 text-[#1A1A1A]/50" />
            </div>
            <div>
              <h2 className="text-base font-serif text-[#1A1A1A]">Historique</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-0.5 font-medium">{roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <History className="w-5 h-5 rotate-90" />
          </button>
        </div>
        <div className="p-6 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-8 text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30">
              Aucun historique
            </div>
          ) : (
            history.map(h => (
              <div key={h.id} className="flex items-start gap-4 px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium bg-[#1A1A1A]/5 text-[#1A1A1A]/60">
                      {h.previous_status ?? '—'}
                    </span>
                    <span className="text-[#1A1A1A]/30 text-xs">→</span>
                    <span className={cn(
                      "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium",
                      h.new_status === 'available' ? "bg-emerald-50 text-emerald-700" :
                      h.new_status === 'cleaning' ? "bg-amber-50 text-amber-700" :
                      h.new_status === 'maintenance' ? "bg-red-50 text-red-700" :
                      "bg-blue-50 text-blue-700"
                    )}>
                      {ROOM_STATUS_LABELS[h.new_status as RoomStatus] ?? h.new_status}
                    </span>
                  </div>
                  {h.reason && (
                    <p className="text-[11px] text-[#1A1A1A]/50 mt-1 italic">{h.reason}</p>
                  )}
                </div>
                <span className="text-[9px] text-[#1A1A1A]/30 shrink-0">
                  {new Date(h.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RoomCard(props: {
  room: RoomWithType;
  onMaintenance: (room: RoomWithType) => void;
  onHistory: (roomId: string, roomName: string) => void;
  key?: string;
}) {
  const { room, onMaintenance, onHistory } = props;
  const updateRoomStatus = useUpdateRoomStatus();

  const cfg = getStatusConfig(room.status);
  const surfaceInfo = room.actual_surface_m2 ?? room.room_types?.surface_m2;
  const capacity = room.actual_capacity ?? room.room_types?.base_capacity;

  return (
    <div className="bg-white border border-[#1A1A1A]/10 rounded-sm hover:border-[#1A1A1A]/20 transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h4 className="text-sm font-medium text-[#1A1A1A]">{room.name}</h4>
            <p className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40 mt-0.5">
              {room.room_types?.name ?? 'Standard'}
            </p>
          </div>
          <span className={cn("flex items-center gap-1.5 px-2 py-1 rounded-sm text-[9px] uppercase tracking-wider font-medium", cfg.bg, cfg.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {ROOM_STATUS_LABELS[room.status] ?? room.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-3 text-[10px] text-[#1A1A1A]/40">
          {surfaceInfo && <span>{surfaceInfo} m²</span>}
          {capacity && <span>{capacity} pers.</span>}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-[#1A1A1A]/5">
          {room.status === 'cleaning' && (
            <button
              onClick={() => updateRoomStatus.mutate({ id: room.id, status: 'available' }, { onSuccess: () => triggerToast(`${room.name} — Prêt`) })}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-700 text-[9px] uppercase tracking-wider font-semibold hover:bg-emerald-50 transition-all rounded-sm"
            >
              <CheckCircle2 className="w-3 h-3" />
              Terminé
            </button>
          )}
          {room.status === 'maintenance' && (
            <button
              onClick={() => updateRoomStatus.mutate({ id: room.id, status: 'available' }, { onSuccess: () => triggerToast(`${room.name} — Remis en service`) })}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-emerald-700 text-[9px] uppercase tracking-wider font-semibold hover:bg-emerald-50 transition-all rounded-sm"
            >
              <CheckCircle2 className="w-3 h-3" />
              Remis en service
            </button>
          )}
          {room.status !== 'maintenance' && room.status !== 'out_of_service' && (
            <button
              onClick={() => onMaintenance(room)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 text-[9px] uppercase tracking-wider font-semibold hover:bg-amber-50 transition-all rounded-sm"
            >
              <Wrench className="w-3 h-3" />
              Maintenance
            </button>
          )}
          <button
            onClick={() => onHistory(room.id, room.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/10 text-[#1A1A1A]/40 text-[9px] uppercase tracking-wider font-semibold hover:bg-[#FAF9F6] transition-all rounded-sm ml-auto"
          >
            <History className="w-3 h-3" />
            Historique
          </button>
        </div>
      </div>
    </div>
  );
}

export function HousekeepingView() {
  const hotelId = useCurrentHotelId();
  const { data: allRooms = [], isLoading } = useRooms(hotelId ?? '');
  const [activeTab, setActiveTab] = useState<Tab>('cleaning');
  const [maintenanceRoom, setMaintenanceRoom] = useState<RoomWithType | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);

  const stats = useMemo(() => ({
    cleaning: allRooms.filter(r => r.status === 'cleaning').length,
    maintenance: allRooms.filter(r => r.status === 'maintenance').length,
    available: allRooms.filter(r => r.status === 'available').length,
    total: allRooms.length,
  }), [allRooms]);

  const filtered = useMemo(() => {
    if (activeTab === 'cleaning') return allRooms.filter(r => r.status === 'cleaning');
    if (activeTab === 'maintenance') return allRooms.filter(r => r.status === 'maintenance');
    return allRooms;
  }, [allRooms, activeTab]);

  const tabs: { key: Tab; label: string; icon: typeof Sparkles; count: number }[] = [
    { key: 'cleaning', label: 'À Nettoyer', icon: Sparkles, count: stats.cleaning },
    { key: 'maintenance', label: 'En Maintenance', icon: Wrench, count: stats.maintenance },
    { key: 'all', label: 'Toutes les Chambres', icon: BedDouble, count: stats.total },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-[#1A1A1A]">Ménage & Maintenance</h1>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'À Nettoyer', value: stats.cleaning, icon: Sparkles, color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'En Maintenance', value: stats.maintenance, icon: Wrench, color: 'bg-red-50 border-red-200 text-red-700' },
          { label: 'Disponibles', value: stats.available, icon: CheckCircle2, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
        ].map(stat => (
          <div key={stat.label} className={`flex items-center gap-4 px-5 py-4 border rounded-sm ${stat.color}`}>
            <stat.icon className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-2xl font-serif font-bold">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-[0.2em] font-medium mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 border transition-all rounded-sm text-left",
              activeTab === tab.key
                ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                : "border-[#1A1A1A]/10 bg-white text-[#1A1A1A]/60 hover:border-[#1A1A1A]/30"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.key ? "text-white" : "text-[#1A1A1A]/30")} />
            <div>
              <p className={cn(
                "text-[9px] uppercase tracking-[0.2em] font-semibold",
                activeTab === tab.key ? "text-white/60" : "text-[#1A1A1A]/40"
              )}>
                {tab.label}
              </p>
              <p className={cn(
                "text-lg font-serif",
                activeTab === tab.key ? "text-white" : "text-[#1A1A1A]"
              )}>
                {tab.count}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#1A1A1A]/10 rounded-sm p-5 space-y-3">
              <div className="w-32 h-4 bg-[#1A1A1A]/5 animate-pulse" />
              <div className="w-20 h-3 bg-[#1A1A1A]/5 animate-pulse" />
              <div className="w-full h-8 bg-[#1A1A1A]/5 animate-pulse mt-4" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 rounded-sm">
          {activeTab === 'cleaning' ? (
            <Sparkles className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
          ) : activeTab === 'maintenance' ? (
            <Wrench className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
          ) : (
            <BedDouble className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
          )}
          <p className="text-sm text-[#1A1A1A]/40">
            {activeTab === 'cleaning' ? 'Aucune chambre à nettoyer' :
             activeTab === 'maintenance' ? 'Aucune chambre en maintenance' :
             'Aucune chambre'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onMaintenance={setMaintenanceRoom}
              onHistory={(id, name) => setHistoryTarget({ id, name })}
            />
          ))}
        </div>
      )}

      {maintenanceRoom && (
        <MaintenanceModal
          roomId={maintenanceRoom.id}
          roomName={maintenanceRoom.name}
          onClose={() => setMaintenanceRoom(null)}
        />
      )}

      {historyTarget && (
        <HistoryPanel
          roomId={historyTarget.id}
          roomName={historyTarget.name}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  );
}
