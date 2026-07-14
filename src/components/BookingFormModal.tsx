import { useState, useEffect } from 'react';
import { useForm, useController } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useCreateBooking, useAddBookingRoom, useAddBookingGuest } from '../lib/hooks/useBookings';
import { useRatePlans } from '../lib/hooks/usePricing';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRooms } from '../lib/hooks/useRooms';
import { useSearchGuests, useCreateGuest } from '../lib/hooks/useGuests';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';

const bookingSchema = z.object({
  guest_id: z.string().min(1),
  room_id: z.string().min(1),
  rate_plan_id: z.string().min(1),
  check_in_date: z.string().min(1),
  check_out_date: z.string().min(1),
  adult_count: z.coerce.number().min(1),
  child_count: z.coerce.number().min(0),
  amount_euros: z.coerce.number().min(1),
});

interface BookingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BookingFormModal({ open, onClose, onSuccess }: BookingFormModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: rooms } = useRooms(hotelId ?? '');
  const { data: ratePlans, isLoading: ratePlansLoading, error: ratePlansError } = useRatePlans(hotelId ?? '');
  const [guestSearch, setGuestSearch] = useState('');
  const {
    data: guestResults,
    isLoading: guestSearchLoading,
    error: guestSearchError,
  } = useSearchGuests(hotelId ?? '', guestSearch);
  const [selectedGuest, setSelectedGuest] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBooking = useCreateBooking();
  const addBookingRoom = useAddBookingRoom();
  const addBookingGuest = useAddBookingGuest();
  const createGuest = useCreateGuest();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: { guest_id: '', child_count: 0, adult_count: 1, amount_euros: '' },
  });

  const { field: guestField } = useController({ name: 'guest_id', control });

  // DEBUG: log all field values and errors at validation time
  const onValidationError = (validationErrors: any) => {
    const allValues = getValues();
    console.log('=== DEBUG VALIDATION ERROR ===');
    console.log('ALL FORM VALUES:', JSON.stringify(allValues, null, 2));
    console.log('ALL ERRORS:', JSON.stringify(validationErrors, null, 2));
    console.log('guest_id value:', JSON.stringify(allValues.guest_id));
    console.log('guest_id type:', typeof allValues.guest_id);
    console.log('selectedGuest state:', JSON.stringify(selectedGuest));
    console.log('==============================');
  };

  const checkIn = watch('check_in_date');
  const checkOut = watch('check_out_date');
  const selectedRoomId = watch('room_id');
  const amountValue = watch('amount_euros');
  const selectedRoom = rooms?.find(r => r.id === selectedRoomId);
  const [autoCalculated, setAutoCalculated] = useState(true);

  useEffect(() => {
    if (checkIn && checkOut && selectedRoom && autoCalculated) {
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      const nights = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / 86400000));
      if (nights > 0) {
        const roomTypePrice = (selectedRoom as any).room_types?.base_price_cents ?? 0;
        const adjustment = selectedRoom.price_adjustment_cents ?? 0;
        const totalCents = (roomTypePrice + adjustment) * nights;
        setValue('amount_euros', String(totalCents / 100));
      }
    }
  }, [checkIn, checkOut, selectedRoom, setValue, autoCalculated]);

  // When user manually edits amount, stop auto-calculating
  useEffect(() => {
    if (amountValue && !autoCalculated) return;
    if (amountValue === '') setAutoCalculated(true);
  }, [amountValue, autoCalculated]);

  if (!open) return null;

  const onSubmit = async (data: any) => {
    if (!hotelId) return;
    console.log('FORM VALUES', JSON.stringify({ ...data, guest_id: data.guest_id }));
    setIsSubmitting(true);
    try {
      const inDate = new Date(data.check_in_date);
      const outDate = new Date(data.check_out_date);
      const nights = Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / 86400000));
      const totalCents = Math.round(Number(data.amount_euros) * 100);

      const pricePerNight = Math.round(totalCents / nights);

      const booking = await createBooking.mutateAsync({
        hotel_id: hotelId,
        rate_plan_id: data.rate_plan_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        night_count: nights,
        status: 'pending',
        total_amount_cents: totalCents,
        paid_amount_cents: 0,
        balance_cents: totalCents,
        currency_code: 'EUR',
        source: 'frontdesk',
        special_requests: null,
        internal_notes: null,
        booking_reference: '',
        confirmed_at: null,
        cancelled_at: null,
        cancellation_reason: null,
      } as any);

      await addBookingRoom.mutateAsync({
        booking_id: booking.id,
        room_id: data.room_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        night_count: nights,
        adult_count: Number(data.adult_count),
        child_count: Number(data.child_count) || 0,
        applied_price_cents: pricePerNight,
        status: 'reserved',
      } as any);

      await addBookingGuest.mutateAsync({
        booking_id: booking.id,
        guest_id: data.guest_id,
        role: 'primary_guest',
        is_payer: true,
        is_main_contact: true,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
      } as any);

      triggerToast('Réservation créée avec succès');
      reset();
      setSelectedGuest(null);
      setGuestSearch('');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur création réservation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRooms = rooms?.filter(r => r.status === 'available') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Nouvelle Réservation</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              Informations du séjour
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Client
            </label>
            {!selectedGuest ? (
              <div>
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                />
                {guestResults && guestResults.length > 0 && (
                  <div className="mt-1 border border-[#1A1A1A]/10 bg-white max-h-40 overflow-y-auto">
                    {guestResults.map((g) => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => {
                          setSelectedGuest({ id: g.id, name: `${g.first_name ?? ''} ${g.last_name}` });
                          setValue('guest_id', g.id);
                          setGuestSearch('');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FAF9F6] transition-colors"
                      >
                        {g.first_name} {g.last_name}
                        {g.email ? ` — ${g.email}` : ''}
                      </button>
                    ))}
                  </div>
                )}
                {guestSearch.length >= 2 && !guestSearchLoading && !guestSearchError && (!guestResults || guestResults.length === 0) && (
                  <button
                    type="button"
                    onClick={async () => {
                      const trimmed = guestSearch.trim();
                      if (!trimmed || !hotelId) return;
                      const parts = trimmed.split(/\s+/);
                      const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
                      const lastName = parts.length > 1 ? parts[parts.length - 1] : trimmed;
                      try {
                        const newGuest = await createGuest.mutateAsync({
                          hotel_id: hotelId,
                          first_name: firstName,
                          last_name: lastName,
                          email: null,
                          phone: null,
                          type: 'individual',
                        } as any);
                        setSelectedGuest({ id: newGuest.id, name: `${newGuest.first_name ?? ''} ${newGuest.last_name}` });
                        setValue('guest_id', newGuest.id);
                        setGuestSearch('');
                      } catch (e) {
                        console.error('Erreur création client:', e);
                      }
                    }}
                    className="w-full text-left px-4 py-2.5 mt-1 text-sm text-[#C5A059] hover:bg-[#FAF9F6] border border-dashed border-[#C5A059]/30 transition-colors"
                  >
                    + Créer le client « {guestSearch.trim()} »
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10">
                <span className="text-sm text-[#1A1A1A]">{selectedGuest.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGuest(null);
                    setValue('guest_id', '');
                  }}
                  className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 hover:text-[#1A1A1A]"
                >
                  Changer
                </button>
              </div>
            )}
            <input type="hidden" {...guestField} />
            {errors.guest_id && <p className="mt-1 text-[10px] text-red-500">{errors.guest_id.message as any}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Arrivée</label>
              <input type="date" {...register('check_in_date')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors [color-scheme:light]" />
              {errors.check_in_date && <p className="mt-1 text-[10px] text-red-500">{errors.check_in_date.message as any}</p>}
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Départ</label>
              <input type="date" {...register('check_out_date')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors [color-scheme:light]" />
              {errors.check_out_date && <p className="mt-1 text-[10px] text-red-500">{errors.check_out_date.message as any}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Chambre</label>
              <select {...register('room_id')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                <option value="">Sélectionner une chambre</option>
                {availableRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — {(room as any).room_types?.name ?? ''}
                  </option>
                ))}
                {availableRooms.length === 0 && <option value="" disabled>Aucune chambre disponible</option>}
              </select>
              {errors.room_id && <p className="mt-1 text-[10px] text-red-500">{errors.room_id.message as any}</p>}
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Tarif</label>
              <select {...register('rate_plan_id')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                <option value="">
                  {ratePlansLoading ? 'Chargement...' : ratePlansError ? 'Erreur de chargement' : !ratePlans?.length ? 'Aucun tarif disponible' : 'Sélectionner un tarif'}
                </option>
                {ratePlans?.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              {errors.rate_plan_id && <p className="mt-1 text-[10px] text-red-500">{errors.rate_plan_id.message as any}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Adultes</label>
              <input type="number" min="1" {...register('adult_count')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
              {errors.adult_count && <p className="mt-1 text-[10px] text-red-500">{errors.adult_count.message as any}</p>}
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Enfants</label>
              <input type="number" min="0" {...register('child_count')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Montant (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('amount_euros')}
                onFocus={() => setAutoCalculated(false)}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
              {errors.amount_euros && <p className="mt-1 text-[10px] text-red-500">{errors.amount_euros.message as any}</p>}
            </div>
          </div>

          {selectedRoom && checkIn && checkOut && (
            <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-xs text-[#1A1A1A]/60 grid grid-cols-2 gap-2">
              <p>Chambre : <strong className="text-[#1A1A1A]">{selectedRoom.name}</strong></p>
              <p>Du {new Date(checkIn).toLocaleDateString('fr-FR')} au {new Date(checkOut).toLocaleDateString('fr-FR')}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/5">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all">
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2",
                !isSubmitting ? "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer" : "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
              )}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isSubmitting ? 'Création...' : 'Confirmer la Réservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
