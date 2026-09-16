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
  productCode: string
  itemName: string
  targetDate: string
  plannedQty: number
  /** The one identifier type that applies across the whole schedule (all of its QR-applicable
   *  operations share it) — operations themselves no longer carry their own identifierTypeId. */
  identifierId?: number
  identifierName?: string
  isWorking?: boolean
  isTargetReached?: boolean
  workingSequenceNo?: number
  workingOperationName?: string
}

/** Wire shape from GET /api/Production/operator-production-operations — sequenceNo represents the
 *  step number. `producedQtyOverall` is the running cumulative total that `remainingQty` is the
 *  complement of (toProduceQty - producedQtyOverall); `sumOfProducedQty`/`oldStockQty` are the
 *  finer-grained freshly-produced-vs-carried-over-stock breakdown behind that total, not currently
 *  surfaced in the UI. isQrApplicable is optional since only some operations require a QR scan;
 *  rejectedQty is no longer returned per-operation (it's still tracked per STOP log entry, see
 *  LogReportEntry). The identifier that gates a QR-applicable operation is no longer per-operation
 *  either — see `identifierId`/`identifierName` on OperatorSchedule above. */
export interface OperationRecord {
  operationId: number
  sequenceNo: number
  operationName: string
  processTeam: string
  toProduceQty: number
  producedQtyOverall: number
  remainingQty: number
  isQrApplicable?: boolean
}

export interface LogReportEntry {
  logTime: string
  sequenceNo: number
  logEvent: "START" | "PAUSE" | "STOP" | "RESUME"
  successfulQty: number
  /** Not present on every row (e.g. a START entry) — only meaningful once a session's been
   *  stopped. */
  rejectedQty?: number
  reason: string | null
  remarks: string | null
  /** Only present on the STOP row that closed out a session — the id to look up that
   *  session's QR scans via GET /operation-qr-scan/current-session. */
  transactionLogId?: number
}

/** The endpoint's own response is a bare array of log entries — no activeHours/idleHours
 *  wrapper despite the name. This is the shape the rest of the app actually consumes, built by
 *  productionMonitoringApi from that bare array. */
export interface LogReportResponse {
  activeHours: string
  idleHours: string
  logs: LogReportEntry[]
}

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
