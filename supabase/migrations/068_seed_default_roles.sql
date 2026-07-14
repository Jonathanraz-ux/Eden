-- ============================================================================
-- EDEN: Luxury Management — Migration 068 : Seed Default Roles
-- ============================================================================
-- Crée les rôles système par défaut avec leurs permissions,
-- et assigne le rôle Super Admin au premier employé de chaque hôtel.
-- ============================================================================

-- ============================================================================
-- 1. Création des rôles système (idempotent)
-- ============================================================================
DO $$
DECLARE
    v_super_admin_id UUID;
    v_manager_id     UUID;
    v_reception_id   UUID;
    v_housekeeping_id UUID;
    v_hotel_record   RECORD;
    v_perm           RECORD;
    v_employee_record RECORD;
    v_role_exists    BOOLEAN;
BEGIN
    -- Vérifier si les rôles existent déjà (pour éviter de les recréer)
    SELECT EXISTS (SELECT 1 FROM roles WHERE is_system = true AND hotel_id IS NOT NULL LIMIT 1) INTO v_role_exists;
    IF v_role_exists THEN
        RAISE NOTICE 'Rôles système déjà existants, skipping creation.';
        RETURN;
    END IF;

    -- Pour chaque hôtel, créer les 4 rôles système
    FOR v_hotel_record IN SELECT id FROM hotels WHERE deleted_at IS NULL LOOP
        -- Super Admin
        INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
        VALUES (v_hotel_record.id, 'Super Admin', 'Accès complet à toutes les fonctionnalités', 100, true)
        RETURNING id INTO v_super_admin_id;

        -- Manager
        INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
        VALUES (v_hotel_record.id, 'Manager', 'Gestion opérationnelle et financière', 80, true)
        RETURNING id INTO v_manager_id;

        -- Réception
        INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
        VALUES (v_hotel_record.id, 'Réception', 'Gestion des réservations et clients', 50, true)
        RETURNING id INTO v_reception_id;

        -- Housekeeping
        INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
        VALUES (v_hotel_record.id, 'Housekeeping', 'Ménage et maintenance des chambres', 30, true)
        RETURNING id INTO v_housekeeping_id;

        -- ====================================================================
        -- 2. Assignation des permissions aux rôles
        -- ====================================================================

        -- Super Admin : toutes les permissions
        FOR v_perm IN SELECT id FROM permissions LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_super_admin_id, v_perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Manager : permissions opérationnelles + financières
        FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
            'booking.create', 'booking.cancel', 'booking.modify', 'booking.force_checkout',
            'payment.create', 'payment.refund',
            'room.manage',
            'employee.manage',
            'guest.manage',
            'settings.update',
            'invoice.generate',
            'report.view',
            'audit.view',
            'review.respond',
            'gallery.manage',
            'restaurant.manage'
        ) LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_manager_id, v_perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Réception : réservations et clients uniquement
        FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
            'booking.create', 'booking.cancel', 'booking.modify',
            'payment.create',
            'guest.manage',
            'review.respond'
        ) LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_reception_id, v_perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- Housekeeping : maintenance des chambres uniquement
        FOR v_perm IN SELECT id, code FROM permissions WHERE code IN (
            'room.maintenance'
        ) LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_housekeeping_id, v_perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;

        -- ====================================================================
        -- 3. Assigner Super Admin au premier employé de l'hôtel (auto-registration)
        -- ====================================================================
        FOR v_employee_record IN
            SELECT id FROM employees
            WHERE hotel_id = v_hotel_record.id
              AND auth_user_id IS NOT NULL
              AND deleted_at IS NULL
            ORDER BY created_at ASC
            LIMIT 1
        LOOP
            INSERT INTO employee_roles (employee_id, role_id)
            VALUES (v_employee_record.id, v_super_admin_id)
            ON CONFLICT DO NOTHING;

            RAISE NOTICE 'Rôle Super Admin assigné à l''employé %', v_employee_record.id;
        END LOOP;
    END LOOP;
END $$;
