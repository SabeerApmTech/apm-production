export type ViewStep      = "employee" | "type" | "schedules" | "operations" | "working"
export type ScheduleType  = "production" | "rework"
export type StepStatus    = "idle" | "running" | "paused" | "stopped"

export interface Employee {
  id: string
  name: string
}

export interface Schedule {
  id: string
  priorityNo: number
  scheduleDate: string
  company: string
  product: string
  targetDate: string
  targetQty: number
}

export interface Operation {
  step: number
  name: string
  targetQty: number
  producedQty: number
  pendingQty: number
  rejectQty: number
}

export interface LogEntry {
  dateTime: string
  status: "Started" | "Paused" | "Resumed" | "Stopped"
  successQty: number | null
  rejectedQty: number | null
  reason: string | null
  remarks: string | null
}
