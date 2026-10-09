-- ============================================================================
-- EDEN: Luxury Management — Migration 071 : Auto-attribution du rôle Super Admin
-- ============================================================================
-- Cause racine du bug "Plan tarifaire introuvable pour la mise à jour" :
--   - La politique RLS sur rate_plans (INSERT/UPDATE/DELETE) exige la
--     permission 'settings.update' (voir 066_fix_missing_rls_policies.sql).
--   - Le dashboard auto-crée un employé au premier login (useAuth/useLogin)
--     mais le seed (068_seed_default_roles.sql) attribue le rôle Super Admin
--     AU MOMENT de la migration, donc AVANT l'existence de tout employé.
--   - Résultat : l'employé auto-enregistré n'a AUCUN rôle → aucune permission
--     → il peut voir les tarifs (SELECT) mais jamais les créer/modifier/supprimer.
--
-- Correctif :
--   1. fn_ensure_super_admin(p_employee_id) — SECURITY DEFINER (contourne le RLS)
--      trouve ou crée le rôle Super Admin de l'hôtel (avec toutes les permissions)
--      et lie l'employé à ce rôle.
--   2. Trigger AFTER INSERT sur employees → tout nouvel employé devient Super Admin.
--   3. Backfill : rattrape les employés existants sans aucun rôle.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_ensure_super_admin(p_employee_id UUID)
RETURNS VOID AS $$
DECLARE
    v_hotel_id UUID;
    v_role_id  UUID;
    v_perm     RECORD;
BEGIN
    SELECT hotel_id INTO v_hotel_id FROM employees WHERE id = p_employee_id;
    IF v_hotel_id IS NULL THEN
        RETURN;
    END IF;

    -- Rôle Super Admin existant pour cet hôtel ?
    SELECT id INTO v_role_id
    FROM roles
    WHERE hotel_id = v_hotel_id AND name = 'Super Admin' AND deleted_at IS NULL
    LIMIT 1;

    -- Sinon, le créer avec toutes les permissions
    IF v_role_id IS NULL THEN
        INSERT INTO roles (hotel_id, name, description, hierarchy_level, is_system)
        VALUES (v_hotel_id, 'Super Admin', 'Accès complet à toutes les fonctionnalités', 100, true)
        RETURNING id INTO v_role_id;

        FOR v_perm IN SELECT id FROM permissions LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (v_role_id, v_perm.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;

    INSERT INTO employee_roles (employee_id, role_id)
    VALUES (p_employee_id, v_role_id)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION fn_assign_super_admin_role()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM fn_ensure_super_admin(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_employees_assign_super_admin ON employees;
CREATE TRIGGER trg_employees_assign_super_admin
    AFTER INSERT ON employees
    FOR EACH ROW
    EXECUTE FUNCTION fn_assign_super_admin_role();

-- Backfill : rattraper tous les employés actifs sans aucun rôle
DO $$
DECLARE
    v_emp RECORD;
BEGIN
    FOR v_emp IN
        SELECT e.id FROM employees e
        WHERE e.deleted_at IS NULL
          AND NOT EXISTS (SELECT 1 FROM employee_roles er WHERE er.employee_id = e.id)
    LOOP
        PERFORM fn_ensure_super_admin(v_emp.id);
    END LOOP;
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION 071
-- ============================================================================
