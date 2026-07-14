import { getSupabase } from '../supabase';
import type {
  Role,
  Permission,
  Insert,
  Update,
} from '../types/database';

export const employeeService = {
  // -- Roles --
  async listRoles(hotelId: string): Promise<Role[]> {
    const { data, error } = await getSupabase()
      .from('roles')
      .select('*')
      .eq('hotel_id', hotelId)
      .is('deleted_at', null)
      .order('hierarchy_level');
    if (error) throw error;
    return data;
  },

  async createRole(role: Insert<Role>): Promise<Role> {
    const { data, error } = await getSupabase()
      .from('roles')
      .insert(role)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Échec de la création du rôle');
    return data;
  },

  // -- Roles (suite) --
  async updateRole(id: string, updates: Update<Role>): Promise<Role> {
    const { data, error } = await getSupabase()
      .from('roles')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Rôle introuvable pour la mise à jour');
    return data;
  },

  async softDeleteRole(id: string): Promise<void> {
    const { error } = await getSupabase()
      .from('roles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // -- Role Permissions --
  async getRolePermissions(roleId: string): Promise<string[]> {
    const { data, error } = await getSupabase()
      .from('role_permissions')
      .select('permission:permissions!inner(code)')
      .eq('role_id', roleId);
    if (error) throw error;
    return (data as unknown as Array<{ permission: { code: string } }>).map(r => r.permission.code);
  },

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId });
    if (error && error.code !== '23505') throw error; // ignore duplicate
  },

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await getSupabase()
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw error;
  },

  // -- Permissions --
  async listPermissions(): Promise<Permission[]> {
    const { data, error } = await getSupabase()
      .from('permissions')
      .select('*')
      .order('group_name');
    if (error) throw error;
    return data;
  },

  async listPermissionsByRoleIds(roleIds: string[]): Promise<Record<string, string[]>> {
    if (roleIds.length === 0) return {};
    const { data, error } = await getSupabase()
      .from('role_permissions')
      .select('role_id, permission:permissions!inner(code)')
      .in('role_id', roleIds);
    if (error) throw error;

    const map: Record<string, string[]> = {};
    for (const row of data as unknown as Array<{ role_id: string; permission: { code: string } }>) {
      if (!map[row.role_id]) map[row.role_id] = [];
      map[row.role_id].push(row.permission.code);
    }
    return map;
  },
};
