export interface ReworkOperationStepRecord {
  reworkScheduleOperationId: number
  reworkPendingScheduleId: number
  sequenceNo: number
  operationName: string
  allocatedOperatorCount: number
}

export interface ReworkLastTeamMember {
  employeeId: string
  employeeName: string
  dateOfBirth: string
}

export interface ReworkAllocatedStaffMember {
  reworkStaffId: number
  reworkScheduleOperationId: number
  employeeId: string
  employeeName: string
  dateOfBirth: string
}

export interface ReworkStaffAllocationRequest {
  reworkScheduleOperationId: number
  employeeIds: string[]
  allocatedByEmpId: string
}
