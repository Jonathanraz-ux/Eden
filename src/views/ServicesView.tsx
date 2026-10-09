import { useState } from 'react';
import { Loader2, Sparkles, Plus, Pencil, Trash2 } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useServicesWithStats } from '../lib/hooks/useServices';
import { DynamicIcon } from '../lib/components/DynamicIcon';
import { formatCents } from '../lib/utils';
import { ServiceModal } from '../components/ServiceModal';
import { triggerToast } from '../components/Toast';
import type { Service } from '../lib/types/database';

export function ServicesView() {
  const hotelId = useCurrentHotelId();
  const { data: services, isLoading, error } = useServicesWithStats(hotelId ?? '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const deleteMutation: any = { mutate: () => {}, isPending: false };

  const handleOpenCreate = () => {
    setEditingService(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      triggerToast('Service supprimé');
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-sm text-center py-10">Erreur lors du chargement des services.</div>;
  }

  if (!services || services.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-[#1A1A1A]/10 rounded-sm">
        <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-20" />
        <p className="text-[11px] uppercase tracking-widest opacity-40">Aucun service disponible</p>
        <button
          onClick={handleOpenCreate}
          className="mt-4 px-6 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-widest font-bold hover:bg-[#222] transition-colors rounded-sm"
        >
          Ajouter un service
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          Suivi des prestations proposées aux clients.
        </p>
        <button
          onClick={handleOpenCreate}
          className="flex items-center px-6 py-2 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#222] transition-colors rounded-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 border border-[#1A1A1A]/10 rounded-sm group hover:border-[#C5A059] transition-colors">
            <div className="w-12 h-12 bg-[#FAF9F6] border border-[#1A1A1A]/5 rounded-sm flex items-center justify-center mb-6 group-hover:bg-[#1A1A1A] transition-colors">
              <DynamicIcon name={service.icon} className="w-5 h-5 text-[#1A1A1A] group-hover:text-white" />
            </div>
            <h3 className="font-serif text-xl font-medium text-[#1A1A1A] mb-2">{service.name}</h3>
            <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-40 mb-6">
              <span>{service.active_bookings} réservation{service.active_bookings !== 1 ? 's' : ''} du jour</span>
            </div>
            <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest opacity-40">Revenu jour</span>
              <span className="font-serif text-lg">{formatCents(service.revenue_cents)}</span>
            </div>
            <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleOpenEdit(service)}
                className="flex-1 px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-semibold border border-[#1A1A1A]/10 text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#FAF9F6] transition-all rounded-sm"
              >
                Modifier
              </button>
              <button
                onClick={() => handleDelete(service.id)}
                className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-all rounded-sm"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <ServiceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingService(null);
        }}
        service={editingService}
      />
    </div>
  );
}

