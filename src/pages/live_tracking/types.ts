export type EmployeeStatus = "Running" | "Paused" | "Stopped" | "Not Started"

export interface EmployeeRecord {
  id: string
  name: string
  employeeId: string
  scheduleId: string
  company: string
  product: string
  step: string
  targetQty: number
  producedQty: number
  status: EmployeeStatus
}

export interface ScheduleDetail {
  priorityNo: number
  scheduleId: string
  scheduleDate: string
  company: string
  product: string
  targetDate: string
  targetQty: number
}

export interface StageDetail {
  stage: number
  operation: string
  targetQty: number
  producedQty: number
  pendingQty: number
  status: EmployeeStatus
}

export interface LogEntry {
  dateTime: string
  status: "Started" | "Paused" | "Stopped"
  successQty: number | null
  rejectedQty: number | null
  reason: string | null
  remarks: string | null
}
