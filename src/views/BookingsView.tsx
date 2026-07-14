import { useState, useMemo } from 'react';
import { Search, Plus, MoreHorizontal } from 'lucide-react';
import { cn, formatCents, formatDate } from '../lib/utils';
import { BOOKING_STATUS_LABELS as statusLabels, BOOKING_STATUS_COLORS as statusColors } from '../lib/constants';
import { Skeleton } from '../components/Skeleton';
import { BookingFormModal } from '../components/BookingFormModal';
import { BookingDetailPanel } from '../components/BookingDetailPanel';
import { useBookings, useUpdateBookingStatus } from '../lib/hooks/useBookings';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from '../components/Toast';
import type { BookingStatus } from '../lib/types/database';

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'checked_in', label: 'En cours' },
  { value: 'checked_out', label: 'Départ' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
] as const;

function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-[#1A1A1A]/5">
          <td className="px-6 py-4"><Skeleton className="w-28 h-3" /></td>
          <td className="px-6 py-4"><Skeleton className="w-32 h-3" /></td>
          <td className="px-6 py-4"><Skeleton className="w-24 h-3" /></td>
          <td className="px-6 py-4"><Skeleton className="w-24 h-3" /></td>
          <td className="px-6 py-4"><Skeleton className="w-20 h-4" /></td>
          <td className="px-6 py-4"><Skeleton className="w-20 h-3 ml-auto" /></td>
          <td className="px-6 py-4"><Skeleton className="w-5 h-5" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export function BookingsView() {
  const hotelId = useCurrentHotelId();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const { data: bookings, isLoading } = useBookings(hotelId ?? '', {
    status: (statusFilter || undefined) as BookingStatus | undefined,
  });

  const updateStatus = useUpdateBookingStatus();

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (!search) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b) =>
      b.booking_reference?.toLowerCase().includes(q) ||
      b.special_requests?.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: bookingId, status: newStatus as BookingStatus });
      triggerToast(`Statut mis à jour`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Gestion des Réservations</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {isLoading ? 'Chargement...' : `${filtered.length} réservation${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouvelle Réservation
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A] opacity-30 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par référence..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#C5A059]/50 transition-colors rounded-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors rounded-sm appearance-none cursor-pointer min-w-[160px]"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-[#1A1A1A]/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1A1A1A]/5 bg-[#FAF9F6]">
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Référence</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Chambres</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Arrivée</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Départ</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Statut</th>
                <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 text-right">Montant</th>
                <th className="px-6 py-4 w-12" />
              </tr>
            </thead>
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
                        Aucune réservation trouvée
                      </p>
                    </td>
                  </tr>
                )}
                {filtered.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[#1A1A1A]/5 hover:bg-[#FAF9F6]/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBookingId(booking.id)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#1A1A1A]">{booking.booking_reference}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">
                      {booking.night_count} nuit{booking.night_count > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{formatDate(booking.check_in_date)}</td>
                    <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{formatDate(booking.check_out_date)}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full",
                        statusColors[booking.status]
                      )}>
                        {statusLabels[booking.status] ?? booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-serif text-[#1A1A1A] text-right">
                      {formatCents(booking.total_amount_cents)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingId(booking.id);
                        }}
                        className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/70 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
        {!isLoading && bookings && (
          <div className="px-6 py-4 border-t border-[#1A1A1A]/5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">
              {filtered.length} sur {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <BookingFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {}}
      />

      <BookingDetailPanel
        bookingId={selectedBookingId}
        onClose={() => setSelectedBookingId(null)}
      />
    </div>
  );
}
