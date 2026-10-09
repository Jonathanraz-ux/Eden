-- ============================================================================
-- EDEN: Luxury Management — Migration 075 : Isolation multi-tenant des hotels
-- ============================================================================
-- Constat : avec le provisionnement multi-clients (migration 074), la fuite
-- decouverte en testant un vrai tenant n'est plus acceptable.
--
-- `hotels_select` (creee par 063_fix_seed_and_rls.sql) contenait :
--
--     OR (auth.role() = 'authenticated' AND id = '00000000-...-000000000001')
--
-- Cette clause_offrait a TOUT utilisateur authentifie la lecture de l'hotel
-- par defaut, quel que soit son propre tenant. Elle avait ete introduite
-- pour permettre l'auto-enregistrement des employes (l'utilisateur creeait
-- son profil avant d'etre rattache a un hotel).
--
-- Or cet auto-enregistrement a ete supprime : le frontend cree des employes
-- uniquement via les fonctions de provisioning reservees a service_role
-- (fn_provision_admin, fn_provision_employee, fn_link_employee_to_auth_user).
-- La clause n'a donc plus aucune raison d'exister et constitue une fuite
-- inter-clients : chaque client peut voir le nom et les parametres de l'hotel
-- de reference, et plus generalement de tout hotel tant que la clause est
-- presente.
--
-- Correction : la lecture des hotels est strictement limitee au tenant courant,
-- avec le meme traitement que toutes les autres tables (fn_is_same_hotel).
-- ============================================================================

DROP POLICY IF EXISTS hotels_select ON hotels;

CREATE POLICY hotels_select ON hotels FOR SELECT
    USING (
        id = fn_get_current_hotel_id()
        OR auth.role() = 'service_role'
    );

-- ----------------------------------------------------------------------------
-- Verification : plus aucune politique ne doit referencer un hotel_id en dur.
-- Si cette requete renvoie des lignes, une autre migration a reintroduit
-- une clause de ce type et l'isolation multi-tenant est de nouveau cassee.
-- ----------------------------------------------------------------------------
-- SELECT tablename, policyname, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND coalesce(qual, '') ILIKE '%00000000-0000-0000-0000-000000000001%';