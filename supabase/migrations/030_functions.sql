-- ============================================================================
-- EDEN: Luxury Management — Migration 030 : Functions
-- ============================================================================
-- Fonctions SQL métier utilisées par les triggers, les vues et le RLS.
-- Toutes les fonctions respectent l'isolation hotel_id.
-- ============================================================================

-- ============================================================================
-- TRIGGER HELPERS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_touch_updated_at()
-- Met à jour updated_at pour n'importe quelle table qui en possède une colonne.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- VÉRIFICATIONS MÉTIER
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_check_room_availability()
-- Trigger BEFORE INSERT OR UPDATE sur booking_rooms.
-- Vérifie qu'aucun autre booking_room actif (statut 'reserved' ou 'occupied')
-- dont le booking parent est en statut 'confirmed', 'checked_in' ou 'checked_out'
-- ne chevauche la période [check_in_date, check_out_date[ sur la même room.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_room_availability()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_status TEXT;
BEGIN
    -- Récupérer le statut du booking parent
    SELECT status INTO v_parent_status
    FROM bookings
    WHERE id = NEW.booking_id;

    -- Vérification uniquement si le booking parent a un statut actif
    IF v_parent_status IN ('confirmed', 'checked_in', 'checked_out') THEN
        IF EXISTS (
            SELECT 1
            FROM booking_rooms br
            JOIN bookings b ON b.id = br.booking_id
            WHERE br.room_id = NEW.room_id
              AND br.id IS DISTINCT FROM NEW.id
              AND br.status IN ('reserved', 'occupied')
              AND b.status IN ('confirmed', 'checked_in', 'checked_out')
              AND daterange(br.check_in_date, br.check_out_date, '[)')
                  && daterange(NEW.check_in_date, NEW.check_out_date, '[)')
        ) THEN
            RAISE EXCEPTION 'La chambre est déjà réservée sur cette période'
                USING DETAIL = format('room_id: %s, période: %s → %s',
                    NEW.room_id, NEW.check_in_date, NEW.check_out_date);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- CALCULS FINANCIERS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_recalculate_booking_finances(p_booking_id)
-- Recalcule paid_amount_cents et balance_cents d'un booking
-- à partir de ses payments.
-- Appelée par un trigger AFTER INSERT/UPDATE/DELETE sur payments.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_booking_finances(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_paid INTEGER;
    v_total INTEGER;
BEGIN
    -- Somme des paiements réussis (positifs : deposits, balance, supplement)
    -- moins les refunds (négatifs)
    SELECT COALESCE(SUM(
        CASE WHEN type = 'refund' THEN -amount_cents ELSE amount_cents END
    ), 0) INTO v_paid
    FROM payments
    WHERE booking_id = p_booking_id
      AND status = 'success';

    SELECT total_amount_cents INTO v_total
    FROM bookings
    WHERE id = p_booking_id;

    UPDATE bookings
    SET paid_amount_cents = v_paid,
        balance_cents = v_total - v_paid
    WHERE id = p_booking_id;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- fn_recalculate_booking_finances_trigger()
-- Wrapper trigger pour fn_recalculate_booking_finances.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalculate_booking_finances_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);
    PERFORM fn_recalculate_booking_finances(v_booking_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- fn_calculate_booking_total(p_booking_id)
-- Recalcule total_amount_cents d'un booking à partir de ses booking_rooms
-- et booking_services. Appelée par un trigger.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_booking_total(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
    v_rooms_total INTEGER;
    v_services_total INTEGER;
BEGIN
    -- Total des chambres (prix appliqué × nombre de nuits)
    SELECT COALESCE(SUM(applied_price_cents * night_count), 0) INTO v_rooms_total
    FROM booking_rooms
    WHERE booking_id = p_booking_id
      AND status IN ('reserved', 'occupied', 'vacated');

    -- Total des services
    SELECT COALESCE(SUM(total_price_cents), 0) INTO v_services_total
    FROM booking_services
    WHERE booking_id = p_booking_id
      AND status IN ('pending', 'delivered');

    UPDATE bookings
    SET total_amount_cents = v_rooms_total + v_services_total
    WHERE id = p_booking_id;

    -- Recalculer le solde après mise à jour du total
    PERFORM fn_recalculate_booking_finances(p_booking_id);
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- fn_calculate_booking_total_trigger()
-- Wrapper trigger pour fn_calculate_booking_total.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_booking_total_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_booking_id UUID;
BEGIN
    v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);
    PERFORM fn_calculate_booking_total(v_booking_id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- fn_apply_season_pricing(p_room_id, p_date)
-- Calcule le prix d'une chambre pour une date donnée en appliquant
-- les coefficients Season.
-- Retourne le prix en centimes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_apply_season_pricing(p_room_id UUID, p_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_base_price INTEGER;
    v_hotel_id UUID;
    v_season RECORD;
    v_result INTEGER;
BEGIN
    -- Prix de base de la chambre (room_type + price_adjustment)
    SELECT r.hotel_id,
           (rt.base_price_cents + COALESCE(r.price_adjustment_cents, 0)) INTO v_hotel_id, v_base_price
    FROM rooms r
    JOIN room_types rt ON rt.id = r.room_type_id
    WHERE r.id = p_room_id;

    -- Chercher la saison applicable (priorité la plus haute en cas de conflit)
    SELECT s.* INTO v_season
    FROM seasons s
    WHERE s.hotel_id = v_hotel_id
      AND s.is_active = true
      AND p_date >= s.start_date
      AND p_date <= s.end_date
      AND (s.apply_days IS NULL OR EXTRACT(DOW FROM p_date) = ANY(s.apply_days))
    ORDER BY s.priority DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN v_base_price;
    END IF;

    CASE v_season.pricing_mode
        WHEN 'percentage' THEN
            v_result := v_base_price + (v_base_price * v_season.value / 100);
        WHEN 'fixed_amount' THEN
            v_result := v_base_price + v_season.value;
        WHEN 'fixed_price' THEN
            v_result := v_season.value;
        WHEN 'weekend_price' THEN
            v_result := v_season.value;
        WHEN 'event_price' THEN
            v_result := v_season.value;
        WHEN 'per_night' THEN
            -- per_night stocke un JSON dans value
            v_result := v_base_price;
        ELSE
            v_result := v_base_price;
    END CASE;

    RETURN GREATEST(v_result, 0);
END;
$$ LANGUAGE plpgsql STABLE;


-- ---------------------------------------------------------------------------
-- fn_apply_rate_plan(p_base_price_cents, p_rate_plan_id)
-- Applique les ajustements d'un plan tarifaire sur un prix.
-- Pour la V1, les rate_plans définissent surtout les conditions
-- (remboursable, acompte) plutôt que des ajustements de prix.
-- Cette fonction est préparée pour les évolutions futures.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_apply_rate_plan(p_base_price_cents INTEGER, p_rate_plan_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_plan RECORD;
BEGIN
    SELECT * INTO v_plan FROM rate_plans WHERE id = p_rate_plan_id;

    -- V1 : pas d'ajustement de prix via rate_plan
    -- Les conditions (remboursable, acompte) sont gérées au niveau applicatif
    RETURN p_base_price_cents;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- PERMISSIONS & SÉCURITÉ
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_get_current_employee()
-- Retourne l'UUID de l'employé connecté via Supabase Auth.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_current_employee()
RETURNS UUID AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    SELECT id INTO v_employee_id
    FROM employees
    WHERE auth_user_id = auth.uid();

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- fn_get_current_hotel_id()
-- Retourne l'UUID de l'hôtel de l'employé connecté.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_current_hotel_id()
RETURNS UUID AS $$
DECLARE
    v_hotel_id UUID;
BEGIN
    SELECT hotel_id INTO v_hotel_id
    FROM employees
    WHERE auth_user_id = auth.uid();

    RETURN v_hotel_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- fn_get_employee_permissions(p_employee_id)
-- Retourne la liste des codes de permission d'un employé.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_get_employee_permissions(p_employee_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_permissions TEXT[];
BEGIN
    SELECT array_agg(DISTINCT p.code) INTO v_permissions
    FROM employee_roles er
    JOIN role_permissions rp ON rp.role_id = er.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE er.employee_id = p_employee_id;

    RETURN COALESCE(v_permissions, '{}');
END;
$$ LANGUAGE plpgsql STABLE;


-- ---------------------------------------------------------------------------
-- fn_has_permission(p_employee_id, p_permission_code)
-- Vérifie si un employé possède une permission spécifique.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_has_permission(p_employee_id UUID, p_permission_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM employee_roles er
        JOIN role_permissions rp ON rp.role_id = er.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE er.employee_id = p_employee_id
          AND p.code = p_permission_code
    );
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- GÉNÉRATEURS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_generate_booking_reference(p_hotel_id)
-- Génère une référence de réservation lisible.
-- Format : EDEN-YYYY-NNNN
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_booking_reference(p_hotel_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_rand TEXT;
BEGIN
    v_year := to_char(now(), 'YYYY');
    v_rand := lpad(floor(random() * 10000)::text, 4, '0');
    RETURN 'EDEN-' || v_year || '-' || v_rand;
END;
$$ LANGUAGE plpgsql;


-- ---------------------------------------------------------------------------
-- fn_generate_invoice_number(p_hotel_id, p_prefix)
-- Génère le prochain numéro de facture pour un hôtel et une année donnés.
-- Garantit l'atomicité via verrouillage de ligne (UPDATE atomique).
-- Format : {prefix}-{year}-{number}  ex. FAC-2026-00001
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_generate_invoice_number(p_hotel_id UUID, p_prefix TEXT DEFAULT 'FAC')
RETURNS TEXT AS $$
DECLARE
    v_year INTEGER;
    v_number INTEGER;
BEGIN
    v_year := EXTRACT(YEAR FROM now())::INTEGER;

    -- Créer la ligne de séquence si elle n'existe pas
    INSERT INTO invoice_sequences (hotel_id, year, prefix, current_number)
    VALUES (p_hotel_id, v_year, p_prefix, 0)
    ON CONFLICT (hotel_id, year, prefix) DO NOTHING;

    -- Incrémentation atomique (PostgreSQL verrouille la ligne automatiquement)
    UPDATE invoice_sequences
    SET current_number = current_number + 1
    WHERE hotel_id = p_hotel_id
      AND year = v_year
      AND prefix = p_prefix
    RETURNING current_number INTO v_number;

    RETURN p_prefix || '-' || v_year || '-' || lpad(v_number::text, 5, '0');
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- TÂCHES PLANIFIÉES (CRON)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- fn_expire_pending_bookings()
-- Passe en 'expired' les bookings en statut 'pending' dont le délai
-- d'expiration configuré dans hotel_settings est dépassé.
-- Retourne le nombre de bookings expirés.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_expire_pending_bookings()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH expired AS (
        UPDATE bookings b
        SET status = 'expired',
            updated_at = now()
        FROM hotel_settings hs
        WHERE b.hotel_id = hs.hotel_id
          AND b.status = 'pending'
          AND b.created_at + COALESCE(hs.expiration_delay, '24:00:00') < now()
        RETURNING b.id
    )
    SELECT count(*) INTO v_count FROM expired;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ---------------------------------------------------------------------------
-- fn_process_no_show()
-- Passe en 'no_show' les bookings en statut 'confirmed' dont aucun
-- booking_room n'est passé en 'occupied' le jour J+1 après check_in.
-- Retourne le nombre de bookings concernés.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_process_no_show()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    WITH no_show AS (
        UPDATE bookings b
        SET status = 'no_show',
            updated_at = now()
        WHERE b.status = 'confirmed'
          AND b.check_in_date < CURRENT_DATE
          AND NOT EXISTS (
              SELECT 1
              FROM booking_rooms br
              WHERE br.booking_id = b.id
                AND br.status = 'occupied'
          )
        RETURNING b.id
    )
    SELECT count(*) INTO v_count FROM no_show;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
