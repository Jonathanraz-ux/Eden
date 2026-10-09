-- ============================================================================
-- EDEN: Luxury Management — Migration 072 : Correction deadlock triggers finances
-- ============================================================================
-- Bug : la création (ou modif/suppression) d'un paiement échoue systématiquement
-- avec l'erreur P0001 « Les colonnes paid_amount_cents et balance_cents sont
-- calculées automatiquement et ne peuvent pas être modifiées manuellement. »
--
-- Chaîne en cause :
--   INSERT/UPDATE/DELETE ON payments
--     → trg_payments_update_finances (AFTER)
--       → fn_recalculate_booking_finances() fait un
--         UPDATE bookings SET paid_amount_cents=..., balance_cents=...
--           → trg_bookings_protect_finances (BEFORE UPDATE)
--             → fn_protect_booking_finances() INTERDIT toute modif de ces
--               colonnes, y compris le recalcul automatique légitime
--               → RAISE EXCEPTION → la transaction du paiement est annulée.
--
-- Correctif : fn_protect_booking_finances autorise la mise à jour quand elle
-- provient en cascade d'un autre trigger (pg_trigger_depth() > 1), donc le
-- recalcul automatique fonctionne, tout en continuant à bloquer les mises à
-- jour MANUELLES de paid_amount_cents / balance_cents.
-- La contrainte CHECK (balance_cents = total_amount_cents - paid_amount_cents)
-- continue de garantir la cohérence des données.
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_protect_booking_finances()
RETURNS TRIGGER AS $$
BEGIN
    -- Mise à jour en cascade depuis un trigger système (recalcul via payments) : autorisée
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF OLD.paid_amount_cents IS DISTINCT FROM NEW.paid_amount_cents
       OR OLD.balance_cents IS DISTINCT FROM NEW.balance_cents THEN
        RAISE EXCEPTION 'Les colonnes paid_amount_cents et balance_cents sont calculées automatiquement et ne peuvent pas être modifiées manuellement.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN DE LA MIGRATION 072
-- ============================================================================
