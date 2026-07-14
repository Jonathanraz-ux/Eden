-- ============================================================================
-- EDEN: Luxury Management — Migration 050 : Row Level Security (RLS)
-- ============================================================================
-- Active RLS sur toutes les tables métier et crée les politiques
-- d'isolation multi-tenant basées sur hotel_id.
--
-- Principe : un employé ne voit que les données de son hôtel.
-- Les permissions contrôlent les actions sensibles.
-- ============================================================================

-- ============================================================================
-- Activation RLS
-- ============================================================================

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_type_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plan_room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Utilitaires RLS
-- ============================================================================

-- Un employé peut lire les données de son hôtel
CREATE OR REPLACE FUNCTION fn_is_same_hotel(p_hotel_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_hotel_id = fn_get_current_hotel_id();
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- POLICIES : CORE (hotels, hotel_settings, buildings, floors, media)
-- ============================================================================

-- hotels : tout employé de l'hôtel peut voir, seul le système modifie
CREATE POLICY hotels_select ON hotels FOR SELECT
    USING (id = fn_get_current_hotel_id() OR auth.role() = 'service_role');

CREATE POLICY hotels_update ON hotels FOR UPDATE
    USING (id = fn_get_current_hotel_id() AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (id = fn_get_current_hotel_id() AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- hotel_settings
CREATE POLICY hotel_settings_select ON hotel_settings FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

CREATE POLICY hotel_settings_insert ON hotel_settings FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

CREATE POLICY hotel_settings_update ON hotel_settings FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'settings.update'));

-- buildings, floors, media
CREATE POLICY buildings_select ON buildings FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY floors_select ON floors FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY media_select ON media FOR SELECT USING (fn_is_same_hotel(hotel_id));

-- ============================================================================
-- POLICIES : ROOMS (room_types, rooms, amenities, room_amenities, room_type_amenities)
-- ============================================================================

CREATE POLICY room_types_select ON room_types FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY rooms_select ON rooms FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY amenities_select ON amenities FOR SELECT USING (fn_is_same_hotel(hotel_id));

-- room_amenities et room_type_amenities : accès via les tables parentes
CREATE POLICY room_amenities_select ON room_amenities FOR SELECT
    USING (EXISTS (SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)));

CREATE POLICY room_type_amenities_select ON room_type_amenities FOR SELECT
    USING (EXISTS (SELECT 1 FROM room_types rt WHERE rt.id = room_type_id AND fn_is_same_hotel(rt.hotel_id)));

-- Modifications rooms (permission room.manage pour les actions courantes)
CREATE POLICY rooms_insert ON rooms FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

CREATE POLICY rooms_update ON rooms FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.manage'));

-- Maintenance nécessite une permission spécifique
CREATE POLICY rooms_maintenance ON rooms FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.maintenance'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'room.maintenance')
                AND status IN ('maintenance', 'out_of_service'));

-- ============================================================================
-- POLICIES : GUESTS
-- ============================================================================

CREATE POLICY guests_select ON guests FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY guests_insert ON guests FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'guest.manage'));

CREATE POLICY guests_update ON guests FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'guest.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'guest.manage'));

-- ============================================================================
-- POLICIES : EMPLOYEES
-- ============================================================================

CREATE POLICY employees_select ON employees FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY employees_insert ON employees FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

CREATE POLICY employees_update ON employees FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- Un employé peut modifier son propre profil (hors auth_user_id et supervisor_id,
-- protégés via trigger trg_employees_protect_sensitive_fields)
CREATE POLICY employees_self_update ON employees FOR UPDATE
    USING (id = fn_get_current_employee())
    WITH CHECK (id = fn_get_current_employee());

-- ============================================================================
-- POLICIES : ROLES & PERMISSIONS
-- ============================================================================

-- permissions : lisible globalement
CREATE POLICY permissions_select ON permissions FOR SELECT USING (true);
CREATE POLICY permissions_insert ON permissions FOR INSERT
    WITH CHECK (auth.role() = 'service_role');
CREATE POLICY permissions_update ON permissions FOR UPDATE
    USING (auth.role() = 'service_role');

-- roles : lié à un hôtel
CREATE POLICY roles_select ON roles FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY roles_insert ON roles FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));
CREATE POLICY roles_update ON roles FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- role_permissions : accessible via le rôle
CREATE POLICY role_permissions_select ON role_permissions FOR SELECT
    USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND fn_is_same_hotel(r.hotel_id)));

CREATE POLICY role_permissions_insert ON role_permissions FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND fn_is_same_hotel(r.hotel_id))
                AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

