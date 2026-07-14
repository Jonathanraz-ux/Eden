-- ============================================================================
-- EDEN: Luxury Management — Migration 040 : Triggers
-- ============================================================================
-- Tous les triggers métier. Dépendent des fonctions créées dans 030_functions.sql.
-- ============================================================================

-- ============================================================================
-- updated_at automatique
-- ============================================================================

CREATE TRIGGER trg_hotels_updated_at
    BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_hotel_settings_updated_at
    BEFORE UPDATE ON hotel_settings
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_buildings_updated_at
    BEFORE UPDATE ON buildings
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_floors_updated_at
    BEFORE UPDATE ON floors
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_room_types_updated_at
    BEFORE UPDATE ON room_types
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_amenities_updated_at
    BEFORE UPDATE ON amenities
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_guests_updated_at
    BEFORE UPDATE ON guests
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_booking_rooms_updated_at
    BEFORE UPDATE ON booking_rooms
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_rate_plans_updated_at
    BEFORE UPDATE ON rate_plans
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_seasons_updated_at
    BEFORE UPDATE ON seasons
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- ============================================================================
-- Booking Rooms : vérification de disponibilité (double booking)
-- ============================================================================

CREATE TRIGGER trg_booking_rooms_check_overlap
    BEFORE INSERT OR UPDATE ON booking_rooms
    FOR EACH ROW EXECUTE FUNCTION fn_check_room_availability();

-- ============================================================================
-- Booking Rooms : calcul du night_count
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_calc_booking_room_nights()
RETURNS TRIGGER AS $$
BEGIN
    NEW.night_count := NEW.check_out_date - NEW.check_in_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_rooms_calc_nights
    BEFORE INSERT OR UPDATE ON booking_rooms
    FOR EACH ROW
    EXECUTE FUNCTION fn_calc_booking_room_nights();

-- ============================================================================
-- Bookings : calcul du night_count
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_calc_booking_nights()
RETURNS TRIGGER AS $$
BEGIN
    NEW.night_count := NEW.check_out_date - NEW.check_in_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_calc_nights
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION fn_calc_booking_nights();

-- ============================================================================
-- Recalcul du total d'un booking après modification des booking_rooms
-- ou des booking_services
-- ============================================================================

CREATE TRIGGER trg_booking_rooms_update_total
    AFTER INSERT OR UPDATE OR DELETE ON booking_rooms
    FOR EACH ROW EXECUTE FUNCTION fn_calculate_booking_total_trigger();

CREATE TRIGGER trg_booking_services_update_total
    AFTER INSERT OR UPDATE OR DELETE ON booking_services
    FOR EACH ROW EXECUTE FUNCTION fn_calculate_booking_total_trigger();

-- ============================================================================
-- Recalcul des finances (paid_amount, balance) après modification des payments
-- ============================================================================

CREATE TRIGGER trg_payments_update_finances
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION fn_recalculate_booking_finances_trigger();

-- ============================================================================
-- Protection des colonnes financières dans bookings :
-- paid_amount_cents et balance_cents ne doivent pas être modifiés manuellement
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_protect_booking_finances()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.paid_amount_cents IS DISTINCT FROM NEW.paid_amount_cents
       OR OLD.balance_cents IS DISTINCT FROM NEW.balance_cents THEN
        RAISE EXCEPTION 'Les colonnes paid_amount_cents et balance_cents sont calculées automatiquement et ne peuvent pas être modifiées manuellement.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_protect_finances
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    WHEN (OLD.paid_amount_cents IS DISTINCT FROM NEW.paid_amount_cents
          OR OLD.balance_cents IS DISTINCT FROM NEW.balance_cents)
    EXECUTE FUNCTION fn_protect_booking_finances();

-- ============================================================================
-- Blocage du check-out si le solde est positif (sauf permission force_checkout)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_block_checkout_with_balance()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    IF NEW.status = 'checked_out'
       AND OLD.status IN ('confirmed', 'checked_in')
       AND NEW.balance_cents > 0 THEN

        v_employee_id := fn_get_current_employee();

        IF v_employee_id IS NULL
           OR NOT fn_has_permission(v_employee_id, 'booking.force_checkout') THEN
            RAISE EXCEPTION 'Impossible de passer en check-out : solde de % cents impayé. Permission booking.force_checkout requise.',
                NEW.balance_cents;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_checkout_balance
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'checked_out' AND OLD.status IN ('confirmed', 'checked_in'))
    EXECUTE FUNCTION fn_block_checkout_with_balance();

