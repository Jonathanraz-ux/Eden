-- ============================================================================
-- EDEN: Luxury Management — Migration 065 : Static Pages → Supabase
-- ============================================================================
-- Rend les pages Gallery, Restaurant, Services et Settings-Général
-- pilotables depuis la base de données (CRUD complet depuis le dashboard).
--
-- 1. Ajoute icon + category à la table services existante
-- 2. Crée gallery_images (galerie photos)
-- 3. Crée restaurant_tables, restaurant_menu_items, restaurant_orders,
--    restaurant_order_items
-- 4. RLS, indexes, triggers, permissions, seed data
-- ============================================================================

-- ============================================================================
-- 1. EXTENSION DE LA TABLE services EXISTANTE
-- ============================================================================
-- Les champs icon et category permettent au ServicesView d'être
-- alimenté depuis la DB, avec une icône Lucide et une catégorie
-- pour le filtrage/groupe.

ALTER TABLE services
    ADD COLUMN IF NOT EXISTS icon TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN services.icon IS 'Nom de l''icône Lucide (ex: Sparkles, Car, Palmtree)';
COMMENT ON COLUMN services.category IS 'Catégorie de service (ex: spa, excursions, transport)';

-- ============================================================================
-- 2. NOUVELLES TABLES
-- ============================================================================

-- -------------------------------------------------------------------------
-- gallery_images
-- Photographies libres (non liées à une entité) pour la galerie du site
-- vitrine de l'hôtel.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    url         TEXT NOT NULL,
    alt_text    TEXT,
    caption     TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE gallery_images IS 'Images de la galerie libre (hors media lié à une entité)';

-- -------------------------------------------------------------------------
-- restaurant_tables
-- Tables physiques du restaurant.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id    UUID NOT NULL REFERENCES hotels(id),
    name        TEXT NOT NULL,
    capacity    SMALLINT NOT NULL DEFAULT 4 CHECK (capacity > 0),
    location    TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

COMMENT ON TABLE restaurant_tables IS 'Tables physiques du restaurant';

-- -------------------------------------------------------------------------
-- restaurant_menu_items
-- Éléments de la carte du restaurant.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id),
    name            TEXT NOT NULL,
    description     TEXT,
    price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
    category        TEXT,
    is_available    BOOLEAN NOT NULL DEFAULT true,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE restaurant_menu_items IS 'Carte / menu du restaurant';

-- -------------------------------------------------------------------------
-- restaurant_orders
-- Commandes passées au restaurant (sur place, room service, à emporter).
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id            UUID NOT NULL REFERENCES hotels(id),
    table_id            UUID REFERENCES restaurant_tables(id),
    order_reference     TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','preparing','ready','served','cancelled')),
    type                TEXT NOT NULL DEFAULT 'dine_in'
                        CHECK (type IN ('dine_in','room_service','takeaway')),
    room_number         TEXT,
    special_requests    TEXT,
    total_amount_cents  INTEGER NOT NULL DEFAULT 0 CHECK (total_amount_cents >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE restaurant_orders IS 'Commandes du restaurant';

-- -------------------------------------------------------------------------
-- restaurant_order_items
-- Lignes de chaque commande (produits commandés).
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurant_order_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id          UUID NOT NULL REFERENCES restaurant_orders(id),
    menu_item_id      UUID NOT NULL REFERENCES restaurant_menu_items(id),
    quantity          INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents  INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    total_price_cents INTEGER NOT NULL CHECK (total_price_cents >= 0),
    notes             TEXT,
    status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','preparing','ready','served','cancelled')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE restaurant_order_items IS 'Lignes de commande du restaurant';

-- ============================================================================
-- 3. RLS (Row Level Security)
-- ============================================================================

ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_order_items ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- gallery_images
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS gallery_images_select ON gallery_images;
CREATE POLICY gallery_images_select ON gallery_images FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

DROP POLICY IF EXISTS gallery_images_insert ON gallery_images;
CREATE POLICY gallery_images_insert ON gallery_images FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'gallery.manage'));

DROP POLICY IF EXISTS gallery_images_update ON gallery_images;
CREATE POLICY gallery_images_update ON gallery_images FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'gallery.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'gallery.manage'));

