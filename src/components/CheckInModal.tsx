import { useState, useEffect } from 'react';
import { X, Loader2, Check, Building2, Users, CreditCard } from 'lucide-react';
import { useBooking, useBookingRooms, useBookingGuests, useAddBookingRoom, useUpdateBookingRoom, useUpdateBookingStatus } from '../lib/hooks/useBookings';
import { useRooms, useUpdateRoomStatus, useRoomTypes } from '../lib/hooks/useRooms';
import { useCreatePayment } from '../lib/hooks/usePayments';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn, formatCents } from '../lib/utils';
import { BOOKING_STATUS_COLORS } from '../lib/constants';

interface CheckInModalProps {
  bookingId: string;
  onClose: () => void;
}

export function CheckInModal({ bookingId, onClose }: CheckInModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: booking, isLoading: loadingBooking } = useBooking(bookingId);
  const { data: bookingRooms } = useBookingRooms(bookingId);
  const { data: bookingGuests } = useBookingGuests(bookingId);
  const roomTypes = useRoomTypes(hotelId ?? '');
  const { data: availableRooms } = useRooms(hotelId ?? '', 'available');
  const addBookingRoom = useAddBookingRoom();
  const updateBookingRoom = useUpdateBookingRoom();
  const updateRoomStatus = useUpdateRoomStatus();
  const updateBookingStatus = useUpdateBookingStatus();
  const createPayment = useCreatePayment();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [collectDeposit, setCollectDeposit] = useState(false);
  const [step, setStep] = useState<'rooms' | 'guests' | 'deposit' | 'confirm'>('rooms');
  const [saving, setSaving] = useState(false);

  const existingRoom = bookingRooms?.[0];
  const existingRoomId = existingRoom?.room_id;
  const isRoomAssigned = Boolean(existingRoomId);

  const matchingAvailableRooms = availableRooms?.filter(r => r.status === 'available' && (
    !bookingRooms?.[0]?.room_id || r.id !== bookingRooms[0].room_id
  )) ?? [];

  useEffect(() => {
    if (existingRoomId) {
      setSelectedRoomId(existingRoomId);
    }
  }, [existingRoomId]);

  if (!booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-lg bg-white shadow-xl p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
        </div>
      </div>
    );
  }

  const statusColor = BOOKING_STATUS_COLORS[booking.status] ?? '#1A1A1A';
  const primaryGuest = bookingGuests?.[0]?.guest_name ?? '—';

  const handleConfirm = async () => {
    if (!hotelId) return;
    setSaving(true);

    try {
      if (!existingRoomId && selectedRoomId) {
        await addBookingRoom.mutateAsync({
          booking_id: bookingId,
          room_id: selectedRoomId,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          night_count: booking.night_count,
          adult_count: 1,
          child_count: 0,
          applied_price_cents: Math.round(booking.total_amount_cents / booking.night_count),
          status: 'occupied',
        } as any);
        await updateRoomStatus.mutateAsync({ id: selectedRoomId, status: 'occupied' });
      }

      await updateBookingStatus.mutateAsync({ id: bookingId, status: 'checked_in' });

      if (collectDeposit && depositAmount) {
        await createPayment.mutateAsync({
          booking_id: bookingId,
          hotel_id: hotelId,
          employee_id: null,
          guest_id: null,
          amount_cents: Math.round(Number(depositAmount) * 100),
          currency_code: 'EUR',
          method: 'card',
          type: 'deposit',
          status: 'success',
          external_reference: null,
          notes: 'Acompte à l\'arrivée',
          processed_at: new Date().toISOString(),
        } as any);
      }

      triggerToast('Enregistrement confirmé');
      onClose();
    } catch (err) {
      console.error('Erreur check-in:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Enregistrement Arrivée</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              {booking.booking_reference}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="flex items-center justify-between px-5 py-4 bg-[#FAF9F6] border border-[#1A1A1A]/5">
            <div className="space-y-1">
              <p className="text-xs text-[#1A1A1A]/60">Client</p>
              <p className="text-sm font-medium text-[#1A1A1A]">{primaryGuest}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-[#1A1A1A]/60">Montant Total</p>
              <p className="text-sm font-serif font-bold text-[#1A1A1A]">{formatCents(booking.total_amount_cents)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['rooms', 'guests', 'deposit', 'confirm'] as const).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-semibold transition-all rounded-sm",
                  step === s
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-[#FAF9F6] text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 border border-[#1A1A1A]/10"
                )}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border-current border">
                  {i + 1}
                </span>
                {s === 'rooms' ? 'Chambre' : s === 'guests' ? 'Clients' : s === 'deposit' ? 'Acompte' : 'Confirmer'}
              </button>
            ))}
          </div>

          {step === 'rooms' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
                <Building2 className="w-3.5 h-3.5" />
                Sélection de la Chambre
              </div>

              {isRoomAssigned ? (
                <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                  Chambre déjà attribuée : {bookingRooms?.[0]?.room_name ?? 'Chambre #' + existingRoomId}
                </div>
              ) : matchingAvailableRooms.length === 0 ? (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  Aucune chambre disponible actuellement.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {matchingAvailableRooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 border text-left transition-all rounded-sm",
                        selectedRoomId === room.id
                          ? "border-[#C5A059] bg-[#C5A059]/5"
                          : "border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                        selectedRoomId === room.id ? "border-[#C5A059] bg-[#C5A059] text-white" : "border-[#1A1A1A]/20"
                      )}>
                        {selectedRoomId === room.id && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{room.name}</p>
                        <p className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40 mt-0.5">
                          {room.room_types?.name ?? 'Standard'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'guests' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
                <Users className="w-3.5 h-3.5" />
                Clients Associés
              </div>
              {bookingGuests && bookingGuests.length > 0 ? (
                <div className="divide-y border border-[#1A1A1A]/10">
                  {bookingGuests.map((bg, i) => (
                    <div key={bg.id ?? i} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center text-xs font-serif text-[#1A1A1A]/60">
                          {(bg.guest_name?.charAt(0) ?? '?')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{bg.guest_name ?? 'Client'}</p>
                          <p className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40">{bg.role}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-medium",
                        bg.is_payer ? "bg-[#C5A059]/10 text-[#C5A059]" : "bg-[#1A1A1A]/5 text-[#1A1A1A]/40"
                      )}>
                        {bg.is_payer ? 'Payeur' : 'Occupant'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-xs text-[#1A1A1A]/40">
                  Aucun client enregistré
                </div>
              )}
            </div>
          )}

          {step === 'deposit' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
                <CreditCard className="w-3.5 h-3.5" />
                Acompte / Caution
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectDeposit}
                  onChange={e => setCollectDeposit(e.target.checked)}
                  className="accent-[#C5A059]"
                />
                <span className="text-sm text-[#1A1A1A]">Percevoir un acompte à l'arrivée</span>
              </label>
              {collectDeposit && (
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Montant (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
                Résumé de l'enregistrement
              </div>
              <div className="px-5 py-4 bg-[#FAF9F6] border border-[#1A1A1A]/5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Réservation</span>
                  <span className="font-medium">{booking.booking_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Client</span>
                  <span className="font-medium">{primaryGuest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Arrivée / Départ</span>
                  <span className="font-medium">{booking.check_in_date} → {booking.check_out_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Nuits</span>
                  <span className="font-medium">{booking.night_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#1A1A1A]/60">Total</span>
                  <span className="font-serif font-bold">{formatCents(booking.total_amount_cents)}</span>
                </div>
                {selectedRoomId && (
                  <div className="flex justify-between">
                    <span className="text-[#1A1A1A]/60">Chambre</span>
                    <span className="font-medium">{availableRooms?.find(r => r.id === selectedRoomId)?.name ?? '—'}</span>
                  </div>
                )}
                {collectDeposit && depositAmount && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Acompte</span>
                    <span className="font-medium">{Number(depositAmount).toFixed(2)} €</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <div className="flex items-center gap-2 text-[10px] text-[#1A1A1A]/40">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            {booking.status}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-white transition-all">
              Annuler
            </button>
            {step === 'confirm' && (
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Confirmer l\'Arrivée'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
