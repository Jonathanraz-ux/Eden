import { useState, useEffect } from 'react';
import { X, Loader2, Euro } from 'lucide-react';
import { useCreateRatePlan, useUpdateRatePlan, useRatePlanPrices, useSetRatePlanPrice } from '../lib/hooks/usePricing';
import { useRoomTypes } from '../lib/hooks/useRooms';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { RatePlan } from '../lib/types/database';

interface RatePlanModalProps {
  ratePlan?: RatePlan | null;
  onClose: () => void;
}

export function RatePlanModal({ ratePlan, onClose }: RatePlanModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: roomTypes } = useRoomTypes(hotelId ?? '');
  const { data: existingPrices } = useRatePlanPrices(ratePlan?.id ?? '');
  const createRatePlan = useCreateRatePlan();
  const updateRatePlan = useUpdateRatePlan();
  const setPrice = useSetRatePlanPrice();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isRefundable, setIsRefundable] = useState(true);
  const [depositCents, setDepositCents] = useState('');
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ratePlan) {
      setName(ratePlan.name);
      setDescription(ratePlan.description ?? '');
      setIsRefundable(ratePlan.is_refundable);
      setDepositCents(ratePlan.deposit_required_cents ? String(ratePlan.deposit_required_cents / 100) : '');
    }
  }, [ratePlan]);

  useEffect(() => {
    if (existingPrices) {
      const map: Record<string, string> = {};
      for (const p of existingPrices) {
        if (p.applied_price_cents != null) {
          map[p.room_type_id] = String(p.applied_price_cents / 100);
        }
      }
      setPrices(prev => ({ ...prev, ...map }));
    }
  }, [existingPrices]);

  const handleSave = async () => {
    if (!hotelId || !name.trim()) return;
    setSaving(true);

    try {
      let planId = ratePlan?.id;

      if (ratePlan) {
        await updateRatePlan.mutateAsync({
          id: ratePlan.id,
          updates: {
            name: name.trim(),
            description: description.trim() || null,
            is_refundable: isRefundable,
            deposit_required_cents: depositCents ? Math.round(Number(depositCents) * 100) : null,
          },
        });
      } else {
        const created = await createRatePlan.mutateAsync({
          hotel_id: hotelId,
          name: name.trim(),
          description: description.trim() || null,
          cancellation_policy: null,
          deposit_required_cents: depositCents ? Math.round(Number(depositCents) * 100) : null,
          deposit_percentage: null,
          is_refundable: isRefundable,
          is_active: true,
          conditions: null,
        } as any);
        planId = created.id;
      }

      if (planId && roomTypes) {
        for (const rt of roomTypes) {
          const val = prices[rt.id];
          if (val !== undefined && val !== '') {
            await setPrice.mutateAsync({ ratePlanId: planId, roomTypeId: rt.id, appliedPriceCents: Math.round(Number(val) * 100) });
          }
        }
      }

      triggerToast(ratePlan ? 'Plan tarifaire mis à jour' : 'Plan tarifaire créé');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">{ratePlan ? 'Modifier' : 'Nouveau'} Plan Tarifaire</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              Configuration des prix par type de chambre
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Nom du plan</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex. Petit-déjeuner inclus"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description du plan tarifaire"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRefundable}
                onChange={e => setIsRefundable(e.target.checked)}
                className="accent-[#C5A059]"
              />
              <span className="text-sm text-[#1A1A1A]">Remboursable</span>
            </label>
            <div className="flex-1" />
            <div className="w-40">
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-1">Acompte requis (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depositCents}
                onChange={e => setDepositCents(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          {roomTypes && roomTypes.length > 0 && (
            <div className="pt-4 border-t border-[#1A1A1A]/5">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-3">
                <Euro className="w-3.5 h-3.5" />
                Prix par type de chambre
              </div>
              <div className="space-y-2">
                {roomTypes.map(rt => (
                  <div key={rt.id} className="flex items-center justify-between px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/5">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{rt.name}</p>
                      <p className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/40">
                        Base : {(rt.base_price_cents / 100).toFixed(0)} €
                      </p>
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prices[rt.id] ?? ''}
                        onChange={e => setPrices(p => ({ ...p, [rt.id]: e.target.value }))}
                        placeholder="Prix (€)"
                        className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors text-right"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <button onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-all">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all",
              saving
                ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
                : "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer"
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Enregistrement...' : ratePlan ? 'Enregistrer' : 'Créer le plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
