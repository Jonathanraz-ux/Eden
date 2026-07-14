-- ============================================================================
-- EDEN: Luxury Management — Migration 005 : Employees
-- ============================================================================
-- employees        → personnel de l'établissement
-- roles            → regroupements de permissions (appartient à un hôtel)
-- permissions      → droits atomiques (table globale, sans hotel_id)
-- role_permissions → association rôle ↔ permission
-- employee_roles   → association employé ↔ rôle
-- ============================================================================

-- -------------------------------------------------------------------------
-- employees
-- -------------------------------------------------------------------------
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id        UUID NOT NULL REFERENCES hotels(id),
    auth_user_id    UUID UNIQUE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    job_title       TEXT,
    department      TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','on_leave','absent','inactive','suspended')),
    hire_date       DATE,
    supervisor_id   UUID REFERENCES employees(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- roles
-- -------------------------------------------------------------------------
CREATE TABLE roles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id          UUID NOT NULL REFERENCES hotels(id),
    name              TEXT NOT NULL,
    description       TEXT,
    hierarchy_level   INTEGER NOT NULL DEFAULT 0,
    is_system         BOOLEAN NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- permissions (table globale, pas de hotel_id)
-- -------------------------------------------------------------------------
CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    group_name  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------------------
-- role_permissions
-- -------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id),
    permission_id UUID NOT NULL REFERENCES permissions(id),
    UNIQUE (role_id, permission_id)
);

-- -------------------------------------------------------------------------
-- employee_roles
-- -------------------------------------------------------------------------
CREATE TABLE employee_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id),
    role_id     UUID NOT NULL REFERENCES roles(id),
    assigned_by UUID REFERENCES employees(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, role_id)
);
