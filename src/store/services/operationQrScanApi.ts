import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  EmployeeScanHistory,
  OperationQrScanBulkRequest,
  ReworkQrScanBulkRequest,
} from "@/types/productionMonitoring"
import type { ReworkType } from "@/types/reworkSchedule"
import type {
  ProducedProductsResponse,
  QrCurrentSessionDetail,
  QrScheduleListResponse,
  QrScheduleTransactionsResponse,
} from "@/types/qrScanRecords"

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
      OperationQrScanBulkRequest & {
        /** Client-side only — not sent to the backend, just used to invalidate the scan count/session tags below. */
        employeeId: string; scheduleId: string; scheduleOperationId: number; currentTransactionLogId?: number
      }
    >({
      query: ({ transactionLogId, identifiers }) => ({
        url: "/operation-qr-scan/save-bulk",
        method: "POST",
        body: { transactionLogId, identifiers },
      }),
      invalidatesTags: (_result, _error, arg) => [
        scanCountTag(arg),
        ...(arg.currentTransactionLogId != null ? [sessionScanTag(arg.currentTransactionLogId)] : []),
      ],
    }),
    saveReworkQrScan: builder.mutation<
      ApiResponse<null>,
      ReworkQrScanBulkRequest & {
        /** Client-side only — not sent to the backend, just used to invalidate the scan count/session tags below. */
        employeeId: string; scheduleId: string; scheduleOperationId: number; currentTransactionLogId?: number
      }
    >({
      query: ({ reworkTransactionLogId, uniqueIdentifiers, addToProductSummary }) => ({
        url: "/rework-qr-scan",
        method: "POST",
        body: { reworkTransactionLogId, uniqueIdentifiers, addToProductSummary },
      }),
      invalidatesTags: (_result, _error, arg) => [
        scanCountTag(arg),
        ...(arg.currentTransactionLogId != null ? [sessionScanTag(arg.currentTransactionLogId)] : []),
      ],
    }),
    getEmployeeScanHistory: builder.query<
      EmployeeScanHistory,
      { employeeId: string; scheduleId: string; scheduleOperationId: number; operationName: string; reworkType: ReworkType | null }
    >({
      query: ({ employeeId, scheduleId, operationName }) => ({
        url: "/operation-qr-scan/employee-scan-history",
        params: { employeeId, scheduleId, operationName },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
    // Keyed by the current (possibly still-open) session's transactionLogId — every log entry
    // from START onward carries the same id, so this reflects the QR codes scanned specifically
    // during that one Start-to-Stop session, as opposed to the schedule/operation's running total
    // from getEmployeeScanHistory.
    getCurrentSessionScans: builder.query<
      QrCurrentSessionDetail,
      { transactionLogId: number; reworkType: ReworkType | null }
    >({
      query: ({ transactionLogId, reworkType }) => ({
        url: "/operation-qr-scan/current-session",
        params: { transactionLogId, reworkType: reworkType ?? undefined },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [sessionScanTag(arg.transactionLogId)],
    }),
    getQrScheduleList: builder.query<QrScheduleListResponse, void>({
      query: () => "/operation-qr-scan/schedule-list",
      transformResponse: unwrap,
    }),
    getQrScheduleTransactions: builder.query<QrScheduleTransactionsResponse, string>({
      query: (scheduleId) => `/operation-qr-scan/schedule/${scheduleId}/transactions`,
      transformResponse: unwrap,
    }),
    getQrCurrentSessionDetail: builder.query<QrCurrentSessionDetail, number>({
      query: (transactionLogId) => ({
        url: "/operation-qr-scan/current-session",
        params: { transactionLogId },
      }),
      transformResponse: unwrap,
    }),
    getProducedProducts: builder.query<ProducedProductsResponse, void>({
      query: () => "/operation-qr-scan/scanned-products",
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useSaveBulkOperationQrScanMutation,
  useSaveReworkQrScanMutation,
  useGetEmployeeScanHistoryQuery,
  useGetCurrentSessionScansQuery,
  useGetQrScheduleListQuery,
  useGetQrScheduleTransactionsQuery,
  useGetQrCurrentSessionDetailQuery,
  useGetProducedProductsQuery,
} = operationQrScanApi
