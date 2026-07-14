-- ============================================================================
-- EDEN: Luxury Management — Migration 020 : Indexes
-- ============================================================================
-- Index requis pour les performances du système multi-tenant.
-- ============================================================================

-- -------------------------------------------------------------------------
-- hotels
-- -------------------------------------------------------------------------
CREATE INDEX idx_hotels_active ON hotels (is_active) WHERE is_active = true;

-- -------------------------------------------------------------------------
-- rooms
-- -------------------------------------------------------------------------
CREATE INDEX idx_rooms_hotel_id_status ON rooms (hotel_id, status);
CREATE INDEX idx_rooms_type_id ON rooms (room_type_id);
CREATE INDEX idx_rooms_building_floor ON rooms (building_id, floor_id);
CREATE INDEX idx_rooms_available ON rooms (hotel_id) WHERE status = 'available' AND is_active = true;

-- -------------------------------------------------------------------------
-- room_types
-- -------------------------------------------------------------------------
CREATE INDEX idx_room_types_hotel_id ON room_types (hotel_id);

-- -------------------------------------------------------------------------
-- guests
-- -------------------------------------------------------------------------
CREATE INDEX idx_guests_hotel_id_email ON guests (hotel_id, email);
CREATE INDEX idx_guests_hotel_id_phone ON guests (hotel_id, phone);
CREATE INDEX idx_guests_document ON guests (document_type, document_number);

-- -------------------------------------------------------------------------
-- employees
-- -------------------------------------------------------------------------
CREATE INDEX idx_employees_hotel_id ON employees (hotel_id);
CREATE INDEX idx_employees_auth_user ON employees (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- -------------------------------------------------------------------------
-- bookings
-- -------------------------------------------------------------------------
CREATE INDEX idx_bookings_hotel_id_status ON bookings (hotel_id, status);
CREATE INDEX idx_bookings_hotel_id_dates ON bookings (hotel_id, check_in_date, check_out_date);
CREATE INDEX idx_bookings_reference ON bookings (booking_reference);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_active ON bookings (hotel_id, check_in_date, check_out_date)
    WHERE status IN ('pending', 'confirmed', 'checked_in', 'checked_out');

-- -------------------------------------------------------------------------
-- booking_rooms
-- -------------------------------------------------------------------------
CREATE INDEX idx_booking_rooms_room_id_dates ON booking_rooms (room_id, check_in_date, check_out_date);
CREATE INDEX idx_booking_rooms_booking_id ON booking_rooms (booking_id);
-- Index pour l'exclusion constraint d'overlap (utilise btree_gist)
CREATE INDEX idx_booking_rooms_daterange ON booking_rooms USING gist (
    room_id,
    daterange(check_in_date, check_out_date, '[)')
) WHERE status IN ('reserved', 'occupied');

-- -------------------------------------------------------------------------
-- booking_guests
-- -------------------------------------------------------------------------
CREATE INDEX idx_booking_guests_guest_id ON booking_guests (guest_id);
CREATE UNIQUE INDEX idx_booking_guests_unique_primary ON booking_guests (booking_id) WHERE role = 'primary_guest';

-- -------------------------------------------------------------------------
-- payments
-- -------------------------------------------------------------------------
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_payments_hotel_id_status ON payments (hotel_id, status);

-- -------------------------------------------------------------------------
-- invoices
-- -------------------------------------------------------------------------
CREATE INDEX idx_invoices_booking_id ON invoices (booking_id);
CREATE INDEX idx_invoices_hotel_id_number ON invoices (hotel_id, invoice_number);

-- -------------------------------------------------------------------------
-- notifications
-- -------------------------------------------------------------------------
CREATE INDEX idx_notifications_hotel_id ON notifications (hotel_id);

-- -------------------------------------------------------------------------
-- notification_recipients
-- -------------------------------------------------------------------------
CREATE INDEX idx_notif_recipients_unread ON notification_recipients (recipient_type, recipient_id, status);

-- -------------------------------------------------------------------------
-- audit_logs
-- -------------------------------------------------------------------------
CREATE INDEX idx_audit_logs_hotel_id_created ON audit_logs (hotel_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

-- -------------------------------------------------------------------------
-- booking_status_history
-- -------------------------------------------------------------------------
CREATE INDEX idx_booking_status_history_booking ON booking_status_history (booking_id, created_at DESC);

-- -------------------------------------------------------------------------
-- room_status_history
-- -------------------------------------------------------------------------
CREATE INDEX idx_room_status_history_room ON room_status_history (room_id, created_at DESC);

-- -------------------------------------------------------------------------
-- seasons
-- -------------------------------------------------------------------------
CREATE INDEX idx_seasons_hotel_id_dates ON seasons (hotel_id, start_date, end_date);

-- -------------------------------------------------------------------------
-- rate_plan_room_types
-- -------------------------------------------------------------------------
CREATE INDEX idx_rate_plan_room_types_plan ON rate_plan_room_types (rate_plan_id);
CREATE INDEX idx_rate_plan_room_types_type ON rate_plan_room_types (room_type_id);
