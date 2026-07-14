-- ============================================================================
-- EDEN: Luxury Management — Migration 002 : Core
-- ============================================================================
-- Tables racines du système multi-tenant.
-- hotels         → établissement hôtelier (racine multi-tenant)
-- hotel_settings → paramètres de fonctionnment (1:1 avec hotels)
-- buildings      → bâtiments d'un hôtel (optionnel)
-- floors         → étages (optionnel)
-- media          → images et documents attachés aux entités
-- ============================================================================

-- -------------------------------------------------------------------------
-- hotels
-- -------------------------------------------------------------------------
CREATE TABLE hotels (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    brand           TEXT,
    address_line_1  TEXT,
    address_line_2  TEXT,
    city            TEXT,
    postal_code     TEXT,
    region          TEXT,
    country         TEXT NOT NULL,
    star_rating     SMALLINT CHECK (star_rating >= 1 AND star_rating <= 5),
    phone           TEXT,
    email           TEXT,
    website         TEXT,
    currency_code   TEXT NOT NULL,
    default_language TEXT NOT NULL,
    timezone        TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- hotel_settings
-- -------------------------------------------------------------------------
CREATE TABLE hotel_settings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id            UUID NOT NULL UNIQUE REFERENCES hotels(id),
    cancellation_policy JSONB,
    no_show_policy      JSONB,
    expiration_delay    INTERVAL NOT NULL DEFAULT '24:00:00',
    check_in_time       TIME NOT NULL DEFAULT '15:00',
    check_out_time      TIME NOT NULL DEFAULT '11:00',
    default_vat_rate    INTEGER,
    cleaning_fee_cents  INTEGER,
    deposit_required    BOOLEAN NOT NULL DEFAULT false,
    deposit_amount_cents INTEGER,
    languages_available TEXT[],
    custom_settings     JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- buildings
-- -------------------------------------------------------------------------
CREATE TABLE buildings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    name        TEXT NOT NULL,
    code        TEXT,
    description TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- floors
-- -------------------------------------------------------------------------
CREATE TABLE floors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    building_id UUID REFERENCES buildings(id),
    name        TEXT NOT NULL,
    level       SMALLINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- media
-- -------------------------------------------------------------------------
CREATE TABLE media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('hotel', 'room', 'room_type')),
    entity_id   UUID NOT NULL,
    url         TEXT NOT NULL,
    alt_text    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_primary  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
