-- ============================================================================
-- EDEN: Luxury Management — Migration 009 : Reviews
-- ============================================================================
-- reviews → avis clients (booking_id optionnel pour les imports externes)
-- ============================================================================

CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id),
    guest_id        UUID NOT NULL REFERENCES guests(id),
    booking_id      UUID REFERENCES bookings(id),
    rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title           TEXT,
    comment         TEXT,
    stay_date_start DATE,
    stay_date_end   DATE,
    platform        TEXT,
    hotel_reply     TEXT,
    internal_note   TEXT,
    is_visible      BOOLEAN NOT NULL DEFAULT true,
    is_verified     BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);
