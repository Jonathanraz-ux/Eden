import { useState, useMemo } from 'react';
import { Search, Plus, FileText, CreditCard } from 'lucide-react';
import { cn, formatCents, formatDate } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { PaymentFormModal } from '../components/PaymentFormModal';
import { usePayments, useInvoices, useGenerateInvoiceFromBooking } from '../lib/hooks/usePayments';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from '../components/Toast';

const methodLabels: Record<string, string> = {
  card: 'Carte',
  cash: 'Espèces',
  transfer: 'Virement',
  mobile_money: 'Mobile Money',
  check: 'Chèque',
  crypto: 'Crypto',
};

const typeLabels: Record<string, string> = {
  deposit: 'Acompte',
  balance: 'Solde',
  deposit_guarantee: 'Caution',
  supplement: 'Supplément',
  refund: 'Remboursement',
  credit_note: 'Avoir',
};

const statusColors: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  failed: 'bg-red-50 text-red-700 border-red-200/60',
  refunded: 'bg-gray-50 text-gray-700 border-gray-200/60',
  partially_refunded: 'bg-blue-50 text-blue-700 border-blue-200/60',
};

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-600 border-gray-200/60',
  issued: 'bg-blue-50 text-blue-700 border-blue-200/60',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60',
  credit_note: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

export function PaymentsView() {
  const hotelId = useCurrentHotelId();
  const [tab, setTab] = useState<'payments' | 'invoices'>('payments');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: payments, isLoading: loadingPayments } = usePayments(hotelId ?? '');
  const { data: invoices, isLoading: loadingInvoices } = useInvoices(hotelId ?? '');
  const generateInvoice = useGenerateInvoiceFromBooking();

  const filteredPayments = useMemo(() => {
    if (!payments) return [];
    if (!search) return payments;
    const q = search.toLowerCase();
    return payments.filter(p =>
      p.method?.toLowerCase().includes(q) ||
      p.type?.toLowerCase().includes(q) ||
      p.notes?.toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totalCollected = useMemo(() => {
    return (payments ?? [])
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount_cents, 0);
  }, [payments]);

  const handleGenerateInvoice = async (bookingId: string) => {
    if (!hotelId) return;
    try {
      await generateInvoice.mutateAsync({ bookingId, hotelId });
      triggerToast('Facture générée');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Finances</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {loadingPayments ? 'Chargement...' : `${(totalCollected / 100).toLocaleString('fr-FR')} € encaissés`}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2.5 px-6 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau Paiement
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#1A1A1A]/10">
        <button
          onClick={() => setTab('payments')}
          className={cn(
            "px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors border-b-2 -mb-[1px]",
            tab === 'payments' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
          )}
        >
          <CreditCard className="w-3.5 h-3.5 inline mr-2 -mt-0.5" />
          Paiements
        </button>
        <button
          onClick={() => setTab('invoices')}
          className={cn(
            "px-6 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors border-b-2 -mb-[1px]",
            tab === 'invoices' ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
          )}
        >
          <FileText className="w-3.5 h-3.5 inline mr-2 -mt-0.5" />
          Factures
        </button>
      </div>

      {tab === 'payments' && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A] opacity-30 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:outline-none focus:border-[#C5A059]/50 transition-colors rounded-sm"
              />
            </div>
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/5 bg-[#FAF9F6]">
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Date</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Méthode</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Type</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Statut</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Notes</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 text-right">Montant</th>
                  </tr>
                </thead>
                {loadingPayments ? (
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#1A1A1A]/5">
                        <td className="px-6 py-4"><Skeleton className="w-24 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-20 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-20 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-16 h-4" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-32 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-16 h-3 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">Aucun paiement</p>
                        </td>
                      </tr>
                    )}
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#FAF9F6]/80 transition-colors">
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{formatDate(p.created_at)}</td>
                        <td className="px-6 py-4 text-sm text-[#1A1A1A] font-medium">{methodLabels[p.method] ?? p.method}</td>
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{typeLabels[p.type] ?? p.type}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", statusColors[p.status])}>
                            {p.status === 'success' ? 'Réussi' : p.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]/50 max-w-[200px] truncate">{p.notes ?? '—'}</td>
                        <td className="px-6 py-4 text-sm font-serif text-[#1A1A1A] text-right">{formatCents(p.amount_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <div className="bg-white border border-[#1A1A1A]/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1A1A1A]/5 bg-[#FAF9F6]">
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">N° Facture</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Date</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Échéance</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Statut</th>
                    <th className="px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 text-right">Total</th>
                  </tr>
                </thead>
                {loadingInvoices ? (
                  <tbody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#1A1A1A]/5">
                        <td className="px-6 py-4"><Skeleton className="w-28 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-24 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-24 h-3" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-20 h-4" /></td>
                        <td className="px-6 py-4"><Skeleton className="w-16 h-3 ml-auto" /></td>
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody>
                    {(!invoices || invoices.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium">Aucune facture</p>
                        </td>
                      </tr>
                    )}
                    {invoices?.map((inv) => (
                      <tr key={inv.id} className="border-b border-[#1A1A1A]/5 hover:bg-[#FAF9F6]/80 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-[#1A1A1A]">{inv.invoice_number}</td>
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{formatDate(inv.issue_date)}</td>
                        <td className="px-6 py-4 text-sm text-[#1A1A1A]/70">{formatDate(inv.due_date)}</td>
                        <td className="px-6 py-4">
                          <span className={cn("inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", invoiceStatusColors[inv.status])}>
                            {inv.status === 'draft' ? 'Brouillon' : inv.status === 'issued' ? 'Émise' : inv.status === 'paid' ? 'Payée' : inv.status === 'cancelled' ? 'Annulée' : 'Avoir'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-serif text-[#1A1A1A] text-right">{formatCents(inv.total_amount_cents)}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      <PaymentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
