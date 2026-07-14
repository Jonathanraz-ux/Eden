import { useState } from 'react';
import { X, Loader2, FileText, CreditCard } from 'lucide-react';
import { useBooking, useBookingRooms, useUpdateBookingRoom, useUpdateBookingStatus } from '../lib/hooks/useBookings';
import { useBookingPayments, useCreatePayment, useGenerateInvoiceFromBooking } from '../lib/hooks/usePayments';
import { useUpdateRoomStatus } from '../lib/hooks/useRooms';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn, formatCents } from '../lib/utils';

interface CheckOutModalProps {
  bookingId: string;
  onClose: () => void;
}

export function CheckOutModal({ bookingId, onClose }: CheckOutModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: booking, isLoading } = useBooking(bookingId);
  const { data: payments } = useBookingPayments(bookingId);
  const { data: bookingRooms } = useBookingRooms(bookingId);
  const updateBookingRoom = useUpdateBookingRoom();
  const updateRoomStatus = useUpdateRoomStatus();
  const updateBookingStatus = useUpdateBookingStatus();
  const createPayment = useCreatePayment();
  const generateInvoice = useGenerateInvoiceFromBooking();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('card');
  const [generateInvoiceOnExit, setGenerateInvoiceOnExit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoiceGenerated, setInvoiceGenerated] = useState(false);

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

  const successfulPayments = payments?.filter(p => p.status === 'success') ?? [];
  const totalPaid = successfulPayments.reduce((sum, p) => sum + p.amount_cents, 0);
  const balance = booking.balance_cents ?? (booking.total_amount_cents - totalPaid);
  const hasBalance = balance > 0;

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoice.mutateAsync({ bookingId, hotelId });
      setInvoiceGenerated(true);
      triggerToast('Facture générée');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOut = async () => {
    if (!hotelId) return;
    setSaving(true);

    try {
      if (hasBalance && paymentAmount) {
        await createPayment.mutateAsync({
          booking_id: bookingId,
          hotel_id: hotelId,
          employee_id: null,
          guest_id: null,
          amount_cents: Math.round(Number(paymentAmount) * 100),
          currency_code: 'EUR',
          method: paymentMethod,
          type: 'balance',
          status: 'success',
          external_reference: null,
          notes: 'Règlement départ',
          processed_at: new Date().toISOString(),
        } as any);
      }

      if (generateInvoiceOnExit && !invoiceGenerated) {
        await handleGenerateInvoice();
      }

      await updateBookingStatus.mutateAsync({ id: bookingId, status: 'checked_out' });

      for (const br of bookingRooms ?? []) {
        if (br.id) {
          await updateBookingRoom.mutateAsync({ id: br.id, updates: { status: 'vacated' } });
        }
      }
      for (const br of bookingRooms ?? []) {
        if (br.room_id) {
          await updateRoomStatus.mutateAsync({ id: br.room_id, status: 'cleaning' });
        }
      }

      triggerToast('Départ enregistré');
      onClose();
    } catch (err) {
      console.error('Erreur check-out:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Départ Client</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              {booking.booking_reference}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-center">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Total</p>
              <p className="text-lg font-serif font-bold text-[#1A1A1A]">{formatCents(booking.total_amount_cents)}</p>
            </div>
            <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-center">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Payé</p>
              <p className="text-lg font-serif font-bold text-emerald-700">{formatCents(totalPaid)}</p>
            </div>
            <div className="px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5 text-center">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-1">Solde</p>
              <p className={cn("text-lg font-serif font-bold", hasBalance ? "text-amber-700" : "text-emerald-700")}>
                {hasBalance ? formatCents(balance) : '0 €'}
              </p>
            </div>
          </div>

          {payments && payments.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
                <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
                Paiements effectués
              </p>
              <div className="divide-y border border-[#1A1A1A]/10">
                {successfulPayments.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="text-[#1A1A1A]/60">{p.method} · {new Date(p.processed_at).toLocaleDateString('fr-FR')}</span>
                    <span className="font-medium text-[#1A1A1A]">{formatCents(p.amount_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasBalance && (
            <div className="space-y-4 px-5 py-4 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-amber-800">
                <CreditCard className="w-3.5 h-3.5" />
                Solde à régler
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-700/70 mb-2">Montant (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(e.target.value)}
                    placeholder={(balance / 100).toFixed(2)}
                    className="w-full px-4 py-2.5 bg-white border border-amber-300 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-amber-700/70 mb-2">Méthode</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-amber-300 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="card">Carte</option>
                    <option value="cash">Espèces</option>
                    <option value="transfer">Virement</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="check">Chèque</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50">
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />
              Facturation
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generateInvoiceOnExit}
                onChange={e => setGenerateInvoiceOnExit(e.target.checked)}
                className="accent-[#C5A059]"
              />
              <span className="text-sm text-[#1A1A1A]">Générer la facture au départ</span>
            </label>
            {generateInvoiceOnExit && !invoiceGenerated && (
              <button
                onClick={handleGenerateInvoice}
                disabled={generateInvoice.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all"
              >
                {generateInvoice.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                Générer maintenant
              </button>
            )}
            {invoiceGenerated && (
              <span className="text-[10px] text-emerald-600 font-medium">✓ Facture générée</span>
            )}
          </div>

          <div className="px-5 py-4 bg-[#FAF9F6] border border-[#1A1A1A]/5 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">Réservation</span>
              <span className="font-medium">{booking.booking_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">Arrivée / Départ</span>
              <span className="font-medium">{booking.check_in_date} → {booking.check_out_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">Nuits</span>
              <span className="font-medium">{booking.night_count}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-white transition-all">
            Annuler
          </button>
          <button
            onClick={handleCheckOut}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold bg-[#1A1A1A] text-white hover:bg-[#333] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Traitement...' : 'Confirmer le Départ'}
          </button>
        </div>
      </div>
    </div>
  );
}
