import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateDiscount, useUpdateDiscount } from '../lib/hooks/useInvoicing';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { Discount } from '../lib/types/database';

interface DiscountModalProps {
  discount?: Discount | null;
  onClose: () => void;
}

const typeOptions = [
  { value: 'percentage', label: 'Pourcentage (%)' },
  { value: 'fixed_amount', label: 'Montant fixe (FCFA)' },
];

export function DiscountModal({ discount, onClose }: DiscountModalProps) {
  const hotelId = useCurrentHotelId();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const [name, setName] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (discount) {
      setName(discount.name);
      setType(discount.type);
      setValue(String(discount.value));
      setCode(discount.code ?? '');
      setValidFrom(discount.valid_from ?? '');
      setValidUntil(discount.valid_until ?? '');
      setActive(discount.is_active);
    }
  }, [discount]);

  const handleSave = async () => {
    if (!hotelId || !name.trim() || !value) return;
    setSaving(true);
    try {
      if (discount) {
        await updateDiscount.mutateAsync({ id: discount.id, updates: { name: name.trim(), type, value: Number(value), code: code || null, valid_from: validFrom || null, valid_until: validUntil || null, is_active: active } });
      } else {
        await createDiscount.mutateAsync({ hotel_id: hotelId, name: name.trim(), type, value: Number(value), code: code || null, valid_from: validFrom || null, valid_until: validUntil || null, is_active: active });
      }
      triggerToast(discount ? 'Remise mise à jour' : 'Remise créée');
      onClose();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <h2 className="text-lg font-serif text-[#1A1A1A]">{discount ? 'Modifier' : 'Nouvelle'} Remise</h2>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Early Booking" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Type</label>
            <div className="flex gap-2">
              {typeOptions.map(o => (
                <button key={o.value} onClick={() => setType(o.value as 'percentage' | 'fixed_amount')} className={cn("flex-1 px-4 py-2.5 border text-[10px] uppercase tracking-[0.15em] font-semibold transition-all", type === o.value ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-[#FAF9F6] text-[#1A1A1A]/50 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30")}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Valeur</label>
            <input type="number" step="0.01" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder={type === 'percentage' ? '10' : '5000'} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Code promo (optionnel)</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Ex. PROMO10" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Valable du</label>
              <input type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Au</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} className="w-4 h-4 accent-[#1A1A1A]" />
            <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/70">Active</span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving} className={cn("flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all", saving ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed" : "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer")}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Enregistrement...' : discount ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
