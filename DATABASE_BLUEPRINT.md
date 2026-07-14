# EDEN: Luxury Management — Database Blueprint v1.1

> **Document d'architecture** définissant la structure complète de la base de données PostgreSQL/Supabase
> pour le PMS hôtelier EDEN, avant toute génération SQL.
>
> Ce blueprint est la traduction technique du **Domain Model v1.1** validé par le CTO,
> et intègre les décisions architecturales du CTO (Q01–Q10).
>
> **Aucun SQL final n'est généré ici.** Ce document est le plan directeur.

---

## 1. Objectif

Ce blueprint définit l'architecture de la base de données relationnelle qui soutiendra EDEN, un PMS hôtelier SaaS multi-tenant, white-label, destiné à l'hôtellerie de luxe.

Objectifs poursuivis :

- Garantir l'intégrité des règles métier validées dans le Domain Model v1.1
- Assurer l'isolation multi-tenant stricte via hotel_id + RLS
- Permettre l'évolution du schéma sans rupture
- Servir de contrat entre l'architecture, le développement backend et le frontend
- Fournir une base exploitable pour générer le SQL final

---

## 2. Principes généraux

| Principe | Règle |
|---|---|
| **Multi-tenant strict** | Toute table métier contient `hotel_id` (UUID, NOT NULL). Aucune donnée métier orpheline. |
| **Isolation par RLS** | Les politiques Row Level Security filtrent par `hotel_id`. Les utilisateurs ne voient que les données de leur hôtel. |
| **Clés primaires** | UUID v4 partout. Pas de séquences auto-incrémentées. |
| **Clés étrangères** | Nommées, avec ON DELETE RESTRICT ou SET NULL. Pas de CASCADE automatique sans validation. |
| **Audit** | Toute modification de statut est tracée. Toute action sensible est loggée dans `audit_logs`. |
| **Soft delete** | Limitée aux tables métier principales : hotels, rooms, room_types, guests, employees, bookings, services, rate_plans, reviews. |
| **Immuabilité** | payments, invoices, invoice_items, audit_logs, booking_status_history, room_status_history sont immuables : pas de soft delete, pas de UPDATE après finalisation. Toute correction passe par un nouvel enregistrement (refund, credit note). |
| **Montants** | INTEGER en centimes. Ex. `amount_cents = 12500` pour 125,00 €. Pas de DECIMAL pour les montants. |
| **Devise** | Stockée en TEXT (ISO 4217). Pas de conversion automatique en V1. Chaque hôtel opère dans sa devise unique. |
| **Statuts** | TEXT + CHECK constraint. Pas d'enums PostgreSQL. |
| **Timestamps** | `created_at` et `updated_at` (TIMESTAMPTZ, NOT NULL) sur toutes les tables. |

---

## 3. Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Tables | Pluriel, snake_case | `booking_rooms`, `room_amenities` |
| Colonnes | snake_case | `check_in_date`, `is_primary` |
| Clés primaires | `id` (UUID) | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Clés étrangères | `{table_singular}_id` | `hotel_id`, `booking_id`, `room_id` |
| Montants | `{name}_cents` | `total_amount_cents`, `paid_amount_cents` |
| Index | `idx_{table}_{colonnes}` | `idx_bookings_hotel_id_status` |
| Contraintes | `ck_{table}_{description}` | `ck_booking_rooms_no_overlap` |
| Triggers | `trg_{table}_{action}` | `trg_bookings_status_change` |
| Fonctions | `fn_{description}` | `fn_check_room_availability` |
| Vues | `v_{description}` | `v_daily_occupancy` |
| Booléens | `is_` ou `has_` préfixe | `is_active`, `is_refundable` |
| Dates seules | `{type}_date` | `check_in_date`, `birth_date` |
| Date+heure | `{type}_at` | `confirmed_at`, `cancelled_at` |

---

## 4. Tables et relations

### 4.1 Core

#### hotels

Table racine du système multi-tenant.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | NOT NULL | |
| brand | TEXT | | Pour white label |
| address_line_1 | TEXT | | |
| address_line_2 | TEXT | | |
| city | TEXT | | |
| postal_code | TEXT | | |
| region | TEXT | | |
| country | TEXT | NOT NULL | ISO 3166-1 |
| star_rating | SMALLINT | CHECK (1–5) | |
| phone | TEXT | | |
| email | TEXT | | |
| website | TEXT | | |
| currency_code | TEXT | NOT NULL | ISO 4217 — devise unique de l'hôtel |
| default_language | TEXT | NOT NULL | ISO 639-1 |
| timezone | TEXT | NOT NULL | IANA timezone |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

**Relations :** Toutes les tables métier pointent vers `hotels.id`.

---

#### hotel_settings

Un-à-un avec hotels. Paramètres de fonctionnement.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, UNIQUE, NOT NULL | |
| cancellation_policy | JSONB | | Délais et seuils (montants en cents) |
| no_show_policy | JSONB | | Délai et frais (montants en cents) |
| expiration_delay | INTERVAL | NOT NULL | Délai avant expiration Pending |
| check_in_time | TIME | NOT NULL | Ex. 15:00 |
| check_out_time | TIME | NOT NULL | Ex. 11:00 |
| default_vat_rate | INTEGER | | Ex. 2000 = 20,00 % (en centièmes) |
| cleaning_fee_cents | INTEGER | | |
| deposit_required | BOOLEAN | DEFAULT false | |
| deposit_amount_cents | INTEGER | | |
| languages_available | TEXT[] | | |
| custom_settings | JSONB | | Extensible |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### buildings

Bâtiments d'un hôtel (optionnel, pour les grands resorts).

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | Ex. "Bâtiment Principal", "Villa Ouest" |
| code | TEXT | | Code court pour les chambres |
| description | TEXT | | |
| sort_order | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

---