-- ============================================================================
-- Historique des statuts (booking_status_history)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_booking_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    v_employee_id := fn_get_current_employee();

    INSERT INTO booking_status_history (booking_id, previous_status, new_status, changed_by, changed_by_type)
    VALUES (NEW.id, OLD.status, NEW.status, COALESCE(v_employee_id, NEW.id), 'employee');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_status_history
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_booking_status_history();

-- ============================================================================
-- Historique des statuts (room_status_history)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_room_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    v_employee_id := fn_get_current_employee();

    INSERT INTO room_status_history (room_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, v_employee_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rooms_status_history
    AFTER UPDATE OF status ON rooms
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_room_status_history();

-- ============================================================================
-- Audit logs pour les changements de statut
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_audit_booking_status()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    v_employee_id := fn_get_current_employee();

    INSERT INTO audit_logs (hotel_id, employee_id, action, entity_type, entity_id, old_value, new_value)
    VALUES (NEW.hotel_id, v_employee_id, 'booking.' || NEW.status, 'booking', NEW.id,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_audit_status
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_audit_booking_status();


CREATE OR REPLACE FUNCTION fn_audit_room_status()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
BEGIN
    v_employee_id := fn_get_current_employee();

    INSERT INTO audit_logs (hotel_id, employee_id, action, entity_type, entity_id, old_value, new_value)
    VALUES ((SELECT hotel_id FROM rooms WHERE id = NEW.id), v_employee_id, 'room.' || NEW.status, 'room', NEW.id,
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rooms_audit_status
    AFTER UPDATE OF status ON rooms
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION fn_audit_room_status();

-- ============================================================================
-- Notification automatique lors d'un changement de statut d'un booking
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_notify_booking_status()
RETURNS TRIGGER AS $$
DECLARE
    v_notification_id UUID;
    v_hotel_id UUID;
    v_primary_guest_id UUID;
    v_primary_guest_type TEXT;
BEGIN
    v_hotel_id := NEW.hotel_id;

    -- Créer la notification
    INSERT INTO notifications (hotel_id, booking_id, title, body, category, sender_type)
    VALUES (v_hotel_id, NEW.id,
            'Statut réservation modifié',
            'La réservation ' || NEW.booking_reference || ' est passée en statut : ' || NEW.status,
            CASE
                WHEN NEW.status IN ('confirmed', 'checked_in') THEN 'confirmation'
                WHEN NEW.status IN ('cancelled', 'no_show', 'expired') THEN 'alert'
                WHEN NEW.status = 'checked_out' THEN 'invoice'
                ELSE 'internal'
            END,
            'system')
    RETURNING id INTO v_notification_id;

    -- Trouver le primary guest et lui envoyer une notification
    SELECT bg.guest_id, 'guest' INTO v_primary_guest_id, v_primary_guest_type
    FROM booking_guests bg
    WHERE bg.booking_id = NEW.id
      AND bg.role = 'primary_guest'
    LIMIT 1;

    IF v_primary_guest_id IS NOT NULL THEN
        INSERT INTO notification_recipients (notification_id, recipient_type, recipient_id, channel)
        VALUES (v_notification_id, v_primary_guest_type, v_primary_guest_id, 'email');

        INSERT INTO notification_recipients (notification_id, recipient_type, recipient_id, channel)
        VALUES (v_notification_id, v_primary_guest_type, v_primary_guest_id, 'in_app');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_notify_status
    AFTER UPDATE OF status ON bookings
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status
          AND NEW.status IN ('confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'expired'))
    EXECUTE FUNCTION fn_notify_booking_status();

-- ============================================================================
-- Protection des champs sensibles employés (auth_user_id, supervisor_id)
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_protect_employee_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id THEN
        RAISE EXCEPTION 'La colonne auth_user_id ne peut pas être modifiée.';
    END IF;
    IF OLD.supervisor_id IS DISTINCT FROM NEW.supervisor_id THEN
        RAISE EXCEPTION 'La colonne supervisor_id ne peut pas être modifiée directement. Utilisez la gestion des équipes.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_employees_protect_sensitive_fields
    BEFORE UPDATE ON employees
    FOR EACH ROW
    WHEN (OLD.auth_user_id IS DISTINCT FROM NEW.auth_user_id
          OR OLD.supervisor_id IS DISTINCT FROM NEW.supervisor_id)
    EXECUTE FUNCTION fn_protect_employee_sensitive_fields();
