import { getSupabase } from '../supabase';
import type { Employee } from '../types/database';

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async getCurrentEmployee(userId: string): Promise<Employee | null> {
    const { data, error } = await getSupabase()
      .from('employees')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async registerEmployee(params: {
    hotelId: string;
    authUserId: string;
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<Employee> {
    const { data, error } = await getSupabase()
      .from('employees')
      .insert({
        hotel_id: params.hotelId,
        auth_user_id: params.authUserId,
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        status: 'active',
      })
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de l\'enregistrement de l\'employé');
    return data;
  },
};
