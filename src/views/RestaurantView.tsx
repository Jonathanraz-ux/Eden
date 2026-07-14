import { useState } from 'react';
import { UtensilsCrossed, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRestaurantOrders, useRestaurantTables, useUpdateOrderStatus } from '../lib/hooks/useRestaurant';
import { MenuItemModal } from '../components/MenuItemModal';
import { cn, formatCents } from '../lib/utils';

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'en attente', className: 'bg-amber-100 text-amber-800' },
  preparing: { label: 'en cours', className: 'bg-blue-100 text-blue-800' },
  ready: { label: 'prêt', className: 'bg-green-100 text-green-800' },
  served: { label: 'servi', className: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'annulé', className: 'bg-red-100 text-red-800' },
};

export function RestaurantView() {
  const hotelId = useCurrentHotelId();
  const [showMenuModal, setShowMenuModal] = useState(false);
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useRestaurantOrders(hotelId ?? '');
  const { data: tables } = useRestaurantTables(hotelId ?? '');
  const updateStatus = useUpdateOrderStatus();

  const activeOrders = (orders ?? []).filter(o => o.status !== 'served' && o.status !== 'cancelled');
  const totalTables = tables?.length ?? 0;
  const occupiedTables = new Set(
    activeOrders.filter(o => o.type === 'dine_in' && o.table_id).map(o => o.table_id)
  ).size;
  const roomServiceOrders = activeOrders.filter(o => o.type === 'room_service').length;
  const estimatedRevenue = (orders ?? []).reduce((sum, o) => sum + o.total_amount_cents, 0);

  const handleMarkReady = (id: string) => {
    updateStatus.mutate({ id, status: 'ready' });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="col-span-1 lg:col-span-8 space-y-6">
          <div className="bg-white p-6 border border-[#1A1A1A]/10 rounded-sm">
            <div className="border-b border-[#1A1A1A]/5 pb-4 mb-4 flex items-center">
              <UtensilsCrossed className="w-4 h-4 mr-2 text-[#C5A059]" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Commandes en cours</h3>
            </div>

            {ordersLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" />
              </div>
            )}

            {ordersError && (
              <div className="text-red-500 text-sm text-center py-10">
                Erreur lors du chargement des commandes.
              </div>
            )}

            {!ordersLoading && !ordersError && activeOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[11px] uppercase tracking-widest opacity-40">Aucune commande en cours</p>
              </div>
            )}

            {!ordersLoading && !ordersError && (
              <div className="space-y-4">
                {activeOrders.map(order => {
                  const tableName = order.type === 'room_service'
                    ? (order.room_number ? `Chambre ${order.room_number}` : 'Room Service')
                    : (order.table?.name ?? 'Table inconnue');
                  const statusInfo = statusLabels[order.status] ?? { label: order.status, className: '' };
                  const itemsText = order.items.map(i => `${i.quantity}x ${i.menu_item.name}`).join(', ');

                  return (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-[#1A1A1A]/5 bg-[#FAF9F6] hover:bg-white transition-colors rounded-sm">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-serif text-lg">{tableName}</span>
                          <span className="text-[10px] font-mono opacity-40">#{order.order_reference}</span>
                          <span className={cn('px-2 py-0.5 text-[9px] uppercase font-bold rounded-full', statusInfo.className)}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-sm italic text-[#1A1A1A]/70">{itemsText}</p>
                      </div>
                      <div className="flex items-center space-x-6 text-right">
                        <div>
                          <p className="text-[10px] font-mono opacity-60 flex items-center justify-end">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="font-serif text-lg">{formatCents(order.total_amount_cents)}</p>
                        </div>
                        {order.status !== 'ready' && order.status !== 'served' && (
                          <button
                            onClick={() => handleMarkReady(order.id)}
                            disabled={updateStatus.isPending}
                            className="p-2 border border-[#1A1A1A]/10 rounded-sm hover:border-[#C5A059] hover:text-[#C5A059] bg-white transition-colors disabled:opacity-30"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="col-span-1 lg:col-span-4 space-y-6">
          <div className="bg-[#1A1A1A] text-white p-6 flex flex-col justify-between rounded-sm relative overflow-hidden h-full min-h-[300px]">
            <div className="relative z-10">
              <h3 className="text-[10px] uppercase tracking-widest opacity-60 mb-6">Service du Soir</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="opacity-60">Tables occupées</span>
                  <span className="font-mono">{occupiedTables} / {totalTables}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="opacity-60">Room Service</span>
                  <span className="font-mono">{roomServiceOrders} commande{roomServiceOrders !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="opacity-60">Revenu estimé</span>
                  <span className="font-serif text-xl text-[#C5A059]">{formatCents(estimatedRevenue)}</span>
                </div>
              </div>
            </div>
            <div className="mt-8 relative z-10">
              <button onClick={() => setShowMenuModal(true)} className="w-full py-3 border border-white/20 text-[10px] uppercase tracking-widest hover:bg-white hover:text-[#1A1A1A] transition-colors rounded-sm">
                Gérer la carte
              </button>
            </div>
            <div className="absolute bottom-[-20px] right-[-20px] text-[100px] font-serif opacity-5 italic select-none">
              Dîner
            </div>
          </div>
        </section>
      </div>

      {showMenuModal && <MenuItemModal onClose={() => setShowMenuModal(false)} />}
    </div>
  );
}
