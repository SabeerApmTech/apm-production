/**
 * Wire shape from GET /api/Production/operator-production-schedules — the operator's allotted
 * pending schedules, shaped like the OpenSchedule master record (see @/types/openSchedule) plus
 * three operator-flow-specific fields. `isWorking` is true for at most one schedule; when it is,
 * `workingSequenceNo`/`workingOperationName` identify the operation currently in progress.
 */
export interface OperatorSchedule {
  openScheduleId: number
  priorityNo: number
  scheduleId: string
  scheduleDate: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  targetDate: string
  plannedQty: number
  isWorking?: boolean
  isTargetReached?: boolean
  workingSequenceNo?: number
  workingOperationName?: string
}

/** Wire shape from GET /api/Production/operator-production-operations — sequenceNo represents the
 *  step number. `producedQtyOverall` is the running cumulative total that `remainingQty` is the
 *  complement of (toProduceQty - producedQtyOverall); `sumOfProducedQty`/`oldStockQty` are the
 *  finer-grained freshly-produced-vs-carried-over-stock breakdown behind that total, not currently
 *  surfaced in the UI. isQrApplicable/identifierTypeId are optional since only some operations
 *  require a QR scan; rejectedQty is no longer returned per-operation (it's still tracked per
 *  STOP log entry, see LogReportEntry). */
export interface OperationRecord {
  operationId: number
  sequenceNo: number
  operationName: string
  processTeam: string
  toProduceQty: number
  producedQtyOverall: number
  remainingQty: number
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
   *  session's QR scans via GET /operation-qr-scan/current-session. */
  transactionLogId?: number
}

/** Wire shape from GET /api/Production/operator-production-log. */
export interface LogReportResponse {
  activeHours: string
  idleHours: string
  logs: LogReportEntry[]
}

/** The backend returns a bare `[]` (not the {activeHours, idleHours, logs} shape) when there are no logs yet. */
export type RawLogReportResponse = LogReportResponse | []

/** Body for POST /api/operation-qr-scan/save-bulk — codes are accumulated client-side across
 *  several scans and only sent once the operator clicks Save. */
export interface OperationQrScanBulkRequest {
  transactionLogId: number
  identifiers: string[]
}

export interface EmployeeScanHistoryEntry {
  batchNumber: number
  uniqueIdentifierName: string
  uniqueIdentifier: string
  scannedAt: string
}

/** Wire shape from GET /api/operation-qr-scan/employee-scan-history — the operation's running
 *  scan total, as opposed to just the current session's from GET /api/operation-qr-scan/current-session
 *  (see QrCurrentSessionDetail in @/types/qrScanRecords, which that endpoint's response now matches). */
export interface EmployeeScanHistory {
  employeeId: string
  employeeName: string
  scheduleId: string
  operationName: string
  scannedQty: number
  batchCount: number
  identifiers?: EmployeeScanHistoryEntry[]
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
