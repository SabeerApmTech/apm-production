export type ManagedRole = "MANAGER" | "SUPERVISOR" | "OPERATOR"

export type EmploymentType = "FullTime" | "PartTime"

export interface UserRecord {
  usersId: number
  createdAt: string
  employeeId: string
  employeeName: string
  phoneNumber: string
  dateOfBirth: string
  employmentType: EmploymentType
  isActive: boolean
  employeeRole: ManagedRole
  updatedAt: string | null
}

export interface UpdateUserRequest {
  employeeName: string
  phoneNumber: string
  dateOfBirth: string
  employmentType: EmploymentType
  editedByEmployeeId: string
}

export interface CreateUserRequest {
  createdByEmpID: string
  createdByEmpName: string
  createdByEmpRole: string
  employeeId: string
  employeeName: string
  phoneNumber: string
  dateOfBirth: string
  employmentType: EmploymentType
  employeeRole: ManagedRole
  department?: string
}

export interface UpdateUserStatusRequest {
  status: boolean
  editedByEmployeeId: string
}
