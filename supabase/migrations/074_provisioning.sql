-- ============================================================================
-- EDEN: Luxury Management — Migration 074 : Provisioning
-- ============================================================================
-- Rend l'installation d'un hotel tenable en une commande : c'est la brique qui
-- permet de livrer un client en moins d'une heure a 800 EUR.
--
-- Remplace le mecanisme supprime en 073 :
--   - inscription Auth ouverte + auto-enregistrement cote client
--   - trigger trg_employees_assign_super_admin (Super Admin granted a tout
--     nouvel employe insere)
-- Les deux sont fermes. La creation d'un tenant passe desormais
-- exclusivement par ces fonctions, reservees a `service_role`.
--
-- Trois entrees :
--   fn_provision_hotel(...)                  hotel + settings + roles + referentiel
--   fn_provision_admin(...)                  employe + role Super Admin
--   fn_link_employee_to_auth_user(...)       relie un compte Auth a un employe existant
--
-- Migration idempotente.
-- ============================================================================

-- ============================================================================
-- 1. FONCTION : fn_provision_hotel
-- ============================================================================
-- Cree un hotel complet et pret a l'emploi.
-- Idempotente sur le nom : rejouer le script de provisioning sur un hotel
-- deja installe renvoie son id au lieu de creer un doublon.

CREATE OR REPLACE FUNCTION fn_provision_hotel(p_input JSONB)
RETURNS UUID AS $$
DECLARE
    v_hotel_id     UUID;
    v_existing     UUID;
    v_name         TEXT;
    v_seed         BOOLEAN;
    v_super        UUID;
    v_manager      UUID;
    v_reception    UUID;
    v_housekeeping UUID;
    v_perm         RECORD;
