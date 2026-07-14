-- ============================================================================
-- EDEN: Luxury Management — Migration 007 : Finance
-- ============================================================================
-- payments               → transactions financières (immuable après succès)
-- invoices               → factures (immuable après émission)
-- invoice_items          → lignes de facture
-- invoice_sequences      → séquences de numérotation par hôtel/année
-- taxes                  → TVA et autres taxes
-- discounts              → remises et promotions
-- currencies             → devises supportées (table de référence, pas de conversion)
-- rate_plans             → plans tarifaires
-- rate_plan_room_types   → association plan ↔ type de chambre
-- seasons                → périodes tarifaires
-- services               → prestations complémentaires
--
-- + ALTER TABLE pour les FK différées depuis 006_bookings.sql
-- ============================================================================

-- -------------------------------------------------------------------------
-- payments (immuable après success : pas de UPDATE, pas de soft delete)
-- -------------------------------------------------------------------------
CREATE TABLE payments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id         UUID NOT NULL REFERENCES bookings(id),
    hotel_id           UUID NOT NULL REFERENCES hotels(id),
    employee_id        UUID REFERENCES employees(id),
    guest_id           UUID REFERENCES guests(id),
    amount_cents       INTEGER NOT NULL CHECK (amount_cents != 0),
    currency_code      TEXT NOT NULL,
    method             TEXT NOT NULL CHECK (method IN ('card','cash','transfer','mobile_money','check','crypto')),
    type               TEXT NOT NULL CHECK (type IN ('deposit','balance','deposit_guarantee','refund','supplement','credit_note')),
    status             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','success','failed','refunded','partially_refunded')),
    external_reference TEXT,
    notes              TEXT,
    processed_at       TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- invoices (immuable après issued : pas de soft delete)
-- -------------------------------------------------------------------------
CREATE TABLE invoices (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id           UUID NOT NULL REFERENCES bookings(id),
    hotel_id             UUID NOT NULL REFERENCES hotels(id),
    invoice_number       TEXT NOT NULL,
    issue_date           DATE NOT NULL,
    due_date             DATE NOT NULL,
    total_amount_cents   INTEGER NOT NULL CHECK (total_amount_cents >= 0),
    tax_amount_cents     INTEGER NOT NULL DEFAULT 0 CHECK (tax_amount_cents >= 0),
    discount_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount_cents >= 0),
    net_amount_cents     INTEGER NOT NULL CHECK (net_amount_cents >= 0),
    status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','issued','paid','cancelled','credit_note')),
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- invoice_sequences
-- -------------------------------------------------------------------------
CREATE TABLE invoice_sequences (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id),
    year            INTEGER NOT NULL,
    prefix          TEXT NOT NULL DEFAULT 'FAC',
    current_number  INTEGER NOT NULL DEFAULT 0 CHECK (current_number >= 0),
    UNIQUE (hotel_id, year, prefix)
);

-- -------------------------------------------------------------------------
-- taxes
-- -------------------------------------------------------------------------
CREATE TABLE taxes (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id  UUID NOT NULL REFERENCES hotels(id),
    name      TEXT NOT NULL,
    rate      INTEGER NOT NULL CHECK (rate >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- discounts
-- -------------------------------------------------------------------------
CREATE TABLE discounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    name        TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('percentage','fixed_amount')),
    value       INTEGER NOT NULL CHECK (value > 0),
    code        TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    valid_from  DATE,
    valid_until DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- invoice_items (immuable après émission de la facture)
-- -------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id         UUID NOT NULL REFERENCES invoices(id),
    description        TEXT NOT NULL,
    quantity           INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents   INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents  INTEGER NOT NULL CHECK (total_price_cents >= 0),
    tax_rate           INTEGER NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
    tax_id             UUID REFERENCES taxes(id),
    discount_id        UUID REFERENCES discounts(id),
    sort_order         INTEGER NOT NULL DEFAULT 0,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- currencies (table de référence globale, pas de conversion en V1)
-- -------------------------------------------------------------------------
CREATE TABLE currencies (
    code      TEXT PRIMARY KEY,
    name      TEXT NOT NULL,
    symbol    TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- -------------------------------------------------------------------------
-- rate_plans
-- -------------------------------------------------------------------------
CREATE TABLE rate_plans (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id               UUID NOT NULL REFERENCES hotels(id),
    name                   TEXT NOT NULL,
    description            TEXT,
    cancellation_policy    JSONB,
    deposit_required_cents INTEGER,
    deposit_percentage     INTEGER,
    is_refundable          BOOLEAN NOT NULL DEFAULT true,
    is_active              BOOLEAN NOT NULL DEFAULT true,
    conditions             TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at             TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- rate_plan_room_types
-- -------------------------------------------------------------------------
CREATE TABLE rate_plan_room_types (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rate_plan_id         UUID NOT NULL REFERENCES rate_plans(id),
    room_type_id         UUID NOT NULL REFERENCES room_types(id),
    applied_price_cents  INTEGER,
    UNIQUE (rate_plan_id, room_type_id)
);

-- -------------------------------------------------------------------------
-- seasons
-- -------------------------------------------------------------------------
CREATE TABLE seasons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id     UUID NOT NULL REFERENCES hotels(id),
    name         TEXT NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('percentage','fixed_amount','fixed_price','per_night','weekend_price','event_price')),
    value        INTEGER NOT NULL,
    apply_days   SMALLINT[],
    priority     INTEGER NOT NULL DEFAULT 0,
    is_active    BOOLEAN NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date)
);

-- -------------------------------------------------------------------------
-- services
-- -------------------------------------------------------------------------
CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id),
    name            TEXT NOT NULL,
    translations    JSONB,
    description     TEXT,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    pricing_type    TEXT NOT NULL CHECK (pricing_type IN ('per_person','per_room','per_night','flat')),
    tax_rate        INTEGER DEFAULT 0 CHECK (tax_rate >= 0),
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- ============================================================================
-- FK différées depuis 006_bookings.sql
-- ============================================================================

ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_rate_plan
    FOREIGN KEY (rate_plan_id) REFERENCES rate_plans(id);

ALTER TABLE booking_services
    ADD CONSTRAINT fk_booking_services_service
    FOREIGN KEY (service_id) REFERENCES services(id);
