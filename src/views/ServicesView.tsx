import { Loader2, Sparkles } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useServicesWithStats } from '../lib/hooks/useServices';
import { DynamicIcon } from '../lib/components/DynamicIcon';
import { formatCents } from '../lib/utils';

export function ServicesView() {
  const hotelId = useCurrentHotelId();
  const { data: services, isLoading, error } = useServicesWithStats(hotelId ?? '');

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-[10px] uppercase tracking-widest opacity-40">
        Suivi des prestations proposées aux clients.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white p-6 border border-[#1A1A1A]/10 rounded-sm group cursor-pointer hover:border-[#C5A059] transition-colors">
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
          </div>
        ))}
      </div>
    </div>
  );
}
