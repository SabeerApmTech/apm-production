import type { ReworkType } from "./reworkSchedule"

/**
 * Wire shape from GET /api/Production/operator-production-schedules (and its Rework counterpart,
 * /api/Rework/operator-rework-schedules) — the operator's allotted pending schedules. `isWorking`
 * can only be true for one schedule across both endpoints combined; when it is, `sequenceNo`
 * identifies the operation currently in progress. `reworkType` is only present on the rework
 * endpoint's response.
 */
export interface OperatorSchedule {
  pendingScheduleId: number
  priorityNo: number
  scheduleId: string
  scheduleDate: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  targetDate: string
  targetQty: number
  producedQty?: number
  scheduleType?: "PRODUCTION" | "REWORK"
  reworkType?: ReworkType
  isWorking?: boolean
  isTargetReached?: boolean
  sequenceNo?: number
}

/** Wire shape from GET /api/Production/operator-production-operations (or /api/Rework/operator-rework-operations) — sequenceNo represents the step number.
 *  isQrApplicable/identifierTypeId are optional since only the production endpoint returns them so far. */
export interface OperationRecord {
  operationId: number
  sequenceNo: number
  operationName: string
  processTeam: string
  targetQty: number
  producedQty: number
  pendingQty: number
  rejectedQty: number
  isQrApplicable?: boolean
  identifierTypeId?: number
}

export interface LogReportEntry {
  logTime: string
  sequenceNo: number
  logEvent: "START" | "PAUSE" | "STOP" | "RESUME"
  successfulQty: number
  rejectedQty: number
  reason: string | null
  remarks: string | null
  /** Only present on the STOP row that closed out a session — the id to look up that
   *  session's QR scans via GET /operation-qr-scan/current-session. Only present on a production
   *  log entry; a rework log entry carries the equivalent id under `reworkTransactionLogId` instead. */
  transactionLogId?: number
  /** The rework counterpart of `transactionLogId` above — the id to look up a rework session's QR
   *  scans via GET /rework-qr-scan/current-session/{id}. Only present on a rework log entry. */
  reworkTransactionLogId?: number
}

/** Wire shape from GET /api/Production/operator-production-log-report (or /api/Rework/operator-rework-log-report). */
export interface LogReportResponse {
  activeHours: string
  idleHours: string
  logs: LogReportEntry[]
}

/** The backend returns a bare `[]` (not the {activeHours, idleHours, logs} shape) when there are no logs yet. */
export type RawLogReportResponse = LogReportResponse | []

/** Body for POST /api/operation-qr-scan/save-bulk — codes are accumulated client-side across
 *  several scans and only sent once the operator clicks Save. Production operations only; rework
 *  operations save via POST /api/rework-qr-scan instead, see ReworkQrScanBulkRequest. */
export interface OperationQrScanBulkRequest {
  transactionLogId: number
  identifiers: string[]
}

/** Body for POST /api/rework-qr-scan — the rework counterpart of OperationQrScanBulkRequest. */
export interface ReworkQrScanBulkRequest {
  reworkTransactionLogId: number
  uniqueIdentifiers: string[]
}

export interface EmployeeScanHistoryEntry {
  identifierName: string
  identifierId: string
  batchNumber: number
  scannedAt: string
}

/** Wire shape from GET /api/operation-qr-scan/employee-scan-history — the operation's running
 *  scan total, as opposed to just the current session's from GET /api/operation-qr-scan/current-session
 *  (see QrCurrentSessionDetail in @/types/qrScanRecords, which that endpoint's response now matches).
 *  Rework operations use the same-purpose but differently-shaped GET /api/rework-qr-scan/employee-scan-history
 *  instead, see ReworkScanHistoryEntry. */
export interface EmployeeScanHistory {
  employeeId: string
  employeeName: string
  scheduleId: string
  operationName: string
  scannedQty: number
  identifiers?: EmployeeScanHistoryEntry[]
}

/** Wire shape from GET /api/rework-qr-scan/employee-scan-history — the response is a bare array
 *  (no wrapping object, no running total field), unlike the production EmployeeScanHistory. */
export interface ReworkScanHistoryEntry {
  batchNumber: number
  uniqueIdentifierName: string
  uniqueIdentifier: string
  scannedAt: string
}

export interface ReworkCurrentSessionScan {
  qrScanId: number
  batchNumber: number
  uniqueIdentifierName: string
  uniqueIdentifier: string
  scannedAt: string
}

/** Wire shape from GET /api/rework-qr-scan/current-session/{reworkTransactionLogId} — the rework
 *  counterpart of QrCurrentSessionDetail (see @/types/qrScanRecords). */
export interface ReworkCurrentSessionDetail {
  totalCount: number
  scannedQrCodes: ReworkCurrentSessionScan[]
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
