-- ============================================================================
-- EDEN: Luxury Management — Migration 073 : Security Hardening
-- ============================================================================
-- Corrige les failles identifiées lors de l'audit RLS du projet `eden`.
--
-- 1. SUPPRESSION de la politique `employees_policy` (FOR ALL USING (true)).
--    Cette politique n'existait dans AUCUN fichier de migration : elle avait
--    ete creee a la main depuis le dashboard SQL. Comme les politiques RLS
--    sont combinees par OR, elle rendait TOUTES les autres politiques de la
--    table `employees` inoperantes :
--      - lecture de la totalite des employes (tous hotels) sans authentification
--      - modification de `auth_user_id` / `hotel_id` sans authentification
--        => un tiers pouvait s'attribuer le compte Super Admin d'un hotel
--    Elle est remplacee ci-dessous par un jeu de politiques par commande.
--
-- 2. UNIQUE partiel sur `employees.auth_user_id`.
--    `authService.getCurrentEmployee()` utilise `.maybeSingle()` : deux lignes
--    pour le meme auth_user_id provoquent une erreur de lecture, donc un compte
--    casse. `fn_get_current_employee()` resolvait aussi la ligne au hasard.
--
-- 3. Trigger `fn_protect_employee_identity` : `auth_user_id` et `hotel_id` sont
--    des colonnes d'identite, plus des donnees de profil. Elles ne peuvent plus
--    etre modifiees que par `service_role` (fonction de provisioning).
--    Le commentaire de 050_rls.sql:l147 annoncait deja cette protection ; elle
--    n'existait pas.
--
-- 4. `SET search_path = public` sur les 6 fonctions SECURITY DEFINER.
--    `fn_get_current_employee` et `fn_get_current_hotel_id` sont appelees par
--    l integrite des politiques RLS : sans search_path verrouille, elles sont
--    vulnerablees a une injection de schema.
--
-- 5. Suppression du trigger `trg_employees_assign_super_admin` (migration 071).
--    Il attribuait Super Admin a TOUT nouvel employe insere, y compris une
--    inscription automatique. Combiné a l'inscription ouverte, n'importe qui
--    devenait administrateur. La fonction `fn_ensure_super_admin` est conservee
--    : elle sert desormais uniquement au provisioning explicite.
--
-- 6. Permissions manquantes sur `bookings`, `room_types` et `hotel_settings`.
--
-- Migration idempotente : peut etre rejouee sans effet de bord.
-- ============================================================================

-- ============================================================================
-- 1. SUPPRESSION DE LA POLITIQUE FAUTIVE
-- ============================================================================

DROP POLICY IF EXISTS employees_policy ON employees;

-- ============================================================================
-- 2. POLITIQUES `employees` PAR COMMANDE
-- ============================================================================
-- Rappel : la suppression d'un employe passe par `deleted_at` (soft delete).
-- Aucune politique DELETE : le DELETE physique reste bloque, comme avant.

DROP POLICY IF EXISTS employees_insert ON employees;
CREATE POLICY employees_insert ON employees FOR INSERT
    WITH CHECK (
        auth.role() = 'service_role'
        OR (
            fn_is_same_hotel(hotel_id)
            AND fn_has_permission(fn_get_current_employee(), 'employee.manage')
        )
    );

-- Gestion par un manager de son propre hotel.
DROP POLICY IF EXISTS employees_update ON employees;
CREATE POLICY employees_update ON employees FOR UPDATE
    USING (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'employee.manage')
    )
    WITH CHECK (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'employee.manage')
    );

-- Modification de son propre profil. Les colonnes d'identite sont de toute
-- facon bloquees par trg_employees_protect_identity.
DROP POLICY IF EXISTS employees_self_update ON employees;
CREATE POLICY employees_self_update ON employees FOR UPDATE
    USING (id = fn_get_current_employee() AND deleted_at IS NULL)
    WITH CHECK (id = fn_get_current_employee());

