-- ============================================================================
-- EDEN: Luxury Management — Migration 070 : Storage bucket galerie
-- ============================================================================
-- Crée le bucket Storage pour les images de la galerie
-- et les policies d'accès correspondantes.
-- ============================================================================

-- 1. Créer le bucket (privé, pas de listing public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery-images', 'gallery-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

-- 2. Policies Storage : lecture/écriture pour authenticated
DROP POLICY IF EXISTS "storage_gallery_select" ON storage.objects;
CREATE POLICY "storage_gallery_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "storage_gallery_insert" ON storage.objects;
CREATE POLICY "storage_gallery_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "storage_gallery_update" ON storage.objects;
CREATE POLICY "storage_gallery_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "storage_gallery_delete" ON storage.objects;
CREATE POLICY "storage_gallery_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-images' AND auth.role() = 'authenticated');

-- ============================================================================
-- Fin de la migration 070
-- ============================================================================
