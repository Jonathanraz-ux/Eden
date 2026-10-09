-- ============================================================================
<<<<<<< HEAD
-- EDEN: Luxury Management — Migration 069 : Seed Guests
-- ============================================================================
-- Clients de démonstration pour l'hôtel par défaut.
=======
-- EDEN: Luxury Management
-- Migration 069 : Seed Demo Guests (Portable)
-- ============================================================================
-- Insère des clients de démonstration pour le premier hôtel existant.
-- Idempotente : ne réinsère rien si des clients existent déjà.
>>>>>>> 08b4f88 (Fix demo: guard map operations and handle missing Supabase config; rebuild)
-- ============================================================================

DO $$
DECLARE
<<<<<<< HEAD
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
=======
    v_hotel_id UUID;
BEGIN

    -- Récupère le premier hôtel disponible
    SELECT id
    INTO v_hotel_id
    FROM hotels
    ORDER BY created_at
    LIMIT 1;

    IF v_hotel_id IS NULL THEN
        RAISE EXCEPTION 'Migration 069: Aucun hôtel trouvé. Exécute d''abord les migrations de création des hôtels.';
    END IF;

    -- Ne rien faire si des clients existent déjà
    IF EXISTS (
        SELECT 1
        FROM guests
        WHERE hotel_id = v_hotel_id
        LIMIT 1
    ) THEN
        RAISE NOTICE 'Migration 069: Des clients existent déjà pour cet hôtel. Seed ignoré.';
        RETURN;
    END IF;

    INSERT INTO guests (
        hotel_id,
        first_name,
        last_name,
        email,
        phone,
        nationality,
        type
    )
    VALUES

    (
        v_hotel_id,
        'Mino',
        'Razafy',
        'mino.razafy@email.com',
        '+261341234567',
        'Malagasy',
        'individual'
    ),

    (
        v_hotel_id,
        'Sophie',
        'Lefebvre',
        'sophie.lefebvre@email.fr',
        '+33612345678',
        'Française',
        'individual'
    ),

    (
        v_hotel_id,
        'James',
        'Anderson',
        'james.anderson@email.com',
        '+15551234567',
        'Américaine',
        'individual'
    ),

    (
        v_hotel_id,
        'Maria',
        'Schmidt',
        'maria.schmidt@email.de',
        '+491701234567',
        'Allemande',
        'individual'
    ),

    (
        v_hotel_id,
        'Pierre',
        'Dubois',
        'pierre.dubois@email.fr',
        '+33698765432',
        'Française',
        'individual'
    ),

    (
        v_hotel_id,
        'Aisha',
        'Patel',
        'aisha.patel@email.uk',
        '+447700123456',
        'Britannique',
        'individual'
    ),

    (
        v_hotel_id,
        'Chen',
        'Wei',
        'chen.wei@email.cn',
        '+8613800138000',
        'Chinoise',
        'individual'
    ),

    (
        v_hotel_id,
        'Lucas',
        'Müller',
        'lucas.muller@email.ch',
        '+41791234567',
        'Suisse',
        'individual'
    ),

    (
        v_hotel_id,
        'Emma',
        'Johansson',
        'emma.johansson@email.se',
        '+46701234567',
        'Suédoise',
        'individual'
    ),

    (
        v_hotel_id,
        'Ravi',
        'Sharma',
        'ravi.sharma@email.in',
        '+919876543210',
        'Indienne',
        'individual'
    ),

    -- Agence
    (
        v_hotel_id,
        NULL,
        'Agence Royale Voyages',
        'contact@royale-voyages.com',
        '+33123456789',
        'Française',
        'agency'
    ),

    -- Entreprise
    (
        v_hotel_id,
        NULL,
        'Global Business Corp',
        'info@globalbiz.com',
        '+12125550198',
        'Américaine',
        'company'
    );

    RAISE NOTICE 'Migration 069: 12 clients de démonstration insérés avec succès.';

END $$;
>>>>>>> 08b4f88 (Fix demo: guard map operations and handle missing Supabase config; rebuild)
