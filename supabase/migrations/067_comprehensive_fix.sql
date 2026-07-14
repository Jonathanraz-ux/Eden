-- ============================================================================
-- EDEN: Luxury Management — Migration 067 : Comprehensive Fix
-- ============================================================================
-- Fusion de toutes les corrections issues de l'audit complet :
--   1. Politiques RLS manquantes
--   2. Permissions manquantes
--   3. Trigger auto-génération booking_reference
--   4. Correction fn_apply_season_pricing (percentage /100 au lieu de /10000)
--   5. Correction fn_booking_status_history (changed_by_type, fallback)
--   6. Index manquants
-- ============================================================================

-- ============================================================================
-- 1. PERMISSIONS MANQUANTES
-- ============================================================================
INSERT INTO permissions (code, name, group_name) VALUES
    ('review.respond', 'Répondre aux avis clients', 'Review')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. POLITIQUES RLS MANQUANTES (classées par table)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 hotels
-- ---------------------------------------------------------------------------
CREATE POLICY hotels_insert ON hotels FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY hotels_delete ON hotels FOR DELETE
    USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2.2 hotel_settings
-- ---------------------------------------------------------------------------
CREATE POLICY hotel_settings_delete ON hotel_settings FOR DELETE
    USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2.3 buildings
-- ---------------------------------------------------------------------------
CREATE POLICY buildings_insert ON buildings FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY buildings_update ON buildings FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY buildings_delete ON buildings FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ---------------------------------------------------------------------------
-- 2.4 floors
-- ---------------------------------------------------------------------------
CREATE POLICY floors_insert ON floors FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY floors_update ON floors FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY floors_delete ON floors FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ---------------------------------------------------------------------------
-- 2.5 media
-- ---------------------------------------------------------------------------
CREATE POLICY media_insert ON media FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY media_update ON media FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY media_delete ON media FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ---------------------------------------------------------------------------
-- 2.6 amenities
-- ---------------------------------------------------------------------------
CREATE POLICY amenities_insert ON amenities FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY amenities_update ON amenities FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY amenities_delete ON amenities FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

-- ---------------------------------------------------------------------------
-- 2.7 room_amenities
-- ---------------------------------------------------------------------------
CREATE POLICY room_amenities_insert ON room_amenities FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY room_amenities_update ON room_amenities FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY room_amenities_delete ON room_amenities FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

-- ---------------------------------------------------------------------------
-- 2.8 room_type_amenities
-- ---------------------------------------------------------------------------
CREATE POLICY room_type_amenities_insert ON room_type_amenities FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM room_types rt WHERE rt.id = room_type_id AND fn_is_same_hotel(rt.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY room_type_amenities_update ON room_type_amenities FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM room_types rt WHERE rt.id = room_type_id AND fn_is_same_hotel(rt.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM room_types rt WHERE rt.id = room_type_id AND fn_is_same_hotel(rt.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY room_type_amenities_delete ON room_type_amenities FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM room_types rt WHERE rt.id = room_type_id AND fn_is_same_hotel(rt.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

-- ---------------------------------------------------------------------------
-- 2.9 bookings (DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY bookings_delete ON bookings FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

-- ---------------------------------------------------------------------------
-- 2.10 booking_rooms (DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY booking_rooms_delete ON booking_rooms FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

-- ---------------------------------------------------------------------------
-- 2.11 booking_guests (UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY booking_guests_update ON booking_guests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ));

CREATE POLICY booking_guests_delete ON booking_guests FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

-- ---------------------------------------------------------------------------
-- 2.12 booking_services (INSERT, UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY booking_services_insert ON booking_services FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

CREATE POLICY booking_services_update ON booking_services FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ));

CREATE POLICY booking_services_delete ON booking_services FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

-- ---------------------------------------------------------------------------
-- 2.13 booking_status_history (INSERT via système + employé)
-- ---------------------------------------------------------------------------
CREATE POLICY booking_status_history_insert ON booking_status_history FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ));

-- ---------------------------------------------------------------------------
-- 2.14 room_status_history (INSERT via système + employé)
-- ---------------------------------------------------------------------------
CREATE POLICY room_status_history_insert ON room_status_history FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)
    ));

-- ---------------------------------------------------------------------------
-- 2.15 payments (UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY payments_update ON payments FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'payment.create'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'payment.create'));

CREATE POLICY payments_delete ON payments FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'payment.create'));

