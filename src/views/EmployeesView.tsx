import { useState } from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/Skeleton';
import { Mail, Phone, Plus, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useEmployees, useDeleteEmployee } from '../lib/hooks/useEmployees';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { triggerToast } from '../components/Toast';
import type { Employee } from '../types';
import { getEmployeeFullName, getEmployeeInitials, getEmployeeAvatarUrl } from '../types';

const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
  active: {
    label: 'En service',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  },
  on_leave: {
    label: 'En congé',
    dot: 'bg-slate-300',
    badge: 'bg-slate-50 text-slate-600 border-slate-200/60',
  },
  absent: {
    label: 'Absent',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
  },
  inactive: {
    label: 'Inactif',
    dot: 'bg-gray-400',
    badge: 'bg-gray-50 text-gray-600 border-gray-200/60',
  },
  suspended: {
    label: 'Suspendu',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border-red-200/60',
  },
};

function CardSkeleton() {
  return (
    <div className="bg-white border border-[#1A1A1A]/10 p-6 flex items-start gap-5">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <Skeleton className="w-20 h-2.5" />
        <Skeleton className="w-24 h-2.5" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

export function EmployeesView() {
  const { data: employees = [], isLoading } = useEmployees();
  const deleteMutation = useDeleteEmployee();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = () => {
    setEditingEmployee(null);
    setModalOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) return;
    setDeletingId(id);
    try {
      await deleteMutation.mutateAsync(id);
      triggerToast('Membre supprimé');
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const actifCount = employees.filter((e) => e.status === 'active').length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Notre Équipe</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {isLoading ? 'Chargement...' : `${employees.length} membre${employees.length > 1 ? 's' : ''} · ${actifCount} en service`}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un Membre
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {employees.map((emp) => {
            const config = statusConfig[emp.status] ?? { label: 'Inconnu', dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-600 border-gray-200/60' };
            return (
              <div
                key={emp.id}
                className="bg-white border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/20 hover:shadow-sm transition-all duration-200 p-6 flex items-start gap-5 group"
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={getEmployeeAvatarUrl(emp)} alt={getEmployeeFullName(emp)} />
                  <AvatarFallback className="text-xs font-serif">{getEmployeeInitials(emp)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-[#1A1A1A] truncate">{getEmployeeFullName(emp)}</h4>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#C5A059] font-semibold mt-0.5">{emp.job_title ?? '—'}</p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[8px] uppercase tracking-wider font-semibold border rounded-full shrink-0", config.badge)}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                      {config.label}
                    </span>
                  </div>

                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 font-medium mt-3 mb-3">
                    {emp.department ?? '—'}
                  </p>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#1A1A1A]/50 mb-3">
                    {emp.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {emp.email}
                      </span>
                    )}
                    {emp.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {emp.phone}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-[#1A1A1A]/5">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="p-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/30 transition-all rounded-sm"
                      title="Modifier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      disabled={deletingId === emp.id}
                      className="p-2 border border-[#1A1A1A]/10 text-red-400 hover:text-red-600 hover:border-red-300 transition-all rounded-sm disabled:opacity-40"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/30 transition-all rounded-sm">
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/30 transition-all rounded-sm">
                      <Phone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmployeeFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingEmployee(null); }}
        onSuccess={() => { }}
        employee={editingEmployee}
      />
    </div>
  );
}
