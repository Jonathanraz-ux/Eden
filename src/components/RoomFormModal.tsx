import { useState, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRoomTypes, useCreateRoom } from '../lib/hooks/useRooms';
import { triggerToast } from './Toast';
import type { RoomStatus } from '../lib/types/database';

interface RoomFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Réservée' },
  { value: 'occupied', label: 'Occupée' },
  { value: 'cleaning', label: 'Nettoyage' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'out_of_service', label: 'Hors service' },
];

interface FormData {
  name: string;
  room_type_id: string;
  actual_capacity: string;
  price_adjustment_euros: string;
  status: RoomStatus;
  notes: string;
}

const initialForm: FormData = {
  name: '',
  room_type_id: '',
  actual_capacity: '',
  price_adjustment_euros: '0',
  status: 'available',
  notes: '',
};

export function RoomFormModal({ open, onClose, onSuccess }: RoomFormModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: roomTypes, isLoading: roomTypesLoading, error: roomTypesError } = useRoomTypes(hotelId ?? '');
  const createRoom = useCreateRoom();

  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isValid =
    form.name.trim() &&
    form.room_type_id &&
    Number(form.actual_capacity) > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting || !hotelId) return;

    setSubmitting(true);
    try {
      await createRoom.mutateAsync({
        hotel_id: hotelId,
        name: form.name.trim(),
        room_type_id: form.room_type_id,
        actual_capacity: Number(form.actual_capacity),
        price_adjustment_cents: Math.round(Number(form.price_adjustment_euros) * 100) || 0,
        status: form.status,
        notes: form.notes || null,
        building_id: null,
        floor_id: null,
        actual_surface_m2: null,
        is_active: true,
      });
      triggerToast('Chambre créée avec succès');
      setForm(initialForm);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur création chambre:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl animate-in">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Nouvelle Chambre</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              Configurez les informations de la chambre
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Nom / Numéro
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: 101, Suite Presidentielle"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Type de Chambre
            </label>
              <select
                value={form.room_type_id}
                onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
                required
                disabled={!roomTypes?.length}
              >
                <option value="">
                  {roomTypesLoading ? 'Chargement...' : roomTypesError ? 'Erreur de chargement' : !hotelId ? 'Hôtel non configuré' : !roomTypes?.length ? 'Aucun type disponible' : 'Sélectionner un type'}
                </option>
                {roomTypes?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.base_price_cents / 100}€/nuit
                  </option>
                ))}
              </select>
              {!hotelId && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Aucun hôtel configuré. Exécutez les migrations SQL dans le dashboard Supabase.
                </p>
              )}
              {hotelId && !roomTypesLoading && !roomTypesError && roomTypes?.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  Aucun type de chambre trouvé. Exécutez '063_fix_seed_and_rls.sql' dans le SQL Editor Supabase.
                </p>
              )}
              {roomTypesError && (
                <p className="text-[10px] text-red-500 mt-1">
                  Erreur de chargement : {(roomTypesError as Error).message}
                </p>
              )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Capacité
              </label>
              <input
                type="number"
                min="1"
                value={form.actual_capacity}
                onChange={(e) => setForm({ ...form, actual_capacity: e.target.value })}
                placeholder="Ex: 2"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Ajustement Prix (€/nuit)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.price_adjustment_euros}
                onChange={(e) => setForm({ ...form, price_adjustment_euros: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Statut
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={3}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className={cn(
                "px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2",
                isValid && !submitting
                  ? "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer"
                  : "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
              )}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Création en cours...' : 'Créer la Chambre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