-- ---------------------------------------------------------------------------
-- 2.16 invoices (DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY invoices_delete ON invoices FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

-- ---------------------------------------------------------------------------
-- 2.17 invoice_items (UPDATE)
-- ---------------------------------------------------------------------------
CREATE POLICY invoice_items_update ON invoice_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM invoices i WHERE i.id = invoice_id AND fn_is_same_hotel(i.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices i WHERE i.id = invoice_id AND fn_is_same_hotel(i.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

-- ---------------------------------------------------------------------------
-- 2.18 invoice_sequences (INSERT, UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY invoice_sequences_insert ON invoice_sequences FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id));

CREATE POLICY invoice_sequences_update ON invoice_sequences FOR UPDATE
    USING (fn_is_same_hotel(hotel_id))
    WITH CHECK (fn_is_same_hotel(hotel_id));

CREATE POLICY invoice_sequences_delete ON invoice_sequences FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

-- ---------------------------------------------------------------------------
-- 2.19 rate_plan_room_types (UPDATE)
-- ---------------------------------------------------------------------------
CREATE POLICY rate_plan_room_types_update ON rate_plan_room_types FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM rate_plans rp WHERE rp.id = rate_plan_id AND fn_is_same_hotel(rp.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM rate_plans rp WHERE rp.id = rate_plan_id AND fn_is_same_hotel(rp.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ---------------------------------------------------------------------------
-- 2.20 services (INSERT, UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY services_insert ON services FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY services_update ON services FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY services_delete ON services FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ---------------------------------------------------------------------------
-- 2.21 notifications (INSERT, UPDATE, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY notifications_insert ON notifications FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id));

CREATE POLICY notifications_update ON notifications FOR UPDATE
    USING (fn_is_same_hotel(hotel_id))
    WITH CHECK (fn_is_same_hotel(hotel_id));

CREATE POLICY notifications_delete ON notifications FOR DELETE
    USING (fn_is_same_hotel(hotel_id));

-- ---------------------------------------------------------------------------
-- 2.22 notification_recipients (INSERT, DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY notification_recipients_insert ON notification_recipients FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM notifications n WHERE n.id = notification_id AND fn_is_same_hotel(n.hotel_id)
    ));

CREATE POLICY notification_recipients_delete ON notification_recipients FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM notifications n WHERE n.id = notification_id AND fn_is_same_hotel(n.hotel_id)
    ));

-- ---------------------------------------------------------------------------
-- 2.23 reviews (DELETE)
-- ---------------------------------------------------------------------------
CREATE POLICY reviews_delete ON reviews FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'review.respond'));

-- ---------------------------------------------------------------------------
-- 2.24 permissions (DELETE for service_role)
-- ---------------------------------------------------------------------------
CREATE POLICY permissions_delete ON permissions FOR DELETE
    USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2.25 role_permissions (UPDATE)
-- ---------------------------------------------------------------------------
CREATE POLICY role_permissions_update ON role_permissions FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM roles r WHERE r.id = role_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM roles r WHERE r.id = role_id AND fn_is_same_hotel(r.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- ---------------------------------------------------------------------------
-- 2.26 employee_roles (UPDATE)
-- ---------------------------------------------------------------------------
CREATE POLICY employee_roles_update ON employee_roles FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM employees e WHERE e.id = employee_id AND fn_is_same_hotel(e.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM employees e WHERE e.id = employee_id AND fn_is_same_hotel(e.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- ---------------------------------------------------------------------------
-- 2.27 audit_logs (UPDATE, DELETE — restricted)
-- ---------------------------------------------------------------------------
CREATE POLICY audit_logs_update ON audit_logs FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY audit_logs_delete ON audit_logs FOR DELETE
    USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2.28 currencies (INSERT, UPDATE, DELETE — global reference)
-- ---------------------------------------------------------------------------
CREATE POLICY currencies_insert ON currencies FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY currencies_update ON currencies FOR UPDATE
    USING (auth.role() = 'service_role');

CREATE POLICY currencies_delete ON currencies FOR DELETE
    USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. AUTO-GENERATION booking_reference
-- ============================================================================
-- Remplace fn_generate_booking_reference par une version utilisant une séquence
-- atomique (évite les collisions du random).
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seq_booking_reference START 1;

CREATE OR REPLACE FUNCTION fn_generate_booking_reference(p_hotel_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_seq INTEGER;
BEGIN
    v_year := to_char(now(), 'YYYY');
    v_seq := nextval('seq_booking_reference');
    RETURN 'EDEN-' || v_year || '-' || lpad(v_seq::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE INSERT pour auto-générer booking_reference si vide
CREATE OR REPLACE FUNCTION fn_auto_booking_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_reference IS NULL OR NEW.booking_reference = '' THEN
        NEW.booking_reference := fn_generate_booking_reference(NEW.hotel_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_auto_reference
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_booking_reference();

-- ============================================================================
-- 4. CORRECTION fn_apply_season_pricing (pourcentage ÷100 au lieu de ÷10000)
-- ============================================================================

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
            -- CORRECTION : divisé par 100 (et non 10000) car value est un pourcentage (ex: 10 pour 10%)
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
            v_result := v_season.value;
        ELSE
            v_result := v_base_price;
    END CASE;

    RETURN GREATEST(v_result, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 5. CORRECTION fn_booking_status_history (changed_by_type + fallback)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_booking_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
    v_changed_by_type TEXT;
BEGIN
    v_employee_id := fn_get_current_employee();

    -- Déterminer le type de changement
    IF v_employee_id IS NOT NULL THEN
        v_changed_by_type := 'employee';
    ELSE
        v_changed_by_type := 'system';
    END IF;

    INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by, changed_by_type)
    VALUES (NEW.id, OLD.status, NEW.status, v_employee_id, v_changed_by_type);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. INDEX MANQUANTS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_booking_guests_booking_id ON booking_guests (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_booking_id ON booking_services (booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_services_service_id ON booking_services (service_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions (role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions (permission_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_employee_id ON employee_roles (employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_role_id ON employee_roles (role_id);

-- ============================================================================
-- FIN DE LA MIGRATION 067
-- ============================================================================