DROP POLICY IF EXISTS gallery_images_delete ON gallery_images;
CREATE POLICY gallery_images_delete ON gallery_images FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'gallery.manage'));

-- -------------------------------------------------------------------------
-- restaurant_tables
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS restaurant_tables_select ON restaurant_tables;
CREATE POLICY restaurant_tables_select ON restaurant_tables FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

DROP POLICY IF EXISTS restaurant_tables_insert ON restaurant_tables;
CREATE POLICY restaurant_tables_insert ON restaurant_tables FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_tables_update ON restaurant_tables;
CREATE POLICY restaurant_tables_update ON restaurant_tables FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_tables_delete ON restaurant_tables;
CREATE POLICY restaurant_tables_delete ON restaurant_tables FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

-- -------------------------------------------------------------------------
-- restaurant_menu_items
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS restaurant_menu_items_select ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_select ON restaurant_menu_items FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

DROP POLICY IF EXISTS restaurant_menu_items_insert ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_insert ON restaurant_menu_items FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_menu_items_update ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_update ON restaurant_menu_items FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_menu_items_delete ON restaurant_menu_items;
CREATE POLICY restaurant_menu_items_delete ON restaurant_menu_items FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

-- -------------------------------------------------------------------------
-- restaurant_orders
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS restaurant_orders_select ON restaurant_orders;
CREATE POLICY restaurant_orders_select ON restaurant_orders FOR SELECT
    USING (fn_is_same_hotel(hotel_id));

DROP POLICY IF EXISTS restaurant_orders_insert ON restaurant_orders;
CREATE POLICY restaurant_orders_insert ON restaurant_orders FOR INSERT
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_orders_update ON restaurant_orders;
CREATE POLICY restaurant_orders_update ON restaurant_orders FOR UPDATE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'))
    WITH CHECK (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_orders_delete ON restaurant_orders;
CREATE POLICY restaurant_orders_delete ON restaurant_orders FOR DELETE
    USING (fn_is_same_hotel(hotel_id) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

-- -------------------------------------------------------------------------
-- restaurant_order_items
-- Accès via la commande parente.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS restaurant_order_items_select ON restaurant_order_items;
CREATE POLICY restaurant_order_items_select ON restaurant_order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM restaurant_orders o
        WHERE o.id = order_id AND fn_is_same_hotel(o.hotel_id)
    ));

