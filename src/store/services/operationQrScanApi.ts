import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CurrentSessionScans,
  EmployeeScanHistory,
  OperationQrScanBulkRequest,
  QrScanListResponse,
} from "@/types/productionMonitoring"
import type { ReworkType } from "@/types/reworkSchedule"

function scanCountTag(params: { employeeId: string; scheduleId: string; scheduleOperationId: number }) {
  return { type: "OperationQrScanCount" as const, id: `${params.scheduleId}:${params.scheduleOperationId}:${params.employeeId}` }
}

function sessionScanTag(transactionLogId: number) {
  return { type: "OperationQrScanCount" as const, id: `session:${transactionLogId}` }
}

export const operationQrScanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveBulkOperationQrScan: builder.mutation<
      ApiResponse<null>,
      OperationQrScanBulkRequest & { /** Client-side only — not sent to the backend, just used to invalidate the current session's scan count. */ currentTransactionLogId?: number }
    >({
      query: ({ employeeId, scheduleId, scheduleOperationId, identifierName, reworkType, identifiers }) => ({
        url: "/operation-qr-scan/save-bulk",
        method: "POST",
        body: { employeeId, scheduleId, scheduleOperationId, identifierName, reworkType, identifiers },
      }),
      invalidatesTags: (_result, _error, arg) => [
        scanCountTag(arg),
        ...(arg.currentTransactionLogId != null ? [sessionScanTag(arg.currentTransactionLogId)] : []),
      ],
    }),
    getEmployeeScanHistory: builder.query<
      EmployeeScanHistory,
      { employeeId: string; scheduleId: string; scheduleOperationId: number; reworkType: ReworkType | null }
    >({
      query: ({ reworkType, ...rest }) => ({
        url: "/operation-qr-scan/employee-scan-history",
        params: { ...rest, reworkType: reworkType ?? undefined },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
    // Keyed by the current (possibly still-open) session's transactionLogId — every log entry
    // from START onward carries the same id, so this reflects the QR codes scanned specifically
    // during that one Start-to-Stop session, as opposed to the schedule/operation's running total
    // from getEmployeeScanHistory.
    getCurrentSessionScans: builder.query<
      CurrentSessionScans,
      { transactionLogId: number; reworkType: ReworkType | null }
    >({
      query: ({ transactionLogId, reworkType }) => ({
        url: "/operation-qr-scan/current-session",
        params: { transactionLogId, reworkType: reworkType ?? undefined },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [sessionScanTag(arg.transactionLogId)],
    }),
    getOperationQrScanList: builder.query<
      QrScanListResponse,
      { productName?: string; identifierName?: string; employeeId?: string; fromDate: string; toDate: string }
    >({
      query: ({ productName, identifierName, employeeId, fromDate, toDate }) => ({
        url: "/operation-qr-scan/list",
        params: {
          ProductName: productName,
          IdentifierName: identifierName,
          EmployeeId: employeeId,
          FromDate: fromDate,
          ToDate: toDate,
        },
      }),
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useSaveBulkOperationQrScanMutation,
  useGetEmployeeScanHistoryQuery,
  useGetCurrentSessionScansQuery,
  useGetOperationQrScanListQuery,
} = operationQrScanApi
