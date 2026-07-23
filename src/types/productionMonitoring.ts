/**
 * Wire shape from GET /api/Production/operator-production-schedules (and its Rework counterpart,
 * /api/Rework/operator-rework-schedules) — the operator's allotted pending schedules. `isWorking`
 * can only be true for one schedule across both endpoints combined; when it is, `sequenceNo`
 * identifies the operation currently in progress.
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
  producedQty?: number
  scheduleType?: "PRODUCTION" | "REWORK"
  isWorking?: boolean
  isTargetReached?: boolean
  sequenceNo?: number
}

/** Wire shape from GET /api/Production/operator-production-operations (or /api/Rework/operator-rework-operations) — sequenceNo represents the step number. */
export interface OperationRecord {
  operationId: number
  sequenceNo: number
  operationName: string
  processTeam: string
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

/** Wire shape from GET /api/Production/operator-production-log-report (or /api/Rework/operator-rework-log-report). */
export interface LogReportResponse {
  activeHours: string
  idleHours: string
  logs: LogReportEntry[]
}

/** The backend returns a bare `[]` (not the {activeHours, idleHours, logs} shape) when there are no logs yet. */
export type RawLogReportResponse = LogReportResponse | []

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