#### floors

Étages (optionnel).

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| building_id | UUID | FK → buildings, nullable | |
| name | TEXT | NOT NULL | "Rez-de-chaussée", "Étage 1" |
| level | SMALLINT | | Numéro d'étage |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

---

#### room_types

Catégorie de chambres.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | Standard, Deluxe, Suite… |
| description | TEXT | | |
| base_capacity | SMALLINT | NOT NULL | |
| base_price_cents | INTEGER | NOT NULL | Hors saison, hors plan. En centimes. |
| surface_m2 | DECIMAL(6,1) | | |
| is_active | BOOLEAN | DEFAULT true | |
| sort_order | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### rooms

Unités physiques.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| room_type_id | UUID | FK → room_types, NOT NULL | |
| building_id | UUID | FK → buildings, nullable | |
| floor_id | UUID | FK → floors, nullable | |
| name | TEXT | NOT NULL | |
| actual_capacity | SMALLINT | NOT NULL | |
| actual_surface_m2 | DECIMAL(6,1) | | |
| price_adjustment_cents | INTEGER | DEFAULT 0 | Surcharge/remise en centimes |
| status | TEXT | NOT NULL, CHECK IN ('available','reserved','occupied','cleaning','maintenance','out_of_service') | |
| is_active | BOOLEAN | DEFAULT true | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### amenities

Équipements (multilingue, iconifiés, filtrables).

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| translations | JSONB | | `{"fr":"Climatisation","en":"Air conditioning"}` |
| icon | TEXT | | Identifiant d'icône |
| category | TEXT | | |
| sort_order | INTEGER | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

---

#### room_amenities

Association chambre ↔ équipement.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| room_id | UUID | FK → rooms, NOT NULL | |
| amenity_id | UUID | FK → amenities, NOT NULL | |
| quantity | INTEGER | DEFAULT 1 | |
| notes | TEXT | | |
| UNIQUE | (room_id, amenity_id) | | |

---

#### room_type_amenities

Équipements par défaut d'un type de chambre.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| room_type_id | UUID | FK → room_types, NOT NULL | |
| amenity_id | UUID | FK → amenities, NOT NULL | |
| quantity | INTEGER | DEFAULT 1 | |
| UNIQUE | (room_type_id, amenity_id) | | |

---

#### media

Images et documents associés à une entité.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| entity_type | TEXT | NOT NULL | 'hotel','room','room_type' |
| entity_id | UUID | NOT NULL | |
| url | TEXT | NOT NULL | |
| alt_text | TEXT | | |
| sort_order | INTEGER | DEFAULT 0 | |
| is_primary | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.2 Guests & Employees

#### guests

Clients de l'établissement.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| type | TEXT | NOT NULL, CHECK IN ('individual','company','agency','partner') | |
| first_name | TEXT | | |
| last_name | TEXT | NOT NULL | |
| email | TEXT | | |
| phone | TEXT | | |
| document_type | TEXT | | |
| document_number | TEXT | | |
| document_expiry | DATE | | |
| birth_date | DATE | | |
| nationality | TEXT | | ISO 3166-1 |
| address | JSONB | | |
| preferences | JSONB | | |
| first_stay_date | DATE | | |
| stay_count | INTEGER | DEFAULT 0 | |
| segment | TEXT | | |
| loyalty_program | JSONB | | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### employees

Personnel de l'établissement.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| auth_user_id | UUID | UNIQUE, nullable | Lié à Supabase Auth |
| first_name | TEXT | NOT NULL | |
| last_name | TEXT | NOT NULL | |
| email | TEXT | NOT NULL | |
| phone | TEXT | | |
| job_title | TEXT | | |
| department | TEXT | | |
| status | TEXT | NOT NULL, CHECK IN ('active','on_leave','absent','inactive','suspended') | |
| hire_date | DATE | | |
| supervisor_id | UUID | FK → employees, nullable | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### roles

Regroupements de permissions.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| hierarchy_level | INTEGER | DEFAULT 0 | |
| is_system | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | |

---

#### permissions

Droits atomiques (table système globale, non liée à un hôtel).

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| code | TEXT | UNIQUE, NOT NULL | 'booking.create', 'payment.refund' |
| name | TEXT | NOT NULL | |
| group_name | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### role_permissions

Association rôle ↔ permission.

| Colonne | Type | Contraintes |
|---|---|---|
| role_id | UUID | FK → roles, NOT NULL |
| permission_id | UUID | FK → permissions, NOT NULL |
| UNIQUE | (role_id, permission_id) | |

---

#### employee_roles

Association employé ↔ rôle.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| employee_id | UUID | FK → employees, NOT NULL | |
| role_id | UUID | FK → roles, NOT NULL | |
| assigned_by | UUID | FK → employees, nullable | |
| assigned_at | TIMESTAMPTZ | DEFAULT now() | |
| UNIQUE | (employee_id, role_id) | | |

---

### 4.3 Bookings

#### bookings

Réservation principale. Ne contient ni les chambres ni les clients directement.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| rate_plan_id | UUID | FK → rate_plans, NOT NULL | |
| booking_reference | TEXT | NOT NULL | Lisible client : EDEN-202607-0421 |
| created_at | TIMESTAMPTZ | NOT NULL | |
| check_in_date | DATE | NOT NULL | |
| check_out_date | DATE | NOT NULL, CHECK (check_out_date > check_in_date) | |
| night_count | SMALLINT | NOT NULL, CHECK (night_count = check_out_date - check_in_date) | |
| status | TEXT | NOT NULL, CHECK IN ('pending','confirmed','checked_in','checked_out','completed','cancelled','no_show','expired') | |
| total_amount_cents | INTEGER | DEFAULT 0 | Recalculé par trigger |
| paid_amount_cents | INTEGER | DEFAULT 0 | Recalculé par trigger |
| balance_cents | INTEGER | DEFAULT 0 | total − paid |
| currency_code | TEXT | NOT NULL | ISO 4217 — devise de l'hôtel |
| source | TEXT | | 'direct','booking.com','expedia'… |
| special_requests | TEXT | | |
| internal_notes | TEXT | | |
| confirmed_at | TIMESTAMPTZ | | |
| cancelled_at | TIMESTAMPTZ | | |
| cancellation_reason | TEXT | | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### booking_rooms

