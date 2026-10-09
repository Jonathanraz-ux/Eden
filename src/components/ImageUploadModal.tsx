import { useState, useRef, type ChangeEvent } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useCreateGalleryImage, useUpdateGalleryImage, useDeleteGalleryImage } from '../lib/hooks/useGallery';
import { triggerToast } from './Toast';
import { cn } from '../lib/utils';
import type { GalleryImage } from '../lib/types/database';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  image?: GalleryImage | null;
}

export function ImageUploadModal({ open, onClose, image }: ImageUploadModalProps) {
  const hotelId = useCurrentHotelId();
  const createMutation = useCreateGalleryImage();
  const updateMutation = useUpdateGalleryImage();
  const deleteMutation = useDeleteGalleryImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(image);

  useState(() => {
    if (image) {
      setPreview(image.url);
      setAltText(image.alt_text ?? '');
      setCaption(image.caption ?? '');
      setSortOrder(image.sort_order);
    } else {
      setPreview(null);
      setAltText('');
      setCaption('');
      setSortOrder(0);
    }
  });

  if (!open) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    if (!hotelId) return;
    setSubmitting(true);
    try {
      let publicUrl = preview;

      if (file) {
        const ext = file.name.split('.').pop();
        const path = `${hotelId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await getSupabase()
          .storage.from('gallery-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = await getSupabase()
          .storage.from('gallery-images')
          .getPublicUrl(path);

        publicUrl = urlData.publicUrl;
      }

      if (!publicUrl) throw new Error('URL de l\'image manquante');

      const payload = {
        hotel_id: hotelId,
        url: publicUrl,
        alt_text: altText.trim() || null,
        caption: caption.trim() || null,
        sort_order: sortOrder,
        is_active: true,
      };

      if (isEdit && image) {
        await updateMutation.mutateAsync({ id: image.id, updates: payload });
        triggerToast('Image mise à jour');
      } else {
        await createMutation.mutateAsync(payload);
        triggerToast('Image ajoutée');
      }

      onClose();
    } catch (err) {
      console.error('Erreur upload image:', err);
      triggerToast('Erreur lors de l\'opération');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!image) return;
    if (!confirm('Supprimer cette image ?')) return;
    try {
      await deleteMutation.mutateAsync(image.id);
      triggerToast('Image supprimée');
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl animate-in">
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-[#1A1A1A]/5">
          <div>
            <h2 className="text-lg font-serif text-[#1A1A1A]">{isEdit ? 'Modifier l\'image' : 'Ajouter une image'}</h2>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#1A1A1A]/30 mt-1 font-medium">Galerie photos</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#1A1A1A]/30 hover:text-[#1A1A1A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {!isEdit && (
            <div>
              <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Image</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-[#C5A059]/30 text-[#C5A059] hover:bg-[#FAF9F6] transition-colors text-xs"
              >
                <Upload className="w-4 h-4" />
                {file ? file.name : 'Sélectionner une image'}
              </button>
            </div>
          )}

          {preview && (
            <div className="aspect-video bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Texte alternatif</label>
            <input
              type="text"
              value={altText}
              onChange={e => setAltText(e.target.value)}
              placeholder="Vue aérienne du resort"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Légende</label>
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Vue aérienne du resort"
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/50 mb-2">Ordre</label>
            <input
              type="number"
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-[#FAF9F6] border border-[#1A1A1A]/10 text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-5 bg-[#FAF9F6] border-t border-[#1A1A1A]/5">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 text-[10px] uppercase tracking-[0.15em] font-semibold text-red-500 hover:text-red-700 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-[#1A1A1A]/10 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-white transition-all">
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || (!isEdit && !file)}
              className={cn(
                "px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all flex items-center gap-2",
                !submitting && (!isEdit && !file) ? "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed" :
                !submitting ? "bg-[#1A1A1A] text-white hover:bg-[#333] cursor-pointer" : "bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed"
              )}
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? 'Enregistrement...' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
