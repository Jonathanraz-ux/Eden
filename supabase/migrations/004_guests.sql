-- ============================================================================
-- EDEN: Luxury Management — Migration 004 : Guests
-- ============================================================================
-- guests → clients de l'établissement
-- Note : pas de compte guest en V1 (pas de portail client).
-- Un guest est toujours rattaché à un hôtel.
-- ============================================================================

CREATE TABLE guests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id          UUID NOT NULL REFERENCES hotels(id),
    type              TEXT NOT NULL DEFAULT 'individual'
                      CHECK (type IN ('individual','company','agency','partner')),
    first_name        TEXT,
    last_name         TEXT NOT NULL,
    email             TEXT,
    phone             TEXT,
    document_type     TEXT,
    document_number   TEXT,
    document_expiry   DATE,
    birth_date        DATE,
    nationality       TEXT,
    address           JSONB,
    preferences       JSONB,
    first_stay_date   DATE,
    stay_count        INTEGER NOT NULL DEFAULT 0 CHECK (stay_count >= 0),
    segment           TEXT,
    loyalty_program   JSONB,
    is_active         BOOLEAN NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);