Association booking ↔ chambre. Permet multi-chambres.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| room_id | UUID | FK → rooms, NOT NULL | |
| check_in_date | DATE | NOT NULL, CHECK (check_in_date >= booking.check_in_date) | |
| check_out_date | DATE | NOT NULL, CHECK (check_out_date > check_in_date) | |
| night_count | SMALLINT | NOT NULL | |
| adult_count | SMALLINT | DEFAULT 1, CHECK (> 0) | |
| child_count | SMALLINT | DEFAULT 0 | |
| applied_price_cents | INTEGER | NOT NULL | Prix par nuit après saison + plan |
| status | TEXT | NOT NULL, CHECK IN ('reserved','occupied','vacated','cancelled') | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### booking_guests

Association booking ↔ guest.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| guest_id | UUID | FK → guests, NOT NULL | |
| role | TEXT | NOT NULL, CHECK IN ('primary_guest','adult','child','infant','billing_contact') | |
| is_payer | BOOLEAN | DEFAULT false | |
| is_main_contact | BOOLEAN | DEFAULT false | |
| check_in_date | DATE | | Arrivée différée |
| check_out_date | DATE | | Départ anticipé |
| UNIQUE (booking_id, guest_id) | | | |

**Contrainte métier :** Exactement un `primary_guest` par booking (trigger).

---

#### booking_services

Services achetés dans une réservation. Prix figé à l'achat.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| service_id | UUID | FK → services, NOT NULL | |
| booking_guest_id | UUID | FK → booking_guests, nullable | |
| quantity | INTEGER | NOT NULL, CHECK (> 0) | |
| unit_price_cents | INTEGER | NOT NULL | Figé à l'achat |
| total_price_cents | INTEGER | NOT NULL | quantity × unit_price_cents |
| service_date | DATE | | |
| status | TEXT | DEFAULT 'pending', CHECK IN ('pending','delivered','cancelled') | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### booking_status_history

Historique des changements de statut d'un booking. **Immuable : pas de UPDATE, pas de soft delete.**

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| previous_status | TEXT | | |
| new_status | TEXT | NOT NULL | |
| changed_by | UUID | | ID Employee ou Guest |
| changed_by_type | TEXT | | 'employee','guest','system' |
| reason | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### room_status_history

Historique des changements de statut d'une chambre. **Immuable.**

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| room_id | UUID | FK → rooms, NOT NULL | |
| previous_status | TEXT | | |
| new_status | TEXT | NOT NULL | |
| changed_by | UUID | | ID Employee |
| reason | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

### 4.4 Finance

#### payments

Transactions financières. **Immuable : une fois le statut 'success', le montant ne peut plus changer.**
Les corrections passent par un nouveau payment de type 'refund' ou 'credit_note'.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| employee_id | UUID | FK → employees, nullable | Si paiement manuel |
| guest_id | UUID | FK → guests, nullable | Payeur |
| amount_cents | INTEGER | NOT NULL, CHECK (> 0 pour les paiements, < 0 pour les refunds) | |
| currency_code | TEXT | NOT NULL | |
| method | TEXT | NOT NULL, CHECK IN ('card','cash','transfer','mobile_money','check','crypto') | |
| type | TEXT | NOT NULL, CHECK IN ('deposit','balance','deposit_guarantee','refund','supplement','credit_note') | |
| status | TEXT | NOT NULL, CHECK IN ('pending','success','failed','refunded','partially_refunded') | |
| external_reference | TEXT | | |
| notes | TEXT | | |
| processed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### invoices

Factures. **Immuable : une fois le statut 'issued', les lignes sont figées.**
Les corrections passent par une note de crédit (credit_note).

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| booking_id | UUID | FK → bookings, NOT NULL | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| invoice_number | TEXT | NOT NULL | Séquentiel par hôtel (via invoice_sequences) |
| issue_date | DATE | NOT NULL | |
| due_date | DATE | NOT NULL | |
| total_amount_cents | INTEGER | NOT NULL | |
| tax_amount_cents | INTEGER | DEFAULT 0 | |
| discount_amount_cents | INTEGER | DEFAULT 0 | |
| net_amount_cents | INTEGER | NOT NULL | total − discount |
| status | TEXT | NOT NULL, CHECK IN ('draft','issued','paid','cancelled','credit_note') | |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

#### invoice_items

Lignes de facture. **Immuable.**

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| invoice_id | UUID | FK → invoices, NOT NULL | |
| description | TEXT | NOT NULL | |
| quantity | INTEGER | NOT NULL | |
| unit_price_cents | INTEGER | NOT NULL | |
| total_price_cents | INTEGER | NOT NULL | |
| tax_rate | INTEGER | DEFAULT 0 | En centièmes (2000 = 20 %) |
| tax_id | UUID | FK → taxes, nullable | |
| discount_id | UUID | FK → discounts, nullable | |
| sort_order | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### taxes

TVA et autres taxes.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| rate | INTEGER | NOT NULL | En centièmes : 2000 = 20,00 % |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### discounts

Remises et promotions.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| type | TEXT | NOT NULL, CHECK IN ('percentage','fixed_amount') | |
| value | INTEGER | NOT NULL | Pourcentage (ex. 1500 = 15 %) OU montant en centimes |
| code | TEXT | | Code promo |
| is_active | BOOLEAN | DEFAULT true | |
| valid_from | DATE | | |
| valid_until | DATE | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### currencies

