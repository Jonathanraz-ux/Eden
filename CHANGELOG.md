# CHANGELOG

## v0.9.0 — Avis Clients (2026-07-07)

### Nouveautés
- Refonte complète de l'écran « Avis Clients » avec les hooks TanStack Query
- Distribution des notes (5★ → 1★) avec barres de progression
- Réponse aux avis directement depuis l'interface (champ de saisie inline)
- Bouton Afficher/Masquer pour contrôler la visibilité des avis
- Affichage des réponses existantes sur les avis
- Migration complète du service legacy `supabaseService.ts`

### Architecture
- `ReviewsView` utilise désormais `useReviews(hotelId)` hook et `reviewService`
- Types modernes `database.ts` au lieu des types legacy
- Fonctionnalités : reply, toggleVisibility

## v0.8.0 — Notifications (2026-07-07)

### Nouveautés
- Icône de notifications (cloche) dans la TopBar avec badge de notifications non lues
- Dropdown de notifications : liste des 20 dernières avec titre, message, catégorie, temps relatif
- Marquage individuel et "Tout lire" depuis le dropdown
- Onglets par catégorie (confirmation, rappel, alerte, facture…)
- Rafraîchissement automatique toutes les 60 secondes

### Architecture
- `NotificationBell` : composant icône + badge + dropdown autonome, clic extérieur pour fermer
- Utilise les hooks existants `useNotifications` et `useMarkNotificationRead`

## v0.7.0 — Dashboard (2026-07-07)

