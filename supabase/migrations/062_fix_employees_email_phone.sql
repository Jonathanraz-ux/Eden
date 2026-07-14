-- ============================================================================
-- EDEN: Luxury Management — Migration 062 : Add email/phone to employees
-- ============================================================================
-- 1. Ajoute email et phone à employees (IF NOT EXISTS = safe si déjà présentes)
-- ============================================================================

-- -------------------------------------------------------------------------
-- 1. Ajout des colonnes email et phone (IF NOT EXISTS = safe si déjà présentes)
-- -------------------------------------------------------------------------
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone TEXT;

UPDATE employees SET email = 'admin@edenluxury.com' WHERE email IS NULL AND auth_user_id IS NOT NULL;