CREATE POLICY role_permissions_delete ON role_permissions FOR DELETE
    USING (EXISTS (SELECT 1 FROM roles r WHERE r.id = role_id AND fn_is_same_hotel(r.hotel_id))
           AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- employee_roles
CREATE POLICY employee_roles_select ON employee_roles FOR SELECT
    USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND fn_is_same_hotel(e.hotel_id)));

CREATE POLICY employee_roles_insert ON employee_roles FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND fn_is_same_hotel(e.hotel_id))
                AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

CREATE POLICY employee_roles_delete ON employee_roles FOR DELETE
    USING (EXISTS (SELECT 1 FROM employees e WHERE e.id = employee_id AND fn_is_same_hotel(e.hotel_id))
           AND fn_has_permission(fn_get_current_employee(), 'employee.manage'));

-- ============================================================================
-- POLICIES : BOOKINGS
-- ============================================================================

CREATE POLICY bookings_select ON bookings FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY bookings_insert ON bookings FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

CREATE POLICY bookings_update ON bookings FOR UPDATE
    USING (fn_is_same_hotel(hotel_id))
    WITH CHECK (fn_is_same_hotel(hotel_id));

-- booking_rooms, booking_guests, booking_services : via le booking parent
CREATE POLICY booking_rooms_select ON booking_rooms FOR SELECT
    USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)));

CREATE POLICY booking_rooms_insert ON booking_rooms FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id))
                AND fn_has_permission(fn_get_current_employee(), 'booking.create'));

CREATE POLICY booking_rooms_update ON booking_rooms FOR UPDATE
    USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)));

CREATE POLICY booking_guests_select ON booking_guests FOR SELECT
    USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)));

CREATE POLICY booking_services_select ON booking_services FOR SELECT
    USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)));

CREATE POLICY booking_status_history_select ON booking_status_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND fn_is_same_hotel(b.hotel_id)));

CREATE POLICY room_status_history_select ON room_status_history FOR SELECT
    USING (EXISTS (SELECT 1 FROM rooms r WHERE r.id = room_id AND fn_is_same_hotel(r.hotel_id)));

-- ============================================================================
-- POLICIES : FINANCE (payments, invoices, invoice_items, invoice_sequences)
-- ============================================================================

CREATE POLICY payments_select ON payments FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY payments_insert ON payments FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'payment.create'));

-- Les refunds nécessitent une permission spécifique
CREATE POLICY payments_refund ON payments FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id)
                AND type = 'refund'
                AND fn_has_permission(fn_get_current_employee(), 'payment.refund'));

CREATE POLICY invoices_select ON invoices FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY invoices_insert ON invoices FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

CREATE POLICY invoices_update ON invoices FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'invoice.generate'));

CREATE POLICY invoice_items_select ON invoice_items FOR SELECT
    USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_id AND fn_is_same_hotel(i.hotel_id)));

CREATE POLICY invoice_sequences_select ON invoice_sequences FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

-- taxes, discounts, rate_plans, seasons, services
CREATE POLICY taxes_select ON taxes FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY discounts_select ON discounts FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY rate_plans_select ON rate_plans FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY seasons_select ON seasons FOR SELECT USING (fn_is_same_hotel(hotel_id));
CREATE POLICY services_select ON services FOR SELECT USING (fn_is_same_hotel(hotel_id));

-- rate_plan_room_types
CREATE POLICY rate_plan_room_types_select ON rate_plan_room_types FOR SELECT
    USING (EXISTS (SELECT 1 FROM rate_plans rp WHERE rp.id = rate_plan_id AND fn_is_same_hotel(rp.hotel_id)));

-- currencies : lisible globalement
CREATE POLICY currencies_select ON currencies FOR SELECT USING (true);

-- ============================================================================
-- POLICIES : NOTIFICATIONS
-- ============================================================================

CREATE POLICY notifications_select ON notifications FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY notification_recipients_select ON notification_recipients FOR SELECT
    USING (EXISTS (SELECT 1 FROM notifications n WHERE n.id = notification_id AND fn_is_same_hotel(n.hotel_id)));

-- ============================================================================
-- POLICIES : REVIEWS
-- ============================================================================

CREATE POLICY reviews_select ON reviews FOR SELECT USING (fn_is_same_hotel(hotel_id));

CREATE POLICY reviews_insert ON reviews FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id));

-- Réponse de l'hôtel nécessite permission spécifique
CREATE POLICY reviews_respond ON reviews FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'review.respond'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'review.respond'));

-- ============================================================================
-- POLICIES : AUDIT LOGS
-- ============================================================================

CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'audit.view'));

-- Insertion dans audit_logs : système uniquement
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
    WITH CHECK (auth.role() = 'service_role' OR fn_is_same_hotel(hotel_id));
