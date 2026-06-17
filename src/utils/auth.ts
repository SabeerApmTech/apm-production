export type UserRole = 'admin' | 'operator'

export const getRole = (): UserRole | null =>
  localStorage.getItem('role') as UserRole | null

export const setRole = (role: UserRole) =>
  localStorage.setItem('role', role)

export const clearAuth = () =>
  localStorage.removeItem('role')