### Nouveautés
- Refonte complète du Dashboard avec les hooks TanStack Query
- KPIs calculés en temps réel depuis la base de données (revenu total, réservations actives, taux d'occupation, note moyenne)
- Graphique d'évolution des revenus généré à partir des paiements réels
- Liste des réservations récentes avec affichage du statut
- Liste des derniers avis clients

### Architecture
- Migration complète du service legacy `supabaseService.ts` vers les hooks : `useBookings`, `usePayments`, `useReviews`, `useRooms`
- Calculs métier (stats, revenus, occupation) dans des `useMemo` à partir des données réelles
- Suppression de la dépendance aux données mock du dashboard

## v0.6.0 — Paiements & Finances (2026-07-07)

### Nouveautés
- Nouvel écran « Finances » avec deux onglets : Paiements et Factures
- Liste complète des paiements avec recherche, méthode, type, statut, montant
- Onglet Factures : liste des factures avec numéro, dates, statut, montant
- Modal de saisie de paiement avec sélection de réservation, montant, méthode, type
- Calcul automatique du total encaissé affiché dans l'en-tête
- Routes et sidebar ajoutées (onglet « Finances » entre Réservations et Clients)

### Architecture
- `PaymentsView` : nouvelle vue avec double onglet paiements/factures
- `PaymentFormModal` : modal de saisie de paiement avec React Hook Form + Zod
- `usePayments` hooks : `usePayments`, `useCreatePayment`, `useInvoices`, `useGenerateInvoice`
- Intégration route `/payments` dans `App.tsx` et `TopBar.tsx`

## v0.5.0 — Réservations (2026-07-07)

### Nouveautés
- Refonte complète de l'écran « Gestion des Réservations » avec les hooks TanStack Query
- Filtrage par statut (En attente, Confirmée, En cours, Départ, Terminée, Annulée)
- Recherche par référence de réservation
- Panneau latéral de détail : affichage des chambres, clients, paiements, historique des statuts
- Workflow de changement de statut avec transitions autorisées
- Formulaire de création de réservation avec React Hook Form + Zod
- Recherche et sélection de client existant
- Sélection de chambre avec calcul automatique du prix
- Sélection du tarif (Rate Plan)
- Assignation automatique de la chambre et du client principal

### Architecture
- `BookingFormModal` : nouveau modal avec RHF + Zod, remplace l'ancien `BookingModal` legacy
- `BookingDetailPanel` : nouveau panneau latéral de détail réservation
- Hooks ajoutés : `useAddBookingRoom`, `useRemoveBookingRoom`, `useAddBookingGuest`, `useRemoveBookingGuest`
- Migration complète de `BookingsView` du service legacy `supabaseService.ts` vers les hooks TanStack Query
- Types modernes (anglais, snake_case) de `database.ts` au lieu des anciens types legacy

## v0.4.0 — Chambres (2026-07-06)

### Nouveautés
- Refonte complète de l'écran « État des Chambres » avec les hooks TanStack Query
- Filtrage par statut (Disponible, Occupée, Nettoyage, Maintenance)
- Changement de statut inline via un sélecteur déroulant sur chaque carte
- Affichage du type de chambre (Standard, Deluxe, Suite…) et du prix calculé (base + ajustement)
- Capacité effective affichée par chambre
- Modal de création de chambre avec rattachement au type, capacité, ajustement prix et notes
- Refonte de la vue Bungalows/Villas avec recherche textuelle et hooks

### Architecture
- `RoomFormModal` : modal réutilisable de création de chambre avec validation
- `RoomWithType` : type exporté combinant `Room` + `room_types` join
- `roomService.list()` retourne désormais `RoomWithType[]` avec les données du type joint
- `useRooms` hook : gestion des états de chargement via TanStack Query

## v0.3.0 — Permissions (2026-07-06)

### Nouveautés
- Gestion complète des rôles et permissions dans les paramètres (onglet Rôles)
- Création, modification et suppression de rôles
- Assignation visuelle des permissions par groupe (Booking, Payment, Room, Employee…)
- `PermissionGuard` : wrapper conditionnel pour afficher/masquer des UI selon la permission
- `usePermissions` hook : `useEmployeePermissions()`, `useHasPermission()` côté frontend
- `useCan(permission)` : fonction utilitaire pour les vérifications inline

### Architecture
- `employeeService` enrichi : updateRole, softDeleteRole, getRolePermissions, assignPermissionToRole, removePermissionFromRole
- `SettingsView` restructurée en onglets (Général + Rôles)
- `RolesSettingsTab` : formulaire modal avec sélection des permissions

## v0.2.0 — Authentification (2026-07-06)

### Nouveautés
- Page de connexion luxueuse avec formulaire email/mot de passe
- React Router avec routes protégées et redirection automatique
- AuthGuard protégeant toutes les routes métier
- Session persistée via Supabase Auth
- Affichage du nom/prénom de l'employé connecté dans la sidebar et la topbar
- Déconnexion depuis la sidebar ou la topbar

### Architecture
- Installation de `react-router-dom`
- Création de `authService.ts` (login, logout, session, profil employé)
- Hook `useAuth` enrichi : retourne session + employé courant
- Hooks `useLogin`, `useLogout`, `useCurrentHotelId`
- Routing déclaratif dans `App.tsx` avec `<Routes>` et `<Outlet>`
- Sidebar et TopBar migrées vers React Router (`useLocation`, `useNavigate`)

## v0.1.0 — Base SQL (2026-07-06)

### Architecture
- Mise en place de l'architecture 3 couches : Component → Hook → Service → Supabase
- Installation de TanStack Query, React Hook Form, Zod, @hookform/resolvers
- Création du QueryClientProvider et Providers wrapper

### Base de données
- 15 fichiers de migration SQL dans `supabase/migrations/`
- 37 tables couvrant : Core, Rooms, Guests, Employees & Roles, Bookings, Finance, Notifications, Reviews, Audit
- 16 fonctions SQL (vérifications, calculs financiers, permissions, générateurs, cron)
- 18 triggers métier (updated_at, overlap, historiques, audit, notifications, protection)
- 27 index dont 3 partiels (primary guest, bookings actifs, rooms disponibles)
- 50 politiques RLS multi-tenant
- 14 permissions système pré-seedées

### Types & Services
- `src/lib/types/database.ts` — 37 interfaces TypeScript miroir du schéma SQL
- `src/lib/services/` — 9 services découpés par domaine (hotel, room, guest, employee, booking, payment, notification, review, audit)
- `src/lib/hooks/` — 7 fichiers de hooks TanStack Query
- Migration du Supabase client vers `getSupabase()` avec erreur explicite
