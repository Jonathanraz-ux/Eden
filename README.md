# EDEN: Luxury Management

PMS hôtelier SaaS multi-tenant, white-label, destiné à l'hôtellerie de luxe.

## Stack technique

- **Frontend** : React 19 + TypeScript + Vite + TailwindCSS 4
- **Base de données** : PostgreSQL via Supabase
- **État serveur** : TanStack Query
- **Formulaires** : React Hook Form + Zod
- **UI** : Shadcn UI + Lucide React + Recharts

## Architecture

```
Component
  ↓
Hook (TanStack Query)
  ↓
Service
  ↓
Supabase (PostgreSQL + RLS)
```

## Modules

| # | Module | Statut |
|---|---|---|
| 1 | Base SQL | ✅ Terminé |
| 2 | Authentification | ⏳ À venir |
| 3 | Permissions | ⏳ À venir |
| 4 | Rooms | ⏳ À venir |
| 5 | Guests | ⏳ À venir |
| 6 | Bookings | ✅ Terminé |
| 7 | Payments | ✅ Terminé |
| 8 | Dashboard | ✅ Terminé |
| 9 | Notifications | ✅ Terminé |
| 10 | Reviews | ✅ Terminé |

## Documentation

- [Domain Model v1.1](./DOMAIN_MODEL.md) — Concepts métier
- [Database Blueprint v1.1](./DATABASE_BLUEPRINT.md) — Architecture base de données
- [Migrations SQL](./supabase/migrations/) — 15 fichiers de migration

## Pour commencer

```bash
npm install
npm run dev
```

Variables d'environnement requises dans `.env.local` :
- `VITE_SUPABASE_URL` — URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` — Clé anon Supabase
