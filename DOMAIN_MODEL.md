# EDEN: Luxury Management — Domain Model v1.1

> **EDEN** (Enterprise Dashboard for Enhanced Networking) est un PMS (Property Management System) premium,
> conçu pour l'hôtellerie de luxe, les lodges et les résidences haut de gamme.
> Ce document définit les concepts métier fondamentaux, leurs relations, leurs cycles de vie et leurs règles.
> Il est destiné aux équipes métier (hôteliers, direction, réception) et aux équipes techniques.
>
> **Aucune considération technique, aucun SQL, aucune table, aucun schéma d'implémentation.**

---

## 1. Entités

### 1.1 Hotel

Établissement hôtelier. EDEN peut gérer un ou plusieurs hôtels (multipropriété, chaîne, groupe).

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte | Raison sociale ou nom commercial |
| Adresse | Objet métier | Rue, ville, code postal, région, pays |
| Classification | Valeur définie | 1 à 5 étoiles, Palace |
| Coordonnées | Objet métier | Téléphone, email, site web |
| Devise | Code (ISO 4217) | EUR, USD, XOF, GBP, CHF… |
| Langue par défaut | Code (ISO 639-1) | fr, en, es, de, ar, zh… |
| Marque / Enseigne | Texte | Permet le White Label |
| Actif | Booléen | L'établissement est en service |

