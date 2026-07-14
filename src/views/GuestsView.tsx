import { useState, useDeferredValue, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Search, Plus, Eye, Mail, Phone, Edit, Trash2, Building2, Users, Briefcase, Handshake } from 'lucide-react';
import { GuestFormModal } from '../components/GuestFormModal';
import { Skeleton } from '../components/Skeleton';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useGuests, useSearchGuests } from '../lib/hooks/useGuests';
import type { Guest } from '../lib/types/database';

const typeIcons: Record<string, typeof Building2> = {
  individual: Users,
  company: Building2,
  agency: Briefcase,
  partner: Handshake,
};

const typeLabels: Record<string, string> = {
  individual: 'Particulier',
  company: 'Entreprise',
  agency: 'Agence',
  partner: 'Partenaire',
};

function GuestSkeleton() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className={i === 0 ? 'w-32 h-4' : 'w-20 h-4'} />
        </td>
      ))}
    </tr>
  );
}

export function GuestsView() {
  const hotelId = useCurrentHotelId();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const deferredSearch = useDeferredValue(search);
  const isSearching = deferredSearch.trim().length >= 2;

  const { data: allGuests, isLoading: loadingAll } = useGuests(hotelId ?? '');
  const { data: searchResults, isLoading: loadingSearch } = useSearchGuests(
    hotelId ?? '',
    deferredSearch,
  );

  const guests = useMemo(() => {
    if (isSearching) return searchResults ?? [];
    return allGuests ?? [];
  }, [isSearching, searchResults, allGuests]);

  const isLoading = isSearching ? loadingSearch : loadingAll;

  const handleEdit = (guest: Guest) => {
    setSelectedGuest(guest);
    setModalOpen(true);
  };

  const handleNew = () => {
    setSelectedGuest(null);
    setModalOpen(true);
  };

  const handleClose = () => {
    setSelectedGuest(null);
    setModalOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1A1A1A]">Clients</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1.5 font-medium">
            {isLoading ? 'Chargement...' : `${guests.length} client${guests.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2.5 px-6 py-2.5 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau Client
        </button>
      </div>

      <div className="bg-white border border-[#1A1A1A]/10">
        <div className="p-4 border-b border-[#1A1A1A]/5">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client (nom, email)..."
              className="w-full pl-10 pr-4 py-2 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/25 focus:outline-none focus:border-[#C5A059]/50 transition-colors rounded-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1A1A1A]/5">
                <th className="text-left px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Nom</th>
                <th className="text-left px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Type</th>
                <th className="text-left px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Contact</th>
                <th className="text-left px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Nationalité</th>
                <th className="text-center px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Séjours</th>
                <th className="text-right px-6 py-3 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <GuestSkeleton key={i} />)
              ) : guests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center mb-4">
                        <Eye className="w-5 h-5 text-[#1A1A1A]/30" />
                      </div>
                      <p className="text-sm font-medium text-[#1A1A1A]/50">
                        {search ? 'Aucun client trouvé' : 'Aucun client enregistré'}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1">
                        {search ? 'Essayez un autre terme de recherche' : 'Créez votre premier client'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                guests.map((guest) => {
                  const TypeIcon = typeIcons[guest.type] ?? Users;
                  return (
                    <tr
                      key={guest.id}
                      className="border-b border-[#1A1A1A]/5 last:border-b-0 hover:bg-[#FAF9F6] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#1A1A1A]/5 flex items-center justify-center text-xs font-serif text-[#1A1A1A]/50 shrink-0">
                            {guest.first_name
                              ? `${guest.first_name.charAt(0)}${guest.last_name.charAt(0)}`
                              : guest.last_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">
                              {guest.first_name ? `${guest.first_name} ${guest.last_name}` : guest.last_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/60">
                          <TypeIcon className="w-3.5 h-3.5 text-[#1A1A1A]/40" />
                          {typeLabels[guest.type] ?? guest.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {guest.email && (
                            <a href={`mailto:${guest.email}`} className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/60 hover:text-[#C5A059] transition-colors">
                              <Mail className="w-3 h-3" />
                              {guest.email}
                            </a>
                          )}
                          {guest.phone && (
                            <a href={`tel:${guest.phone}`} className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/60 hover:text-[#C5A059] transition-colors">
                              <Phone className="w-3 h-3" />
                              {guest.phone}
                            </a>
                          )}
                          {!guest.email && !guest.phone && (
                            <span className="text-xs text-[#1A1A1A]/30">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#1A1A1A]/60">{guest.nationality ?? '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-[#1A1A1A]">{guest.stay_count}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(guest)}
                            className="p-2 border border-[#1A1A1A]/10 text-[#1A1A1A]/50 hover:text-[#1A1A1A] hover:border-[#1A1A1A]/30 transition-all rounded-sm"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GuestFormModal
        open={modalOpen}
        onClose={handleClose}
        onSuccess={handleClose}
        guest={selectedGuest}
      />
    </div>
  );
}
