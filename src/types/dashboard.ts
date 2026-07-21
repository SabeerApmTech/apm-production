export type EmployeeTrackingStatus = "NOTSTARTED" | "RUNNING" | "PAUSED" | "STOPPED"

export interface EmployeeTrackingSummary {
  totalEmployees: number
  notStarted: number
  running: number
  paused: number
  stopped: number
}

export interface EmployeeTrackingRow {
  employeeId: string
  employeeName: string
  status: string
  scheduleId: string
  companyName: string
  productName: string
  operationName: string
  targetQty: number
  producedQty: number
  progressPercentage: number
  /** An employee working both a production and a rework schedule appears as two separate rows,
   * one per type, sharing the same employeeId — this is what tells them apart. */
  scheduleType: "PRODUCTION" | "REWORK"
}

export interface EmployeeLiveTrackingResponse {
  summary: EmployeeTrackingSummary
  employees: EmployeeTrackingRow[]
}

export interface ScheduleTrackingHeader {
  scheduleDate: string
  targetDate: string
  projectedDate: string | null
  companyName: string
  productName: string
  targetQty: number
  producedQty: number
  pendingQty: number
  averageOutputPerDay: number
  scheduleType: "PRODUCTION" | "REWORK"
}

export interface ScheduleOperationRow {
  sequenceNo: number
  operationName: string
  staffAssigned: number
  successfulQty: number
  rejectedQty: number
  progressPercentage: number
}

export interface ScheduleLiveTrackingResponse {
  header: ScheduleTrackingHeader
  operations: ScheduleOperationRow[]
}
