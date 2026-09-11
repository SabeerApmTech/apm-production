import { useGetCurrentSessionScansQuery, useGetEmployeeScanHistoryQuery } from "@/store/services/operationQrScanApi"

export interface NormalizedScanEntry {
  identifierName: string
  identifier: string
  batchNumber: number
  scannedAt: string
}

interface UseScanHistoryArgs {
  employeeId: string
  scheduleId: string
  scheduleOperationId: number
  operationName: string
  skip?: boolean
}

/** Normalizes GET /operation-qr-scan/employee-scan-history — an operation's running scan total,
 *  as opposed to just the current session's from useCurrentSessionScans below. */
export function useScanHistory({ employeeId, scheduleId, scheduleOperationId, operationName, skip = false }: UseScanHistoryArgs) {
  const { data } = useGetEmployeeScanHistoryQuery(
    { employeeId, scheduleId, scheduleOperationId, operationName },
    { skip }
  )
  const entries: NormalizedScanEntry[] = (data?.identifiers ?? []).map((e) => ({
    identifierName: e.uniqueIdentifierName, identifier: e.uniqueIdentifier, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
  }))
  // Undefined (rather than 0) while the query hasn't returned yet, so callers can tell
  // "not loaded" apart from "confirmed zero".
  const scannedQty = data?.scannedQty
  return { scannedQty, entries }
}

export interface NormalizedSessionScan {
  qrScanId: number
  identifierName: string
  identifier: string
  batchNumber: number
  scannedAt: string
}

interface UseCurrentSessionScansArgs {
  transactionLogId: number | null
  skip?: boolean
}

/** Normalizes GET /operation-qr-scan/current-session — the QR codes scanned during one specific
 *  Start-to-Stop session. */
export function useCurrentSessionScans({ transactionLogId, skip = false }: UseCurrentSessionScansArgs) {
  const effectiveSkip = skip || transactionLogId == null
  const { data, isFetching } = useGetCurrentSessionScansQuery(
    { transactionLogId: transactionLogId ?? 0 },
    { skip: effectiveSkip }
  )
  const hasData = data != null
  const totalScannedQty = data?.totalScanned ?? 0
  const entries: NormalizedSessionScan[] = (data?.identifiers ?? []).map((e) => ({
    qrScanId: e.qrScanId, identifierName: e.uniqueIdentifierName, identifier: e.uniqueIdentifier, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
  }))
  return { totalScannedQty, entries, isFetching, hasData }
}
