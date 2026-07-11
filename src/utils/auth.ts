import type { AuthUser, EmployeeRole } from "@/types/auth"
import type { ManagedRole } from "@/types/userManagement"

const ROLE_LABELS: Record<EmployeeRole, string> = {
  SUPERADMIN: 'Super Admin',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
}

export const getRoleLabel = (role: EmployeeRole): string => ROLE_LABELS[role]

export type UserRole = 'admin' | 'operator'

export interface OperatorUser {
  employeeId: string
  employeeName: string
}

const AUTH_USER_KEY = 'authUser'
const OPERATOR_USER_KEY = 'operatorUser'

export const getRole = (): UserRole | null =>
  localStorage.getItem('role') as UserRole | null

export const setRole = (role: UserRole) =>
  localStorage.setItem('role', role)

export const getAuthUser = (): AuthUser | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

/** Persists the logged-in employee and marks the legacy admin/operator nav split as 'admin' — SUPERADMIN, MANAGER and SUPERVISOR all use the admin-side layout. */
export const setAuthUser = (user: AuthUser) => {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  setRole('admin')
}

export const clearAuth = () => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(OPERATOR_USER_KEY)
  localStorage.removeItem('role')
}

/** Persists the operator picked on the /operator-login screen (no password, identify-only) and marks the nav split as 'operator'. */
export const setOperatorUser = (user: OperatorUser) => {
  localStorage.setItem(OPERATOR_USER_KEY, JSON.stringify(user))
  setRole('operator')
}

export const getOperatorUser = (): OperatorUser | null => {
  const raw = localStorage.getItem(OPERATOR_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as OperatorUser
  } catch {
    return null
  }
}

/**
 * Add/edit/toggle-active/delete/reset-password permissions per managed entity type:
 * - Managers:   SUPERADMIN only.
 * - Supervisors: MANAGER only.
 * - Operators:  SUPERVISOR only.
 */
export const canManageRole = (targetRole: ManagedRole): boolean => {
  const user = getAuthUser()
  if (!user) return false
  switch (targetRole) {
    case 'MANAGER':
      return user.employeeRole === 'SUPERADMIN'
    case 'SUPERVISOR':
      return user.employeeRole === 'MANAGER'
    case 'OPERATOR':
      return user.employeeRole === 'SUPERVISOR'
  }
}
