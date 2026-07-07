export type EmployeeRole = "SUPERADMIN" | "MANAGER" | "SUPERVISOR"

export interface AuthUser {
  userId: number
  employeeId: string
  employeeName: string
  employeeRole: EmployeeRole
  employmentType: string
  phoneNumber: string
  dateOfBirth: string
  isActive: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface LoginRequest {
  employeeId: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
