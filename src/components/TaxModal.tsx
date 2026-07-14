import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateTax, useUpdateTax } from '../lib/hooks/useInvoicing';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { Tax } from '../lib/types/database';

interface TaxModalProps {
  tax?: Tax | null;
  onClose: () => void;
}

export function TaxModal({ tax, onClose }: TaxModalProps) {
  const hotelId = useCurrentHotelId();
  const createTax = useCreateTax();
  const updateTax = useUpdateTax();
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tax) {
      setName(tax.name);
      setRate(String(tax.rate));
    }
  }, [tax]);

  const handleSave = async () => {
    if (!hotelId || !name.trim() || !rate) return;
    setSaving(true);
    try {
      if (tax) {
        await updateTax.mutateAsync({ id: tax.id, updates: { name: name.trim(), rate: Number(rate) } });
      } else {
        await createTax.mutateAsync({ hotel_id: hotelId, name: name.trim(), rate: Number(rate), is_active: true });
      }
      triggerToast(tax ? 'Taxe mise à jour' : 'Taxe créée');
      onClose();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <h2 className="text-lg font-serif text-[#1A1A1A]">{tax ? 'Modifier' : 'Nouvelle'} Taxe</h2>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. TVA 20%" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Taux (%)</label>
            <input type="number" step="0.01" min="0" max="100" value={rate} onChange={e => setRate(e.target.value)} placeholder="20" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-all">Annuler</button>
          <button onClick={handleSave} disabled={saving} className={cn("flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all", saving ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed" : "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer")}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Enregistrement...' : tax ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