BEGIN
    -- ---------------------------------------------------------------------
    -- Garde-fou : service_role uniquement.
    -- auth.role() lit le JWT de la requete, independamment du SECURITY
    -- DEFINER. Sans ce test, la fonction serait callable par `anon` puisque
    -- PostgREST expose par defaut EXECUTE sur les fonctions (voir REVOKE
    -- en section 5).
    -- ---------------------------------------------------------------------
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'fn_provision_hotel est reservee au role service_role'
            USING ERRCODE = '42501';
    END IF;

    v_name := nullif(trim(p_input ->> 'name'), '');
    IF v_name IS NULL THEN
        RAISE EXCEPTION 'Le champ "name" est obligatoire'
            USING ERRCODE = '22023';
    END IF;

    IF coalesce(p_input ->> 'country', '') = '' THEN
        RAISE EXCEPTION 'Le champ "country" est obligatoire'
            USING ERRCODE = '22023';
    END IF;

    v_seed := coalesce((p_input ->> 'seed_reference_data')::boolean, true);

    -- ---------------------------------------------------------------------
    -- Idempotence : un hotel actif porte deja ce nom ?
    -- ---------------------------------------------------------------------
    SELECT id INTO v_existing
    FROM hotels
    WHERE lower(name) = lower(v_name)
      AND deleted_at IS NULL
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        RAISE NOTICE 'Hotel "%" deja provisionne (%) : aucun doublon cree.', v_name, v_existing;
        RETURN v_existing;
    END IF;

    INSERT INTO hotels (
        name, brand, address_line_1, address_line_2, city, postal_code, region,
        country, star_rating, phone, email, website,
        currency_code, default_language, timezone, is_active
    )
    VALUES (
        v_name,
        nullif(p_input ->> 'brand', ''),
        nullif(p_input ->> 'address_line_1', ''),
        nullif(p_input ->> 'address_line_2', ''),
        nullif(p_input ->> 'city', ''),
        nullif(p_input ->> 'postal_code', ''),
        nullif(p_input ->> 'region', ''),
        p_input ->> 'country',
        (p_input ->> 'star_rating')::smallint,
        nullif(p_input ->> 'phone', ''),
        nullif(p_input ->> 'email', ''),
        nullif(p_input ->> 'website', ''),
        coalesce(nullif(p_input ->> 'currency_code', ''), 'EUR'),
        coalesce(nullif(p_input ->> 'default_language', ''), 'fr'),
        coalesce(nullif(p_input ->> 'timezone', ''), 'Europe/Paris'),
        true
    )
    RETURNING id INTO v_hotel_id;

    -- ---------------------------------------------------------------------
    -- Parametres d'exploitation
    -- ---------------------------------------------------------------------
    -- cancellation_policy et no_show_policy sont des JSONB (cf. 002_core.sql),
    -- pas du texte : on stocke une structure exploitable par le front.
    INSERT INTO hotel_settings (
        hotel_id, cancellation_policy, no_show_policy,
        check_in_time, check_out_time,
        deposit_required, default_vat_rate,
        languages_available
    )
    VALUES (
        v_hotel_id,
        jsonb_build_object(
            'text', coalesce(p_input ->> 'cancellation_policy',
                             'Annulation gratuite jusqu''a 48h avant l''arrivee.'),
            'free_cancellation_hours', coalesce((p_input ->> 'free_cancellation_hours')::int, 48)
        ),
        jsonb_build_object(
            'text', coalesce(p_input ->> 'no_show_policy',
                             'Non-presentation facturee integralement.'),
            'charge_full_amount', coalesce((p_input ->> 'no_show_charge_full')::boolean, true)
        ),
        coalesce((p_input ->> 'check_in_time')::time,  '15:00'::time),
        coalesce((p_input ->> 'check_out_time')::time, '11:00'::time),
        coalesce((p_input ->> 'deposit_required')::boolean, false),
        coalesce((p_input ->> 'default_vat_rate')::int, 20),
        ARRAY[coalesce(nullif(p_input ->> 'default_language', ''), 'fr')]
    );

    -- ---------------------------------------------------------------------
    -- Roles systeme + permissions
    -- ---------------------------------------------------------------------
    INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
    SELECT v_hotel_id, 'Super Admin', 'Acces complet a toutes les fonctionnalites', 100, true
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE hotel_id = v_hotel_id AND name = 'Super Admin' AND deleted_at IS NULL);

    INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
    SELECT v_hotel_id, 'Manager', 'Gestion operationnelle et financiere', 80, true
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE hotel_id = v_hotel_id AND name = 'Manager' AND deleted_at IS NULL);

    INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
    SELECT v_hotel_id, 'Reception', 'Gestion des reservations et des clients', 50, true
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE hotel_id = v_hotel_id AND name = 'Reception' AND deleted_at IS NULL);

    INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
    SELECT v_hotel_id, 'Housekeeping', 'Menage et maintenance des chambres', 30, true
    WHERE NOT EXISTS (SELECT 1 FROM roles WHERE hotel_id = v_hotel_id AND name = 'Housekeeping' AND deleted_at IS NULL);

    SELECT id INTO v_super        FROM roles WHERE hotel_id = v_hotel_id AND name = 'Super Admin'        AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_manager      FROM roles WHERE hotel_id = v_hotel_id AND name = 'Manager'            AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_reception    FROM roles WHERE hotel_id = v_hotel_id AND name = 'Reception'          AND deleted_at IS NULL LIMIT 1;
    SELECT id INTO v_housekeeping FROM roles WHERE hotel_id = v_hotel_id AND name = 'Housekeeping'       AND deleted_at IS NULL LIMIT 1;

    -- Super Admin : toutes les permissions
    FOR v_perm IN SELECT id FROM permissions LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_super, v_perm.id) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Manager : operations + finances
    FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
        'booking.create','booking.cancel','booking.modify','booking.force_checkout',
        'payment.create','payment.refund',
        'room.manage','employee.manage','guest.manage','settings.update',
        'invoice.generate','report.view','audit.view','review.respond',
        'gallery.manage','restaurant.manage'
    ) LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_manager, v_perm.id) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Reception : reservations et clients
    FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
        'booking.create','booking.cancel','booking.modify',
        'payment.create','guest.manage','review.respond'
    ) LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_reception, v_perm.id) ON CONFLICT DO NOTHING;
    END LOOP;

    -- Housekeeping : maintenance des chambres
    FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
        'room.maintenance'
    ) LOOP
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (v_housekeeping, v_perm.id) ON CONFLICT DO NOTHING;
    END LOOP;

    -- ---------------------------------------------------------------------
    -- Referentiel : uniquement a la premiere installation (v_seed ET vide)
    -- ---------------------------------------------------------------------
    IF v_seed THEN

        IF NOT EXISTS (SELECT 1 FROM room_types WHERE hotel_id = v_hotel_id AND deleted_at IS NULL) THEN
            INSERT INTO room_types (hotel_id, name, description, base_capacity, base_price_cents, surface_m2, sort_order, is_active)
            VALUES
                (v_hotel_id, 'Chambre Standard', 'Chambre confortable', 2, 15000, 25.0, 1, true),
                (v_hotel_id, 'Chambre Deluxe',   'Chambre spacieuse', 2, 25000, 35.0, 2, true),
                (v_hotel_id, 'Suite',            'Suite prestige avec salon separe', 4, 45000, 60.0, 3, true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM rate_plans WHERE hotel_id = v_hotel_id AND deleted_at IS NULL) THEN
            INSERT INTO rate_plans (hotel_id, name, description, is_refundable, is_active, conditions)
            VALUES
                (v_hotel_id, 'Standard',         'Tarif standard non remboursable', false, true, 'Annulation non remboursable.'),
                (v_hotel_id, 'Flexible',         'Annulation gratuite jusqu''a 48h avant l''arrivee', true, true, 'Annulation gratuite jusqu''a 48h avant l''arrivee.'),
                (v_hotel_id, 'Non remboursable', 'Tarif economique', false, true, 'Aucun remboursement possible.');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM taxes WHERE hotel_id = v_hotel_id) THEN
            INSERT INTO taxes (hotel_id, name, rate, is_active)
            VALUES (v_hotel_id, 'TVA', coalesce((p_input ->> 'default_vat_rate')::int, 20), true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM amenities WHERE hotel_id = v_hotel_id AND deleted_at IS NULL) THEN
            INSERT INTO amenities (hotel_id, name, category, sort_order, is_active)
            VALUES
                (v_hotel_id, 'Wi-Fi',            'Confort',   1, true),
                (v_hotel_id, 'Climatisation',    'Confort',   2, true),
                (v_hotel_id, 'Minibar',          'Confort',   3, true),
                (v_hotel_id, 'Coffre-fort',      'Equipement',4, true),
                (v_hotel_id, 'Peignoir',         'Equipement',5, true);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM services WHERE hotel_id = v_hotel_id AND deleted_at IS NULL) THEN
            -- pricing_type est constraint a per_person | per_room | per_night | flat
            INSERT INTO services (hotel_id, name, description, unit_price_cents, pricing_type, is_active)
            VALUES
                (v_hotel_id, 'Petit-dejeuner',    'Buffet continental',       2500, 'per_person', true),
                (v_hotel_id, 'Transfert airport', 'Aller-retour',            12000, 'flat',       true),
                (v_hotel_id, 'Room service',      'Plateforme en chambre',    3500, 'per_room',   true),
                (v_hotel_id, 'Blanchisserie',     'Lavage et repassage',       800, 'per_room',   true);
        END IF;

    END IF;

    RETURN v_hotel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 2. FONCTION : fn_provision_admin
