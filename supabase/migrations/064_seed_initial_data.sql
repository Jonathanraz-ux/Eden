-- ============================================================================
-- Migration 064: Seed initial data
-- ============================================================================
-- 1. Default hotel (deterministic ID)
INSERT INTO hotels (id, name, country, currency_code, default_language, timezone)
SELECT '00000000-0000-0000-0000-000000000001'::uuid,
       'L''Éden Luxury Hotel',
       'France',
       'EUR',
       'fr',
       'Europe/Paris'
WHERE NOT EXISTS (SELECT 1 FROM hotels WHERE id = '00000000-0000-0000-0000-000000000001');

-- 2. Room types (if none exist for the default hotel)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM room_types WHERE hotel_id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO room_types (hotel_id, name, description, base_capacity, base_price_cents, surface_m2, sort_order, is_active)
        VALUES
            ('00000000-0000-0000-0000-000000000001', 'Chambre Standard', 'Chambre confortable avec vue jardin', 2, 15000, 25.0, 1, true),
            ('00000000-0000-0000-0000-000000000001', 'Chambre Deluxe',   'Chambre spacieuse avec vue mer',      2, 25000, 35.0, 2, true),
            ('00000000-0000-0000-0000-000000000001', 'Suite',           'Suite prestige avec salon séparé',   4, 45000, 60.0, 3, true),
            ('00000000-0000-0000-0000-000000000001', 'Bungalow',        'Bungalow pieds dans l''eau avec terrasse privée', 2, 60000, 45.0, 4, true);
    END IF;
END $$;

-- 3. Rate plans (if none exist for the default hotel)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM rate_plans WHERE hotel_id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO rate_plans (hotel_id, name, description, is_refundable, is_active, conditions)
        VALUES
            ('00000000-0000-0000-0000-000000000001', 'Standard',   'Tarif standard sans remboursement', false, true, 'Annulation non remboursable'),
            ('00000000-0000-0000-0000-000000000001', 'Flexible',   'Tarif flexible avec annulation gratuite jusqu''à 48h avant l''arrivée', true, true, 'Annulation gratuite jusqu''à 48h avant l''arrivée'),
            ('00000000-0000-0000-0000-000000000001', 'Non remboursable', 'Tarif économique non remboursable avec avantage promo', false, true, 'Aucun remboursement possible. Offre non modifiable.');
    END IF;
END $$;

-- ============================================================================
-- End of migration 064
-- ============================================================================
