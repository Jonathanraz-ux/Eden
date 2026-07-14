import { useState, useMemo } from 'react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useArrivals, useInHouse, useDepartures, useUpdateBookingStatus, useAddBookingRoom } from '../lib/hooks/useBookings';
import { useRooms, useUpdateRoomStatus } from '../lib/hooks/useRooms';
import { CheckInModal } from '../components/CheckInModal';
import { CheckOutModal } from '../components/CheckOutModal';
import { cn, formatCents } from '../lib/utils';
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '../lib/constants';
import { User, LogIn, LogOut, Building2, CalendarDays, Clock, BedDouble, ArrowRight, Search, Check, Loader2 } from 'lucide-react';
import { triggerToast } from '../components/Toast';
import type { BookingWithRelations } from '../lib/services/bookingService';

type Tab = 'arrivals' | 'in_house' | 'departures';

function getPrimaryGuest(b: BookingWithRelations): string {
  const g = b.booking_guests?.[0]?.guest;
  if (g?.first_name && g?.last_name) return `${g.first_name} ${g.last_name}`;
  if (g?.first_name) return g.first_name;
  return '—';
}

function getRoomName(b: BookingWithRelations): string {
  return b.booking_rooms?.[0]?.room?.name ?? '—';
}

function getRoomTypeName(b: BookingWithRelations): string {
  return b.booking_rooms?.[0]?.room?.room_types?.name ?? '—';
}

