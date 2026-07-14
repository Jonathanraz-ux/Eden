import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  supabaseUrl !== 'https://votre-projet.supabase.co' &&
  supabaseAnonKey !== 'votre-cle-anon-supabase';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase non configuré. Vérifiez les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local'
    );
  }
  return supabase;
}

export function isSupabaseConnected(): boolean {
  return supabase !== null;
}
