import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '../supabase';
import { useDemoMode, demoMutationResult } from '../demo-mode';
import { demoEmployees } from '../../data/demo-data';
import type { Employee, Insert, Update } from '../types/database';

export function useEmployees() {
  const { demoMode } = useDemoMode();
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      if (demoMode) return demoEmployees;
      const { data, error } = await getSupabase()
        .from('employees')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: async (employee: Insert<Employee>) => {
      if (demoMode) return demoMutationResult({ ...employee, id: 'demo-emp-new', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any);
      const { data, error } = await getSupabase()
        .from('employees')
        .insert(employee)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Échec de la création de l\'employé');
      return data;
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Update<Employee> }) => {
      if (demoMode) return demoMutationResult({ id, ...updates } as any);
      const { data, error } = await getSupabase()
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Employé introuvable pour la mise à jour');
      return data;
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  const { demoMode } = useDemoMode();
  return useMutation({
    mutationFn: async (id: string) => {
      if (demoMode) { await demoMutationResult(undefined); return; }
      const { error } = await getSupabase()
        .from('employees')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (!demoMode) qc.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
