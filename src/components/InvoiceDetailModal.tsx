import { useState } from 'react';
import { X, Loader2, FileText, Printer, Plus, Trash2, Check, Send } from 'lucide-react';
import { useInvoiceItems } from '../lib/hooks/useInvoicing';
import { useUpdateInvoiceStatus, useAddInvoiceItem, useRemoveInvoiceItem } from '../lib/hooks/usePayments';
import { cn, formatCents, formatDate } from '../lib/utils';
import { triggerToast } from './Toast';
import type { Invoice } from '../lib/types/database';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  issued: 'Émise',
  paid: 'Payée',
  cancelled: 'Annulée',
  credit_note: 'Avoir',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-600 border-gray-200/60',
  issued: 'bg-blue-50 text-blue-700 border-blue-200/60',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  cancelled: 'bg-red-50 text-red-700 border-red-200/60',
  credit_note: 'bg-amber-50 text-amber-700 border-amber-200/60',
};

export function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  const { data: items, isLoading } = useInvoiceItems(invoice.id);
  const updateStatus = useUpdateInvoiceStatus();
  const addItem = useAddInvoiceItem();
  const removeItem = useRemoveInvoiceItem();
  const [newDesc, setNewDesc] = useState('');
  const [newQty, setNewQty] = useState('1');
  const [newPrice, setNewPrice] = useState('');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const hotelName = "L'Éden Hôtel & Lodge";
    const lines = (items ?? []).map(item => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:13px;">${item.description}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:center;font-size:13px;">${item.quantity}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;">${formatCents(item.unit_price_cents)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-size:13px;font-weight:600;">${formatCents(item.total_price_cents)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html><head><title>${invoice.invoice_number}</title>
      <style>
        @page { margin: 20mm; }
        body { font-family: 'Georgia', serif; color: #1A1A1A; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { font-size: 24px; margin: 0; }
        .header p { font-size: 12px; color: #666; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { padding: 12px 0; border-bottom: 2px solid #1A1A1A; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; text-align: left; }
        th:not(:first-child) { text-align: right; }
        .totals { margin-left: auto; width: 280px; }
        .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals .grand { border-top: 2px solid #1A1A1A; font-weight: bold; font-size: 16px; padding-top: 10px; margin-top: 10px; }
        .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #999; }
        .no-print { display: none; }
      </style></head><body>
        <div class="header">
          <h1>${hotelName}</h1>
          <p>${invoice.invoice_number}</p>
          <p>Émise le ${formatDate(invoice.issue_date)} · Échéance le ${formatDate(invoice.due_date)}</p>
        </div>
        <table>
          <thead><tr><th>Description</th><th style="text-align:center;">Qté</th><th style="text-align:right;">Prix unit.</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
        <div class="totals">
          <div><span>Net HT</span><span>${formatCents(invoice.net_amount_cents)}</span></div>
          ${invoice.tax_amount_cents > 0 ? `<div><span>TVA</span><span>${formatCents(invoice.tax_amount_cents)}</span></div>` : ''}
          ${invoice.discount_amount_cents > 0 ? `<div><span>Remise</span><span>-${formatCents(invoice.discount_amount_cents)}</span></div>` : ''}
          <div class="grand"><span>Total TTC</span><span>${formatCents(invoice.total_amount_cents)}</span></div>
        </div>
        <div class="footer">${hotelName} · Document généré automatiquement</div>
        <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: invoice.id, status: newStatus });
      triggerToast(`Facture ${statusLabels[newStatus]?.toLowerCase() ?? newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async () => {
    if (!newDesc.trim() || !newPrice) return;
    const qty = Number(newQty) || 1;
    const price = Number(newPrice);
    try {
      await addItem.mutateAsync({
        invoice_id: invoice.id,
        description: newDesc.trim(),
        quantity: qty,
        unit_price_cents: price,
        total_price_cents: price * qty,
        tax_rate: 0,
        tax_id: null,
        discount_id: null,
        sort_order: (items?.length ?? 0) + 1,
      });
      setNewDesc('');
      setNewQty('1');
      setNewPrice('');
      triggerToast('Ligne ajoutée');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
      triggerToast('Ligne supprimée');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FAF9F6]"><FileText className="w-5 h-5 text-[#C5A059]" /></div>
            <div>
              <h2 className="text-lg font-serif text-[#1A1A1A]">{invoice.invoice_number}</h2>
              <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40 mt-0.5">
                {formatDate(invoice.issue_date)} — {formatDate(invoice.due_date)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="p-2 text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors" title="Imprimer / PDF">
              <Printer className="w-4 h-4" />
            </button>
            <span className={cn("px-3 py-1 text-[9px] uppercase tracking-wider font-semibold border rounded-full", statusColors[invoice.status])}>
              {statusLabels[invoice.status]}
            </span>
            <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" /></div>
        ) : (
          <div className="flex-1 overflow-auto px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10">
                  <th className="text-left py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Description</th>
                  <th className="text-right py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-16">Qté</th>
                  <th className="text-right py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-28">Prix unit.</th>
                  <th className="text-right py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 w-28">Total</th>
                  {invoice.status === 'draft' && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {items?.map((item) => (
                  <tr key={item.id} className="border-b border-[#1A1A1A]/5 group">
                    <td className="py-3 text-[#1A1A1A]">{item.description}</td>
                    <td className="py-3 text-right text-[#1A1A1A]/70">{item.quantity}</td>
                    <td className="py-3 text-right text-[#1A1A1A]">{formatCents(item.unit_price_cents)}</td>
                    <td className="py-3 text-right text-[#1A1A1A] font-medium">{formatCents(item.total_price_cents)}</td>
                    {invoice.status === 'draft' && (
                      <td className="py-3 text-right">
                        <button onClick={() => handleRemoveItem(item.id)} className="p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {(!items || items.length === 0) && (
              <p className="text-center py-12 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">Aucune ligne sur cette facture</p>
            )}

            {invoice.status === 'draft' && (
              <div className="mt-4 flex items-end gap-3 p-4 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                <div className="flex-1">
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Description</label>
                  <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex. Petit-déjeuner" className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-xs focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <div className="w-16">
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Qté</label>
                  <input type="number" min="1" value={newQty} onChange={e => setNewQty(e.target.value)} className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-xs text-center focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <div className="w-28">
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1">Prix (c€)</label>
                  <input type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-xs text-right focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <button onClick={handleAddItem} disabled={!newDesc.trim() || !newPrice} className="p-2.5 bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="mt-6 ml-auto w-72 space-y-2 pt-4 border-t border-[#1A1A1A]/10">
              <div className="flex justify-between text-sm"><span className="text-[#1A1A1A]/50">Total HT</span><span>{formatCents(invoice.net_amount_cents)}</span></div>
              {invoice.discount_amount_cents > 0 && (
                <div className="flex justify-between text-sm"><span className="text-[#1A1A1A]/50">Remise</span><span className="text-red-600">-{formatCents(invoice.discount_amount_cents)}</span></div>
              )}
              {invoice.tax_amount_cents > 0 && (
                <div className="flex justify-between text-sm"><span className="text-[#1A1A1A]/50">TVA</span><span>{formatCents(invoice.tax_amount_cents)}</span></div>
              )}
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-[#1A1A1A]/10">
                <span>Total TTC</span><span>{formatCents(invoice.total_amount_cents)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-8 py-4 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          {invoice.status === 'draft' && (
            <button onClick={() => handleStatusChange('issued')} className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors">
              <Send className="w-3.5 h-3.5" />
              Émettre la facture
            </button>
          )}
          {invoice.status === 'issued' && (
            <button onClick={() => handleStatusChange('paid')} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-emerald-800 transition-colors">
              <Check className="w-3.5 h-3.5" />
              Marquer payée
            </button>
          )}
          {invoice.status === 'issued' && (
            <button onClick={() => handleStatusChange('cancelled')} className="flex items-center gap-2 px-5 py-2.5 border border-red-200 text-red-600 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-red-50 transition-colors ml-3">
              Annuler
            </button>
          )}
          {invoice.notes && (
            <p className="text-[10px] text-[#1A1A1A]/40 ml-auto">{invoice.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}
