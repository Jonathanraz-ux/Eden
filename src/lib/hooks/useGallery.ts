import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { galleryService } from '../services/galleryService';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoGalleryImages } from '../../data/demo-data';
import type { GalleryImage, Insert } from '../types/database';

export function useGallery(hotelId: string) {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['gallery', hotelId],
    queryFn: () => demoMode ? Promise.resolve(demoGalleryImages) : galleryService.list(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function useCreateGalleryImage() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (image: Insert<GalleryImage>) => {
      if (demoMode) return demoMutationResult({ ...image, id: 'demo-gal', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      return galleryService.create(image);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['gallery', data.hotel_id] });
    },
  });
}

export function useUpdateGalleryImage() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Insert<GalleryImage>> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates });
      return galleryService.update(id, updates);
    },
    onSuccess: (data) => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['gallery', data.hotel_id] });
    },
  });
}

export function useDeleteGalleryImage() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: (id: string) => {
      if (demoMode) return demoMutationResult(undefined as any);
      return galleryService.remove(id);
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
}