**Relations :**
- 1 → N **RoomType** (un hôtel définit ses types de chambres)
- 1 → N **Room** (un hôtel possède des chambres)
- 1 → N **Employee** (un hôtel emploie du personnel)
- 1 → N **Guest** (un hôtel reçoit des clients)
- 1 → N **Review** (un hôtel reçoit des avis)
- 1 → N **Season** (un hôtel définit ses périodes tarifaires)
- 1 → N **RatePlan** (un hôtel définit ses grilles tarifaires)
- 1 → N **Service** (un hôtel propose des prestations)
- 1 → N **Amenity** (un hôtel définit un catalogue d'équipements)
- 1 → N **Notification** (un hôtel émet des notifications)
- 1 → N **AuditLog** (un hôtel trace ses événements)
- 1 → 1 **HotelSettings** (un hôtel a des paramètres de fonctionnement)

---

### 1.2 HotelSettings

Regroupe les paramètres de fonctionnement de l'établissement. Séparé de Hotel pour permettre l'évolution sans impacter l'entité principale.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Politique d'annulation | Objet métier | Délais et seuils de remboursement |
| Politique de no-show | Objet métier | Délai avant déclaration, frais appliqués |
| Délai d'expiration | Durée | Temai avant passage de Pending à Expired |
| Heure de check-in | Horaire | Ex. 15:00 |
| Heure de check-out | Horaire | Ex. 11:00 |
| Jours de silence | Liste | Périodes sans notification clients |
| Langues disponibles | Liste | Langues de l'interface et des templates |
| Devise fonctionnelle | Code (ISO 4217) | Devise de comptabilité interne |
| TVA par défaut | Décimal | Taux applicable aux prestations |
| Frais de ménage | Décimal | Montant forfaitaire éventuel |
| Caution obligatoire | Booléen | Dépôt de garantie à l'arrivée |
| Montant caution | Décimal | Si caution obligatoire |
| Paramètres personnalisés | Objet extensible | Clé-valeur pour besoins spécifiques |

**Relations :**
- 1 → 1 **Hotel** (appartient à un hôtel)

---

### 1.3 RoomType

Catégorie de chambre. Les chambres héritent des caractéristiques de leur type.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte | Standard, Deluxe, Suite, Bungalow, Villa, Penthouse… |
| Description | Texte | Présentation commerciale |
| Capacité de base | Entier | Nombre maximal d'occupants |
| Surface | Décimal | Surface typique en m² |
| Prix de base | Décimal | Tarif standard par nuit (hors saison, hors plan) |
| Équipements par défaut | Liste | Références vers Amenity |
| Actif | Booléen | Disponible à la vente |

**Relations :**
- N → 1 **Hotel** (appartient à un hôtel)
- 1 → N **Room** (peut avoir plusieurs chambres de ce type)

---

### 1.4 Room

Unité physique d'hébergement.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom / Numéro | Texte | Ex. "Suite 204", "Villa Azur", "Bungalow Hibiscus" |
| Étage | Texte | Niveau dans l'établissement |
| Surface réelle | Décimal | En m² (peut différer du type) |
| Capacité réelle | Entier | Peut être ajustée (lit bébé, sofa-lit) |
| Prix ajusté | Décimal | Surcharge ou remise par rapport au type (optionnel) |
| Statut | Valeur définie | Disponible, Occupée, Nettoyage, Maintenance, Hors service |
| Actif | Booléen | La chambre peut être réservée |
| Notes internes | Texte | Observations pour le personnel |

**Relations :**
- N → 1 **Hotel** (appartient à un hôtel)
- N → 1 **RoomType** (est d'un type donné)
- 1 → N **BookingRoom** (est réservée via des associations)
- N → N **Amenity** (via RoomAmenity)

**Contrainte fonctionnelle :** Une Room ne peut avoir qu'un seul booking actif (BookingRoom dont le Booking associé est en statut *Confirmed*, *Checked-in* ou *Checked-out*) sur une période donnée.

---

### 1.5 Amenity

Équipement ou service d'une chambre. Modèle multilingue, filtrable, iconifié.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte multilingue | Ex. "Climatisation", "WiFi", "Balcon", "Jacuzzi" |
| Icône | Référence | Identifiant d'icône (permettant l'affichage UI) |
| Catégorie | Valeur définie | Équipement, Confort, Technologie, Extérieur, Enfant… |
| Ordre d'affichage | Entier | Priorité dans les listes |
| Actif | Booléen | Disponible pour les nouvelles chambres |

**Relations :**
- N → 1 **Hotel** (appartient au catalogue de l'hôtel)
- N → N **Room** (via RoomAmenity)
- N → N **RoomType** (via RoomTypeAmenity — équipements par défaut du type)

---

### 1.6 RoomAmenity

Association entre une chambre et un équipement. Permet d'ajouter des équipements spécifiques à une chambre, au-delà de ceux hérités du RoomType.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Quantité | Entier | Ex. 2 climatiseurs, 3 lits bébé |
| Notes | Texte | Précision éventuelle |

**Relations :**
- N → 1 **Room**
- N → 1 **Amenity**

---

### 1.7 Guest

Client de l'établissement. Personne physique ou morale (entreprise).

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Type | Valeur définie | Particulier, Entreprise, Agence, Partenaire |
| Nom | Texte | Nom / raison sociale |
| Prénom | Texte | — |
| Email | Texte | Identifiant de connexion au portail client |
| Téléphone | Texte | Contact direct |
| Document d'identité | Objet métier | Type (passeport, CNI, permis) + numéro + date d'expiration |
| Date de naissance | Date | — |
| Nationalité | Code (ISO 3166-1) | Pays |
| Adresse | Objet métier | Domicile ou siège social |
| Préférences | Objet métier | Type de chambre, équipements souhaités, allergies, journal |
| Date du premier séjour | Date | Fidélité |
| Nombre de séjours | Entier | Compteur cumulé |
| Segment | Valeur définie | Loisir, Affaires, Groupe, VIP, Journaliste, Famille |
| Programme fidélité | Objet métier | Partenaire externe (ex. Accor, Booking Genius) ou interne |
| Actif | Booléen | Compte ouvert |

**Relations :**
- N → 1 **Hotel** (client de l'hôtel — un guest est lié à l'hôtel chez qui il séjourne)
- 1 → N **BookingGuest** (participe à des réservations)
- 1 → N **Review** (poste des avis)
- 1 → N **Payment** (effectue des paiements — en tant que payeur)

Note : Un même individu séjournant dans plusieurs hôtels du groupe sera représenté par un Guest par hôtel, ou par un Guest partagé via un identifiant global selon le mode de déploiement (mono-établissement, multi-propriété, chaîne).

---

### 1.8 Employee

Personnel de l'établissement.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom complet | Texte | Prénom et nom |
| Email professionnel | Texte | Identifiant de connexion |
| Téléphone | Texte | Contact interne |
| Fonction | Texte | Intitulé du poste (non lié aux droits) |
| Département | Valeur définie | Réception, Étages, Restauration, Maintenance, Direction, Sécurité, Commercial |
| Statut | Valeur définie | Actif, En congé, Absent, Inactif, Suspendu |
| Planning | Objet métier | Jours et créneaux de travail |
| Date d'embauche | Date | Ancienneté |
| Superviseur | Référence | Employee responsable hiérarchique (optionnel) |

**Relations :**
- N → 1 **Hotel** (employé par un hôtel)
- N → N **Role** (via EmployeeRole)
- 0 → N **Booking** (peut être associé à des réservations : agent de check-in, gouvernante assignée, concierge)
- 0 → N **AuditLog** (auteur d'actions tracées)

**Contrainte fonctionnelle :** Un Employee ne peut exercer que dans l'hôtel auquel il est rattaché. Les droits spécifiques sont définis par ses rôles.

---

### 1.9 Role

Regroupement de permissions. Les rôles sont des étiquettes métier (ex. "Réceptionniste", "Gouvernante", "Directeur", "Maintenance").

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte | Ex. "Réceptionniste", "Gouvernante" |
| Description | Texte | Périmètre du rôle |
| Niveau hiérarchique | Entier | Ordre de priorité pour résolution de conflits |
| Système | Booléen | Rôle système non modifiable |

**Relations :**
- N → N **Permission** (via RolePermission)
- N → N **Employee** (via EmployeeRole)

---

### 1.10 Permission

Droit atomique dans le système.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Code | Texte | Ex. "booking.create", "booking.cancel", "payment.refund", "employee.manage" |
| Nom | Texte | Libellé lisible |
| Groupe | Texte | Catégorie : Booking, Payment, Room, Employee, Reports, Settings… |

**Relations :**
- N → N **Role** (via RolePermission)

---

### 1.11 EmployeeRole

Association entre un employé et un rôle.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Date d'attribution | Date | Quand le rôle a été assigné |
| Attribué par | Référence | Employee ayant effectué l'assignation |

**Relations :**
- N → 1 **Employee**
- N → 1 **Role**

---

### 1.12 Booking

Réservation. Une réservation peut concerner plusieurs chambres et plusieurs clients.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Numéro de réservation | Texte | Lisible par le client (ex. "EDEN-202607-0421") |
| Date de création | Instant | Horodatage |
| Date d'arrivée (check-in) | Date | Début du séjour |
| Date de départ (check-out) | Date | Fin du séjour |
| Nombre de nuits | Entier | Calculé : départ − arrivée |
| Statut | Valeur définie | Voir § 3.1 |
| Montant total | Montant | Somme calculée (chambres + taxes + services) |
| Montant payé | Montant | Total déjà encaissé |
| Solde | Montant | Total − payé |
| Devise | Code (ISO 4217) | Devise de facturation |
| Source | Valeur définie | Direct, Booking.com, Airbnb, Expedia, Agence, Téléphone, Email |
| Notes internes | Texte | Observations du personnel |
| Demandes spéciales | Texte | Souhaits du client (vue, étage, lit bébé, allergies) |
| Date de confirmation | Instant | Quand le booking est passé à Confirmed |
| Date d'annulation | Instant | Si annulé |
| Motif d'annulation | Texte | Raison |

**Relations :**
- N → 1 **Hotel** (se déroule dans un hôtel)
- 1 → N **BookingRoom** (réservation de chambres)
- 1 → N **BookingGuest** (clients associés)
- 1 → N **BookingService** (services achetés)
- 1 → N **Payment** (paiements reçus)
- 1 → N **Notification** (notifications déclenchées)
- 0 → 1 **Review** (peut donner lieu à un avis)
- N → 1 **RatePlan** (plan tarifaire appliqué)

---

### 1.13 BookingRoom

Association entre une réservation et une chambre. Permet de réserver plusieurs chambres sur une même réservation.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Prix appliqué | Montant | Prix par nuit pour cette chambre (après saison, plan tarifaire, ajustements) |
| Nombre d'adultes | Entier | Occupants majeurs dans cette chambre |
| Nombre d'enfants | Entier | Occupants mineurs dans cette chambre |
| Date d'arrivée | Date | Peut différer du booking parent (arrivée décalée) |
| Date de départ | Date | Peut différer du booking parent (départ anticipé) |
| Statut | Valeur définie | Réservé, Occupé, Libéré, Annulé |

**Relations :**
- N → 1 **Booking**
- N → 1 **Room**

**Contrainte fonctionnelle :** La période [arrivée, départ] d'un BookingRoom ne doit pas chevaucher un autre BookingRoom *Confirmé* ou *En cours* sur la même Room. Chaque BookingRoom est indépendant : une réservation peut ajouter ou retirer une chambre sans impacter les autres.

---

### 1.14 BookingGuest

Association entre une réservation et un client. Permet d'identifier le rôle de chaque occupant.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Rôle | Valeur définie | Primary Guest, Adulte, Enfant, Bébé, Contact facturation |
| Est le payeur | Booléen | Responsable du paiement |
| Est le contact principal | Booléen | Personne à contacter en cas de problème |
| Date d'arrivée | Date | Peut différer du booking (arrivée différée) |
| Date de départ | Date | Peut différer du booking (départ anticipé) |

**Relations :**
- N → 1 **Booking**
- N → 1 **Guest**

**Contrainte fonctionnelle :** Une réservation doit avoir exactement un Primary Guest. Les autres guests sont des occupants supplémentaires.

---

### 1.15 Payment

Transaction financière liée à une réservation.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Montant | Montant | Valeur de la transaction |
| Devise | Code (ISO 4217) | EUR, USD, XOF… |
| Méthode | Valeur définie | Carte bancaire, Espèces, Virement, Mobile Money, Chèque, Cryptomonnaie |
| Statut | Valeur définie | En attente, Réussi, Échoué, Remboursé, Partiellement remboursé |
| Date de transaction | Instant | Horodatage |
| Référence externe | Texte | ID de transaction bancaire / plateforme |
| Type | Valeur définie | Acompte, Solde, Caution, Remboursement, Supplément, Avoir |
| Notes | Texte | Motif du paiement ou du remboursement |

**Relations :**
- N → 1 **Booking** (rattaché à une réservation)
- 0 → 1 **Employee** (saisi par un employé si paiement en espèces ou manuel)
- 0 → 1 **Guest** (payeur — peut être différent du primary guest)

---

### 1.16 Review

Avis laissé par un client sur son expérience dans l'établissement.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Note | Entier (1–5) | Évaluation globale |
| Titre | Texte | Objet de l'avis (optionnel) |
| Commentaire | Texte | Avis détaillé |
| Date de publication | Instant | Quand l'avis a été soumis |
| Date du séjour | Période | Quand le client a séjourné |
| Plateforme | Texte | Interne, Google, Booking.com, TripAdvisor… |
| Réponse de l'hôtel | Texte | Réponse publique facultative |
| Réponse interne | Texte | Note privée pour la direction |
| Visible | Booléen | Affiché publiquement |
| Vérifié | Booléen | Séjour confirmé |

**Relations :**
- N → 1 **Guest** (posté par un client)
- N → 1 **Hotel** (concerne un établissement)
- 0 → 1 **Booking** (lié à un séjour — optionnel pour les avis importés de plateformes externes)

**Contrainte fonctionnelle :** Un Guest ne peut laisser qu'un seul avis par Booking. Les plateformes externes peuvent importer des avis sans réservation interne associée.

---

### 1.17 Notification

Message système adressé à un ou plusieurs destinataires.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Titre | Texte | Objet court |
| Corps | Texte | Message complet (peut contenir des variables) |
| Catégorie | Valeur définie | Confirmation, Rappel, Alerte, Promotion, Facture, Message interne, Urgence |
| Priorité | Valeur définie | Basse, Normale, Haute, Urgente |
| Date d'envoi | Instant | Première émission |
| Template | Texte | Référence à un template de message |
| Expéditeur | Référence | Employee ou système à l'origine |

**Relations :**
- N → 1 **Hotel** (émise par un hôtel)
- 0 → 1 **Booking** (déclenchée par une réservation)
- 0 → 1 **Payment** (notification de transaction)
- 1 → N **NotificationRecipient** (destinataires)

---

### 1.18 NotificationRecipient

Association entre une notification et son destinataire. Permet d'envoyer une notification à plusieurs personnes via plusieurs canaux.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Canal | Valeur définie | Email, SMS, Push dashboard, In-app, App mobile, WhatsApp |
| Statut d'envoi | Valeur définie | Envoyée, Délivrée, Lue, Archivée, Échouée, En attente |
| Date de lecture | Instant | Quand le destinataire a consulté |
| Tentatives | Entier | Nombre de renvois |
| Destinataire | Référence | ID du Guest ou de l'Employee |

**Relations :**
- N → 1 **Notification**

---

### 1.19 Service

Prestation complémentaire proposée par l'hôtel.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte multilingue | Ex. "Petit-déjeuner", "Spa", "Navette aéroport", "Lit bébé" |
| Description | Texte multilingue | Détail de la prestation |
| Prix unitaire | Montant | Tarif |
| Type de tarif | Valeur définie | Par personne, Par chambre, Par nuit, Forfait |
| TVA | Décimal | Taux applicable |
| Actif | Booléen | Disponible à la vente |

**Relations :**
- N → 1 **Hotel** (proposé par un hôtel)
- 1 → N **BookingService** (acheté dans des réservations)

---

### 1.20 BookingService

Association entre un service et une réservation.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Quantité | Entier | Nombre d'unités |
| Prix unitaire appliqué | Montant | Prix au moment de l'achat |
| Date de prestation | Date | Quand le service est rendu (optionnel) |
| Assigné à | Référence | BookingGuest spécifique (ex. : spa pour un adulte en particulier) |

**Relations :**
- N → 1 **Booking**
- N → 1 **Service**

---

### 1.21 Season

Période tarifaire définie par l'hôtel pour ajuster les prix.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte | Ex. "Haute saison", "Noël", "Low season", "Carnaval" |
| Date début | Date | Début de la période |
| Date fin | Date | Fin de la période |
| Mode tarifaire | Valeur définie | Voir ci-dessous |
| Valeur | Décimal | Dépend du mode (coefficient, montant, prix, …) |
| Jours d'application | Liste | Quels jours de la semaine sont concernés (optionnel) |
| Ordre de priorité | Entier | En cas de chevauchement, la saison avec la priorité la plus haute l'emporte |

**Modes tarifaires (exemples) :**

| Mode | Comportement | Exemple de valeur |
|---|---|---|
| Pourcentage | Prix de base × (1 + valeur/100) | 50 → +50 % |
| Montant fixe | Prix de base + valeur | 30 → +30 € par nuit |
| Prix fixe | Remplace le prix de base | 450 → 450 € par nuit |
| Prix par nuit | Prix différent selon la nuit | Liste de prix par date |
| Prix week-end | Applique un tarif spécifique aux jours précisés | ven/sam uniquement |
| Prix événement | Prix dédié pour une période spécifique | Ex. "Grand Prix" |

**Relations :**
- N → 1 **Hotel** (définie par un hôtel)

**Contrainte fonctionnelle :** Les périodes d'une saison pour un même hôtel peuvent se chevaucher. En cas de conflit, la saison ayant l'ordre de priorité le plus élevé est appliquée. Cela permet de superposer un événement local à une haute saison générale.

---

### 1.22 RatePlan

Plan tarifaire définissant les conditions de réservation.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Nom | Texte | "Tarif Flexible", "Non remboursable", "Tarif Entreprise", "Petit-déjeuner inclus" |
| Description | Texte | Conditions détaillées |
| Politique d'annulation | Référence | Peut référencer la politique de l'hôtel ou en définir une spécifique |
| Acompte requis | Décimal | Pourcentage ou montant fixe |
| Remboursable | Booléen | Si annulation possible |
| Conditions spéciales | Texte | Ex. "Pas de modification", "Réservation groupe" |
| Actif | Booléen | Disponible pour les nouvelles réservations |

**Relations :**
- N → 1 **Hotel** (défini par un hôtel)
- 1 → N **Booking** (appliqué aux réservations)

---

### 1.23 AuditLog

Trace métier des actions importantes effectuées dans le système.

| Attribut | Nature | Description |
|---|---|---|
| Identifiant | Identifiant unique | Référence universelle |
| Action | Texte | Ex. "booking.confirmed", "payment.refunded", "booking.cancelled" |
| Entité concernée | Texte | Type d'entité (Booking, Payment, Employee…) |
| Identifiant de l'entité | Identifiant | ID de l'entité concernée |
| Ancienne valeur | Texte | État avant (optionnel) |
| Nouvelle valeur | Texte | État après (optionnel) |
| Date | Instant | Horodatage |
| Adresse IP | Texte | Origine de l'action (optionnel) |
| Contexte | Texte | Informations supplémentaires libres |

**Relations :**
- N → 1 **Hotel** (appartient à un hôtel)
- 0 → 1 **Employee** (auteur de l'action — peut être système)
- 0 → 1 **Guest** (si l'action est effectuée par le client via le portail)

**Contrainte fonctionnelle :** Toute action modifiant le statut d'un Booking, d'un Payment ou d'une Room doit être enregistrée dans AuditLog.

---

## 2. Relations et cardinalités — Vue d'ensemble

```
Hotel ──1→N── RoomType
Hotel ──1→N── Room
Hotel ──1→N── Employee
Hotel ──1→N── Guest
Hotel ──1→N── Review
Hotel ──1→N── Season
Hotel ──1→N── RatePlan
Hotel ──1→N── Service
Hotel ──1→N── Amenity
Hotel ──1→N── Notification
Hotel ──1→N── AuditLog
Hotel ──1→1── HotelSettings

RoomType ──N→1── Hotel
RoomType ──1→N── Room

Room ──N→1── Hotel
Room ──N→1── RoomType
Room ──1→N── BookingRoom
Room ──N→N── Amenity ──via RoomAmenity──

Amenity ──N→1── Hotel
Amenity ──N→N── Room ──via RoomAmenity──

Guest ──N→1── Hotel
Guest ──1→N── BookingGuest
Guest ──1→N── Review
Guest ──1→N── Payment
Guest ──0→N── AuditLog

Employee ──N→1── Hotel
Employee ──N→N── Role ──via EmployeeRole──
Employee ──0→N── AuditLog

Role ──N→N── Permission
Role ──N→N── Employee ──via EmployeeRole──

Booking ──N→1── Hotel
Booking ──N→1── RatePlan
Booking ──1→N── BookingRoom
Booking ──1→N── BookingGuest
Booking ──1→N── BookingService
Booking ──1→N── Payment
Booking ──1→N── Notification
Booking ──0→1── Review

BookingRoom ──N→1── Booking
BookingRoom ──N→1── Room

BookingGuest ──N→1── Booking
BookingGuest ──N→1── Guest

BookingService ──N→1── Booking
BookingService ──N→1── Service

Payment ──N→1── Booking
Payment ──0→1── Employee
Payment ──0→1── Guest

Review ──N→1── Guest
Review ──N→1── Hotel
Review ──0→1── Booking

Service ──N→1── Hotel
Service ──1→N── BookingService

Season ──N→1── Hotel

RatePlan ──N→1── Hotel
RatePlan ──1→N── Booking

Notification ──N→1── Hotel
Notification ──0→1── Booking
Notification ──0→1── Payment
Notification ──1→N── NotificationRecipient

NotificationRecipient ──N→1── Notification

AuditLog ──N→1── Hotel
AuditLog ──0→1── Employee
AuditLog ──0→1── Guest

HotelSettings ──1→1── Hotel
```

---

## 3. Cycles de vie (états)

### 3.1 Cycle de vie d'un Booking

```
                         ┌─────────────────────────────┐
                         │          Pending            │
                         │       (En attente)          │
                         └─────────────┬───────────────┘
                                       │ Confirmation
                                       │ (paiement ou manuelle)
                                       ▼
                         ┌─────────────────────────────┐
                         │         Confirmed           │◄──── confirmé sans
                         │       (Confirmée)           │      acompte
                         └─────────────┬───────────────┘
                                       │ Arrivée du client
                                       ▼
                         ┌─────────────────────────────┐
                         │       Checked-in            │
                         │    (En cours de séjour)     │
                         └─────────────┬───────────────┘
                                       │ Départ du client
                                       ▼
                         ┌─────────────────────────────┐
                         │       Checked-out           │
                         │     (Séjour terminé)        │
                         └─────────────┬───────────────┘
                                       │ Clôture financière
                                       ▼
                         ┌─────────────────────────────┐
                         │        Completed            │
                         │       (Terminée)            │
                         └─────────────────────────────┘

    ─── Chemins d'annulation et d'exception ───

    Pending ───────────────────────────► Expired
    Pending ───────────────────────────► Cancelled
    Confirmed ─────────────────────────► Cancelled     (frais selon plan)
    Checked-in ───────────────────────► Cancelled     (départ anticipé)
    Confirmed ────────────────────────► No-show       (client absent)
    No-show ──────────────────────────► Cancelled     (après forfait)
    Checked-out ──────────────────────► Cancelled     (cas exceptionnel)
```

| Statut | Description |
|---|---|
| **Pending** | Réservation initiée, en attente de paiement ou de confirmation manuelle |
| **Confirmed** | Réservation confirmée (acompte payé ou validation manuelle) |
| **Checked-in** | Au moins une chambre occupée, client arrivé |
| **Checked-out** | Client parti, séjour en cours de clôture |
| **Completed** | Séjour soldé, clôturé, archivé |
| **Cancelled** | Réservation annulée (à tout moment du cycle) |
| **No-show** | Client non présenté le jour d'arrivée |
| **Expired** | Réservation non confirmée dans le délai imparti |

---

### 3.2 Cycle de vie d'un Payment

```
                  ┌──────────────────────────────┐
                  │          Pending             │
                  │       (En attente)           │
                  └──────────────┬───────────────┘
                                 │ Traitement effectué
                                 ▼
                  ┌──────────────────────────────┐
            ┌────►│          Success             │
            │     │        (Réussi)              │
            │     └──────────────┬───────────────┘
            │                    │ Remboursement total
            │                    ▼
            │     ┌──────────────────────────────┐
            │     │         Refunded             │
            │     │      (Remboursé)             │
            │     └──────────────────────────────┘
            │
            │     ┌──────────────────────────────┐
            │     │        Partially Refunded    │
            │     │  (Partiellement remboursé)   │
            │     └──────────────────────────────┘
            │
            │     ┌──────────────────────────────┐
            └─────│          Failed              │
                  │        (Échoué)              │
                  └──────────────────────────────┘
```

---

### 3.3 Cycle de vie d'une Room (statuts)

```
        ┌─────────────┐
        │ Disponible  │◄──────────────────────────────────┐
        └──────┬──────┘                                   │
               │ BookingRoom confirmé                      │
               ▼                                           │
        ┌─────────────┐                                    │
        │  Réservée   │                                    │
        └──────┬──────┘                                    │
               │ Check-in                                  │
               ▼                                           │
        ┌─────────────┐        ┌───────────────┐           │
        │  Occupée    │───────►│  Nettoyage    │──────────►│
        └─────────────┘        └───────────────┘           │
               │                                            │
               │ Problème technique                         │
               ▼                                            │
        ┌─────────────┐                                     │
        │ Maintenance │────────────────────────────────────►│
        └─────────────┘                                     │
                                                            │
        ┌─────────────┐                                     │
        │ Hors service│────────────────────────────────────►│
        └─────────────┘                                     │
```

---

## 4. Règles métier

| ID | Règle | Description |
|---|---|---|
| **R01** | Non-chevauchement des chambres | Une Room ne peut avoir qu'un seul BookingRoom dont le Booking parent est en statut *Confirmed*, *Checked-in* ou *Checked-out* et dont la période [arrivée, départ[ chevauche celle d'une nouvelle réservation. |
| **R02** | Capacité maximale par chambre | Le nombre d'occupants (adultes + enfants) d'un BookingRoom ne peut pas dépasser la capacité réelle de la Room. |
| **R03** | Cohérence des dates | La date de check-in doit être strictement antérieure à la date de check-out, pour le Booking et pour chaque BookingRoom. |
| **R04** | Réservation dans le futur | Un Booking ne peut pas avoir une date de check-in dans le passé, sauf dérogation manuelle par un employé autorisé. |
| **R05** | Paiement avant confirmation | Un Booking passe de *Pending* à *Confirmed* uniquement si un payment d'acompte (ou totalité) est réussi, ou après validation manuelle par un employé disposant de la permission *booking.confirm*. |
| **R06** | Solde avant check-out | Le check-out est bloqué tant que le solde du Booking est supérieur à zéro (sauf permission *booking.forceCheckout*). |
| **R07** | Annulation et remboursement | Une annulation déclenche le calcul de frais selon le RatePlan appliqué et la politique d'annulation de l'hôtel. |
| **R08** | Délai d'expiration | Un Booking *Pending* non confirmé après le délai défini dans HotelSettings passe automatiquement à *Expired*. |
| **R09** | No-show automatique | Un Booking *Confirmed* dont aucun BookingRoom n'a été passé en *Occupé* le jour J+1 (selon l'heure de check-in définie dans HotelSettings) passe automatiquement à *No-show*. |
| **R10** | Tarif saisonnier | Le prix d'un BookingRoom est calculé en fonction du prix de base de la Room, du RatePlan, et des coefficients Season applicables à chaque nuit. |
| **R11** | Primary Guest obligatoire | Un Booking doit avoir exactement un BookingGuest avec le rôle *Primary Guest*. |
| **R12** | Notification sur changement de statut | Tout changement de statut d'un Booking ou d'un Payment doit déclencher une Notification au Primary Guest et aux contacts principaux. |
| **R13** | Limite de review par séjour | Un Guest ne peut laisser qu'une seule Review par Booking, et uniquement après un statut *Checked-out* ou *Completed*. |
| **R14** | Accès basé sur les permissions | Un Employee ne peut effectuer une action que si au moins un de ses rôles inclut la permission correspondante. Les permissions sont cumulatives (union de tous les rôles). |
| **R15** | Audit obligatoire | Toute action modifiant le statut d'un Booking, d'un Payment, d'une Room ou d'un Employee doit être enregistrée dans AuditLog avec l'auteur, l'action, et les valeurs avant/après. |
| **R16** | Réservation liée à un hôtel | Un Booking, une Room, un Employee, un Service et un Guest sont toujours rattachés à un Hotel. Aucune donnée ne peut exister sans appartenir à un hôtel. |
| **R17** | Indépendance des BookingRoom | L'ajout, la modification ou l'annulation d'un BookingRoom n'affecte pas les autres BookingRoom du même Booking. Une réservation de groupe peut voir ses chambres évoluer indépendamment. |

---

## 5. Événements métier

| Événement | Déclencheur | Effets |
|---|---|---|
| **Réservation créée** | Guest ou Employee crée un Booking (statut *Pending*) | Notification au Primary Guest ; minuterie d'expiration démarrée (R08) ; AuditLog créé |
| **Paiement reçu** | Payment passe à *Success* | Booking passe à *Confirmed* (si acompte suffisant) ; BookingRoom passe à *Réservé* ; notification envoyée ; AuditLog créé |
| **Check-in effectué** | Employee enregistre l'arrivée sur un BookingRoom | BookingRoom passe à *Occupé* ; si tous les BookingRoom sont *Occupés*, le Booking passe à *Checked-in* ; notification de bienvenue ; AuditLog |
| **Check-out effectué** | Employee clôture un BookingRoom | BookingRoom passe à *Libéré* ; si tous les BookingRoom sont *Libérés*, le Booking passe à *Checked-out* ; Room passe à *Nettoyage* ; facture finale envoyée |
| **Service ajouté** | Employee ajoute un BookingService | Le montant total du Booking est recalculé ; un payment de supplément peut être requis |
| **Service livré** | Employee marque un BookingService comme exécuté | Statut du service mis à jour ; notification facultative au Guest |
| **Annulation client** | Guest annule son Booking | Booking passe à *Cancelled* ; calcul des frais selon RatePlan ; remboursement éventuel ; Rooms redeviennent *Disponible* ; notification ; AuditLog |
| **Annulation employé** | Employee annule un Booking | Mêmes effets qu'une annulation client ; notification au Primary Guest |
| **No-show** | Automatique (R09) ou manuel | Booking passe à *No-show* ; frais de no-show facturés ; Rooms redeviennent *Disponible* ; notification |
| **Expiration** | Automatique (R08) | Booking passe à *Expired* ; Rooms redeviennent *Disponible* |
| **Avis posté** | Guest publie une Review | Review liée au Guest, à l'Hotel et optionnellement au Booking ; notification à la direction |
| **Maintenance déclarée** | Employee signale un problème sur une Room | Room passe à *Maintenance* ; tout BookingRoom *Confirmé* sur cette Room est marqué pour réaffectation ; notification à la réception |
| **Changement de rôle** | Employee se voit attribuer ou retirer un rôle | AuditLog créé ; les permissions de l'Employee sont recalculées à la prochaine connexion |
| **Tarif modifié** | Employee ajuste un RatePlan ou une Season | Les nouveaux calculs de prix s'appliquent aux nouvelles réservations uniquement (sauf dérogation) |

---

## 6. Contraintes fonctionnelles détaillées

### 6.1 Disponibilité d'une chambre

Une Room est considérée **disponible** pour une nouvelle réservation (BookingRoom) si et seulement si :

- Son statut est *Disponible* ou *Nettoyage*
- Aucun BookingRoom existant, dont le Booking parent est en statut *Confirmed*, *Checked-in* ou *Checked-out*, n'a une période [arrivée, départ[ qui chevauche la période souhaitée
- La Room est *Active* (booléen activé)
- Le RoomType associé est *Actif*

### 6.2 Calcul du prix

Le prix d'un BookingRoom est déterminé par la formule conceptuelle suivante :

```
Prix total = Σ(pour chaque nuit) : [ Prix de base de la Room ]
                                  × [ Coefficient Season applicable ]
                                  × [ Ajustement du RatePlan ]
                                  + [ Services ]
                                  + [ Taxes ]
```

Le calcul précis relève du Database Blueprint et des règles de gestion configurables dans RatePlan et Season.

### 6.3 Politique d'annulation (exemple)

La politique d'annulation est définie dans HotelSettings. Exemple de grille :

| Délai avant check-in | Frais appliqués |
|---|---|
| ≥ 7 jours | 0 % (remboursement intégral) |
| 3 à 6 jours | 50 % du montant total |
| < 3 jours | 100 % (aucun remboursement) |
| No-show | 100 % + frais de no-show éventuels |

### 6.4 Validation des données obligatoires

- Un Booking ne peut être créé sans au moins un BookingRoom et un BookingGuest (Primary Guest).
- Un BookingRoom nécessite une Room et des dates valides.
- Un BookingGuest nécessite un Guest et un rôle.
- Un Payment nécessite un montant, une méthode, un Booking et une devise.
- Une Review nécessite une note (1 ≤ note ≤ 5), un Guest et un Hotel.

### 6.5 Cohérence des dates

- check-in < check-out (Booking et BookingRoom)
- check-in ≥ aujourd'hui (sauf dérogation)
- Pour un BookingRoom, la période doit être incluse dans la période du Booking parent (ou ajustée avec une règle spécifique pour les extensions de séjour)

---

## 7. Glossaire

| Terme | Définition |
|---|---|
| **Amenity** | Équipement ou élément de confort d'une chambre (climatisation, WiFi, balcon, jacuzzi) |
| **AuditLog** | Trace d'une action métier importante (qui, quoi, quand, avant/après) |
| **Booking** | Réservation d'un séjour dans un hôtel, pouvant inclure plusieurs chambres et plusieurs clients |
| **BookingGuest** | Association entre une réservation et un client occupant, avec un rôle (Primary Guest, Adulte, Enfant) |
| **BookingRoom** | Association entre une réservation et une chambre réservée pour une période donnée |
| **BookingService** | Achat d'une prestation complémentaire dans le cadre d'une réservation |
| **Check-in** | Arrivée effective du client et prise en charge de la chambre |
| **Check-out** | Départ du client et libération de la chambre |
| **Employee** | Membre du personnel de l'établissement |
| **EmployeeRole** | Association entre un employé et un rôle (ensemble de permissions) |
| **Guest** | Client personne physique ou morale séjournant ou ayant séjourné |
| **Hotel** | Établissement hôtelier géré par le système |
| **HotelSettings** | Paramètres de fonctionnement d'un hôtel (politiques, horaires, configuration) |
| **No-show** | Client qui ne se présente pas sans avoir annulé |
| **Notification** | Message système adressé à un ou plusieurs destinataires |
| **NotificationRecipient** | Destinataire d'une notification avec son canal et son statut de lecture |
| **Payment** | Transaction financière liée à une réservation |
| **Permission** | Droit atomique (ex. "booking.create", "payment.refund") |
| **RatePlan** | Plan tarifaire définissant les conditions de réservation (flexible, non remboursable, entreprise…) |
| **Review** | Avis post-séjour laissé par un client sur l'établissement |
| **Role** | Regroupement de permissions (ex. "Réceptionniste", "Directeur") |
| **Room** | Unité physique d'hébergement (chambre, suite, bungalow, villa) |
| **RoomAmenity** | Association entre une chambre et un équipement spécifique |
| **RoomType** | Catégorie de chambre définissant les caractéristiques communes (prix de base, capacité, équipements par défaut) |
| **Season** | Période tarifaire avec un mode de calcul de prix (pourcentage, montant fixe, prix fixe, etc.) |
| **Service** | Prestation complémentaire proposée par l'hôtel (petit-déjeuner, spa, navette) |
| **Accompte** | Premier versement permettant la confirmation d'une réservation |
| **Caution** | Dépôt de garantie, remboursé au check-out si aucun dommage |
| **Solde** | Montant restant dû après paiements partiels |

---

*Document version 1.1 — Juillet 2026*

*Modifications depuis v1.0 :*
1. Suppression des liens directs Booking→Room et Booking→Guest, remplacés par BookingRoom et BookingGuest
2. Hiérarchie Hotel → RoomType → Room
3. Extraction des équipements dans Amenity + RoomAmenity (multilingue, filtrable, iconifié)
4. Système d'autorisations remplacé par Role / Permission / EmployeeRole
5. Review : Booking devient optionnel
6. Notification : ajout de NotificationRecipient (multi-destinataires, multi-canaux)
7. Service : suppression du lien direct Room ; achat via BookingService uniquement
8. Season : modes tarifaires multiples (pourcentage, montant fixe, prix fixe, etc.)
9. Ajout de RatePlan (plans tarifaires)
10. Extraction de HotelSettings depuis Hotel
11. Ajout de AuditLog (traçabilité métier)
