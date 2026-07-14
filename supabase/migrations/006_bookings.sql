-- ============================================================================
-- EDEN: Luxury Management — Migration 006 : Bookings
-- ============================================================================
-- bookings              → réservation principale
-- booking_rooms         → association réservation ↔ chambre (permet multi-chambres)
-- booking_guests        → association réservation ↔ client
-- booking_services      → services achetés dans une réservation
-- booking_status_history→ historique des changements de statut (immuable)
-- room_status_history   → historique des changements de statut des chambres (immuable)
--
-- Note : les FK vers rate_plans (bookings.rate_plan_id) et services
-- (booking_services.service_id) sont ajoutées dans 007_finance.sql
-- après création des tables respectives.
-- ============================================================================

-- -------------------------------------------------------------------------
-- bookings
-- -------------------------------------------------------------------------
CREATE TABLE bookings (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id             UUID NOT NULL REFERENCES hotels(id),
    rate_plan_id         UUID NOT NULL,  -- FK ajoutée dans 007_finance.sql
    booking_reference    TEXT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    check_in_date        DATE NOT NULL,
    check_out_date       DATE NOT NULL,
    night_count          SMALLINT NOT NULL CHECK (night_count > 0),
    status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','confirmed','checked_in','checked_out','completed','cancelled','no_show','expired')),
    total_amount_cents   INTEGER NOT NULL DEFAULT 0 CHECK (total_amount_cents >= 0),
    paid_amount_cents    INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0),
    balance_cents        INTEGER NOT NULL DEFAULT 0,
    currency_code        TEXT NOT NULL,
    source               TEXT,
    special_requests     TEXT,
    internal_notes       TEXT,
    confirmed_at         TIMESTAMPTZ,
    cancelled_at         TIMESTAMPTZ,
    cancellation_reason  TEXT,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at           TIMESTAMPTZ,
    CHECK (check_out_date > check_in_date),
    CHECK (night_count = (check_out_date - check_in_date)),
    CHECK (balance_cents = total_amount_cents - paid_amount_cents)
);

-- -------------------------------------------------------------------------
-- booking_rooms
-- -------------------------------------------------------------------------
CREATE TABLE booking_rooms (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id           UUID NOT NULL REFERENCES bookings(id),
    room_id              UUID NOT NULL REFERENCES rooms(id),
    check_in_date        DATE NOT NULL,
    check_out_date       DATE NOT NULL,
    night_count          SMALLINT NOT NULL CHECK (night_count > 0),
    adult_count          SMALLINT NOT NULL DEFAULT 1 CHECK (adult_count > 0),
    child_count          SMALLINT NOT NULL DEFAULT 0 CHECK (child_count >= 0),
    applied_price_cents  INTEGER NOT NULL CHECK (applied_price_cents >= 0),
    status               TEXT NOT NULL DEFAULT 'reserved'
                         CHECK (status IN ('reserved','occupied','vacated','cancelled')),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (check_out_date > check_in_date),
    CHECK (night_count = (check_out_date - check_in_date))
);

-- -------------------------------------------------------------------------
-- booking_guests
-- -------------------------------------------------------------------------
CREATE TABLE booking_guests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    guest_id        UUID NOT NULL REFERENCES guests(id),
    role            TEXT NOT NULL DEFAULT 'adult'
                    CHECK (role IN ('primary_guest','adult','child','infant','billing_contact')),
    is_payer        BOOLEAN NOT NULL DEFAULT false,
    is_main_contact BOOLEAN NOT NULL DEFAULT false,
    check_in_date   DATE,
    check_out_date  DATE,
    UNIQUE (booking_id, guest_id)
);

-- -------------------------------------------------------------------------
-- booking_services (prix figé au moment de l'achat)
-- -------------------------------------------------------------------------
CREATE TABLE booking_services (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        UUID NOT NULL REFERENCES bookings(id),
    service_id        UUID NOT NULL,  -- FK ajoutée dans 007_finance.sql
    booking_guest_id  UUID REFERENCES booking_guests(id),
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents  INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
    service_date      DATE,
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','delivered','cancelled')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- booking_status_history (immuable : pas de UPDATE, pas de DELETE)
-- -------------------------------------------------------------------------
CREATE TABLE booking_status_history (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id        UUID NOT NULL REFERENCES bookings(id),
    previous_status   TEXT,
    new_status        TEXT NOT NULL,
    changed_by        UUID,
    changed_by_type   TEXT CHECK (changed_by_type IN ('employee','guest','system')),
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- room_status_history (immuable : pas de UPDATE, pas de DELETE)
-- -------------------------------------------------------------------------
CREATE TABLE room_status_history (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id           UUID NOT NULL REFERENCES rooms(id),
    previous_status   TEXT,
    new_status        TEXT NOT NULL,
    changed_by        UUID,
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
