/**
 * Wire shape from GET /api/ProductionMonitoring/operator-schedules — the operator's allotted
 * pending schedules. `scheduleType` isn't sent by the backend yet (defaults to "PRODUCTION" until
 * it is); when `isWorking` is true, `sequenceNo` identifies the operation currently in progress.
 */
export interface OperatorSchedule {
  pendingScheduleId: number
  priorityNo: number
  scheduleId: string
  scheduleDate: string
  companyName: string
  productName: string
  targetDate: string
  targetQty: number
  scheduleType?: "PRODUCTION" | "REWORK"
  isWorking?: boolean
  sequenceNo?: number
}

/** Wire shape from GET /api/ProductionMonitoring/operator-operations — sequenceNo represents the step number. */
export interface OperationRecord {
  operationId: number
  sequenceNo: number
  operationName: string
  targetQty: number
  producedQty: number
  pendingQty: number
  rejectedQty: number
}

export interface LogReportEntry {
  logTime: string
  sequenceNo: number
  logEvent: "START" | "PAUSE" | "STOP" | "RESUME"
  successfulQty: number
  rejectedQty: number
  reason: string | null
  remarks: string | null
}

/** Wire shape from GET /api/ProductionMonitoring/operator-log-report. */
export interface LogReportResponse {
  activeHours: string
  idleHours: string
  logs: LogReportEntry[]
}

export interface OperatorActionRequest {
  action: "start" | "PAUSE" | "RESUME" | "STOP"
  employeeId: string
  scheduleId: string
  sequenceNo: number
  operationName: string
  successfulQty: number
  rejectedQty: number
  reason: string
  remarks: string
}
