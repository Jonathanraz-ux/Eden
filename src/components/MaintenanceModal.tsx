import { useState } from 'react';
import { X, Loader2, Wrench } from 'lucide-react';
import { useUpdateRoomStatus } from '../lib/hooks/useRooms';
import { useEmployees } from '../lib/hooks/useEmployees';
import { getEmployeeFullName } from '../types';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { Employee } from '../types';

interface MaintenanceModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export function MaintenanceModal({ roomId, roomName, onClose }: MaintenanceModalProps) {
  const { data: employees } = useEmployees();
  const updateRoomStatus = useUpdateRoomStatus();
  const [reason, setReason] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await updateRoomStatus.mutateAsync({ id: roomId, status: 'maintenance' });
      triggerToast(`${roomName} — Signalé en maintenance`);
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
      <div className="relative w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-serif text-[#1A1A1A]">Maintenance</h2>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-0.5 font-medium">{roomName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Motif de l'intervention
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Description du problème..."
              className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">
              Assigner à (optionnel)
            </label>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] focus:outline-none focus:border-[#C5A059]/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="">Non assigné</option>
              {employees?.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {getEmployeeFullName(emp)}{emp.department ? ` — ${emp.department}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all",
              saving
                ? "bg-amber-200 text-amber-500 cursor-not-allowed"
                : "bg-amber-600 text-white hover:bg-amber-700 cursor-pointer"
            )}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'Signalement...' : 'Signaler'}
          </button>
        </div>
      </div>
    </div>
  );
}
