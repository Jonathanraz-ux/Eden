import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { useCreatePayment } from '../lib/hooks/usePayments';
import { useBookings } from '../lib/hooks/useBookings';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';

const paymentSchema = z.object({
  booking_id: z.string().min(1),
  amount_euros: z.coerce.number().min(0.01),
  method: z.enum(['card', 'cash', 'transfer', 'mobile_money', 'check', 'crypto']),
  type: z.enum(['deposit', 'balance', 'deposit_guarantee', 'supplement', 'credit_note']),
  notes: z.string().optional(),
});

interface PaymentFormModalProps {
  open: boolean;
  onClose: () => void;
  preselectedBookingId?: string;
}

export function PaymentFormModal({ open, onClose, preselectedBookingId }: PaymentFormModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: bookings } = useBookings(hotelId ?? '');
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { booking_id: preselectedBookingId ?? '', method: 'card', type: 'balance', notes: '' },
  });

  if (!open) return null;

  const onSubmit = async (data: any) => {
    if (!hotelId) return;
    try {
      await createPayment.mutateAsync({
        booking_id: data.booking_id,
        hotel_id: hotelId,
        employee_id: null,
        guest_id: null,
        amount_cents: Math.round(Number(data.amount_euros) * 100),
        currency_code: 'EUR',
        method: data.method,
        type: data.type,
        status: 'success',
        external_reference: null,
        notes: data.notes || null,
        processed_at: new Date().toISOString(),
      } as any);

      triggerToast('Paiement enregistré');
      reset();
      onClose();
    } catch (err) {
      console.error('Erreur paiement:', err);
    }
  };

  const selectedBooking = watch('booking_id');
  const matchingBooking = bookings?.find(b => b.id === selectedBooking);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Nouveau Paiement</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              Enregistrer un paiement
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
          {!preselectedBookingId && (
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Réservation</label>
              <select {...register('booking_id')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                <option value="">Sélectionner une réservation</option>
                {bookings?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_reference} — {(b.total_amount_cents / 100).toFixed(2)}€
                  </option>
                ))}
              </select>
              {errors.booking_id && <p className="mt-1 text-[10px] text-red-500">{errors.booking_id.message as any}</p>}
            </div>
          )}

          {matchingBooking && (
            <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-xs text-[#1A1A1A]/60">
              <p>Réservation : <strong className="text-[#1A1A1A]">{matchingBooking.booking_reference}</strong></p>
              <p>Total : {(matchingBooking.total_amount_cents / 100).toFixed(2)} € · Solde : {(matchingBooking.balance_cents / 100).toFixed(2)} €</p>
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Montant (€)</label>
            <input type="number" min="0" step="0.01" {...register('amount_euros')} placeholder="0.00" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            {errors.amount_euros && <p className="mt-1 text-[10px] text-red-500">{errors.amount_euros.message as any}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Méthode</label>
              <select {...register('method')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                <option value="card">Carte</option>
                <option value="cash">Espèces</option>
                <option value="transfer">Virement</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="check">Chèque</option>
                <option value="crypto">Cryptomonnaie</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Type</label>
              <select {...register('type')} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                <option value="deposit">Acompte</option>
                <option value="balance">Solde</option>
                <option value="deposit_guarantee">Caution</option>
                <option value="supplement">Supplément</option>
                <option value="credit_note">Avoir</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Notes (optionnel)</label>
            <input type="text" {...register('notes')} placeholder="Référence, remarque..." className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>

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
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le Paiement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