Devises supportées. **Table de référence uniquement. Pas de conversion automatique en V1.**

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| code | TEXT | PK | ISO 4217 |
| name | TEXT | NOT NULL | |
| symbol | TEXT | | |
| is_active | BOOLEAN | DEFAULT true | |

---

#### rate_plans

Plans tarifaires.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| cancellation_policy | JSONB | | Montants en cents |
| deposit_required_cents | INTEGER | | Acompte en centimes |
| deposit_percentage | INTEGER | | Alternative : pourcentage (ex. 3000 = 30 %) |
| is_refundable | BOOLEAN | DEFAULT true | |
| is_active | BOOLEAN | DEFAULT true | |
| conditions | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### rate_plan_room_types

Association entre un plan tarifaire et les types de chambres auxquels il s'applique.
Permet de définir quels RatePlan sont disponibles pour quelles catégories de chambres.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| rate_plan_id | UUID | FK → rate_plans, NOT NULL | |
| room_type_id | UUID | FK → room_types, NOT NULL | |
| applied_price_cents | INTEGER | nullable | Surcharge ou prix spécifique pour ce couple (optionnel) |
| UNIQUE | (rate_plan_id, room_type_id) | | |

---

#### seasons

Périodes tarifaires.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| start_date | DATE | NOT NULL | |
| end_date | DATE | NOT NULL, CHECK (end_date >= start_date) | |
| pricing_mode | TEXT | NOT NULL, CHECK IN ('percentage','fixed_amount','fixed_price','per_night','weekend_price','event_price') | |
| value | INTEGER | NOT NULL | Sens dépend du mode (voir ci-dessous) |
| apply_days | SMALLINT[] | nullable | Jours de semaine (0 = dimanche) |
| priority | INTEGER | DEFAULT 0 | |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

**Valeur selon le mode :**
- `percentage` → valeur en centièmes (ex. 5000 = +50 %)
- `fixed_amount` → valeur en centimes (ex. 3000 = +30,00 €)
- `fixed_price` → valeur en centimes (ex. 45000 = 450,00 €/nuit)
- `per_night` → JSONB dans value (prix par date)
- `weekend_price` → valeur en centimes
- `event_price` → valeur en centimes

---

#### services

Prestations complémentaires.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| name | TEXT | NOT NULL | |
| translations | JSONB | | |
| description | TEXT | | |
| unit_price_cents | INTEGER | NOT NULL | |
| pricing_type | TEXT | NOT NULL, CHECK IN ('per_person','per_room','per_night','flat') | |
| tax_rate | INTEGER | DEFAULT 0 | En centièmes |
| is_active | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

#### invoice_sequences

Séquences de numérotation des factures, par hôtel et par année.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| year | INTEGER | NOT NULL | |
| prefix | TEXT | NOT NULL | Ex. 'FAC', 'INV' |
| current_number | INTEGER | NOT NULL, DEFAULT 0 | Dernier numéro attribué |
| UNIQUE | (hotel_id, year, prefix) | | |

**Fonctionnement :** À chaque nouvelle facture, `current_number` est incrémenté dans une transaction atomique.
Le numéro de facture est construit comme : `{prefix}-{year}-{current_number}`.

---

### 4.5 Communication

#### notifications

Messages système.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| booking_id | UUID | FK → bookings, nullable | |
| payment_id | UUID | FK → payments, nullable | |
| title | TEXT | NOT NULL | |
| body | TEXT | NOT NULL | |
| category | TEXT | NOT NULL, CHECK IN ('confirmation','reminder','alert','promotion','invoice','internal','urgent') | |
| priority | TEXT | DEFAULT 'normal', CHECK IN ('low','normal','high','urgent') | |
| template | TEXT | | |
| sender_type | TEXT | | 'employee','system' |
| sender_id | UUID | | |
| sent_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### notification_recipients

Destinataires d'une notification.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| notification_id | UUID | FK → notifications, NOT NULL | |
| recipient_type | TEXT | NOT NULL, CHECK IN ('guest','employee') | |
| recipient_id | UUID | NOT NULL | ID Guest ou Employee |
| channel | TEXT | NOT NULL, CHECK IN ('email','sms','push','in_app','whatsapp') | |
| status | TEXT | DEFAULT 'pending', CHECK IN ('pending','sent','delivered','read','archived','failed') | |
| read_at | TIMESTAMPTZ | | |
| attempt_count | INTEGER | DEFAULT 0 | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

#### reviews

Avis clients.

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| guest_id | UUID | FK → guests, NOT NULL | |
| booking_id | UUID | FK → bookings, nullable | |
| rating | SMALLINT | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | |
| title | TEXT | | |
| comment | TEXT | | |
| stay_date_start | DATE | | |
| stay_date_end | DATE | | |
| platform | TEXT | | 'internal','google','booking','tripadvisor' |
| hotel_reply | TEXT | | |
| internal_note | TEXT | | |
| is_visible | BOOLEAN | DEFAULT true | |
| is_verified | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |
| deleted_at | TIMESTAMPTZ | | Soft delete |

---

### 4.6 System

#### audit_logs

Trace de toutes les actions importantes. **Immuable : pas de UPDATE, pas de soft delete.**

| Colonne | Type | Contraintes | Notes |
|---|---|---|---|
| id | UUID | PK | |
| hotel_id | UUID | FK → hotels, NOT NULL | |
| employee_id | UUID | FK → employees, nullable | |
| guest_id | UUID | FK → guests, nullable | |
| action | TEXT | NOT NULL | 'booking.confirmed', 'payment.refunded' |
| entity_type | TEXT | NOT NULL | 'booking','payment','room','employee'… |
| entity_id | UUID | NOT NULL | |
| old_value | JSONB | | |
| new_value | JSONB | | |
| ip_address | TEXT | | |
| context | JSONB | | |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## 5. Contraintes métier