-- ============================================================================
-- Cree le premier administrateur d'un hotel et lui attribue le role Super Admin.
-- L'appel doit avoir deja cree le compte Auth (l'id est fourni en parametre).

CREATE OR REPLACE FUNCTION fn_provision_admin(
    p_hotel_id      UUID,
    p_auth_user_id  UUID,
    p_email         TEXT,
    p_first_name    TEXT DEFAULT 'Admin',
    p_last_name     TEXT DEFAULT 'Systeme',
    p_job_title     TEXT DEFAULT 'Directeur',
    p_department    TEXT DEFAULT 'Direction'
)
RETURNS UUID AS $$
DECLARE
    v_employee_id UUID;
    v_role_id     UUID;
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'fn_provision_admin est reservee au role service_role'
            USING ERRCODE = '42501';
    END IF;

    IF p_hotel_id IS NULL OR p_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'hotel_id et auth_user_id sont obligatoires'
            USING ERRCODE = '22023';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM hotels WHERE id = p_hotel_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Hotel % introuvable', p_hotel_id
            USING ERRCODE = '22023';
    END IF;

    SELECT id INTO v_role_id
    FROM roles
    WHERE hotel_id = p_hotel_id AND name = 'Super Admin' AND deleted_at IS NULL
    LIMIT 1;

    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role Super Admin absent pour l''hotel %. Lancez fn_provision_hotel.', p_hotel_id
            USING ERRCODE = '22023';
    END IF;

    -- Fiche existante pour ce compte Auth ? On la complete plutot que d'en
    -- creer une seconde : employees.auth_user_id est unique.
    SELECT id INTO v_employee_id
    FROM employees
    WHERE auth_user_id = p_auth_user_id
    LIMIT 1;

    IF v_employee_id IS NULL THEN
        INSERT INTO employees (
            hotel_id, auth_user_id, first_name, last_name,
            email, job_title, department, status
        )
        VALUES (
            p_hotel_id, p_auth_user_id,
            coalesce(nullif(p_first_name, ''), 'Admin'),
            coalesce(nullif(p_last_name,  ''), 'Systeme'),
            p_email, p_job_title, p_department, 'active'
        )
        RETURNING id INTO v_employee_id;
    END IF;

    INSERT INTO employee_roles (employee_id, role_id)
    VALUES (v_employee_id, v_role_id)
    ON CONFLICT DO NOTHING;

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. FONCTION : fn_link_employee_to_auth_user
-- ============================================================================
-- Relie un compte Auth a une fiche employe existante (passee en import, ou
-- employee cree avant que le client ne choisisse son email).
--
-- Le trigger trg_employees_protect_identity (migration 073) interdit de
-- modifier auth_user_id depuis le client. Cette fonction est le seul chemin
-- legitime : elle est SECURITY DEFINER, donc current_user vaut le proprietaire
-- et le trigger l'accepte.
--
-- Refuse si un autre employe porte deja ce auth_user_id, et refuse si la cible
-- est deja liee a un autre compte : cela evite les detournements de compte.

