-- ============================================================================
-- EDEN: Luxury Management — Migration 003 : Rooms
-- ============================================================================
-- room_types        → catégories de chambres (Standard, Deluxe, Suite…)
-- rooms             → unités physiques d'hébergement
-- amenities         → équipements (multilingue, iconifiés, filtrables)
-- room_amenities    → association chambre ↔ équipement
-- room_type_amenities → équipements par défaut d'un type de chambre
-- ============================================================================

-- -------------------------------------------------------------------------
-- room_types
-- -------------------------------------------------------------------------
CREATE TABLE room_types (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id          UUID NOT NULL REFERENCES hotels(id),
    name              TEXT NOT NULL,
    description       TEXT,
    base_capacity     SMALLINT NOT NULL CHECK (base_capacity > 0),
    base_price_cents  INTEGER NOT NULL CHECK (base_price_cents >= 0),
    surface_m2        DECIMAL(6,1),
    is_active         BOOLEAN NOT NULL DEFAULT true,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- rooms
-- -------------------------------------------------------------------------
CREATE TABLE rooms (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id              UUID NOT NULL REFERENCES hotels(id),
    room_type_id          UUID NOT NULL REFERENCES room_types(id),
    building_id           UUID REFERENCES buildings(id),
    floor_id              UUID REFERENCES floors(id),
    name                  TEXT NOT NULL,
    actual_capacity       SMALLINT NOT NULL CHECK (actual_capacity > 0),
    actual_surface_m2     DECIMAL(6,1),
    price_adjustment_cents INTEGER NOT NULL DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'available'
                          CHECK (status IN ('available','reserved','occupied','cleaning','maintenance','out_of_service')),
    is_active             BOOLEAN NOT NULL DEFAULT true,
    notes                 TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at            TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- amenities
-- -------------------------------------------------------------------------
CREATE TABLE amenities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    name        TEXT NOT NULL,
    translations JSONB,
    icon        TEXT,
    category    TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- room_amenities
-- -------------------------------------------------------------------------
CREATE TABLE room_amenities (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id    UUID NOT NULL REFERENCES rooms(id),
    amenity_id UUID NOT NULL REFERENCES amenities(id),
    quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes      TEXT,
    UNIQUE (room_id, amenity_id)
);

-- -------------------------------------------------------------------------
-- room_type_amenities
-- -------------------------------------------------------------------------
CREATE TABLE room_type_amenities (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    amenity_id   UUID NOT NULL REFERENCES amenities(id),
    quantity     INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (room_type_id, amenity_id)
);
