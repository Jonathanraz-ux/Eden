-- ============================================================================
-- EDEN: Luxury Management — Migration 066 : Fix Missing RLS Policies
-- ============================================================================
-- Ajoute les politiques INSERT/UPDATE/DELETE manquantes sur les tables
-- pré-existantes qui avaient uniquement des politiques SELECT.
--
-- Causes des erreurs 403 (Forbidden) :
--   - invoice_items        : INSERT, DELETE (via invoices)
--   - taxes                : INSERT, UPDATE, DELETE
--   - discounts            : INSERT, UPDATE, DELETE
--   - rate_plans           : INSERT, UPDATE, DELETE
--   - rate_plan_room_types : INSERT, DELETE (via rate_plans)
--   - seasons              : INSERT, UPDATE, DELETE
--   - booking_guests       : INSERT (via bookings)
--   - notification_recipients : UPDATE (via notifications)
-- ============================================================================

-- ============================================================================
-- booking_guests : INSERT via la réservation parente
-- ============================================================================
CREATE POLICY booking_guests_insert ON booking_guests FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

-- ============================================================================
-- invoice_items : INSERT, DELETE via la facture parente
-- ============================================================================
CREATE POLICY invoice_items_insert ON invoice_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.id = invoice_id AND fn_is_same_hotel(i.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

CREATE POLICY invoice_items_delete ON invoice_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM invoices i
        WHERE i.id = invoice_id AND fn_is_same_hotel(i.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

-- ============================================================================
-- taxes : INSERT, UPDATE, DELETE (paramètres hôtel)
-- ============================================================================
CREATE POLICY taxes_insert ON taxes FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY taxes_update ON taxes FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY taxes_delete ON taxes FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ============================================================================
-- discounts : INSERT, UPDATE, DELETE (paramètres hôtel)
-- ============================================================================
CREATE POLICY discounts_insert ON discounts FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY discounts_update ON discounts FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY discounts_delete ON discounts FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ============================================================================
-- rate_plans : INSERT, UPDATE, DELETE (paramètres tarifs)
-- ============================================================================
CREATE POLICY rate_plans_insert ON rate_plans FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY rate_plans_update ON rate_plans FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY rate_plans_delete ON rate_plans FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ============================================================================
-- rate_plan_room_types : INSERT, DELETE via le rate_plan parent
-- ============================================================================
CREATE POLICY rate_plan_room_types_insert ON rate_plan_room_types FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM rate_plans rp
        WHERE rp.id = rate_plan_id AND fn_is_same_hotel(rp.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY rate_plan_room_types_delete ON rate_plan_room_types FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM rate_plans rp
        WHERE rp.id = rate_plan_id AND fn_is_same_hotel(rp.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ============================================================================
-- seasons : INSERT, UPDATE, DELETE (paramètres saisonniers)
-- ============================================================================
CREATE POLICY seasons_insert ON seasons FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY seasons_update ON seasons FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY seasons_delete ON seasons FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- ============================================================================
-- notification_recipients : UPDATE (marquer comme lu) via la notification parente
-- ============================================================================
CREATE POLICY notification_recipients_update ON notification_recipients FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.id = notification_id AND fn_is_same_hotel(n.hotel_id)
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.id = notification_id AND fn_is_same_hotel(n.hotel_id)
    ));
