-- ============================================================================
-- EDEN: Luxury Management — Migration 008 : Notifications
-- ============================================================================
-- notifications            → messages système
-- notification_recipients  → destinataires d'une notification (multi-canal)
-- ============================================================================

-- -------------------------------------------------------------------------
-- notifications
-- -------------------------------------------------------------------------
CREATE TABLE notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    booking_id  UUID REFERENCES bookings(id),
    payment_id  UUID REFERENCES payments(id),
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('confirmation','reminder','alert','promotion','invoice','internal','urgent')),
    priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
    template    TEXT,
    sender_type TEXT,
    sender_id   UUID,
    sent_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- notification_recipients
-- -------------------------------------------------------------------------
CREATE TABLE notification_recipients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id),
    recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('guest','employee')),
    recipient_id    UUID NOT NULL,
    channel         TEXT NOT NULL CHECK (channel IN ('email','sms','push','in_app','whatsapp')),
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','archived','failed')),
    read_at         TIMESTAMPTZ,
    attempt_count   INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
