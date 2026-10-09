# EDEN: Luxury Management — Enregistrement de livraison

Date du controle : 2026-09-29. Controle statique du dossier. Aucun build ni serveur n'a ete lance. Aucune valeur de secret n'est reproduite ici.

## Verifie

| Element | Etat | Detail |
|---|---|---|
| Build de production | Present | `dist/` existe. **Non regenere ni verifie.** |
| Script de build | Present | `npm run build` |
| Script de lint | Present | `npm run lint` |
| Script de test | **Absent** | Aucun script `test` |
| Fichiers source | 95 fichiers dans `src/` | React 19 + TypeScript + Vite + Tailwind 4, TanStack Query, RHF + Zod |
| Migrations SQL | 27 fichiers dans `supabase/migrations/` | `001` a `072`, sequence non contigue |
| RLS | Fichiers presents | `050`, `060`, `063`, `066`, `067`. **Politiques non testees.** |
| README | Present | 55 lignes, en francais |
| Documentation metier | Presente | `DOMAIN_MODEL.md`, `DATABASE_BLUEPRINT.md`, `CHANGELOG.md` |
| Licence | Present | `LICENSE.md` |
| Controle de version | **Absent** | Aucun depot git. Aucun historique, aucune branches, aucune CI. |
| Template d'environnement | Present | `.env.example` (valeurs de remplacement) |
| Modules announces termines | 6 sur 10 | D'apres le tableau du README |

## Non verifie

| Point | Statut |
|---|---|
| Tests automatises | Aucun. Pas de runner, pas de fichiers de test. |
| Tests end-to-end | Aucun. |
| Audit d'accessibilite | Non fait. |
| Revue de securite | Non faite, alors qu'un jeton d'administration est present sur le poste. |
| Test de charge / performance | Non fait. |
| Chemin de migration sur projet Supabase neuf | Jamais execute par nos soins. |
| Audit des dependances (`npm audit`) | Jamais execute. |
| Build reellement compile | Non execute lors de ce controle. |
| QA manuelle fonctionnelle | Non faite. |
| Isolation multi-tenant | Non verifiee. |
| Coherence README / code | Contradiction constatee (voir points ouverts). |

## Points ouverts

### Securite — priorite absolue

1. **Jeton d'administration Supabase present sur le poste.** Fichier : `dashboard-hotel-premium/.env.local`, ligne 6, nom de la cle : `SUPABASE_ACCESS_TOKEN`. Ce n'est **pas** une cle anon : c'est un jeton d'API de gestion Supabase, capable d'agir sur le projet **depuis le serveur**, y compris fausser des migrations, lire des donnees ou supprimer des ressources. Il est ecrit en clair, hors placeholder, dans un dossier de projet.
   **Action : revoquer et regenerer ce jeton des maintenant (Console Supabase > Tokens), puis supprimer le fichier avant toute vente, archivage ou transfert de ce dossier.** C'est le point le plus grave du lot.
2. Le meme fichier contient `VITE_SUPABASE_URL` (ligne 2) et `VITE_SUPABASE_ANON_KEY` (ligne 3). Valeurs non reproduites ici. A supprimer avec le fichier.

### Exposition d'infrastructure dans le build

3. **Hote de projet Supabase en dur dans une politique CSP.** `index.html` ligne 8 : l'en-tete `Content-Security-Policy` interdit `connect-src` et liste explicitement l'hote du projet Supabase de developpement. Consequences : (a) toute migration vers un autre projet necessite une modification du fichier source, (b) le build est lie a un projet precis, (c) l'identifiant du projet est publie dans chaque livrable. A remplacer par une liste d'origes derivee de la configuration, ou par une CSP production distincte. La meme ligne autorise `wss:` et `ws:` en clair, a restreindre.

### Produit

