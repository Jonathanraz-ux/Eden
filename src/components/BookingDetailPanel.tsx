import { useState } from 'react';
import { X, Loader2, CheckCircle2, XCircle, Clock, User, Bed, CreditCard, History } from 'lucide-react';
import { useBooking, useUpdateBookingStatus, useBookingRooms, useBookingGuests, useBookingStatusHistory } from '../lib/hooks/useBookings';
import { useBookingPayments } from '../lib/hooks/usePayments';
import { triggerToast } from './Toast';
import { cn, formatCents, formatDate } from '../lib/utils';
import { BOOKING_STATUS_COLORS as statusColors, BOOKING_STATUS_TRANSITIONS } from '../lib/constants';

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  checked_in: 'En cours',
  checked_out: 'En cours de départ',
  completed: 'Terminée',
  cancelled: 'Annulée',
  no_show: 'No Show',
  expired: 'Expirée',
};

interface BookingDetailPanelProps {
  bookingId: string | null;
  onClose: () => void;
}

export function BookingDetailPanel({ bookingId, onClose }: BookingDetailPanelProps) {
  const { data: booking, isLoading } = useBooking(bookingId ?? '');
  const { data: rooms } = useBookingRooms(bookingId ?? '');
  const { data: guests } = useBookingGuests(bookingId ?? '');
  const { data: payments } = useBookingPayments(bookingId ?? '');
  const updateStatus = useUpdateBookingStatus();
  const [statusChanging, setStatusChanging] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);

  if (!bookingId) return null;

  const nextStatuses = BOOKING_STATUS_TRANSITIONS[booking?.status ?? ''] ?? [];

  const handleStatusChange = async (newStatus: string) => {
    if (!booking) return;
    setStatusChanging(true);
    try {
      await updateStatus.mutateAsync({
        id: booking.id,
        status: newStatus as any,
        reason: newStatus === 'cancelled' ? cancellationReason : undefined,
      });
      triggerToast(`Statut mis à jour : ${statusLabels[newStatus]}`);
      setShowCancelInput(false);
      setCancellationReason('');
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setStatusChanging(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1A1A1A]/5">
          <div>
            <h3 className="text-base font-serif text-[#1A1A1A]">Détail de la Réservation</h3>
            {booking && (
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
                {booking.booking_reference}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/20" />
          </div>
        ) : booking ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className={cn(
                "inline-block px-3 py-1.5 text-[9px] uppercase tracking-wider font-semibold border rounded-full",
                statusColors[booking.status]
              )}>
                {statusLabels[booking.status]}
              </span>
              <span className="text-xs text-[#1A1A1A]/40">
                Créée le {formatDate(booking.created_at)}
              </span>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAF9F6] border border-[#1A1A1A]/5">
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Arrivée</p>
                <p className="text-sm font-medium text-[#1A1A1A]">{formatDate(booking.check_in_date)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Départ</p>
                <p className="text-sm font-medium text-[#1A1A1A]">{formatDate(booking.check_out_date)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Nuits</p>
                <p className="text-sm font-medium text-[#1A1A1A]">{booking.night_count}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Source</p>
                <p className="text-sm font-medium text-[#1A1A1A] capitalize">{booking.source ?? 'N/A'}</p>
              </div>
            </div>

            {/* Financial */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                <CreditCard className="w-3 h-3" /> Finances
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Total</p>
                  <p className="text-sm font-serif font-bold text-[#1A1A1A]">{formatCents(booking.total_amount_cents)}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200/40 text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-emerald-700/60 mb-1">Payé</p>
                  <p className="text-sm font-serif font-bold text-emerald-700">{formatCents(booking.paid_amount_cents)}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200/40 text-center">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-amber-700/60 mb-1">Solde</p>
                  <p className="text-sm font-serif font-bold text-amber-700">{formatCents(booking.balance_cents)}</p>
                </div>
              </div>
            </div>

            {/* Rooms */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                <Bed className="w-3 h-3" /> Chambres ({rooms?.length ?? 0})
              </h4>
              {rooms && rooms.length > 0 ? (
                <div className="space-y-2">
                  {rooms.map((br) => (
                    <div key={br.id} className="flex items-center justify-between px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{br.room_name ?? 'Chambre'}</p>
                        <p className="text-[10px] text-[#1A1A1A]/40">
                          {formatDate(br.check_in_date)} → {formatDate(br.check_out_date)}
                          {br.adult_count ? ` · ${br.adult_count} adultes` : ''}
                          {br.child_count ? `, ${br.child_count} enfants` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-serif text-[#1A1A1A]">{formatCents(br.applied_price_cents)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#1A1A1A]/40">Aucune chambre assignée</p>
              )}
            </div>

            {/* Guests */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                <User className="w-3 h-3" /> Clients ({guests?.length ?? 0})
              </h4>
              {guests && guests.length > 0 ? (
                <div className="space-y-2">
                  {guests.map((bg) => (
                    <div key={bg.id} className="flex items-center justify-between px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{bg.guest_name ?? 'Client'}</p>
                        <p className="text-[10px] text-[#1A1A1A]/40 capitalize">{bg.role.replace('_', ' ')}</p>
                      </div>
                      {bg.is_payer && (
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600">Payeur</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#1A1A1A]/40">Aucun client assigné</p>
              )}
            </div>

            {/* Payments */}
            {payments && payments.length > 0 && (
              <div>
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Paiements ({payments.length})
                </h4>
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A] capitalize">{p.method} — {p.type.replace('_', ' ')}</p>
                        <p className="text-[10px] text-[#1A1A1A]/40">
                          {p.status === 'success' ? 'Réussi' : p.status}
                          {p.processed_at ? ` · ${formatDate(p.processed_at)}` : ''}
                        </p>
                      </div>
                      <span className="text-xs font-serif text-[#1A1A1A]">{formatCents(p.amount_cents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status History */}
            <div>
              <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-3 flex items-center gap-2">
                <History className="w-3 h-3" /> Historique des statuts
              </h4>
              <BookingStatusHistory bookingId={bookingId} />
            </div>

            {/* Notes */}
            {booking.special_requests && (
              <div>
                <h4 className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-2">Demandes spéciales</h4>
                <p className="text-sm text-[#1A1A1A]/70 bg-[#FAF9F6] px-4 py-3 border border-[#1A1A1A]/5">
                  {booking.special_requests}
                </p>
              </div>
            )}

            {/* Status Actions */}
            <div className="pt-4 border-t border-[#1A1A1A]/5 space-y-3">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Actions</p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      if (status === 'cancelled') {
                        setShowCancelInput(true);
                      } else {
                        handleStatusChange(status);
                      }
                    }}
                    disabled={statusChanging}
                    className="px-4 py-2 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/70 hover:bg-[#FAF9F6] transition-colors disabled:opacity-40"
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
              {showCancelInput && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Motif d'annulation..."
                    className="flex-1 px-3 py-2 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50"
                  />
                  <button
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={statusChanging || !cancellationReason.trim()}
                    className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 text-[10px] uppercase tracking-[0.15em] font-semibold hover:bg-red-100 transition-colors disabled:opacity-40"
                  >
                    {statusChanging ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmer'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-[#1A1A1A]/40">Réservation introuvable</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.25s ease-out;
        }
      `}</style>
    </>
  );
}

function BookingStatusHistory({ bookingId }: { bookingId: string }) {
  const { data: history, isLoading } = useBookingStatusHistory(bookingId);

  if (isLoading) {
    return <p className="text-xs text-[#1A1A1A]/40">Chargement...</p>;
  }

  if (!history || history.length === 0) {
    return <p className="text-xs text-[#1A1A1A]/40">Aucun historique</p>;
  }

  return (
    <div className="space-y-2">
      {history.map((h) => (
        <div key={h.id} className="flex items-start gap-3 px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
          <div className="mt-0.5">
            {h.new_status === 'cancelled' ? (
              <XCircle className="w-4 h-4 text-red-400" />
            ) : h.new_status === 'confirmed' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Clock className="w-4 h-4 text-[#1A1A1A]/30" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#1A1A1A] capitalize">
              {h.previous_status ?? 'Nouveau'} → {h.new_status}
            </p>
            <p className="text-[10px] text-[#1A1A1A]/40">
              {new Date(h.created_at).toLocaleString('fr-FR')}
              {h.reason ? ` · ${h.reason}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
