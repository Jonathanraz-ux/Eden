-- ============================================================================
-- EDEN: Luxury Management — Migration 001 : Extensions
-- ============================================================================
-- Active les extensions PostgreSQL nécessaires au fonctionnement du système.
-- pgcrypto  → gen_random_uuid() pour les clés primaires UUID
-- btree_gist→ exclusion constraints pour les contraintes d'overlap temporel
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
