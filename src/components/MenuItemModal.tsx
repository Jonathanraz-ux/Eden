import { useState } from 'react';
import { X, Loader2, UtensilsCrossed, Plus } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRestaurantMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '../lib/hooks/useRestaurant';
import { cn, formatCents } from '../lib/utils';
import { triggerToast } from './Toast';

interface MenuItemModalProps {
  onClose: () => void;
}

export function MenuItemModal({ onClose }: MenuItemModalProps) {
  const hotelId = useCurrentHotelId();
  const { data: items, isLoading } = useRestaurantMenuItems(hotelId ?? '');
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setName('');
    setDesc('');
    setCategory('');
    setPrice('');
  };

  const handleEdit = (item: typeof items[0]) => {
    setEditId(item.id);
    setName(item.name);
    setDesc(item.description ?? '');
    setCategory(item.category ?? '');
    setPrice(String(item.price_cents));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!hotelId || !name.trim() || !price) return;
    setSaving(true);
    try {
      if (editId) {
        await updateItem.mutateAsync({
          id: editId,
          updates: { name: name.trim(), description: desc.trim() || null, category: category.trim() || null, price_cents: Number(price) },
        });
        triggerToast('Plat mis à jour');
      } else {
        const maxOrder = items?.length ?? 0;
        await createItem.mutateAsync({
          hotel_id: hotelId,
          name: name.trim(),
          description: desc.trim() || null,
          category: category.trim() || null,
          price_cents: Number(price),
          is_available: true,
          sort_order: maxOrder + 1,
        } as any);
        triggerToast('Plat créé');
      }
      resetForm();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce plat de la carte ?')) return;
    try {
      await deleteItem.mutateAsync(id);
      triggerToast('Plat supprimé');
    } catch (err) { console.error(err); }
  };

  const handleToggleAvailability = async (item: typeof items[0]) => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { is_available: !item.is_available } });
    } catch (err) { console.error(err); }
  };

  const categories = [...new Set((items ?? []).map(i => i.category).filter(Boolean))] as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#FAF9F6]"><UtensilsCrossed className="w-5 h-5 text-[#C5A059]" /></div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">Gestion de la Carte</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-auto px-8 py-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#1A1A1A]/40">
              {items?.length ?? 0} plat{(items?.length ?? 0) > 1 ? 's' : ''} sur la carte
            </p>
            <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-white text-[9px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors">
              <Plus className="w-3 h-3" /> Nouveau plat
            </button>
          </div>

          {showForm && (
            <div className="mb-6 p-5 border border-[#C5A059]/30 bg-[#FAF9F6] space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1.5">Nom du plat *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Filet de Bœuf" className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <div className="col-span-2">
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1.5">Description</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex. Filet de bœuf Angus, gratin dauphinois" className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1.5">Catégorie</label>
                  <input value={category} onChange={e => setCategory(e.target.value)} list="cat-list" placeholder="Ex. Plat, Dessert..." className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                  <datalist id="cat-list">
                    {categories.map(c => <option key={c} value={c} />)}
                    <option value="Entrée" /><option value="Plat" /><option value="Dessert" /><option value="Boisson" /><option value="Menu" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-[8px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/40 mb-1.5">Prix (centimes) *</label>
                  <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="3800" className="w-full px-3 py-2 bg-white border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={resetForm} className="px-4 py-2 border border-[#1A1A1A]/10 text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-all">Annuler</button>
                <button onClick={handleSave} disabled={saving} className={cn("px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2", saving ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed" : "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer")}>
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {saving ? 'Enregistrement...' : editId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-[#C5A059]" /></div>
          ) : (
            <div className="space-y-1">
              {(!items || items.length === 0) && (
                <p className="text-center py-12 text-[11px] uppercase tracking-[0.15em] text-[#1A1A1A]/30">Carte vide</p>
              )}
              {items?.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3 border border-[#1A1A1A]/5 hover:border-[#1A1A1A]/10 transition-colors group">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className={cn("w-3 h-3 rounded-full border-2 shrink-0 transition-colors", item.is_available ? "bg-emerald-500 border-emerald-500" : "border-[#1A1A1A]/20")}
                    title={item.is_available ? 'Disponible' : 'Indisponible'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", item.is_available ? "text-[#1A1A1A]" : "text-[#1A1A1A]/30 line-through")}>{item.name}</p>
                    <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.1em] text-[#1A1A1A]/30 mt-0.5">
                      {item.category && <span>{item.category}</span>}
                      {item.description && <span className="truncate">{item.description}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-serif font-medium text-[#1A1A1A]">{formatCents(item.price_cents)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => handleEdit(item)} className="px-2 py-1 text-[8px] uppercase tracking-[0.15em] font-semibold text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors">Modifier</button>
                    <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-[8px] uppercase tracking-[0.15em] font-semibold text-red-400 hover:text-red-600 transition-colors">Suppr.</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
