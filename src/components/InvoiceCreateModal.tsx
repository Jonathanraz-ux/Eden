import { useState } from 'react';
import { X, Loader2, FileText, Search } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useGenerateInvoiceFromBooking } from '../lib/hooks/usePayments';
import { useBookings } from '../lib/hooks/useBookings';
import { triggerToast } from './Toast';
import { cn, formatCents } from '../lib/utils';

interface InvoiceCreateModalProps {
  onClose: () => void;
}

export function InvoiceCreateModal({ onClose }: InvoiceCreateModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: bookings } = useBookings(hotelId ?? '');
  const generateInvoice = useGenerateInvoiceFromBooking();
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);

  const filtered = (bookings ?? []).filter(b =>
    !search || b.booking_reference.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const handleGenerate = async (bookingId: string) => {
    if (!hotelId) return;
    setGenerating(bookingId);
    try {
      await generateInvoice.mutateAsync({ bookingId, hotelId });
      triggerToast('Facture créée avec succès');
      onClose();
    } catch (err) {
      console.error(err);
      triggerToast('Erreur lors de la création');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FAF9F6]"><FileText className="w-5 h-5 text-[#C5A059]" /></div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Nouvelle Facture</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-4 border-b border-[#1A1A1A]/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
            <input
              placeholder="Rechercher une réservation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors placeholder:text-[#1A1A1A]/30"
            />
          </div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-[#1A1A1A]/30 mt-3">
            Sélectionnez une réservation pour générer automatiquement la facture (nuitées + services)
          </p>
        </div>

        <div className="flex-1 overflow-auto px-8 py-4 space-y-2">
          {filtered.length === 0 && (
            <p className="text-center py-8 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">
              Aucune réservation trouvée
            </p>
          )}
          {filtered.map(booking => (
            <div key={booking.id} className="flex items-center justify-between p-4 border border-[#1A1A1A]/10 hover:border-[#C5A059]/30 transition-colors bg-[#FAF9F6]">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#1A1A1A]">{booking.booking_reference}</p>
                <p className="text-[10px] text-[#1A1A1A]/40 mt-0.5">
                  {booking.check_in_date} → {booking.check_out_date} · {formatCents(booking.total_amount_cents)}
                </p>
              </div>
              <button
                onClick={() => handleGenerate(booking.id)}
                disabled={generating === booking.id}
                className={cn(
                  "px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-semibold transition-all shrink-0 ml-4",
                  generating === booking.id
                    ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
                    : "bg-[#1A1A1A] text-white hover:bg-[#333]"
                )}
              >
                {generating === booking.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Générer'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <p className="text-[9px] text-[#1A1A1A]/30 text-center">
            La facture sera créée au statut <strong>Brouillon</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
