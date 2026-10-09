// =============================================================================
// EDEN — Edge Function : create-tenant
// =============================================================================
// Installe unhotel en un appel : hotel + parametres + roles + referentiel,
// puis le compte Auth du premier administrateur.
//
// Cest la brique qui rend le modele 800 EUR/client tenable : le script
// d'installation devient une commande, pas une serie de manipulations.
//
// AUTHENTIFICATION
// Cette fonction deploiee avec --no-verify-jwt : elle nest pas destinee au
// navigateur mais a loutil dinstallation du deployeur. Elle exige donc un
// secret partage dans l en-tete `x-provisioning-key`, compare en temps
// constant. Sans ce secret, elle ne fait rien.
//
// MODES
//   { }                              -> provisionne un hotel seul
//   { hotel, admin }                 -> hotel + compte Auth administrateur
//   { action: "create_employee" }    -> ajoute un employe dans un hotel existant
//   { action: "link_employee" }      -> cree un compte Auth et le relie a un employe
//
// Toutes les ecritures passent par les fonctions SQL de la migration 074,
// reservees a service_role. Le client ne parle jamais directement aux tables.
// =============================================================================

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? ''
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] ?? 'http://localhost:5173')
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-provisioning-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

interface AdminInput {
  email: string
  password: string
  first_name?: string
  last_name?: string
  job_title?: string
  department?: string
}

interface HotelInput {
  name: string
  brand?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  postal_code?: string
  region?: string
  country: string
  star_rating?: number
  phone?: string
  email?: string
  website?: string
  currency_code?: string
  default_language?: string
  timezone?: string
  check_in_time?: string
  check_out_time?: string
  cancellation_policy?: string
  no_show_policy?: string
  free_cancellation_hours?: number
  deposit_required?: boolean
  default_vat_rate?: number
  seed_reference_data?: boolean
}

interface RequestBody {
  hotel?: HotelInput
  admin?: AdminInput
  action?: 'create_employee' | 'link_employee'
  hotel_id?: string
  employee?: {
    first_name?: string
    last_name?: string
    email?: string
    job_title?: string
    department?: string
    role_name?: string
  }
  employee_id?: string
  password?: string
}

// -----------------------------------------------------------------------------
// Utilitaires
// -----------------------------------------------------------------------------

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = getCorsHeaders(new Request('http://localhost'))): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function fail(message: string, status = 400, detail?: unknown): Response {
  return json({ ok: false, error: message, ...(detail ? { detail } : {}) }, status)
}

/** Comparaison en temps constant pour ne pas fuir le secret par timing. */
function secretEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Cree un compte Auth, ou reutilise un existant.
 * Renvoie toujours un user_id exploitable.
 */
async function ensureAuthUser(
  supabase: SupabaseClient,
  email: string,
  password?: string,
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (!error) return data.user!.id

  const alreadyExists =
    error.message?.includes('already been registered') ||
    error.message?.includes('already exists') ||
    error.status === 422

  if (!alreadyExists) throw new Error(`Creation du compte Auth impossible : ${error.message}`)

  // Le compte existe deja : on le retrouve pour ne pas laisser le client bloque.
  const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw new Error(`Compte Auth existant mais introuvable : ${listError.message}`)

  const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!found) throw new Error(`Compte Auth ${email} existant mais introuvable dans la liste`)

  // Mot de passe fourni et compte existant : on le met a jour pour que le
  // client puisse se connecter avec les identifiants livres.
  if (password) {
    const { error: updErr } = await supabase.auth.admin.updateUserById(found.id, { password })
    if (updErr) throw new Error(`Mot de passe non mis a jour : ${updErr.message}`)
  }

  return found.id
}