DROP POLICY IF EXISTS restaurant_order_items_insert ON restaurant_order_items;
CREATE POLICY restaurant_order_items_insert ON restaurant_order_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM restaurant_orders o
        WHERE o.id = order_id AND fn_is_same_hotel(o.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_order_items_update ON restaurant_order_items;
CREATE POLICY restaurant_order_items_update ON restaurant_order_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM restaurant_orders o
        WHERE o.id = order_id AND fn_is_same_hotel(o.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'))
    WITH CHECK (EXISTS (
        SELECT 1 FROM restaurant_orders o
        WHERE o.id = order_id AND fn_is_same_hotel(o.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

DROP POLICY IF EXISTS restaurant_order_items_delete ON restaurant_order_items;
CREATE POLICY restaurant_order_items_delete ON restaurant_order_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM restaurant_orders o
        WHERE o.id = order_id AND fn_is_same_hotel(o.hotel_id)
    ) AND fn_has_permission(fn_get_current_employee(), 'restaurant.manage'));

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_gallery_images_hotel_id ON gallery_images (hotel_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_active ON gallery_images (hotel_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_restaurant_tables_hotel_id ON restaurant_tables (hotel_id);

CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_hotel_id ON restaurant_menu_items (hotel_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_category ON restaurant_menu_items (hotel_id, category);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_items_available ON restaurant_menu_items (hotel_id) WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_restaurant_orders_hotel_id ON restaurant_orders (hotel_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_status ON restaurant_orders (hotel_id, status);
CREATE INDEX IF NOT EXISTS idx_restaurant_orders_table ON restaurant_orders (table_id) WHERE table_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_order ON restaurant_order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_order_items_menu ON restaurant_order_items (menu_item_id);

-- ============================================================================
-- 5. TRIGGERS (updated_at)
-- ============================================================================

DROP TRIGGER IF EXISTS trg_gallery_images_updated_at ON gallery_images;
CREATE TRIGGER trg_gallery_images_updated_at
    BEFORE UPDATE ON gallery_images
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_restaurant_tables_updated_at ON restaurant_tables;
CREATE TRIGGER trg_restaurant_tables_updated_at
    BEFORE UPDATE ON restaurant_tables
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_restaurant_menu_items_updated_at ON restaurant_menu_items;
CREATE TRIGGER trg_restaurant_menu_items_updated_at
    BEFORE UPDATE ON restaurant_menu_items
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

DROP TRIGGER IF EXISTS trg_restaurant_orders_updated_at ON restaurant_orders;
CREATE TRIGGER trg_restaurant_orders_updated_at
    BEFORE UPDATE ON restaurant_orders
    FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

-- ============================================================================
-- 6. NOUVELLES PERMISSIONS
-- ============================================================================

INSERT INTO permissions (code, name, group_name) VALUES
    ('gallery.manage',     'Gérer la galerie photos',   'Gallery'),
    ('restaurant.manage',  'Gérer le restaurant',        'Restaurant')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 7. SEED DATA (pour l'hôtel par défaut)
-- ============================================================================

DO $$
DECLARE
    v_hotel_id CONSTANT UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

    -- ========================================================================
    -- 7.1 Services (mise à jour des enregistrements existants ou insertion)
    -- ========================================================================
    -- On met à jour les services existants avec icon + category,
    -- et on insère ceux qui n'existent pas encore.

    IF EXISTS (SELECT 1 FROM services WHERE hotel_id = v_hotel_id) THEN
        UPDATE services SET icon = 'Sparkles',  category = 'spa'         WHERE hotel_id = v_hotel_id AND name ILIKE '%spa%' AND icon IS NULL;
        UPDATE services SET icon = 'Palmtree',  category = 'excursions'  WHERE hotel_id = v_hotel_id AND name ILIKE '%excursion%' AND icon IS NULL;
        UPDATE services SET icon = 'Car',       category = 'transport'   WHERE hotel_id = v_hotel_id AND name ILIKE '%transfert%' AND icon IS NULL;
        UPDATE services SET icon = 'UtensilsCrossed', category = 'restaurant' WHERE hotel_id = v_hotel_id AND name ILIKE '%restaurant%' AND icon IS NULL;
    ELSE
        INSERT INTO services (hotel_id, name, unit_price_cents, pricing_type, icon, category, description) VALUES
            (v_hotel_id, 'Spa & Bien-être',       8000,  'per_person', 'Sparkles',        'spa',         'Soins spa et massages'),
            (v_hotel_id, 'Excursions Lagon',      15000, 'per_person', 'Palmtree',        'excursions',  'Excursions en bateau'),
            (v_hotel_id, 'Transferts Aéroport',   5000,  'per_person', 'Car',             'transport',   'Navette aéroport aller-retour'),
            (v_hotel_id, 'Restaurant Gastronomique', 9500, 'per_person', 'UtensilsCrossed', 'restaurant', 'Dîner gastronomique');
    END IF;

    -- ========================================================================
    -- 7.2 Gallery images (si la galerie est vide pour cet hôtel)
    -- ========================================================================
    IF NOT EXISTS (SELECT 1 FROM gallery_images WHERE hotel_id = v_hotel_id) THEN
        INSERT INTO gallery_images (hotel_id, url, alt_text, caption, sort_order) VALUES
            (v_hotel_id, 'https://images.unsplash.com/photo-1542314831-c53cd3816002?auto=format&fit=crop&q=80&w=800', 'Vue aérienne du resort', 'Vue aérienne du resort', 1),
            (v_hotel_id, 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=800', 'Piscine à débordement', 'Piscine à débordement', 2),
            (v_hotel_id, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&q=80&w=800', 'Suite prestige', 'Suite Prestige — Salon', 3),
            (v_hotel_id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800', 'Vue mer depuis la suite', 'Vue mer depuis la suite', 4),
            (v_hotel_id, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&q=80&w=800', 'Bungalow pieds dans l''eau', 'Bungalow pieds dans l''eau', 5),
            (v_hotel_id, 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=800', 'Entrée du resort', 'Entrée du resort — Allée royale', 6);
    END IF;

    -- ========================================================================
    -- 7.3 Restaurant : tables
    -- ========================================================================
    IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE hotel_id = v_hotel_id) THEN
        INSERT INTO restaurant_tables (hotel_id, name, capacity, location) VALUES
            (v_hotel_id, '1',  2, 'Salle principale'),
            (v_hotel_id, '2',  2, 'Salle principale'),
            (v_hotel_id, '3',  4, 'Salle principale'),
            (v_hotel_id, '4',  4, 'Salle principale'),
            (v_hotel_id, '5',  6, 'Salle principale'),
            (v_hotel_id, '6',  2, 'Salle principale'),
            (v_hotel_id, '7',  4, 'Salle principale'),
            (v_hotel_id, '8',  4, 'Salle principale'),
            (v_hotel_id, '9',  2, 'Salle principale'),
            (v_hotel_id, '10', 2, 'Salle principale'),
            (v_hotel_id, '11', 4, 'Salle principale'),
            (v_hotel_id, '12', 6, 'Salle principale'),
            (v_hotel_id, '13', 4, 'Salle principale'),
            (v_hotel_id, '14', 4, 'Salle principale'),
            (v_hotel_id, '15', 2, 'Salle principale'),
            (v_hotel_id, '16', 2, 'Salle principale'),
            (v_hotel_id, '17', 4, 'Terrasse'),
            (v_hotel_id, '18', 4, 'Terrasse'),
            (v_hotel_id, '19', 6, 'Terrasse'),
            (v_hotel_id, '20', 4, 'Terrasse'),
            (v_hotel_id, '21', 2, 'Terrasse'),
            (v_hotel_id, '22', 2, 'Terrasse'),
            (v_hotel_id, '23', 4, 'VIP'),
            (v_hotel_id, '24', 8, 'VIP');
    END IF;

    -- ========================================================================
    -- 7.4 Restaurant : menu items
    -- ========================================================================
    IF NOT EXISTS (SELECT 1 FROM restaurant_menu_items WHERE hotel_id = v_hotel_id) THEN
        INSERT INTO restaurant_menu_items (hotel_id, name, description, price_cents, category, sort_order) VALUES
            (v_hotel_id, 'Menu Dégustation',     'Entrée, plat, dessert — saveurs locales',                 8900, 'Menu',      1),
            (v_hotel_id, 'Club Sandwich',        'Poulet, bacon, laitue, tomate, frites',                   2200, 'Plat',      2),
            (v_hotel_id, 'Jus d''Orange Frais',  'Jus pressé main',                                        800,  'Boisson',   3),
            (v_hotel_id, 'Bouteille Chablis',    'Chablis Premier Cru — 75cl',                             4500, 'Boisson',   4),
            (v_hotel_id, 'Dîner Romantique Complet', 'Menu 5 services, champagne, dessert surprise',      18000, 'Menu',      5),
            (v_hotel_id, 'Salade César',         'Poulet grillé, parmesan, croûtons, sauce césar',         1800, 'Entrée',    6),
            (v_hotel_id, 'Tartare de Thon',      'Thon frais, avocat, mangue, sauce soja',                 2400, 'Entrée',    7),
            (v_hotel_id, 'Filet de Bœuf',        'Filet de bœuf Angus, gratin dauphinois, légumes saison',  3800, 'Plat',      8),
            (v_hotel_id, 'Risotto aux Champignons', 'Risotto crémeux, cèpes, parmesan',                    2600, 'Plat',      9),
            (v_hotel_id, 'Tiramisu',             'Tiramisu au café, mascarpone, cacao',                    1200, 'Dessert',  10),
            (v_hotel_id, 'Fondant au Chocolat',  'Fondant au chocolat noir, glace vanille',                1400, 'Dessert',  11),
            (v_hotel_id, 'Café Gourmand',        'Expresso + 3 mini-desserts',                             1500, 'Dessert',  12);
    END IF;

END $$;

-- ============================================================================
-- End of migration 065
-- ============================================================================
