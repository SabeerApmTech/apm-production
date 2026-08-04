import { useGetCurrentSessionScansQuery, useGetEmployeeScanHistoryQuery } from "@/store/services/operationQrScanApi"
import { useGetReworkCurrentSessionScansQuery, useGetReworkEmployeeScanHistoryQuery } from "@/store/services/reworkQrScanApi"

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
  isRework: boolean
  skip?: boolean
}

/** Normalizes GET /operation-qr-scan/employee-scan-history (production) and its differently-shaped
 *  rework counterpart GET /rework-qr-scan/employee-scan-history into one shape — an operation's
 *  running scan total, as opposed to just the current session's from useCurrentSessionScans below. */
export function useScanHistory({ employeeId, scheduleId, scheduleOperationId, operationName, isRework, skip = false }: UseScanHistoryArgs) {
  const production = useGetEmployeeScanHistoryQuery(
    { employeeId, scheduleId, scheduleOperationId, operationName, reworkType: null },
    { skip: skip || isRework }
  )
  const rework = useGetReworkEmployeeScanHistoryQuery(
    { employeeId, scheduleId, operationName },
    { skip: skip || !isRework }
  )
  const entries: NormalizedScanEntry[] = isRework
    ? (rework.data ?? []).map((e) => ({
        identifierName: e.uniqueIdentifierName, identifier: e.uniqueIdentifier, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
      }))
    : (production.data?.identifiers ?? []).map((e) => ({
        identifierName: e.identifierName, identifier: e.identifierId, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
      }))
  // Undefined (rather than 0) while the relevant query hasn't returned yet, so callers can tell
  // "not loaded" apart from "confirmed zero".
  const scannedQty = isRework ? rework.data?.length : production.data?.scannedQty
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
  isRework: boolean
  skip?: boolean
}

/** Normalizes GET /operation-qr-scan/current-session (production) and its differently-shaped
 *  rework counterpart GET /rework-qr-scan/current-session/{id} into one shape — the QR codes
 *  scanned during one specific Start-to-Stop session. */
export function useCurrentSessionScans({ transactionLogId, isRework, skip = false }: UseCurrentSessionScansArgs) {
  const effectiveSkip = skip || transactionLogId == null
  const production = useGetCurrentSessionScansQuery(
    { transactionLogId: transactionLogId ?? 0, reworkType: null },
    { skip: effectiveSkip || isRework }
  )
  const rework = useGetReworkCurrentSessionScansQuery(
    transactionLogId ?? 0,
    { skip: effectiveSkip || !isRework }
  )
  const hasData = isRework ? rework.data != null : production.data != null
  const totalScannedQty = isRework ? rework.data?.totalCount ?? 0 : production.data?.totalScannedQty ?? 0
  const entries: NormalizedSessionScan[] = isRework
    ? (rework.data?.scannedQrCodes ?? []).map((e) => ({
        qrScanId: e.qrScanId, identifierName: e.uniqueIdentifierName, identifier: e.uniqueIdentifier, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
      }))
    : (production.data?.scannedData ?? []).map((e) => ({
        qrScanId: e.qrScanId, identifierName: e.identifierName, identifier: e.identifier, batchNumber: e.batchNumber, scannedAt: e.scannedAt,
      }))
  const isFetching = isRework ? rework.isFetching : production.isFetching
  return { totalScannedQty, entries, isFetching, hasData }
}
