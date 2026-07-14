-- ============================================================================
-- EDEN: Luxury Management — Migration 063 : Fix RLS policies
-- ============================================================================
-- Corrige et ajoute les politiques RLS manquantes dans 050_rls.sql.
-- ============================================================================

-- ============================================================================
-- 1. POLITIQUES RLS MANQUANTES
-- ============================================================================

-- Permet aux utilisateurs authentifiés de voir l'hôtel par défaut
-- (nécessaire pour l'auto-enregistrement employé)
DROP POLICY IF EXISTS hotels_select ON hotels;
CREATE POLICY hotels_select ON hotels FOR SELECT
    USING (
        id = fn_get_current_hotel_id()
        OR auth.role() = 'service_role'
        OR (auth.role() = 'authenticated' AND id = '00000000-0000-0000-0000-000000000001')
    );

-- Supprime l'ancienne policy INSERT sur employees (trop restrictive)
DROP POLICY IF EXISTS employees_insert ON employees;

-- Nouvelle policy : auto-enregistrement + gestion par manageur
CREATE POLICY employees_insert ON employees FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            hotel_id IS NOT NULL
            AND EXISTS (SELECT 1 FROM hotels WHERE id = hotel_id)
            AND (
                -- Auto-registration : l'utilisateur crée son propre profil employé
                auth_user_id = auth.uid()
                OR
                -- Un manageur peut créer des employés
                fn_has_permission(fn_get_current_employee(), 'employee.manage')
            )
        )
    );

-- Policy INSERT sur room_types (manquante dans 050_rls.sql)
DROP POLICY IF EXISTS room_types_insert ON room_types;
CREATE POLICY room_types_insert ON room_types FOR INSERT
    WITH CHECK (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'room.manage')
    );

-- Policy UPDATE sur room_types (manquante dans 050_rls.sql)
DROP POLICY IF EXISTS room_types_update ON room_types;
CREATE POLICY room_types_update ON room_types FOR UPDATE
    USING (fn_is_same_hotel(hotel_id))
    WITH CHECK (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'room.manage')
    );