-- ============================================================================
-- 3. UNIQUE PARTIEL SUR auth_user_id
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_auth_user_id_uniq
    ON employees (auth_user_id)
    WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- 4. TRIGGER DE PROTECTION DES COLONNES D'IDENTITE
-- ============================================================================
-- Volontairement SECURITY INVOKER : current_user doit refléter l'appelant,
-- sinon la verification porte sur le proprietaire de la fonction.

CREATE OR REPLACE FUNCTION fn_protect_employee_identity()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id)
       OR (NEW.hotel_id IS DISTINCT FROM OLD.hotel_id)
    THEN
        IF current_user NOT IN ('postgres', 'service_role', 'supabase_admin', 'supabase_admin_admin') THEN
            RAISE EXCEPTION
                'Modification de auth_user_id / hotel_id interdite (rôle %). Utilisez le provisioning service_role pour créer ou lier un compte.',
                current_user
                USING ERRCODE = '42501';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;

DROP TRIGGER IF EXISTS trg_employees_protect_identity ON employees;
CREATE TRIGGER trg_employees_protect_identity
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION fn_protect_employee_identity();

-- ============================================================================
-- 5. FONCTIONS RLS : search_path VERROUILLE + RESOLUTION DETERMINISTE
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_current_employee()
RETURNS UUID AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT e.id INTO v_employee_id
    FROM employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.deleted_at IS NULL
    ORDER BY e.created_at ASC, e.id ASC
    LIMIT 1;

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_get_current_hotel_id()
RETURNS UUID AS $$
DECLARE
    v_hotel_id UUID;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT e.hotel_id INTO v_hotel_id
    FROM employees e
    WHERE e.auth_user_id = auth.uid()
      AND e.deleted_at IS NULL
    ORDER BY e.created_at ASC, e.id ASC
    LIMIT 1;

    RETURN v_hotel_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_is_same_hotel(p_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_hotel_id IS NOT NULL AND p_hotel_id = fn_get_current_hotel_id();
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION fn_has_permission(p_employee_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_employee_id IS NULL OR p_permission_code IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM employee_roles er
        JOIN role_permissions rp ON rp.role_id = er.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE er.employee_id = p_employee_id
          AND p.code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Fonctions SECURITY DEFINER restantes : verrouillage du search_path.
-- ALTER FUNCTION suffit, le corps n'a pas besoin d'etre reecrit.
ALTER FUNCTION public.fn_ensure_super_admin(uuid)            SET search_path = public;
ALTER FUNCTION public.fn_assign_super_admin_role()           SET search_path = public;
ALTER FUNCTION public.fn_expire_pending_bookings()            SET search_path = public;
ALTER FUNCTION public.fn_process_no_show()                   SET search_path = public;

-- ============================================================================
-- 6. SUPPRESSION DE L'AUTO-SUPER-ADMIN
-- ============================================================================
-- fn_ensure_super_admin est conservee : c'est elle que le provisioning
-- appellera explicitement pour attribuer le role Super Admin d'un nouvel hotel.

DROP TRIGGER IF EXISTS trg_employees_assign_super_admin ON employees;

-- ============================================================================
-- 7. PERMISSIONS MANQUANTES
-- ============================================================================

-- bookings_update : aucun controle de permission dans 050_rls.sql, tout
-- employe de l'hotel pouvait modifier prix et statut d'une reservation.
DROP POLICY IF EXISTS bookings_update ON bookings;
CREATE POLICY bookings_update ON bookings FOR UPDATE
    USING (
        fn_is_same_hotel(hotel_id)
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    )
    WITH CHECK (
        fn_is_same_hotel(hotel_id)
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    );

-- room_types_update : le USING ne verifiait que l'hotel, sans permission.
DROP POLICY IF EXISTS room_types_update ON room_types;
CREATE POLICY room_types_update ON room_types FOR UPDATE
    USING (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'room.manage')
    )
    WITH CHECK (
        fn_is_same_hotel(hotel_id)
        AND fn_has_permission(fn_get_current_employee(), 'room.manage')
    );

-- booking_rooms / booking_guests / booking_services : les politiques UPDATE
-- de 067 ne demandaient que l'hotel. Alignees sur booking.modify.
DROP POLICY IF EXISTS booking_rooms_update ON booking_rooms;
CREATE POLICY booking_rooms_update ON booking_rooms FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id))
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id))
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    );

