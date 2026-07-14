import { useState, useEffect, type FormEvent } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useCreateEmployee, useUpdateEmployee } from '../lib/hooks/useEmployees';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { triggerToast } from './Toast';
import type { Employee } from '../types';

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

const DEPARTMENTS = ['Direction', 'Réception', 'Restaurant', 'Service des Chambres', 'Maintenance', 'Sécurité'];
const JOB_TITLES = ['Manager', 'Chef', 'Réceptionniste', 'Concierge', 'Femme de Chambre', 'Technicien', 'Gardien'];

interface FormData {
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  status: Employee['status'];
  email: string;
  phone: string;
}

const initialForm: FormData = {
  first_name: '',
  last_name: '',
  job_title: '',
  department: '',
  status: 'active',
  email: '',
  phone: '',
};

export function EmployeeFormModal({ open, onClose, onSuccess, employee }: EmployeeFormModalProps) {
  const hotelId = useCurrentHotelId();
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const isEditing = Boolean(employee);
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.first_name,
        last_name: employee.last_name,
        job_title: employee.job_title ?? '',
        department: employee.department ?? '',
        status: employee.status,
        email: employee.email ?? '',
        phone: employee.phone ?? '',
      });
    } else {
      setForm(initialForm);
    }
  }, [employee, open]);

  if (!open) return null;

  const isValid = form.first_name.trim() && form.last_name.trim() && form.department;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting || !hotelId) return;

    setSubmitting(true);

    try {
      if (isEditing && employee) {
        await updateMutation.mutateAsync({
          id: employee.id,
          updates: {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            job_title: form.job_title.trim() || null,
            department: form.department,
            status: form.status,
            email: form.email.trim() || '',
            phone: form.phone.trim() || null,
          },
        });
        triggerToast('Membre modifié avec succès');
      } else {
        const payload: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> = {
          hotel_id: hotelId,
          auth_user_id: null,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          job_title: form.job_title.trim() || null,
          department: form.department,
          status: form.status,
          email: form.email.trim() || '',
          phone: form.phone.trim() || null,
          hire_date: null,
          supervisor_id: null,
        };
        await createMutation.mutateAsync(payload);
        triggerToast('Membre ajouté avec succès');
      }

      setForm(initialForm);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('[EmployeeFormModal] Error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
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
              {isEditing ? "Modifier le Membre" : "Ajouter un Membre"}
            </h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">
              {isEditing ? "Modifiez les informations de l'employé" : "Créez une nouvelle fiche employé"}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Prénom *
              </label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Ex: Léa"
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors"
                required
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
                placeholder="Ex: Dubois"
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
                placeholder="exemple@email.com"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Poste
              </label>
              <select
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Sélectionner...</option>
                {JOB_TITLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
                Département *
              </label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
                required
              >
                <option value="">Sélectionner...</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Statut
            </label>
            <div className="flex gap-3">
              {(['active', 'on_leave'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={cn(
                    "flex-1 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold border transition-all",
                    form.status === s
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                      : "bg-white text-[#1A1A1A]/50 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  )}
                >
                  {s === 'active' ? 'En service' : 'En congé'}
                </button>
              ))}
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
              {submitting ? 'Enregistrement...' : isEditing ? "Enregistrer les Modifications" : "Ajouter le Membre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