CREATE OR REPLACE FUNCTION fn_link_employee_to_auth_user(
    p_employee_id  UUID,
    p_auth_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_current UUID;
    v_holder  UUID;
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'fn_link_employee_to_auth_user est reservee au role service_role'
            USING ERRCODE = '42501';
    END IF;

    SELECT auth_user_id INTO v_current
    FROM employees WHERE id = p_employee_id AND deleted_at IS NULL FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employe % introuvable', p_employee_id USING ERRCODE = '22023';
    END IF;

    IF v_current IS NOT NULL AND v_current <> p_auth_user_id THEN
        RAISE EXCEPTION 'Cet employe est deja lie a un autre compte Auth. Detachez-le d''abord (auth_user_id = NULL).'
            USING ERRCODE = '23505';
    END IF;

    SELECT id INTO v_holder
    FROM employees
    WHERE auth_user_id = p_auth_user_id AND id <> p_employee_id AND deleted_at IS NULL
    LIMIT 1;

    IF v_holder IS NOT NULL THEN
        RAISE EXCEPTION 'Ce compte Auth est deja rattache a un autre employe (%)', v_holder
            USING ERRCODE = '23505';
    END IF;

    UPDATE employees SET auth_user_id = p_auth_user_id WHERE id = p_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 4. FONCTION : fn_provision_employee
-- ============================================================================
-- Cree une fiche employe SANS compte Auth (recrutement, import, Clusters).
-- L'admin lie le compte plus tard via fn_link_employee_to_auth_user, ou via
-- l'ecran Employes de l'application (qui dispose de employee.manage).

CREATE OR REPLACE FUNCTION fn_provision_employee(
    p_hotel_id   UUID,
    p_first_name TEXT,
    p_last_name  TEXT,
    p_email      TEXT,
    p_job_title  TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_role_name  TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_employee_id UUID;
    v_role_id     UUID;
BEGIN
    IF coalesce(auth.role(), '') <> 'service_role' THEN
        RAISE EXCEPTION 'fn_provision_employee est reservee au role service_role'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM hotels WHERE id = p_hotel_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Hotel % introuvable', p_hotel_id USING ERRCODE = '22023';
    END IF;

    INSERT INTO employees (hotel_id, first_name, last_name, email, job_title, department, status)
    VALUES (
        p_hotel_id,
        coalesce(nullif(trim(p_first_name), ''), 'Employe'),
        coalesce(nullif(trim(p_last_name),  ''), 'Hotel'),
        nullif(trim(p_email), ''), p_job_title, p_department, 'active'
    )
    RETURNING id INTO v_employee_id;

    -- Aucun role n'est attribue par defaut : c'est une decision d'administrateur.
    IF nullif(trim(coalesce(p_role_name, '')), '') IS NOT NULL THEN
        SELECT id INTO v_role_id
        FROM roles
        WHERE hotel_id = p_hotel_id AND lower(name) = lower(trim(p_role_name)) AND deleted_at IS NULL
        LIMIT 1;

        IF v_role_id IS NULL THEN
            RAISE EXCEPTION 'Role "%" introuvable pour l''hotel %', p_role_name, p_hotel_id
                USING ERRCODE = '22023';
        END IF;

        INSERT INTO employee_roles (employee_id, role_id)
        VALUES (v_employee_id, v_role_id) ON CONFLICT DO NOTHING;
    END IF;

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 5. RETRAIT DE L'EXECUTE PUBLIC
-- ============================================================================
-- PostgREST accorde EXECUTE a PUBLIC par defaut sur les fonctions : sans ce
-- REVOKE, un appel anon a /rest/v1/rpc/fn_provision_hotel passerait le premier
-- garde-fou. Les deux protections sont donc cumulees volontairement.
-- service_role conserve l'execution : c'est lui qui appelle ces fonctions
-- (Edge Function create-tenant).

REVOKE ALL ON FUNCTION fn_provision_hotel(jsonb)                        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fn_provision_admin(uuid, uuid, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fn_provision_employee(uuid, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION fn_link_employee_to_auth_user(uuid, uuid)         FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION fn_provision_hotel(jsonb)                        TO service_role;
GRANT EXECUTE ON FUNCTION fn_provision_admin(uuid, uuid, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION fn_provision_employee(uuid, text, text, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION fn_link_employee_to_auth_user(uuid, uuid)         TO service_role;

-- ============================================================================
-- FIN DE LA MIGRATION 074
-- ============================================================================