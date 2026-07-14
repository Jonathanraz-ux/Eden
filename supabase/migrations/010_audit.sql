-- ============================================================================
-- EDEN: Luxury Management — Migration 010 : Audit
-- ============================================================================
-- audit_logs → trace de toutes les actions importantes (immuable)
-- ============================================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    employee_id UUID REFERENCES employees(id),
    guest_id    UUID REFERENCES guests(id),
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID NOT NULL,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  TEXT,
    context     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
