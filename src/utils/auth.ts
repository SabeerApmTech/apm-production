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
const TOKEN_COOKIE = 'authToken'
const TOKEN_EXPIRES_COOKIE = 'authTokenExpiresAt'

function setCookie(name: string, value: string, expiresAt: string) {
  const expires = new Date(expiresAt).toUTCString()
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

export const getRole = (): UserRole | null =>
  localStorage.getItem('role') as UserRole | null

export const setRole = (role: UserRole) =>
  localStorage.setItem('role', role)

/** Where an expired/unauthenticated session should be sent back to, based on the last known role. */
export const getLoginPath = (): string =>
  getRole() === 'operator' ? '/operator-login' : '/login'

export const getToken = (): string | null => getCookie(TOKEN_COOKIE)

export const getTokenExpiresAt = (): string | null => getCookie(TOKEN_EXPIRES_COOKIE)

/** True once the token cookie's recorded expiry has passed (or is missing). */
export const isTokenExpired = (): boolean => {
  const expiresAt = getTokenExpiresAt()
  if (!expiresAt) return true
  return new Date(expiresAt).getTime() <= Date.now()
}

/** The stored profile never carries the token/expiry — those live in cookies (see getToken/getTokenExpiresAt). */
export type AuthUserProfile = Omit<AuthUser, 'token' | 'tokenExpiresAt'>

export const getAuthUser = (): AuthUserProfile | null => {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUserProfile
  } catch {
    return null
  }
}

/**
 * Persists the logged-in employee and marks the legacy admin/operator nav split as 'admin' — SUPERADMIN, MANAGER and SUPERVISOR all use the admin-side layout.
 * The token itself is kept in a cookie (not localStorage) and expires alongside the server-issued `tokenExpiresAt`.
 */
export const setAuthUser = (user: AuthUser) => {
  const { token, tokenExpiresAt, ...profile } = user
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile))
  setRole('admin')
  setCookie(TOKEN_COOKIE, token, tokenExpiresAt)
  setCookie(TOKEN_EXPIRES_COOKIE, tokenExpiresAt, tokenExpiresAt)
}

export const clearAuth = () => {
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(OPERATOR_USER_KEY)
  localStorage.removeItem('role')
  deleteCookie(TOKEN_COOKIE)
  deleteCookie(TOKEN_EXPIRES_COOKIE)
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

/** The signed-in employee's ID regardless of role — admins live under `authUser`, operators under `operatorUser`. */
export const getCurrentEmployeeId = (): string =>
  (getRole() === 'operator' ? getOperatorUser()?.employeeId : getAuthUser()?.employeeId) ?? ''

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
