import { useState } from 'react';
import { FileText, Percent, BadgePercent, Loader2, Plus, Search } from 'lucide-react';
import { cn, formatCents, formatDate } from '../lib/utils';
import { useInvoices } from '../lib/hooks/usePayments';
import { useTaxes, useDeleteTax, useDiscounts, useDeleteDiscount } from '../lib/hooks/useInvoicing';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { InvoiceDetailModal } from '../components/InvoiceDetailModal';
import { InvoiceCreateModal } from '../components/InvoiceCreateModal';
import { TaxModal } from '../components/TaxModal';
import { DiscountModal } from '../components/DiscountModal';
import type { Invoice, Tax, Discount } from '../lib/types/database';

const tabs = [
  { key: 'invoices', label: 'Factures', icon: FileText },
  { key: 'taxes', label: 'Taxes', icon: Percent },
  { key: 'discounts', label: 'Remises', icon: BadgePercent },
];

const invoiceStatusColors: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-600 border-gray-200/60',
  issued: 'bg-blue-50 text-blue-700 border-blue-200/60',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60',
  credit_note: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  issued: 'Émise',
  paid: 'Payée',
  cancelled: 'Annulée',
  credit_note: 'Avoir',
};

export function InvoicingView() {
  const hotelId = useCurrentHotelId();
  const [tab, setTab] = useState<'invoices' | 'taxes' | 'discounts'>('invoices');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taxModal, setTaxModal] = useState<{ open: boolean; tax?: Tax | null }>({ open: false });
  const [discountModal, setDiscountModal] = useState<{ open: boolean; discount?: Discount | null }>({ open: false });

  const { data: invoices, isLoading: loadingInvoices } = useInvoices(hotelId ?? '');
  const { data: taxes, isLoading: loadingTaxes } = useTaxes(hotelId ?? '');
  const { data: discounts, isLoading: loadingDiscounts } = useDiscounts(hotelId ?? '');
  const deleteTax = useDeleteTax();
  const deleteDiscount = useDeleteDiscount();

  const filteredInvoices = invoices?.filter(i =>
    i.invoice_number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Facturation & Comptabilité</h1>
          <p className="text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-2">Gestion des factures, taxes et remises</p>
        </div>
        {tab === 'invoices' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/30" />
              <input
                placeholder="Rechercher une facture..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-64 pl-10 pr-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors placeholder:text-[#1A1A1A]/30"
              />
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Nouvelle Facture
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-8 p-1 bg-[#FAF9F6] w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all",
              tab === t.key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Invoices Tab ─── */}
      {tab === 'invoices' && (
        <div>
          {loadingInvoices ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
          ) : (
            <div className="overflow-auto border border-[#1A1A1A]/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#1A1A1A]/10">
                    <th className="text-left px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">N° Facture</th>
                    <th className="text-left px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Date</th>
                    <th className="text-right px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Montant</th>
                    <th className="text-center px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-32">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices?.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className="border-b border-[#1A1A1A]/5 cursor-pointer hover:bg-[#FAF9F6] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-[#1A1A1A]/60">{formatDate(inv.issue_date)}</td>
                      <td className="px-6 py-4 text-right font-medium text-[#1A1A1A]">{formatCents(inv.total_amount_cents)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", invoiceStatusColors[inv.status])}>
                          {invoiceStatusLabels[inv.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!filteredInvoices || filteredInvoices.length === 0) && (
                <p className="text-center py-16 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">
                  {search ? 'Aucune facture trouvée' : 'Aucune facture'}
                </p>
              )}
            </div>
          )}

          {selectedInvoice && (
            <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
          )}
        </div>
      )}

      {/* ─── Taxes Tab ─── */}
      {tab === 'taxes' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setTaxModal({ open: true })} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Nouvelle Taxe
            </button>
          </div>
          {loadingTaxes ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
          ) : (
            <div className="overflow-auto border border-[#1A1A1A]/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#1A1A1A]/10">
                    <th className="text-left px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Nom</th>
                    <th className="text-right px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Taux</th>
                    <th className="text-center px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-28">Statut</th>
                    <th className="w-24 px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {taxes?.map((tax) => (
                    <tr key={tax.id} className="border-b border-[#1A1A1A]/5">
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">{tax.name}</td>
                      <td className="px-6 py-4 text-right text-[#1A1A1A]">{tax.rate}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", tax.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-red-50 text-red-700 border-red-200/60")}>
                          {tax.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setTaxModal({ open: true, tax })} className="px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors">Modifier</button>
                          <button onClick={() => { if (confirm('Supprimer cette taxe ?')) deleteTax.mutate(tax.id); }} className="px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-red-500/60 hover:text-red-600 transition-colors">Suppr.</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!taxes || taxes.length === 0) && (
                <p className="text-center py-16 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">Aucune taxe configurée</p>
              )}
            </div>
          )}
          {taxModal.open && <TaxModal tax={taxModal.tax ?? null} onClose={() => setTaxModal({ open: false })} />}
        </div>
      )}

      {/* ─── Discounts Tab ─── */}
      {tab === 'discounts' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => setDiscountModal({ open: true })} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors">
              <Plus className="w-3.5 h-3.5" /> Nouvelle Remise
            </button>
          </div>
          {loadingDiscounts ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
          ) : (
            <div className="overflow-auto border border-[#1A1A1A]/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-[#1A1A1A]/10">
                    <th className="text-left px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Nom</th>
                    <th className="text-left px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Code</th>
                    <th className="text-right px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Valeur</th>
                    <th className="text-center px-6 py-4 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-28">Statut</th>
                    <th className="w-24 px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {discounts?.map((d) => (
                    <tr key={d.id} className="border-b border-[#1A1A1A]/5">
                      <td className="px-6 py-4 font-medium text-[#1A1A1A]">{d.name}</td>
                      <td className="px-6 py-4 text-[#1A1A1A]/50 text-[11px] uppercase tracking-wider">{d.code ?? '—'}</td>
                      <td className="px-6 py-4 text-right text-[#1A1A1A]">{d.type === 'percentage' ? `${d.value}%` : formatCents(d.value)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn("inline-block px-2.5 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", d.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-red-50 text-red-700 border-red-200/60")}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDiscountModal({ open: true, discount: d })} className="px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors">Modifier</button>
                          <button onClick={() => { if (confirm('Supprimer cette remise ?')) deleteDiscount.mutate(d.id); }} className="px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] font-semibold text-red-500/60 hover:text-red-600 transition-colors">Suppr.</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!discounts || discounts.length === 0) && (
                <p className="text-center py-16 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">Aucune remise configurée</p>
              )}
            </div>
          )}
          {discountModal.open && <DiscountModal discount={discountModal.discount ?? null} onClose={() => setDiscountModal({ open: false })} />}
        </div>
      )}

      {showCreateModal && <InvoiceCreateModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
