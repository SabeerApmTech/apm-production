export interface OperationStepRecord {
  operationId: number
  pendingScheduleId: number
  sequenceNo: number
  operationName: string
  allocatedOperatorCount: number
}

export interface LastTeamMember {
  employeeId: string
  employeeName: string
  dateOfBirth: string
}

export interface AllocatedStaffMember {
  staffId: number
  scheduleOperationId: number
  employeeId: string
  employeeName: string
  dateOfBirth: string
}

export interface StaffAllocationRequest {
  scheduleOperationId: number
  employeeIds: string[]
  allocatedByEmpId: string
}