### 5.1 Empêcher le chevauchement des chambres (Double booking)

**Principe :** Une Room ne peut avoir qu'un seul BookingRoom actif sur une période donnée.

**Pseudo-logique de la fonction `fn_check_room_availability` :**

```
Si (new.status IN ('reserved','occupied'))
  ET (le booking parent est confirmed/checked_in/checked_out)
  ET (EXISTS un autre booking_room sur la même room
       avec période chevauchante [new.check_in, new.check_out[
       ET statut 'reserved' ou 'occupied'
       ET booking parent confirmed/checked_in/checked_out
       ET id ≠ new.id)
Alors REJETER
```

**Règle de chevauchement :** Deux périodes [a, b[ et [c, d[ chevauchent si a < d ET c < b.

### 5.2 Primary Guest unique par booking

**Trigger :** `trg_booking_guests_unique_primary`

```
Sur INSERT ou UPDATE de booking_guests :
  Si new.role = 'primary_guest'
    Alors vérifier qu'aucun autre booking_guest avec role='primary_guest'
    n'existe pour ce booking_id (sauf l'enregistrement courant)
  Si aucun primary_guest n'existe après l'opération
    Alors REJETER
```

### 5.3 Check-out bloqué si solde positif

**Trigger :** `trg_bookings_check_balance_before_checkout`

```
Sur UPDATE de bookings :
  Si new.status = 'checked_out'
    ET old.status IN ('confirmed','checked_in')
    ET new.balance_cents > 0
    ET l'employé n'a PAS la permission 'booking.force_checkout'
  Alors REJETER
```

### 5.4 Calcul des nuits : logique [check_in, check_out[

Une nuit = une date de calendrier. La période va du check_in inclus au check_out exclus.

```
night_count = (check_out_date - check_in_date)  -- en jours
```

Vérifié par CHECK constraint sur `bookings` et `booking_rooms`.

### 5.5 Statuts des bookings

```
CHECK (status IN (
  'pending', 'confirmed', 'checked_in',
  'checked_out', 'completed', 'cancelled',
  'no_show', 'expired'
))
```

**Transitions autorisées :**

| Depuis | Vers |
|---|---|
| pending | confirmed, expired, cancelled |
| confirmed | checked_in, cancelled, no_show |
| checked_in | checked_out, cancelled |
| checked_out | completed, cancelled |
| no_show | cancelled |
| expired | terminal |
| completed | terminal (sauf dérogation) |
| cancelled | terminal |

### 5.6 Statuts des chambres

```
CHECK (status IN (
  'available', 'reserved', 'occupied',
  'cleaning', 'maintenance', 'out_of_service'
))
```

**Transitions :**

| Depuis | Vers |
|---|---|
| available | reserved, maintenance, out_of_service |
| reserved | occupied, available |
| occupied | cleaning, maintenance |
| cleaning | available, maintenance |
| maintenance | available, out_of_service |
| out_of_service | available, maintenance |

### 5.7 Paiements partiels

Un booking peut avoir plusieurs payments. `paid_amount_cents` et `balance_cents` sont mis à jour automatiquement :

```
paid_amount_cents = SUM des payments avec type IN ('deposit','balance','supplement')
                    ET status = 'success'
                    MOINS SUM des payments avec type = 'refund' ET status = 'success'

balance_cents = total_amount_cents - paid_amount_cents
```

**Fonction :** `fn_recalculate_booking_finances(booking_id)` appelée après chaque INSERT/UPDATE/DELETE sur `payments`.

### 5.8 Remboursements

Un remboursement est un Payment avec `type = 'refund'` et `amount_cents < 0`.

- Un refund ne peut être créé que si le booking a des paiements成功 antérieurs
- Le total des refunds ne peut pas dépasser le total des paiements成功
- Après un refund, `paid_amount_cents` et `balance_cents` sont recalculés

### 5.9 Taxes

Stockées dans `taxes` avec `rate` en centièmes (2000 = 20,00 %).
Appliquées dans `invoice_items.tax_rate`.

```
tax_amount_cents = total_price_cents × tax_rate / 10000
invoice.tax_amount_cents = SUM des tax_amount_cents de ses lignes
```

### 5.10 Remises

Deux types :
- `percentage` : `value` = pourcentage en centièmes (1500 = 15 %)
- `fixed_amount` : `value` = montant en centimes

Appliquées au niveau `invoice_items` ou au niveau `invoices`.

### 5.11 Factures

Générée à partir d'un booking. Workflow : Draft → Issued → Paid → Cancelled / Credit note.

- Une fois `issued`, les lignes sont figées
- Les corrections passent par une invoice de type `credit_note`
- La numérotation utilise `invoice_sequences` avec un lock atomique

### 5.12 Historique des statuts

`booking_status_history` et `room_status_history` enregistrent chaque changement via trigger.
**Ces tables sont immuables : pas de UPDATE, pas de DELETE.**

### 5.13 Audit logs

`audit_logs` enregistre toutes les actions sensibles. **Immuable.**

**Scopes couverts :**
- Changement de statut d'un booking
- Changement de statut d'une room
- Création / annulation / remboursement d'un payment
- Création / modification / suppression d'un employé
- Modification des paramètres hôtel
- Attribution / retrait de rôle
- Toute action nécessitant une permission spécifique

### 5.14 Immuabilité des données financières

| Table | Statut final | Règle |
|---|---|---|
| payments | success | Montant et type ne peuvent plus changer. Correction = refund |
| invoices | issued | Lignes figées. Correction = credit note |
| invoice_items | lié à invoice.issued | Pas de UPDATE après émission |
| audit_logs | — | Pas de UPDATE, pas de DELETE |
| booking_status_history | — | Pas de UPDATE, pas de DELETE |
| room_status_history | — | Pas de UPDATE, pas de DELETE |

---

## 6. Index

### 6.1 Index obligatoires

| Table | Index | Colonnes | Justification |
|---|---|---|---|
| hotels | idx_hotels_active | is_active | Filtrage hôtels actifs |
| rooms | idx_rooms_hotel_id_status | hotel_id, status | Disponibilité par hôtel |
| rooms | idx_rooms_type_id | room_type_id | Jointure room_types |
| rooms | idx_rooms_building_floor | building_id, floor_id | Filtrage géographique |
| bookings | idx_bookings_hotel_id_status | hotel_id, status | Dashboard par statut |
| bookings | idx_bookings_hotel_id_dates | hotel_id, check_in_date, check_out_date | Recherche par période |
| bookings | idx_bookings_reference | booking_reference | Recherche rapide |
| bookings | idx_bookings_status | status | Agrégation par statut |
| booking_rooms | idx_booking_rooms_room_id_dates | room_id, check_in_date, check_out_date | Vérification disponibilité |
| booking_rooms | idx_booking_rooms_booking_id | booking_id | Jointure bookings |
| booking_guests | idx_booking_guests_guest_id | guest_id | Recherche par client |
| booking_guests | idx_booking_guests_primary | booking_id | Index partiel WHERE role='primary_guest' |
| guests | idx_guests_hotel_id_email | hotel_id, email | Recherche client |
| guests | idx_guests_hotel_id_phone | hotel_id, phone | Recherche par téléphone |
| guests | idx_guests_document | document_type, document_number | Vérification document |
| payments | idx_payments_booking_id | booking_id | Jointure bookings |
| payments | idx_payments_hotel_id_status | hotel_id, status | Suivi des paiements |
| invoices | idx_invoices_booking_id | booking_id | Jointure |
| invoices | idx_invoices_hotel_id_number | hotel_id, invoice_number | UNIQUE + recherche |
| notifications | idx_notifications_hotel_id | hotel_id | Filtrage |
| notification_recipients | idx_notif_recipients_unread | recipient_type, recipient_id, status | Notifications non lues |
| audit_logs | idx_audit_logs_hotel_id_created | hotel_id, created_at | Historique chronologique |
| audit_logs | idx_audit_logs_entity | entity_type, entity_id | Recherche par entité |
| seasons | idx_seasons_hotel_id_dates | hotel_id, start_date, end_date | Calcul tarif |
| booking_status_history | idx_booking_status_history_booking | booking_id, created_at | Historique |
| room_status_history | idx_room_status_history_room | room_id, created_at | Historique |
| rate_plan_room_types | idx_rate_plan_room_types_plan | rate_plan_id | Jointure |
| rate_plan_room_types | idx_rate_plan_room_types_type | room_type_id | Jointure |

### 6.2 Index partiels

```sql
-- Primary guest unique par booking
CREATE UNIQUE INDEX idx_booking_guests_unique_primary
  ON booking_guests (booking_id)
  WHERE role = 'primary_guest';

-- Bookings actifs (non terminés)
CREATE INDEX idx_bookings_active
  ON bookings (hotel_id, check_in_date, check_out_date)
  WHERE status IN ('pending', 'confirmed', 'checked_in', 'checked_out');

-- Rooms disponibles
CREATE INDEX idx_rooms_available
  ON rooms (hotel_id)
  WHERE status = 'available' AND is_active = true;
```

---

## 7. Vues

### 7.1 v_daily_stats

Statistiques quotidiennes pour le dashboard.

```
Colonnes : hotel_id, stat_date,
           total_rooms, occupied_rooms, available_rooms,
           maintenance_rooms, cleaning_rooms,
           check_ins_today, check_outs_today,
           total_bookings, confirmed_bookings, pending_bookings,
           revenue_today_cents, revenue_month_cents,
           occupancy_rate
```

### 7.2 v_room_availability

Disponibilité des chambres par date.

```
Colonnes : hotel_id, room_id, room_name, room_type,
           date, is_available, booking_id (si réservé)
```

### 7.3 v_booking_balance

Soldes des réservations en cours.

```
Colonnes : booking_id, reference, guest_name,
           check_in, check_out,
           total_amount_cents, paid_amount_cents,
           balance_cents, status, days_until_checkin
```

### 7.4 v_upcoming_arrivals

Arrivées du jour et du lendemain.

```
Colonnes : booking_id, reference, guest_name, room_name,
           check_in_date, night_count, adult_count, child_count,
           source, special_requests, status
Filtre  : check_in_date BETWEEN today AND today+1
          AND status IN ('confirmed', 'pending')
```

### 7.5 v_upcoming_departures

Départs du jour et du lendemain.

```
Colonnes : booking_id, reference, guest_name, room_name,
           check_out_date, status, balance_cents
Filtre  : check_out_date BETWEEN today AND today+1
          AND status IN ('checked_in', 'confirmed')
```

### 7.6 v_unpaid_bookings

Réservations avec solde impayé.

```
Colonnes : booking_id, reference, guest_name, check_in, check_out,
           total_amount_cents, paid_amount_cents, balance_cents,
           status, days_since_creation
Filtre  : balance_cents > 0
          AND status NOT IN ('completed', 'cancelled', 'expired')
```

### 7.7 v_occupancy_rate

Taux d'occupation mensuel par hôtel.

```
Colonnes : hotel_id, year, month,
           total_rooms, room_nights_available,
           room_nights_occupied, occupancy_rate
```

---

## 8. Fonctions SQL prévues

| Fonction | Description | Appelée par |
|---|---|---|
| `fn_check_room_availability(room_id, check_in, check_out, exclude_booking_room_id)` | Vérifie si une chambre est libre sur une période | Trigger booking_rooms |
| `fn_calculate_booking_total(booking_id)` | Recalcule total_amount_cents d'un booking (chambres × nuits × saison × plan + services) | Triggers booking_rooms, booking_services |
| `fn_recalculate_booking_finances(booking_id)` | Met à jour paid_amount_cents et balance_cents d'un booking | Trigger payments |
| `fn_apply_season_pricing(room_id, date)` | Retourne le prix d'une chambre pour une date donnée (applique les saisons) | fn_calculate_booking_total |
| `fn_apply_rate_plan(price_cents, rate_plan_id, date)` | Applique les ajustements du plan tarifaire | fn_calculate_booking_total |
| `fn_get_employee_permissions(employee_id)` | Retourne la liste des permissions d'un employé | RLS, middleware |
| `fn_has_permission(employee_id, permission_code)` | Vérifie si un employé a une permission | RLS policies |
| `fn_generate_booking_reference(hotel_id)` | Génère une référence lisible pour le booking | Application |
| `fn_expire_pending_bookings()` | Passe les bookings Pending en Expired après délai | Cron / pg_cron |
| `fn_process_no_show()` | Passe les bookings Confirmed sans check-in en No-show | Cron / pg_cron |
| `fn_generate_invoice_number(hotel_id)` | Génère le prochain numéro de facture via invoice_sequences | Application |
| `fn_convert_to_cents(amount, currency)` | Convertit un montant saisi en centimes (utile pour l'UI) | Application |

---

## 9. Triggers prévus

| Trigger | Table | Événement | Fonction appelée |
|---|---|---|---|
| `trg_booking_rooms_check_overlap` | booking_rooms | BEFORE INSERT OR UPDATE | `fn_check_room_availability` |
| `trg_booking_rooms_calc_nights` | booking_rooms | BEFORE INSERT OR UPDATE | Calcul night_count |
| `trg_booking_rooms_update_total` | booking_rooms | AFTER INSERT OR UPDATE OR DELETE | `fn_calculate_booking_total` |
| `trg_booking_services_update_total` | booking_services | AFTER INSERT OR UPDATE OR DELETE | `fn_calculate_booking_total` |
| `trg_payments_update_finances` | payments | AFTER INSERT OR UPDATE OR DELETE | `fn_recalculate_booking_finances` |
| `trg_payments_prevent_update` | payments | BEFORE UPDATE | Empêcher UPDATE si status = 'success' |
| `trg_bookings_status_history` | bookings | AFTER UPDATE OF status | INSERT INTO booking_status_history |
| `trg_bookings_audit_status` | bookings | AFTER UPDATE OF status | INSERT INTO audit_logs |
| `trg_rooms_status_history` | rooms | AFTER UPDATE OF status | INSERT INTO room_status_history |
| `trg_rooms_audit_status` | rooms | AFTER UPDATE OF status | INSERT INTO audit_logs |
| `trg_bookings_notify_status` | bookings | AFTER UPDATE OF status | INSERT INTO notifications + notification_recipients |
| `trg_booking_guests_unique_primary` | booking_guests | BEFORE INSERT OR UPDATE | Vérifier un seul primary_guest |
| `trg_bookings_protect_finances` | bookings | BEFORE UPDATE | Empêcher modification manuelle de paid_amount_cents et balance_cents |
| `trg_bookings_checkout_balance` | bookings | BEFORE UPDATE | Bloquer check-out si balance_cents > 0 |
| `trg_bookings_calc_nights` | bookings | BEFORE INSERT OR UPDATE | Calcul night_count |

---

## 10. RLS (Row Level Security)

### 10.1 Principe

Toutes les tables métier sont protégées par RLS. Chaque politique filtre par `hotel_id` en utilisant le `auth.uid()` lié à `employees.auth_user_id`.

### 10.2 Politiques par famille

#### Core (rooms, room_types, amenities, buildings, floors, media)

```sql
-- SELECT : l'employé voit les données de son hôtel
CREATE POLICY core_select ON rooms FOR SELECT
  USING (hotel_id IN (
    SELECT hotel_id FROM employees WHERE auth_user_id = auth.uid()
  ));

-- INSERT/UPDATE/DELETE : permission 'room.manage'
```

#### Guests

```sql
-- SELECT : par hotel_id
-- INSERT/UPDATE : permission 'guest.manage'
```

#### Bookings (et booking_rooms, booking_guests, booking_services, booking_status_history)

```sql
-- SELECT : par hotel_id
-- INSERT/UPDATE/DELETE : permissions 'booking.create', 'booking.cancel', 'booking.modify', 'booking.force_checkout'
```

#### Payments

```sql
-- SELECT : par hotel_id
-- INSERT : permission 'payment.create'
-- UPDATE (refund) : permission 'payment.refund'
```

#### Employees

```sql
-- SELECT : par hotel_id (un employé voit ses collègues)
-- INSERT/UPDATE/DELETE : permission 'employee.manage'
-- Un employé ne peut pas modifier son propre rôle
```

#### Employee roles / role_permissions

```sql
-- SELECT : par hotel_id
-- INSERT/UPDATE/DELETE : permission 'employee.manage'
```

#### Invoices

```sql
-- SELECT : par hotel_id
-- INSERT/UPDATE : permission 'invoice.generate'
```

#### Hotel settings

```sql
-- SELECT : par hotel_id
-- INSERT/UPDATE : permission 'settings.update'
```

#### Reviews

```sql
-- SELECT : par hotel_id (employés) ; un guest voit ses propres reviews
-- INSERT : permission 'review.respond' pour la réponse hôtel
```

#### Notifications

```sql
-- SELECT : par hotel_id (employés) ; un guest voit ses propres notifications
-- INSERT : système (service role)
```

#### Audit logs

```sql
-- SELECT : permission 'audit.view'
-- INSERT : système (service role)
```

### 10.3 Matrice des permissions

| Permission | Tables concernées |
|---|---|
| `booking.create` | bookings, booking_rooms, booking_guests |
| `booking.cancel` | bookings (status → cancelled) |
| `booking.force_checkout` | bookings (outrepasser solde) |
| `booking.modify` | bookings, booking_rooms, booking_guests |
| `payment.create` | payments |
| `payment.refund` | payments (type = refund) |
| `employee.manage` | employees, employee_roles |
| `settings.update` | hotel_settings |
| `invoice.generate` | invoices, invoice_items |
| `room.manage` | rooms, room_amenities |
| `room.maintenance` | rooms (status → maintenance) |
| `review.respond` | reviews (hotel_reply) |
| `guest.manage` | guests |
| `report.view` | Vues et rapports |
| `audit.view` | audit_logs |

---

## 11. Sécurité multi-tenant

### 11.1 Isolation stricte par hotel_id

Toute table métier contient `hotel_id`. Les politiques RLS filtrent systématiquement par cette colonne.

### 11.2 Authentification

Supabase Auth gère l'authentification. Chaque employé est lié à un `auth_user_id` dans `employees`.

### 11.3 Chaîne de confiance

```
auth.users (Supabase Auth)
    ↕ (auth_user_id)
employees
    ↕ (hotel_id)
hotels
```

### 11.4 Service role

Les opérations système utilisent `service_role` et contournent RLS :
- `fn_expire_pending_bookings()`
- `fn_process_no_show()`
- Insertions dans `audit_logs` par triggers
- Insertions dans `notifications` par triggers
- Génération des numéros de facture

### 11.5 White label

- Colonne `brand` sur `hotels`
- Chaque hôtel a sa marque, ses templates, son sous-domaine
- L'isolation RLS empêche tout croisement de données

---

## 12. Résumé des décisions CTO intégrées (Q01–Q10)

| Décision | Application dans le blueprint |
|---|---|
| **Q01 — INTEGER en centimes** | Tous les montants renommés en `{name}_cents`, type INTEGER. Ex. `total_amount_cents`, `paid_amount_cents`, `unit_price_cents`. |
| **Q02 — TEXT + CHECK** | Tous les statuts et énumérations en TEXT avec CHECK constraint. |
| **Q03 — Soft delete ciblé** | `deleted_at` sur hotels, rooms, room_types, guests, employees, bookings, services, rate_plans, reviews uniquement. Pas sur payments, invoices, invoice_items, audit_logs, booking_status_history, room_status_history, notification_recipients. |
| **Q04 — Prix figé** | `unit_price_cents` et `total_price_cents` dans booking_services. Jamais de lien dynamique vers le prix courant du service. |
| **Q05 — RatePlan + RoomType** | Table `rate_plan_room_types` ajoutée. Un RatePlan est global hôtel, avec possibilité de restriction par RoomType. |
| **Q06 — Pas de conversion auto** | `currencies` = table de référence uniquement. Chaque hôtel a une `currency_code` unique. Pas de taux de change. |
| **Q07 — Séquence facture DB** | Table `invoice_sequences` avec hotel_id, year, prefix, current_number. Incrémentation atomique. |
| **Q08 — Pas d'archivage auto V1** | Les bookings Completed restent en ligne. Archivage repoussé en version future. |
| **Q09 — pg_cron / Supabase** | Les fonctions cron (`fn_expire_pending_bookings`, `fn_process_no_show`) via pg_cron ou Supabase scheduled functions. Fallback Edge Function. |
| **Q10 — Pas de portail guest V1** | Pas de compte auth pour les guests en V1. Réservation publique via site hôtel. Portail client futur (lien magique). |

---

## 13. Questions / Risques CTO

| # | Question | Impact | Décision attendue |
|---|---|---|---|
| Q11 | **Périmètre des permissions : faut-il une permission par action CRUD ou des permissions génériques ?** | Ex. `booking.create` / `booking.cancel` / `booking.modify` ou un seul `booking.manage` ? Le granular impacte la complexité de l'UI de gestion des rôles. | Niveau de granularité des permissions |
| Q12 | **RatePlan : prix fixe ou calculé dynamiquement ?** | Un RatePlan peut-il définir un prix fixe pour un RoomType (via `rate_plan_room_types.applied_price_cents`) ou seulement des règles (acompte, remboursable) ? | Rôle exact du RatePlan dans le pricing |
| Q13 | **Factures : un booking peut-il avoir plusieurs factures ?** | Ex. acompte facturé puis solde facturé séparément. Ou une seule facture par booking ? | Politique de facturation |
| Q14 | **Suppression des données : que faire des guests supprimés (deleted_at) liés à des bookings historiques ?** | Les bookings historiques référencent des guests. Si un guest est soft-deleted, les bookings doivent rester accessibles. Faut-il laisser la FK ou permettre NULL sur guest_id dans booking_guests après soft delete ? | Stratégie de gestion des guests supprimés |
| Q15 | **Time zone : qui gère la conversion ?** | Chaque hôtel a un fuseau horaire. Les dates de booking (check_in, check_out) sont-elles stockées en UTC ou en heure locale de l'hôtel ? | Stockage des dates (UTC vs local) |

---

*Document version 1.1 — Juillet 2026*

*Modifications v1.0 → v1.1 :*
- Tous les montants passés de DECIMAL à INTEGER en centimes, colonnes renommées avec suffixe `_cents`
- Soft delete limité aux tables principales ; payments, invoices, historiques et audit_logs déclarés immuables
- Table `rate_plan_room_types` ajoutée
- Table `invoice_sequences` ajoutée
- Suppression des mécanismes de conversion de devises
- Sections immuabilité et résumé des décisions CTO ajoutées
- 5 nouvelles questions CTO (Q11–Q15)

*Prochaine étape : génération du SQL final après validation CTO.*
