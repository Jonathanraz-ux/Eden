import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
// import { useCreateService, useUpdateService } from '../lib/hooks/useServices';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { Service } from '../lib/types/database';

const PRICING_TYPES = [
  { value: 'per_person', label: 'Par personne' },
  { value: 'per_room', label: 'Par chambre' },
  { value: 'per_night', label: 'Par nuit' },
  { value: 'flat', label: 'Forfaitaire' },
] as const;

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
}

export function ServiceModal({ open, onClose, service }: ServiceModalProps) {
  const hotelId = useCurrentHotelId();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();

  const [form, setForm] = useState({
    name: '',
    description: '',
    unit_price_cents: 0,
    pricing_type: 'per_person' as Service['pricing_type'],
    icon: 'Sparkles',
    category: 'spa',
    tax_rate: 10,
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name,
        description: service.description ?? '',
        unit_price_cents: service.unit_price_cents,
        pricing_type: service.pricing_type,
        icon: service.icon ?? 'Sparkles',
        category: service.category ?? 'spa',
        tax_rate: service.tax_rate ?? 10,
        is_active: service.is_active,
      });
    } else {
      setForm({
        name: '',
        description: '',
        unit_price_cents: 0,
        pricing_type: 'per_person',
        icon: 'Sparkles',
        category: 'spa',
        tax_rate: 10,
        is_active: true,
      });
    }
  }, [service]);

  if (!open) return null;

  const isEdit = Boolean(service);

  const handleSubmit = async () => {
    if (!hotelId || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const data = {
        hotel_id: hotelId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        unit_price_cents: form.unit_price_cents,
        pricing_type: form.pricing_type,
        icon: form.icon,
        category: form.category,
        tax_rate: form.tax_rate,
        is_active: form.is_active,
        translations: null,
      };

      if (isEdit && service) {
        await updateMutation.mutateAsync({ id: service.id, updates: data });
        triggerToast('Service mis à jour');
      } else {
        await createMutation.mutateAsync(data);
        triggerToast('Service créé');
      }

      onClose();
    } catch (err) {
      console.error(err);
      triggerToast('Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    if (!confirm('Supprimer ce service ?')) return;
    try {
      await deleteMutation.mutateAsync(service.id);
      triggerToast('Service supprimé');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl animate-in">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">{isEdit ? 'Modifier le service' : 'Nouveau service'}</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">Prestation complémentaire</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Nom</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Spa & Bien-être"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Soins spa et massages"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Prix (€)</label>
              <input
                type="number"
                value={form.unit_price_cents / 100}
                onChange={e => setForm({ ...form, unit_price_cents: Math.round(Number(e.target.value) * 100) })}
                min="0"
                step="0.01"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">TVA (%)</label>
              <input
                type="number"
                value={form.tax_rate}
                onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })}
                min="0"
                max="100"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#A1A1A1]/50 mb-2">Type de tarification</label>
              <select
                value={form.pricing_type}
                onChange={e => setForm({ ...form, pricing_type: e.target.value as Service['pricing_type'] })}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
              >
                {(PRICING_TYPES ?? []).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#A1A1A1]/50 mb-2">Catégorie</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#A1A1A1]/50 mb-2">Icône (Lucide)</label>
            <input
              type="text"
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              placeholder="Sparkles"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#A1A1A1]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={e => setForm({ ...form, is_active: e.target.checked })}
              className="accent-[#C5A059]"
            />
            <label htmlFor="is_active" className="text-sm text-[#1A1A1A]">Actif</label>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-red-500 hover:text-red-700 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-white transition-all">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !form.name.trim()}
              className={cn(
                "px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2",
                !submitting && form.name.trim() ? "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer" : "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
              )}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