// -----------------------------------------------------------------------------
// Gestionnaire
// -----------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  if (req.method !== 'POST') return fail('Methode non autorisee. Utilisez POST.', 405)

  // --- Authentification du deployeur -------------------------------------
  const expected = Deno.env.get('PROVISIONING_KEY')
  if (!expected) return fail('PROVISIONING_KEY non configuree sur la fonction.', 500)

  const provided = req.headers.get('x-provisioning-key') ?? ''
  if (!provided || !secretEquals(provided, expected)) {
    return fail('Cle de provisioning absente ou invalide.', 401)
  }

  // --- Corps de la requete ------------------------------------------------
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return fail('Corps JSON invalide.', 400, corsHeaders)
  }

  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceKey) return fail('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.', 500, corsHeaders)

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    // ======================================================================
    // Mode : creation d'un employe dans un hotel existant
    // ======================================================================
    if (body.action === 'create_employee') {
      if (!body.hotel_id) return fail('hotel_id est obligatoire pour create_employee.', 400, corsHeaders)
      if (!body.employee?.first_name) return fail('employee.first_name est obligatoire.', 400, corsHeaders)

      const { data: employeeId, error } = await supabase.rpc('fn_provision_employee', {
        p_hotel_id: body.hotel_id,
        p_first_name: body.employee.first_name,
        p_last_name: body.employee.last_name ?? '',
        p_email: body.employee.email ?? '',
        p_job_title: body.employee.job_title ?? null,
        p_department: body.employee.department ?? null,
        p_role_name: body.employee.role_name ?? null,
      })

      if (error) throw new Error(error.message)
      return json({ ok: true, action: 'create_employee', employee_id: employeeId })
    }

    // ======================================================================
    // Mode : creation d'un compte Auth + liaison a un employe existant
    // ======================================================================
    if (body.action === 'link_employee') {
      if (!body.employee_id) return fail('employee_id est obligatoire pour link_employee.', 400, corsHeaders)
      if (!body.employee?.email) return fail('employee.email est obligatoire pour link_employee.', 400, corsHeaders)
      if (!EMAIL_RE.test(body.employee.email)) return fail('Adresse email invalide.', 400, corsHeaders)
      if (body.password && body.password.length < 12) {
        return fail('Le mot de passe doit contenir au moins 12 caracteres.', 400, corsHeaders)
      }

      const userId = await ensureAuthUser(supabase, body.employee.email, body.password)

      const { error } = await supabase.rpc('fn_link_employee_to_auth_user', {
        p_employee_id: body.employee_id,
        p_auth_user_id: userId,
      })

      if (error) throw new Error(error.message)

      return json({
        ok: true,
        action: 'link_employee',
        employee_id: body.employee_id,
        auth_user_id: userId,
        email: body.employee.email,
      })
    }

    // ======================================================================
    // Mode par defaut : hotel (+ administrateur)
    // ======================================================================
    if (!body.hotel?.name) return fail('hotel.name est obligatoire.')
    if (!body.hotel?.country) return fail('hotel.country est obligatoire.')

    const { data: hotelId, error: hotelError } = await supabase.rpc('fn_provision_hotel', {
      p_input: body.hotel,
    })
    if (hotelError) throw new Error(hotelError.message)

    const result: Record<string, unknown> = { ok: true, hotel_id: hotelId, hotel: body.hotel.name }

    if (body.admin) {
      if (!EMAIL_RE.test(body.admin.email)) return fail('admin.email invalide.')
      if (!body.admin.password || body.admin.password.length < 12) {
        return fail('admin.password doit contenir au moins 12 caracteres.')
      }

      const userId = await ensureAuthUser(supabase, body.admin.email, body.admin.password)

      const { data: employeeId, error: adminError } = await supabase.rpc('fn_provision_admin', {
        p_hotel_id: hotelId,
        p_auth_user_id: userId,
        p_email: body.admin.email,
        p_first_name: body.admin.first_name ?? 'Admin',
        p_last_name: body.admin.last_name ?? 'Systeme',
        p_job_title: body.admin.job_title ?? 'Directeur',
        p_department: body.admin.department ?? 'Direction',
      })
      if (adminError) throw new Error(adminError.message)

      result.admin = { employee_id: employeeId, auth_user_id: userId, email: body.admin.email }
    }

    return json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return fail(' Echec du provisionnement.', 500, message)
  }
})