-- ============================================================================
-- EDEN: Luxury Management — Migration 069 : Seed Guests
-- ============================================================================
-- Clients de démonstration pour l'hôtel par défaut.
-- ============================================================================

DO $$
DECLARE
    v_hotel_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

    IF EXISTS (SELECT 1 FROM guests WHERE hotel_id = v_hotel_id LIMIT 1) THEN
        RAISE NOTICE 'Guests already exist for default hotel, skipping seed.';
        RETURN;
    END IF;

    INSERT INTO guests (hotel_id, first_name, last_name, email, phone, nationality, type) VALUES
        (v_hotel_id, 'Mino',       'Razafy',     'mino.razafy@email.com',     '+261 34 12 345 67', 'Malagasy',   'individual'),
        (v_hotel_id, 'Sophie',     'Lefebvre',   'sophie.lefebvre@email.fr',  '+33 6 12 34 56 78', 'Française',  'individual'),
        (v_hotel_id, 'James',      'Anderson',   'james.anderson@email.com',  '+1 555 123 4567',   'Américaine', 'individual'),
        (v_hotel_id, 'Maria',      'Schmidt',    'maria.schmidt@email.de',    '+49 170 1234567',   'Allemande',  'individual'),
        (v_hotel_id, 'Pierre',     'Dubois',     'pierre.dubois@email.fr',    '+33 6 98 76 54 32', 'Française',  'individual'),
        (v_hotel_id, 'Aisha',      'Patel',      'aisha.patel@email.uk',      '+44 7700 123456',   'Britannique','individual'),
        (v_hotel_id, 'Chen',       'Wei',        'chen.wei@email.cn',         '+86 138 0013 8000', 'Chinoise',   'individual'),
        (v_hotel_id, 'Lucas',      'Müller',     'lucas.muller@email.ch',     '+41 79 123 45 67',  'Suisse',     'individual'),
        (v_hotel_id, 'Emma',       'Johansson',  'emma.johansson@email.se',   '+46 70 123 45 67',  'Suédoise',   'individual'),
        (v_hotel_id, 'Ravi',       'Sharma',     'ravi.sharma@email.in',      '+91 98765 43210',   'Indienne',   'individual'),
        (v_hotel_id, 'Agence Royale Voyages', NULL, 'contact@royale-voyages.com', '+33 1 23 45 67 89', 'Française', 'agency'),
        (v_hotel_id, 'Global Business Corp',  NULL, 'info@globalbiz.com',         '+1 212 555 0198',  'Américaine', 'company');

END $$;