DROP POLICY IF EXISTS booking_guests_update ON booking_guests;
CREATE POLICY booking_guests_update ON booking_guests FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id))
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id))
        AND (
            fn_has_permission(fn_get_current_employee(), 'booking.modify')
            OR fn_has_permission(fn_get_current_employee(), 'booking.create')
        )
    );

-- hotel_settings : lhotel par defaut doit exister pour que le provisioning
-- puisse ecrire ses reglages. Pas de modification de comportement ici.

-- ============================================================================
-- 8. REPARATION DES ROLES EXISTANTS
-- ============================================================================
-- Le backfill de la migration 071 avait attribue Super Admin a tout employe
-- sans role, y compris une femme de chambre. Deux cas distincts.

-- 8.1 Cas du backfill 071 : Super Admin est le SEUL role d'un employe dont
--     l'intitule de poste correspond a un metier non privilegiant.
--     C'est la signature exacte des degats du backfill : une femme de chambre
--     qui n'avait aucun role a recu Super Admin.
--     Volontairement restrictif : un employe ayant deja un role metier n'est
--     pas concerne ici (traite en 8.2).
DELETE FROM employee_roles er
USING employees e, roles r
WHERE er.role_id    = r.id
  AND er.employee_id = e.id
  AND r.name = 'Super Admin'
  AND e.deleted_at IS NULL
  AND NOT EXISTS (
        SELECT 1
        FROM employee_roles er2
        JOIN roles r2 ON r2.id = er2.role_id
        WHERE er2.employee_id = e.id
          AND r2.name <> 'Super Admin'
      )
  AND lower(coalesce(e.job_title, '') || ' ' || coalesce(e.department, ''))
      LIKE ANY (ARRAY['%chambre%', '%reception%', '%housekeeping%', '%front%']);

-- 8.2 Retirer Super Admin aux employes qui ont DEJA un role metier.
DELETE FROM employee_roles er
USING employees e
WHERE er.employee_id = e.id
  AND er.role_id IN (SELECT id FROM roles WHERE name = 'Super Admin')
  AND EXISTS (
        SELECT 1 FROM roles r2
        JOIN employee_roles er2 ON er2.role_id = r2.id
        WHERE er2.employee_id = e.id
          AND r2.name IN ('Housekeeping', 'Reception', 'Manager')
      );

-- 8.3 Apres 8.1 et 8.2, un employe peut se retrouver sans aucun role. On ne lui
--      attribue que des roles non privilegies, deduits de son intitule de poste.
--      Un poste inconnu ne recoit rien : l'attribution reste une decision
--      d'administrateur, pas un effet de bord de migration.
INSERT INTO employee_roles (employee_id, role_id)
SELECT e.id, r.id
FROM employees e
JOIN LATERAL (
    SELECT id FROM roles
    WHERE name = CASE
        WHEN lower(coalesce(e.job_title, '') || ' ' || coalesce(e.department, ''))
             LIKE '%chambre%'            THEN 'Housekeeping'
        WHEN lower(coalesce(e.job_title, '') || ' ' || coalesce(e.department, ''))
             LIKE '%reception%'           THEN 'Reception'
        ELSE NULL
    END
    LIMIT 1
) r ON true
WHERE e.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM employee_roles er WHERE er.employee_id = e.id);

-- ============================================================================
-- FIN DE LA MIGRATION 073
-- ============================================================================