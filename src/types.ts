export type EmployeeStatus = 'active' | 'on_leave' | 'absent' | 'inactive' | 'suspended';

export interface Employee {
  id: string;
  hotel_id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  status: EmployeeStatus;
  hire_date: string | null;
  supervisor_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function getEmployeeFullName(emp: Employee): string {
  return `${emp.first_name} ${emp.last_name}`.trim();
}

export function getEmployeeInitials(emp: Employee): string {
  return ((emp.first_name?.charAt(0) ?? '') + (emp.last_name?.charAt(0) ?? '')).toUpperCase().trim() || '?';
}

export function getEmployeeAvatarUrl(emp: Employee): string {
  const name = getEmployeeFullName(emp);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=C5A059&color=fff&size=150`;
}