export function FrontDeskView() {
  const hotelId = useCurrentHotelId();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [activeTab, setActiveTab] = useState<Tab>('arrivals');
  const [checkInBookingId, setCheckInBookingId] = useState<string | null>(null);
  const [checkOutBookingId, setCheckOutBookingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [assigningRoom, setAssigningRoom] = useState<string | null>(null);
  const updateStatus = useUpdateBookingStatus();
  const addBookingRoom = useAddBookingRoom();
  const updateRoomStatus = useUpdateRoomStatus();

  const { data: arrivals = [], isLoading: loadingArrivals } = useArrivals(hotelId ?? '', today);
  const { data: inHouse = [], isLoading: loadingInHouse } = useInHouse(hotelId ?? '');
  const { data: departures = [], isLoading: loadingDepartures } = useDepartures(hotelId ?? '', today);
  const { data: availableRooms } = useRooms(hotelId ?? '', 'available');

  const stats = useMemo(() => ({
    arrivals: arrivals.length,
    inHouse: inHouse.length,
    departures: departures.length,
  }), [arrivals, inHouse, departures]);

  const handleQuickCheckIn = async (bookingId: string) => {
    if (!hotelId) return;
    try {
      await updateStatus.mutateAsync({ id: bookingId, status: 'checked_in' });
      triggerToast('Arrivée enregistrée');
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickAssign = async (bookingId: string, roomId: string) => {
    if (!hotelId) return;
    try {
      const booking = arrivals.find(b => b.id === bookingId);
      if (!booking) return;
      await addBookingRoom.mutateAsync({
        booking_id: bookingId,
        room_id: roomId,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        night_count: booking.night_count,
        adult_count: 1,
        child_count: 0,
        applied_price_cents: 0,
        status: 'confirmed',
      } as any);
      await updateRoomStatus.mutateAsync({ id: roomId, status: 'occupied' });
      triggerToast('Chambre attribuée');
      setAssigningRoom(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredArrivals = useMemo(() => {
    if (!searchQuery) return arrivals;
    const q = searchQuery.toLowerCase();
    return arrivals.filter(b => {
      const guest = getPrimaryGuest(b).toLowerCase();
      const ref = (b.booking_reference ?? '').toLowerCase();
      return guest.includes(q) || ref.includes(q);
    });
  }, [arrivals, searchQuery]);

  const filteredInHouse = useMemo(() => {
    if (!searchQuery) return inHouse;
    const q = searchQuery.toLowerCase();
    return inHouse.filter(b => {
      const guest = getPrimaryGuest(b).toLowerCase();
      const ref = (b.booking_reference ?? '').toLowerCase();
      return guest.includes(q) || ref.includes(q);
    });
  }, [inHouse, searchQuery]);

  const filteredDepartures = useMemo(() => {
    if (!searchQuery) return departures;
    const q = searchQuery.toLowerCase();
    return departures.filter(b => {
      const guest = getPrimaryGuest(b).toLowerCase();
      const ref = (b.booking_reference ?? '').toLowerCase();
      return guest.includes(q) || ref.includes(q);
    });
  }, [departures, searchQuery]);

  const tabs: { key: Tab; label: string; icon: typeof User; count: number; color: string }[] = [
    { key: 'arrivals', label: 'Arrivées du Jour', icon: LogIn, count: stats.arrivals, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { key: 'in_house', label: 'En Cours', icon: BedDouble, count: stats.inHouse, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { key: 'departures', label: 'Départs du Jour', icon: LogOut, count: stats.departures, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  ];

  const loading = loadingArrivals || loadingInHouse || loadingDepartures;

  function renderCard(b: BookingWithRelations, type: 'arrival' | 'in_house' | 'departure') {
    const guestName = getPrimaryGuest(b);
    const roomName = getRoomName(b);
    const roomType = getRoomTypeName(b);
    const colorClass = BOOKING_STATUS_COLORS[b.status] ?? '#1A1A1A';
    const needsRoom = type === 'arrival' && roomName === '—';
    const isAssigning = assigningRoom === b.id;

    return (
      <div key={b.id} className="bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 transition-all rounded-sm">
        <div className="flex items-stretch">
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center text-xs font-serif text-[#1A1A1A]/60 shrink-0 mt-0.5">
                  {guestName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium text-[#1A1A1A] truncate">{guestName}</h4>
                    <span className={cn(
                      "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-sm font-medium",
                      type === 'arrival' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      type === 'departure' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-blue-50 text-blue-700 border border-blue-200"
                    )}>
                      {type === 'arrival' ? 'Arrivée' : type === 'departure' ? 'Départ' : 'En cours'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-[#1A1A1A]/50">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {b.booking_reference}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {b.check_in_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      {b.check_out_date}
                    </span>
                    {roomName !== '—' ? (
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        {roomName}
                        {roomType !== '—' && <span className="italic">({roomType})</span>}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600">
                        <BedDouble className="w-3 h-3" />
                        Aucune chambre
                      </span>
                    )}
                  </div>
                  {needsRoom && isAssigning && (
                    <div className="mt-2 flex gap-2 items-center">
                      <select
                        className="px-2 py-1 text-[10px] uppercase tracking-[0.1em] bg-white border border-[#1A1A1A]/10 text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50"
                        onChange={e => {
                          if (e.target.value) {
                            handleQuickAssign(b.id, e.target.value);
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Choisir une chambre...</option>
                        {availableRooms?.map(r => (
                          <option key={r.id} value={r.id}>{r.name} ({r.room_types?.name ?? 'Standard'})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setAssigningRoom(null)}
                        className="text-[9px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-serif font-bold text-[#1A1A1A]">{formatCents(b.total_amount_cents)}</p>
                <span className="inline-block w-2 h-2 rounded-full mt-1" style={{ backgroundColor: colorClass }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col border-l border-[#1A1A1A]/5">
            {type === 'arrival' && (
              <>
                <button
                  onClick={() => setCheckInBookingId(b.id)}
                  className="flex-1 px-4 py-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Arrivée
                </button>
                {needsRoom && (
                  <button
                    onClick={() => setAssigningRoom(isAssigning ? null : b.id)}
                    className="flex-1 px-4 py-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-purple-700 hover:bg-purple-50 transition-colors border-t border-[#1A1A1A]/5"
                  >
                    <BedDouble className="w-3.5 h-3.5" />
                    {isAssigning ? 'Fermer' : 'Assigner'}
                  </button>
                )}
              </>
            )}
            {type === 'in_house' && (
              <button
                onClick={() => setCheckOutBookingId(b.id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Départ
              </button>
            )}
            {type === 'departure' && (
              <button
                onClick={() => setCheckOutBookingId(b.id)}
                className="flex-1 px-4 py-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-700 hover:bg-amber-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Départ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif text-[#1A1A1A]">Réception</h1>
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/20" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher un client ou une réservation..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
        />
      </div>

      <div className="flex gap-3">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-3 px-5 py-3 border transition-all rounded-sm flex-1",
              activeTab === tab.key
                ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                : "border-[#1A1A1A]/10 bg-white text-[#1A1A1A]/60 hover:border-[#1A1A1A]/30"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.key ? "text-white" : tab.color.split(' ')[0])} />
            <div className="text-left">
              <p className={cn(
                "text-[9px] uppercase tracking-[0.2em] font-semibold",
                activeTab === tab.key ? "text-white/60" : "text-[#1A1A1A]/40"
              )}>
                {tab.label}
              </p>
              <p className={cn(
                "text-lg font-serif mt-0.5",
                activeTab === tab.key ? "text-white" : "text-[#1A1A1A]"
              )}>
                {tab.count}
              </p>
            </div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#1A1A1A]/10 rounded-sm p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1A1A1A]/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="w-40 h-4 bg-[#1A1A1A]/5 animate-pulse" />
                  <div className="w-64 h-3 bg-[#1A1A1A]/5 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === 'arrivals' && (
            filteredArrivals.length === 0
              ? <EmptyState icon={LogIn} text={searchQuery ? "Aucune arrivée trouvée" : "Aucune arrivée prévue aujourd'hui"} />
              : filteredArrivals.map(b => renderCard(b, 'arrival'))
          )}
          {activeTab === 'in_house' && (
            filteredInHouse.length === 0
              ? <EmptyState icon={BedDouble} text={searchQuery ? "Aucun séjour trouvé" : "Aucun client en cours de séjour"} />
              : filteredInHouse.map(b => renderCard(b, 'in_house'))
          )}
          {activeTab === 'departures' && (
            filteredDepartures.length === 0
              ? <EmptyState icon={LogOut} text={searchQuery ? "Aucun départ trouvé" : "Aucun départ prévu aujourd'hui"} />
              : filteredDepartures.map(b => renderCard(b, 'departure'))
          )}
        </div>
      )}

      {checkInBookingId && (
        <CheckInModal
          bookingId={checkInBookingId}
          onClose={() => setCheckInBookingId(null)}
        />
      )}

      {checkOutBookingId && (
        <CheckOutModal
          bookingId={checkOutBookingId}
          onClose={() => setCheckOutBookingId(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 rounded-sm">
      <Icon className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
      <p className="text-sm text-[#1A1A1A]/40">{text}</p>
    </div>
  );
}
