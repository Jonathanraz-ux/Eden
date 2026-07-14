import { Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useGallery } from '../lib/hooks/useGallery';

export function GalleryView() {
  const hotelId = useCurrentHotelId();
  const { data: images, isLoading, error } = useGallery(hotelId ?? '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          Gérez les photos affichées sur votre site vitrine.
        </p>
        <button className="flex items-center px-6 py-2 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#222] transition-colors rounded-sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm text-center py-10">
          Erreur lors du chargement de la galerie.
        </div>
      )}

      {!isLoading && !error && (!images || images.length === 0) && (
        <div className="text-center py-20 border border-dashed border-[#1A1A1A]/10 rounded-sm">
          <ImageIcon className="w-10 h-10 mx-auto mb-4 opacity-20" />
          <p className="text-[11px] uppercase tracking-widest opacity-40">
            Aucune image dans la galerie
          </p>
          <p className="text-[10px] mt-2 opacity-30">
            Cliquez sur "Ajouter" pour importer vos premières photos.
          </p>
        </div>
      )}

      {!isLoading && !error && images && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="aspect-square bg-[#FAF9F6] border border-[#1A1A1A]/10 flex flex-col items-center justify-center text-[#1A1A1A] hover:bg-white hover:border-[#C5A059] transition-colors cursor-pointer group rounded-sm">
            <ImageIcon className="w-6 h-6 mb-3 opacity-40 group-hover:text-[#C5A059] group-hover:opacity-100 transition-colors" />
            <span className="text-[10px] uppercase tracking-widest font-bold">Uploader une image</span>
          </div>

          {images.map((img) => (
            <div key={img.id} className="aspect-square relative group bg-[#1A1A1A] rounded-sm overflow-hidden">
              <img
                src={img.url}
                alt={img.alt_text ?? 'Photo hôtel'}
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-[#1A1A1A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="px-6 py-2 bg-white text-[#1A1A1A] text-[10px] uppercase tracking-widest font-bold hover:bg-[#FAF9F6] transition-colors rounded-sm">
                  Gérer
                </button>
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-[10px] uppercase tracking-widest">
                    {img.caption}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
