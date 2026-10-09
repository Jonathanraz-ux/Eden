# EDEN: Luxury Management — Strategie de test

## Etat des lieux : aucune automatisation

Ce produit **ne possede aucune suite de tests automatises**. Verifie :

- `package.json` ne declare **aucun script `test`**. Scripts presents : `dev`, `build`, `preview`, `clean`, `lint`.
- Aucun fichier `*.test.*` / `*.spec.*` parmi les 95 fichiers de `src/`.
- Aucun runner : pas de Vitest, Jest, Testing Library, Playwright ni Cypress.
- Aucun depot git, donc aucune CI ni historique de verification.

Le produit est le plus volumineux du lot (95 fichiers source, 27 migrations) et le moins couvert. Une regression dans un des 16 hooks de `src/lib/hooks/` ou l'une des 19 vues de `src/views/` ne sera detectee que par un testateur humain.

## Verification manuelle

### 1. Preparation

```bash
cd "D:\Noctis Foundry\03-NOCTIS-ORIGINALS\dashboard-hotel-premium"
npm install
```

### 2. Build de production (bloquant)

```bash
npm run build
```

Attendu : code de sortie 0, sortie dans `dist/`. Le dossier `dist/` existe deja ; le regenere pour valider l'etat courant.

### 3. Lint

```bash
npm run lint
```

### 4. Serveur de developpement

```bash
npm run dev
```

### 5. Parcours des vues

Le produit expose 19 vues (18 fichiers `*View.tsx` plus `RolesSettingsTab.tsx`, rendu par `SettingsView`). Verifier systematiquement : chargement, etat vide, etat d'erreur, creation, edition, suppression, persistance apres rechargement.

| Domaine | Vues concernees |
|---|---|
| Tableau de bord | `DashboardView`, `AnalyticsView` |
| Reservations | `BookingsView`, `FrontDeskView` |
| Clients | `GuestsView` |
| Chambres | `RoomsView`, `HousekeepingView` |
| Finances | `PaymentsView`, `InvoicingView`, `PricingView` |
| Restaurant | `RestaurantView` |
| Services | `ServicesView` |
| Operations | `OperationsCenterView` |
| Social | `GalleryView`, `ReviewsView` |
| Personnel / acces | `EmployeesView`, `SettingsView`, `RolesSettingsTab` |
| Connexion | `LoginView` |

Verifier aussi les 17 modales de `src/components/` (`*Modal.tsx` : check-in, check-out, formulaire de reservation, creation et detail de facture, paiement, tarif, saison, taxe, service, plat, employe, client, chambre, maintenance, media, remise), le theme, et le responsive (375 / 768 / 1440 px).

### 6. Statut reel des modules (a trancher)

Le tableau de statut du `README.md` marque desormais les 10 modules sur 10 comme « Termine » : la contradiction signalee par la version precedente de ce document (4 modules « A venir ») a ete corrigee dans le `README.md` lui-meme.

La mention « Termine » y est explicitement bornee : elle signifie « code livre et branche » (vue, hooks, services, tables SQL, politiques RLS), pas « recette fonctionnelle validee ». Avant toute verification fonctionnelle, trancher donc sur le fond : ne pas presumer que « le fichier existe » signifie « la feature marche ». Verifier module par module, en commencant par l'authentification, les permissions et l'isolation multi-tenant.

### 7. RLS (si Supabase est configure)

1. Appliquer les 27 migrations de `supabase/migrations/` **dans l'ordre** sur un projet Supabase vierge (001 a 072, sequence non contigue).
2. Points d'attention identifies : `050_rls.sql`, `060_seed_permissions.sql`, `063_fix_seed_and_rls.sql`, `066_fix_missing_rls_policies.sql`, `067_comprehensive_fix.sql`. Plusieurs migrations successives corrigent les politiques RLS : l'accumulation de correctifs est un signal de conception fragile a examiner.
3. Tester exclusivement avec la cle **anon** via le client.
4. Verifier l'isolation multi-tenant : un hotel ne doit voir ni les reservations, ni les clients, ni les factures d'un autre hotel. C'est le risque principal de ce produit.
5. Verifier les politiques de stockage (`070_storage_gallery.sql`) et le declenchement super-admin (`071_auto_super_admin.sql`).

**Non execute.** Decrit comme procedure, pas valide.

## Non couvert

- Tests unitaires, integration, end-to-end, non-regression.
- Isolation multi-tenant et RLS (risque le plus eleve, non teste).
- Coherence des migrations entre elles et avec le code.
- Performance, charge, requetes N+1 sur le tableau de bord et les analyses.
- Accessibilite (RGAA, clavier, lecteurs d'ecran).
- Revue de securite, audit des dependances (`npm audit`).
- Compatibilite navigateurs, tests sur appareils physiques.
- Tenue en charge multi-hotel.
- Parcours de facturation et de paiement de bout en bout.