4. **Quatre modules sur dix marques incomplets par le README lui-meme** : Authentification, Permissions, Rooms, Guests. La mention est dans le tableau de statut du `README.md`. A noter : des fichiers de code existent deja pour ces modules, donc le README est possiblement perime. **Le statut reel n'a pas ete verifie.** Trancher avant de decrire ce produit a un client.
5. **Aucune gestion de version.** Le dossier n'est pas un depot git, malgre 95 fichiers source et 27 migrations. Toute modification est irreversible, aucune branche, aucun historique, aucun rollback. A initialiser sous controle de version avant de poursuivre le developpement.
6. **Derive documentaire.** Le README annonce « 15 fichiers de migration » ; le dossier en contient 27. A corriger.
7. **Dependance morte : `@google/genai@^2.4.0`.** Declare dans `dependencies`, **jamais importe dans `src/`** (verifie sur les 95 fichiers). A retirer : il augmente le poids d'installation et la surface d'attaque sans usage.
8. **Dependances de production a verifier** : `express@^4.21.2` et `dotenv@^17.2.3` n'ont pas d'usage evident cote client.
9. **Donnees de demonstration** : `supabase/migrations/069_seed_guests.sql` contient une douzaine de profils clients avec noms et adresses e-mail realistes (domaines d'exemple). A desensibiliser si le produit est presente a un client.
10. **Aucune automatisation.** Vu la taille du produit, la mise en place de tests sur la couche services (`src/lib/services/`) est le meilleur investissement possible.

## Verdict

**Non livrable en l'etat.** Deux motifs de refus, l'un technique et l'un documentaire : un jeton d'administration Supabase en clair dans le dossier, et quatre modules sur dix non livres selon le README lui-meme. S'y ajoutent l'absence totale de tests, l'absence de controle de version sur 95 fichiers source, et l'identite d'un projet de developpement figee dans une CSP. Le deplacement de ce dossier doit etre traite comme un incident de securite, pas comme un simple nettoyage.

## Corrections appliquées le 2026-09-29

Les trois blocages de vente ont ete corriges. Les tableaux « Verifie »,
« Non verifie » et « Points ouverts » ci-dessus sont conserves tels quels :
ils constituent l'instantane de l'audit d'origine. Les points ci-dessous font
foi pour l'etat actuel et les supplantent sur les subjects traites.

### 1. Jeton d'administration retire du dossier

- `dashboard-hotel-premium/.env.local` : **fichier supprime**. Il contenait
  `VITE_SUPABASE_URL` (ligne 2), `VITE_SUPABASE_ANON_KEY` (ligne 3) et
  `SUPABASE_ACCESS_TOKEN` (ligne 6). Aucune valeur n'a ete reproduite, ni dans
  ce document, ni ailleurs.
- `.env.example` : conserve, complete et documente en francais. Il contient les
  deux seules variables que le code lit reellement
  (`src/lib/supabase.ts`, lignes 3 et 4).
- Les valeurs de remplacement ont ete alignees sur les sentinelles attendues
  par `src/lib/supabase.ts` (lignes 9 et 10 : `https://votre-projet.supabase.co`
  et `votre-cle-anon-supabase`). Les anciennes valeurs de l'exemple
  (`https://YOUR_PROJECT.supabase.co`, `your_publishable_anon_key`) ne
  declenchaient pas la detection « Supabase non configure » : une copie de
  `.env.example` produisait un client casse au lieu du mode degrade prevu.
- `SUPABASE_ACCESS_TOKEN` n'est plus declare comme variable du projet. Aucun
  code ne la lit ; la CLI Supabase doit recevoir ce jeton par variable de
  session (`supabase login`), pas par un fichier du produit.

### 2. CSP rendu agnostique du projet

- `index.html`, ligne 8 : `connect-src` ne liste plus l'hote d'un projet
  Supabase precis. Nouvelle directive :
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co;`
- Les autorisations `wss:` et `ws:` en clair ont ete retirees, comme
  recommande au point 3. Seul le canal temps reel de Supabase reste autorise,
  et uniquement sur `*.supabase.co`.
- Le reste de la politique est intact : `default-src 'self'` inchange, ainsi que
  `script-src`, `style-src` (polices Google), `font-src` et `img-src`.
  Aucune directive n'a ete elargie.
- Consequence : le build est transférable à n'importe quel projet Supabase et
  n'expose plus l'identifiant du projet de développement dans le livrable.

### 3. README corrige

- Compteur de migrations : « 15 fichiers » remplace par **27**, avec la
  precision sur la sequence non contigue `001` a `072`.
- Tableau de statut : les 4 modules marques « A venir » (Authentification,
  Permissions, Rooms, Guests) sont passes a « Termine ». La verification
  porte sur des elements concrets, pas sur la seule existence des fichiers :
  `LoginView` et `AuthGuard` sont montes par `src/App.tsx` (lignes 75 et 64),
  `RoomsView` et `GuestsView` sont routes (lignes 80 et 82),
  `RolesSettingsTab` est rendu par `SettingsView` (ligne 137) et s'appuie sur
  `useRoles` ; les tables `roles`, `permissions` et `role_permissions` sont
  creees par `supabase/migrations/005_employees.sql`. Aucun module ne s'est
  revele absent.
- La mention « Termine » est explicitement bornee : elle signifie « code livre
  et branche », pas « recette fonctionnelle validee ». Aucun test automatise
  n'existe (voir `TESTING.md`).
- Ajout d'une liste factuelle des modules livres hors perimetre des 10
  (Reception, Housekeeping, Tarification, Facturation, Analytics, Centre
  d'operations, Personnel, Galerie, Restaurant, Services, Reglages), avec les
  comptes reels : 19 fichiers dans `src/views/`, 18 routes de page dans
  `src/App.tsx`.
- Section d'environnement reprise : ne plus indiquer de jeton de gestion parmi
  les variables requises.

### Point ouvert — clos le 2026-09-29

- **Le jeton `SUPABASE_ACCESS_TOKEN` etait present dans `.env.local` : ce
  fichier a ete supprime et le jeton a ete revoque par son detenteur le
  2026-09-29.** La suppression du fichier ne suffisant pas (un jeton reste
  valide cote Supabase tant qu'il n'est pas revoque), la revocation a ete
  confirmee par le detenteur depuis la Console Supabase. Le dossier ne contient
  plus aucune cle privee, et aucun jeton n'est reproduit dans cette
  documentation. A verifier de toute facon, avant archivage ou transfert, que le
  dossier ne figure dans aucune copie ou piece jointe anterieurement transmise.

### Non traite (hors perimetre de cette correction)

- `CHANGELOG.md` (ligne 140) et cette section d'audit (point ouvert 6)
  mentionnent encore « 15 migrations ». Ce sont des documents d'historique :
  le point 6 est volontairement conserve comme instantane, et le README fait
  foi. A arbitrer lors du prochain passage de version.
- `TESTING.md` annonçait « 18 vues de `src/views/` et 18 hooks » : **corrige le
  2026-09-29**. Le dossier compte 19 vues (18 fichiers `*View.tsx` plus
  `RolesSettingsTab.tsx`) et 16 hooks dans `src/lib/hooks/` (et non `src/hooks/`,
  qui n'existe pas). `ServicesView`, absente du tableau de parcours, y a ete
  ajoutee. Le nombre de modales (`src/components/*Modal.tsx`) a ete ramene de
  18 a 17, et la section 6 ne decrit plus un README en contradiction, depuis
  corrigee (voir section 3). Le compte de migrations (27) etait deja exact.
- Points ouverts 5 a 10 de l'audit (controle de version, dependance
  `@google/genai` inutilisee, `express`/`dotenv` sans usage evident, donnees de
  demonstration dans `069_seed_guests.sql`, absence de tests) : inchanges.
- Aucune recette fonctionnelle, aucun test RLS, aucun audit de dependances
  n'ont ete realises.

---

# Checklist de livraison

Section operable, a executer **integralement avant chaque remise a un client**.
Elle est issue des defauts reels rencontres jusqu'ici, pas d'une liste
generique. Le principe directeur est simple : **aucune politique RLS n'est
tenue pour acquise parce qu'elle est ecrite dans un fichier de migration. Elle
est verifiee en executant une requete avec un jeton reel.**

## A. Bloquants de vente

- [ ] **Aucun secret dans le dossier.** Ni `SUPABASE_ACCESS_TOKEN`, ni cle
      `service_role`, ni `PROVISIONING_KEY`, ni valeur en dur. Verifier aussi
      les fichiers de travail, scripts PowerShell et `.json` temporaires :
      ils sont souvent hors du dossier projet, donc invisibles a un
      `git status`. Les rapports ecris pour le client ne reproduisent aucune
      valeur, meme tronquee.
- [ ] **Tout jeton ayant ete ecrit en clair est revoque cote Supabase**, pas
      seulement efface du disque. Supprimer le fichier ne suffit pas : le jeton
      reste valide tant qu'il n'est pas revoque depuis la Console.
- [ ] `.env.local` absent. `.env.example` ne contient que des valeurs de
      remplacement, et le build se comporte proprement avec ces placeholders
      (mode degrade prevu, pas d'ecran casse).
- [ ] Aucune donnee de demonstration realiste : profils clients, adresses
      e-mail, identifiants dans les migrations de seed (`069_seed_guests.sql`).
- [ ] Aucun compte de test ni client pilote ne subsiste dans la base livree.
      Compter les lignes apres nettoyage, pas seulement constater que
      l'application ne les affiche pas.

## B. Base et multi-tenancy

- [ ] **RLS active sur la totalite des tables.** Reference attendue au
      2026-10-02 : **42 tables, 42 avec RLS**.
      `SELECT count(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity;`
- [ ] **Aucune politique ne reference un identifiant d'hotel en dur.** C'est le
      piege multi-client principal. Verification :
      ```sql
      SELECT tablename, policyname, qual FROM pg_policies
      WHERE schemaname='public'
        AND coalesce(qual,'') ILIKE '%00000000-0000-0000-0000-000000000001%';
      ```
      Doit renvoyer **0 ligne**. Toute ligne = fuite inter-clients.
- [ ] **Test d'isolation reel, sur deux tenants reels.** Provisionner un tenant
      jetable, se connecter avec le compte de son administrateur, puis verifier
      qu'il ne renvoie que ses propres lignes sur `hotels`, `employees`,
      `bookings`, `guests`, `payments`, `invoices`, `roles`. Un seul tenant en
      base ne prouve rien : c'est precisement ce qui avait laisse passer la
      backdoor de `hotels_select`.
- [ ] Toute fonction `SECURITY DEFINER` porte `SET search_path = public`.
- [ ] Les fonctions de provisioning sont inaccessibles a `anon` et
      `authenticated` : `has_function_privilege('anon', oid, 'EXECUTE')` = false.
- [ ] Inscription fermee cote Auth (`disable_signup`), longueur de mot de passe
      minimale respectée.
- [ ] Pas d'auto-enregistrement d'employe depuis le navigateur, et pas de
      escalade automatique vers Super Admin.

## C. Provisionnement multi-client

- [ ] La cle `PROVISIONING_KEY` est un secret Supabase, **pas une variable du
      depot**. La regenere si elle a transite par un canal non sur.
- [ ] La fonction est deployee et `ACTIVE`. Elle refuse GET, refuse l'absence de
      cle, refuse un corps incomplet.
- [ ] Le provisionnement est **idempotent** : deux appels identiques renvoient
      le meme `hotel_id`.
- [ ] `deno check` et `deno lint` passent sur `supabase/functions/`.
- [ ] La suppression d'un tenant est operationnelle. **Point non resolu au
      2026-10-02** : toutes les cles etrangeres sont en `ON DELETE RESTRICT`,
      donc un hotel ne peut pas etre supprime, ni pour une desinstallation, ni
      pour un effacement RGPD. A traiter avant le premier vrai client.

## D. Build et coherence

- [ ] `npm run lint` (`tsc --noEmit`) et `npm run build` passent **apres** toute
      ajout de fichier. Un type de fichier nouveau peut casser le build sans
      qu'on le voie : au 2026-10-02, l'arrivee des Edge Functions a fait
      echouer `lint` sur le global `Deno`, corrige en excluant
      `supabase/functions` de `tsconfig.json`.
- [ ] Le README, le `CHANGELOG.md` et `DELIVERY.md` disent la meme chose que le
      code. Les compteurs (vues, hooks, migrations, modales) sont verifies, pas
      recopies. Reference au 2026-10-02 : **30 migrations**, derniere `075`.
- [ ] La configuration Auth pointe vers le bon projet, et `site_url` n'est plus
      en `localhost`. **Point non resolu au 2026-10-02.**

## E. Hygiene du depot

- [ ] Le dossier est sous controle de version, avec historique et rollback.
      **Non resolu au 2026-10-02 : ce projet n'est toujours pas un depot git sur
      ce poste.** C'est le point le plus ancien et le plus cher de la liste.
- [ ] Le client sait ce qu'il recoit et ce qu'il ne recoit pas : limites
      connues, ce qui n'a pas ete teste, ce qui releve d'une decision produit.

---

# Corrections appliquees le 2026-10-02

Instantane de la session de durcissement et de mise en place du provisionnement
multi-client. Complete les sections precedentes, qu'elle supplante sur les
sujets traites.

## Securite

- Migration `073_security_hardening.sql`, appliquee. Suppression de la
  politique live `employees_policy` (`FOR ALL USING (true) WITH CHECK (true)`),
  absente des migrations et qui exposait la table `employees` en lecture et
  ecriture anonymes. Recalibrage des politiques `employees`, index unique partiel
  sur `auth_user_id`, trigger de protection de l'identite, `search_path` pose sur
  les 6 fonctions `SECURITY DEFINER`, suppression du trigger
  d'auto-attribution Super Admin, permissions d'ecriture sur `bookings`,
  `booking_rooms`, `booking_guests` et `room_types`.
- Auth : inscriptions desactivees, longueur minimale de mot de passe portee a 12.
- Frontend : auto-enregistrement supprime de `src/lib/hooks/useAuth.ts` et
  `src/lib/services/authService.ts`. Ecran « Compte non provisionne » ajoute
  dans `src/components/AuthGuard.tsx`.

## Fuite inter-clients : `hotels_select`

- Constatee en executant le flux de provisionnement reel, pas en relisant les
  migrations. `063_fix_seed_and_rls.sql` contenait une clause accordant a tout
  utilisateur authentifie la lecture de l'hotel par defaut, introduite pour
  permettre l'auto-enregistrement des employes — supprime depuis.
- Migration `075_tenant_isolation.sql`, appliquee : `hotels_select` est recree
  sans cette clause. La source `063` est annotee comme obsoletee.
- Les autres tables filtrent bien par `fn_is_same_hotel(...)` : la clause
  enforcee a l'origine n'a pas de generalisation a corriger.

## Provisionnement

- Migration `074_provisioning.sql`, appliquee : `fn_provision_hotel`,
  `fn_provision_admin`, `fn_provision_employee`, `fn_link_employee_to_auth_user`.
  Reservees a `service_role`, `SECURITY DEFINER`, `search_path` pose, execute
  refuse a `anon` et `authenticated`. Idempotentes.
- Edge Function `supabase/functions/create-tenant/index.ts`, deployee, secrete
  `x-provisioning-key` compare en temps constant. Quatre modes : hotel,
  hotel + administrateur, creation d'employe, liaison d'un compte Auth a un
  employe existant.
- Recette : provisionnement d'un tenant de bout en bout, connexion reelle du
  compte administrateur cree, role Super Admin attribue, isolation verifiee,
  idempotence verifiee, puis tenant de test integralement supprime.

## Verification

- `npm run lint` et `npm run build` passent. `deno check` et `deno lint` passent
  sur la fonction.
- Etat de la base apres nettoyage : 1 hotel, 3 employes, 42 tables sur 42 avec
  RLS, 0 politique referençant l'hotel par defaut, 0 fonction de
  provisioning accessible a `anon` ou `authenticated`.

## Non traite

- Suppression d'un tenant impossible (`ON DELETE RESTRICT` partout).
- Politiques `SELECT` filtrees par hotel mais pas par permission : un employe
  Housekeeping lit les factures et les cartes de son hotel. **Decision produit
  non prise.**
- `site_url` toujours sur `localhost:3000`.
- Absence de depot git, absence de tests automatises, dependances non auditees :
  inchanges depuis le point 5 de l'audit initial.

