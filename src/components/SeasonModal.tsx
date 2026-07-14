import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCreateSeason, useUpdateSeason } from '../lib/hooks/usePricing';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { Season } from '../lib/types/database';

const DAYS = [
  { value: 0, label: 'Lun' },
  { value: 1, label: 'Mar' },
  { value: 2, label: 'Mer' },
  { value: 3, label: 'Jeu' },
  { value: 4, label: 'Ven' },
  { value: 5, label: 'Sam' },
  { value: 6, label: 'Dim' },
];

const PRICING_MODES: { value: Season['pricing_mode']; label: string }[] = [
  { value: 'percentage', label: 'Pourcentage (%)' },
  { value: 'fixed_amount', label: 'Montant fixe (€)' },
  { value: 'fixed_price', label: 'Prix fixe (€)' },
  { value: 'per_night', label: 'Par nuit (€)' },
  { value: 'weekend_price', label: 'Prix week-end' },
  { value: 'event_price', label: 'Prix événement' },
];

interface SeasonModalProps {
  season?: Season | null;
  onClose: () => void;
}

export function SeasonModal({ season, onClose }: SeasonModalProps) {
  const hotelId = useCurrentHotelId();
  const createSeason = useCreateSeason();
  const updateSeason = useUpdateSeason();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricingMode, setPricingMode] = useState<Season['pricing_mode']>('percentage');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [applyDays, setApplyDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const MONETARY_MODES: Season['pricing_mode'][] = ['fixed_amount', 'fixed_price', 'per_night', 'weekend_price', 'event_price'];

  useEffect(() => {
    if (season) {
      setName(season.name);
      setStartDate(season.start_date);
      setEndDate(season.end_date);
      setPricingMode(season.pricing_mode);
      setValue(String(MONETARY_MODES.includes(season.pricing_mode) ? season.value / 100 : season.value));
      setPriority(String(season.priority));
      setIsActive(season.is_active);
      setApplyDays(season.apply_days ?? []);
    }
  }, [season]);

  const toggleDay = (day: number) => {
    setApplyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!hotelId || !name.trim() || !startDate || !endDate || !value) return;
    setSaving(true);

    try {
      if (season) {
        await updateSeason.mutateAsync({
          id: season.id,
          updates: {
            name: name.trim(),
            start_date: startDate,
            end_date: endDate,
            pricing_mode: pricingMode,
            value: MONETARY_MODES.includes(pricingMode) ? Math.round(Number(value) * 100) : Number(value),
            priority: Number(priority),
            is_active: isActive,
            apply_days: applyDays.length > 0 ? applyDays : null,
          },
        });
      } else {
        await createSeason.mutateAsync({
          hotel_id: hotelId,
          name: name.trim(),
          start_date: startDate,
          end_date: endDate,
          pricing_mode: pricingMode,
          value: MONETARY_MODES.includes(pricingMode) ? Math.round(Number(value) * 100) : Number(value),
          priority: Number(priority),
          is_active: isActive,
          apply_days: applyDays.length > 0 ? applyDays : null,
        });
      }

      triggerToast(season ? 'Saison mise à jour' : 'Saison créée');
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
      <div className="relative w-full max-w-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">{season ? 'Modifier' : 'Nouvelle'} Saison</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              Période tarifaire saisonnière
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Nom</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Haute Saison Été" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Début</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Fin</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Mode de calcul</label>
              <select value={pricingMode} onChange={e => setPricingMode(e.target.value as Season['pricing_mode'])} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer">
                {PRICING_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Valeur</label>
              <input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Priorité</label>
              <input type="number" min="0" value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors" />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-[#C5A059]" />
                <span className="text-sm text-[#1A1A1A]">Active</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Jours d'application (optionnel)</label>
            <div className="flex gap-2">
              {DAYS.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "w-10 h-10 text-[10px] uppercase tracking-wider font-medium border rounded-sm transition-all",
                    applyDays.includes(d.value)
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A]/40 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
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
            {saving ? 'Enregistrement...' : season ? 'Enregistrer' : 'Créer la saison'}
          </button>
        </div>
      </div>
    </div>
  );
}
