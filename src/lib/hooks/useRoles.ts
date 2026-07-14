import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../services/employeeService';
import type { Role, Permission, Insert, Update } from '../types/database';

export function useRoles(hotelId: string) {
  return useQuery({
    queryKey: ['roles', hotelId],
    queryFn: () => employeeService.listRoles(hotelId),
    enabled: Boolean(hotelId),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => employeeService.listPermissions(),
    staleTime: Infinity,
  });
}

export function useRolePermissions(roleIds: string[]) {
  return useQuery({
    queryKey: ['role_permissions', roleIds],
    queryFn: () => employeeService.listPermissionsByRoleIds(roleIds),
    enabled: roleIds.length > 0,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: Insert<Role>) => employeeService.createRole(role),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['roles', (data as any).hotel_id] });
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Update<Role> }) =>
      employeeService.updateRole(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.softDeleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useAssignPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      employeeService.assignPermissionToRole(roleId, permissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role_permissions'] });
    },
  });
}

export function useRemovePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      employeeService.removePermissionFromRole(roleId, permissionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['role_permissions'] });
    },
  });
}
