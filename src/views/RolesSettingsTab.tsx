import { useState, type FormEvent } from 'react';
import { useCurrentHotelId } from '../lib/hooks/useAuth';
import { useRoles, usePermissions, useRolePermissions, useCreateRole, useUpdateRole, useDeleteRole, useAssignPermission, useRemovePermission } from '../lib/hooks/useRoles';
import type { Permission } from '../lib/types/database';
import { Shield, Plus, X, Check, Edit2, Trash2, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const permissionGroups: Record<string, string> = {
  Booking: 'Réservations',
  Payment: 'Paiements',
  Room: 'Chambres',
  Employee: 'Personnel',
  Guest: 'Clients',
  Settings: 'Paramètres',
  Invoice: 'Facturation',
  Report: 'Rapports',
  Audit: 'Audit',
};

type RoleData = { id: string; name: string; description: string | null; is_system: boolean };

export function RolesSettingsTab() {
  const hotelId = useCurrentHotelId();
  const { data: roles = [], isLoading: loadingRoles } = useRoles(hotelId ?? '');
  const { data: permissions = [], isLoading: loadingPerms } = usePermissions();
  const { data: rolePermissions = {} } = useRolePermissions(roles.map(r => r.id));
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const assignPerm = useAssignPermission();
  const removePerm = useRemovePermission();

  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSelectedPerms, setFormSelectedPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const groupedPermissions: Record<string, Permission[]> = permissions.reduce((acc, p) => {
    const group = p.group_name ?? 'Autre';
    if (!acc[group]) acc[group] = [];
    acc[group].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const openCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormSelectedPerms([]);
    setShowForm(true);
  };

  const openEdit = (role: RoleData) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description ?? '');
    setFormSelectedPerms(rolePermissions[role.id] ?? []);
    setShowForm(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!hotelId || !formName.trim()) return;
    setSaving(true);

    try {
      if (editingRole) {
        await updateRole.mutateAsync({
          id: editingRole.id,
          updates: { name: formName.trim(), description: formDescription.trim() || null },
        });
        const currentPerms = rolePermissions[editingRole.id] ?? [];
        const toAdd = formSelectedPerms.filter(p => !currentPerms.includes(p));
        const toRemove = currentPerms.filter(p => !formSelectedPerms.includes(p));
        for (const code of toRemove) {
          const perm = permissions.find(p => p.code === code);
          if (perm) await removePerm.mutateAsync({ roleId: editingRole.id, permissionId: perm.id });
        }
        for (const code of toAdd) {
          const perm = permissions.find(p => p.code === code);
          if (perm) await assignPerm.mutateAsync({ roleId: editingRole.id, permissionId: perm.id });
        }
      } else {
        const role = await createRole.mutateAsync({
          hotel_id: hotelId,
          name: formName.trim(),
          description: formDescription.trim() || null,
          hierarchy_level: 0,
          is_system: false,
        });
        for (const code of formSelectedPerms) {
          const perm = permissions.find(p => p.code === code);
          if (perm) await assignPerm.mutateAsync({ roleId: role.id, permissionId: perm.id });
        }
      }

      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: RoleData) => {
    if (!window.confirm(`Supprimer le rôle "${role.name}" ?`)) return;
    await deleteRole.mutateAsync(role.id);
  };

  const togglePerm = (code: string) => {
    setFormSelectedPerms(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  if (loadingRoles || loadingPerms) {
    return <p className="text-sm text-[#1A1A1A]/40">Chargement...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#1A1A1A]/40">
            {roles.length} rôle{roles.length > 1 ? 's' : ''} · {permissions.length} permissions
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-[#333] transition-colors rounded-sm"
        >
          <Plus className="w-3 h-3" /> Nouveau Rôle
        </button>
      </div>

      {roles.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#1A1A1A]/10 rounded-sm">
          <Shield className="w-8 h-8 mx-auto text-[#1A1A1A]/20 mb-3" />
          <p className="text-sm text-[#1A1A1A]/40">Aucun rôle défini</p>
          <p className="text-[10px] text-[#1A1A1A]/20 mt-1">Créez votre premier rôle pour commencer</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => {
            const perms = rolePermissions[role.id] ?? [];
            const grouped = perms.reduce<Record<string, number>>((acc, p) => {
              const perm = permissions.find(x => x.code === p);
              const g = perm?.group_name ?? 'Autre';
              acc[g] = (acc[g] ?? 0) + 1;
              return acc;
            }, {});

            return (
              <div key={role.id} className="bg-white border border-[#1A1A1A]/10 rounded-sm p-6 hover:border-[#1A1A1A]/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-[#C5A059]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{role.name}</h4>
                      {role.description && (
                        <p className="text-[11px] text-[#1A1A1A]/40 mt-0.5">{role.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(grouped).map(([group, count]) => (
                          <span key={group} className="text-[9px] uppercase tracking-wider bg-[#FAF9F6] border border-[#1A1A1A]/10 px-2 py-0.5 rounded-sm text-[#1A1A1A]/50">
                            {permissionGroups[group] ?? group} ({count})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(role)}
                      className="p-2 border border-[#1A1A1A]/10 hover:border-[#C5A059]/40 text-[#1A1A1A]/40 hover:text-[#C5A059] transition-all rounded-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {!role.is_system && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="p-2 border border-[#1A1A1A]/10 hover:border-red-300 text-[#1A1A1A]/40 hover:text-red-500 transition-all rounded-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-lg mx-4 rounded-sm shadow-xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSave}>
              <div className="p-6 border-b border-[#1A1A1A]/5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest">
                  {editingRole ? 'Modifier le Rôle' : 'Nouveau Rôle'}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-[#1A1A1A]/5 rounded-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Nom du rôle</label>
                  <input
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm focus:outline-none focus:border-[#C5A059] transition-colors"
                    placeholder="Ex. Réceptionniste"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Description</label>
                  <input
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#1A1A1A]/10 rounded-sm text-sm focus:outline-none focus:border-[#C5A059] transition-colors"
                    placeholder="Description du rôle"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">Permissions</label>
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <div key={group}>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#C5A059] mb-2">
                          {permissionGroups[group] ?? group}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {perms.map(p => {
                            const selected = formSelectedPerms.includes(p.code);
                            return (
                              <button
                                key={p.code}
                                type="button"
                                onClick={() => togglePerm(p.code)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-wider font-medium border rounded-sm transition-all",
                                  selected
                                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                    : "bg-white text-[#1A1A1A]/50 border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                                )}
                              >
                                {selected ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                                {p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[#FAF9F6] border-t border-[#1A1A1A]/5 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-[#1A1A1A] text-white text-[11px] uppercase tracking-widest font-bold hover:bg-[#333] transition-colors rounded-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                  {editingRole ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
