import { useState, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useCreateGuest, useUpdateGuest } from '../lib/hooks/useGuests';
import { triggerToast } from './Toast';
import type { Guest, GuestType } from '../lib/types/database';

interface GuestFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guest?: Guest | null;
}

const GUEST_TYPES: { value: GuestType; label: string }[] = [
  { value: 'individual', label: 'Particulier' },
  { value: 'company', label: 'Entreprise' },
  { value: 'agency', label: 'Agence' },
  { value: 'partner', label: 'Partenaire' },
];

interface FormData {
  type: GuestType;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  nationality: string;
  document_type: string;
  document_number: string;
}

const initialForm: FormData = {
  type: 'individual',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  nationality: '',
  document_type: '',
  document_number: '',
};

export function GuestFormModal({ open, onClose, onSuccess, guest }: GuestFormModalProps) {
  const hotelId = useCurrentHotelId();
  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();

  const [form, setForm] = useState<FormData>(() => {
    if (guest) {
      return {
        type: guest.type,
        first_name: guest.first_name ?? '',
        last_name: guest.last_name,
        email: guest.email ?? '',
        phone: guest.phone ?? '',
        nationality: guest.nationality ?? '',
        document_type: guest.document_type ?? '',
        document_number: guest.document_number ?? '',
      };
    }
    return initialForm;
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const isEdit = Boolean(guest);
  const isValid = form.last_name.trim();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting || !hotelId) return;

    setSubmitting(true);
    try {
      const data = {
        hotel_id: hotelId,
        type: form.type,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        nationality: form.nationality.trim() || null,
        document_type: form.document_type.trim() || null,
        document_number: form.document_number.trim() || null,
        document_expiry: null,
        birth_date: null,
        address: null,
        preferences: null,
        first_stay_date: null,
        stay_count: 0,
        segment: null,
        loyalty_program: null,
        is_active: true,
      };

      if (isEdit && guest) {
        await updateGuest.mutateAsync({ id: guest.id, updates: data });
        triggerToast('Client mis à jour avec succès');
      } else {
        await createGuest.mutateAsync(data);
        triggerToast('Client créé avec succès');
      }

      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl animate-in">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">
              {isEdit ? 'Modifier le Client' : 'Nouveau Client'}
            </h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              {isEdit ? 'Modifiez les informations du client' : 'Créez une nouvelle fiche client'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as GuestType })}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
            >
              {GUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Prénom
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Ex: Sophie"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Nom *
              </label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Ex: Martin"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sophie@exemple.com"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Téléphone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Nationalité
            </label>
            <input
              type="text"
              value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              placeholder="Ex: Française"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Type Pièce d'Identité
              </label>
              <input
                type="text"
                value={form.document_type}
                onChange={(e) => setForm({ ...form, document_type: e.target.value })}
                placeholder="Ex: Passeport"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                N° Pièce
              </label>
              <input
                type="text"
                value={form.document_number}
                onChange={(e) => setForm({ ...form, document_number: e.target.value })}
                placeholder="Ex: 12AB34567"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1A1A1A]/5">
            <button
              type="button"
              onClick={handleClose}
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
              {submitting
                ? 'Enregistrement...'
                : isEdit
                  ? 'Enregistrer les Modifications'
                  : 'Créer le Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
